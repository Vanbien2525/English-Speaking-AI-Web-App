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
- [x] Giao diện Studio Flashcard 3D: `src/modules/vocabulary` (Thẻ lật 3D CSS perspective, Web Audio Waveform, giọng đọc chuẩn British RP)
- [x] Cơ chế "Phát Âm Đúng Mới Tính Là Thuộc" (Speaking-Verified Mastery): Bắt buộc mic đọc >= 80 điểm mới thăng hạng SM-2 và ghi nhận vào Sổ Cái XP
- [x] Nhập 1-Chạm (`QuickAddModal`) & Nhập hàng loạt tối đa 20 từ (`BatchImportModal`)

## [x] Hoàn Thiện & Tinh Chỉnh Đợt 2: Xóa Bộ Từ, Đếm Tức Thời, Sửa Dịch Nghĩa, Persistence & Dọn UI (HOÀN THÀNH 100%)
- [x] **Yêu cầu 1: Bổ sung xóa bộ từ**: Thêm nút `🗑️ Xóa Bộ` trong `VocabularyTable.tsx`, API Route `DELETE /api/vocabulary/decks?id=...`, `deleteDeck` trong `useVocabularyStore.ts`, `VocabularyService`, và `VocabularyRepository` (cascade delete toàn bộ từ trong bộ).
- [x] **Yêu cầu 2: Cập nhật đếm từ tức thời trong 0ms khi xóa từ**: Trong `useVocabularyStore.ts`, khi xóa từ, cập nhật đồng thời `decks.itemCount` và `metrics.totalWords` ngay lập tức; trong `VocabularyTable.tsx`, `realCount` được tính động trực tiếp từ mảng `items`, không cần F5 hay load lại trang.
- [x] **Yêu cầu 3: Sửa dứt điểm phần dịch nghĩa tiếng Việt**: Xóa bỏ lỗi gán đè định nghĩa tiếng Anh từ Free Dictionary API; tích hợp cơ chế dịch thuật 2 tầng (Google Translate API + MyMemory API fallback), đảm bảo từ thêm 1 từ và nhiều từ luôn luôn có nghĩa tiếng Việt chuẩn xác (ví dụ "run" -> "chạy").
- [x] **Yêu cầu 4: Bỏ hoàn toàn chức năng ôn tập từ sai nhiều nhất**: Đã xóa bỏ nút `🔥 Ôn tập từ sai nhiều nhất` khỏi `DailyProgressBar.tsx`.
- [x] **Yêu cầu 5: Bỏ tab/nút "Xem danh sách từ" khi ở chế độ luyện tập**: Đã xóa bỏ nút chuyển đổi "Xem danh sách từ" trong `VocabularyHeader.tsx` và `src/app/vocabulary/page.tsx` khi đang luyện tập.
- [x] **Yêu cầu 6: Khắc phục lỗi tải lại trang ra 5 từ ban đầu**: Tích hợp cơ chế **Persistence to Local Disk** (`database/local_vocab_store.json`) và singleton `globalThis.__vocabRepoInstance`. Khi người dùng xóa hết từ, trạng thái rỗng được lưu bền vững, khi F5 tải lại trang hoàn toàn KHÔNG tự động mọc lại 5 từ ban đầu!
- [x] **100% Quality Gates**:
  - Vitest Test Suite: **141/141 tests green (23 test files)** (Bổ sung suite kiểm thử `deleteDeckRoute`).
  - TypeScript Strict: **0 errors (`npm run typecheck`)**.
  - ESLint Static Analysis: **0 warnings, 0 errors (`npm run lint`)**.
  - Next.js Production Build: **Build pass 100% (98 static & SSG pages)**.

