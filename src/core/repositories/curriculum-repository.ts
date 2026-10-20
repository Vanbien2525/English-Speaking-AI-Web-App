import type {
  IpaPhonemeItemDto,
  LessonCardDto,
  LessonCatalogFilterDto,
  PhonemeDetailDrawerDto,
  RelatedLessonDto,
  FocusPhonemeDto,
} from "@/core/dto/curriculum.dto";
import {
  calculateIpaStatusColor,
  calculateAverageScoreBp,
} from "@/core/services/curriculum-service";

// -----------------------------------------------------------------------------
// Domain Raw Records
// -----------------------------------------------------------------------------

export interface PhonemeRawRecord {
  id: string;
  ipaSymbol: string;
  arpabet: string | null;
  category: "monophthong" | "diphthong" | "consonant";
  isVoiced: boolean;
  placeOfArticulation: string | null;
  mannerOfArticulation: string | null;
  exampleWord: string;
  articulationGuideVi: string;
  commonVnSubstitutions: string[];
  sortOrder: number;
}

export interface LessonCategoryRawRecord {
  id: string;
  slug: string;
  titleEn: string;
  titleVi: string;
  descriptionVi: string | null;
  sortOrder: number;
}

export interface LessonRawRecord {
  id: string;
  categoryId: string;
  slug: string;
  titleEn: string;
  titleVi: string;
  descriptionVi: string | null;
  cefr: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  accent: "en-GB-RP" | "en-US-GA";
  estimatedMinutes: number;
  xpReward: number;
  tags: string[];
  isPublished: boolean;
  sortOrder: number;
  focusPhonemeIds: string[];
}

export interface UserPhonemeMasteryRawRecord {
  userId: string;
  phonemeId: string;
  attemptsCount: number;
  correctCount: number;
  scoreSumBp: bigint;
  lastPracticedAt: Date | null;
}

export interface UserLessonProgressRawRecord {
  userId: string;
  lessonId: string;
  bestScoreBp: number;
  attemptsCount: number;
  completedAt: Date | null;
}

// -----------------------------------------------------------------------------
// Curriculum Repository Interface
// -----------------------------------------------------------------------------

export interface CurriculumRepository {
  getPhonemesWithMastery(userId: string): Promise<IpaPhonemeItemDto[]>;
  getLessonsWithProgress(userId: string, filter: LessonCatalogFilterDto): Promise<LessonCardDto[]>;
  getPhonemeDetails(phonemeId: string, userId: string): Promise<PhonemeDetailDrawerDto>;
}

// -----------------------------------------------------------------------------
// Seed Data: 44 Standard International Phonetic Alphabet (IPA) Phonemes
// -----------------------------------------------------------------------------

