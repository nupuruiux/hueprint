"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { ACCEPTED_TYPES, checkFile, displayName } from "@/lib/upload";
import { useUpload } from "./UploadProvider";

// Drop, click to browse, or paste an image. The file is checked and opened
// locally, then the theme page reads it from app state. Errors appear inside
// the zone (not as a popup) and are announced to screen readers.
export function DropZone({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { setUpload } = useUpload();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function take(file: File | undefined | null) {
    if (!file) return;
    const problem = checkFile(file);
    if (problem) return setError(problem);

    setError(null);
    setBusy(true);
    const url = URL.createObjectURL(file);
    try {
      // Make sure it really opens as an image (a renamed file can pass the type check).
      const img = new Image();
      img.src = url;
      await img.decode();
    } catch {
      URL.revokeObjectURL(url);
      setBusy(false);
      return setError("We couldn't open that image. It may be damaged. Try exporting it again.");
    }
    setUpload({ url, name: displayName(file.name) });
    router.push("/theme/upload");
  }

  // Paste an image from the clipboard anywhere on the page.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith("image/"));
      if (file) {
        e.preventDefault();
        take(file);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  });

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    take(e.dataTransfer.files[0]);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`relative rounded-xl border-2 border-dashed text-center transition-colors ${compact ? "px-6 py-10" : "px-6 py-16 sm:py-24"} ${
        dragging ? "border-rosewood bg-rosewood/5" : error ? "border-rosewood" : "border-ink-muted/50 bg-paper"
      }`}
    >
      <p className={`font-display leading-tight ${compact ? "text-2xl" : "text-3xl sm:text-5xl"}`}>
        {busy ? (
          <span className="italic">Opening your image…</span>
        ) : (
          <>
            Drop <span className="italic">any</span> image
          </>
        )}
      </p>
      <p className="mx-auto mt-3 max-w-md text-ink-muted">A photo, a screenshot, your own painting. JPG, PNG or WebP up to 10 MB.</p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition-transform hover:-translate-y-px disabled:opacity-60"
        >
          Choose an image
        </button>
        <span className="text-sm text-ink-muted">or paste one with ⌘V / Ctrl+V</span>
      </div>

      <input
        ref={input}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          take(e.target.files?.[0]);
          e.target.value = ""; // so choosing the same file again still triggers
        }}
      />

      <p role="alert" className={`mx-auto max-w-md text-sm font-semibold text-rosewood ${error ? "mt-5" : ""}`}>
        {error}
      </p>
      <p className="mt-6 text-xs text-ink-muted">Your image stays on your device. Nothing is uploaded.</p>
    </div>
  );
}
