/**
 * Application service for Active Vocabulary & 3D Flashcards (FEAT-ACTIVE-VOCABULARY-3D).
 * Orchestrates Free Dictionary API lookup, AI enrichment, Batch Import, and SM-2 Speaking Verification.
 */
import type {
  VocabularyDeck,
  VocabularyItem,
  QuickAddEnrichResponse,
  BatchImportResponse,
  FlashcardReviewResult,
  VocabularyMetrics,
  ListeningQuizQuestion,
  ClozeSpellingQuestion,
  ReviewLevel,
  MatchingQuizPair,
  SentencePracticeItem,
  VietnameseToEnglishQuestion,
  TroubleWordItem,
  ManualVocabularyLevel,
} from "@/core/dto/vocabulary.dto";
import {
  calculateQualityFromScore,
  calculateSm2,
  calculateSm2Level,
  calculateXpFromQuality,
} from "@/core/domain/sm2";
import type { VocabularyRepository } from "@/core/repositories/vocabulary-repository";
import { InMemoryVocabularyRepository } from "@/core/repositories/vocabulary-repository";
import { lookupAcademicDictionary } from "./dictionary-data";

// -----------------------------------------------------------------------------
// Fallback Dictionary Database for Offline / Fast Execution
// -----------------------------------------------------------------------------
// Common offline entries
const LOCAL_FALLBACK_DICTIONARY: Record<
  string,
  {
    ipa: string;
    partOfSpeech: string;
    definitionVi: string;
    exampleSentenceEn: string;
    exampleSentenceVi: string;
    articulatoryTipVi: string;
  }