export const SEED_PHONEMES: PhonemeRawRecord[] = [
  // --- 1. MONOPHTHONGS (12 nguyên âm đơn) ---
  {
    id: "019488a0-7b24-789a-8001-000000000001",
    ipaSymbol: "iː",
    arpabet: "IY",
    category: "monophthong",
    isVoiced: true,
    placeOfArticulation: "front",
    mannerOfArticulation: "close",
    exampleWord: "sheep",
    articulationGuideVi: "Môi mở rộng sang hai bên như đang cười mỉm, đầu lưỡi nâng cao về phía vòm miệng cứng, kéo dài âm.",
    commonVnSubstitutions: ["ɪ"],
    sortOrder: 1,
  },
  {
    id: "019488a0-7b24-789a-8001-000000000002",
    ipaSymbol: "ɪ",
    arpabet: "IH",
    category: "monophthong",
    isVoiced: true,
    placeOfArticulation: "front",
    mannerOfArticulation: "near-close",
    exampleWord: "ship",
    articulationGuideVi: "Khẩu hình mở rộng hơn /iː/ một chút, cơ miệng thư giãn thả lỏng, phát âm dứt khoát ngắn gọn.",
    commonVnSubstitutions: ["iː", "e"],
    sortOrder: 2,
  },
  {
    id: "019488a0-7b24-789a-8001-000000000003",
    ipaSymbol: "ʊ",
    arpabet: "UH",
    category: "monophthong",
    isVoiced: true,
    placeOfArticulation: "back",
    mannerOfArticulation: "near-close",
    exampleWord: "good",
    articulationGuideVi: "Môi hơi tròn hướng ra trước, gốc lưỡi nâng nhẹ, phát âm âm 'u' ngắn dứt khoát không kéo dài.",
    commonVnSubstitutions: ["uː"],
    sortOrder: 3,
  },
  {
    id: "019488a0-7b24-789a-8001-000000000004",
    ipaSymbol: "uː",
    arpabet: "UW",
    category: "monophthong",
    isVoiced: true,
    placeOfArticulation: "back",
    mannerOfArticulation: "close",
    exampleWord: "shoot",
    articulationGuideVi: "Môi tròn căng và chu ra trước như huýt sáo, gốc lưỡi nâng cao về phía vòm họng mềm, kéo dài âm.",
    commonVnSubstitutions: ["ʊ"],
    sortOrder: 4,
  },
  {
    id: "019488a0-7b24-789a-8001-000000000005",
    ipaSymbol: "e",
    arpabet: "EH",
    category: "monophthong",
    isVoiced: true,
    placeOfArticulation: "front",
    mannerOfArticulation: "close-mid",
    exampleWord: "bed",
    articulationGuideVi: "Miệng mở tự nhiên theo chiều ngang vừa phải, lưỡi đặt ở vị trí trung bình, phát âm như 'e' tiếng Việt nhưng gọn.",
    commonVnSubstitutions: ["æ", "eɪ"],
    sortOrder: 5,
  },
  {
    id: "019488a0-7b24-789a-8001-000000000006",
    ipaSymbol: "ə",
    arpabet: "AH",
    category: "monophthong",
    isVoiced: true,
    placeOfArticulation: "central",
    mannerOfArticulation: "mid",
    exampleWord: "teacher",
    articulationGuideVi: "Âm Schwa trung tính lười nhất trong tiếng Anh. Thả lỏng toàn bộ cơ mặt, mở miệng nhẹ, bật hơi ngắn.",
    commonVnSubstitutions: ["ɜː", "ʌ"],
    sortOrder: 6,
  },
  {
    id: "019488a0-7b24-789a-8001-000000000007",
    ipaSymbol: "ɜː",
    arpabet: "ER",
    category: "monophthong",
    isVoiced: true,
    placeOfArticulation: "central",
    mannerOfArticulation: "open-mid",
    exampleWord: "bird",
    articulationGuideVi: "Môi mở hờ, lưỡi giữ ở vị trí giữa khoang miệng, phát âm âm 'ơ' dài sâu từ trong cổ họng.",
    commonVnSubstitutions: ["ə", "e"],
    sortOrder: 7,
  },
  {
    id: "019488a0-7b24-789a-8001-000000000008",
    ipaSymbol: "ɔː",
    arpabet: "AO",
    category: "monophthong",
    isVoiced: true,
    placeOfArticulation: "back",
    mannerOfArticulation: "open-mid",
    exampleWord: "door",
    articulationGuideVi: "Môi tròn đều hình bầu dục, lưỡi hạ thấp và thụt nhẹ về phía sau cổ họng, ngân dài âm.",
    commonVnSubstitutions: ["ɒ", "oʊ"],
    sortOrder: 8,
  },
  {
    id: "019488a0-7b24-789a-8001-000000000009",
    ipaSymbol: "æ",
    arpabet: "AE",
    category: "monophthong",
    isVoiced: true,
    placeOfArticulation: "front",
    mannerOfArticulation: "open",
    exampleWord: "cat",
    articulationGuideVi: "Hạ hàm dưới sâu tối đa, kéo khóe môi sang hai bên, mặt trước lưỡi hạ thấp chạm chân răng cửa dưới.",
    commonVnSubstitutions: ["e", "a"],
    sortOrder: 9,
  },
  {
    id: "019488a0-7b24-789a-8001-000000000010",
    ipaSymbol: "ʌ",
    arpabet: "AH",
    category: "monophthong",
    isVoiced: true,
    placeOfArticulation: "central",
    mannerOfArticulation: "open",
    exampleWord: "up",
    articulationGuideVi: "Miệng mở tự nhiên theo chiều dọc, lưỡi hơi lùi về phía sau, phát âm âm dứt khoát tựa âm 'á'.",
    commonVnSubstitutions: ["a", "ə"],
    sortOrder: 10,
  },
  {
    id: "019488a0-7b24-789a-8001-000000000011",
    ipaSymbol: "ɑː",
    arpabet: "AA",
    category: "monophthong",
    isVoiced: true,
    placeOfArticulation: "back",
    mannerOfArticulation: "open",
    exampleWord: "far",
    articulationGuideVi: "Miệng mở rộng như khi bác sĩ khám họng, lưỡi hạ phẳng tuyệt đối dưới sàn miệng, ngân dài âm.",
    commonVnSubstitutions: ["æ", "ʌ"],
    sortOrder: 11,
  },
  {
    id: "019488a0-7b24-789a-8001-000000000012",
    ipaSymbol: "ɒ",
    arpabet: "AA",
    category: "monophthong",
    isVoiced: true,
    placeOfArticulation: "back",
    mannerOfArticulation: "open",
    exampleWord: "on",
    articulationGuideVi: "Hạ hàm dưới, môi hơi tròn nhẹ, phát âm âm 'o' ngắn dứt khoát đặc trưng của giọng Anh - Anh (RP).",
    commonVnSubstitutions: ["ɔː", "oʊ"],
    sortOrder: 12,
  },

  // --- 2. DIPHTHONGS (8 nguyên âm đôi) ---
  {
    id: "019488a0-7b24-789a-8002-000000000013",
    ipaSymbol: "ɪə",
    arpabet: "IH-ER",
    category: "diphthong",
    isVoiced: true,
    placeOfArticulation: "centring",
    mannerOfArticulation: "diphthong",
    exampleWord: "here",
    articulationGuideVi: "Bắt đầu bằng âm /ɪ/ ngắn rồi lướt mượt mà về phía âm Schwa trung tính /ə/.",
    commonVnSubstitutions: ["iː", "eə"],
    sortOrder: 13,
  },
  {
    id: "019488a0-7b24-789a-8002-000000000014",
    ipaSymbol: "eɪ",
    arpabet: "EY",
    category: "diphthong",
    isVoiced: true,
    placeOfArticulation: "closing",
    mannerOfArticulation: "diphthong",
    exampleWord: "wait",
    articulationGuideVi: "Bắt đầu với âm /e/ mở vừa, sau đó nâng hàm trượt nhẹ lên âm /ɪ/ khép dần miệng.",
    commonVnSubstitutions: ["e", "iː"],
    sortOrder: 14,
  },
  {
    id: "019488a0-7b24-789a-8002-000000000015",
    ipaSymbol: "ʊə",
    arpabet: "UH-ER",
    category: "diphthong",
    isVoiced: true,
    placeOfArticulation: "centring",
    mannerOfArticulation: "diphthong",
    exampleWord: "tourist",
    articulationGuideVi: "Bắt đầu bằng vị trí môi tròn /ʊ/ rồi thả lỏng cơ miệng trượt dần về âm /ə/.",
    commonVnSubstitutions: ["ɔː", "uː"],
    sortOrder: 15,
  },
  {
    id: "019488a0-7b24-789a-8002-000000000016",
    ipaSymbol: "ɔɪ",
    arpabet: "OY",
    category: "diphthong",
    isVoiced: true,
    placeOfArticulation: "closing",
    mannerOfArticulation: "diphthong",
    exampleWord: "boy",
    articulationGuideVi: "Bắt đầu từ âm /ɔː/ với môi tròn mở rồi trượt dần khóe môi sang hai bên tạo âm /ɪ/.",
    commonVnSubstitutions: ["oɪ"],
    sortOrder: 16,
  },
  {
    id: "019488a0-7b24-789a-8002-000000000017",
    ipaSymbol: "əʊ",
    arpabet: "OW",
    category: "diphthong",
    isVoiced: true,
    placeOfArticulation: "closing",
    mannerOfArticulation: "diphthong",
    exampleWord: "show",
    articulationGuideVi: "Âm O đặc trưng British RP: Bắt đầu từ âm trung tính /ə/ ở giữa miệng rồi chúm môi tròn về /ʊ/.",
    commonVnSubstitutions: ["oʊ", "ɔː"],
    sortOrder: 17,
  },
  {
    id: "019488a0-7b24-789a-8002-000000000018",
    ipaSymbol: "eə",
    arpabet: "EH-ER",
    category: "diphthong",
    isVoiced: true,
    placeOfArticulation: "centring",
    mannerOfArticulation: "diphthong",
    exampleWord: "hair",
    articulationGuideVi: "Mở miệng phát âm /e/ sau đó giữ nguyên lưỡi và thả lỏng chuyển về /ə/.",
    commonVnSubstitutions: ["e", "ɪə"],
    sortOrder: 18,
  },
  {
    id: "019488a0-7b24-789a-8002-000000000019",
    ipaSymbol: "aɪ",
    arpabet: "AY",
    category: "diphthong",
    isVoiced: true,
    placeOfArticulation: "closing",
    mannerOfArticulation: "diphthong",
    exampleWord: "my",
    articulationGuideVi: "Mở miệng to như phát âm /ɑː/ rồi khép dần hàm dưới chuyển nhẹ sang /ɪ/.",
    commonVnSubstitutions: ["a", "iː"],
    sortOrder: 19,
  },
  {
    id: "019488a0-7b24-789a-8002-000000000020",
    ipaSymbol: "aʊ",
    arpabet: "AW",
    category: "diphthong",
    isVoiced: true,
    placeOfArticulation: "closing",
    mannerOfArticulation: "diphthong",
    exampleWord: "cow",
    articulationGuideVi: "Mở rộng miệng phát âm /a/ rồi thu nhỏ khẩu hình tròn môi dần lại tạo âm /ʊ/.",
    commonVnSubstitutions: ["aʊ", "ɔː"],
    sortOrder: 20,
  },

  // --- 3. CONSONANTS (24 phụ âm sắp xếp theo cặp Voiced / Unvoiced) ---
  {
    id: "019488a0-7b24-789a-8003-000000000021",
    ipaSymbol: "p",
    arpabet: "P",
    category: "consonant",
    isVoiced: false,
    placeOfArticulation: "bilabial",
    mannerOfArticulation: "plosive",
    exampleWord: "pen",
    articulationGuideVi: "Hai môi mím chặt ngăn luồng khí, sau đó mở môi đột ngột bật luồng khí mạnh, không rung thanh quản.",
    commonVnSubstitutions: ["b"],
    sortOrder: 21,
  },
  {
    id: "019488a0-7b24-789a-8003-000000000022",
    ipaSymbol: "b",
    arpabet: "B",
    category: "consonant",
    isVoiced: true,
    placeOfArticulation: "bilabial",
    mannerOfArticulation: "plosive",
    exampleWord: "boat",
    articulationGuideVi: "Khẩu hình giống hệt /p/ nhưng dây thanh quản rung mạnh khi bật luồng hơi.",
    commonVnSubstitutions: ["p"],
    sortOrder: 22,
  },
  {
    id: "019488a0-7b24-789a-8003-000000000023",
    ipaSymbol: "t",
    arpabet: "T",
    category: "consonant",
    isVoiced: false,
    placeOfArticulation: "alveolar",
    mannerOfArticulation: "plosive",
    exampleWord: "tea",
    articulationGuideVi: "Đầu lưỡi chạm nướu răng trên ngăn luồng khí, sau đó bật lưỡi xuống giải phóng luồng hơi ma sát dứt khoát.",
    commonVnSubstitutions: ["th", "d"],
    sortOrder: 23,
  },
  {
    id: "019488a0-7b24-789a-8003-000000000024",
    ipaSymbol: "d",
    arpabet: "D",
    category: "consonant",
    isVoiced: true,
    placeOfArticulation: "alveolar",
    mannerOfArticulation: "plosive",
    exampleWord: "dog",
    articulationGuideVi: "Khẩu hình tương tự âm /t/ nhưng có sự rung rõ rệt của dây thanh quản.",
    commonVnSubstitutions: ["t", "đ"],
    sortOrder: 24,
  },
  {
    id: "019488a0-7b24-789a-8003-000000000025",
    ipaSymbol: "tʃ",
    arpabet: "CH",
    category: "consonant",
    isVoiced: false,
    placeOfArticulation: "palato-alveolar",
    mannerOfArticulation: "affricate",
    exampleWord: "cheese",
    articulationGuideVi: "Môi chu tròn hướng ra trước, đầu lưỡi chạm nướu rồi bật nhẹ thành luồng gió ma sát mạnh, không rung thanh.",
    commonVnSubstitutions: ["tr", "s"],
    sortOrder: 25,
  },
  {
    id: "019488a0-7b24-789a-8003-000000000026",
    ipaSymbol: "dʒ",
    arpabet: "JH",
    category: "consonant",
    isVoiced: true,
    placeOfArticulation: "palato-alveolar",
    mannerOfArticulation: "affricate",
    exampleWord: "june",
    articulationGuideVi: "Khẩu hình giống /tʃ/ nhưng dây thanh quản rung mạnh trong họng.",
    commonVnSubstitutions: ["gi", "z"],
    sortOrder: 26,
  },
  {
    id: "019488a0-7b24-789a-8003-000000000027",
    ipaSymbol: "k",
    arpabet: "K",
    category: "consonant",
    isVoiced: false,
    placeOfArticulation: "velar",
    mannerOfArticulation: "plosive",
    exampleWord: "car",
    articulationGuideVi: "Gốc lưỡi nâng chạm vòm họng mềm ngăn luồng khí, sau đó hạ gốc lưỡi giải phóng luồng hơi bật mạnh.",
    commonVnSubstitutions: ["c", "g"],
    sortOrder: 27,
  },
  {
    id: "019488a0-7b24-789a-8003-000000000028",
    ipaSymbol: "ɡ",
    arpabet: "G",
    category: "consonant",
    isVoiced: true,
    placeOfArticulation: "velar",
    mannerOfArticulation: "plosive",
    exampleWord: "go",
    articulationGuideVi: "Vị trí giống âm /k/ nhưng tạo âm thanh rung thanh quản sâu trong họng.",
    commonVnSubstitutions: ["k"],
    sortOrder: 28,
  },
  {
    id: "019488a0-7b24-789a-8003-000000000029",
    ipaSymbol: "f",
    arpabet: "F",
    category: "consonant",
    isVoiced: false,
    placeOfArticulation: "labiodental",
    mannerOfArticulation: "fricative",
    exampleWord: "fly",
    articulationGuideVi: "Răng cửa trên chạm nhẹ vào lòng môi dưới, đẩy luồng hơi ma sát qua kẽ răng, không rung thanh quản.",
    commonVnSubstitutions: ["p"],
    sortOrder: 29,
  },
  {
    id: "019488a0-7b24-789a-8003-000000000030",
    ipaSymbol: "v",
    arpabet: "V",
    category: "consonant",
    isVoiced: true,
    placeOfArticulation: "labiodental",
    mannerOfArticulation: "fricative",
    exampleWord: "video",
    articulationGuideVi: "Khẩu hình giống /f/ nhưng dây thanh rung liên tục khi đẩy hơi qua kẽ răng.",
    commonVnSubstitutions: ["f", "w"],
    sortOrder: 30,
  },
  {
    id: "019488a0-7b24-789a-8003-000000000031",
    ipaSymbol: "θ",
    arpabet: "TH",
    category: "consonant",
    isVoiced: false,
    placeOfArticulation: "dental",
    mannerOfArticulation: "fricative",
    exampleWord: "think",
    articulationGuideVi: "Đầu lưỡi đặt nhẹ giữa hai hàm răng trên và dưới, đẩy hơi ma sát nhẹ thoát ra ngoài kẽ lưỡi và răng, không rung thanh.",
    commonVnSubstitutions: ["s", "t"],
    sortOrder: 31,
  },
  {
    id: "019488a0-7b24-789a-8003-000000000032",
    ipaSymbol: "ð",
    arpabet: "DH",
    category: "consonant",
    isVoiced: true,
    placeOfArticulation: "dental",
    mannerOfArticulation: "fricative",
    exampleWord: "this",
    articulationGuideVi: "Vị trí lưỡi giữa hai hàm răng y hệt /θ/, nhưng dây thanh quản rung mạnh khi đẩy luồng hơi.",
    commonVnSubstitutions: ["d", "z"],
    sortOrder: 32,
  },
  {
    id: "019488a0-7b24-789a-8003-000000000033",
    ipaSymbol: "s",
    arpabet: "S",
    category: "consonant",
    isVoiced: false,
    placeOfArticulation: "alveolar",
    mannerOfArticulation: "fricative",
    exampleWord: "see",
    articulationGuideVi: "Hai hàm răng khép hờ gần nhau, đầu lưỡi đặt gần chân răng trên, ép luồng hơi rít sắc bén qua kẽ răng.",
    commonVnSubstitutions: ["ʃ"],
    sortOrder: 33,
  },
  {
    id: "019488a0-7b24-789a-8003-000000000034",
    ipaSymbol: "z",
    arpabet: "Z",
    category: "consonant",
    isVoiced: true,
    placeOfArticulation: "alveolar",
    mannerOfArticulation: "fricative",
    exampleWord: "zoo",
    articulationGuideVi: "Vị trí khẩu hình giống âm /s/ nhưng cổ họng rung mạnh như tiếng ve kêu.",
    commonVnSubstitutions: ["s"],
    sortOrder: 34,
  },
  {
    id: "019488a0-7b24-789a-8003-000000000035",
    ipaSymbol: "ʃ",
    arpabet: "SH",
    category: "consonant",
    isVoiced: false,
    placeOfArticulation: "palato-alveolar",
    mannerOfArticulation: "fricative",
    exampleWord: "shall",
    articulationGuideVi: "Môi chu tròn đưa về phía trước, thân lưỡi nâng cao về phía vòm họng, thở luồng hơi ma sát lớn như đang yêu cầu im lặng.",
    commonVnSubstitutions: ["s"],
    sortOrder: 35,
  },
  {
    id: "019488a0-7b24-789a-8003-000000000036",
    ipaSymbol: "ʒ",
    arpabet: "ZH",
    category: "consonant",
    isVoiced: true,
    placeOfArticulation: "palato-alveolar",
    mannerOfArticulation: "fricative",
    exampleWord: "vision",
    articulationGuideVi: "Khẩu hình giống âm /ʃ/ nhưng rung dây thanh quản rõ ràng.",
    commonVnSubstitutions: ["z", "dʒ"],
    sortOrder: 36,
  },
  {
    id: "019488a0-7b24-789a-8003-000000000037",
    ipaSymbol: "h",
    arpabet: "HH",
    category: "consonant",
    isVoiced: false,
    placeOfArticulation: "glottal",
    mannerOfArticulation: "fricative",
    exampleWord: "hat",
    articulationGuideVi: "Mở miệng tự nhiên, đẩy nhẹ một luồng hơi thở từ sâu trong thanh môn cổ họng ra ngoài.",
    commonVnSubstitutions: [""],
    sortOrder: 37,
  },
  {
    id: "019488a0-7b24-789a-8003-000000000038",
    ipaSymbol: "m",
    arpabet: "M",
    category: "consonant",
    isVoiced: true,
    placeOfArticulation: "bilabial",
    mannerOfArticulation: "nasal",
    exampleWord: "man",
    articulationGuideVi: "Ngậm hai môi nhẹ nhàng, hạ khẩu cái mềm để luồng âm thanh vang hoàn toàn qua đường mũi.",
    commonVnSubstitutions: [""],
    sortOrder: 38,
  },
  {
    id: "019488a0-7b24-789a-8003-000000000039",
    ipaSymbol: "n",
    arpabet: "N",
    category: "consonant",
    isVoiced: true,
    placeOfArticulation: "alveolar",
    mannerOfArticulation: "nasal",
    exampleWord: "now",
    articulationGuideVi: "Đầu lưỡi chạm nướu răng cửa trên chặn đường thoát miệng, âm thanh ngân thoát qua khoang mũi.",
    commonVnSubstitutions: ["l"],
    sortOrder: 39,
  },
  {
    id: "019488a0-7b24-789a-8003-000000000040",
    ipaSymbol: "ŋ",
    arpabet: "NG",
    category: "consonant",
    isVoiced: true,
    placeOfArticulation: "velar",
    mannerOfArticulation: "nasal",
    exampleWord: "sing",
    articulationGuideVi: "Gốc lưỡi nâng cao chạm ngạc mềm chặn miệng, luồng âm thanh vang thoát qua đường mũi.",
    commonVnSubstitutions: ["n", "g"],
    sortOrder: 40,
  },
  {
    id: "019488a0-7b24-789a-8003-000000000041",
    ipaSymbol: "l",
    arpabet: "L",
    category: "consonant",
    isVoiced: true,
    placeOfArticulation: "alveolar",
    mannerOfArticulation: "approximant",
    exampleWord: "leg",
    articulationGuideVi: "Đầu lưỡi chạm nướu răng trên, luồng hơi và âm thanh thoát ra hai bên cạnh lưỡi.",
    commonVnSubstitutions: ["n", "r"],
    sortOrder: 41,
  },
  {
    id: "019488a0-7b24-789a-8003-000000000042",
    ipaSymbol: "r",
    arpabet: "R",
    category: "consonant",
    isVoiced: true,
    placeOfArticulation: "post-alveolar",
    mannerOfArticulation: "approximant",
    exampleWord: "red",
    articulationGuideVi: "Môi hơi tròn nhẹ, đầu lưỡi cong nhẹ lên hướng về vòm miệng nhưng tuyệt đối không chạm ngạc.",
    commonVnSubstitutions: ["l", "w"],
    sortOrder: 42,
  },
  {
    id: "019488a0-7b24-789a-8003-000000000043",
    ipaSymbol: "w",
    arpabet: "W",
    category: "consonant",
    isVoiced: true,
    placeOfArticulation: "bilabial",
    mannerOfArticulation: "approximant",
    exampleWord: "wet",
    articulationGuideVi: "Môi chu tròn nhỏ như huýt sáo rồi mở nhanh sang hai bên chuyển vào nguyên âm kế tiếp.",
    commonVnSubstitutions: ["v"],
    sortOrder: 43,
  },
  {
    id: "019488a0-7b24-789a-8003-000000000044",
    ipaSymbol: "j",
    arpabet: "Y",
    category: "consonant",
    isVoiced: true,
    placeOfArticulation: "palatal",
    mannerOfArticulation: "approximant",
    exampleWord: "yes",
    articulationGuideVi: "Thân lưỡi nâng cao về phía ngạc cứng như đang chuẩn bị phát âm /iː/, lướt nhanh sang nguyên âm sau.",
    commonVnSubstitutions: ["dʒ", "z"],
    sortOrder: 44,
  },
];

