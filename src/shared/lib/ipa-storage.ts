/**
 * Local storage manager for IPA mastery scores, word results, and error review ledger.
 * Enables zero-server offline persistence and instant UI reactivity.
 */

export interface ErrorWordItem {
  id: string; // usually `${phonemeId}_${wordId}`
  word: string;
  ipa: string;
  meaningVi: string;
  phonemeId: string;
  phonemeSymbol: string;
  score: number; // 0..100
  failedAt: number; // timestamp
  feedbackVi?: string; // Detailed pedagogical feedback from AI Tutor
}

export interface StoredWordResult {
  score: number;
  feedbackVi: string;
  isCorrect: boolean;
  errorPart?: string;
  timestamp: number;
}

const STORAGE_KEYS = {
  PHONEME_SCORES: "ast3d_ipa_phoneme_scores",
  WORD_RESULTS: "ast3d_ipa_word_results",
  ERROR_REVIEW: "ast3d_ipa_error_review",
} as const;

export const IPA_STORAGE_EVENT = "ast3d_ipa_storage_updated";

function notifyStorageChanged() {
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(IPA_STORAGE_EVENT));
    } catch {}
  }
}

// =============================================================================
// Phoneme Average Scores (0..100)
// =============================================================================

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
    scores[phonemeId] = score; // Store latest calculated average
    localStorage.setItem(STORAGE_KEYS.PHONEME_SCORES, JSON.stringify(scores));
    notifyStorageChanged();
    return scores;
  } catch {
    return {};
  }
}

// =============================================================================
// Word Assessment Results for 10 Exemplar Words (Preserves latest attempt per word)
// =============================================================================

export function getAllStoredWordResults(): Record<string, StoredWordResult> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WORD_RESULTS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getStoredWordResultsForPhoneme(phonemeId: string): Record<string, StoredWordResult> {
  const all = getAllStoredWordResults();
  const prefix = `${phonemeId}_`;
  const result: Record<string, StoredWordResult> = {};
  for (const [key, val] of Object.entries(all)) {
    if (key.startsWith(prefix)) {
      const wordId = key.slice(prefix.length);
      result[wordId] = val;
    }
  }
  return result;
}

export function saveStoredWordResult(
  phonemeId: string,
  wordId: string,
  data: StoredWordResult
): Record<string, StoredWordResult> {
  if (typeof window === "undefined") return {};
  try {
    const all = getAllStoredWordResults();
    const key = `${phonemeId}_${wordId}`;
    all[key] = data;
    localStorage.setItem(STORAGE_KEYS.WORD_RESULTS, JSON.stringify(all));
    notifyStorageChanged();
    return getStoredWordResultsForPhoneme(phonemeId);
  } catch {
    return {};
  }
}

// =============================================================================
// Error Review Ledger (< 80% words queue, removed instantly when >= 80%)
// =============================================================================

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
    notifyStorageChanged();
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
    notifyStorageChanged();
    return list;
  } catch {
    return [];
  }
}