## [x] Hoàn Thiện & Tinh Chỉnh Đợt 3: Xử Lý Triệt Để 9 Lỗi Hệ Thống Từ Vựng (HOÀN THÀNH 100%)
- [x] **Lỗi 1: Flashcard đứng yên sau khi đọc & chấm điểm**: Đã gỡ bỏ việc gọi `fetchDueItems()` bên trong `submitSpeakingReview`; thay vào đó cập nhật trạng thái thẻ in-place (`items`, `allItems`, `dueItems`). Thẻ hiện tại đứng yên hoàn toàn, chỉ chuyển thẻ khi người dùng chủ động click chuột hoặc dùng phím mũi tên.
- [x] **Lỗi 2: Nút Mic hiển thị rõ "Bấm Mic để nói" & "STOP" đỏ rực**: Khắc phục lỗi class màu v4/contrast bằng class `bg-red-600 hover:bg-red-700 text-white font-extrabold`, hiển thị chữ "STOP" cùng biểu tượng dừng rõ ràng, không bao giờ bị trắng trơn.
- [x] **Lỗi 3: Chuẩn hóa phiên âm IPA cho "run" (/rʌn/) và các từ đơn âm tiết**: Bổ sung "run" (/rʌn/), "beautiful" (/ˈbjuː.tɪ.fəl/), "cut", "sun" vào `ACADEMIC_DICTIONARY`, `LOCAL_FALLBACK_DICTIONARY`, và dọn dẹp sạch sẽ dữ liệu trong `database/local_vocab_store.json`.
- [x] **Lỗi 4: Rút gọn cột "Cấp Độ SM-2" thành "Cấp Độ" với 1 dropdown duy nhất**: Đổi tiêu đề bảng thành "Cấp Độ", xóa bỏ toàn bộ huy hiệu rườm rà và select trùng lặp, chỉ giữ lại duy nhất 1 dropdown chọn: 🔴 Again (Cấp 1), 🟡 Good (Cấp 2), 🟢 Easy (Cấp 3).
- [x] **Lỗi 5: Xóa bỏ chức năng "Lịch ôn" và cột "Chu Kỳ"**: Xóa bộ lọc "Lịch ôn" trên thanh filter bar và cột "Chu Kỳ" trong bảng `VocabularyTable.tsx`.
- [x] **Lỗi 6: Xóa bỏ chức năng "Luyện theo câu"**: Xóa bỏ hoàn toàn tab "💬 Luyện Theo Câu" khỏi thanh chuyển chế độ luyện tập trong `src/app/vocabulary/page.tsx`.
- [x] **Lỗi 7: Mặc định bộ từ ưu tiên là "Tất cả"**: Chỉnh sửa `useVocabularyStore.ts`, `selectedDeckId` khởi tạo và duy trì mặc định là `null` ("Tất cả các bộ").
- [x] **Lỗi 8: Sửa lỗi số lượng từ bị về 0 khi chọn bộ rỗng**: Thêm mảng `allItems` vào Zustand store. Số lượng từ của từng bộ trong dropdown luôn được tính toán dựa trên toàn bộ kho từ vựng `allItems`, không bao giờ bị reset về 0 khi bấm vào bộ rỗng.
- [x] **Lỗi 9: Trì hoãn 1.3s thông báo hoàn thành Nối từ & Nghĩa**: Thêm state `showCompletion` và `setTimeout(..., 1300)` trong `MatchingQuizStudio.tsx` để phát âm từ cuối cùng được nghe trọn vẹn trước khi bảng chúc mừng xuất hiện.
- [x] **Lỗi 10: Nút "Mở phòng luyện tập" đổi thành "Xem danh sách từ" (trang chính)**: Nút được đặt tại vị trí chuyển đổi, tự động đổi nhãn giữa "Mở phòng luyện tập →" và "📋 Xem danh sách từ", bấm vào để chuyển đổi giữa giao diện luyện tập và danh sách từ chính.
- [x] **100% Quality Gates**:
  - Vitest Test Suite: **141/141 tests green (23 test files)**.
  - TypeScript Strict: **0 errors (`npm run typecheck`)**.
  - ESLint Static Analysis: **0 warnings, 0 errors (`npm run lint`)**.
  - Next.js Production Build: **Build pass 100% (98 static & SSG pages)**.

## [x] Hoàn Thiện & Tinh Chỉnh Đợt 4: Chuẩn Hóa Font & Dữ Liệu IPA, Bộ Lọc Bộ Từ Cho 4 Chế Độ & Dọn Gọn Flashcard (HOÀN THÀNH 100%)
- [x] **Lỗi 1: Khắc phục lỗi font IPA và triệt tiêu lỗi phiên âm thô**:
  - Đổi biến font `--font-ipa` trong `src/app/globals.css` sang font sans-serif hiện đại (`Be Vietnam Pro, Noto Sans, Segoe UI, Arial`), loại bỏ hiện tượng ký tự `/ʌ/` bị biến dạng có chân mào giống chữ Hy Lạp `Λ`.
  - Tích hợp động cơ tra cứu IPA dự phòng siêu tốc từ Datamuse API (`fetchIpaFromDatamuse`) trong `vocabulary-service.ts`, bổ sung các từ phổ thông (`mother`, `happy`, `father`, `brother`) vào kho từ điển mẫu chuẩn (`dictionary-data.ts`), ngăn chặn tuyệt đối tình trạng từ bị phiên âm thô dạng `/${word}/`.
  - Chuẩn hóa toàn bộ dữ liệu trong `database/local_vocab_store.json`: `mother` -> `/ˈmʌð.ər/`, `happy` -> `/ˈhæp.i/`, `run` -> `/rʌn/`.