// -----------------------------------------------------------------------------
// Seed Data: Lesson Categories & Lessons (CEFR & Vietnamese Error Taxonomy)
// -----------------------------------------------------------------------------

export const SEED_CATEGORIES: LessonCategoryRawRecord[] = [
  {
    id: "019488a0-7b24-789a-8010-000000000001",
    slug: "dental-fricatives",
    titleEn: "Dental Fricatives Masterclass",
    titleVi: "Chuyên Đề Âm Xát Răng /θ/ & /ð/",
    descriptionVi: "Đặc trị lỗi phát âm nhầm sang /s/, /t/, /d/ kinh điển của người Việt.",
    sortOrder: 1,
  },
  {
    id: "019488a0-7b24-789a-8010-000000000002",
    slug: "ending-consonants",
    titleEn: "Final Consonants & Clusters",
    titleVi: "Khắc Phục Nuốt Âm Đuôi",
    descriptionVi: "Luyện giữ âm đuôi dứt khoát -t, -d, -s, -z, -ts, -ps.",
    sortOrder: 2,
  },
  {
    id: "019488a0-7b24-789a-8010-000000000003",
    slug: "vowel-length",
    titleEn: "Vowel Length Contrasts",
    titleVi: "Cặp Nguyên Âm Dài & Ngắn",
    descriptionVi: "Phân biệt /iː/ vs /ɪ/, /uː/ vs /ʊ/, /ɔː/ vs /ɒ/.",
    sortOrder: 3,
  },
  {
    id: "019488a0-7b24-789a-8010-000000000004",
    slug: "palato-alveolar",
    titleEn: "Hushing Sounds & Affricates",
    titleVi: "Âm Uốn Lưỡi & Tắc Xát /ʃ/, /ʒ/, /tʃ/, /dʒ/",
    descriptionVi: "Luyện khẩu hình chu môi và đẩy hơi uyển chuyển.",
    sortOrder: 4,
  },
];

