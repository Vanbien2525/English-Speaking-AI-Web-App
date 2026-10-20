# ĐẶC TẢ KỸ THUẬT: BẢNG THÀNH TÍCH, BIỂU ĐỒ TIẾN ĐỘ, CHUỖI NGÀY HỌC (STREAK) & SỔ CÁI XP (USER PROGRESS DASHBOARD & GAMIFICATION LEDGER)

- **Mã tính năng:** `FEAT-GAMIFICATION-AND-PROGRESS`
- **Phiên bản:** `1.0.0`
- **Trạng thái:** `APPROVED`
- **Tác giả:** Principal Systems Architect & Gamification Engineer
- **Mục tiêu:** Cung cấp phân hệ Bảng điều khiển tiến độ và Gamification toàn diện cho học viên, gồm:
  1. **Chuỗi Ngày Học (Streak Engine):** Thuật toán tính chuỗi ngày học thông minh, hỗ trợ đa múi giờ IANA, cơ chế đóng băng chuỗi (Streak Freeze) tự động và chống gian lận.
  2. **Sổ Cái Bất Biến (XP Ledger & ACID Engine):** Quản lý dòng điểm XP theo mô hình kế toán bất biến (append-only ledger) với khóa dòng `SELECT ... FOR UPDATE` và cơ chế chống trùng lặp `idempotency_key`.
  3. **Biểu Đồ Tiến Độ Siêu Tốc (0KB Three.js SSR/SSG):** Radar Chart 6 trục ngữ âm và Trendline phát âm 30 ngày dựng bằng Pure SVG tính toán phía server, tải tức thì không phụ thuộc thư viện đồ họa nặng.
  4. **Bộ Máy Danh Hiệu (Achievement Engine) & Bảng Xếp Hạng (Leaderboard):** Tự động mở khóa danh hiệu theo tiêu chí JSONB và xếp hạng học viên tuần/toàn thời gian hiệu năng cao trên PostgreSQL.

---

## 1. USER STORIES & TIÊU CHÍ CHẤP NHẬN (ACCEPTANCE CRITERIA)

### US-1: Chuỗi Ngày Học Liên Tiếp (Streak) & Cơ Chế Đóng Băng (Streak Freeze)
- **User Story:** Là một học viên, tôi muốn chuỗi ngày học tập của mình được ghi nhận chuẩn xác theo ngày lịch thực tế nơi tôi sinh sống, có cơ chế bảo vệ chuỗi nếu tôi bận 1 ngày và hệ thống đảm bảo tính công bằng, chống gian lận.
- **AC-1.1 (Chuẩn Hóa Múi Giờ Học Viên - Timezone Normalization):**
  - **Given:** Học viên thực hiện bài luyện tập và nộp kết quả về server.
  - **When:** Hệ thống tính toán ngày ghi nhận học tập (`practice_date`).
  - **Then:**
    - Lấy múi giờ IANA từ `users.preferences.timezone` (mặc định `'Asia/Ho_Chi_Minh'` nếu người dùng chưa cấu hình).
    - Chuyển đổi dấu thời gian chấm điểm (`scored_at` theo UTC) sang ngày địa phương định dạng chuẩn `YYYY-MM-DD` tại múi giờ đó bằng hàm chuẩn hóa deterministic.
    - Tuyệt đối không tin cậy thời gian hoặc ngày tháng do trình duyệt của client tự gửi lên.
- **AC-1.2 (Quy Tắc Chống Gian Lận Đạt Chuẩn - Anti-Cheat Validation):**
  - **Given:** Một lượt luyện tập (`practice_attempt`) gửi lên để kích hoạt streak.
  - **When:** Bộ máy Streak kiểm tra tính hợp lệ.
  - **Then:** Một ngày học chỉ được coi là hợp lệ (`is_streak_qualifying`) khi:
    1. Trạng thái attempt là `'scored'`.
    2. Điểm tổng thể `overall_score_bp >= 6000` (đạt mức Amber hoặc Emerald theo Design DNA).
    3. Thời lượng âm thanh thực `audio_duration_ms >= 1000` (loại bỏ click ảo hoặc file âm thanh rỗng).
