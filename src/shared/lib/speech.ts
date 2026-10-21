/**
 * Web Speech API utility for authentic British RP / English audio playback.
 * Delivers zero-latency client-side speech synthesis with fallback handling.
 */

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private cachedVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synth = window.speechSynthesis;
      this.initVoices();
    }
  }

  private initVoices() {
    if (!this.synth) return;
    const load = () => {
      this.cachedVoices = this.synth?.getVoices() ?? [];
    };
    load();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = load;
    }
  }

  private getPreferredVoice(): SpeechSynthesisVoice | null {
    if (!this.cachedVoices || this.cachedVoices.length === 0) {
      if (this.synth) {
        this.cachedVoices = this.synth.getVoices();
      }
    }
    // 1. Try finding authentic British English voice (en-GB)
    const britishVoice = this.cachedVoices.find(
      (v) => v.lang === "en-GB" || v.lang.startsWith("en-GB") || v.name.toLowerCase().includes("british") || v.name.toLowerCase().includes("uk")
    );
    if (britishVoice) return britishVoice;

    // 2. Fallback to any English voice
    const englishVoice = this.cachedVoices.find((v) => v.lang.startsWith("en"));
    if (englishVoice) return englishVoice;

    return null;
  }

  /**
   * Speak a given text or word with optional rate and pitch.
   */
  public speak(text: string, rate: number = 0.9): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth || typeof window === "undefined") {
        resolve();
        return;
      }

      this.synth.cancel(); // Stop active utterance

      const cleanText = text.replace(/[\/\[\]]/g, "").trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voice = this.getPreferredVoice();
      if (voice) {
        utterance.voice = voice;
      }
      utterance.lang = "en-GB";
      utterance.rate = rate; // Slightly slower for crisp articulation
      utterance.pitch = 1.0;

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      this.synth.speak(utterance);
    });
  }

  /**
   * Plays IPA phoneme sound followed by a 0.5s pause and then the exemplar anchor word.
   * Requirement 2: "Click vào thẻ -> Phát âm IPA gốc -> Tạm dừng (0.5s) -> Phát từ vựng ví dụ"
   */
  public async playPhonemeSequence(
    phonemeSymbol: string,
    anchorWord: string,
    onStepChange?: (step: "idle" | "phoneme" | "pause" | "anchor") => void
  ): Promise<void> {
    if (onStepChange) onStepChange("phoneme");

    // Speak phoneme anchor sound
    await this.speak(phonemeSymbol, 0.85);

    if (onStepChange) onStepChange("pause");
    await new Promise((r) => setTimeout(r, 500));

    if (onStepChange) onStepChange("anchor");
    await this.speak(anchorWord, 0.9);

    if (onStepChange) onStepChange("idle");
  }

  public cancel(): void {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}

export const speechService = new SpeechService();
