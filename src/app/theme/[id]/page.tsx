import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { MorePaintings } from "@/components/theme/MorePaintings";
import { PaintingHeader } from "@/components/theme/PaintingHeader";
import { ThemeStudio } from "@/components/theme/ThemeStudio";
import { paintings } from "@/lib/paintings";

// Build a page for every painting ahead of time (fast, cacheable).
export function generateStaticParams() {
  return paintings.map((p) => ({ id: String(p.id) }));
}

export async function generateMetadata(props: PageProps<"/theme/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const painting = paintings.find((p) => String(p.id) === id);
  return { title: painting ? `${painting.title} · Hueprint` : "Not found · Hueprint" };
}

export default async function ThemePage(props: PageProps<"/theme/[id]">) {
  const { id } = await props.params;
  const painting = paintings.find((p) => String(p.id) === id);
  if (!painting) notFound();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6">
      <PaintingHeader painting={painting} />
      {/* The studio reads its state from the URL (?v=soft…), which is only
          known in the browser, so it renders inside a Suspense boundary. */}
      <Suspense fallback={<p className="py-16 font-display text-2xl italic text-ink-muted">Mixing paint…</p>}>
        <ThemeStudio title={painting.title} swatches={painting.swatches} />
      </Suspense>
      <MorePaintings painting={painting} />
    </div>
  );
}
