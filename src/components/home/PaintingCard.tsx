import Image from "next/image";
import Link from "next/link";
import { altText, imageUrl, type Painting } from "@/lib/paintings";

// One gallery card. On hover (or keyboard focus) it lifts, tilts slightly,
// and a strip of the painting's colours slides up with a call to action.
// Touch screens can't hover, so they always get a small swatch strip instead.
export function PaintingCard({ painting, index }: { painting: Painting; index: number }) {
  const strip = painting.swatches.slice(0, 5);
  // Alternate the tilt direction so the grid feels hand-hung, not uniform.
  const tilt = index % 2 === 0 ? "motion-safe:hover:rotate-1" : "motion-safe:hover:-rotate-1";

  return (
    <Link
      href={`/theme/${painting.id}`}
      className={`group mb-6 block break-inside-avoid transition duration-300 motion-safe:hover:-translate-y-1 ${tilt}`}
    >
      <figure>
        <div className="relative overflow-hidden rounded-sm bg-paper-deep shadow-sm transition-shadow duration-300 group-hover:shadow-xl">
          <Image
            src={imageUrl(painting)}
            alt={altText(painting)}
            width={painting.width}
            height={painting.height}
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="h-auto w-full"
          />

          {/* Hover / focus reveal (devices that can hover). */}
          <div className="absolute inset-x-0 bottom-0 translate-y-full transition-transform duration-300 group-hover:translate-y-0 group-focus-visible:translate-y-0 touch:hidden">
            <span className="mx-auto mb-3 block w-max rounded-full bg-paper px-4 py-2 text-sm font-semibold text-ink shadow-lg">
              Generate palette →
            </span>
            <span className="flex h-9">
              {strip.map((s, i) => (
                <span key={i} className="flex-1" style={{ background: s.hex }} />
              ))}
            </span>
          </div>
        </div>

        {/* Always-on strip for touch screens. */}
        <span aria-hidden className="mt-2 hidden h-2 overflow-hidden rounded-full touch:flex">
          {strip.map((s, i) => (
            <span key={i} className="flex-1" style={{ background: s.hex }} />
          ))}
        </span>

        <figcaption className="mt-3 text-sm leading-snug">
          <span className="block font-display text-lg italic leading-tight">{painting.title}</span>
          <span className="block text-ink-muted">
            {painting.artist_title}{painting.date_display ? `, ${painting.date_display}` : ""}
          </span>
          <span className="block text-xs text-ink-muted">Art Institute of Chicago</span>
        </figcaption>
      </figure>
    </Link>
  );
}
