import Link from "next/link";
import { altText, creditLine, heroFocus, heroPaintings, movements, paintings, slugify, toRoman } from "@/lib/paintings";
import { oklch } from "culori";
import { buttonColors, contrastRatio, pickPrimary } from "@/lib/theme/primary";
import { HeroRotator, type HeroSlide } from "./HeroRotator";

// Full-bleed painting + hairline frame, after Shopify Winter '26.
// The site's accent here comes from the painting itself: the CTA and the
// floating UI pieces use that painting's primary colour.
// Colours for every hero painting are worked out here on the server; the
// rotator (client) just switches between them.
export function Hero({ startIndex }: { startIndex: number }) {
  const slides: HeroSlide[] = heroPaintings.map((p) => {
    const primary = pickPrimary(p.swatches);
    const button = buttonColors(primary);

    // Stand-in roles for the redlines until the theme engine (step 3):
    // surface = the painting's lightest colour, text = its darkest.
    const byLightness = [...p.swatches].sort((a, b) => (oklch(b.hex)?.l ?? 0) - (oklch(a.hex)?.l ?? 0));
    const surface = byLightness[0].hex;
    const text = byLightness[byLightness.length - 1].hex;
    const ratio = contrastRatio(text, surface);
    const level = ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA" : "below AA";
    return {
      id: p.id,
      src: `/paintings/${p.id}.jpg`,
      alt: altText(p),
      focus: heroFocus(p),
      credit: creditLine(p),
      primary,
      buttonBg: button.bg,
      buttonText: button.text,
      roles: [
        { name: "primary", hex: primary },
        { name: "text", hex: text, note: `${ratio.toFixed(1)}:1 ${level}` },
        { name: "surface", hex: surface },
      ],
    };
  });

  return (
    <HeroRotator slides={slides} startIndex={startIndex}>
      <h1 className="text-5xl font-bold leading-[0.92] tracking-tight sm:text-6xl">
        Every painting is a <span className="font-display font-normal italic">design system</span>
      </h1>
      <p className="mt-6 font-display text-xl leading-snug text-paper/85">
        {paintings.length} public-domain paintings. Pick one, get a UI theme that passes AA.
      </p>

      {/* Movement index: doubles as navigation into the gallery. */}
      <nav aria-label="Movements" className="mt-6">
        <ol>
          {movements.map((m, i) => (
            <li key={m}>
              <Link
                href={`/?movement=${slugify(m)}#gallery`}
                className="group flex items-baseline justify-between py-0.5 text-lg font-bold leading-tight tracking-tight"
              >
                <span className="underline-offset-4 group-hover:underline">{m}</span>
                <span className="font-display text-base font-normal text-paper/70">{toRoman(i + 1)}</span>
              </Link>
            </li>
          ))}
        </ol>
      </nav>
    </HeroRotator>
  );
}
