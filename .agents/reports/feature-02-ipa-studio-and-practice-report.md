# BÁO CÁO KỸ THUẬT NGHIỆM THU: PHÂN HỆ HỌC & LUYỆN TẬP PHÁT ÂM IPA (44 PHONEMES & PRACTICE STUDIO)
**Dự án:** AI Speaking Tutor 3D (`English-Speaking-AI-Web-App`)
**Mã phân hệ:** `FEAT-IPA-COMPREHENSIVE-STUDIO`
**Ngày nghiệm thu:** 22/10/2026
**Đánh giá tổng thể:** **100% PASS — PRODUCTION READY**

---

## 1. TỔNG QUAN PHÂN HỆ & SỨ MỆNH SƯ PHẠM

Phân hệ **Bản Đồ 44 Âm Vị IPA & Studio Luyện Tập** là tính năng nền tảng trong hệ sinh thái **AI Speaking Tutor 3D**. Hệ thống giải quyết trọn vẹn bài toán luyện ngữ âm chuẩn Anh - Anh (British RP) cho người học Việt Nam thông qua chu trình khép kín 4 giai đoạn:
1. **Học tổng quan**: Nhận diện âm vị qua bảng màu trực quan, nghe phát âm cô lập và từ khóa đại diện.
2. **Học chuyên sâu**: Hướng dẫn giải phẫu khẩu hình (Môi, Lưỡi, Hơi, Dây thanh), luyện 10 từ vựng mẫu cho từng âm.
3. **Phản hồi tức thì**: Bóc tách lỗi âm vị bằng Wav2Vec2 CTC Forced Alignment, bôi màu trực tiếp chữ cái phát âm sai.
4. **Khắc phục lỗi sai**: Sổ lỗi tự động (`ErrorReviewPractice`) tích hợp gia sư AI hướng dẫn sửa lỗi và tự động gỡ từ khi phát âm đạt chuẩn ($\ge 80\%$).

---

## 2. KIẾN TRÚC & CHI TIẾT 4 NHÓM TÍNH NĂNG ĐÃ TRIỂN KHAI

### 2.1. Nhóm 1: Hệ Thống & Điều Hướng (System & Core Layout)
- **Menu & Breadcrumb**: Điều hướng mượt mà giữa Lưới IPA (`/ipa`), Trang Chi Tiết từng âm (`/ipa/[phonemeId]`), và Phân hệ Luyện tập (`/ipa/practice`).
- **Tối ưu hóa SSG/SSR**: 44 âm vị được prerender tĩnh thành 98 trang HTML tĩnh và SSG pages, đảm bảo thời gian tải trang gần như tức thì ($< 100\text{ms}$).
- **State Persistence**: Đồng bộ hóa dữ liệu điểm số, kết quả 10 từ vựng và sổ lỗi qua cơ chế Reactive LocalStorage Event (`ast3d_ipa_storage_updated`), phản hồi tức thì giữa các tab mà không cần tải lại trang.

### 2.2. Nhóm 2: Lưới 44 Âm Vị Tổng Quan (Main Phonemic Chart)
- **Hiển thị chuẩn hóa theo 3 nhóm**:
  - **12 Nguyên âm đơn (Monophthongs)**: Nền ngọc bích nhạt (`emerald-50/40`), viền xanh ngọc.
  - **8 Nguyên âm đôi (Diphthongs)**: Nền xanh mòng két (`teal-50/40`), viền xanh vịt trời.
  - **24 Phụ âm (Consonants)**: Phân biệt rõ rệt theo tính chất âm học:
    - *Hữu thanh (Voiced)*: Nền vàng hổ phách nhạt (`amber-50/40`).
    - *Vô thanh (Voiceless)*: Nền xanh da trời nhạt (`sky-50/40`).
- **Phát âm chuỗi liên hoàn (Sequence Playback)**:
  - Khi click vào thẻ âm vị: Phát âm âm vị cô lập $\rightarrow$ Tạm dừng $0.5\text{s}$ $\rightarrow$ Phát từ vựng ví dụ (`anchorWord`).
  - Hiệu ứng nhịp đập pulse và gạch chân đồng bộ theo trạng thái âm thanh (`playbackStep`).
- **Tracking tiến độ trực quan**:
  - Âm đạt điểm $\ge 80\%$: Hiển thị viền xanh lá, checkmark và badge phần trăm thành thạo.
  - Âm chưa đạt: Hiển thị icon cảnh báo và điểm số cần cải thiện.
- **Sửa lỗi định dạng rớt dòng**: Áp dụng `whitespace-nowrap select-none leading-none inline-block text-2xl sm:text-3xl`, xóa bỏ hoàn toàn lỗi vỡ dòng của các âm vị phức tạp (`/əʊ/`, `/ʊə/`).

### 2.3. Nhóm 3: Trang Chi Tiết Âm Vị (Phoneme Detail Page)
- **Hero Header Cân Đối**: Ô vuông đại diện âm vị `min-w-28 sm:min-w-32 px-2 h-28 sm:h-32` với dynamic typography, đảm bảo ký hiệu nằm trọn vẹn 100% bên trong khung bo tròn.
- **Hướng dẫn khẩu hình giải phẫu**: Cung cấp chi tiết cách đặt môi, lưỡi, luồng hơi và đặc tính âm học cho từng âm vị.
- **Luyện tập 10 từ vựng mẫu**:
  - Bôi màu nổi bật chữ cái chứa âm vị (`highlightPart`).
  - Nút **Nghe Mẫu Giọng Nam**: Phát âm thanh mẫu chuẩn xác.
  - Nút **Mic Thu Âm Trực Tiếp**: Ghi âm Web Audio RAM Blob (16kHz mono), hiển thị sóng âm thời gian thực (`WordWaveform`).