export const SEED_LESSONS: LessonRawRecord[] = [
  {
    id: "019488a0-7b24-789a-8020-000000000001",
    categoryId: "019488a0-7b24-789a-8010-000000000001",
    slug: "dental-fricatives-th-dh",
    titleEn: "Dental Fricatives: /θ/ vs /ð/",
    titleVi: "Phân Biệt Cặp Âm Xát Răng Think & This",
    descriptionVi: "Làm chủ vị trí đầu lưỡi kẹp nhẹ giữa hai hàm răng và phân biệt âm vô/hữu thanh.",
    cefr: "B1",
    accent: "en-GB-RP",
    estimatedMinutes: 12,
    xpReward: 50,
    tags: ["dental-fricatives", "fricatives", "b1"],
    isPublished: true,
    sortOrder: 1,
    focusPhonemeIds: [
      "019488a0-7b24-789a-8003-000000000031", // θ
      "019488a0-7b24-789a-8003-000000000032", // ð
    ],
  },
  {
    id: "019488a0-7b24-789a-8020-000000000002",
    categoryId: "019488a0-7b24-789a-8010-000000000001",
    slug: "tongue-twister-thirty-three-thieves",
    titleEn: "Tongue Twister: Thirty-Three Thieves",
    titleVi: "Thử Thách Nói Nhanh: 33 Tên Trộm",
    descriptionVi: "Câu luyện nói nổi tiếng thử thách độ dẻo dai của lưỡi với âm /θ/ liên tục.",
    cefr: "B1",
    accent: "en-GB-RP",
    estimatedMinutes: 15,
    xpReward: 60,
    tags: ["dental-fricatives", "tongue-twister", "b1"],
    isPublished: true,
    sortOrder: 2,
    focusPhonemeIds: ["019488a0-7b24-789a-8003-000000000031"], // θ
  },
  {
    id: "019488a0-7b24-789a-8020-000000000003",
    categoryId: "019488a0-7b24-789a-8010-000000000002",
    slug: "final-consonants-t-d-s",
    titleEn: "Ending Consonants: -t, -d, -s, -z",
    titleVi: "Tránh Nuốt Âm Đuôi: -t, -d, -s, -z",
    descriptionVi: "Khắc phục thói quen nuốt phụ âm cuối của người Việt giúp câu nói rõ ràng hơn.",
    cefr: "A2",
    accent: "en-GB-RP",
    estimatedMinutes: 10,
    xpReward: 40,
    tags: ["ending-consonants", "plosives", "a2"],
    isPublished: true,
    sortOrder: 3,
    focusPhonemeIds: [
      "019488a0-7b24-789a-8003-000000000023", // t
      "019488a0-7b24-789a-8003-000000000024", // d
      "019488a0-7b24-789a-8003-000000000033", // s
      "019488a0-7b24-789a-8003-000000000034", // z
    ],
  },
  {
    id: "019488a0-7b24-789a-8020-000000000004",
    categoryId: "019488a0-7b24-789a-8010-000000000003",
    slug: "vowel-contrast-long-short-i",
    titleEn: "Vowel Contrast: /iː/ vs /ɪ/ (Sheep vs Ship)",
    titleVi: "Phân Biệt Cặp Nguyên Âm /iː/ & /ɪ/",
    descriptionVi: "Tránh nhầm lẫn các từ kinh điển như sheep/ship, live/leave.",
    cefr: "A1",
    accent: "en-GB-RP",
    estimatedMinutes: 8,
    xpReward: 35,
    tags: ["vowel-length", "monophthongs", "a1"],
    isPublished: true,
    sortOrder: 4,
    focusPhonemeIds: [
      "019488a0-7b24-789a-8001-000000000001", // iː
      "019488a0-7b24-789a-8001-000000000002", // ɪ
    ],
  },
];