- **AC-1.3 (Thuật Toán Tính Toán & Đóng Băng Chuỗi - Streak State Machine):**
  - **Given:** Bản ghi `user_stats` của học viên có `last_active_date`, `current_streak_days`, `longest_streak_days`.
  - **When:** Học viên hoàn thành lượt học đạt chuẩn vào ngày `today` (theo múi giờ địa phương):
    - **Trường hợp 1 (Học tiếp trong cùng ngày):** `today == last_active_date`: Giữ nguyên streak hiện tại, không cộng thêm.
    - **Trường hợp 2 (Ngày kế tiếp liên tục):** `today == last_active_date + 1 day`:
      - `current_streak_days = current_streak_days + 1`
      - `longest_streak_days = GREATEST(longest_streak_days, current_streak_days)`
      - `last_active_date = today`
    - **Trường hợp 3 (Gián đoạn đúng 1 ngày - Streak Freeze Rescue):** `today == last_active_date + 2 days`:
      - Kiểm tra số lượng Streak Freeze khả dụng trong `user_stats.streak_freezes_available` (hoặc `users.preferences.streak_freezes`).
      - Nếu `streak_freezes_available > 0`: Tiêu thụ 1 Streak Freeze (`streak_freezes_available - 1`), ghi log `streak_freeze_used`, bảo toàn và tăng streak: `current_streak_days = current_streak_days + 1`, `last_active_date = today`.
      - Nếu không có Streak Freeze: Chuỗi bị đứt, reset: `current_streak_days = 1`, `last_active_date = today`.
    - **Trường hợp 4 (Gián đoạn >= 2 ngày):** `today > last_active_date + 2 days`: Chuỗi bị đứt hoàn toàn, reset `current_streak_days = 1`, `last_active_date = today`.
- **AC-1.4 (Thưởng Streak Bonus XP):**
  - Khi học viên cán mốc chuỗi ngày đặc biệt (7 ngày, 14 ngày, 30 ngày, 100 ngày), hệ thống tự động phát sinh bản ghi thưởng XP tương ứng (`streak_bonus`) vào `xp_ledger`.

---

### US-2: Sổ Cái Bất Biến (XP Ledger) & Giao Dịch Khóa Dòng ACID
- **User Story:** Là một kỹ sư hệ thống, tôi muốn toàn bộ giao dịch cộng trừ XP phải được lưu trữ trong sổ cái bất biến (immutable append-only ledger), có khóa dòng chặt chẽ để chống race condition và bảo toàn tính toàn vẹn dữ liệu tài chính/gamification.
- **AC-2.1 (Mô Hình Sổ Cái Bất Biến - Append-Only Ledger):**
  - **Given:** Bảng `xp_ledger` và `user_stats` đã được khởi tạo trong Schema `0001_init_schema.sql`.
  - **Then:**
    - Tuyệt đối không bao giờ thực hiện câu lệnh `UPDATE` hoặc `DELETE` trên bảng `xp_ledger`.
    - Mọi biến động XP đều là một bản ghi mới với số dư sau giao dịch (`balance_after = current_total_xp + amount`).
    - Mỗi giao dịch bắt buộc gắn với một `idempotency_key` duy nhất (ví dụ: `attempt:<idempotency_key>`, `lesson:<userId>:<lessonId>`, `achievement:<userId>:<achievementCode>`).
- **AC-2.2 (Khóa Dòng Bi Quan - Pessimistic Row-Level Locking):**
  - **Given:** Một thao tác thay đổi XP (chấm điểm attempt, hoàn thành bài học, mở khóa danh hiệu).
  - **When:** Thao tác thực thi trong cơ sở dữ liệu PostgreSQL.
  - **Then:**
    1. Bắt đầu giao dịch ACID: `BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;`
    2. Khóa độc quyền dòng thống kê của người dùng:
       ```sql
       SELECT user_id, total_xp, current_streak_days, version
       FROM user_stats
       WHERE user_id = $1
       FOR UPDATE;
       ```
    3. Kiểm tra tính trùng lặp qua `xp_ledger`:
       ```sql
       SELECT id, balance_after FROM xp_ledger WHERE user_id = $1 AND idempotency_key = $2;
       ```
       Nếu đã tồn tại: Hoàn trả ngay dữ liệu hiện tại (Idempotency Hit), giải phóng khóa, không báo lỗi.
    4. Chèn bản ghi vào `xp_ledger`:
       ```sql
       INSERT INTO xp_ledger (id, user_id, amount, balance_after, source, reference_id, idempotency_key, created_at)
       VALUES (uuid_generate_v7(), $1, $amount, $new_balance, $source, $reference_id, $idempotency_key, NOW());
       ```
    5. Cập nhật `user_stats`:
       ```sql
       UPDATE user_stats
       SET total_xp = $new_balance,
           version = version + 1,
           updated_at = NOW()
       WHERE user_id = $1;
       ```
    6. `COMMIT;` giao dịch. Nếu xảy ra bất kỳ ngoại lệ nào, thực hiện `ROLLBACK;` hoàn toàn.

