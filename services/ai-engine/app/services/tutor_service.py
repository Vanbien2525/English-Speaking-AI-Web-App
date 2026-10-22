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


# Comprehensive Anatomy & Articulation Knowledge Base for all 44 IPA Phonemes
ARTICULATORY_GUIDES: dict[str, dict[str, str]] = {
    # 24 Consonants
    "p": {
        "lips": "Mím chặt hai môi lại nén luồng khí trong miệng",
        "tongue": "Đầu lưỡi thả lỏng tự nhiên ở đáy miệng",
        "breath": "Bật mở nhanh hai môi giải phóng luồng hơi nổ sắc nét, không rung thanh quản",
    },
    "b": {
        "lips": "Mím chặt hai môi lại tương tự âm /p/",
        "tongue": "Đầu lưỡi thả lỏng tự nhiên",
        "breath": "Bật mở môi đồng thời làm rung mạnh dây thanh quản ở cổ họng",
    },
    "t": {
        "lips": "Môi và khóe miệng mở tự nhiên",
        "tongue": "Áp chặt đầu lưỡi vào phần gờ nướu ngay phía sau hàm răng trên",
        "breath": "Bật mạnh đầu lưỡi xuống giải phóng luồng hơi nổ dứt khoát, không rung cổ họng",
    },
    "d": {
        "lips": "Môi mở tự nhiên",
        "tongue": "Áp đầu lưỡi vào gờ nướu răng trên tương tự âm /t/",
        "breath": "Bật đầu lưỡi xuống kết hợp làm rung mạnh dây thanh quản tạo âm trầm",
    },
    "k": {
        "lips": "Miệng mở tự nhiên theo nguyên âm đi kèm",
        "tongue": "Nâng phần cuống lưỡi ép chặt vào ngạc mềm ở vòm họng trên để chặn luồng khí",
        "breath": "Hạ nhanh cuống lưỡi xuống để luồng hơi nén bật mạnh ra ngoài ('kh'), không rung cổ họng",
    },
    "g": {
        "lips": "Miệng mở tự nhiên",
        "tongue": "Nâng cuống lưỡi ép chặt ngạc mềm như âm /k/",
        "breath": "Hạ cuống lưỡi đồng thời làm rung mạnh dây thanh quản ở cổ họng",
    },
    "f": {
        "lips": "Chạm nhẹ mép răng cửa trên vào phần trong của môi dưới",
        "tongue": "Thân lưỡi thả lỏng trong khoang miệng",
        "breath": "Đẩy luồng hơi liên tục qua khe hẹp giữa răng và môi, không rung thanh quản",
    },
    "v": {
        "lips": "Răng cửa trên chạm nhẹ môi dưới tương tự âm /f/",
        "tongue": "Thân lưỡi thả lỏng",
        "breath": "Đẩy luồng hơi qua khe răng môi đồng thời làm rung mạnh dây thanh quản",
    },
    "θ": {
        "lips": "Khóe miệng mở nhẹ, cơ mặt thả lỏng",
        "tongue": "Đưa nhẹ đầu lưỡi ra giữa hai hàm răng cửa (kẹp nhẹ, tuyệt đối không cắn chặt)",
        "breath": "Thổi luồng hơi êm qua khe giữa răng và lưỡi, không rít răng, không rung thanh quản",
    },
    "ð": {
        "lips": "Khóe miệng mở nhẹ",
        "tongue": "Đặt đầu lưỡi giữa hai hàm răng tương tự âm /θ/",
        "breath": "Thổi luồng hơi qua khe răng đồng thời làm rung mạnh dây thanh quản ở cổ họng",
    },
    "s": {
        "lips": "Khóe miệng hơi kéo nhẹ sang hai bên, hai hàm răng khép gần sát nhau",
        "tongue": "Đầu lưỡi nâng cao sát gần gờ nướu trên (chừa một rãnh hẹp, không chạm răng)",
        "breath": "Đẩy luồng hơi mạnh qua rãnh lưỡi tạo tiếng xì gió sắc nét, không rung thanh quản",
    },
    "z": {
        "lips": "Khẩu hình tương tự âm /s/",
        "tongue": "Đầu lưỡi đặt sát gờ nướu răng trên",
        "breath": "Đẩy luồng hơi qua rãnh lưỡi đồng thời làm rung mạnh dây thanh quản ('zzz')",
    },
    "ʃ": {
        "lips": "Chu tròn môi hướng về phía trước, hai khóe miệng ép nhẹ vào trong",
        "tongue": "Nâng thân lưỡi lên sát vòm ngạc cứng tạo một khe hẹp",
        "breath": "Đẩy luồng hơi mạnh qua khe lưỡi tạo tiếng xát 'suỵt/shhh', không rung cổ họng",
    },
    "ʒ": {
        "lips": "Chu tròn môi hướng về phía trước tương tự âm /ʃ/",
        "tongue": "Thân lưỡi nâng cao sát vòm ngạc cứng",
        "breath": "Đẩy luồng hơi qua khe lưỡi đồng thời làm rung mạnh dây thanh quản",
    },
    "tʃ": {
        "lips": "Chu tròn môi nhẹ hướng về phía trước",
        "tongue": "Áp đầu lưỡi chặn gờ nướu trên rồi hạ nhanh lùi về sau chuyển sang âm /ʃ/",
        "breath": "Bật luồng hơi nén ra ngoài dứt khoát tạo tiếng bật xát 'ch', không rung thanh quản",
    },
    "dʒ": {
        "lips": "Chu tròn môi nhẹ",
        "tongue": "Áp đầu lưỡi chặn gờ nướu rồi lùi về sau tương tự âm /tʃ/",
        "breath": "Bật luồng hơi dứt khoát kết hợp làm rung mạnh dây thanh quản (như trong joy)",
    },
    "h": {
        "lips": "Mở tự nhiên theo khẩu hình nguyên âm kế tiếp",
        "tongue": "Lưỡi thả lỏng tự nhiên ở đáy miệng",
        "breath": "Thở nhẹ một luồng hơi ấm từ sâu trong thanh môn cổ họng ra ngoài, không rung thanh quản",
    },
    "m": {
        "lips": "Ngậm kín hai môi hoàn toàn",
        "tongue": "Lưỡi thả lỏng trong khoang miệng",
        "breath": "Hạ ngạc mềm để đẩy toàn bộ luồng khí rung qua khoang mũi tạo âm 'mmm' hữu thanh",
    },
    "n": {
        "lips": "Miệng mở tự nhiên",
        "tongue": "Áp chặt đầu lưỡi vào phần gờ nướu răng trên chặn kín luồng khí qua miệng",
        "breath": "Đẩy toàn bộ luồng khí rung qua khoang mũi tạo âm 'nnn' hữu thanh",
    },
    "ŋ": {
        "lips": "Miệng mở tự nhiên",
        "tongue": "Nâng cuống lưỡi ép chặt vào ngạc mềm ở vòm họng trên",
        "breath": "Đẩy luồng khí rung qua khoang mũi tạo âm 'ng' hữu thanh (như trong sing)",
    },
    "l": {
        "lips": "Khóe miệng thả lỏng tự nhiên",
        "tongue": "Áp đầu lưỡi tựa chắc chắn vào gờ nướu răng trên",
        "breath": "Giữ nguyên đầu lưỡi, đẩy luồng hơi rung thoát tự do ra hai bên mép lưỡi",
    },
    "r": {
        "lips": "Hơi chu tròn môi nhẹ",
        "tongue": "Kéo đầu lưỡi hơi cong nhẹ về phía sau khoang miệng (tuyệt đối không chạm vòm họng)",
        "breath": "Đẩy luồng hơi rung thoát qua thân lưỡi tạo âm uốn lưỡi tự nhiên",
    },
    "w": {
        "lips": "Chu môi tròn nhỏ hướng về phía trước như đang huýt sáo",
        "tongue": "Cuống lưỡi nâng cao về phía ngạc mềm",
        "breath": "Mở nhanh môi kết hợp đẩy luồng hơi rung thoát ra ngoài",
    },
    "j": {
        "lips": "Khóe miệng hơi kéo nhẹ sang hai bên",
        "tongue": "Thân lưỡi nâng cao sát ngạc cứng như đang chuẩn bị phát âm /iː/",
        "breath": "Hạ nhanh thân lưỡi lướt sang nguyên âm tiếp theo, rung dây thanh quản",
    },
    # 12 Monophthongs
    "iː": {
        "lips": "Kéo căng hai khóe miệng sang hai bên như đang cười mỉm",
        "tongue": "Thân lưỡi nâng cao tối đa về phía vòm ngạc cứng",
        "breath": "Ngân dài luồng hơi đều đặn khoảng 0.35s, căng cơ miệng",
    },
    "ɪ": {
        "lips": "Môi mở nhẹ tự nhiên, cơ mặt và khóe miệng thả lỏng hoàn toàn",
        "tongue": "Thân lưỡi nâng lên nhưng thấp hơn vị trí của âm /iː/",
        "breath": "Phát âm ngắn, dứt khoát (~100ms), âm thanh hơi trầm hơn /iː/",
    },
    "e": {
        "lips": "Mép môi mở rộng hơn âm /ɪ/, cơ mặt thư giãn",
        "tongue": "Thân lưỡi nằm ở vị trí trung bình giữa vòm miệng",
        "breath": "Phát âm dứt khoát, luồng hơi thoát ra tự nhiên",
    },
    "æ": {
        "lips": "Hạ hàm dưới xuống thấp, mở rộng khoang miệng",
        "tongue": "Đầu lưỡi chạm chân răng cửa dưới, thân lưỡi hạ thấp",
        "breath": "Phát âm âm 'e bẹt' to, vang và dứt khoát",
    },
    "ɑː": {
        "lips": "Mở rộng và tròn khoang miệng sâu",
        "tongue": "Cuống lưỡi hạ thấp tối đa về phía đáy họng",
        "breath": "Ngân dài âm trầm sâu từ cuống họng (~0.35s)",
    },
    "ʌ": {
        "lips": "Môi mở vừa phải ở trạng thái tự nhiên, không chu môi",
        "tongue": "Phần giữa lưỡi hơi nâng nhẹ",
        "breath": "Bật âm ngắn gọn, dứt khoát từ cổ họng",
    },
    "ɒ": {
        "lips": "Hơi tròn môi nhẹ, hạ hàm dưới xuống",
        "tongue": "Cuống lưỡi hạ thấp ở phía sau khoang miệng",
        "breath": "Phát âm ngắn, dứt khoát",
    },
    "ɔː": {
        "lips": "Chu tròn môi rõ rệt hướng về phía trước",
        "tongue": "Cuống lưỡi nâng nhẹ ở phía sau",
        "breath": "Ngân dài luồng hơi tròn trịa (~0.35s)",
    },
    "ʊ": {
        "lips": "Môi hơi tròn nhẹ, khóe miệng thả lỏng (không chu chặt)",
        "tongue": "Cuống lưỡi hơi nâng nhẹ ở phía sau khoang miệng",
        "breath": "Phát âm ngắn gọn, dứt khoát (~100ms)",
    },
    "uː": {
        "lips": "Chu tròn môi tối đa hướng về phía trước như đang huýt sáo",
        "tongue": "Cuống lưỡi nâng cao về phía ngạc mềm",
        "breath": "Ngân dài luồng hơi đều đặn (~0.35s), căng cơ môi",
    },
    "ɜː": {
        "lips": "Môi mở tự nhiên ở trạng thái trung tính",
        "tongue": "Thân lưỡi ở vị trí trung tâm khoang miệng, đầu lưỡi hơi cong nhẹ",
        "breath": "Ngân dài luồng hơi đều đặn từ sâu trong vòm họng",
    },
    "ə": {
        "lips": "Thả lỏng hoàn toàn cơ môi và khóe miệng",
        "tongue": "Lưỡi nằm nghỉ tự nhiên ở đáy miệng",
        "breath": "Phát âm cực ngắn và nhẹ nhàng, lướt qua",
    },
    # 8 Diphthongs
    "eɪ": {
        "lips": "Bắt đầu từ khẩu hình /e/ mở tự nhiên rồi lướt sang /ɪ/ kéo căng khóe miệng",
        "tongue": "Lưỡi nâng dần từ vị trí giữa lên cao",
        "breath": "Phát âm liền mạch: âm đầu ngân 70% thời gian, âm sau lướt nhanh 30%",
    },
    "aɪ": {
        "lips": "Bắt đầu từ miệng mở rộng ở âm /a/ rồi thu hẹp mỉm cười sang /ɪ/",
        "tongue": "Lưỡi nâng từ đáy miệng lên sát ngạc cứng",
        "breath": "Phát âm trượt mượt mà từ âm trầm /a/ sang âm bổng /ɪ/",
    },
    "ɔɪ": {
        "lips": "Bắt đầu từ môi chu tròn ở âm /ɔː/ rồi mở bè môi sang /ɪ/",
        "tongue": "Lưỡi trượt từ vị trí sau lên trước",
        "breath": "Phát âm liền mạch luồng hơi chuyển từ tròn môi sang phẳng môi",
    },
    "əʊ": {
        "lips": "Bắt đầu từ môi thả lỏng ở âm Schwa /ə/ rồi thu tròn môi lại hướng về /ʊ/",
        "tongue": "Cuống lưỡi nâng dần lên về phía sau",
        "breath": "Lướt hơi mềm mại từ âm trung tính sang âm tròn môi",
    },
    "aʊ": {
        "lips": "Bắt đầu từ miệng mở rộng ở âm /a/ rồi nhanh chóng chu tròn môi về /ʊ/",
        "tongue": "Lưỡi từ đáy miệng nâng cuống lên cao",
        "breath": "Phát âm liền mạch với luồng hơi mạnh mẽ",
    },
    "ɪə": {
        "lips": "Bắt đầu từ khóe miệng thả lỏng ở /ɪ/ rồi mở nhẹ sang /ə/",
        "tongue": "Thân lưỡi hạ dần từ cao xuống trung tâm",
        "breath": "Lướt hơi êm dịu từ âm /ɪ/ ngắn sang âm Schwa nhẹ",
    },
    "eə": {
        "lips": "Bắt đầu từ mép môi mở ở /e/ rồi thả lỏng về /ə/",
        "tongue": "Lưỡi giữ ở vị trí giữa khoang miệng",
        "breath": "Phát âm liền mạch, luồng hơi thoát ra tự nhiên",
    },
    "ʊə": {
        "lips": "Bắt đầu từ môi hơi tròn ở /ʊ/ rồi thả lỏng mở nhẹ sang /ə/",
        "tongue": "Cuống lưỡi hạ dần từ cao xuống thấp",
        "breath": "Lướt luồng hơi từ âm tròn môi sang âm Schwa thả lỏng",
    },
}

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
                "Hãy phân tích chi tiết giải phẫu khẩu hình cho người học Việt Nam và trả về DUY NHẤT một đối tượng JSON hợp lệ gồm 2 trường:\n"
                "- summaryVi: (chuỗi nhận xét cụ thể: nêu rõ âm vị nào bị phát âm sai hoặc nuốt âm, bị lệch sang âm gì)\n"
                "- tipsVi: (mảng 3 chỉ dẫn giải phẫu cụ thể, TUYỆT ĐỐI KHÔNG dùng từ sáo rỗng 'quan sát vị trí':\n"
                "  1. 'Khẩu hình Môi & Hàm: ...' (mô tả rõ độ mở môi, chu tròn, kéo căng hay thả lỏng)\n"
                "  2. 'Vị trí Lưỡi: ...' (mô tả đầu lưỡi chạm nướu trên, kẹp giữa hai răng hay nâng cuống lưỡi)\n"
                "  3. 'Cách lấy Hơi & Dây thanh: ...' (mô tả bật luồng hơi nổ, xát qua kẽ răng hay rung thanh quản))\n"
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
                                "temperature": 0.0,
                                "num_ctx": 1024,
                                "num_predict": 250,
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
                summaryVi=f"Cảnh báo âm thanh: Chưa nhận diện được giọng nói hoặc âm lượng mic quá nhỏ cho từ \"{recognized_text}\".",
                tipsVi=[
                    f"Bước 1: Giữ micro cách miệng 5–10cm, kiểm tra biểu tượng sóng âm khi thu âm.",
                    f"Bước 2: Phát âm to, rõ ràng từng âm tiết của từ: \"{recognized_text}\".",
                    "Bước 3: Tránh thì thầm hoặc bấm dừng thu âm quá vội.",
                ],
                visemeTimeline=visemes,
            )

        # Out-of-vocabulary / prompt deviation alert
        if len(errors) == len(words[0].phonemes) and all(err.get("actual") in ["ə", "m"] for err in errors):
            return TutorFeedback(
                summaryVi=f"Phát âm chưa đúng từ mục tiêu: Bạn có thể đã phát âm nhầm từ khác thay vì \"{recognized_text}\".",
                tipsVi=[
                    f"Bước 1: Nghe lại giọng đọc mẫu British RP của từ \"{recognized_text}\".",
                    "Bước 2: Quan sát kỹ mặt chữ và các âm vị được đánh dấu màu.",
                    "Bước 3: Nhấn Mic và phát âm lại chậm rãi, chính xác.",
                ],
                visemeTimeline=visemes,
            )

        if not errors:
            return TutorFeedback(
                summaryVi=f"Xuất sắc! Bạn phát âm từ \"{recognized_text}\" rất chuẩn xác, khẩu hình tròn vành và dứt khoát.",
                tipsVi=[
                    "Duy trì ổn định độ mở khoang miệng và nhịp thở tự nhiên.",
                    "Chú ý tiếp tục phát huy việc bật rõ ràng các phụ âm đuôi.",
                    "Hãy luyện tập ghép từ này vào câu dài hơn để tăng phản xạ.",
                ],
                visemeTimeline=visemes,
            )

        tips: list[str] = []
        error_descriptions: list[str] = []
        VOWELS = {"iː", "ɪ", "e", "æ", "ɑː", "ʌ", "ɒ", "ɔː", "ʊ", "uː", "ɜː", "ə", "eɪ", "aɪ", "ɔɪ", "əʊ", "aʊ", "ɪə", "eə", "ʊə"}

        for err in errors[:2]:
            exp = err.get("expected", "")
            act = err.get("actual", "")
            kind = "nguyên âm" if exp in VOWELS else "phụ âm"

            guide = ARTICULATORY_GUIDES.get(exp)
            if guide:
                error_descriptions.append(f"{kind} /{exp}/ bị lệch sang /{act or 'bỏ sót'}/")
                tips.append(f"Khẩu hình Môi & Hàm ({kind} /{exp}/): {guide['lips']}.")
                tips.append(f"Vị trí Lưỡi ({kind} /{exp}/): {guide['tongue']}.")
                tips.append(f"Luồng hơi & Dây thanh ({kind} /{exp}/): {guide['breath']}.")
            else:
                error_descriptions.append(f"{kind} /{exp}/ bị lệch sang /{act or 'bỏ sót'}/")
                tips.append(f"Khẩu hình {kind} /{exp}/: Chú ý mở miệng đúng biên độ và đặt lưỡi đúng vị trí giải phẫu.")
                tips.append(f"Luồng hơi {kind} /{exp}/: Luyện phát âm riêng biệt {kind} /{exp}/ dứt khoát trước khi ghép từ.")

        summary = f"Chưa đạt chuẩn: {', '.join(error_descriptions[:2])}."
        return TutorFeedback(
            summaryVi=summary,
            tipsVi=tips[:6],
            visemeTimeline=visemes,
        )


tutor_service = LlamaTutorService()
