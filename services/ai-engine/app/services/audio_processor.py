"""
Zero-Footprint In-Memory Audio Processor.
Decodes, normalizes, and resamples incoming audio (WAV, WebM, OGG, MP3) in RAM without writing to disk.
Protects silence and low-noise floors against artificial amplification.
"""
import io
import math
import logging
import numpy as np
import soundfile as sf

logger = logging.getLogger(__name__)


def _decode_with_av(audio_bytes: bytes, target_sr: int = 16000) -> np.ndarray:
    """Decode compressed container (WebM/Opus, Ogg, MP3, AAC) directly from RAM using PyAV."""
    import av
    with io.BytesIO(audio_bytes) as bio:
        container = av.open(bio)
        audio_stream = next((s for s in container.streams if s.type == "audio"), None)
        if audio_stream is None:
            raise ValueError("No audio stream found in media container")

        resampler = av.AudioResampler(format="fltp", layout="mono", rate=target_sr)
        chunks = []
        for frame in container.decode(audio_stream):
            for resampled_frame in resampler.resample(frame):
                chunks.append(resampled_frame.to_ndarray()[0])

        for resampled_frame in resampler.resample(None):
            chunks.append(resampled_frame.to_ndarray()[0])

        if not chunks:
            raise ValueError("Decoded audio frames are empty")

        return np.concatenate(chunks).astype(np.float32)


def decode_audio_in_memory(audio_bytes: bytes, target_sr: int = 16000) -> tuple[np.ndarray, int, int]:
    """
    Decode audio bytes directly from RAM.
    Supports WAV, FLAC, OGG, WebM/Opus, MP3 via soundfile with PyAV fallback.
    Returns:
        - normalized_audio: 1D np.ndarray float32 normalized to [-1.0, 1.0]
        - target_sr: target sampling rate (16000)
        - duration_ms: audio duration in milliseconds
    """
    data = None
    sr = target_sr

    # 1. Try fast soundfile decoding (WAV, FLAC, OGG)
    try:
        with io.BytesIO(audio_bytes) as bio:
            data, sr = sf.read(bio, dtype="float32", always_2d=False)
            if data.ndim > 1:
                data = data.mean(axis=1)
            if sr != target_sr:
                old_indices = np.linspace(0, len(data) - 1, len(data))
                new_len = int(math.ceil(len(data) * target_sr / sr))
                new_indices = np.linspace(0, len(data) - 1, new_len)
                data = np.interp(new_indices, old_indices, data).astype(np.float32)
    except Exception:
        # 2. Fallback to PyAV (WebM, Opus, AAC, browser MediaRecorder blobs)
        try:
            data = _decode_with_av(audio_bytes, target_sr=target_sr)
            sr = target_sr
        except Exception as av_err:
            logger.error(f"Failed to decode audio in memory via PyAV: {av_err}")
            raise ValueError(f"All in-memory audio decoders failed: {av_err}")

    # Standardize amplitude without destroying natural dynamic range
    # Protect quiet/silence audio: NEVER amplify noise floor to unit variance
    max_val = float(np.max(np.abs(data))) if len(data) > 0 else 0.0
    if max_val < 0.015:
        # True silence, mute, or inaudible whispering: keep raw levels
        normalized = data.astype(np.float32)
    elif max_val > 1.0:
        # Prevent clipping distortion
        normalized = (data / max_val).astype(np.float32)
    else:
        normalized = data.astype(np.float32)

    duration_ms = int(math.ceil((len(data) / target_sr) * 1000))
    return normalized, target_sr, max(1, duration_ms)
