# PROMPT 5: Nâng Cấp Giao Diện Front-end Đẳng Cấp Thế Giới (Giai Đoạn 4 - Lượt 2)

```markdown
/goal Dựa trên khung layout từ Google Stitch của màn hình [Tên màn hình], hãy kết nối vào API [Tên API Backend vừa tạo] và tái cấu trúc toàn bộ giao diện này thành một kiệt tác Front-end đẳng cấp thế giới (World-Class Creative UI/UX) theo tiêu chuẩn của Awwwards, Stripe và Linear, sử dụng React, Tailwind CSS và Framer Motion:

1. Micro-interactions & Spring Physics (Chuẩn Linear):
   - Tuyệt đối không sử dụng hiệu ứng chuyển động tuyến tính (duration-based). Toàn bộ các trạng thái Hover, Tap, Active phải sử dụng cơ chế vật lý lò xo (Spring Physics) của Framer Motion với các thông số tối ưu: stiffness: 300, damping: 30, mass: 0.8.
   - Thêm tương tác nhấn chuột nhẹ nhàng: whileTap={{ scale: 0.98, y: 1 }}.
   - Thiết kế trạng thái Focus chuẩn Accessibility nhưng mang tính thẩm mỹ cao (focus-visible:ring-2 ring-primary/50 ring-offset-2 ring-offset-background).

2. Choreographed Motion & Layout Morphing (Chuẩn Awwwards):
   - Áp dụng kỹ thuật Shared Element Transitions: Sử dụng thuộc tính `layoutId` của Framer Motion để tạo hiệu ứng biến hình mượt mà (Morphing) khi đóng/mở các component chi tiết hoặc chuyển đổi trạng thái phần tử. Các thành phần phải tự di chuyển và nở rộng tự nhiên sang vị trí mới, tránh sử dụng fade-in/fade-out thô cứng.
   - Khi render danh sách, áp dụng Choreographed Staggered Animation với `staggerChildren: 0.04` và `delayChildren: 0.1`. Các phần tử con trồi lên kết hợp `opacity` và `y: [15, 0]` một cách thanh thoát nhằm tối ưu hóa hiệu năng cảm giác (Perceived Performance).

3. Premium Depth, Layered Shadows & Neon Blend (Chuẩn Stripe):
   - Thiết kế chiều sâu vật lý chân thực bằng kỹ thuật đổ bóng đa lớp (Multi-layered physical box-shadows) chồng từ 4-6 lớp mịn màng, thay thế hoàn toàn hệ thống shadow mặc định của Tailwind.
   - Áp dụng Glassmorphism cao cấp: Sử dụng sự kết hợp giữa `backdrop-blur-md`, tinh chỉnh độ mờ nền `bg-white/65` hoặc `bg-slate-900/65` tùy thuộc vào hệ màu Dark/Light Mode.
   - Viền của các khối hộp phải sử dụng đường viền Gradient tinh tế (Subtle Gradient Borders) thông qua thuộc tính `background-clip` hoặc các lớp giả `::before`.
   - Đối với các vệt sáng phát sáng (Neon Glow Effect) di chuyển theo chuột, sử dụng hiệu ứng hòa trộn màu `mix-blend-mode: screen` (trên nền tối) hoặc `overlay` để ánh sáng hòa quyện tự nhiên vào giao diện mà không bị cháy màu.

4. Fluid Canvas & Responsive Stability:
   - Thay vì phụ thuộc vào các breakpoint tĩnh (`sm`, `md`, `lg`) của Tailwind, hãy áp dụng tư duy thiết kế chất lỏng (Fluid Design). Sử dụng hàm toán học CSS `clamp()` và đơn vị `vw/vh` cho Typography, Padding và Margin để giao diện co giãn hoàn hảo từng pixel trên mọi tỷ lệ màn hình (từ Mobile đến Ultrawide 49-inch) mà không gãy bố cục.

5. Resilient UX & Optimistic UI (Chuẩn Kỹ thuật Thực chiến):
   - Khi gửi các yêu cầu đột biến (Like, Toggle trạng thái, Lưu dữ liệu) lên PostgreSQL API, hãy áp dụng cơ chế Cập nhật lạc quan (Optimistic UI Updates) để thay đổi giao diện ngay lập tức trong vòng 16ms, tạo cảm giác web nhanh tức thì. Tự động viết hàm Rollback trạng thái mượt mà nếu API trả về lỗi kèm thông báo Toast nghệ thuật (sử dụng thư viện Sonner).
   - Trong trạng thái chờ nạp dữ liệu ban đầu (Fetch data): Thiết kế hệ thống Skeleton Shimmer Loading chuyển động mượt mà, cấu trúc hình khối khớp tỷ lệ 1:1 với UI thực tế để tránh hiện tượng giật giật bố cục (Layout Shift - CLS = 0).
   - Tách biệt và bọc các phân vùng Component quan trọng bằng React Error Boundary để cô lập lỗi, đảm bảo lỗi API không làm sập toàn bộ ứng dụng.

6. API Integration & GPU Optimization:
   - Viết mã xử lý tích hợp dữ liệu trọn vẹn vào hệ thống Backend PostgreSQL API thông qua Fetch/Axios trong React (ưu tiên cấu trúc React Query hoặc custom hooks sạch sẽ).
   - Đảm bảo toàn bộ các phần tử có hiệu ứng chuyển động phức tạp hoặc hiệu ứng Glassmorphism được gán các thuộc tính `transform-gpu` hoặc `will-change` để kích hoạt tăng tốc phần cứng (Hardware Acceleration), duy trì hiệu năng ổn định chuẩn 60fps - 120fps trên mọi thiết bị.

7. Kiến Trúc Component Mô-đun Hóa (Modular Component Architecture):
   - Tuyệt đối không viết dồn toàn bộ UI vào một file nguyên khối (Monolithic file > 250 dòng).
   - Bắt buộc tách rời và đóng gói các hiệu ứng phức tạp thành các Sub-components / Wrappers tái sử dụng cao cấp:
     + `<MotionCard>`: Tích hợp sẵn spring physics, elevation hover, và layoutId morphing.
     + `<SpotlightContainer>`: Quản lý vệt sáng neon di chuyển theo con trỏ chuột với mix-blend-mode.
     + `<FluidText>` / `<FluidContainer>`: Tự động tính toán co giãn linh hoạt bằng CSS clamp().
   - Giữ file giao diện chính đóng vai trò là Orchestrator điều phối layout sạch sẽ, dễ đọc, dễ bảo trì và tối ưu hóa context cho Antigravity.

Sau khi hoàn thành và test giao diện mượt mà, hãy tự động chạy lệnh mở Pull Request lên GitHub và nhúng Prompt Tự Động cho GitHub Jules!
```
