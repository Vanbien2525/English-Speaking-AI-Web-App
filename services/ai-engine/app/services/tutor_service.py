"""
Llama 3.1 8B Tutor & 3D Viseme Controller Service (Phase 3).
Communicates with Ollama (or internal model) to generate pedagogical Vietnamese feedback
and 3D articulatory viseme timeline commands for the Next.js Three.js canvas.
"""
import json
import logging
from typing import Optional
import httpx

from app.config import settings
from app.domain.schemas import TutorFeedback, VisemeCommand, WordResult
from app.domain.viseme_constants import get_viseme_preset
from app.services.net_utils import is_service_reachable

logger = logging.getLogger(__name__)


class LlamaTutorService:
    def __init__(self):
        self.ollama_url = settings.ollama_url
        self.model_name = settings.ollama_model
        self.timeout_s = settings.ollama_timeout_s

    async def generate_feedback_and_visemes(
        self,
        recognized_text: str,
        words: list[WordResult],
        overall_score_bp: int,
    ) -> TutorFeedback:
        """
        Request pedagogical feedback from Llama 3.1 8B via Ollama.
        Falls back to rule-based pedagogy if Ollama is offline or uninitialized.
        """
        # Find phoneme errors
        errors = []
        for w in words:
            for p in w.phonemes:
                if p.errorType != "correct":
                    errors.append({
                        "word": w.word,
                        "expected": p.expectedIpa,
                        "actual": p.actualIpa,
                        "errorType": p.errorType,
                        "severity": p.severity,
                    })

        # Try Ollama endpoint only if service port is reachable and not in automated tests
        import os
        if not os.getenv("PYTEST_CURRENT_TEST") and is_service_reachable(self.ollama_url, timeout=0.05):
            ollama_feedback = await self._call_ollama(recognized_text, errors, overall_score_bp, words)
            if ollama_feedback:
                return ollama_feedback

        # Deterministic pedagogical fallback
        return self._build_deterministic_feedback(recognized_text, words, errors)

    async def _call_ollama(
        self,
        recognized_text: str,
        errors: list[dict],
        overall_score_bp: int,
        words: list[WordResult],
    ) -> Optional[TutorFeedback]:
        """Send prompt to local Ollama API with strict timeout shield."""
        import asyncio
        try:
            prompt = (
                "Bạn là Gia Sư Phát Âm AI chuyên sâu về ngữ âm tiếng Anh chuẩn British RP.\n"
                f"Từ/câu mục tiêu: \"{recognized_text}\"\n"
                f"Điểm số tổng thể: {overall_score_bp / 100:.1f}%\n"
                f"Danh sách lỗi âm vị phát hiện: {json.dumps(errors, ensure_ascii=False)}\n\n"
                "Hãy phân tích lỗi và trả về DUY NHẤT một đối tượng JSON hợp lệ gồm 2 trường:\n"
                "- summaryVi: (chuỗi nhận xét ngắn gọn, chỉ thẳng vào âm vị đọc sai nếu có, hoặc khen ngợi nếu tròn vành rõ chữ)\n"
                "- tipsVi: (mảng 1 đến 3 chuỗi chỉ dẫn khẩu hình giải phẫu: vị trí môi, đầu lưỡi, độ mở miệng để người học sửa lỗi ngay)\n"
            )

            async def _req():
                timeout = httpx.Timeout(self.timeout_s, connect=1.0)
                async with httpx.AsyncClient(timeout=timeout) as client:
                    return await client.post(
                        f"{self.ollama_url}/api/generate",
                        json={
                            "model": self.model_name,
                            "prompt": prompt,
                            "stream": False,
                            "format": "json",
                            "options": {
                                "temperature": 0.2,
                                "num_ctx": 1024,
                                "num_predict": 120,
                            },
                        },
                    )

            res = await asyncio.wait_for(_req(), timeout=self.timeout_s + 0.5)
            if res.status_code == 200:
                data = res.json()
                response_text = data.get("response", "{}")
                parsed = json.loads(response_text)
                summary_vi = parsed.get("summaryVi")
                tips_vi = parsed.get("tipsVi", [])

                if summary_vi and isinstance(tips_vi, list) and len(tips_vi) > 0:
                    visemes = self._generate_viseme_timeline(words)
                    return TutorFeedback(
                        summaryVi=summary_vi,
                        tipsVi=tips_vi[:5],
                        visemeTimeline=visemes,
                    )
        except Exception as e:
            logger.debug(f"Ollama call skipped or unavailable ({e}). Using expert rule-based pedagogy.")

        return None

    def _generate_viseme_timeline(self, words: list[WordResult]) -> list[VisemeCommand]:
        """Convert word and phoneme sequence into 3D Viseme timeline commands."""
        commands: list[VisemeCommand] = []
        for w in words:
            for p in w.phonemes:
                ipa = p.expectedIpa or "ə"
                preset = get_viseme_preset(ipa)
                start_ms = p.startMs or 0
                end_ms = p.endMs or (start_ms + 100)
                duration = max(50, end_ms - start_ms)

                trans_ms = min(40, duration // 3)
                hold_ms = max(30, duration - trans_ms)

                commands.append(
                    VisemeCommand(
                        ipa=ipa,
                        startMs=start_ms,
                        transitionMs=trans_ms,
                        holdMs=hold_ms,
                        morphWeights=preset["morphWeights"],
                        highlightParts=preset["highlightParts"],
                    )
                )
        return commands

    def _build_deterministic_feedback(
        self,
        recognized_text: str,
        words: list[WordResult],
        errors: list[dict],
    ) -> TutorFeedback:
        """Academic Vietnamese pronunciation pedagogy for English learners."""
        visemes = self._generate_viseme_timeline(words)

        deletions = [err for err in errors if err.get("errorType") == "deletion"]
        if len(deletions) >= 3 or (len(words) == 1 and len(deletions) == len(words[0].phonemes)):
            return TutorFeedback(
                summaryVi=f"Cảnh báo: Bạn chưa phát âm hoặc âm lượng mic quá nhỏ để nhận diện từ: '{recognized_text}'.",
                tipsVi=[
                    f"Hãy đọc to rõ ràng từ mục tiêu theo mẫu: '{recognized_text}'.",
                    "Đưa micro gần miệng hơn và kiểm tra quyền truy cập microphone của trình duyệt.",
                ],
                visemeTimeline=visemes,
            )

        if not errors:
            return TutorFeedback(
                summaryVi=f"Phát âm từ \"{recognized_text}\" rất chuẩn xác, khẩu hình đẹp và tròn vành rõ chữ.",
                tipsVi=[
                    "Duy trì khẩu hình ổn định và bật dứt khoát các phụ âm cuối.",
                    "Luyện tập ghép từ này vào câu giao tiếp hoàn chỉnh để rèn luyện phản xạ.",
                ],
                visemeTimeline=visemes,
            )

        tips: list[str] = []
        error_descriptions: list[str] = []

        for err in errors[:3]:
            exp = err["expected"]
            act = err["actual"]

            # Specific Articulatory Rules for Common Mispronunciations
            if exp == "ʊ" and act == "uː":
                error_descriptions.append("nguyên âm ngắn /ʊ/ bị kéo dài thành /uː/")
                tips.append("Âm /ʊ/ là nguyên âm ngắn thả lỏng môi (~100-150ms). Tuyệt đối không chu tròn môi quá mức và không ngân dài giọng thành /uː/.")
            elif exp == "uː" and act == "ʊ":
                error_descriptions.append("nguyên âm dài /uː/ bị phát âm cộc lốc")
                tips.append("Chu tròn môi về phía trước và giữ hơi căng trong khoang miệng để tạo nguyên âm dài /uː/ trọn vẹn.")
            elif exp == "θ" and act == "s":
                error_descriptions.append("âm kẹp răng /θ/ bị thay thế bằng âm xát rít /s/")
                tips.append("Đặt nhẹ đầu lưỡi ở giữa hai hàm răng cửa, thổi luồng hơi nhẹ qua kẽ răng mà không rung dây thanh và không rít răng.")
            elif exp == "θ" and act == "t":
                error_descriptions.append("âm kẹp răng /θ/ bị thay thế bằng âm tắc /t/")
                tips.append("Không được chạm đầu lưỡi vào nướu răng trên tạo âm /t/. Phải đưa đầu lưỡi ra giữa 2 kẽ răng để tạo âm xát êm ái.")
            elif exp == "θ":
                error_descriptions.append("âm răng-môi /θ/ bị thay thế hoặc phát âm chưa rõ")
                tips.append("Đặt nhẹ đầu lưỡi ở giữa hai hàm răng cửa, thổi luồng hơi nhẹ qua kẽ răng mà không rung dây thanh.")
            elif exp == "ð":
                error_descriptions.append("âm /ð/ chưa đủ độ rung dây thanh quản")
                tips.append("Đặt đầu lưỡi giữa hai hàm răng tương tự âm /θ/ nhưng đồng thời rung nhẹ dây thanh quản để tạo âm /ð/.")
            elif exp == "k":
                error_descriptions.append("âm bật /k/ ở đuôi từ bị nuốt hoặc thay thế")
                tips.append("Nâng cuống lưỡi chạm nhẹ vào ngạc mềm rồi bật dứt khoát luồng hơi để tạo âm đuôi /k/ rõ ràng.")
            elif exp == "d":
                error_descriptions.append("âm đuôi /d/ chưa được bật rõ")
                tips.append("Chạm đầu lưỡi vào gờ nướu răng trên và bật nhẹ luồng hơi kèm rung thanh quản để phát rõ âm đuôi /d/.")
            elif exp in ["ʃ", "tʃ"]:
                error_descriptions.append(f"âm /{exp}/ khẩu hình chưa đủ tròn môi")
                tips.append(f"Chu tròn môi về phía trước, nâng thân lưỡi hướng về ngạc cứng khi phát âm /{exp}/.")
            elif exp == "ɪ" and act == "iː":
                error_descriptions.append("nguyên âm ngắn /ɪ/ bị kéo dài căng mép thành /iː/")
                tips.append("Thả lỏng cơ hàm và khóe miệng tự nhiên cho âm /ɪ/, không căng cơ cười sang hai bên như âm /iː/.")
            else:
                error_descriptions.append(f"âm /{exp}/ bị lệch sang /{act or 'bỏ sót'}/")
                tips.append(f"Luyện tập riêng âm /{exp}/: quan sát mô hình khoang miệng 3D và chú ý vị trí đặt lưỡi.")

        # Deduplicate tips
        seen_tips = []
        for t in tips:
            if t not in seen_tips:
                seen_tips.append(t)

        summary = f"Chưa đạt chuẩn: {', '.join(error_descriptions[:2])}. Cần điều chỉnh khẩu hình."
        return TutorFeedback(
            summaryVi=summary,
            tipsVi=seen_tips[:5],
            visemeTimeline=visemes,
        )


tutor_service = LlamaTutorService()
