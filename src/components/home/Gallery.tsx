"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { movements, slugify, type Painting } from "@/lib/paintings";
import { PaintingCard } from "./PaintingCard";

const MOODS = ["warm", "cool", "vivid", "muted"] as const;

// Filters live in the URL (?movement=impressionism&mood=cool) so a filtered
// view can be shared, and the hero's movement index can link straight in.
export function Gallery({ paintings }: { paintings: Painting[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const movement = params.get("movement");
  const mood = params.get("mood");

  const visible = paintings.filter(
    (p) =>
      (!movement || slugify(p.movement) === movement) &&
      (!mood || p.moods.includes(mood as Painting["moods"][number])),
  );

  // Clicking the active chip again clears it.
  function setFilter(key: "movement" | "mood", value: string | null) {
    const next = new URLSearchParams(params);
    if (!value || next.get(key) === value) next.delete(key);
    else next.set(key, value);
    const query = next.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}#gallery`, { scroll: false });
  }

  function surpriseMe() {
    const pool = visible.length ? visible : paintings;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    router.push(`/theme/${pick.id}`);
  }

  return (
    <section id="gallery" aria-labelledby="gallery-title" className="scroll-mt-0">
      <div className="mx-auto max-w-7xl px-4 pb-6 pt-16 sm:px-6">
        <h2 id="gallery-title" className="font-display text-5xl leading-none sm:text-6xl">
          The <span className="italic">gallery</span>
        </h2>
        <p className="mt-3 max-w-xl text-ink-muted">
          <span className="touch:hidden">Hover a painting to see its colours. Click to turn it into a theme.</span>
          <span className="hidden touch:inline">Each strip shows a painting&apos;s colours. Tap one to turn it into a theme.</span>
        </p>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-0 z-30 border-y border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="-mx-1 flex flex-1 items-center gap-2 overflow-x-auto px-1 py-1 [scrollbar-width:none]">
            <Chip active={!movement} onClick={() => setFilter("movement", null)}>All</Chip>
            {movements.map((m) => (
              <Chip key={m} active={movement === slugify(m)} onClick={() => setFilter("movement", slugify(m))}>
                {m}
              </Chip>
            ))}
            <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-line" />
            {MOODS.map((m) => (
              <Chip key={m} active={mood === m} onClick={() => setFilter("mood", m)} variant="mood">
                {m[0].toUpperCase() + m.slice(1)}
              </Chip>
            ))}
          </div>
          <button
            type="button"
            onClick={surpriseMe}
            className="shrink-0 rounded-full bg-rosewood px-4 py-2 text-sm font-semibold text-paper transition-transform hover:-translate-y-px"
          >
            Surprise me
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6">
        {/* Announced to screen readers when filters change. */}
        <p aria-live="polite" className="mb-6 text-sm text-ink-muted">
          {visible.length} {visible.length === 1 ? "painting" : "paintings"}
        </p>

        {visible.length ? (
          // Masonry via CSS columns: paintings keep their real aspect ratios.
          <div className="columns-2 gap-4 sm:gap-6 md:columns-3 xl:columns-4">
            {visible.map((p, i) => (
              <PaintingCard key={p.id} painting={p} index={i} />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-line px-6 py-16 text-center">
            <p className="font-display text-3xl italic">Nothing hangs here yet.</p>
            <p className="mt-2 text-ink-muted">No paintings match both filters. Try another mood or movement.</p>
            <button
              type="button"
              onClick={() => router.replace(`${pathname}#gallery`, { scroll: false })}
              className="mt-6 text-sm font-semibold text-rosewood underline underline-offset-4"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function Chip({
  active,
  onClick,
  variant = "movement",
  children,
}: {
  active: boolean;
  onClick: () => void;
  variant?: "movement" | "mood";
  children: React.ReactNode;
}) {
  const shape = variant === "mood" ? "rounded-md" : "rounded-full";
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap border px-3.5 py-1.5 text-sm font-medium transition-colors ${shape} ${
        active ? "border-ink bg-ink text-paper" : "border-ink-muted/40 text-ink hover:border-ink"
      }`}
    >
      {children}
    </button>
  );
}
