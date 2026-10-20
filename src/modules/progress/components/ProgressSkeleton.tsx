export function ProgressSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-pulse" data-testid="progress-skeleton">
      {/* 1. Header Skeleton */}
      <div className="flex flex-col gap-6 rounded-2xl bg-surface p-6 border border-border-subtle shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="h-6 w-48 rounded-full bg-surface-raised" />
          <div className="h-6 w-32 rounded-full bg-surface-raised" />
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-t border-border-subtle/50 pt-5">
          <div className="flex flex-col gap-2">
            <div className="h-8 w-72 rounded-lg bg-surface-raised" />
            <div className="h-4 w-96 rounded bg-surface-raised" />
          </div>
          <div className="h-10 w-44 rounded-xl bg-surface-raised" />
        </div>
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-border-subtle/30">
          <div className="h-16 rounded-xl bg-surface-raised" />
          <div className="h-16 rounded-xl bg-surface-raised" />
          <div className="h-16 rounded-xl bg-surface-raised" />
          <div className="h-16 rounded-xl bg-surface-raised" />
        </div>
      </div>

      {/* 2. Main Content 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (7 cols): Radar + Trendline */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          <div className="h-[420px] rounded-2xl bg-surface border border-border-subtle" />
          <div className="h-[320px] rounded-2xl bg-surface border border-border-subtle" />
        </div>

        {/* Right Column (5 cols): Leaderboard + Achievements */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          <div className="h-[380px] rounded-2xl bg-surface border border-border-subtle" />
          <div className="h-[360px] rounded-2xl bg-surface border border-border-subtle" />
        </div>
      </div>
    </div>
  );
}
