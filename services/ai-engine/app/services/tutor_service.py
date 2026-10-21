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

        # Try Ollama endpoint only if service port is reachable
        if is_service_reachable(self.ollama_url, timeout=0.05):
            ollama_feedback = await self._call_ollama(recognized_text, errors, overall_score_bp)
            if ollama_feedback:
                return ollama_feedback

        # Deterministic pedagogical fallback
        return self._build_deterministic_feedback(recognized_text, words, errors)

    async def _call_ollama(
        self,
        recognized_text: str,
        errors: list[dict],
        overall_score_bp: int,
    ) -> Optional[TutorFeedback]:
        """Send prompt to local Ollama API with strict timeout shield."""
        import asyncio
        try:
            prompt = (
                f"Câu người học phát âm: \"{recognized_text}\"\n"
                f"Điểm số tổng thể: {overall_score_bp / 100:.1f}%\n"
                f"Danh sách lỗi âm vị phát hiện: {json.dumps(errors, ensure_ascii=False)}\n\n"
                "Hãy phân tích lỗi và trả về DUY NHẤT một đối tượng JSON hợp lệ gồm 2 trường:\n"
                "- summaryVi: (chuỗi nhận xét ngắn gọn tổng thể bằng tiếng Việt)\n"
                "- tipsVi: (mảng tối đa 3 chuỗi hướng dẫn cụ thể cách đặt vị trí môi, răng, lưỡi để sửa lỗi)\n"
            )

            async def _req():
                timeout = httpx.Timeout(self.timeout_s, connect=0.5)
                async with httpx.AsyncClient(timeout=timeout) as client:
                    return await client.post(
                        f"{self.ollama_url}/api/generate",
                        json={
                            "model": self.model_name,
                            "prompt": prompt,
                            "stream": False,
                            "format": "json",
                            "options": {"temperature": 0.3, "num_ctx": 2048},
                        },
                    )

            res = await asyncio.wait_for(_req(), timeout=self.timeout_s + 0.5)
            if res.status_code == 200:
                data = res.json()
                response_text = data.get("response", "{}")
                parsed = json.loads(response_text)
                summary_vi = parsed.get("summaryVi", "Phát âm tương đối tốt.")
                tips_vi = parsed.get("tipsVi", [])[:5]
                visemes = self._generate_viseme_timeline(words)
                return TutorFeedback(
                    summaryVi=summary_vi,
                    tipsVi=tips_vi,
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
        """Rule-based Vietnamese pronunciation pedagogy for English learners."""
        visemes = self._generate_viseme_timeline(words)

        if not errors:
            return TutorFeedback(
                summaryVi=f"Phát âm câu \"{recognized_text}\" rất chuẩn xác, ngữ điệu tự nhiên và tròn vành rõ chữ.",
                tipsVi=[
                    "Duy trì khẩu hình ổn định và mở rộng khoang miệng tự nhiên khi nói câu dài.",
                    "Chú ý nối âm nhẹ giữa các phụ âm cuối và nguyên âm tiếp theo.",
                ],
                visemeTimeline=visemes,
            )

        tips: list[str] = []
        error_descriptions: list[str] = []

        for err in errors[:3]:
            exp = err["expected"]
            act = err["actual"]

            if exp == "θ":
                error_descriptions.append("âm răng-môi /θ/ bị thay thế hoặc phát âm chưa rõ")
                tips.append("Đặt nhẹ đầu lưỡi ở giữa hai hàm răng cửa, thổi luồng hơi nhẹ qua kẽ răng mà không rung dây thanh.")
            elif exp == "ð":
                error_descriptions.append("âm /ð/ chưa đủ độ rung dây thanh")
                tips.append("Đặt đầu lưỡi giữa hai hàm răng tương tự âm /θ/ nhưng đồng thời rung nhẹ dây thanh quản.")
            elif exp == "k":
                error_descriptions.append("âm bật /k/ ở đuôi từ bị nuốt hoặc thay thế")
                tips.append("Nâng cuống lưỡi chạm nhẹ vào ngạc mềm rồi bật dứt khoát luồng hơi để tạo âm đuôi /k/ rõ ràng.")
            elif exp in ["ʃ", "tʃ"]:
                error_descriptions.append(f"âm /{exp}/ khẩu hình chưa đủ tròn môi")
                tips.append(f"Chu tròn môi về phía trước, nâng thân lưỡi hướng về ngạc cứng khi phát âm /{exp}/.")
            else:
                error_descriptions.append(f"âm /{exp}/ bị lệch sang /{act}/")
                tips.append(f"Luyện tập tách riêng âm /{exp}/, chú ý cảm nhận luồng hơi và vị trí lưỡi theo mô hình 3D.")

        # Deduplicate tips
        seen_tips = []
        for t in tips:
            if t not in seen_tips:
                seen_tips.append(t)

        summary = f"Phát âm tương đối tốt, tuy nhiên {', '.join(error_descriptions[:2])}."
        return TutorFeedback(
            summaryVi=summary,
            tipsVi=seen_tips[:5],
            visemeTimeline=visemes,
        )


tutor_service = LlamaTutorService()
