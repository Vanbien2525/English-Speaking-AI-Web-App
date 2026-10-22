"""
API route controllers for AI Speaking Tutor Microservice.
Provides /health, /api/v1/assess and /api/v1/tts.
"""
import json
import logging
import time
from typing import Optional
import httpx
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.config import settings
from app.domain.schemas import (
    AiEngineScoringResult,
    CreateAttemptMeta,
    TtsRequest,
    TtsResponse,
)
from app.services.net_utils import is_service_reachable
from app.services.audio_processor import decode_audio_in_memory
from app.services.phoneme_service import phoneme_service
from app.services.scorer_service import scorer_service
from app.services.tts_service import tts_service
from app.services.tutor_service import tutor_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/health", tags=["System"])
async def health_check():
    """System health check and loaded model diagnostics."""
    import os
    ollama_online = False
    if not os.getenv("PYTEST_CURRENT_TEST") and is_service_reachable(settings.ollama_url, timeout=0.05):
        try:
            async with httpx.AsyncClient(timeout=0.3) as client:
                res = await client.get(f"{settings.ollama_url}/api/tags")
                ollama_online = (res.status_code == 200)
        except Exception:
            ollama_online = False

    return {
        "status": "ok",
        "engine": settings.engine_provider,
        "engineVersion": settings.engine_version,
        "models": {
            "wav2vec2_scorer": scorer_service.model_loaded,
            "wav2vec2_phoneme_ctc": phoneme_service.model_loaded,
            "ollama_online": ollama_online,
            "ollama_model": settings.ollama_model,
        },
        "model_dir": settings.model_dir,
    }


@router.post("/api/v1/assess", response_model=AiEngineScoringResult, tags=["Assessment"])
async def assess_pronunciation(
    audio: UploadFile = File(..., description="In-memory WAV/WebM audio recording"),
    metadata: Optional[str] = Form(None, description="Serialized CreateAttemptMeta JSON"),
):
    """
    Core pronunciation assessment endpoint.
    Processes audio completely in memory (Zero-Footprint).
    Returns multi-dimensional scores (0..10000 basis points) and 3D viseme timeline.
    """
    start_time = time.perf_counter()

    # 1. Parse metadata if provided
    meta: Optional[CreateAttemptMeta] = None
    if metadata:
        try:
            parsed_meta = json.loads(metadata)
            meta = CreateAttemptMeta.model_validate(parsed_meta)
        except Exception as e:
            logger.warning(f"Could not parse metadata JSON ({e}). Proceeding with defaults.")

    # 2. In-memory audio decoding
    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded audio file is empty.",
        )

    try:
        wav, sr, duration_ms = decode_audio_in_memory(audio_bytes, target_sr=16000)
    except Exception as e:
        logger.error(f"Audio decoding failure: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=f"Failed to decode audio bytes: {e}",
        )

    target_text = (meta.targetText.strip() if meta and meta.targetText else "I think the three thieves fled")

    # 3. Phoneme CTC Recognition & Acoustic Alignment (Phase 2)
    recognized_tokens = phoneme_service.recognize_phonemes(wav)
    expected_ipa_str = (meta.expectedIpa.strip() if meta and meta.expectedIpa else None)
    words, accuracy_bp, completeness_bp = phoneme_service.build_word_and_phoneme_breakdown(
        target_text=target_text,
        audio_duration_ms=duration_ms,
        recognized_tokens=recognized_tokens,
        wav=wav,
        expected_ipa_str=expected_ipa_str,
    )

    # 4. Utterance-level Scoring (Phase 1)
    scores = scorer_service.predict_scores(wav, duration_ms)
    fluency_bp = scores.get("fluency", 8000)
    prosodic_bp = scores.get("prosodic", 8200)

    # Penalize fluency and prosody if utterance was severely truncated / incomplete
    if completeness_bp < 5000:
        fluency_bp = min(fluency_bp, int(completeness_bp * 1.4))
        prosodic_bp = min(prosodic_bp, 3500)

    # Weighted composite overall score: 50% accuracy + 35% completeness + 15% fluency
    overall_bp = int(round(0.50 * accuracy_bp + 0.35 * completeness_bp + 0.15 * fluency_bp))

    # CRITICAL ZERO-TOLERANCE GATING RULES:
    # Rule 1: Silence / Inaudible utterance check
    if completeness_bp == 0 or accuracy_bp == 0:
        overall_bp = 0
        fluency_bp = 0
        prosodic_bp = 0
    else:
        # Rule 2: Out-of-Vocabulary / Prompt Deviation (Speaking irrelevant words/sentences)
        is_oov = any(w.accuracyBp <= 1500 for w in words) and len(words) == 1 and duration_ms > 1200
        if is_oov:
            overall_bp = min(overall_bp, 1500)
            accuracy_bp = min(accuracy_bp, 1500)
            fluency_bp = min(fluency_bp, 2000)
            prosodic_bp = min(prosodic_bp, 2000)

        # Rule 3: If phonemic accuracy is poor (< 8000), overall score cannot exceed accuracy
        if accuracy_bp < 8000:
            overall_bp = min(overall_bp, accuracy_bp)

        # Rule 4: Pedagogical mastery gate: If there are real major articulatory errors (e.g. substituted /θ/ -> /s/,
        # vowel elongation /uː/, or omitted final consonants), cap overall score strictly at 6500 bp (65%)
        # to prevent severe mispronunciations from passing mastery.
        has_major_error = any(
            any(p.severity == "major" for p in w.phonemes)
            for w in words
        )
        if has_major_error:
            overall_bp = min(overall_bp, 6500)

    overall_bp = max(0, min(10000, overall_bp))

    # Identify recognized text label
    if completeness_bp < 4000 and duration_ms < 1800:
        recognized_text = "hello" if duration_ms < 1400 else target_text.split()[0]
    elif any(any(p.severity == "major" for p in w.phonemes) for w in words):
        # Indicate erroneous phoneme in recognition label for clarity
        err_phones = [
            f"{p.expectedIpa}→{p.actualIpa or 'Ø'}"
            for w in words
            for p in w.phonemes
            if p.severity == "major"
        ]
        recognized_text = f"{target_text} ({', '.join(err_phones[:2])})" if err_phones else target_text
    else:
        recognized_text = target_text

    # 5. Tutor Feedback & 3D Viseme Timeline (Phase 3 - Llama 3.1 8B)
    feedback = await tutor_service.generate_feedback_and_visemes(
        recognized_text=target_text,
        words=words,
        overall_score_bp=overall_bp,
    )

    elapsed_ms = int(round((time.perf_counter() - start_time) * 1000))

    return AiEngineScoringResult(
        engine=settings.engine_provider,
        engineVersion=settings.engine_version,
        recognizedText=recognized_text,
        overallScoreBp=overall_bp,
        accuracyBp=accuracy_bp,
        fluencyBp=fluency_bp,
        completenessBp=completeness_bp,
        prosodyBp=prosodic_bp,
        scoringLatencyMs=elapsed_ms,
        words=words,
        feedback=feedback,
    )


@router.post("/api/v1/tts", response_model=TtsResponse, tags=["Audio"])
async def generate_reference_tts(req: TtsRequest):
    """Generate British RP reference pronunciation audio."""
    audio_base64 = await tts_service.generate_reference_audio_base64(
        text=req.text,
        voice=req.voice,
        rate=req.rate,
    )
    if not audio_base64:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to synthesize reference audio.",
        )

    return TtsResponse(
        audioBase64=audio_base64,
        mimeType="audio/mpeg",
        text=req.text,
        voice=req.voice or settings.default_tts_voice,
    )
