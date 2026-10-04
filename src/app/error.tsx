"use client";

import Link from "next/link";
import { useEffect } from "react";

// Shown if something unexpected breaks while rendering a page.
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  // Keep the details in the browser console for debugging.
  useEffect(() => console.error(error), [error]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-24 sm:px-6">
      <h1 className="font-display text-6xl leading-[0.95]">
        The paint <span className="italic">smudged</span>
      </h1>
      <p className="mt-6 max-w-xl text-lg text-ink-muted">Something went wrong on our side. Try again, or head back to the gallery.</p>
      <div className="mt-10 flex flex-wrap items-center gap-5">
        <button type="button" onClick={() => retry()} className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-paper">
          Try again
        </button>
        <Link href="/#gallery" className="font-semibold underline underline-offset-4 hover:text-rosewood">
          Back to the gallery
        </Link>
      </div>
    </div>
  );
}
