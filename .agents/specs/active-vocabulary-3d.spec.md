# ĐẶC TẢ KỸ THUẬT: TỪ VỰNG PHẢN XẠ NÓI & THẺ 3D (ACTIVE VOCABULARY & SPEAKING MASTERY 3D)

- **Mã tính năng:** `FEAT-ACTIVE-VOCABULARY-3D`
- **Phiên bản:** `1.0.0`
- **Trạng thái:** `APPROVED`
- **Tác giả:** Principal Systems Architect & Speech AI Specialist
- **Mục tiêu:** Cung cấp phân hệ Luyện Từ Vựng Phản Xạ Nói Đa Giác Quan toàn diện kết hợp thuật toán lặp lại ngắt quãng (Spaced Repetition SM-2), gồm:
  1. **Nhập Từ Thông Minh 1-Chạm (Smart Quick-Add Importer):** Nhập 1 từ $\rightarrow$ Tự động tích hợp Free Dictionary API (IPA chuẩn, audio bản xứ) + Ollama Llama 3.1 8B (nghĩa tiếng Việt súc tích, câu ngữ cảnh thực tế, mẹo khẩu hình 3D).
  2. **Chế Độ Nhập Thủ Công & Nhập Hàng Loạt (Manual & Batch Import):** Hỗ trợ tinh chỉnh định nghĩa cá nhân hóa và ném danh sách đến 20 từ để AI tự động phân tích bóc tách đồng thời.
  3. **Thẻ Từ Vựng Đa Giác Quan (3D Spaced Repetition Flashcards):** Thuật toán SM-2 chuẩn mực tính theo số nguyên Basis Points, lật thẻ 3D GSAP/Motion, âm thanh British RP và cử động khoang miệng 3D.
  4. **Cơ Chế "Phát Âm Đúng Mới Tính Là Thuộc" (Speaking-Verified Mastery Loop):** Người học bắt buộc bấm mic phát âm đúng từ vựng đạt $\ge 8000$ Basis Points ($\ge 80.00\%$) thì thẻ mới được công nhận đã thuộc và đẩy lịch ôn tập ngắt quãng sang chu kỳ tiếp theo; thưởng XP vào sổ cái bất biến `xp_ledger`.

---

## 1. USER STORIES & TIÊU CHÍ CHẤP NHẬN (ACCEPTANCE CRITERIA)

### US-1: Nhập Từ Thông Minh 1-Chạm (Smart Quick-Add Importer)
- **User Story:** Là một học viên tiếng Anh, tôi muốn gõ nhanh một từ vựng mới và hệ thống tự động tìm phiên âm IPA, tạo nghĩa tiếng Việt, câu ví dụ và mẹo phát âm mà tôi không phải copy-paste thủ công từ nhiều từ điển.
- **AC-1.1 (Truy Vấn Free Dictionary API):**
  - **Given:** Người học nhập từ `word` (ví dụ: `"articulation"`).
  - **When:** Hệ thống kích hoạt API làm giàu dữ liệu từ vựng.
  - **Then:**
    - Gửi request đến `https://api.dictionaryapi.dev/api/v2/entries/en/{word}` với SLA timeout budget là 2500ms.
    - Trích xuất: Phiên âm IPA chuẩn quốc tế (`phonetic`), từ loại (`partOfSpeech`), định nghĩa gốc tiếng Anh.
- **AC-1.2 (Làm Giàu Nghĩa Tiếng Việt & Mẹo 3D Qua Llama 3.1 8B):**
  - **Given:** Dữ liệu thô từ từ điển hoặc từ vựng hợp lệ.
  - **When:** Backend gọi AI Engine (Ollama Llama 3.1 8B).
  - **Then:**
    - Trả về JSON có cấu trúc строго:
      - `definitionVi`: Định nghĩa tiếng Việt ngắn gọn, đúng ngữ cảnh giao tiếp (tối đa 120 ký tự).
      - `exampleSentenceEn`: Câu ví dụ tự nhiên chứa từ vựng.
      - `exampleSentenceVi`: Bản dịch tiếng Việt chuẩn xác của câu ví dụ.
      - `articulatoryTipVi`: Hướng dẫn cụ thể cách đặt lưỡi, mở hàm, luồng hơi cho âm khó nhất trong từ (tối đa 150 ký tự).
- **AC-1.3 (Tự Động Sinh Audio British RP Chuẩn Mực):**
  - **Given:** Từ vựng đã được phân tích.
  - **When:** Hệ thống tạo thẻ từ.
  - **Then:** Tạo audio chuẩn British RP (`en-GB-SoniaNeural`) thông qua `edge-tts` và lưu URL/Base64 để học viên nghe mẫu chuẩn giọng Anh bất cứ lúc nào.