- [x] **Yêu cầu 2: Bộ lọc bộ từ cho cả 4 chế độ luyện tập**:
  - Tích hợp Dropdown "Bộ từ:" trực tiếp trên thanh điều hướng chế độ luyện tập tại `src/app/vocabulary/page.tsx`.
  - Đồng bộ `selectedDeckId` xuyên suốt cả 4 phân hệ: `Thẻ Flashcard SM-2` (`FlashcardReviewDeck.tsx`), `Nghe gõ từ` (`SpellingClozeStudio.tsx`), `Nối từ & nghĩa` (`MatchingQuizStudio.tsx`), và `Tiếng Việt → Tiếng Anh` (`VietnameseToEnglishStudio.tsx`). Khi chọn 1 bộ từ, cả 4 studio lập tức chuyển sang chỉ luyện tập từ vựng thuộc bộ từ đó (hoặc tất cả các bộ nếu chọn "Tất cả các bộ").
- [x] **Yêu cầu 3: Dọn dẹp dòng kết quả SM-2 rườm rà trên Flashcard**:
  - Gỡ bỏ hoàn toàn dòng text: `"Quay về Cấp độ 1 (Again): Thẻ được đưa vào danh sách ôn lại ngay trong phiên này. Điểm số: 62/100 · Chu kỳ SM-2 mới: 1 ngày"`.
  - Giữ lại giao diện tối giản, tinh gọn với banner trạng thái đạt chuẩn/chưa đạt chuẩn và bảng nhận xét chi tiết kèm hướng dẫn sửa khẩu hình từ AI gia sư Llama 3.1 8B.
- [x] **100% Quality Gates**:
  - Vitest Test Suite: **141/141 tests green (23 test files)**.
  - TypeScript Strict: **0 errors (`npm run typecheck`)**.
  - ESLint Static Analysis: **0 warnings, 0 errors (`npm run lint`)**.
  - Next.js Production Build: **Build pass 100% (98 static & SSG pages)**.