// -----------------------------------------------------------------------------
// In-Memory Curriculum Repository Implementation
// -----------------------------------------------------------------------------

export class InMemoryCurriculumRepository implements CurriculumRepository {
  private readonly phonemes = new Map<string, PhonemeRawRecord>();
  private readonly categories = new Map<string, LessonCategoryRawRecord>();
  private readonly lessons = new Map<string, LessonRawRecord>();
  private readonly mastery = new Map<string, UserPhonemeMasteryRawRecord>(); // key: `${userId}:${phonemeId}`
  private readonly progress = new Map<string, UserLessonProgressRawRecord>(); // key: `${userId}:${lessonId}`

  constructor() {
    // Populate default seed records
    for (const p of SEED_PHONEMES) {
      this.phonemes.set(p.id, p);
    }
    for (const c of SEED_CATEGORIES) {
      this.categories.set(c.id, c);
    }
    for (const l of SEED_LESSONS) {
      this.lessons.set(l.id, l);
    }
  }

  // Seed Helpers for Test Environments
  seedUserPhonemeMastery(
    records: Array<{
      userId: string;
      phonemeIpa: string;
      attemptsCount: number;
      correctCount: number;
      scoreSumBp: bigint;
      lastPracticedAt: Date | null;
    }>,
  ): void {
    for (const r of records) {
      const phoneme = Array.from(this.phonemes.values()).find((p) => p.ipaSymbol === r.phonemeIpa);
      if (!phoneme) continue;
      const key = `${r.userId}:${phoneme.id}`;
      this.mastery.set(key, {
        userId: r.userId,
        phonemeId: phoneme.id,
        attemptsCount: r.attemptsCount,
        correctCount: r.correctCount,
        scoreSumBp: r.scoreSumBp,
        lastPracticedAt: r.lastPracticedAt,
      });
    }
  }