- **Chấm điểm & Đánh dấu lỗi ký tự (Phoneme Highlighting)**:
  - Điểm $\ge 80\%$: Bôi xanh lá (Thành thạo).
  - Điểm $70\% - 79\%$: Bôi vàng hổ phách (Lệch nhẹ).
  - Điểm $< 70\%$: Bôi đỏ gạch chân cảnh báo (Phát âm sai/nuốt âm).
- **Cơ chế Sổ Lỗi Tự Động**: Từ có điểm $< 80\%$ lập tức được thêm vào Sổ lỗi kèm toàn bộ nhận xét của AI gia sư; từ trước đó $< 80\%$ nhưng khi đọc lại đạt $\ge 80\%$ lập tức được gỡ khỏi sổ lỗi.

### 2.4. Nhóm 4: Bộ Luyện Tập Chuyên Sâu (Practice Module)
- **Bài tập Cặp âm nhầm lẫn (Minimal Pairs)**: So sánh đối chiếu các cặp âm kinh điển dễ nhầm của người Việt (VD: `ship` / `sheep`, `bad` / `bed`, `pull` / `pool`). Cho phép nghe, chọn và thử lại ngay khi chọn sai.
- **Bài tập Nối từ (Drag & Drop Matching)**: Ghép từ vựng với phiên âm IPA đối xứng 2 cột cân đối.
- **Sổ tay Ôn tập lỗi sai (Error Review Ledger)**:
  - Hiển thị danh sách các từ phát âm dưới $80\%$.
  - **Nhận xét AI gia sư cố định trong từng thẻ từ**: Mô tả chi tiết 3 yếu tố giải phẫu (Môi & Hàm, Vị trí Lưỡi, Luồng hơi & Dây thanh).
  - **Trải nghiệm gỡ lỗi hoàn hảo**: Khi đọc lại đạt $\ge 80\%$:
    - Bắn thông báo chúc mừng (`toast.success`).
    - Viền thẻ chuyển sang xanh emerald rực rỡ với badge `"ĐÃ SỬA LỖI XONG"`.
    - Giữ lại thẻ trong 4 giây kèm thanh thông báo đếm ngược để học viên quan sát thành tích trước khi tự động gỡ khỏi sổ lỗi (hoặc có thể bấm `[Gỡ ngay]`).

---

## 3. KIẾN TRÚC ÂM THANH & CÁC CẢI TIẾN ĐÃ THỰC HIỆN

| Hạng Mục | Trạng Thái Cũ | Đã Nâng Cấp Hoàn Thiện |
| :--- | :--- | :--- |
| **Nguồn Audio 44 Âm Vị** | Dùng Web Speech / File tự sinh bị lỗi đọc bảng chữ cái alphabet (*pee, tee, kay...*) | Tải và tích hợp toàn bộ **44 file `*_isolation.mp3` chuẩn xác** từ repo `xiaozhah/phoneme_audio`, lưu cục bộ tại `public/audio/ipa/*.mp3` (~15KB/file, tổng ~700KB). |
| **Âm Sắc Âm Vị** | Giọng méo mó khi cố pitch-shift | Giữ nguyên bản thu âm chuẩn gốc để bảo toàn $100\%$ các tần số formant F1/F2 âm học tự nhiên. |
| **Nhận Xét AI Gia Sư** | Câu sáo rỗng (*"Bước 1: Quan sát vị trí..."*), hiển thị dạng toast thoáng qua | Xây dựng từ điển giải phẫu `ARTICULATORY_GUIDES` 44 âm vị (Môi, Lưỡi, Hơi, Dây thanh); nhận xét cố định bên trong thẻ. |
| **Giao Diện Ô Vuông Âm Vị** | Ký hiệu `/əʊ/`, `/ʊə/` bị bẻ thành 2 dòng, tràn ra ngoài ô vuông | Áp dụng `whitespace-nowrap`, dynamic font scaling và `overflow-hidden`, ký hiệu nằm trọn vẹn 100% trong ô. |
| **Trải Nghiệm Xóa Sổ Lỗi** | Từ biến mất đột ngột khi vừa đọc xong | Thông báo chúc mừng, chuyển viền xanh, giữ thẻ 4 giây kèm thanh đếm ngược thông báo trước khi gỡ. |

---

## 4. KẾT QUẢ KIỂM ĐỊNH CHẤT LƯỢNG (QUALITY GATES)

1. **Python AI Engine Test Suite (Pytest)**:
   ```text
   services/ai-engine/tests/test_assessment.py ......... [100%]
   ============================= 9 passed in 17.45s ==============================
   ```
2. **Next.js Unit & Acceptance Test Suite (Vitest)**:
   ```text
   Test Files  21 passed (21)
   Tests       128 passed (128)
   Duration    5.51s
   ```
3. **TypeScript Strict Typecheck**:
   ```bash
   npm run typecheck
   # ➔ 0 errors (tsc --noEmit)
   ```
4. **ESLint Static Analysis**:
   ```bash
   npm run lint
   # ➔ 0 warnings, 0 errors
   ```
5. **Next.js Production Build Validation**:
   ```text
   Route (app)
   ├ ○ /ipa
   ├ ● /ipa/[phonemeId] (98 static/SSG pages)
   ├ ○ /ipa/practice
   ✓ Compiled successfully in 4.2s (0 dynamic build errors)
   ```