- **AC-1.4 (Khả Năng Chống Lỗi & Fallback):**
  - Nếu Free Dictionary API bị lỗi mạng hoặc từ không có trong từ điển, Llama 3.1 8B tự động suy luận IPA và tạo toàn bộ thông tin với cơ chế fallback dự phòng 100%.

---

### US-2: Chế Độ Nhập Thủ Công & Nhập Hàng Loạt (Manual & Batch Import)
- **User Story:** Là một người học có phong cách riêng, tôi muốn tự biên tập định nghĩa theo ý mình hoặc nhập cả danh sách từ vựng từ tài liệu IELTS/TOEIC để hệ thống tự động xử lý hàng loạt.
- **AC-2.1 (Nhập & Chỉnh Sửa Thủ Công - Manual Customization):**
  - Người dùng có thể tùy biến toàn bộ các trường: Từ vựng, phiên âm IPA, từ loại, nghĩa tiếng Việt, câu ví dụ và gắn nhãn chủ đề (`tags` như `IELTS`, `Business`, `Daily`).
- **AC-2.2 (Nhập Hàng Loạt - Batch Multi-Word Extraction):**
  - **Given:** Một đoạn văn bản chứa danh sách từ (tối đa 20 từ), ngăn cách bằng dấu phẩy, xuống dòng, hoặc đánh số thứ tự (ví dụ: `1. eloquent, 2. resilience, 3. meticulously`).
  - **When:** Người dùng dán vào ô Batch Import và bấm "Bóc Tách & Tạo Thẻ Hàng Loạt".
  - **Then:**
    - Hệ thống tự động chuẩn hóa, loại bỏ ký tự rác, lọc từ trùng lặp (`deduplication`).
    - Thực hiện pipeline bóc tách song song có kiểm soát luồng (`concurrency: 3`) để không làm nghẽn AI Engine.
    - Trả về danh sách thẻ đã hoàn thiện, cho phép người dùng xem lại trước khi lưu vĩnh viễn vào bộ thẻ (Deck).

---

