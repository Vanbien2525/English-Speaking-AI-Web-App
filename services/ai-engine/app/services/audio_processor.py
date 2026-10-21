"""
Zero-Footprint In-Memory Audio Processor with Advanced DSP.
Decodes, normalizes, bandpass-filters, and resamples incoming audio in RAM.
Protects silence and low-noise floors against artificial amplification.
Includes VAD trimming with safety margin padding and clipping detection.
"""
import io
import math
import logging
import numpy as np
import soundfile as sf

logger = logging.getLogger(__name__)


def bandpass_filter_in_memory(data: np.ndarray, lowcut: float = 80.0, highcut: float = 7500.0, fs: int = 16000) -> np.ndarray:
    """
    Fast frequency bandpass filter via FFT in RAM.
    Eliminates sub-audible rumble (<80Hz) and harsh metallic high-frequency hiss (>7500Hz).
    """
    if len(data) < 128:
        return data

    fft_vals = np.fft.rfft(data)
    freqs = np.fft.rfftfreq(len(data), d=1.0 / fs)

    # Soft transition masks
    mask = np.ones_like(freqs, dtype=np.float32)
    mask[freqs < lowcut] = 0.0
    mask[freqs > highcut] = 0.0

    filtered_fft = fft_vals * mask
    return np.fft.irfft(filtered_fft, n=len(data)).astype(np.float32)


def vad_trim_and_pad(data: np.ndarray, sr: int = 16000, energy_thresh: float = 0.015, margin_ms: int = 60) -> np.ndarray:
    """
    Trim prolonged dead silence at speech boundaries while adding safety margin padding.
    Prevents boundary clipping when users prematurely press stop or speak immediately upon recording.
    """
    if len(data) < 320:
        return data

    abs_data = np.abs(data)
    active_indices = np.where(abs_data > energy_thresh)[0]

    if len(active_indices) == 0:
        # True silence / muted audio
        return data

    margin_samples = int((margin_ms / 1000.0) * sr)
    start_idx = max(0, active_indices[0] - margin_samples)
    end_idx = min(len(data), active_indices[-1] + margin_samples)

    if end_idx > start_idx + 160:
        return data[start_idx:end_idx].astype(np.float32)
    return data


def detect_audio_quality(data: np.ndarray) -> dict[str, float | bool]:
    """
    Analyze recording signal health:
      - is_silent: inaudible or muted recording
      - is_clipping: microphone saturated / placed too close to mouth
      - rms: root-mean-square energy level
    """
    if len(data) == 0:
        return {"rms": 0.0, "is_silent": True, "is_clipping": False, "peak": 0.0}

    rms = float(np.sqrt(np.mean(data ** 2)))
    peak = float(np.max(np.abs(data)))
    clip_ratio = float(np.mean(np.abs(data) > 0.98))

    return {
        "rms": rms,
        "is_silent": (rms < 0.010) or (peak < 0.020),
        "is_clipping": clip_ratio > 0.01 or peak >= 1.0,
        "peak": peak,
    }


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

    # Apply Bandpass Filter to eliminate low-frequency rumble & high hiss
    if len(data) > 256:
        data = bandpass_filter_in_memory(data, lowcut=80.0, highcut=7500.0, fs=target_sr)

    # Trim dead silence at boundaries while adding safety margins
    quality_before = detect_audio_quality(data)
    if not quality_before["is_silent"]:
        data = vad_trim_and_pad(data, sr=target_sr, energy_thresh=0.015, margin_ms=60)

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
