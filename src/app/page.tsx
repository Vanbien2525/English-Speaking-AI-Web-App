import Link from "next/link";

const PILLARS = [
  {
    title: "Chấm điểm từng âm vị",
    body: "AI bóc tách phát âm của bạn tới cấp độ IPA, chỉ rõ âm bị thay thế, nuốt âm hay thêm âm.",
  },
  {
    title: "Khẩu hình 3D X-Ray",
    body: "Xoay 360° mặt cắt khoang miệng để thấy vị trí lưỡi, răng và môi cho từng âm khó.",
  },
  {
    title: "Giọng mẫu British RP",
    body: "Nghe giọng đọc chuẩn Anh – Anh rồi so sánh sóng âm với chính giọng của bạn.",
  },
] as const;

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col justify-center gap-12 px-6 py-16">
      <header className="flex flex-col gap-4">
        <p className="ipa text-lg text-primary">/ˈspiːkɪŋ ˈtjuːtə/</p>
        <h1 className="text-4xl font-bold leading-tight md:text-5xl">
          Phát âm tiếng Anh chuẩn xác, nhìn thấy được từng chuyển động của lưỡi.
        </h1>
        <p className="max-w-2xl text-lg text-ink-muted">
          Nền tảng luyện nói cá nhân hóa kết hợp AI chấm điểm âm vị và mô phỏng giải phẫu 3D — chạy hoàn toàn trên máy của bạn.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/practice"
            className="inline-flex min-h-11 items-center rounded-xl bg-primary px-6 font-semibold text-canvas hover:brightness-110 transition-all shadow-md"
          >
            Vào phòng luyện phát âm 3D
          </Link>
          <Link
            href="/learn"
            className="inline-flex min-h-11 items-center rounded-xl bg-surface-raised border border-border-subtle px-6 font-semibold text-ink hover:border-primary/50 transition-all"
          >
            Khám phá Bản đồ 44 Âm IPA & Bài học
          </Link>
          <Link
            href="/progress"
            className="inline-flex min-h-11 items-center rounded-xl bg-surface-raised border border-border-subtle px-6 font-semibold text-ink hover:border-amber-400/50 transition-all"
          >
            🔥 Bảng Thành Tích & Sổ Cái XP
          </Link>
        </div>
      </header>

      <section aria-labelledby="pillars-heading" className="flex flex-col gap-6">
        <h2 id="pillars-heading" className="sr-only">
          Tính năng chính
        </h2>
        <ul className="grid gap-4 md:grid-cols-3">
          {PILLARS.map((pillar) => (
            <li key={pillar.title} className="rounded-2xl border border-border-subtle bg-surface p-6">
              <h3 className="mb-2 text-lg font-semibold">{pillar.title}</h3>
              <p className="text-sm text-ink-muted">{pillar.body}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
