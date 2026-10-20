import { ProgressSkeleton } from "@/modules/progress/components/ProgressSkeleton";

export default function ProgressLoading() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-7xl flex-col gap-8 px-4 py-8 md:px-8">
      <ProgressSkeleton />
    </main>
  );
}
