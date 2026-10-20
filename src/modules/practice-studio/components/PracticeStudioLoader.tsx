"use client";

import dynamic from "next/dynamic";
import type { ErrorInfo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { StudioErrorFallback } from "./StudioErrorFallback";
import { StudioSkeleton } from "./StudioSkeleton";
import { StudioViewportToolbar } from "../three/StudioViewportToolbar";

const StudioCanvas = dynamic(
  () => import("../three/StudioCanvas").then((mod) => mod.StudioCanvas),
  { ssr: false, loading: () => <StudioSkeleton /> },
);

function reportStudioError(error: unknown, info: ErrorInfo): void {
  console.error("[PracticeStudio] 3D canvas crashed", {
    error,
    componentStack: info.componentStack,
  });
}

export function PracticeStudioLoader() {
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-2xl">
      <StudioViewportToolbar />
      <ErrorBoundary FallbackComponent={StudioErrorFallback} onError={reportStudioError}>
        <StudioCanvas />
      </ErrorBoundary>
    </div>
  );
}
