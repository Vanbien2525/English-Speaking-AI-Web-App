# PROMPT 6: Dọn Rác & Cập Nhật Tiến Độ Sau Khi Merge (Giai Đoạn 5)

```markdown
Tính năng [Tên tính năng] đã được kiểm thử độc lập và tôi đã bấm Merge thành công vào nhánh main trên GitHub. Hãy tiến hành quy trình dọn dẹp dự án (Post-Feature Garbage Collection):

1. Dọn Dẹp File Rác (Zero-Clutter Policy):
   - Xóa ngay lập tức file `plan.md` trong thư mục artifact/root.
   - Xóa toàn bộ file log debug, file JSON xuất tạm (`tmp_*`, `debug_*.log`).
   - Xóa các bản nháp wireframe thô không dùng của Stitch.
2. Cập Nhật Trạng Thái Dự Án:
   - Mở file `PROJECT_STATE.md`, đánh dấu `[x]` hoàn thành cho tính năng này.
3. Kiểm Tra Vệ Sinh Toàn Cục:
   - Chạy `npx tsc --noEmit` và `npm run lint` để đảm bảo codebase hoàn toàn sạch bóng lỗi cú pháp trước khi chuyển task mới.

Sau khi dọn dẹp xong, hãy thông báo cho tôi biết tính năng tiếp theo cần làm là gì theo lộ trình!
```
