# PROMPT 4: Thực Thi Tự Trị Backend PostgreSQL TDD (Giai Đoạn 4 - Lượt 1)

```markdown
/goal Triển khai toàn bộ phần BACKEND cho tính năng [Tên tính năng] theo đúng plan.md đã duyệt:

1. Test-Driven Development (TDD First):
   - Tạo file kiểm thử nghiệm thu tại `tests/acceptance/[ten-tinh-nang].test.ts`.
   - Viết trước các bài test bao quát 100% kịch bản trong file spec: Happy Path, Invalid Input (DTO validation), Duplicate Key, và DB Rollback khi có lỗi.

2. Tiêu Chuẩn Kỹ Thuật PostgreSQL & Service:
   - Strict Type Safety: 100% TypeScript Strict, không sử dụng kiểu `any`.
   - Transaction Integrity: Mọi thao tác ghi/sửa từ 2 bảng trở lên bắt buộc bọc trong `prisma.$transaction` (hoặc tương đương) để đảm bảo tính nguyên tử (Atomicity).
   - Defensive Error Handling: Bắt lỗi tường minh, map lỗi DB sang mã HTTP chuẩn (409 Conflict khi trùng Unique, 404 Not Found), cấm nuốt lỗi rỗng.

3. Vòng lặp tự trị:
   - Tự động chạy lệnh `npm test -- tests/acceptance/[ten-tinh-nang].test.ts`.
   - Nếu test thất bại (Red): Tự phân tích log lỗi, tự dùng `replace_file_content` sửa code, tự kiểm thử lại cho đến khi pass 100% (Green).

Sau khi tất cả test cases đều xanh, hãy dừng lại và cung cấp Prompt nâng cấp Frontend cho tôi!
```
