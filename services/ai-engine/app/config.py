"""
Application configuration for AI Speaking Tutor Microservice.
Supports reading model weights directly from Google Drive or local SSD.
"""
import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Server settings
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]

    # Model paths (Google Drive mounted or local SSD)
    model_dir: str = os.getenv(
        "MODEL_DIR",
        r"G:\My Drive\AI_Speaking_Tutor_Models"
    )
    fallback_local_model_dir: str = str(
        Path(__file__).resolve().parent.parent / "models"
    )

    # Subdirectory names
    phase1_scorer_subdir: str = "phase1_scorer"
    phase2_phoneme_ctc_subdir: str = "phase2_phoneme_ctc"
    phase3_llama_subdir: str = "phase3_llama_tutor"

    # Phoneme ASR SOTA Model
    phoneme_model_name: str = os.getenv("PHONEME_MODEL_NAME", "facebook/wav2vec2-xlsr-53-espeak-cv-ft")

    # Ollama integration
    ollama_url: str = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")
    ollama_model: str = os.getenv("OLLAMA_MODEL", "speaking-tutor-llama3")
    ollama_timeout_s: float = 12.0

    # TTS settings
    default_tts_voice: str = "en-GB-SoniaNeural"
    default_tts_rate: str = "+0%"

    # Engine metadata
    engine_provider: str = "local_whisperx_wav2vec2"
    engine_version: str = "whisperx-3.1.1+wav2vec2-large-xlsr-53"

    def get_effective_model_path(self, subdir: str) -> Optional[Path]:
        """Check primary (Google Drive) and fallback (local models/) directories."""
        try:
            primary = Path(self.model_dir) / subdir
            if primary.exists():
                return primary
        except (PermissionError, OSError):
            pass

        try:
            fallback = Path(self.fallback_local_model_dir) / subdir
            if fallback.exists():
                return fallback
        except (PermissionError, OSError):
            pass

        return None


settings = Settings()
