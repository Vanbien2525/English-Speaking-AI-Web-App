"use client";

import type { LessonCardDto } from "@/core/dto/curriculum.dto";
import { LessonCard } from "./LessonCard";

interface LessonGridProps {
  lessons: LessonCardDto[];
}

export function LessonGrid({ lessons }: LessonGridProps) {
  if (lessons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-surface border border-border-subtle">
        <span className="text-4xl mb-3">🔍</span>
        <h3 className="text-base font-bold text-ink">Không tìm thấy bài học phù hợp</h3>
        <p className="text-xs text-ink-muted mt-1 max-w-sm">
          Thử thay đổi bộ lọc trình độ CEFR, chuyên đề lỗi hoặc xóa từ khóa tìm kiếm để xem thêm bài học.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {lessons.map((lesson) => (
        <LessonCard key={lesson.id} lesson={lesson} />
      ))}
    </div>
  );
}