---

### US-3: Biểu Đồ Tiến Độ Phát Âm Siêu Tốc (0KB Three.js SSR/SSG)
- **User Story:** Là một học viên, tôi muốn quan sát biểu đồ đa chiều phản ánh điểm mạnh/yếu theo nhóm âm (Radar Chart) và đường xu hướng điểm số theo thời gian (Trendline) tải tức thì < 0.8s mà không bị giật lag hay ngốn pin do thư viện đồ họa 3D.
- **AC-3.1 (Radar Chart 6 Trục Ngữ Âm Bằng Pure Server-Rendered SVG):**
  - **Given:** Dữ liệu làm chủ âm vị của học viên từ `user_phoneme_mastery` kết hợp danh mục `phonemes`.
  - **When:** Server Component render biểu đồ Radar.
  - **Then:**
    - Nhóm 44 âm vị thành 6 trục đặc trưng ngữ âm chuẩn quốc tế:
      1. `Plosives` (Âm tắc: /p/, /b/, /t/, /d/, /k/, /g/)
      2. `Fricatives` (Âm xát: /f/, /v/, /θ/, /ð/, /s/, /z/, /ʃ/, /ʒ/, /h/)
      3. `Affricates` (Âm tắc xát: /tʃ/, /dʒ/)
      4. `Nasals` (Âm mũi: /m/, /n/, /ŋ/)
      5. `Approximants` (Âm tiếp cận & bán nguyên âm: /l/, /r/, /w/, /j/)
      6. `Vowels` (Nguyên âm đơn & đôi: monophthongs & diphthongs)
    - Tính điểm trung bình phần trăm $S_i \in [0, 100]$ cho từng trục $i \in \{0..5\}$.
    - Server tính toán tọa độ cực $(r_i, \theta_i)$ chuyển sang tọa độ Descartes $(x_i, y_i)$:
      $$x_i = x_{center} + (R \times \frac{S_i}{100}) \times \cos(\frac{i \times \pi}{3} - \frac{\pi}{2})$$
      $$y_i = y_{center} + (R \times \frac{S_i}{100}) \times \sin(\frac{i \times \pi}{3} - \frac{\pi}{2})$$
    - Kết xuất trực tiếp mã SVG thuần: đa giác nền, lưới đồng tâm, trục tỏa tia, đa giác điểm số với màu sắc token Design DNA (`fill: oklch(...)` mờ ảo và viền sắc nét) kèm hiệu ứng CSS hover/transition mượt mà.
    - Kích thước tải thêm của thư viện đồ họa: **Chính xác 0 KB** (Zero external charting bundle).
- **AC-3.2 (Đường Xu Hướng Điểm Số 30 Ngày Gần Nhất - Progress Trendline):**
  - **Given:** Lịch sử luyện tập 30 ngày gần nhất từ bảng `practice_attempts`.
  - **When:** Server Component kết xuất biểu đồ xu hướng.
  - **Then:**
    - Nhóm các bài luyện tập theo ngày, tính điểm trung bình `AVG(overall_score_bp) / 100`% cho từng ngày có hoạt động.
    - Server tự động nội suy đường cong Bezier khối bậc 3 (Cubic Bezier curve `d="M ... C ..."`) tạo đường nét mềm mại cao cấp.
    - Vẽ vùng diện tích Gradient fill phía dưới đường cong kết hợp các điểm chốt (data point circles) hiển thị tooltip điểm số khi rê chuột.
