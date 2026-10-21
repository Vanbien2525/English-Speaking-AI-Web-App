/**
 * Local storage manager for IPA mastery scores and error review ledger.
 * Enables zero-server offline persistence and instant UI reactivity.
 */

export interface ErrorWordItem {
  id: string;
  word: string;
  ipa: string;
  meaningVi: string;
  phonemeId: string;
  phonemeSymbol: string;
  score: number; // 0..100
  failedAt: number; // timestamp
}

const STORAGE_KEYS = {
  PHONEME_SCORES: "ast3d_ipa_phoneme_scores",
  ERROR_REVIEW: "ast3d_ipa_error_review",
} as const;

export function getStoredPhonemeScores(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PHONEME_SCORES);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveStoredPhonemeScore(phonemeId: string, score: number): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const scores = getStoredPhonemeScores();
    scores[phonemeId] = Math.max(scores[phonemeId] ?? 0, score);
    localStorage.setItem(STORAGE_KEYS.PHONEME_SCORES, JSON.stringify(scores));
    return scores;
  } catch {
    return {};
  }
}

export function getStoredErrorWords(): ErrorWordItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ERROR_REVIEW);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredErrorWord(item: ErrorWordItem): ErrorWordItem[] {
  if (typeof window === "undefined") return [];
  try {
    const list = getStoredErrorWords().filter((w) => w.id !== item.id);
    list.unshift(item); // Put latest error first
    localStorage.setItem(STORAGE_KEYS.ERROR_REVIEW, JSON.stringify(list));
    return list;
  } catch {
    return [];
  }
}

export function removeStoredErrorWord(wordId: string): ErrorWordItem[] {
  if (typeof window === "undefined") return [];
  try {
    const list = getStoredErrorWords().filter((w) => w.id !== wordId);
    localStorage.setItem(STORAGE_KEYS.ERROR_REVIEW, JSON.stringify(list));
    return list;
  } catch {
    return [];
  }
}
