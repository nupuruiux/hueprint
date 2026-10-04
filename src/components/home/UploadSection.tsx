import { DropZone } from "@/components/upload/DropZone";

// The second way in (after the gallery). Reached from the hero and header links.
export function UploadSection() {
  return (
    <section id="upload" aria-labelledby="upload-title" className="scroll-mt-8 border-t border-line bg-paper-deep">
      <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <h2 id="upload-title" className="font-display text-5xl leading-none sm:text-6xl">
          Or bring <span className="italic">your own</span>
        </h2>
        <p className="mt-3 max-w-xl text-ink-muted">
          Any image works: we pull its colours and build the same three directions, light and dark, contrast-fixed.
        </p>
        <div className="mt-8">
          <DropZone />
        </div>
      </div>
    </section>
  );
}