> = {
  mother: {
    ipa: "ˈmʌð.ər",
    partOfSpeech: "noun",
    definitionVi: "Mẹ, người mẹ, tình mẫu tử.",
    exampleSentenceEn: "My mother is very kind and patient.",
    exampleSentenceVi: "Mẹ tôi rất nhân hậu và kiên nhẫn.",
    articulatoryTipVi: "Ngậm môi tạo âm mũi /m/, mở khẩu hình tự nhiên cho nguyên âm ngắn /ʌ/, đặt lưỡi giữa hai răng cho âm hữu thanh /ð/.",
  },
  happy: {
    ipa: "ˈhæp.i",
    partOfSpeech: "adjective",
    definitionVi: "Hạnh phúc, vui sướng, cảm thấy mãn nguyện.",
    exampleSentenceEn: "I feel very happy today.",
    exampleSentenceVi: "Hôm nay tôi cảm thấy rất hạnh phúc.",
    articulatoryTipVi: "Bật hơi ấm từ họng cho /h/, hạ hàm mở rộng cho nguyên âm bẹt /æ/, mím môi bật nhanh /p/.",
  },
  father: {
    ipa: "ˈfɑː.ðər",
    partOfSpeech: "noun",
    definitionVi: "Cha, bố, người cha trong gia đình.",
    exampleSentenceEn: "My father is a hardworking person.",
    exampleSentenceVi: "Bố tôi là một người làm việc chăm chỉ.",
    articulatoryTipVi: "Răng trên chạm môi dưới cho /f/, mở miệng sâu cho /ɑː/, đặt lưỡi giữa răng cho /ð/.",
  },
  brother: {
    ipa: "ˈbrʌð.ər",
    partOfSpeech: "noun",
    definitionVi: "Anh trai, em trai.",
    exampleSentenceEn: "My brother plays football very well.",
    exampleSentenceVi: "Anh trai tôi chơi bóng đá rất giỏi.",
    articulatoryTipVi: "Bật môi cho /b/ kết hợp uốn lưỡi /r/, nguyên âm /ʌ/ mở tự nhiên, kẹp nhẹ lưỡi cho /ð/.",
  },
  run: {
    ipa: "/rʌn/",
    partOfSpeech: "verb",
    definitionVi: "Chạy, di chuyển nhanh bằng chân; vận hành, hoạt động.",
    exampleSentenceEn: "I run in the park every morning.",
    exampleSentenceVi: "Tôi chạy bộ trong công viên mỗi buổi sáng.",
    articulatoryTipVi: "Đầu lưỡi cong nhẹ về phía sau cho âm /r/, mở miệng tự nhiên phát âm nguyên âm ngắn /ʌ/, nâng đầu lưỡi chạm nướu cho âm mũi /n/.",
  },
  beautiful: {
    ipa: "/ˈbjuː.tɪ.fəl/",
    partOfSpeech: "adjective",
    definitionVi: "Xinh đẹp, tuyệt đẹp, mang lại sự dễ chịu cho thị giác hoặc tâm hồn.",
    exampleSentenceEn: "It is a beautiful morning today.",
    exampleSentenceVi: "Hôm nay là một buổi sáng tuyệt đẹp.",
    articulatoryTipVi: "Bật nhẹ âm /b/, chuyển sang âm trượt /j/ kết hợp nguyên âm dài /uː/, thả lỏng cho các âm tiết sau.",
  },
  articulation: {
    ipa: "/ɑːˌtɪk.jəˈleɪ.ʃən/",
    partOfSpeech: "noun",
    definitionVi: "Sự phát âm rõ ràng, chuẩn xác các âm vị trong giao tiếp.",
    exampleSentenceEn: "Clear articulation is vital for effective presentations.",
    exampleSentenceVi: "Phát âm rõ ràng là điều tối quan trọng đối với một bài thuyết trình hiệu quả.",
    articulatoryTipVi: "Nâng nhẹ đầu lưỡi chạm ngạc cứng cho âm /l/, mở rộng khẩu hình cho nguyên âm.",
  },
  resilience: {
    ipa: "/rɪˈzɪl.jəns/",
    partOfSpeech: "noun",
    definitionVi: "Khả năng phục hồi kiên cường sau khó khăn, nghịch cảnh.",
    exampleSentenceEn: "Courage and resilience help overcome difficult obstacles.",
    exampleSentenceVi: "Lòng can đảm và sự kiên cường giúp vượt qua các trở ngại gian nan.",
    articulatoryTipVi: "Rung dây thanh âm cho phụ âm /z/, đầu lưỡi nâng chạm gờ nướu.",
  },
  eloquent: {
    ipa: "/ˈel.ə.kwənt/",
    partOfSpeech: "adjective",
    definitionVi: "Có tài hùng biện, diễn đạt lưu loát và đầy sức thuyết phục.",
    exampleSentenceEn: "She gave an eloquent speech that moved the entire audience.",
    exampleSentenceVi: "Cô ấy đã có một bài phát biểu hùng biện lay động toàn bộ khán giả.",
    articulatoryTipVi: "Chu tròn môi chuẩn bị cho âm /w/, hạ hàm tự nhiên cho nguyên âm đầu /e/.",
  },
  ubiquitous: {
    ipa: "/juːˈbɪk.wɪ.təs/",
    partOfSpeech: "adjective",
    definitionVi: "Có mặt ở khắp mọi nơi, phổ biến cùng lúc.",
    exampleSentenceEn: "Smartphones have become ubiquitous in modern society.",
    exampleSentenceVi: "Điện thoại thông minh đã trở nên phổ biến ở khắp mọi nơi trong xã hội hiện đại.",
    articulatoryTipVi: "Bắt đầu với bán nguyên âm /j/, kéo dài âm /uː/ rồi bật nhanh tổ hợp /kw/.",
  },
  meticulous: {
    ipa: "/məˈtɪk.jə.ləs/",
    partOfSpeech: "adjective",
    definitionVi: "Tỉ mỉ, cẩn thận, chăm chút đến từng chi tiết nhỏ.",
    exampleSentenceEn: "He was meticulous about keeping his laboratory notes accurate.",
    exampleSentenceVi: "Anh ấy rất tỉ mỉ trong việc giữ cho các ghi chép phòng thí nghiệm chính xác.",
    articulatoryTipVi: "Bật dứt khoát âm /t/ sau nguyên âm lướt /ə/, đầu lưỡi gõ nhẹ vào nướu răng trên.",
  },
};

// -----------------------------------------------------------------------------

/**
 * Real-time English-to-Vietnamese translation helper using Google Translate API with timeout.
 */
