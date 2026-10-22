/**
 * Web Speech API & Authentic Audio Clips Utility.
 * Specialized exclusively for British RP (Received Pronunciation) MALE Voice.
 * Female voices are strictly blacklisted.
 */

import {
  getPhonemeAudioUrl,
  getPhonemeSpokenText,
} from "@/core/data/ipa-audio-urls";

const FEMALE_VOICE_BLACKLIST = [
  "female",
  "susan",
  "hazel",
  "zira",
  "sonia",
  "catherine",
  "jenny",
  "libby",
  "eva",
  "victoria",
  "woman",
  "girl",
  "samantha",
  "karen",
  "alice",
  "fiona",
  "heera",
];

const MALE_VOICE_WHITELIST = [
  "ryan",
  "george",
  "oliver",
  "david",
  "mark",
  "guy",
  "male",
  "steffan",
  "james",
  "john",
  "alex",
  "tom",
  "daniel",
  "richard",
  "brian",
  "arthur",
];

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private activeAudio: HTMLAudioElement | null = null;

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

  private isFemaleVoice(voiceName: string): boolean {
    const lower = voiceName.toLowerCase();
    return FEMALE_VOICE_BLACKLIST.some((b) => lower.includes(b));
  }

  /**
   * Prioritize strictly British RP MALE voice.
   * Discards any female or ambiguous high-pitch voice.
   */
  public getBritishMaleVoice(): SpeechSynthesisVoice | null {
    if (!this.cachedVoices || this.cachedVoices.length === 0) {
      if (this.synth) {
        this.cachedVoices = this.synth.getVoices();
      }
    }

    const voices = this.cachedVoices;
    if (!voices || voices.length === 0) return null;

    // Filter out blacklisted female voices
    const nonFemaleVoices = voices.filter((v) => !this.isFemaleVoice(v.name));

    // 1. British RP Male (Ryan, George, Oliver, Male)
    const britishMale = nonFemaleVoices.find(
      (v) =>
        (v.lang === "en-GB" || v.lang.startsWith("en-GB")) &&
        MALE_VOICE_WHITELIST.some((w) => v.name.toLowerCase().includes(w))
    );
    if (britishMale) return britishMale;

    // 2. Any English Male voice
    const anyEnglishMale = nonFemaleVoices.find(
      (v) =>
        v.lang.startsWith("en") &&
        MALE_VOICE_WHITELIST.some((w) => v.name.toLowerCase().includes(w))
    );
    if (anyEnglishMale) return anyEnglishMale;

    // 3. British English voice that is NOT female
    const nonFemaleBritish = nonFemaleVoices.find(
      (v) => v.lang === "en-GB" || v.lang.startsWith("en-GB")
    );
    if (nonFemaleBritish) return nonFemaleBritish;

    // 4. Any English voice that is NOT female
    const fallbackNonFemale = nonFemaleVoices.find((v) => v.lang.startsWith("en"));
    if (fallbackNonFemale) return fallbackNonFemale;

    return null;
  }

  /**
   * Play isolated phoneme sound.
   * If an authentic verified clip exists (/ɪ/, /ʊ/, /ə/, /ɔː/, /æ/), plays the clip.
   * Otherwise, speaks the true phonetic pronunciation using the British Male voice
   * (/p/ -> "puh/pờ", /b/ -> "buh/bờ", /t/ -> "tuh/tờ", /eɪ/ -> "ay", /aɪ/ -> "eye").
   */
  public async playIsolatedPhoneme(idOrSymbol: string): Promise<boolean> {
    const url = getPhonemeAudioUrl(idOrSymbol);
    if (url) {
      const audioSuccess = await this.playAudioUrl(url);
      if (audioSuccess) return true;
    }

    // Speak phonetic male sound
    const phoneticText = getPhonemeSpokenText(idOrSymbol);
    await this.speak(phoneticText, 0.82, 0.84);
    return true;
  }

  private playAudioUrl(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.cancel();

      try {
        const audio = new Audio(url);
        this.activeAudio = audio;
        audio.onended = () => {
          this.activeAudio = null;
          resolve(true);
        };
        audio.onerror = () => {
          this.activeAudio = null;
          resolve(false);
        };
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            this.activeAudio = null;
            resolve(false);
          });
        }
      } catch {
        resolve(false);
      }
    });
  }

  /**
   * Speak English text strictly with British RP Male voice.
   */
  public speak(
    text: string,
    rate: number = 0.88,
    pitch: number = 0.84
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth || typeof window === "undefined") {
        resolve();
        return;
      }

      this.cancel();

      const cleanText = text.replace(/[\/\[\]]/g, "").trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voice = this.getBritishMaleVoice();
      if (voice) {
        utterance.voice = voice;
      }
      utterance.lang = "en-GB";
      utterance.rate = rate;
      utterance.pitch = pitch; // Resonant British Male timbre (0.84)

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      this.synth.speak(utterance);
    });
  }

  /**
   * Plays IPA phoneme sound followed by 0.5s pause and then the anchor word.
   * 100% British RP Male Voice throughout.
   */
  public async playPhonemeSequence(
    phonemeSymbolOrId: string,
    anchorWord: string,
    onStepChange?: (step: "idle" | "phoneme" | "pause" | "anchor") => void
  ): Promise<void> {
    this.cancel();

    if (onStepChange) onStepChange("phoneme");

    // 1. Play authentic isolated sound or male phonetic articulation
    await this.playIsolatedPhoneme(phonemeSymbolOrId);

    // 2. Pause exactly 0.5s
    if (onStepChange) onStepChange("pause");
    await new Promise((r) => setTimeout(r, 500));

    // 3. Speak anchor word with British RP Male voice
    if (onStepChange) onStepChange("anchor");
    await this.speak(anchorWord, 0.88, 0.84);

    if (onStepChange) onStepChange("idle");
  }

  public cancel(): void {
    if (this.activeAudio) {
      try {
        this.activeAudio.pause();
        this.activeAudio.currentTime = 0;
      } catch {}
      this.activeAudio = null;
    }
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {}
    }
  }
}

export const speechService = new SpeechService();
