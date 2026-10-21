"""
Integration & Contract Verification Tests for AI Speaking Tutor Microservice.
Verifies /health and /api/v1/assess in-memory Zero-Footprint processing,
strict gating rules, vowel elongation detection, and pedagogical tutor guidance.
"""
import io
import json
import wave
import numpy as np
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.domain.schemas import CreateAttemptMeta


def create_dummy_wav_bytes(duration_s: float = 1.0, sr: int = 16000, freq: float = 440.0, amplitude: float = 0.5) -> bytes:
    """Generate in-memory 16kHz mono sine wave audio for testing."""
    num_samples = int(duration_s * sr)
    t = np.linspace(0, duration_s, num_samples, endpoint=False)
    audio = (amplitude * np.sin(2 * np.pi * freq * t) * 32767).astype(np.int16)

    bio = io.BytesIO()
    with wave.open(bio, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(audio.tobytes())
    return bio.getvalue()


@pytest.fixture
def client():
    return TestClient(app, raise_server_exceptions=True)


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "models" in data
    assert "engine" in data
    assert data["engine"] == "local_whisperx_wav2vec2"


def test_assess_endpoint_with_in_memory_audio(client):
    audio_bytes = create_dummy_wav_bytes(duration_s=1.2)
    meta = {
        "sessionId": "018f4a7c-87d0-7a32-9c10-234567890abc",
        "lessonItemId": "018f4a7c-87d0-7a32-9c10-234567890def",
        "idempotencyKey": "018f4a7c-87d0-7a32-9c10-234567890aaa",
        "audioDurationMs": 1200,
        "accent": "en-GB-RP",
    }

    response = client.post(
        "/api/v1/assess",
        files={"audio": ("sample.wav", audio_bytes, "audio/wav")},
        data={"metadata": json.dumps(meta)},
    )

    assert response.status_code == 200
    result = response.json()

    # Verify response schema matching shared.dto.ts
    assert result["engine"] == "local_whisperx_wav2vec2"
    assert 0 <= result["overallScoreBp"] <= 10000
    assert 0 <= result["accuracyBp"] <= 10000
    assert 0 <= result["fluencyBp"] <= 10000
    assert 0 <= result["completenessBp"] <= 10000
    assert result["scoringLatencyMs"] >= 0
    assert len(result["words"]) > 0

    # Verify 3D Viseme timeline presence
    assert "feedback" in result
    assert "visemeTimeline" in result["feedback"]
    assert len(result["feedback"]["visemeTimeline"]) > 0

    first_viseme = result["feedback"]["visemeTimeline"][0]
    assert "ipa" in first_viseme
    assert "startMs" in first_viseme
    assert "morphWeights" in first_viseme
    assert "highlightParts" in first_viseme


def test_short_mismatched_utterance_receives_low_score(client):
    """Speaking 'hello' (short utterance) when expected is a full sentence MUST drop completeness & overall score."""
    audio_bytes = create_dummy_wav_bytes(duration_s=0.9)
    meta = {
        "sessionId": "018f4a7c-87d0-7a32-9c10-234567890abc",
        "lessonItemId": "018f4a7c-87d0-7a32-9c10-234567890def",
        "idempotencyKey": "018f4a7c-87d0-7a32-9c10-234567890bbb",
        "audioDurationMs": 900,
        "accent": "en-GB-RP",
        "targetText": "I think the three thieves fled",
    }

    response = client.post(
        "/api/v1/assess",
        files={"audio": ("sample.wav", audio_bytes, "audio/wav")},
        data={"metadata": json.dumps(meta)},
    )

    assert response.status_code == 200
    result = response.json()

    # Overall score and completeness must drop significantly (< 4000 bp / 40%)
    assert result["completenessBp"] < 4000
    assert result["overallScoreBp"] < 4000
    assert "Cảnh báo" in result["feedback"]["summaryVi"]

    # Verify that omitted words have phonemes marked as deletion
    words = result["words"]
    omitted_words = words[2:]
    for w in omitted_words:
        assert w["accuracyBp"] <= 2000
        for p in w["phonemes"]:
            assert p["errorType"] == "deletion"
            assert p["actualIpa"] is None


def test_vowel_elongation_in_good_fails_mastery(client):
    """Deliberately stretching /ʊ/ into /uː/ in 'good' (> 250ms high energy) MUST fail mastery (< 8000 bp) and provide articulatory tips."""
    # Sustained 800ms sine wave audio simulates a prolonged 'goooood'
    audio_bytes = create_dummy_wav_bytes(duration_s=0.8, amplitude=0.6)
    meta = {
        "sessionId": "018f4a7c-87d0-7a32-9c10-234567890abc",
        "lessonItemId": "018f4a7c-87d0-7a32-9c10-234567890ccc",
        "idempotencyKey": "018f4a7c-87d0-7a32-9c10-234567890ccc",
        "audioDurationMs": 800,
        "accent": "en-GB-RP",
        "targetText": "good",
    }

    response = client.post(
        "/api/v1/assess",
        files={"audio": ("sample.wav", audio_bytes, "audio/wav")},
        data={"metadata": json.dumps(meta)},
    )

    assert response.status_code == 200
    result = response.json()

    # Strict gating rule: MUST NOT PASS (< 8000 bp / 80%)
    assert result["overallScoreBp"] <= 6500, f"Expected overallScoreBp <= 6500, got {result['overallScoreBp']}"

    # Verify phoneme level diagnosis
    words = result["words"]
    assert len(words) == 1
    good_word = words[0]
    phonemes = good_word["phonemes"]
    assert len(phonemes) == 3

    # Phoneme 1: expected /ʊ/, detected /uː/ with major severity
    vowel_p = phonemes[1]
    assert vowel_p["expectedIpa"] == "ʊ"
    assert vowel_p["actualIpa"] == "uː"
    assert vowel_p["severity"] == "major"
    assert vowel_p["errorType"] == "substitution"

    # Verify AI Tutor pedagogical advice exists and addresses /ʊ/
    feedback = result["feedback"]
    assert "nguyên âm" in feedback["summaryVi"].lower() or "chưa đạt" in feedback["summaryVi"].lower()
    assert len(feedback["tipsVi"]) > 0
    # At least one tip must mention /ʊ/ or /uː/
    tips_joined = " ".join(feedback["tipsVi"])
    assert "/ʊ/" in tips_joined or "/uː/" in tips_joined


def test_silence_receives_zero_score(client):
    """Silent or inaudible audio (< 0.010 RMS) must receive 0 points and warning feedback."""
    audio_bytes = create_dummy_wav_bytes(duration_s=0.5, amplitude=0.001)
    meta = {
        "sessionId": "018f4a7c-87d0-7a32-9c10-234567890abc",
        "lessonItemId": "018f4a7c-87d0-7a32-9c10-234567890ddd",
        "idempotencyKey": "018f4a7c-87d0-7a32-9c10-234567890ddd",
        "audioDurationMs": 500,
        "accent": "en-GB-RP",
        "targetText": "think",
    }

    response = client.post(
        "/api/v1/assess",
        files={"audio": ("sample.wav", audio_bytes, "audio/wav")},
        data={"metadata": json.dumps(meta)},
    )

    assert response.status_code == 200
    result = response.json()

    assert result["overallScoreBp"] == 0
    assert result["accuracyBp"] == 0
    assert "Cảnh báo" in result["feedback"]["summaryVi"]
