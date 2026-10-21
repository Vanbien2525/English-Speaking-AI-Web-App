"""
British RP Text-to-Speech Reference Service.
Generates reference native British RP pronunciation using edge-tts directly in memory.
"""
import base64
import io
import logging
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)


class EdgeTtsService:
    def __init__(self):
        self.default_voice = settings.default_tts_voice

    async def generate_reference_audio_base64(
        self,
        text: str,
        voice: Optional[str] = None,
        rate: Optional[str] = None,
    ) -> Optional[str]:
        """
        Generate MP3 audio bytes using edge-tts and return base64 string.
        Executes 100% in memory without temporary disk files.
        """
        chosen_voice = voice or self.default_voice
        chosen_rate = rate or settings.default_tts_rate

        try:
            import edge_tts

            communicate = edge_tts.Communicate(text, chosen_voice, rate=chosen_rate)
            buffer = io.BytesIO()

            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    buffer.write(chunk["data"])

            audio_bytes = buffer.getvalue()
            if not audio_bytes:
                return None

            return base64.b64encode(audio_bytes).decode("ascii")

        except Exception as e:
            logger.warning(f"Could not generate reference audio via edge-tts ({e})")
            return None


tts_service = EdgeTtsService()
