# PROMPT MẪU GIAI ĐOẠN 5: KÍCH HOẠT JULES QUA ISSUE-FIRST SINGLE PR & CI DUAL-GREEN
# (Áp dụng chuẩn Golden Issue-First Flow, Single PR Mandate & Rào chắn 0KB Three.js)

/goal Hãy kích hoạt và quản lý quy trình Giai Đoạn 5: Kiểm Toán Độc Lập Cloud VM với Google Labs Jules & Xác Thực Dual-Green CI Pipeline cho Tính Năng 3 (Bảng Thành Tích, Biểu Đồ Tiến Độ, Chuỗi Ngày Học Streak & Sổ Cái XP - Gamification Ledger) tuân thủ 100% các bài học kinh nghiệm từ Feature 1 và Feature 2:

1. Đẩy Nhánh Làm Việc Lên Remote (Push Branch):
   - Kiểm tra trạng thái git trên nhánh hiện tại `feature/gamification-and-progress`.
   - Đẩy nhánh `feature/gamification-and-progress` lên remote repository `origin` an toàn.

2. Khởi Tạo Issue-First Jules Trigger (Chống Duplicate PR):
   - Tuyệt đối KHÔNG tạo Pull Request thủ công trước để tránh xung đột hoặc tạo PR trùng lặp (bài học Feature 2).
   - Sử dụng GitHub MCP / CLI tạo một GitHub Issue mới trên `Vanbien2525/English-Speaking-AI-Web-App` với nhãn `jules`:
     * Tiêu đề: `[Jules Verification] Audit & Verify Feature 3 on branch feature/gamification-and-progress`
     * Nội dung Issue:
       - Mục tiêu kiểm toán: Tính Năng 3 (Bảng Thành Tích, Biểu Đồ Tiến Độ, Chuỗi Ngày Học Streak & Sổ Cái XP) trên nhánh `feature/gamification-and-progress`.
       - Rào chắn bắt buộc (Checklist):
         + Node.js >=22.0.0, cài đặt sạch `npm ci || npm install`.
         + Kiểm toán cô lập bundle: Chạy `npx vitest run tests/unit/bundle-isolation.test.ts` đảm bảo 100% 0KB Three.js trên cả 2 route `/learn` và `/progress`.
         + Kiểm toán tự động: Chạy toàn bộ test suite `npm test` (xác thực 91/91 tests PASS).
         + Kiểm tra tĩnh: `npm run typecheck` (0 errors) & `npm run lint` (0 warnings).
         + Build sản phẩm: `npm run build` biên dịch thành công 100% các static và dynamic routes.
         + Single PR Mandate: Jules mở hoặc cập nhật DUY NHẤT 1 PR chính thức gắn liên kết `Fixes #...`, kèm video/screenshot giao diện nếu có.
         + Human Merge Authority: Quyền sáp nhập thuộc duy nhất Tech Lead @Vanbien2525.

3. Giám Sát Tiến Trình & Xác Thực Dual-Green CI:
   - Theo dõi hoạt động của Google Labs Jules (`google-labs-jules`) trên GitHub Issue cho đến khi Jules hoàn thành và mở Pull Request chính thức.
   - Theo dõi GitHub Actions Enterprise CI workflow chạy trên PR cho đến khi đạt trạng thái XANH 100% (Success).

4. Hỗ Trợ Tech Lead Sáp Nhập (Squash and Merge) & Dọn Dẹp:
   - Khi cả hai hệ thống (Jules + GitHub Actions) đều đạt chuẩn Dual-Green (Approved / Success), thông báo cho Tech Lead @Vanbien2525 tiến hành "Squash and Merge".
   - Thực hiện dọn dẹp branch thừa (Garbage Collection): checkout về `main`, `git pull origin main`, xóa branch ephemeral cục bộ và remote.

5. Xuất Bản Báo Cáo Nghiệm Thu & Cập Nhật Trạng Thái:
   - Xuất bản báo cáo hoàn thiện chi tiết tại `.agents/reports/feature-03-gamification-and-progress.md` theo mẫu chuẩn của Feature 1 & 2.
   - Cập nhật đánh dấu hoàn thành 100% Tính Năng 3 trong `PROJECT_STATE.md`.