### US-3: Thẻ Từ Vựng Đa Giác Quan SM-2 (3D Spaced Repetition Flashcards)
- **User Story:** Là một người học cần ghi nhớ lâu dài, tôi muốn ôn tập từ vựng theo phương pháp lặp lại ngắt quãng (Spaced Repetition) với thẻ lật 3D sinh động, kết hợp tai nghe - mắt thấy khẩu hình miệng 3D.
- **AC-3.1 (Toán Học Thuật Toán SuperMemo SM-2 Chuẩn Integer Basis Points):**
  - **Mô hình trạng thái thẻ:**
    - Số lần lặp liên tiếp thành công: `repetition_count` (nguyên $\ge 0$).
    - Khoảng cách ôn tập: `interval_days` (nguyên $\ge 1$).
    - Hệ số dễ (Ease Factor): `ease_factor_bp` (nguyên basis points, mặc định $EF_0 = 2500$ tương đương 2.50, giới hạn sàn $EF_{min} = 1300$ tương đương 1.30).
  - **Công thức cập nhật khi có điểm đánh giá chất lượng $q \in \{0, 1, 2, 3, 4, 5\}$:**
    $$\Delta EF = 1000 - (5 - q) \times (800 + (5 - q) \times 200)$$
    $$EF' = \max(1300, EF + \Delta EF)$$
    - Nếu $q < 3$ (Không đạt / Phát âm sai):
      $$repetition\_count' = 0, \quad interval\_days' = 1$$
    - Nếu $q \ge 3$ (Đạt chuẩn phát âm):
      - Khi $repetition\_count == 0$: $interval\_days' = 1, repetition\_count' = 1$
      - Khi $repetition\_count == 1$: $interval\_days' = 6, repetition\_count' = 2$
      - Khi $repetition\_count \ge 2$:
        $$interval\_days' = \text{round}\left(interval\_days \times \frac{EF'}{1000}\right), \quad repetition\_count' = repetition\_count + 1$$
  - **Lịch ôn tập tiếp theo (`next_review_at`):**
    $$next\_review\_at = now() + (interval\_days' \times 24 \text{ hours})$$
- **AC-3.2 (Trải Nghiệm Thẻ Lật 3D Đa Giác Quan):**
  - **Mặt Trước Thẻ (Front):** Hiển thị từ tiếng Anh cỡ lớn (`font-bold text-3xl`), huy hiệu IPA (`Charis SIL`), nút bấm nghe phát âm British RP chuẩn, gợi ý từ loại.
  - **Hiệu ứng Lật 3D (3D Flip Motion):** Lật thẻ mượt mà theo trục Y (`rotateY: 180deg`) với perspective 1200px, bóng đổ Glassmorphic.
  - **Mặt Sau Thẻ (Back):** Nghĩa tiếng Việt nổi bật, câu ví dụ song ngữ, mẹo cơ miệng và nút bấm mở **Khoang Miệng 3D Mini** xem trực quan vị trí đầu lưỡi, độ mở hàm và luồng khí của âm khó nhất.

---

### US-4: Cơ Chế "Phát Âm Đúng Mới Tính Là Thuộc" (Speaking-Verified Mastery Loop)
- **User Story:** Là một người học muốn thành thạo phản xạ nói thực chiến, tôi không muốn tự bấm "Dễ" hay "Thuộc rồi" như các app thẻ thông thường; tôi muốn hệ thống bắt buộc tôi phải phát âm chuẩn thì mới công nhận thẻ đó đã nhớ.
- **AC-4.1 (Thu Âm & Chấm Điểm Âm Vị Tại Thẻ - Zero-Footprint Voice Assessment):**
  - Học viên bấm nút micro trên thẻ và phát âm từ vựng.
  - Audio được ghi trong RAM (16kHz Mono Web Audio Blob) và gửi ngay tới endpoint chấm điểm với `targetText = word`.
  - Phân tích chi tiết từng âm vị IPA, hiển thị màu sắc phản hồi (Xanh Emerald $\ge 80\%$, Vàng Amber 60-79%, Đỏ Coral $<60\%$).
- **AC-4.2 (Ngưỡng Đo Kiểm Thuộc Từ & Quy Đổi Thang Đo $q$ Của SM-2):**
  - Điểm phát âm tổng thể: `overall_score_bp` ($0 \dots 10000$).
  - **Trường hợp Trượt (Score $< 8000$ tức $< 80.00\%$):**
    - Đặt $q = 2$.
    - Không tính là thuộc từ (`is_mastered = false`).
    - Thuật toán SM-2 lập tức reset chu kỳ về ngày 1: `repetition_count = 0`, `interval_days = 1`.
    - Thẻ chuyển sang trạng thái cảnh báo, hiển thị chi tiết âm vị sai và nút "Thử Nói Lại".
  - **Trường hợp Đạt Chuẩn (Score $8000 \dots 8999$ tức $80.00\% \dots 89.99\%$):**
    - Đặt $q = 4$ ("Phát âm tốt").
    - Đánh dấu thuộc từ (`is_mastered = true`).
    - Tăng chu kỳ lặp SM-2 theo công thức.
    - Thưởng **+15 XP** vào sổ cái bất biến `xp_ledger`.
  - **Trường hợp Xuất Sắc (Score $\ge 9000$ tức $\ge 90.00\%$):**
    - Đặt $q = 5$ ("Phát âm hoàn hảo như người bản xứ").
    - Đánh dấu thuộc từ, tăng hệ số dễ $EF$ và đẩy xa lịch ôn tập tiếp theo.
    - Thưởng **+25 XP** vào sổ cái bất biến `xp_ledger`.
- **AC-4.3 (Giao Dịch Ghi Nhận ACID & Chống Trùng Lặp):**
  - Mọi lượt ôn tập thẻ đều tạo bản ghi vào `flashcard_reviews` kèm `idempotency_key` để chống double-click gian lận điểm XP.

---

## 2. KIẾN TRÚC CƠ SỞ DỮ LIỆU POSTGRESQL 16 (SCHEMA DDL)

Tạo file migration: `database/migrations/0002_active_vocabulary.sql`.

```sql
-- =============================================================================
-- Migration 0002: Active Vocabulary & 3D Flashcards (SM-2 Spaced Repetition)
-- Target      : PostgreSQL 16
-- Conventions : UUIDv7, Integer Basis Points (0..10000), Zero-Footprint Audio
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Vocabulary Decks (Bộ Từ Vựng Theo Chủ Đề)
-- -----------------------------------------------------------------------------
CREATE TABLE vocabulary_decks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    tags TEXT[] NOT NULL DEFAULT '{}',
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    item_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_vocab_decks_user ON vocabulary_decks(user_id) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- 2. Vocabulary Items (Thẻ Từ Vựng & Trạng Thái Thuật Toán SM-2)
-- -----------------------------------------------------------------------------
CREATE TABLE vocabulary_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    deck_id UUID NOT NULL REFERENCES vocabulary_decks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    word VARCHAR(100) NOT NULL,
    ipa VARCHAR(100) NOT NULL,
    part_of_speech VARCHAR(30) NOT NULL DEFAULT 'noun',
    definition_vi TEXT NOT NULL,
    example_sentence_en TEXT NOT NULL,
    example_sentence_vi TEXT NOT NULL,
    articulatory_tip_vi TEXT,
    reference_audio_url TEXT,

    -- SM-2 Parameters (Integer Basis Points & Days)
    sm2_repetition INT NOT NULL DEFAULT 0,
    sm2_interval_days INT NOT NULL DEFAULT 1,
    sm2_ease_factor_bp INT NOT NULL DEFAULT 2500, -- 2.50
    sm2_next_review_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sm2_last_reviewed_at TIMESTAMPTZ,

    -- Speaking-Verified Mastery
    last_mastery_score_bp INT, -- 0..10000
    is_mastered BOOLEAN NOT NULL DEFAULT FALSE,
    mastery_attempts_count INT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,

    CONSTRAINT uq_deck_word UNIQUE (deck_id, word)
);

CREATE INDEX idx_vocab_items_deck ON vocabulary_items(deck_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_vocab_items_user_due ON vocabulary_items(user_id, sm2_next_review_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_vocab_items_word_trgm ON vocabulary_items USING gin (word gin_trgm_ops);

-- -----------------------------------------------------------------------------
-- 3. Flashcard Speaking Reviews History (Lịch Sử Ôn Tập Bằng Giọng Nói)
-- -----------------------------------------------------------------------------
CREATE TABLE flashcard_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    vocabulary_item_id UUID NOT NULL REFERENCES vocabulary_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    idempotency_key UUID NOT NULL,
    quality_grade INT NOT NULL CHECK (quality_grade BETWEEN 0 AND 5),
    pronunciation_score_bp INT NOT NULL CHECK (pronunciation_score_bp BETWEEN 0 AND 10000),
    is_passed BOOLEAN NOT NULL DEFAULT FALSE,

    interval_days_before INT NOT NULL,
    interval_days_after INT NOT NULL,
    ease_factor_before_bp INT NOT NULL,
    ease_factor_after_bp INT NOT NULL,

    xp_awarded BIGINT NOT NULL DEFAULT 0,
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_review_idempotency UNIQUE (user_id, idempotency_key)
);

CREATE INDEX idx_flashcard_reviews_item ON flashcard_reviews(vocabulary_item_id);
CREATE INDEX idx_flashcard_reviews_user_time ON flashcard_reviews(user_id, reviewed_at DESC);

-- Triggers for updated_at
CREATE TRIGGER trg_vocabulary_decks_updated_at BEFORE UPDATE ON vocabulary_decks FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_vocabulary_items_updated_at BEFORE UPDATE ON vocabulary_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
```

---

## 3. THIẾT KẾ DTO VÀ CONTRACT DỮ LIỆU (`src/core/dto/vocabulary.dto.ts`)

```typescript
import { z } from "zod";
import { ScoreBpSchema, DurationMsSchema } from "./shared.dto";

export const VocabularyItemSchema = z.object({
  id: z.uuid(),
  deckId: z.uuid(),
  userId: z.uuid(),
  word: z.string().min(1).max(100),
  ipa: z.string().min(1).max(100),
  partOfSpeech: z.string().min(1).max(30),
  definitionVi: z.string().min(1),
  exampleSentenceEn: z.string().min(1),
  exampleSentenceVi: z.string().min(1),
  articulatoryTipVi: z.string().nullable(),
  referenceAudioUrl: z.string().nullable(),

  sm2Repetition: z.int().min(0),
  sm2IntervalDays: z.int().min(1),
  sm2EaseFactorBp: z.int().min(1300),
  sm2NextReviewAt: z.string().datetime(),
  sm2LastReviewedAt: z.string().datetime().nullable(),

  lastMasteryScoreBp: ScoreBpSchema.nullable(),
  isMastered: z.boolean(),
  masteryAttemptsCount: z.int().min(0),

  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const QuickAddEnrichRequestSchema = z.object({
  word: z.string().trim().min(1).max(64),
});

export const QuickAddEnrichResponseSchema = z.object({
  word: z.string(),
  ipa: z.string(),
  partOfSpeech: z.string(),
  definitionVi: z.string(),
  exampleSentenceEn: z.string(),
  exampleSentenceVi: z.string(),
  articulatoryTipVi: z.string(),
  referenceAudioBase64: z.string().nullable(),
});

export const BatchImportRequestSchema = z.object({
  deckId: z.uuid(),
  rawText: z.string().min(1).max(2000), // Max 20 words
});

export const SubmitFlashcardSpeakingReviewSchema = z.object({
  vocabularyItemId: z.uuid(),
  idempotencyKey: z.uuid(),
  pronunciationScoreBp: ScoreBpSchema,
  audioDurationMs: DurationMsSchema,
});

export const FlashcardReviewResultSchema = z.object({
  reviewId: z.uuid(),
  vocabularyItemId: z.uuid(),
  qualityGrade: z.int().min(0).max(5),
  pronunciationScoreBp: ScoreBpSchema,
  isPassed: z.boolean(),
  intervalDaysAfter: z.int().min(1),
  nextReviewAt: z.string().datetime(),
  xpAwarded: z.bigint(),
  feedbackVi: z.string(),
});
```

---

## 4. BỘ MÃ NGUỒN PURE DOMAIN THUẬT TOÁN SM-2 (`src/core/domain/sm2.ts`)

```typescript
export interface Sm2Input {
  qualityGrade: number;      // 0..5 (dựa trên điểm phát âm)
  repetitionCount: number;  // 0..N
  intervalDays: number;     // Ngày hiện tại
  easeFactorBp: number;     // Basis points (1300..N, default 2500)
}

export interface Sm2Output {
  repetitionCount: number;
  intervalDays: number;
  easeFactorBp: number;
  isPassed: boolean;
}

export function calculateSm2(input: Sm2Input): Sm2Output {
  const { qualityGrade, repetitionCount, intervalDays, easeFactorBp } = input;
  const q = Math.max(0, Math.min(5, qualityGrade));

  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  // Chuyển sang basis points (* 10,000)
  const qDiff = 5 - q;
  const deltaEfBp = Math.round(1000 - qDiff * (800 + qDiff * 200));
  const newEaseFactorBp = Math.max(1300, easeFactorBp + deltaEfBp);

  if (q < 3) {
    // Phát âm không đạt (< 8000 bp): Reset về ban đầu
    return {
      repetitionCount: 0,
      intervalDays: 1,
      easeFactorBp: newEaseFactorBp,
      isPassed: false,
    };
  }

  // Phát âm đạt chuẩn (>= 8000 bp): Tiến hành ngắt quãng
  let newRepetition = repetitionCount + 1;
  let newInterval = 1;

  if (newRepetition === 1) {
    newInterval = 1;
  } else if (newRepetition === 2) {
    newInterval = 6;
  } else {
    newInterval = Math.max(1, Math.round((intervalDays * newEaseFactorBp) / 1000));
  }

  return {
    repetitionCount: newRepetition,
    intervalDays: newInterval,
    easeFactorBp: newEaseFactorBp,
    isPassed: true,
  };
}
```

---

## 5. BẢNG PHÂN RÃ CÁC GIAI ĐOẠN THỰC THI (ROADMAP)

1. **Giai đoạn 3 (Wireframe & Plan):**
   - Thiết kế giao diện Studio Từ Vựng: Hub quản lý bộ thẻ, Nút Quick-Add 1-chạm, Drawer Batch Import, Màn hình Luyện Thẻ 3D Flip có micro.
2. **Giai đoạn 4 - Lượt 1 (Backend TDD):**
   - Áp dụng Migration `0002_active_vocabulary.sql`.
   - Unit test 100% thuật toán `calculateSm2`.
   - Endpoint `/api/v1/vocabulary/enrich` trong Python AI Engine (Free Dictionary API + Llama 3.1 8B).
   - Route handlers Next.js BFF (`/api/vocabulary/...`) với ACID transaction và row-level lock.
3. **Giai đoạn 4 - Lượt 2 (Frontend Awwwards & 3D Integration):**
   - Triển khai `VocabularyFlashcard` lật 3D tương tác.
   - Micro tích hợp Web Audio trực tiếp tại thẻ, chấm điểm tức thì.
   - Thư viện quản lý từ vựng và xem biểu đồ SM-2 Retention.
4. **Giai đoạn 5 (CI Pipeline & Cloud Audit):**
   - Chạy toàn bộ test Vitest + Pytest.
   - Đẩy Pull Request duy nhất trên nhánh `feature/active-vocabulary-3d` và bàn giao Tech Lead.