## [x] Hoàn Thiện & Tinh Chỉnh Đợt 5: Chuẩn Hóa Toàn Diện IPA, Giao Diện Bộ Từ & Cập Nhật Tức Thời (HOÀN THÀNH 100%)
- [x] **Yêu cầu 1: Sửa dứt điểm phiên âm IPA qua Free Dictionary API & chuẩn hóa dữ liệu**:
  - Tối ưu bộ trích xuất IPA trong `enrichWord` ([vocabulary-service.ts](file:///d:/English-Speaking-AI-Web-App/src/core/services/vocabulary-service.ts)) duyệt toàn bộ danh sách entries và phonetics, ưu tiên UK transcription và lọc sạch ký tự gạch chéo chuẩn `/.../`.
  - Cập nhật chuẩn xác dữ liệu lưu trong [database/local_vocab_store.json](file:///d:/English-Speaking-AI-Web-App/database/local_vocab_store.json): `run` -> `/rʌn/`, `happy` -> `/ˈhæp.i/`, `mother` -> `/ˈmʌð.ər/`.
- [x] **Yêu cầu 2: Xóa lọc bộ từ trùng lặp ở phía dưới (ảnh 1)**:
  - Gỡ bỏ cụm `<select>...</select>` lọc bộ từ trong [VocabularyTable.tsx](file:///d:/English-Speaking-AI-Web-App/src/modules/vocabulary/components/VocabularyTable.tsx), chỉ giữ lại duy nhất 1 bộ chọn bộ từ ở thanh điều hướng trên cùng điều khiển đồng bộ toàn bộ trang và 4 studio luyện tập.
- [x] **Yêu cầu 3: Xóa nút "+ Tạo Bộ Từ" ở header (ảnh 2)**:
  - Xóa nút `📁 + Tạo Bộ Từ` khỏi [VocabularyHeader.tsx](file:///d:/English-Speaking-AI-Web-App/src/modules/vocabulary/components/VocabularyHeader.tsx), tập trung thao tác tạo bộ từ vào nút `+ Tạo Bộ` trong bảng quản lý từ vựng.
- [x] **Yêu cầu 4: Xóa thẻ "Tỷ lệ duy trì (SM-2)"**:
  - Gỡ bỏ hoàn toàn thẻ "Tỷ lệ duy trì (SM-2)" trong [VocabularyHeader.tsx](file:///d:/English-Speaking-AI-Web-App/src/modules/vocabulary/components/VocabularyHeader.tsx), tinh gọn hàng chỉ số thành 3 thẻ cân đối: `Tổng số từ vựng`, `Cần ôn hôm nay`, và `Đã thuộc vững chắc`.
- [x] **Yêu cầu 5: Cập nhật tức thời số từ "Đã thuộc vững chắc" khi đổi cấp độ**:
  - Tích hợp Optimistic Update và đồng bộ tức thời trong `updateItemLevelManual` tại [useVocabularyStore.ts](file:///d:/English-Speaking-AI-Web-App/src/modules/vocabulary/stores/useVocabularyStore.ts). Khi đổi cấp độ (Again, Good, Easy), chỉ số `masteredWordsCount` được tính toán lại ngay trong 0ms mà không cần tải lại trang.
- [x] **Yêu cầu 6: Đa dạng hóa câu ví dụ ngắn gọn, sinh động**:
  - Bổ sung hàm `generateDiverseShortExample` sinh câu ví dụ tiếng Anh ngắn (5-8 từ), phong phú theo ngữ cảnh và từ loại (động từ, tính từ, trạng từ, danh từ), loại bỏ hoàn toàn câu mẫu đơn điệu `"I like this ... a lot"`.
- [x] **100% Quality Gates**:
  - Vitest Test Suite: **141/141 tests green (23 test files)**.
  - TypeScript Strict: **0 errors (`npm run typecheck`)**.
  - ESLint Static Analysis: **0 warnings, 0 errors (`npm run lint`)**.
  - Next.js Production Build: **Build pass 100% (98 static & SSG pages)**.

## [x] Hoàn Thiện & Tinh Chỉnh Đợt 6: Đồng Bộ Xóa Thẻ Đã Thuộc, Chặn Trùng Từ Theo Từ Loại, Chuẩn Hóa British RP & Mẹo Khẩu Hình Giải Phẫu 100% (HOÀN THÀNH 100%)
- [x] **Yêu cầu 1: Cập nhật tức thời số từ "Đã thuộc vững chắc" khi xóa từ**:
  - Trong `deleteItem` và `deleteDeck` tại [useVocabularyStore.ts](file:///d:/English-Speaking-AI-Web-App/src/modules/vocabulary/stores/useVocabularyStore.ts), bổ sung tính toán tức thời `masteredWordsCount = updatedAllItems.filter(i => i.isMastered).length`. Khi xóa một từ đang ở trạng thái đã thuộc, con số trên thẻ header giảm ngay lập tức trong 0ms.
- [x] **Yêu cầu 2: Chặn thêm từ trùng lặp theo cặp (từ vựng + từ loại)**:
  - Ràng buộc kiểm tra nghiêm ngặt tại [vocabulary-repository.ts](file:///d:/English-Speaking-AI-Web-App/src/core/repositories/vocabulary-repository.ts) và API Route [api/vocabulary/items](file:///d:/English-Speaking-AI-Web-App/src/app/api/vocabulary/items/route.ts) (trả về 409 Conflict).
  - Cho phép thêm từ giống nhau nếu khác từ loại (ví dụ: `run` danh từ và `run` động từ), nhưng chặn tuyệt đối nếu trùng cả từ lẫn từ loại (`run` noun + `run` noun).
  - Tích hợp cảnh báo sớm trên giao diện [QuickAddModal.tsx](file:///d:/English-Speaking-AI-Web-App/src/modules/vocabulary/components/QuickAddModal.tsx) với thông báo toast rõ ràng.
- [x] **Yêu cầu 3: Chuẩn hóa 100% phiên âm Anh - Anh (British RP)**:
  - Tích hợp `fetchBritishRpIpaFromWiktionary` ([vocabulary-service.ts](file:///d:/English-Speaking-AI-Web-App/src/core/services/vocabulary-service.ts)) trích xuất chính xác chuẩn Received Pronunciation (`RP`/`UK`).
  - Ưu tiên các nguyên âm dài và âm đặc trưng Anh - Anh (như `/ɑː/` thay cho `/æ/` trong *example* `/ɪɡˈzɑːm.pəl/`, *dance* `/dɑːns/`, *car* `/kɑː/`; `/ɔː/` và đuôi `/ə/` không rotic trong *water* `/ˈwɔː.tə/`).
- [x] **Yêu cầu 4: Động cơ sinh mẹo khẩu hình & đặt lưỡi giải phẫu thông minh 100%**:
  - Xây dựng hàm `generateArticulatoryTip` ([vocabulary-service.ts](file:///d:/English-Speaking-AI-Web-App/src/core/services/vocabulary-service.ts)) phân tích giải phẫu chi tiết dựa trên từng âm vị IPA thực tế của từ: vị trí đặt lưỡi (giữa răng, chạm gờ nướu, cong vòm họng), hình dáng môi (chu tròn, mở bè), độ mở hàm, độ rung thanh quản và quy tắc nhấn trọng âm.
  - Loại bỏ hoàn toàn câu mẫu ngẫu nhiên đơn điệu `"Đặt khẩu hình tự nhiên..."`.
- [x] **100% Quality Gates**:
  - Vitest Test Suite: **142/142 tests green (23 test files)** (Bổ sung test `TC-VOCAB-08`).
  - TypeScript Strict: **0 errors (`npm run typecheck`)**.
  - ESLint Static Analysis: **0 warnings, 0 errors (`npm run lint`)**.
  - Next.js Production Build: **Build pass 100% (98 static & SSG pages)**.

## [x] Hoàn Thiện & Tinh Chỉnh Đợt 7: Giao Diện Luxury, Mục Tiêu 15 Từ/Ngày & Chuyển Cảnh Mượt Mà (HOÀN THÀNH 100%)
- [x] **Yêu cầu 1: Xóa dòng phụ "Luyện phát âm chuẩn xác..."**: Gỡ bỏ khỏi [DailyProgressBar.tsx](file:///d:/English-Speaking-AI-Web-App/src/modules/vocabulary/components/DailyProgressBar.tsx), giúp thanh tiến độ gọn gàng và tinh tế.
- [x] **Yêu cầu 2: Rút gọn tiêu đề bảng thành "Quản Lý Bộ Từ Vựng"**: Xóa bỏ dòng phụ và rút gọn tiêu đề trong [VocabularyTable.tsx](file:///d:/English-Speaking-AI-Web-App/src/modules/vocabulary/components/VocabularyTable.tsx).
- [x] **Yêu cầu 3: Điều chỉnh mục tiêu từ 20 từ/ngày thành 15 từ/ngày**: Cập nhật `dailyGoalCount: 15` trong [useVocabularyStore.ts](file:///d:/English-Speaking-AI-Web-App/src/modules/vocabulary/stores/useVocabularyStore.ts).
- [x] **Yêu cầu 4: Nâng cấp câu slogan & giới thiệu sang trọng, truyền cảm hứng**: Cập nhật câu mô tả tại [VocabularyHeader.tsx](file:///d:/English-Speaking-AI-Web-App/src/modules/vocabulary/components/VocabularyHeader.tsx): *"Làm chủ vốn từ giao tiếp tự nhiên cùng thuật toán ghi nhớ SM-2, tối ưu khẩu hình chuẩn British RP và phản xạ phát âm lưu loát."*
- [x] **Yêu cầu 5: Nâng cấp hiệu ứng chuyển cảnh mượt mà xịn mịn**: Tích hợp `AnimatePresence mode="wait"` và `motion.div` với cubic-bezier `[0.16, 1, 0.3, 1]` cùng keyframes `smooth-fade-in` trong [globals.css](file:///d:/English-Speaking-AI-Web-App/src/app/globals.css) và [page.tsx](file:///d:/English-Speaking-AI-Web-App/src/app/vocabulary/page.tsx). Chuyển đổi giữa các chế độ luyện tập êm ái, liền mạch chuẩn Awwwards.
- [x] **100% Quality Gates**:
  - Vitest Test Suite: **142/142 tests green (23 test files)**.
  - TypeScript Strict: **0 errors (`npm run typecheck`)**.
  - ESLint Static Analysis: **0 warnings, 0 errors (`npm run lint`)**.
  - Next.js Production Build: **Build pass 100% (98 static & SSG pages)**.

## [>] Vị Trí Hiện Tại: [Đã Hoàn Thành Toàn Bộ 5 Yêu Cầu Tinh Chỉnh Đợt 7 - Đạt Chuẩn 100% Quality Gates]