export async function translateEnToVi(text: string): Promise<string | null> {
  if (!text || !text.trim()) return null;
  const trimmed = text.trim();

  // Tier 1: Google Translate API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(trimmed)}`,
      { signal: controller.signal, headers: { "User-Agent": "Mozilla/5.0" } }
    );
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = (data[0] as Array<[string, ...unknown[]]>).map((item) => item[0]).filter(Boolean).join("").trim();
        if (translated && translated.toLowerCase() !== trimmed.toLowerCase()) {
          return translated;
        }
      }
    }
  } catch {
    // fallback to Tier 2
  }

  // Tier 2: MyMemory Translation API Fallback
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=en|vi`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = (await res.json()) as { responseData?: { translatedText?: string } };
      if (data?.responseData?.translatedText) {
        const trans = data.responseData.translatedText.trim();
        if (trans && trans.toLowerCase() !== trimmed.toLowerCase()) {
          return trans;
        }
      }
    }
  } catch {
    // fallback
  }

  return null;
}

// Application Service Dependencies
// -----------------------------------------------------------------------------
export interface VocabularyServiceDependencies {
  vocabRepo: VocabularyRepository;
  defaultUserId: string;
}

const globalForVocab = globalThis as unknown as {
  __vocabRepoInstance?: VocabularyRepository;
};

let globalVocabDeps: VocabularyServiceDependencies = {
  vocabRepo: globalForVocab.__vocabRepoInstance ?? new InMemoryVocabularyRepository(),
  defaultUserId: "019488a0-7b24-789a-bcde-000000000001",
};

if (!globalForVocab.__vocabRepoInstance) {
  globalForVocab.__vocabRepoInstance = globalVocabDeps.vocabRepo;
}

export function setVocabularyDependencies(deps: Partial<VocabularyServiceDependencies>) {
  globalVocabDeps = { ...globalVocabDeps, ...deps };
}

export function getVocabularyDependencies(): VocabularyServiceDependencies {
  return globalVocabDeps;
}

// -----------------------------------------------------------------------------
// Core Vocabulary Application Service
// -----------------------------------------------------------------------------

/**
 * Datamuse API IPA lookup helper for authentic phonetic transcriptions.
 */
export async function fetchIpaFromDatamuse(word: string): Promise<string | null> {
  if (!word || !word.trim()) return null;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(word.trim())}&qe=sp&md=r&ipa=1`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const top = data.find((d: { word?: string }) => d.word?.toLowerCase() === word.toLowerCase()) || data[0];
        const ipaTag = top.tags?.find((t: string) => t.startsWith("ipa_pron:"));
        if (ipaTag) {
          const raw = ipaTag.replace("ipa_pron:", "").trim();
          if (raw) {
            return `/${raw}/`;
          }
        }
      }
    }
  } catch {
    // fallback
  }
  return null;
}


function generateDiverseShortExample(word: string, pos: string): string {
  const hash = word.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);

  if (pos === "verb") {
    const verbTemplates = [
      `We usually ${word} together on weekends.`,
      `She likes to ${word} in the morning.`,
      `They decided to ${word} early today.`,
      `You should ${word} more often.`,
      `He learned how to ${word} quickly.`,
      `I always ${word} before starting work.`,
    ];
    return verbTemplates[hash % verbTemplates.length] ?? verbTemplates[0]!;
  }

  if (pos === "adjective") {
    const adjTemplates = [
      `The weather today looks very ${word}.`,
      `This is a truly ${word} idea.`,
      `She has a really ${word} smile.`,
      `They enjoyed a ${word} evening together.`,
      `The story had a very ${word} ending.`,
      `His work was exceptionally ${word}.`,
    ];
    return adjTemplates[hash % adjTemplates.length] ?? adjTemplates[0]!;
  }

  if (pos === "adverb") {
    const advTemplates = [
      `She explained the lesson very ${word}.`,
      `He finished his work quite ${word}.`,
      `They walked ${word} through the quiet park.`,
      `Please speak ${word} so everyone hears.`,
      `The train arrived surprisingly ${word}.`,
    ];
    return advTemplates[hash % advTemplates.length] ?? advTemplates[0]!;
  }

  const nounTemplates = [
    `The new ${word} is on the table.`,
    `She showed me her favorite ${word}.`,
    `We need a reliable ${word} today.`,
    `He bought a very nice ${word}.`,
    `This ${word} helps us solve the problem.`,
    `They found a curious ${word} outside.`,
    `I use this ${word} almost every day.`,
  ];
  return nounTemplates[hash % nounTemplates.length] ?? nounTemplates[0]!;
}


/**
 * British RP (Received Pronunciation) IPA fetcher via Wiktionary API.
 */
export async function fetchBritishRpIpaFromWiktionary(word: string): Promise<string | null> {
  if (!word || !word.trim()) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(
      `https://en.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(word.toLowerCase().trim())}&prop=wikitext&format=json`,
      {
        signal: controller.signal,
        headers: { "User-Agent": "EnglishSpeakingTutor/1.0 (https://github.com/)" },
      }
    );
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const text = data.parse?.wikitext?.["*"] || "";
      // Look for RP or UK tag
      const rpMatch = text.match(/\{\{IPA\|en\|(\/[^}]+?\/)[^}]*?(?:RP|UK)/i);
      if (rpMatch && rpMatch[1]) {
        return rpMatch[1].trim().replace(/ɹ/g, "r");
      }
      const altMatch = text.match(/(?:RP|UK)[^}]*?\{\{IPA\|en\|(\/[^}]+?\/)/i);
      if (altMatch && altMatch[1]) {
        return altMatch[1].trim().replace(/ɹ/g, "r");
      }
    }
  } catch {
    // fallback
  }
  return null;
}

/**
 * Generates comprehensive articulatory and tongue placement guidance based on IPA phonemes.
 */