- **AC-3.3 (Cách Ly Tuyệt Đối Ba Chiều - 0KB Three.js):**
  - Trang Dashboard `/progress` (hoặc `/dashboard`) tuyệt đối không import Three.js, `@react-three/fiber`, `@react-three/drei`.
  - Được kiểm chứng tự động bằng bài test AST Bundle Isolation trong CI.

---

### US-4: Bộ Máy Mở Khóa Danh Hiệu (Achievement Engine) & Bảng Xếp Hạng (Leaderboard)
- **User Story:** Là một học viên, tôi muốn mở khóa các huy hiệu danh giá khi đạt cột mốc học tập và xem vị trí của mình trên bảng xếp hạng tuần cũng như bảng vàng toàn thời gian.
- **AC-4.1 (Bộ Máy Mở Khóa Danh Hiệu Đồng Bộ - Sync Achievement Engine):**
  - **Given:** Bảng `achievements` và `user_achievements`.
  - **When:** Một lượt học hoặc bài học hoàn thành được lưu thành công.
  - **Then:**
    - Truy vấn các danh hiệu người dùng **chưa mở khóa**:
      ```sql
      SELECT a.* FROM achievements a
      WHERE NOT EXISTS (
        SELECT 1 FROM user_achievements ua WHERE ua.user_id = $userId AND ua.achievement_id = a.id
      );
      ```
    - Trình đánh giá tiêu chí (`CriteriaEvaluator`) kiểm tra dữ liệu hiện tại của người dùng đối chiếu với trường `achievements.criteria` (JSONB):
      - `{"type": "streak", "minDays": 7}`: Đạt khi `current_streak_days >= 7`.
      - `{"type": "phoneme_mastery", "ipa": "θ", "minScoreBp": 8000}`: Đạt khi âm /θ/ có điểm trung bình >= 80.00%.
      - `{"type": "lessons_completed", "count": 10}`: Đạt khi số bài hoàn thành >= 10.
      - `{"type": "total_attempts", "count": 50}`: Đạt khi tổng số lượt phát âm >= 50.
    - Với mỗi danh hiệu thỏa mãn:
      1. Insert vào `user_achievements (user_id, achievement_id, unlocked_at)`.
      2. Cộng điểm thưởng danh hiệu vào `xp_ledger` nguồn `'achievement_unlocked'` và cập nhật `user_stats.total_xp`.
      3. Trả về mảng danh hiệu vừa mở khóa trong response để client hiển thị hoạt ảnh vinh danh (Celebration Modal/Sonner toast).
- **AC-4.2 (Bảng Xếp Hạng Hiệu Năng Cao - Leaderboard Queries):**
  - **Leaderboard Toàn Thời Gian (All-Time):**
    - Truy vấn Top 50 học viên có điểm XP cao nhất:
      ```sql
      SELECT
        u.id AS user_id,
        u.display_name,
        s.total_xp,
        s.current_streak_days,
        s.lessons_completed,
        DENSE_RANK() OVER (ORDER BY s.total_xp DESC) AS rank
      FROM user_stats s
      JOIN users u ON u.id = s.user_id
      WHERE u.deleted_at IS NULL
      ORDER BY s.total_xp DESC
      LIMIT 50;
      ```
    - Nếu người dùng hiện tại không nằm trong Top 50, thực hiện truy vấn thứ hai để lấy chính xác Rank và chỉ số của họ:
      ```sql
      WITH ranked_users AS (
        SELECT user_id, DENSE_RANK() OVER (ORDER BY total_xp DESC) AS rank
        FROM user_stats
      )
      SELECT rank FROM ranked_users WHERE user_id = $current_user_id;
      ```
  - **Leaderboard Tuần Năng Động (Weekly Leaderboard):**
    - Tổng hợp lượng XP tích lũy trong tuần hiện tại (bắt đầu từ 00:00:00 Thứ Hai theo UTC/Local) thông qua composite index `(created_at, user_id) INCLUDE (amount)` trên `xp_ledger`:
      ```sql
      SELECT
        u.id AS user_id,
        u.display_name,
        COALESCE(SUM(l.amount), 0)::BIGINT AS weekly_xp,
        DENSE_RANK() OVER (ORDER BY COALESCE(SUM(l.amount), 0) DESC) AS rank
      FROM xp_ledger l
      JOIN users u ON u.id = l.user_id
      WHERE l.created_at >= DATE_TRUNC('week', NOW())
        AND u.deleted_at IS NULL
      GROUP BY u.id, u.display_name
      ORDER BY weekly_xp DESC
      LIMIT 50;
      ```
    - Tốc độ thực thi: `< 15ms` trên cơ sở dữ liệu production nhờ tận dụng tối đa Index Covering.

