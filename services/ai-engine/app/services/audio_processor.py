"""
Zero-Footprint In-Memory Audio Processor.
Decodes, normalizes, and resamples incoming audio in RAM without writing to disk.
"""
import io
import math
import numpy as np
import soundfile as sf


def decode_audio_in_memory(audio_bytes: bytes, target_sr: int = 16000) -> tuple[np.ndarray, int, int]:
    """
    Decode audio bytes directly from RAM.
    Returns:
        - normalized_audio: 1D np.ndarray float32 normalized to [-1.0, 1.0]
        - target_sr: target sampling rate (16000)
        - duration_ms: audio duration in milliseconds
    """
    with io.BytesIO(audio_bytes) as bio:
        data, sr = sf.read(bio, dtype="float32", always_2d=False)

    # Convert multi-channel to mono
    if data.ndim > 1:
        data = data.mean(axis=1)

    # Resample if needed
    if sr != target_sr:
        # Linear or sinc interpolation in memory
        old_indices = np.linspace(0, len(data) - 1, len(data))
        new_len = int(math.ceil(len(data) * target_sr / sr))
        new_indices = np.linspace(0, len(data) - 1, new_len)
        data = np.interp(new_indices, old_indices, data).astype(np.float32)

    # Standardize amplitude (mean 0, unit variance with epsilon protection)
    std = data.std()
    if std > 1e-7:
        normalized = ((data - data.mean()) / (std + 1e-7)).astype(np.float32)
    else:
        normalized = data.astype(np.float32)

    duration_ms = int(math.ceil((len(data) / target_sr) * 1000))
    return normalized, target_sr, max(1, duration_ms)
