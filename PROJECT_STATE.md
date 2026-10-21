# BẢNG ĐIỀU KHIỂN TIẾN ĐỘ DỰ ÁN (PROJECT_STATE.MD)

## [x] Giai Đoạn 1: Móng Hệ Thống & PostgreSQL (Day 0)
- [x] Phỏng vấn nền tảng hoàn tất (Next.js App Router + R3F Lazy 3D + PostgreSQL 16 + Hybrid FastAPI Speech AI)
- [x] SYSTEM_BLUEPRINT.md hoàn tất (Cấu trúc thư mục + Domain Entities + Functional Tree)
- [x] Docker PostgreSQL & Schema DDL đã khởi tạo (`database/migrations/0001_init_schema.sql`)
- [x] GEMINI.md, `src/core/dto/shared.dto.ts` & toàn bộ thư viện Frontend 3D đã cài đặt và pass kiểm thử

## [x] Tính Năng 1: Phòng Luyện Phát Âm 3D & Chấm Điểm Âm Vị IPA (HOÀN THÀNH 100%)
- [x] Giai đoạn 2: /grill-me hoàn tất -> Đã lưu .agents/specs/practice-studio-3d.spec.md
- [x] Giai đoạn 3: Khung Stitch Wireframe & StitchMCP kết nối -> plan.md đã duyệt
- [x] Giai đoạn 4 - Lượt 1: Backend PostgreSQL Pass 100% Test (26/26 tests green, ACID transactions, Idempotency, SLA Timeout 1500ms)
- [x] Giai đoạn 4 - Lượt 2: Frontend Awwwards Luxury Polish Pass (OralCavityModel 3D Sagittal Cross-Section, AudioRecordDock, IpaBreakdownCard, 32/32 tests green)
- [x] Giai đoạn 5: Chuẩn hóa AGENTS.md với quy định bắt buộc Duy Nhất 1 PR Mỗi Tính Năng (Single PR Policy) & CI Pass 100% ✅
- [x] Giai đoạn 5: Google Labs Jules chính thức hoạt động trơn tru (Issue #2 gắn nhãn `jules` đã được bot nhận việc và chạy cloud VM)
- [x] Giai đoạn 5: Squash and Merge PR #1 vào main (Commit `82b6f6c`), đóng PR #3 thử nghiệm
- [x] Giai đoạn 5: Dọn dẹp branch & xuất bản báo cáo nghiệm thu `.agents/reports/feature-01-practice-studio-3d.md`

## [x] Tính Năng 2: Bản Đồ 44 Âm Vị IPA & Phân Hệ Danh Mục Bài Học CEFR (HOÀN THÀNH 100%)
- [x] Giai đoạn 2: /grill-me khảo sát kiến trúc Bản đồ IPA -> Đã lưu .agents/specs/ipa-map-and-lessons.spec.md
- [x] Giai đoạn 3: Wireframe Stitch (Screen 0ffff379) & Kế hoạch Sub-components -> Đã lưu .agents/plans/ipa-map-and-lessons.plan.md
- [x] Giai đoạn 4 - Lượt 1: Backend TDD Red-to-Green Pass 100% (20/20 curriculum tests green, 52/52 total suite green)
- [x] Giai đoạn 4 - Lượt 2: Frontend SSR/SSG Siêu tốc (0KB Three.js, Design DNA OKLCH, Motion Cards, 58/58 tests green)
- [x] Giai đoạn 5: Chuẩn hóa quy trình Golden Issue-First Jules Flow (Issue #5 gắn nhãn `jules` -> Jules Cloud VM verify -> Jules mở PR #6)
- [x] Giai đoạn 5: Dual-Green Passed (Jules Playwright UI & Vitest Audit + GitHub Actions Enterprise CI Pipeline Xanh 100%)
- [x] Giai đoạn 5: Squash and Merge PR #6 vào main (Commit `97557cd`), dọn dẹp branch & đóng PR #4 trùng lặp
- [x] Giai đoạn 5: Xuất bản báo cáo nghiệm thu `.agents/reports/feature-02-ipa-map-and-lessons.md`

## [x] Tính Năng 3: Bảng Thành Tích, Biểu Đồ Tiến Độ, Chuỗi Ngày Học (Streak) & Sổ Cái XP (HOÀN THÀNH 100%)
- [x] Giai đoạn 2: /grill-me khảo sát kiến trúc Gamification, Streak Recovery & XP Ledger -> Đã lưu .agents/specs/gamification-and-progress.spec.md
- [x] Giai đoạn 3: Wireframe Stitch (Screen fee2e116) & Kế hoạch Sub-components -> Đã lưu .agents/plans/gamification-and-progress.plan.md
- [x] Giai đoạn 4 - Lượt 1: Backend TDD Red-to-Green Pass 100% (24/24 gamification tests green, 82/82 total suite green, ACID transactions, Idempotency, Streak Normalizer)
- [x] Giai đoạn 4 - Lượt 2: Frontend SSR/SSG Siêu tốc (0KB Three.js, Pure SVG 6-Axis Radar & 30-Day Trendline, Design DNA OKLCH, 91/91 tests green, build pass)
- [x] Giai đoạn 5: Chuẩn hóa quy trình Golden Issue-First Jules Flow (Issue #7 gắn nhãn `jules` -> Jules Cloud VM verify -> Jules mở duy nhất PR #8)
- [x] Giai đoạn 5: Dual-Green Passed (Jules Cloud VM Audit + GitHub Actions Enterprise CI Pipeline Run #19 Xanh 100%)
- [x] Giai đoạn 5: Xuất bản báo cáo nghiệm thu `.agents/reports/feature-03-gamification-and-progress.md`
- [x] Giai đoạn 5: Squash and Merge PR #8 vào main (Commit `816a99f`), dọn dẹp branch & đóng Issue #7

## [x] Tính Năng 4: Nhóm A.5 - Từ Vựng Phản Xạ Nói & Thẻ 3D (Active Vocabulary & Speaking Mastery) (HOÀN THÀNH 100%)
- [x] Đặc tả kiến trúc kỹ thuật & kế hoạch TDD: `.agents/specs/active-vocabulary-3d.spec.md` & `.agents/plans/active-vocabulary-3d.plan.md`
- [x] Schema DDL PostgreSQL 16: `database/migrations/0002_active_vocabulary.sql` (`vocabulary_decks`, `vocabulary_items`, `flashcard_reviews`)
- [x] Pure Domain SM-2 Calculator: `src/core/domain/sm2.ts` (Số học nguyên basis points, chất lượng q = 0..5, ngưỡng phát âm đạt chuẩn >= 8000 bp / 80%)
- [x] Tích hợp Free Dictionary API & Fallback Dictionary Llama: `src/core/services/vocabulary-service.ts`
- [x] Bộ API Route Handlers: `/api/vocabulary/enrich`, `/api/vocabulary/batch-import`, `/api/vocabulary/decks`, `/api/vocabulary/items`, `/api/vocabulary/review/due`, `/api/vocabulary/review/submit`
- [x] Giao diện Studio Flashcard 3D: `src/modules/vocabulary` (Thẻ lật 3D CSS perspective, mô hình khoang miệng 3D mini `VocabOralCanvas`, Web Audio Waveform, giọng đọc chuẩn British RP)
- [x] Cơ chế "Phát Âm Đúng Mới Tính Là Thuộc" (Speaking-Verified Mastery): Bắt buộc mic đọc >= 80 điểm mới thăng hạng SM-2 và ghi nhận vào Sổ Cái XP
- [x] Nhập 1-Chạm (`QuickAddModal`) & Nhập hàng loạt tối đa 20 từ (`BatchImportModal`)
- [x] Giai đoạn 5: Chuẩn hóa quy trình Golden Issue-First Jules Flow (Issue #9 gắn nhãn `jules` -> Jules Cloud VM audit & patch -> Jules mở PR #11)
- [x] Giai đoạn 5: Dual-Green Passed (Jules Cloud VM Audit + GitHub Actions Enterprise CI Pipeline Run 39569521322 Xanh 100%)
- [x] Giai đoạn 5: Squash and Merge PR #11 vào main (Commit `f9fdfa8`), đóng PR #10 trùng lặp & đóng Issue #9
- [x] Giai đoạn 5: Dọn dẹp an toàn các branch ephemeral `feature/active-vocabulary-3d` và xuất bản báo cáo nghiệm thu `.agents/reports/feature-04-active-vocabulary-3d.md`

## [x] Phân Hệ Speech AI Engine: Huấn Luyện & Tích Hợp Microservice (HOÀN THÀNH 100%)
- [x] Huấn luyện A100 hoàn tất 3/3 Phase (Wav2Vec2 Scorer 5 thang điểm, Wav2Vec2 CTC Phoneme 600 câu L2-ARCTIC tiếng Việt, Llama 3.1 8B SFT gia sư 3D Viseme)
- [x] Xuất GGUF Q4_K_M và nạp thành công vào Ollama local (`speaking-tutor-llama3:latest` 8.0B 4.92GB)
- [x] Microservice Python FastAPI (`services/ai-engine/app`) hoàn thiện 100%: Zero-Footprint In-Memory Audio, Wav2Vec2 Scorer, Phoneme CTC, Llama 3.1 8B Ollama Adapter, Edge-TTS British RP
- [x] Pytest tích hợp AI Engine Pass 100% (2/2 tests green, latency < 1500ms SLA)
- [x] Target Phrase Alignment & Dynamic Client Routing hoàn tất

## [x] Nâng Cấp Chuyên Sâu: 6 Điểm Vàng Phân Hệ Từ Vựng Phản Xạ 3D (HOÀN THÀNH 100%)
- [x] 1. Từ điển học thuật song ngữ chuyên sâu: `src/core/services/dictionary-data.ts` (Sửa dứt điểm lỗi định nghĩa tiếng Việt & chuẩn hóa IPA Oxford/Cambridge cho `power`, `good`, `think`, v.v.).
- [x] 2. Cơ chế 3 Cấp Độ Đánh Giá SM-2 chuẩn Anki: `src/core/domain/sm2.ts` & `FlashcardReviewDeck.tsx` (🔴 Again: Cấp 1 ôn lại ngay trong vài phút / 1 ngày, 🟡 Good: Cấp 2 nhắc lại sau 1-3 ngày, 🟢 Easy: Cấp 3 giãn cách 7-14 ngày).
- [x] 3. Quản lý Thư mục / Bộ từ vựng (Deck): `CreateDeckModal.tsx` & `VocabularyTable.tsx` (Tạo bộ từ mới, lọc theo Bộ từ, lọc theo 3 Cấp độ, lọc theo Lịch đến hạn ôn tập).
- [x] 4. Học lại tức thì từ danh sách: Click vào từ hoặc bấm nút "⚡ Luyện lại" trên từng hàng trong `VocabularyTable.tsx` lập tức nạp thẻ vào Flashcard 3D Studio.
- [x] 5. Đa dạng hóa chế độ luyện tập theo bộ: Thêm thanh tab chuyển đổi giữa 🎴 Thẻ 3D SM-2, 🎧 Luyện Nghe Chọn Từ Vựng (`ListeningQuizStudio.tsx`), và ✍️ Gõ Từ Điền Chỗ Trống (`SpellingClozeStudio.tsx`).
- [x] 6. Đối chiếu chấm điểm nghiêm ngặt với mẫu bản xứ: `services/ai-engine/app/services/phoneme_service.py` phân tích độ dài & năng lượng âm học, bắt lỗi phát âm kéo dài `/uː/` thay vì nguyên âm ngắn `/ʊ/` trong `good`, trừ điểm rớt dưới 80%, hiển thị thẻ so sánh âm vị người học vs British RP.
- [x] Đảm bảo 100% Quality Gates: Vitest 123/123 tests green, Pytest 3/3 green, TypeScript strict 0 errors, ESLint 0 warnings, Next.js Production Build thành công.

## [>] Vị Trí Hiện Tại: [Đã Hoàn Tất 100% 6 Vấn Đề Nâng Cấp Từ Vựng 3D - Nhánh feature/vocabulary-6-enhancements]