export function generateArticulatoryTip(word: string, ipa: string): string {
  const cleanIpa = ipa || "";
  const tips: string[] = [];

  // 1. Stress analysis
  if (cleanIpa.startsWith("/ˈ") || (cleanIpa.includes("ˈ") && cleanIpa.indexOf("ˈ") < 4)) {
    tips.push("Nhấn mạnh trọng âm vào âm tiết đầu tiên");
  } else if (cleanIpa.includes("ˈ")) {
    tips.push("Nhấn rõ trọng âm vào âm tiết có đánh dấu");
  }

  // 2. Dental consonants
  if (cleanIpa.includes("ð")) {
    tips.push("đặt đầu lưỡi chạm nhẹ cạnh dưới răng cửa trên và rung mạnh dây thanh quản cho âm /ð/");
  } else if (cleanIpa.includes("θ")) {
    tips.push("đặt đầu lưỡi nhẹ giữa hai hàm răng, đẩy luồng hơi êm không rung thanh quản cho âm /θ/");
  }

  // 3. Affricates & Sibilants
  if (cleanIpa.includes("tʃ")) {
    tips.push("đầu lưỡi áp sát gờ nướu rồi bật dứt khoát môi chu nhẹ cho âm /tʃ/");
  } else if (cleanIpa.includes("dʒ")) {
    tips.push("chu tròn môi, đầu lưỡi bật mạnh khỏi gờ nướu kết hợp rung thanh quản cho âm /dʒ/");
  } else if (cleanIpa.includes("ʃ")) {
    tips.push("chu nhẹ môi tròn, nâng thân lưỡi gần chạm ngạc cứng đẩy hơi ma sát cho âm /ʃ/");
  } else if (cleanIpa.includes("ʒ")) {
    tips.push("khẩu hình tròn môi ma sát kết hợp rung thanh quản cho âm /ʒ/");
  }

  // 4. Liquids & Glides
  if (cleanIpa.includes("r") || cleanIpa.includes("ɹ")) {
    tips.push("đầu lưỡi cong nhẹ về phía sau vòm họng không chạm ngạc cho âm /r/");
  }
  if (cleanIpa.includes("l̩") || cleanIpa.includes("l/") || cleanIpa.endsWith("l/")) {
    tips.push("nâng đầu lưỡi chạm chắc vào gờ nướu răng cửa trên cho âm kết thúc /l/");
  }
  if (cleanIpa.includes("z")) {
    tips.push("khép hờ răng, rung thanh quản tạo tiếng vo ve cho phụ âm /z/");
  }

  // 5. British RP Vowels
  if (cleanIpa.includes("ɑː")) {
    tips.push("hạ quai hàm mở rộng miệng theo chiều dọc cho nguyên âm dài /ɑː/ sâu lắng chuẩn British RP");
  } else if (cleanIpa.includes("ɔː")) {
    tips.push("chu tròn môi mở vừa phải, ngân dài nguyên âm /ɔː/ tròn trịa chuẩn Anh");
  } else if (cleanIpa.includes("ɜː")) {
    tips.push("mở miệng tự nhiên thư giãn, giữ lưỡi ở vị trí trung tâm cho nguyên âm /ɜː/");
  } else if (cleanIpa.includes("uː")) {
    tips.push("chu môi tròn nhỏ về phía trước, ngân dài nguyên âm /uː/");
  } else if (cleanIpa.includes("iː")) {
    tips.push("mở rộng khóe môi sang hai bên như cười nhẹ cho nguyên âm dài /iː/");
  } else if (cleanIpa.includes("æ")) {
    tips.push("hạ hàm mở rộng miệng sang hai bên cho nguyên âm bẹt /æ/");
  } else if (cleanIpa.includes("ʌ")) {
    tips.push("mở miệng tự nhiên vừa phải, phát âm dứt khoát nguyên âm ngắn /ʌ/");
  } else if (cleanIpa.includes("ɒ")) {
    tips.push("môi hơi tròn nhẹ, phát âm ngắn gọn dứt khoát cho âm /ɒ/ chuẩn Anh - Anh");
  }

  if (tips.length === 0) {
    return `Đặt khẩu hình tự nhiên, phát âm rõ âm đầu và nhấn đúng trọng âm của từ "${word}".`;
  }

  const capitalized = tips[0]!.charAt(0).toUpperCase() + tips[0]!.slice(1);
  if (tips.length === 1) {
    return `${capitalized}.`;
  }
  return `${capitalized}; ${tips.slice(1).join("; ")}.`;
}

export class VocabularyService {
  constructor(
    private readonly vocabRepo: VocabularyRepository = globalVocabDeps.vocabRepo,
    private readonly defaultUserId: string = globalVocabDeps.defaultUserId,
  ) {}

