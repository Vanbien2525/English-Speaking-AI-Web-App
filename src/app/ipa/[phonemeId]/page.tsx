import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { IPA_PHONEMES, findPhonemeByIdOrSlug } from "@/core/data/ipa-dataset";
import { PhonemeDetailPage } from "@/modules/ipa/PhonemeDetailPage";

interface PageProps {
  params: Promise<{ phonemeId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { phonemeId } = await params;
  const phoneme = findPhonemeByIdOrSlug(phonemeId);
  if (!phoneme) {
    return { title: "Âm vị không tồn tại" };
  }
  return {
    title: `Luyện Phát Âm /${phoneme.symbol}/ · ${phoneme.nameVi}`,
    description: `Hướng dẫn khẩu hình miệng và luyện 10 từ vựng cho âm /${phoneme.symbol}/ (${phoneme.nameVi}).`,
  };
}

export function generateStaticParams() {
  const bySlug = IPA_PHONEMES.map((p) => ({ phonemeId: p.id }));
  const byUuid = IPA_PHONEMES.map((p) => ({ phonemeId: p.uuid }));
  return [...bySlug, ...byUuid];
}

export default async function IpaDetailPage({ params }: PageProps) {
  const { phonemeId } = await params;
  const phoneme = findPhonemeByIdOrSlug(phonemeId);

  if (!phoneme) {
    notFound();
  }

  return (
    <main className="w-full flex-1">
      <PhonemeDetailPage phoneme={phoneme} />
    </main>
  );
}
