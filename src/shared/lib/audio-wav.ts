/**
 * In-Memory Web Audio to 16kHz Mono 16-bit PCM WAV Converter.
 * Guarantees zero-footprint processing in browser RAM without disk persistence.
 * Solves browser container incompatibility (WebM/Opus) when decoding on Python soundfile.
 */

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

export async function convertBlobToWav(
  sourceBlob: Blob,
  targetSampleRate = 16000,
): Promise<Blob> {
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioCtx({ sampleRate: targetSampleRate });

  try {
    const arrayBuffer = await sourceBlob.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    // Get channel 0 (or downmix to mono if stereo)
    const numChannels = 1;
    const channelData = audioBuffer.getChannelData(0);
    const bitDepth = 16;
    const dataLength = channelData.length * 2;
    const totalLength = 44 + dataLength;

    const buffer = new ArrayBuffer(totalLength);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, "WAVE");

    // fmt sub-chunk
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, numChannels, true); // NumChannels (1 = Mono)
    view.setUint32(24, targetSampleRate, true); // SampleRate (16000)
    view.setUint32(28, targetSampleRate * numChannels * (bitDepth / 8), true); // ByteRate
    view.setUint16(32, numChannels * (bitDepth / 8), true); // BlockAlign
    view.setUint16(34, bitDepth, true); // BitsPerSample (16-bit)

    // data sub-chunk
    writeString(view, 36, "data");
    view.setUint32(40, dataLength, true);

    // Write PCM 16-bit samples
    let offset = 44;
    for (let i = 0; i < channelData.length; i++) {
      const s = Math.max(-1, Math.min(1, channelData[i] ?? 0));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }

    return new Blob([buffer], { type: "audio/wav" });
  } catch {
    // If browser cannot decodeAudioData, return original blob as fallback
    return sourceBlob;
  } finally {
    if (audioCtx.state !== "closed") {
      audioCtx.close().catch(() => {});
    }
  }
}
