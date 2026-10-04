import Image from "next/image";
import { altText, imageUrl, type Painting } from "@/lib/paintings";

export function PaintingHeader({ painting }: { painting: Painting }) {
  return (
    <header className="grid gap-8 pb-12 pt-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14 lg:pt-12">
      <div className="order-2 lg:order-1">
        <Image
          src={imageUrl(painting)}
          alt={altText(painting)}
          width={painting.width}
          height={painting.height}
          priority
          sizes="(min-width: 1024px) 55vw, 100vw"
          className="h-auto max-h-[78vh] w-full object-contain object-left-top"
        />
      </div>

      <div className="order-1 flex flex-col lg:order-2 lg:pt-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">{painting.movement}</p>
        <h1 className="mt-3 font-display text-5xl italic leading-[0.95] sm:text-6xl">{painting.title}</h1>
        <p className="mt-4 text-lg">
          {painting.artist_title}
          {painting.date_display && <span className="text-ink-muted">, {painting.date_display}</span>}
        </p>
        <p className="mt-1 text-sm text-ink-muted">{painting.credit}</p>

        <div className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-muted">Colours in this painting</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {painting.swatches.map((s) => (
              <li key={s.hex} className="text-center">
                <span className="block h-12 w-12 rounded-md ring-1 ring-ink/10" style={{ background: s.hex }} />
                <span className="mt-1 block font-mono text-[10px] uppercase text-ink-muted">{s.hex}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </header>
  );
}
