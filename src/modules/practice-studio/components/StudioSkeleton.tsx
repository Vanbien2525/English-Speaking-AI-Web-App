export function StudioSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface"
    >
      <div className="size-16 animate-pulse rounded-full bg-surface-raised" />
      <p className="text-sm text-ink-muted">Đang nạp phòng luyện phát âm 3D…</p>
    </div>
  );
}