  seedUserLessonProgress(
    records: Array<{
      userId: string;
      lessonSlug: string;
      bestScoreBp: number;
      attemptsCount: number;
      completedAt: Date | null;
    }>,
  ): void {
    for (const r of records) {
      const lesson = Array.from(this.lessons.values()).find((l) => l.slug === r.lessonSlug);
      if (!lesson) continue;
      const key = `${r.userId}:${lesson.id}`;
      this.progress.set(key, {
        userId: r.userId,
        lessonId: lesson.id,
        bestScoreBp: r.bestScoreBp,
        attemptsCount: r.attemptsCount,
        completedAt: r.completedAt,
      });
    }
  }

  async getPhonemesWithMastery(userId: string): Promise<IpaPhonemeItemDto[]> {
    const list = Array.from(this.phonemes.values()).sort((a, b) => a.sortOrder - b.sortOrder);

    return list.map((p) => {
      const masteryKey = `${userId}:${p.id}`;
      const record = this.mastery.get(masteryKey);

      const attemptsCount = record ? record.attemptsCount : 0;
      const correctCount = record ? record.correctCount : 0;
      const averageScoreBp = record
        ? calculateAverageScoreBp(record.scoreSumBp, record.attemptsCount)
        : null;
      const statusColor = calculateIpaStatusColor(attemptsCount, averageScoreBp);

      return {
        id: p.id,
        ipaSymbol: p.ipaSymbol,
        arpabet: p.arpabet,
        category: p.category,
        isVoiced: p.isVoiced,
        placeOfArticulation: p.placeOfArticulation,
        mannerOfArticulation: p.mannerOfArticulation,
        exampleWord: p.exampleWord,
        sortOrder: p.sortOrder,
        attemptsCount,
        correctCount,
        averageScoreBp,
        statusColor,
        lastPracticedAt: record?.lastPracticedAt ? record.lastPracticedAt.toISOString() : null,
      };
    });
  }