---

## 2. KIẾN TRÚC DỮ LIỆU & DATA TRANSFER OBJECTS (DTOs)

### 2.1. Zod v4 Schemas (`src/core/dto/progress.dto.ts`)

```typescript
import { z } from "zod";

export const XpSourceEnum = z.enum([
  "attempt_scored",
  "lesson_completed",
  "streak_bonus",
  "achievement_unlocked",
  "admin_adjustment",
]);

// Thông số Cấp độ (Level Formula)
export const UserLevelSchema = z.object({
  currentLevel: z.number().int().positive(),
  currentLevelTitle: z.string(),
  currentXp: z.string(), // BigInt serialized as string
  xpForNextLevel: z.string(),
  progressPercent: z.number().min(0).max(100),
});

// Trục Radar Ngữ Âm
export const PhonemeRadarAxisSchema = z.object({
  axisKey: z.enum(["plosives", "fricatives", "affricates", "nasals", "approximants", "vowels"]),
  labelVi: z.string(),
  labelEn: z.string(),
  scoreBp: z.number().int().min(0).max(10000), // Basis points (0..10000)
  percentage: z.number().min(0).max(100),
  phonemesSample: z.array(z.string()),
  attemptsCount: z.number().int().nonnegative(),
});

// Điểm đường xu hướng phát âm 30 ngày
export const ProgressTrendPointSchema = z.object({
  date: z.string(), // YYYY-MM-DD
  averageScoreBp: z.number().int().min(0).max(10000),
  percentage: z.number().min(0).max(100),
  attemptsCount: z.number().int().positive(),
});

// Thành tựu / Danh hiệu
export const AchievementItemSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  titleVi: z.string(),
  descriptionVi: z.string(),
  icon: z.string(),
  xpReward: z.number().int().nonnegative(),
  isUnlocked: z.boolean(),
  unlockedAt: z.string().datetime().nullable(),
  progressPercent: z.number().min(0).max(100).optional(),
});

// Mục bảng xếp hạng
export const LeaderboardEntrySchema = z.object({
  rank: z.number().int().positive(),
  userId: z.string().uuid(),
  displayName: z.string(),
  score: z.string(), // Total XP hoặc Weekly XP
  streakDays: z.number().int().nonnegative().optional(),
  isCurrentUser: z.boolean(),
});

// Bảng xếp hạng hoàn chỉnh
export const LeaderboardDataSchema = z.object({
  timeframe: z.enum(["weekly", "all_time"]),
  topRanked: z.array(LeaderboardEntrySchema),
  currentUserRank: LeaderboardEntrySchema.nullable(),
});

// Lịch sử biến động Sổ cái XP
export const XpLedgerEntrySchema = z.object({
  id: z.string().uuid(),
  amount: z.string(), // "+50", "+100"
  balanceAfter: z.string(),
  source: XpSourceEnum,
  sourceLabelVi: z.string(),
  referenceId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
});

// Payload tổng hợp trả về cho trang Dashboard
export const UserProgressDashboardSchema = z.object({
  userId: z.string().uuid(),
  displayName: z.string(),
  levelInfo: UserLevelSchema,
  streakInfo: z.object({
    currentStreakDays: z.number().int().nonnegative(),
    longestStreakDays: z.number().int().nonnegative(),
    lastActiveDate: z.string().nullable(),
    streakFreezesAvailable: z.number().int().nonnegative(),
    isFrozenToday: z.boolean(),
    streakStatus: z.enum(["active", "at_risk", "lost"]),
  }),
  radarAxes: z.array(PhonemeRadarAxisSchema),
  trendHistory: z.array(ProgressTrendPointSchema),
  recentLedger: z.array(XpLedgerEntrySchema),
  summaryStats: z.object({
    totalXp: z.string(),
    lessonsCompleted: z.number().int().nonnegative(),
    totalAttempts: z.number().int().nonnegative(),
    averageMasteryBp: z.number().int().min(0).max(10000),
  }),
});

export type UserProgressDashboardDTO = z.infer<typeof UserProgressDashboardSchema>;
export type LeaderboardDataDTO = z.infer<typeof LeaderboardDataSchema>;
export type AchievementItemDTO = z.infer<typeof AchievementItemSchema>;
```

