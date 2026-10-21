# KẾ HOẠCH TRIỂN KHAI: TỪ VỰNG PHẢN XẠ NÓI & THẺ 3D (ACTIVE VOCABULARY & SPEAKING MASTERY 3D)

- **Mã tính năng:** `FEAT-ACTIVE-VOCABULARY-3D`
- **Tài liệu tham chiếu:** [.agents/specs/active-vocabulary-3d.spec.md](file:///d:/English-Speaking-AI-Web-App/.agents/specs/active-vocabulary-3d.spec.md)
- **Active Branch:** `feature/active-vocabulary-3d`
- **Trọng tâm hiệu năng:** SM-2 Integer Math, In-Memory Zero-Footprint Voice Assessment, Next.js App Router SSR/SSG Shell, 3D CSS / GSAP Flip Card, LCP < 0.8s.

---

## 1. SƠ ĐỒ BỐ CỤC WIREFRAME (STUDIO TỪ VỰNG PHẢN XẠ NÓI `/vocabulary`)

```text
+------------------------------------------------------------------------------------------------------------------------+
|  [Logo AI Speaking 3D]       [Luyện Tập 3D]   [Bản Đồ IPA]   [Tiến Độ]   [Từ Vựng 3D (Active)]                         |
+------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                        |
|  [KHU VỰC 1: VOCABULARY METRICS BAR]                                                                                   |
|  +------------------------------------------------------------------------------------------------------------------+  |
|  | [📚 Tổng Số: 48 Từ]   [⏰ Cần Ôn Hôm Nay: 12 Thẻ]   [🌟 Đã Thuộc (>=80%): 36 Từ]   [📈 Tỷ Lệ Nhớ SM-2: 89.2%]    |  |
|  | [Nút: + Thêm Từ 1-Chạm]    [Nút: 📥 Nhập Hàng Loạt (Batch)]    [Nút Nổi Bật: 🚀 ÔN TẬP PHẢN XẠ NÓI (12 THẺ)]     |  |
|  +------------------------------------------------------------------------------------------------------------------+  |
|                                                                                                                        |
|  [KHU VỰC 2: KHÔNG GIAN LUYỆN THẺ 3D PHẢN XẠ NÓI (ACTIVE REVIEW ARENA)]                                                |
|  +------------------------------------------------------------------------------------------------------------------+  |
|  |                                                                                                                  |  |
|  |                 +------------------------------------------------------------------+                             |  |
|  |                 |  [Thẻ Ôn Tập 1/12]                          [Chủ đề: IELTS C1]   |                             |  |
|  |                 |                                                                  |                             |  |
|  |                 |                    articulation                                  |                             |  |
|  |                 |              /ɑːˌtɪk.jəˈleɪ.ʃən/  [noun]                         |                             |  |
|  |                 |          [🔊 Nghe Giọng BBC (edge-tts)]                          |                             |  |
|  |                 |                                                                  |                             |  |
|  |                 |  --------------------------------------------------------------  |                             |  |
|  |                 |  [MẶT SAU (LẬT 3D)]:                                             |                             |  |
|  |                 |  - Nghĩa: Sự phát âm rõ ràng, chuẩn xác các âm vị.               |                             |  |
|  |                 |  - Ví dụ: "Good articulation is vital for public speaking."       |                             |  |
|  |                 |  - Mẹo 3D: Nâng nhẹ đầu lưỡi chạm ngạc cứng cho âm /l/ và /ʃ/.   |                             |  |
|  |                 |                                                                  |                             |  |
|  |                 |  ==============================================================  |                             |  |
|  |                 |  [🎙️ BẤM MIC ĐỌC TỪ NÀY ĐỂ XÁC MINH THUỘC (CẦN >= 80 ĐIỂM)]       |                             |  |
|  |                 |  Kết quả nói: [88/100 - Emerald Pass ✅] -> SM-2: Tăng chu kỳ +6 ngày |                        |  |
|  |                 |  Thưởng: +15 XP vào Sổ Cái Bất Biến!                             |                             |  |
|  |                 +------------------------------------------------------------------+                             |  |
|  |                                                                                                                  |  |
|  +------------------------------------------------------------------------------------------------------------------+  |
|                                                                                                                        |
|  [KHU VỰC 3: BẢNG DANH MỤC TỪ VỰNG & LỊCH ÔN TẬP SM-2]                                                                 |
|  +------------------------------------------------------------------------------------------------------------------+  |
|  | [Bộ lọc: Tất cả | Cần ôn hôm nay | Đã thuộc | Chưa đạt]   [Tìm kiếm từ vựng...                           🔍]     |  |
|  | ---------------------------------------------------------------------------------------------------------------- |  |
|  |  Từ Vựng          | Phiên Âm IPA       | Nghĩa Tiếng Việt            | Chu Kỳ SM-2   | Điểm Nói Gần Nhất| Thao Tác   |  |
|  |  articulation     | /ɑːˌtɪk.jəˈleɪ.ʃən/| Khả năng phát âm rõ ràng    | 6 ngày        | 88% (Emerald)    | [🔊] [🎙️]  |  |
|  |  resilience       | /rɪˈzɪl.jəns/      | Khả năng phục hồi kiên cường| 1 ngày (Due)  | 74% (Cần Luyện)  | [🔊] [🎙️]  |  |
|  |  eloquent         | /ˈel.ə.kwənt/      | Hùng biện, lưu loát         | 15 ngày       | 94% (Mastered)   | [🔊] [🎙️]  |  |
|  +------------------------------------------------------------------------------------------------------------------+  |
+------------------------------------------------------------------------------------------------------------------------+
```

---

## 2. KẾ HOẠCH TRIỂN KHAI KỸ THUẬT THEO CÁC LƯỢT (STEP-BY-STEP EXECUTION)

### Lượt 1: Cơ Sở Dữ Liệu & Backend TDD Red-to-Green
1. **Migration PostgreSQL 16 (`database/migrations/0002_active_vocabulary.sql`):**
   - Bảng `vocabulary_decks`: Quản lý các nhóm từ vựng của người dùng.
   - Bảng `vocabulary_items`: Lưu từ vựng, IPA, định nghĩa, câu ví dụ, và toàn bộ thông số thuật toán SM-2 (`sm2_repetition`, `sm2_interval_days`, `sm2_ease_factor_bp`, `sm2_next_review_at`).
   - Bảng `flashcard_reviews`: Ghi nhận lịch sử ôn tập bằng giọng nói, biến động interval, và thưởng XP với khóa chống trùng lặp `UNIQUE(user_id, idempotency_key)`.
2. **Pure Domain SM-2 Calculator (`src/core/domain/sm2.ts`):**
   - Viết hàm `calculateSm2` tính toán chính xác bằng số nguyên Basis Points ($EF \ge 1300$, mặc định $2500$).
   - Viết bộ kiểm thử Unit Test (`tests/unit/core/sm2.test.ts`): Kiểm tra các case $q \in \{0, 1, 2, 3, 4, 5\}$, reset chu kỳ khi điểm $< 8000$, và tăng interval khi điểm $\ge 8000$.
3. **Data Transfer Objects (`src/core/dto/vocabulary.dto.ts`):**
   - Xây dựng Zod schemas cho Quick-Add, Batch Import, Thẻ từ vựng, Lượt chấm điểm nói, và Kết quả đánh giá SM-2.
4. **Repositories (`src/core/repositories/vocabulary-repository.ts`):**
   - Xây dựng `VocabularyRepository` interface và `InMemoryVocabularyRepository` phục vụ test nhanh cùng `PostgresVocabularyRepository` cho production với giao dịch khóa dòng ACID.
5. **Python AI Engine Integration (`services/ai-engine/app/api/routes.py`):**
   - Bổ sung endpoint `POST /api/v1/vocabulary/enrich`:
     - Tự động gọi Free Dictionary API lấy IPA chuẩn, part of speech và raw definition.
     - Dùng Llama 3.1 8B (Ollama) tạo nghĩa tiếng Việt ngắn gọn, câu ví dụ tự nhiên và mẹo phát âm cơ miệng.
     - Dùng `edge-tts` sinh file audio mẫu chuẩn British RP (`en-GB-SoniaNeural`).
6. **Next.js BFF Route Handlers (`src/app/api/vocabulary/...`):**
   - `POST /api/vocabulary/enrich`: Tiếp nhận yêu cầu nhập từ 1-chạm, ủy quyền AI Engine và lưu cache.
   - `POST /api/vocabulary/batch-import`: Tiếp nhận danh sách đến 20 từ, bóc tách và tạo thẻ hàng loạt.
   - `GET /api/vocabulary/decks` & `POST /api/vocabulary/decks`: Quản lý bộ thẻ.
   - `GET /api/vocabulary/items` & `POST /api/vocabulary/items`: Quản lý thẻ từ vựng.
   - `GET /api/vocabulary/review/due`: Lấy danh sách thẻ đến hạn ôn tập hôm nay (`sm2_next_review_at <= now()`).
   - `POST /api/vocabulary/review/submit`: Gửi kết quả chấm điểm giọng nói, cập nhật chu kỳ SM-2 và ghi nhận XP vào `xp_ledger`.
7. **Acceptance Test Suite (`tests/acceptance/active-vocabulary-3d.test.ts`):**
   - Kiểm thử toàn bộ 7 kịch bản chấp thuận: Nhập từ, bóc tách batch, tính SM-2, ngưỡng điểm nói $\ge 8000$, reset khi trượt, và bảo vệ ACID giao dịch XP.

---

### Lượt 2: Giao Diện Frontend & Tích Hợp Thẻ Lật 3D Đa Giác Quan
1. **Zustand State Store (`src/modules/vocabulary/stores/useVocabularyStore.ts`):**
   - Quản lý danh sách decks, items, filter, trạng thái ôn tập (`reviewSession`), lật thẻ và audio.
2. **Modal Nhập Từ Thông Minh 1-Chạm (`src/modules/vocabulary/components/QuickAddModal.tsx`):**
   - Nhập từ $\rightarrow$ Loading trạng thái AI $\rightarrow$ Xem trước IPA, nghĩa tiếng Việt, câu ví dụ $\rightarrow$ Lưu ngay vào bộ thẻ.
3. **Drawer Nhập Hàng Loạt (`src/modules/vocabulary/components/BatchImportDrawer.tsx`):**
   - Textarea dán văn bản $\rightarrow$ Progress bar xử lý batch $\rightarrow$ Danh sách kết quả xem lại trước khi lưu.
4. **Thẻ Lật 3D Phản Xạ Nói (`src/modules/vocabulary/components/FlashcardReviewDeck.tsx`):**
   - Thiết kế lật thẻ 3D hai mặt theo chuẩn phong cách Luxury Dark Slate (`#131722`).
   - Tích hợp nút nghe audio British RP (`HTMLAudioElement` với cleanup URL).
   - Tích hợp micro thu âm Web Audio trực tiếp trên thẻ: Người học phát âm $\rightarrow$ Gửi chấm điểm $\rightarrow$ Hiển thị vòng hào quang Xanh (Pass $\ge 80\%$) hoặc Đỏ (Fail $< 80\%$) $\rightarrow$ Tự động chuyển thẻ kế tiếp khi hoàn thành.
5. **Trang Điều Khiển Chính (`src/app/vocabulary/page.tsx`):**
   - Header Bar hiển thị chỉ số retention, danh sách từ vựng dạng bảng tương tác và nút kích hoạt chế độ ôn tập.
6. **Thanh Điều Hướng Toàn Cục (Global Navigation Bar):**
   - Bổ sung liên kết `/vocabulary` vào thanh điều hướng trên toàn bộ trang web.

---

### Lượt 3: Kiểm Thử Toàn Diện, CI/CD & Bàn Giao
1. Chạy full Vitest suite (đảm bảo 100+ tests xanh).
2. Chạy full Pytest suite cho AI Engine.
3. TypeScript Strict typecheck & ESLint.
4. Production build validation.
5. Tạo Pull Request duy nhất và bàn giao Tech Lead nghiệm thu.
