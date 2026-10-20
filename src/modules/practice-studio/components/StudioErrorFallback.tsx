"use client";

import type { FallbackProps } from "react-error-boundary";

function describeError(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) return error.message;
  return "Lỗi không xác định khi khởi tạo WebGL.";
}

export function StudioErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div
      role="alert"
      className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-surface p-6 text-center"
    >
      <p className="text-base font-semibold text-score-major">Không thể hiển thị mô hình 3D</p>
      <p className="max-w-md text-sm text-ink-muted">
        Trình duyệt có thể đã tắt WebGL hoặc GPU đang quá tải. Bạn vẫn có thể luyện tập với bảng phân tích IPA.
      </p>
      <p className="max-w-md text-xs text-ink-muted/80">{describeError(error)}</p>
      <button
        type="button"
        onClick={() => resetErrorBoundary()}
        className="min-h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-canvas"
      >
        Thử lại
      </button>
    </div>
  );
}
