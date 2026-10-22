"""
Domain Pydantic Schemas matching Next.js 16 contracts (src/core/dto/shared.dto.ts).
Enforces strict typing and basis points validation (0..10000).
"""
from typing import Optional, Literal
from pydantic import BaseModel, Field


# -----------------------------------------------------------------------------
# Primitives & Enums
# -----------------------------------------------------------------------------
AccentCode = Literal["en-GB-RP", "en-US-GA"]
FeedbackSeverity = Literal["good", "minor", "major"]
PhonemeErrorType = Literal["correct", "substitution", "deletion", "insertion", "distortion"]
EngineProvider = Literal["local_whisperx_wav2vec2", "gemini_live", "azure_pronunciation"]


# -----------------------------------------------------------------------------
# 3D Viseme Control
# -----------------------------------------------------------------------------
class CameraPreset(BaseModel):
    position: tuple[float, float, float]
    target: tuple[float, float, float]
    fov: float = Field(ge=10, le=90)


class VisemeCommand(BaseModel):
    ipa: str
    startMs: int = Field(ge=0)
    transitionMs: int = Field(ge=0, le=2000, default=40)
    holdMs: int = Field(ge=0, le=5000, default=80)
    morphWeights: dict[str, int] = Field(default_factory=dict)
    highlightParts: list[str] = Field(default_factory=list)
    camera: Optional[CameraPreset] = None


# -----------------------------------------------------------------------------
# Phoneme & Word Scoring
# -----------------------------------------------------------------------------
class PhonemeResult(BaseModel):
    position: int = Field(ge=0)
    expectedIpa: Optional[str] = None
    actualIpa: Optional[str] = None
    errorType: PhonemeErrorType = "correct"
    severity: FeedbackSeverity = "good"
    gopScoreBp: int = Field(ge=0, le=10000)
    startMs: Optional[int] = Field(default=None, ge=0)
    endMs: Optional[int] = Field(default=None, ge=0)


class WordResult(BaseModel):
    word: str
    accuracyBp: int = Field(ge=0, le=10000)
    startMs: int = Field(ge=0)
    endMs: int = Field(ge=0)
    phonemes: list[PhonemeResult] = Field(default_factory=list)


# -----------------------------------------------------------------------------
# Tutor Feedback & Complete Assessment Response
# -----------------------------------------------------------------------------
class TutorFeedback(BaseModel):
    summaryVi: str
    tipsVi: list[str] = Field(default_factory=list)
    visemeTimeline: list[VisemeCommand] = Field(default_factory=list)


class AiEngineScoringResult(BaseModel):
    engine: EngineProvider = "local_whisperx_wav2vec2"
    engineVersion: str = "whisperx-3.1.1+wav2vec2-large-xlsr-53"
    recognizedText: str
    overallScoreBp: int = Field(ge=0, le=10000)
    accuracyBp: int = Field(ge=0, le=10000)
    fluencyBp: int = Field(ge=0, le=10000)
    completenessBp: int = Field(ge=0, le=10000)
    prosodyBp: Optional[int] = Field(default=None, ge=0, le=10000)
    scoringLatencyMs: int = Field(ge=0)
    words: list[WordResult] = Field(default_factory=list)
    feedback: TutorFeedback


class CreateAttemptMeta(BaseModel):
    sessionId: str
    lessonItemId: str
    idempotencyKey: str
    audioDurationMs: int = Field(ge=1, le=60000)
    accent: AccentCode = "en-GB-RP"
    targetText: Optional[str] = None
    expectedIpa: Optional[str] = None


class TtsRequest(BaseModel):
    text: str = Field(min_length=1, max_length=1000)
    voice: Optional[str] = "en-GB-SoniaNeural"
    rate: Optional[str] = "+0%"


class TtsResponse(BaseModel):
    audioBase64: str
    mimeType: str = "audio/mpeg"
    text: str
    voice: str
