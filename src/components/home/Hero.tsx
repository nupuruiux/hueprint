import Link from "next/link";
import { altText, creditLine, heroFocus, heroPaintings, movements, paintings, slugify, toRoman } from "@/lib/paintings";
import { buildTheme, contrast, describeSwatches, wcagLevel } from "@/lib/theme";
import { HeroRotator, type HeroSlide } from "./HeroRotator";

// Full-bleed painting + hairline frame, after Shopify Winter '26.
// The site's accent here comes from the painting itself: the CTA and the
// floating UI pieces use that painting's primary colour.
// Each hero painting's Faithful theme is built here on the server; the
// rotator (client) just switches between them.
export function Hero({ startIndex }: { startIndex: number }) {
  const slides: HeroSlide[] = heroPaintings.map((p) => {
    const { light } = buildTheme(describeSwatches(p.swatches), "faithful");
    const ratio = contrast(light.text.hex, light.background.hex);
    return {
      id: p.id,
      src: `/paintings/${p.id}.jpg`,
      alt: altText(p),
      focus: heroFocus(p),
      credit: creditLine(p),
      primary: light.primary.hex,
      buttonBg: light.primary.hex,
      buttonText: light["on-primary"].hex,
      roles: [
        { name: "primary", hex: light.primary.hex },
        { name: "text", hex: light.text.hex, note: `${ratio.toFixed(1)}:1 ${wcagLevel(ratio)}` },
        { name: "surface", hex: light.surface.hex },
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
