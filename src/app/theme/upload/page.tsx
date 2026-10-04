import { Suspense } from "react";
import type { Metadata } from "next";
import { UploadTheme } from "@/components/upload/UploadTheme";

// A fixed route, so it takes priority over /theme/[id] for "upload".
export const metadata: Metadata = { title: "Your image · Hueprint" };

export default function UploadThemePage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6">
      <Suspense fallback={<p className="py-16 font-display text-2xl italic text-ink-muted">Mixing paint…</p>}>
        <UploadTheme />
      </Suspense>
    </div>
  );
}
