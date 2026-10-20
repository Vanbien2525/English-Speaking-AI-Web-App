export function CurriculumSkeleton() {
  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto py-6 px-4 md:px-8 animate-pulse">
      {/* 1. Header & Tabs Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-surface border border-border-subtle">
        <div className="space-y-3">
          <div className="h-4 w-32 bg-surface-raised rounded-full" />
          <div className="h-8 w-72 bg-surface-raised rounded-lg" />
          <div className="h-4 w-96 bg-surface-raised rounded" />
        </div>
        <div className="h-12 w-64 bg-surface-raised rounded-xl" />
      </div>

      {/* 2. Banner Skeleton */}
      <div className="h-20 w-full rounded-2xl bg-surface border border-border-subtle" />

      {/* 3. Heatmap / Cards Grid Skeleton */}
      <div className="space-y-6">
        <div className="h-6 w-48 bg-surface-raised rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={`skel-cell-${i}`}
              className="h-28 rounded-2xl bg-surface border border-border-subtle"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
