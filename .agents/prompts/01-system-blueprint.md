# PROMPT 1: Phân Tích Thiết Kế Hệ Thống & Dựng Móng (Day 0)

```markdown
Đóng vai trò là một Principal Enterprise Solution Architect và Lead Database Engineer. Tôi muốn xây dựng dự án: [Mô tả ngắn gọn ý tưởng của bạn, ví dụ: Hệ thống bãi đỗ xe thông minh kết hợp camera quét biển số].

Trước khi thiết kế bất kỳ dòng mã nào, để tránh đi sai đường ngay từ đầu, hãy thực hiện Quy Trình 2 Bước sau:

BƯỚC 1: XÁC MINH CÔNG NGHỆ VÀ NỀN TẢNG (INTERACTIVE TECH INTERVIEW)
Hãy dừng lại và đặt cho tôi 3 câu hỏi cốt lõi để xác định chính xác môi trường:
1. Nền tảng mục tiêu (Platform): Đây là Web Application (Next.js/React), Mobile App (React Native/Flutter), Desktop App hay Hệ thống nhúng/IoT kết nối phần cứng?
2. Công nghệ ưu tiên: Bạn muốn tôi đề xuất Tech Stack tối ưu hay bạn đã chỉ định sẵn Framework nào?
3. Quy mô & Hạ tầng: Tải dự kiến là bao nhiêu (số lượng giao dịch/ngày) và hệ thống chạy trên máy chủ cục bộ (On-premise) hay Cloud?

BƯỚC 2: SAU KHI TÔI TRẢ LỜI, HÃY TỰ ĐỘNG XUẤT RA FILE `SYSTEM_BLUEPRINT.MD` GỒM:
1. Cấu Trúc Thư Mục Tổng Quát Của Toàn Đồ Án (Comprehensive Project Directory Tree):
   - Vẽ cây thư mục chi tiết từ root đến các tầng kiến trúc (Clean Architecture / Layered Architecture): `src/core/`, `src/modules/`, `src/infrastructure/`, `tests/`, `.agents/`.
   - Giải thích rõ trách nhiệm của từng thư mục để tránh việc các tính năng sau này code lộn xộn.

2. Mô Hình Thực Thể & Lược Đồ PostgreSQL Chuẩn:
   - Toàn bộ các bảng trong CSDL: Khóa chính `UUIDv7`, tiền tệ lưu `INTEGER/BIGINT`, chỉ mục B-Tree/GIN, quan hệ 1-N, N-N.

3. Cây Phân Rã Chức Năng (Functional Decomposition Tree):
   - Liệt kê toàn bộ các nhóm chức năng lớn và các tính năng con từ lúc khởi đầu đến khi hoàn thiện.

4. Khởi Tạo Hạ Tầng & File Khai Báo Dependencies Bắt Buộc Cho Jules:
   - Dựa trên công nghệ đã chốt ở Bước 1, BẮT BUỘC khởi tạo ngay lập tức file quản lý thư viện tại thư mục gốc:
     + Nếu là Node/TypeScript/Web: Tạo ngay `package.json` (chứa sẵn các scripts: `"test": "vitest run"`, `"lint": "eslint ."`, `"typecheck": "tsc --noEmit"`).
     + Nếu là Python: Tạo ngay `requirements.txt` hoặc `pyproject.toml`.
     + Nếu là Go: Tạo ngay `go.mod`.
   - Khởi tạo đồng thời `GEMINI.md`, `docker-compose.yml` (PostgreSQL) và `PROJECT_STATE.md`.
   (Đảm bảo GitHub Actions và Google Jules có thể nhận diện môi trường và kích hoạt Sandbox Test được ngay lập tức!)

Sau khi hoàn tất, hãy nhắc tôi bước tiếp theo cần làm gì và cung cấp prompt tiếp theo!
```