---

## 3. THUẬT TOÁN CHI TIẾT & CÔNG THỨC TOÁN HỌC

### 3.1. Công thức Tính Cấp Độ Học Viên (Level & Progression Curve)
Hệ thống sử dụng đường cong tiến trình bậc hai (quadratic progression curve) để tạo sự phấn khích ở các cấp đầu và tăng tính thử thách ở các cấp cao:
- **Cấp độ hiện tại ($L$):**
  $$L(total\_xp) = \lfloor \sqrt{\frac{total\_xp}{100}} \rfloor + 1$$
- **XP tối thiểu cần để đạt Cấp $L$ ($XP_{req}(L)$):**
  $$XP_{req}(L) = (L - 1)^2 \times 100$$
- **XP cần để lên Cấp tiếp theo ($L+1$):**
  $$XP_{next}(L) = L^2 \times 100$$
- **Tiến độ phần trăm trong cấp hiện tại ($P$):**
  $$P = \frac{total\_xp - XP_{req}(L)}{XP_{next}(L) - XP_{req}(L)} \times 100\%$$

*Bảng tra cứu cấp độ mẫu:*
| Cấp độ ($L$) | Danh hiệu (Title) | Tổng XP Tối Thiểu | XP Cần Cho Cấp Này |
| :--- | :--- | :--- | :--- |
| **Cấp 1** | Người Mới Bắt Đầu (Novice Speaker) | 0 XP | 100 XP |
| **Cấp 2** | Tập Sự Ngữ Âm (Phonetic Explorer) | 100 XP | 300 XP |
| **Cấp 3** | Người Luyện Âm Chăm Chỉ (Vocal Apprentice) | 400 XP | 500 XP |
| **Cấp 5** | Chiến Binh Khẩu Hình (Articulatory Adept) | 1,600 XP | 900 XP |
| **Cấp 10** | Bậc Thầy Phát Âm RP (Received Pronunciation Master) | 8,100 XP | 1,900 XP |

---

### 3.2. Thuật Toán Trực Quan Hóa Radar SVG (Pure Geometry Math)
Radar Chart có bán kính $R = 140$, tâm tại $(175, 175)$ trong viewBox `0 0 350 350`. Với 6 trục đối xứng, góc lệch giữa hai trục kế tiếp là $\Delta \theta = \frac{2\pi}{6} = 60^\circ$ ($\frac{\pi}{3}$ rad), bắt đầu từ đỉnh trên cùng ($-\frac{\pi}{2}$):

```typescript
// src/modules/progress/utils/radar-geometry.ts
export interface Point2D {
  x: number;
  y: number;
}

export function calculateRadarCoordinates(
  scores: number[], // 6 giá trị phần trăm (0..100)
  center: Point2D = { x: 175, y: 175 },
  radius: number = 140
): { polygonPoints: string; axisEndpoints: Point2D[]; dataPoints: Point2D[] } {
  const points: Point2D[] = [];
  const axisEndpoints: Point2D[] = [];

  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 - Math.PI / 2;
    // Điểm cực đại của trục
    axisEndpoints.push({
      x: Number((center.x + radius * Math.cos(angle)).toFixed(2)),
      y: Number((center.y + radius * Math.sin(angle)).toFixed(2)),
    });

    // Điểm thực tế theo điểm số phần trăm
    const scoreFraction = Math.max(0, Math.min(100, scores[i] ?? 0)) / 100;
    const r = radius * scoreFraction;
    points.push({
      x: Number((center.x + r * Math.cos(angle)).toFixed(2)),
      y: Number((center.y + r * Math.sin(angle)).toFixed(2)),
    });
  }

  const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  return { polygonPoints, axisEndpoints, dataPoints: points };
}
```

---

### 3.3. Thuật Toán Nội Suy Đường Cong Bezier Khối (Smooth Trendline Path)
Để vẽ đường biểu diễn xu hướng điểm số mềm mại không gãy khúc:

