# PROMPT 7: Tổng Duyệt Toàn Hệ Thống & Phát Hành Production (Final Release)

```markdown
Toàn bộ các tính năng trong `SYSTEM_BLUEPRINT.md` đã được hoàn thành 100%. Hãy đóng vai trò là Principal Security Auditor & Lead QA Engineer thực hiện cuộc Tổng Duyệt Toàn Hệ Thống (Final System Audit):

1. Kiểm Thử Hồi Quy Toàn Cục (Full Regression Suite):
   - Chạy toàn bộ các bài test trong thư mục `tests/`: Đảm bảo 100% test cases của tất cả các tính năng từ trước đến nay đều xanh (PASS).
2. Rà Soát Lỗ Hổng Bảo Mật (Security & Vulnerability Audit):
   - Quét toàn bộ các câu lệnh SQL/Prisma: Đảm bảo không có SQL Injection, kiểm tra phân quyền chặt chẽ chống lỗ hổng IDOR.
   - Đảm bảo 100% biến môi trường nhạy cảm nằm trong `.env` và file `.gitignore` đã chặn hoàn toàn các secret.
3. Tối Ưu Hiệu Năng Cơ Sở Dữ Liệu:
   - Kiểm tra các truy vấn xem có bị lỗi kinh điển N+1 Query không. Đảm bảo mọi khóa ngoại và trường lọc đã được đánh Index.
4. Đóng Gói Phát Hành (Release Packaging):
   - Tạo file `RELEASE_NOTES.md` tổng kết toàn bộ sản phẩm.
   - Tạo commit chuẩn `chore(release): v1.0.0` và mở Pull Request cuối cùng để GitHub Jules thẩm định lần cuối trước khi deploy chính thức.
```