  async getLessonsWithProgress(
    userId: string,
    filter: LessonCatalogFilterDto,
  ): Promise<LessonCardDto[]> {
    const lessonsList = Array.from(this.lessons.values())
      .filter((l) => l.isPublished)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const filtered = lessonsList.filter((l) => {
      // CEFR level filter
      if (filter.cefr !== "all" && l.cefr !== filter.cefr) {
        return false;
      }

      // Category slug filter
      if (filter.categorySlug !== "all") {
        const cat = this.categories.get(l.categoryId);
        if (cat?.slug !== filter.categorySlug) return false;
      }

      // Vietnamese error group tag filter
      if (filter.errorGroup !== "all" && !l.tags.includes(filter.errorGroup)) {
        return false;
      }

      // Focus phoneme ID filter
      if (filter.phonemeId && !l.focusPhonemeIds.includes(filter.phonemeId)) {
        return false;
      }

      // Keyword search
      if (filter.search && filter.search.trim().length > 0) {
        const q = filter.search.toLowerCase();
        const matchesTitle =
          l.titleEn.toLowerCase().includes(q) || l.titleVi.toLowerCase().includes(q);
        const matchesTags = l.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesTags) return false;
      }

      return true;
    });

    return filtered.map((l) => {
      const category = this.categories.get(l.categoryId);
      const progressKey = `${userId}:${l.id}`;
      const progressRecord = this.progress.get(progressKey);

      const focusPhonemes: FocusPhonemeDto[] = l.focusPhonemeIds
        .map((pid) => this.phonemes.get(pid))
        .filter((p): p is PhonemeRawRecord => p !== undefined)
        .map((p) => ({ id: p.id, ipaSymbol: p.ipaSymbol }));

      return {
        id: l.id,
        slug: l.slug,
        titleEn: l.titleEn,
        titleVi: l.titleVi,
        descriptionVi: l.descriptionVi,
        cefr: l.cefr,
        estimatedMinutes: l.estimatedMinutes,
        xpReward: l.xpReward,
        tags: [...l.tags],
        categoryTitleVi: category?.titleVi ?? "Chuyên Đề Luyện Phát Âm",
        focusPhonemes,
        userProgress: progressRecord
          ? {
              bestScoreBp: progressRecord.bestScoreBp,
              attemptsCount: progressRecord.attemptsCount,
              isCompleted: progressRecord.bestScoreBp >= 8000,
              completedAt: progressRecord.completedAt ? progressRecord.completedAt.toISOString() : null,
            }
          : null,
      };
    });
  }

  async getPhonemeDetails(phonemeId: string, userId: string): Promise<PhonemeDetailDrawerDto> {
    const phoneme = this.phonemes.get(phonemeId);
    if (!phoneme) {
      throw new Error(`Phoneme not found for id: ${phonemeId}`);
    }

    const masteryKey = `${userId}:${phonemeId}`;
    const record = this.mastery.get(masteryKey);
    const attemptsCount = record ? record.attemptsCount : 0;
    const correctCount = record ? record.correctCount : 0;
    const averageScoreBp = record
      ? calculateAverageScoreBp(record.scoreSumBp, record.attemptsCount)
      : null;
    const statusColor = calculateIpaStatusColor(attemptsCount, averageScoreBp);

    // Find related lessons covering this phoneme
    const relatedLessons: RelatedLessonDto[] = Array.from(this.lessons.values())
      .filter((l) => l.isPublished && l.focusPhonemeIds.includes(phonemeId))
      .map((l) => ({
        id: l.id,
        slug: l.slug,
        titleEn: l.titleEn,
        titleVi: l.titleVi,
        cefr: l.cefr,
        xpReward: l.xpReward,
      }));

    return {
      id: phoneme.id,
      ipaSymbol: phoneme.ipaSymbol,
      arpabet: phoneme.arpabet,
      category: phoneme.category,
      isVoiced: phoneme.isVoiced,
      placeOfArticulation: phoneme.placeOfArticulation,
      mannerOfArticulation: phoneme.mannerOfArticulation,
      exampleWord: phoneme.exampleWord,
      sortOrder: phoneme.sortOrder,
      attemptsCount,
      correctCount,
      averageScoreBp,
      statusColor,
      lastPracticedAt: record?.lastPracticedAt ? record.lastPracticedAt.toISOString() : null,
      articulationGuideVi: phoneme.articulationGuideVi,
      commonVnSubstitutions: [...phoneme.commonVnSubstitutions],
      referenceVoice: "en-GB-SoniaNeural",
      relatedLessons,
    };
  }
}
