import { Suspense } from "react";
import type { Metadata } from "next";
import { getCurriculumService } from "@/core/services/curriculum-service";
import type { CefrLevel, VietnameseErrorGroup } from "@/core/dto/curriculum.dto";
import { CurriculumHeader } from "@/modules/curriculum/components/CurriculumHeader";
import { IpaHeatmapGrid } from "@/modules/curriculum/components/IpaHeatmapGrid";
import { WeakPhonemeBanner } from "@/modules/curriculum/components/WeakPhonemeBanner";
import { LessonFilterBar } from "@/modules/curriculum/components/LessonFilterBar";
import { LessonGrid } from "@/modules/curriculum/components/LessonGrid";
import { CurriculumSkeleton } from "@/modules/curriculum/components/CurriculumSkeleton";

export const metadata: Metadata = {
  title: "Bản Đồ 44 Âm IPA & Lộ Trình CEFR | AI Speaking Tutor 3D",
  description:
    "Bản đồ nhiệt 44 âm vị IPA theo thời gian thực và danh mục bài học khắc phục tật phát âm người Việt.",
};

const DEFAULT_USER_ID = "019488a0-7b24-789a-bcde-000000000001";

interface LearnPageProps {
  searchParams: Promise<{
    view?: string;
    cefr?: string;
    category?: string;
    errorGroup?: string;
    search?: string;
    phonemeId?: string;
  }>;
}

export default async function LearnPage({ searchParams }: LearnPageProps) {
  const resolvedParams = await searchParams;

  const activeView: "ipa" | "lessons" =
    resolvedParams.view === "lessons" ? "lessons" : "ipa";
  const activeCefr = (resolvedParams.cefr as CefrLevel) || "all";
  const activeCategory = resolvedParams.category || "all";
  const activeErrorGroup = (resolvedParams.errorGroup as VietnameseErrorGroup) || "all";
  const searchQuery = resolvedParams.search || "";
  const phonemeId = resolvedParams.phonemeId;

  const service = getCurriculumService();

  // Concurrent server-side data fetching from PostgreSQL / in-memory repository
  const [phonemes, lessons, recommendation] = await Promise.all([
    service.getPhonemesWithMastery(DEFAULT_USER_ID),
    service.getLessonsWithProgress(DEFAULT_USER_ID, {
      cefr: activeCefr,
      categorySlug: activeCategory,
      errorGroup: activeErrorGroup,
      search: searchQuery,
      phonemeId,
    }),
    service.getPedagogicalRecommendation(DEFAULT_USER_ID),
  ]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-7xl flex-col gap-8 px-4 py-8 md:px-8">
      {/* 1. Header with Breadcrumb & Segmented Switcher */}
      <CurriculumHeader activeView={activeView} />

      {/* 2. Interactive Island with Suspense Streaming Boundary */}
      <Suspense fallback={<CurriculumSkeleton />}>
        {activeView === "ipa" ? (
          <IpaHeatmapGrid phonemes={phonemes} />
        ) : (
          <div className="flex flex-col gap-8">
            {/* Pedagogical Smart Advisor Banner */}
            <WeakPhonemeBanner recommendation={recommendation} />

            {/* Multi-dimensional Filter Bar */}
            <LessonFilterBar
              activeCefr={activeCefr}
              activeErrorGroup={activeErrorGroup}
              searchQuery={searchQuery}
            />

            {/* Responsive Lesson Grid */}
            <section aria-label="Danh sách bài học">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span>Danh Mục Bài Học Luyện Phát Âm</span>
                  <span className="text-xs text-ink-muted font-normal">
                    ({lessons.length} bài)
                  </span>
                </h2>
              </div>
              <LessonGrid lessons={lessons} />
            </section>
          </div>
        )}
      </Suspense>
    </main>
  );
}
