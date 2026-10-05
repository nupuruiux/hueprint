"use client";

import { useEffect, useState } from "react";
import { extractColors } from "@/lib/theme/extract";
import type { Swatch } from "@/lib/theme";
import { ThemeStudio } from "@/components/theme/ThemeStudio";
import { MixingPaint } from "@/components/states/MixingPaint";
import { DropZone } from "./DropZone";
import { useUpload } from "./UploadProvider";

// Theme page for an uploaded image. The image lives only in this tab, so a
// refresh (or opening a shared link) finds nothing: we explain and offer the
// drop zone again.
export function UploadTheme() {
  const { upload } = useUpload();
  const [result, setResult] = useState<{ url: string; swatches: Swatch[] } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!upload) return;
    let cancelled = false;
    // Extraction is quick, so the "mixing paint" moment gets ~1.2s to register
    // instead of flashing past (skipped for people who prefer less motion).
    const minimum = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1200;
    const pause = new Promise((resolve) => setTimeout(resolve, minimum));
    Promise.all([extractColors(upload.url), pause])
      .then(([swatches]) => !cancelled && setResult({ url: upload.url, swatches }))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [upload]);

  if (!upload) {
    return (
      <div className="mx-auto max-w-3xl py-16">
        <h1 className="font-display text-5xl leading-none sm:text-6xl">
          Your image has <span className="italic">gone home</span>
        </h1>
        <p className="mt-4 max-w-xl text-ink-muted">
          Uploaded images stay on your device and only live in the tab you dropped them into, so they disappear after a refresh. Drop it in again and we&apos;ll remix it in a second.
        </p>
        <div className="mt-8">
          <DropZone compact />
        </div>
      </div>
    );
  }

  if (failed) {
    return (
      <div className="mx-auto max-w-3xl py-16">
        <h1 className="font-display text-5xl">We couldn&apos;t read its colours</h1>
        <p className="mt-4 text-ink-muted">Something went wrong pulling colours from that image. Try another one.</p>
        <div className="mt-8">
          <DropZone compact />
        </div>
      </div>
    );
  }

  // Wait for this upload's colours (not a previous upload's).
  const swatches = result?.url === upload.url ? result.swatches : null;

  return (
    <>
      <header className="flex flex-col gap-8 pb-12 pt-8 lg:flex-row lg:items-center lg:gap-12 lg:pt-12">
        <div className="order-2 lg:order-1 lg:h-[480px] lg:max-w-[60%] lg:shrink-0">
          {/* A local image (blob: URL), so next/image can't optimise it; a plain img is right here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={upload.url} alt={`Your image: ${upload.name}`} className="h-auto max-h-[78vh] w-auto max-w-full lg:h-full lg:max-h-none lg:object-contain" />
        </div>
        <div className="order-1 min-w-0 flex-1 lg:order-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">Your image</p>
          <h1 className="mt-3 break-words font-display text-5xl italic leading-[0.95] sm:text-6xl">{upload.name}</h1>
          <p className="mt-4 text-sm text-ink-muted">Stays on your device. Nothing was uploaded.</p>
          <div className="mt-8">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-muted">Colours in this image</h2>
            {swatches ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {swatches.map((s, i) => (
                  <li key={i} className="text-center">
                    <span className="block h-12 w-12 rounded-md ring-1 ring-ink/10" style={{ background: s.hex }} />
                    <span className="mt-1 block font-mono text-[10px] uppercase text-ink-muted">{s.hex}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-ink-muted">Reading the image…</p>
            )}
          </div>
        </div>
      </header>

      {swatches ? <ThemeStudio title={upload.name} swatches={swatches} shareable={false} /> : <MixingPaint />}
    </>
  );
}
