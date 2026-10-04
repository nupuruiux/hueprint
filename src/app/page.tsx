import Image from "next/image";
import { altText, imageUrl, movements, paintings, paintingsIn, slugify, toRoman } from "@/lib/paintings";

// TEMPORARY step-1 page: a style tile + data check to prove the foundations
// (fonts, tokens, header over a dark band, painting data, remote images).
// Step 2 replaces this with the real hero, marquee, filters and gallery.

const TOKENS = [
  { name: "paper", className: "bg-paper", note: "page background" },
  { name: "paper-deep", className: "bg-paper-deep", note: "footer, wells" },
  { name: "ink", className: "bg-ink", note: "text · 15.3:1" },
  { name: "ink-muted", className: "bg-ink-muted", note: "secondary text · 6.6:1" },
  { name: "line", className: "bg-line", note: "hairlines (decorative)" },
  { name: "rosewood", className: "bg-rosewood", note: "accent · 8.9:1" },
  { name: "rosewood-light", className: "bg-rosewood-light", note: "decoration only · 3.6:1" },
  { name: "night", className: "bg-night", note: "hero background" },
];

export default function Home() {
  return (
    <>
      {/* Dark band so the transparent header has something to sit on. */}
      <section className="on-dark bg-night px-4 pb-20 pt-36 text-paper sm:px-6">
        <div className="mx-auto max-w-7xl">
          <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-paper/70">Step 1 · Foundations</p>
          <h1 className="max-w-4xl text-5xl font-bold leading-[0.95] tracking-tight sm:text-7xl">
            Every painting is a <span className="font-display font-normal italic">design system</span>
          </h1>
          <p className="mt-6 max-w-xl font-display text-2xl leading-snug text-paper/80">
            {movements.length} movements, {paintings.length} paintings, one theme each.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-4xl">Site tokens</h2>
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {TOKENS.map((t) => (
            <li key={t.name} className="text-sm">
              <div className={`h-16 rounded-md border border-line ${t.className}`} />
              <p className="mt-2 font-semibold">{t.name}</p>
              <p className="text-ink-muted">{t.note}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6">
        <h2 className="font-display text-4xl">Data check</h2>
        <p className="mt-2 text-ink-muted">From data/paintings.json, with each painting&apos;s extracted swatches.</p>

        <div className="mt-8 space-y-12">
          {movements.map((movement, i) => (
            <div key={movement} id={slugify(movement)} className="scroll-mt-8">
              <h3 className="flex items-baseline justify-between border-b border-line pb-2">
                <span className="text-xl font-bold tracking-tight">{movement}</span>
                <span className="font-display text-lg text-ink-muted">{toRoman(i + 1)}</span>
              </h3>
              <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                {paintingsIn(movement).map((p) => (
                  <li key={p.id} className="text-xs">
                    <Image
                      src={imageUrl(p)}
                      alt={altText(p)}
                      width={p.width}
                      height={p.height}
                      sizes="(min-width: 1024px) 200px, 45vw"
                      className="aspect-square w-full rounded-sm object-cover"
                    />
                    <div className="mt-2 flex h-2 overflow-hidden rounded-full" aria-hidden>
                      {p.swatches.map((s, j) => (
                        <span key={j} className="flex-1" style={{ background: s.hex }} />
                      ))}
                    </div>
                    <p className="mt-2 font-semibold leading-tight">{p.title}</p>
                    <p className="text-ink-muted">
                      {p.artist_title}, {p.date_display}
                    </p>
                    <p className="mt-1 text-ink-muted">{p.moods.join(" · ")}{p.hero ? " · hero" : ""}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