  /**
   * Smart Quick-Add Importer (1-Touch Enrichment).
   * Queries Free Dictionary API and merges with AI pedagogical Vietnamese translation & 3D tips.
   */
  async enrichWord(rawWord: string): Promise<QuickAddEnrichResponse> {
    const word = rawWord.trim().toLowerCase();
    if (!word) {
      throw new Error("Word cannot be empty");
    }

    // 1. Check comprehensive academic dictionary first
    const academicEntry = lookupAcademicDictionary(word);
    const cached = academicEntry || LOCAL_FALLBACK_DICTIONARY[word];

    let phonetic = cached?.ipa ? (cached.ipa.startsWith("/") ? cached.ipa : `/${cached.ipa}/`) : "";
    let partOfSpeech = cached?.partOfSpeech || "noun";
    let definitionVi = cached?.definitionVi || "";
    let exampleEn = cached?.exampleSentenceEn || "";
    let exampleVi = cached?.exampleSentenceVi || "";
    let tipVi = cached?.articulatoryTipVi || "";
    let audioUrl: string | null = null;

    // 1b. Check British RP from Wiktionary
    if (!phonetic) {
      const wiktionaryRp = await fetchBritishRpIpaFromWiktionary(word);
      if (wiktionaryRp) {
        phonetic = wiktionaryRp;
      }
    }

    // 2. Fetch Free Dictionary API for native pronunciation audio and extra definitions
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          for (const entry of data) {
            const phonetics = (entry.phonetics || []) as Array<{ text?: string; audio?: string }>;

            // Find British UK RP phonetic text
            if (!phonetic) {
              const ukAudioP = phonetics.find((p) => p.audio?.includes("-uk") && p.text?.trim());
              const rpTextP = phonetics.find((p) => p.text && (p.text.includes("ɑː") || p.text.includes("ɔː") || p.text.includes("ɜː") || (p.text.endsWith("ə/") && !p.text.includes("ɚ"))));
              const nonUsP = phonetics.find((p) => p.text && !p.audio?.includes("-us") && !p.text.includes("ɚ") && !p.text.includes("ɝ"));
              const anyP = phonetics.find((p) => p.text && p.text.trim().length > 0);
              const target = ukAudioP || rpTextP || nonUsP || anyP;
              if (target?.text) {
                const clean = target.text.replace(/^\/+|\/+$/g, "").replace(/ɹ/g, "r").trim();
                if (clean) phonetic = `/${clean}/`;
              } else if (entry.phonetic) {
                const clean = entry.phonetic.replace(/^\/+|\/+$/g, "").replace(/ɹ/g, "r").trim();
                if (clean) phonetic = `/${clean}/`;
              }
            }

            // Find UK audio URL
            if (!audioUrl) {
              const ukAudio = phonetics.find((p) => p.audio?.includes("-uk") && p.audio.length > 0);
              const anyAudio = phonetics.find((p) => p.audio && p.audio.length > 0);
              const targetAudio = ukAudio || anyAudio;
              if (targetAudio?.audio) {
                audioUrl = targetAudio.audio;
              }
            }

            if (entry.meanings && entry.meanings.length > 0) {
              const primaryMeaning = entry.meanings[0];
              if (!partOfSpeech || partOfSpeech === "noun") {
                partOfSpeech = primaryMeaning.partOfSpeech || partOfSpeech;
              }
              const def = primaryMeaning.definitions?.[0];
              if (def?.definition && !definitionVi) {
                const defVi = await translateEnToVi(def.definition);
                if (defVi) {
                  definitionVi = defVi;
                }
              }
              if (def?.example && !exampleEn && def.example.split(" ").length <= 8) {
                exampleEn = def.example;
                const transEx = await translateEnToVi(def.example);
                exampleVi = transEx || `Ví dụ sử dụng từ "${word}".`;
              }
            }
          }
        }
      }
    } catch {
      // Free Dictionary API timeout or offline - gracefully proceed
    }

    // 3. Fallback to Datamuse if still no phonetic
    if (!phonetic) {
      const dmIpa = await fetchIpaFromDatamuse(word);
      if (dmIpa) {
        phonetic = dmIpa.replace(/ɹ/g, "r");
      }
    }

    if (!phonetic) {
      phonetic = `/${word}/`;
    }

    // If definitionVi is not available from cached/academic dictionary, translate directly
    if (!definitionVi) {
      const wordTrans = await translateEnToVi(word);
      if (wordTrans && wordTrans.toLowerCase() !== word.toLowerCase()) {
        definitionVi = wordTrans;
      } else {
        definitionVi = `Nghĩa của từ "${word}" (${partOfSpeech})`;
      }
    }

    // Requirement 9: Generate short, concise, easy-to-read example sentences (5-8 words)
    if (!exampleEn) {
      exampleEn = generateDiverseShortExample(word, partOfSpeech);
      const transSentence = await translateEnToVi(exampleEn);
      exampleVi = transSentence || `Câu ví dụ chứa từ "${word}".`;
    }

    if (!tipVi || tipVi.startsWith("Đặt khẩu hình tự nhiên")) {
      tipVi = generateArticulatoryTip(word, phonetic);
    }

    return {
      word,
      ipa: phonetic,
      partOfSpeech,
      definitionVi,
      exampleSentenceEn: exampleEn,
      exampleSentenceVi: exampleVi,
      articulatoryTipVi: tipVi,
      referenceAudioUrl: audioUrl,
    };
  }

  /**
   * Batch Multi-Word Importer.
   * Splits up to 20 words from text blob, dedupes, enriches, and stores in the chosen deck.
   */
  async batchImport(params: {
    deckId: string;
    rawText: string;
    userId?: string;
  }): Promise<BatchImportResponse> {
    const userId = params.userId ?? this.defaultUserId;
    const { deckId, rawText } = params;

    // Split words by commas, newlines, semicolons, or numbered list bullets (e.g. "1. apple, 2. banana")
    const rawTokens = rawText
      .split(/[\r\n,;]+|\b\d+[\.\)]\s*/)
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0 && /^[a-z\s-]+$/i.test(t));

    // Deduplicate
    const uniqueTokens = Array.from(new Set(rawTokens)).slice(0, 20);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const token of uniqueTokens) {
      try {
        const enriched = await this.enrichWord(token);
        const item = await this.vocabRepo.createItem({
          deckId,
          userId,
          word: enriched.word,
          ipa: enriched.ipa,
          partOfSpeech: enriched.partOfSpeech,
          definitionVi: enriched.definitionVi,
          exampleSentenceEn: enriched.exampleSentenceEn,
          exampleSentenceVi: enriched.exampleSentenceVi,
          articulatoryTipVi: enriched.articulatoryTipVi,
          referenceAudioUrl: enriched.referenceAudioUrl,
        });

        results.push({
          word: token,
          status: "success" as const,
          item,
          errorMessage: null,
        });
        successCount++;
      } catch (err: unknown) {
        const error = err as Error;
        results.push({
          word: token,
          status: "error" as const,
          item: null,
          errorMessage: error.message || "Failed to enrich word",
        });
        errorCount++;
      }
    }

    return {
      totalProcessed: uniqueTokens.length,
      successCount,
      errorCount,
      results,
    };
  }

  /**
   * Speaking-Verified Flashcard Review Execution.
   * Enforces 3-Level Anki Transitions or score-based threshold (score >= 8000 bp).
   */
  async submitSpeakingReview(params: {
    vocabularyItemId: string;
    idempotencyKey: string;
    pronunciationScoreBp: number;
    audioDurationMs: number;
    reviewLevel?: ReviewLevel;
    userId?: string;
  }): Promise<FlashcardReviewResult> {
    const userId = params.userId ?? this.defaultUserId;
    const { vocabularyItemId, idempotencyKey, pronunciationScoreBp, reviewLevel } = params;

    const item = await this.vocabRepo.findItemById(vocabularyItemId);
    if (!item) {
      throw new Error(`Vocabulary item not found: ${vocabularyItemId}`);
    }

    let isPassed: boolean;
    let qualityGrade: number;
    let repetitionCountAfter: number;
    let intervalDaysAfter: number;
    let easeFactorAfterBp: number;
    let nextReviewDate: Date;
    let xpAwarded: bigint;
    let feedbackVi: string;
    let masteryLevel: 1 | 2 | 3;

    if (reviewLevel) {
      // User explicitly selected 3-Level Anki button: Again (Level 1) | Good (Level 2) | Easy (Level 3)
      const levelRes = calculateSm2Level({
        level: reviewLevel,
        repetitionCount: item.sm2Repetition,
        intervalDays: item.sm2IntervalDays,
        easeFactorBp: item.sm2EaseFactorBp,
      });

      isPassed = levelRes.isPassed;
      qualityGrade = reviewLevel === "again" ? 2 : reviewLevel === "easy" ? 5 : 4;
      repetitionCountAfter = levelRes.repetitionCount;
      intervalDaysAfter = levelRes.intervalDays;
      easeFactorAfterBp = levelRes.easeFactorBp;
      nextReviewDate = levelRes.nextReviewDate;
      xpAwarded = BigInt(levelRes.xpAwarded);
      feedbackVi = levelRes.feedbackVi;
      masteryLevel = levelRes.levelNumber;
    } else {
      // Automated SM-2 grade calculation from pronunciation score
      qualityGrade = calculateQualityFromScore(pronunciationScoreBp);
      const sm2Result = calculateSm2({
        qualityGrade,
        repetitionCount: item.sm2Repetition,
        intervalDays: item.sm2IntervalDays,
        easeFactorBp: item.sm2EaseFactorBp,
      });

      isPassed = sm2Result.isPassed;
      repetitionCountAfter = sm2Result.repetitionCount;
      intervalDaysAfter = sm2Result.intervalDays;
      easeFactorAfterBp = sm2Result.easeFactorBp;
      nextReviewDate = sm2Result.nextReviewDate;
      xpAwarded = calculateXpFromQuality(qualityGrade);
      masteryLevel = pronunciationScoreBp >= 9000 ? 3 : pronunciationScoreBp >= 8000 ? 2 : 1;

      feedbackVi = isPassed
        ? `Phát âm chuẩn xác (${Math.round(pronunciationScoreBp / 100)}/100)! Thẻ đã được công nhận ghi nhớ và tăng khoảng cách ôn tập lên ${intervalDaysAfter} ngày (+${xpAwarded} XP).`
        : `Phát âm chưa đạt (${Math.round(pronunciationScoreBp / 100)}/100 < 80). Thẻ cần được luyện nói lại vào ngày mai để đảm bảo phản xạ nói chuẩn xác.`;
    }

    // 2. Prepare transaction record
    const updatedItemProps: Partial<VocabularyItem> & { id: string } = {
      id: item.id,
      sm2Repetition: repetitionCountAfter,
      sm2IntervalDays: intervalDaysAfter,
      sm2EaseFactorBp: easeFactorAfterBp,
      sm2NextReviewAt: nextReviewDate.toISOString(),
      sm2LastReviewedAt: new Date().toISOString(),
      lastMasteryScoreBp: pronunciationScoreBp,
      isMastered: reviewLevel ? reviewLevel === "easy" : isPassed,
      masteryAttemptsCount: item.masteryAttemptsCount + 1,
    };

    const reviewRecord = {
      vocabularyItemId: item.id,
      userId,
      idempotencyKey,
      qualityGrade,
      pronunciationScoreBp,
      isPassed,
      intervalDaysBefore: item.sm2IntervalDays,
      intervalDaysAfter,
      easeFactorBeforeBp: item.sm2EaseFactorBp,
      easeFactorAfterBp,
      xpAwarded,
    };

    const txResult = await this.vocabRepo.saveFlashcardReviewTransaction({
      review: reviewRecord,
      updatedItem: updatedItemProps,
    });

    return {
      reviewId: txResult.reviewId,
      vocabularyItemId: item.id,
      qualityGrade,
      pronunciationScoreBp,
      isPassed,
      repetitionCountAfter,
      intervalDaysAfter,
      easeFactorAfterBp,
      nextReviewAt: nextReviewDate.toISOString(),
      xpAwarded: Number(xpAwarded),
      feedbackVi,
      masteryLevel,
    };
  }

  async createDeck(params: {
    name: string;
    description?: string | null;
    tags?: string[];
    isDefault?: boolean;
    userId?: string;
  }): Promise<VocabularyDeck> {
    const userId = params.userId ?? this.defaultUserId;
    return this.vocabRepo.createDeck({
      userId,
      name: params.name,
      description: params.description ?? null,
      tags: params.tags ?? [],
      isDefault: params.isDefault ?? false,
    });
  }

  /**
   * Generates Listening Multiple-Choice Quiz Questions for a Deck.
   */
  async getListeningQuiz(deckId?: string, limit: number = 5): Promise<ListeningQuizQuestion[]> {
    const items = await this.getItems(deckId);
    if (items.length === 0) {
      return [];
    }

    // Shuffle items
    const shuffled = [...items].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, limit);

    return selected.map((item) => {
      // Pick 3 distractor words from other items, or generate fallback distractors
      const otherWords = items
        .filter((i) => i.id !== item.id)
        .map((i) => i.word)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      const fallbackPool = ["fluent", "articulation", "confidence", "resilience", "eloquent", "ubiquitous"];
      while (otherWords.length < 3) {
        const candidate = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
        if (candidate && candidate !== item.word && !otherWords.includes(candidate)) {
          otherWords.push(candidate);
        }
      }

      const options = [item.word, ...otherWords].sort(() => 0.5 - Math.random());

      return {
        id: crypto.randomUUID(),
        targetWord: item.word,
        ipa: item.ipa,
        audioUrl: item.referenceAudioUrl,
        definitionVi: item.definitionVi,
        options,
        correctAnswer: item.word,
      };
    });
  }

  /**
   * Generates Fill-in-the-Blank Cloze Spelling Questions for a Deck.
   */
  async getClozeSpellingQuiz(deckId?: string, limit: number = 5): Promise<ClozeSpellingQuestion[]> {
    const items = await this.getItems(deckId);
    if (items.length === 0) {
      return [];
    }

    const shuffled = [...items].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, limit);

    return selected.map((item) => {
      // Replace target word in exampleSentenceEn with '_____'
      const regex = new RegExp(`\\b${item.word}\\b`, "gi");
      let sentenceWithBlank = item.exampleSentenceEn.replace(regex, "_____");

      if (!sentenceWithBlank.includes("_____")) {
        // If word wasn't matched directly, append blank placeholder
        sentenceWithBlank = `Fill in the blank: [ _____ ] - ${item.exampleSentenceEn}`;
      }

      return {
        id: crypto.randomUUID(),
        targetWord: item.word,
        sentenceWithBlank,
        sentenceVi: item.exampleSentenceVi,
        hintIpa: item.ipa,
        hintDefinitionVi: item.definitionVi,
        audioUrl: item.referenceAudioUrl ?? null,
      };
    });
  }

  /**
   * Generates Speed Matching Quiz Pairs for a Deck.
   */
  async getMatchingQuiz(deckId?: string, pairCount: number = 6): Promise<MatchingQuizPair[]> {
    const items = await this.getItems(deckId);
    if (items.length === 0) return [];
    const shuffled = [...items].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, pairCount);
    return selected.map((item) => ({
      id: item.id,
      word: item.word,
      definitionVi: item.definitionVi,
      audioUrl: item.referenceAudioUrl,
    }));
  }

  /**
   * Generates Contextual Sentence Practice Items for a Deck.
   */
  async getSentencePracticeList(deckId?: string, limit: number = 5): Promise<SentencePracticeItem[]> {
    const items = await this.getItems(deckId);
    if (items.length === 0) return [];
    const shuffled = [...items].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, limit);
    return selected.map((item) => ({
      id: item.id,
      word: item.word,
      ipa: item.ipa,
      sentenceEn: item.exampleSentenceEn,
      sentenceVi: item.exampleSentenceVi,
      audioUrl: item.referenceAudioUrl,
    }));
  }

  /**
   * Generates Vietnamese-to-English Recall Questions for a Deck.
   */
  async getVietnameseToEnglishQuiz(deckId?: string, limit: number = 5): Promise<VietnameseToEnglishQuestion[]> {
    const items = await this.getItems(deckId);
    if (items.length === 0) return [];
    const shuffled = [...items].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, limit);
    return selected.map((item) => ({
      id: item.id,
      targetWord: item.word,
      ipa: item.ipa,
      definitionVi: item.definitionVi,
      partOfSpeech: item.partOfSpeech,
      hintFirstLetter: item.word.charAt(0).toUpperCase(),
      audioUrl: item.referenceAudioUrl,
    }));
  }

  /**
   * Retrieves the Top 10 Trouble Words (mispronounced or error prone).
   */
  async getTroubleWords(limit: number = 10, userId?: string): Promise<TroubleWordItem[]> {
    const items = await this.vocabRepo.findTroubleWords(userId ?? this.defaultUserId, limit);
    return items.map((item) => ({
      id: item.id,
      word: item.word,
      ipa: item.ipa,
      definitionVi: item.definitionVi,
      lastMasteryScoreBp: item.lastMasteryScoreBp,
      masteryAttemptsCount: item.masteryAttemptsCount,
      audioUrl: item.referenceAudioUrl,
    }));
  }

  /**
   * Manually sets the level of a vocabulary item ("new" | "learning" | "mastered").
   */
  async setItemLevel(itemId: string, level: ManualVocabularyLevel): Promise<VocabularyItem> {
    return this.vocabRepo.updateItemLevel(itemId, level);
  }

  /**
   * Deletes a vocabulary item permanently.
   */
  async deleteDeck(deckId: string, userId?: string): Promise<boolean> {
    const uid = userId ?? this.defaultUserId;
    return this.vocabRepo.deleteDeck(deckId, uid);
  }

  async deleteItem(itemId: string, userId?: string): Promise<boolean> {
    const uid = userId ?? this.defaultUserId;
    return this.vocabRepo.deleteItem(itemId, uid);
  }

  async getDecks(userId?: string): Promise<VocabularyDeck[]> {
    return this.vocabRepo.findDecksByUserId(userId ?? this.defaultUserId);
  }

  async getItems(deckId?: string, userId?: string): Promise<VocabularyItem[]> {
    const uid = userId ?? this.defaultUserId;
    if (deckId === "today" || deckId === "system:today") {
      const all = await this.vocabRepo.findItemsByUserId(uid);
      const today = new Date();
      return all.filter((it) => {
        const d = new Date(it.createdAt);
        return (
          d.getFullYear() === today.getFullYear() &&
          d.getMonth() === today.getMonth() &&
          d.getDate() === today.getDate()
        );
      });
    }
    if (deckId === "due" || deckId === "system:due") {
      return this.vocabRepo.findDueReviewItems(uid);
    }
    if (deckId) {
      return this.vocabRepo.findItemsByDeckId(deckId);
    }
    return this.vocabRepo.findItemsByUserId(uid);
  }

  async getDueCards(userId?: string): Promise<VocabularyItem[]> {
    return this.vocabRepo.findDueReviewItems(userId ?? this.defaultUserId);
  }

  async getMetrics(userId?: string): Promise<VocabularyMetrics> {
    return this.vocabRepo.getMetrics(userId ?? this.defaultUserId);
  }
}
