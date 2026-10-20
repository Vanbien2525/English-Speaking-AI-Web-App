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

## [>] Vòng Lặp Tính Năng Đang Thực Hiện: [Tính Năng 2: Bản Đồ 44 Âm Vị IPA & Phân Hệ Danh Mục Bài Học CEFR]
- [x] Giai đoạn 2: /grill-me khảo sát kiến trúc Bản đồ IPA -> Đã lưu .agents/specs/ipa-map-and-lessons.spec.md
- [x] Giai đoạn 3: Wireframe Stitch (Screen 0ffff379) & Kế hoạch Sub-components -> Đã lưu plan.md
- [x] Giai đoạn 4 - Lượt 1: Backend TDD Red-to-Green Pass 100% (20/20 curriculum tests green, 52/52 total suite green)
- [x] Giai đoạn 4 - Lượt 2: Frontend SSR/SSG Siêu tốc (0KB Three.js, Design DNA OKLCH, Motion Cards, 58/58 tests green)
- [>] Giai đoạn 5: Đã mở PR #4 (https://github.com/Vanbien2525/English-Speaking-AI-Web-App/pull/4), gán nhãn `jules` và comment kích hoạt Jules Audit độc lập. Đang chờ Jules duyệt để Tech Lead Squash and Merge.

## [ ] Giai Đoạn Phát Hành (Final Release)
- [ ] Chạy Full Regression Test Suite Pass 100%
- [ ] Security Audit & Database Index Tuning Pass
- [ ] Jules Approve Release v1.0.0