```typescript
// src/modules/progress/utils/trendline-geometry.ts
export function generateSmoothTrendlinePath(
  points: Array<{ x: number; y: number }>
): { pathD: string; areaD: string } {
  if (points.length === 0) return { pathD: "", areaD: "" };
  if (points.length === 1) {
    return {
      pathD: `M ${points[0].x} ${points[0].y}`,
      areaD: `M ${points[0].x} ${points[0].y} L ${points[0].x} 200 Z`,
    };
  }

  let pathD = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    // Control point 1
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;

    // Control point 2
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    pathD += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  const lastPoint = points[points.length - 1];
  const areaD = `${pathD} L ${lastPoint.x} 200 L ${points[0].x} 200 Z`;

  return { pathD, areaD };
}
```

---

## 4. THIẾT KẾ KIẾN TRÚC TẦNG & GIAO DIỆN (CLEAN ARCHITECTURE)

```
src/
├── app/
│   └── progress/                      # Trang Dashboard SSR/SSG chính
│       ├── page.tsx                   # Server Component: fetching dữ liệu song song
│       ├── loading.tsx                # Skeleton tải trang
│       └── leaderboard/
│           └── page.tsx               # Trang chi tiết Bảng xếp hạng Tuần / All-Time
├── core/
│   ├── dto/
│   │   └── progress.dto.ts            # Zod schemas & TypeScript types
│   ├── domain/
│   │   ├── streak-calculator.ts       # Domain logic: Timezone, Streak, Streak Freeze
│   │   └── level-calculator.ts        # Domain logic: Level, Title, XP Curve
│   ├── repositories/
│   │   ├── progress-repository.ts     # Giao dịch ACID, locking, queries hiệu năng cao
│   │   └── achievement-repository.ts  # Criteria evaluator, unlock mutations
│   └── services/
│       ├── progress-service.ts        # Tổng hợp Dashboard, điều phối XP & Streak
│       └── leaderboard-service.ts     # Caching & xếp hạng học viên
└── modules/
    └── progress/
        ├── components/
        │   ├── ProgressHeader.tsx          # Level, XP bar, Streak Fire badge
        │   ├── PhonemeRadarCard.tsx        # Pure SVG Radar Chart (0KB Three.js)
        │   ├── ProgressTrendCard.tsx       # Pure SVG Bezier Trendline (30 ngày)
        │   ├── AchievementsBadgeGrid.tsx   # Danh sách huy hiệu vàng/bạc/khóa
        │   ├── MiniLeaderboardCard.tsx     # Top 5 học viên + vị trí cá nhân
        │   ├── XpLedgerHistoryDrawer.tsx   # Lịch sử sổ cái minh bạch
        │   └── StreakFreezeModal.tsx       # Hộp thoại giải cứu chuỗi ngày học
        └── utils/
            ├── radar-geometry.ts           # Toán học tính tọa độ SVG
            └── trendline-geometry.ts       # Toán học nội suy Bezier
```

---

## 5. THIẾT KẾ GIAO DIỆN LUXURY DESIGN DNA

### 5.1. Token Màu Sắc & Ngữ Nghĩa Gamification
Tuân thủ nghiêm ngặt hệ thống Design DNA định nghĩa tại `src/app/globals.css`:
- **Streak Fire Accent:** `linear-gradient(135deg, #f59e0b, #ef4444)` (Cam rực lửa đến Đỏ năng lượng).
- **Streak Frozen Accent:** `linear-gradient(135deg, #06b6d4, #3b82f6)` (Xanh băng tuyết dịu mát khi dùng Freeze).
- **XP Currency Token:** `oklch(0.85 0.18 85)` (Vàng hoàng kim sang trọng).
- **Level Tier Badges:**
  - Level 1-4 (Bronze/Wood): `slate-400 / amber-700`
  - Level 5-9 (Silver/Steel): `slate-200 / sky-400`
  - Level 10+ (Gold/Master): `amber-300 / yellow-500`

### 5.2. Hiệu Ứng Micro-Interactions (GSAP / CSS Transitions)
- Khi mở trang, đường viền Radar SVG stroke được kích hoạt hiệu ứng vẽ dần (`stroke-dasharray`, `stroke-dashoffset`) với thời lượng 800ms.
- Thẻ huy hiệu mở khóa có hiệu ứng shimmer sáng lướt qua khi hover.
- Bảng xếp hạng Top 3 Podiums có ánh hào quang nhẹ (box-shadow viền ngọc).

---

## 6. MA TRẬN KIỂM THỬ TỰ ĐỘNG (ACCEPTANCE TESTING MATRIX)

Toàn bộ tính năng phải đạt 100% tỷ lệ pass trên bộ test suite Vitest trước khi tạo PR:

| Mã Kiểm Thử | Phân Loại | Kịch Bản & Kỳ Vọng Chấp Nhận | File Test Dự Kiến |
| :--- | :--- | :--- | :--- |
| `TC-STREAK-01` | Unit | Tính chuỗi chuẩn xác khi học liên tiếp 2 ngày theo múi giờ `Asia/Ho_Chi_Minh`. | `tests/unit/streak-calculator.test.ts` |
| `TC-STREAK-02` | Unit | Bỏ lỡ 1 ngày nhưng có Streak Freeze -> Giữ nguyên chuỗi, trừ 1 freeze. | `tests/unit/streak-calculator.test.ts` |
| `TC-STREAK-03` | Unit | Bỏ lỡ 1 ngày không có Streak Freeze -> Reset chuỗi về 1 ngày. | `tests/unit/streak-calculator.test.ts` |
| `TC-STREAK-04` | Unit | Lượt học dưới 6000 điểm hoặc dưới 1s audio -> Không được tính vào streak. | `tests/unit/streak-calculator.test.ts` |
| `TC-ACID-01` | Integration | Hai luồng đồng thời cộng XP cho 1 user -> Lock `FOR UPDATE` tuần tự hóa, XP không bị mất mát. | `tests/integration/xp-ledger-acid.test.ts` |
| `TC-ACID-02` | Integration | Retry request với cùng `idempotency_key` -> Trả về kết quả cũ, không ghi thêm bản ghi ledger. | `tests/integration/xp-ledger-acid.test.ts` |
| `TC-ACID-03` | Integration | Lỗi xảy ra giữa chừng giao dịch -> Toàn bộ thay đổi rollback 100%, total XP không đổi. | `tests/integration/xp-ledger-acid.test.ts` |
| `TC-RADAR-01` | Unit | Toán học tọa độ 6 trục sinh ra chuỗi polygon SVG chuẩn xác trong phạm vi viewBox. | `tests/unit/radar-geometry.test.ts` |
| `TC-ACHIEVE-01`| Integration | Đạt 7 ngày streak -> Tự động mở khóa huy hiệu `streak_7_days` và cộng 100 XP vào ledger. | `tests/integration/achievement-engine.test.ts` |
| `TC-LEADER-01` | Integration | Truy vấn Bảng xếp hạng Top 50 trả về thứ hạng DENSE_RANK chuẩn xác không bị ngắt quãng. | `tests/integration/leaderboard.test.ts` |
| `TC-BUNDLE-01` | Architecture| AST Analysis xác nhận `/progress` và `src/modules/progress` không chứa bất kỳ import nào từ `three`. | `tests/acceptance/bundle-isolation.test.ts` |

---

## 7. QUY TRÌNH PHÁT TRIỂN & DEPLOYMENT (CI/CD CONTRACT)

1. **Giai đoạn 3: Wireframe Google Stitch & Kế Hoạch Kiểm Thử TDD:**
   - Tạo mockup giao diện Dashboard qua StitchMCP.
   - Viết tài liệu `.agents/plans/gamification-and-progress.plan.md`.
2. **Giai đoạn 4 - Lượt 1 (Backend Core & TDD):**
   - Triển khai `ProgressRepository`, `StreakCalculator`, `AchievementEvaluator` với kiểm thử Red-to-Green 100% đậu.
3. **Giai đoạn 4 - Lượt 2 (Frontend Pure SVG & Luxury Polish):**
   - Dựng giao diện Dashboard SSR/SSG với SVG charts thuần, kết nối dữ liệu từ Server Component.
4. **Giai đoạn 5 (Jules Cloud Audit & Single PR Flow):**
   - Tạo GitHub Issue với nhãn `jules`.
   - Google Labs Jules spin-up cloud VM xác minh độc lập `npm test` và `npm run build`.
   - Duy nhất 1 PR `feature/gamification-and-progress` được merge vào `main` bởi Human Tech Lead (`Vanbien2525`).
