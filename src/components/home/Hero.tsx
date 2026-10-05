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
      {/* Mixed type: Geist medium, then "design system" in Newsreader italic.
          On desktop it breaks after "painting" so it reads
          "Every painting / is a design system". */}
      <h1 className="text-5xl leading-[0.98] sm:text-6xl lg:text-[3.5rem]">
        <span className="font-sans font-medium tracking-[-0.03em]">
          Every painting <br className="hidden lg:inline" />
          is a
        </span>{" "}
        <span className="font-display italic tracking-[-0.01em]">design system</span>
      </h1>
      <p className="mt-3 font-sans text-base leading-relaxed text-paper/85">
        {paintings.length} beautiful paintings to choose from. Pick one, get a UI theme that passes AA.
      </p>

      {/* Movement index: doubles as navigation into the gallery. */}
      <nav aria-label="Movements" className="mt-8">
        <ol>
          {movements.map((m, i) => (
            <li key={m}>
              <Link
                href={`/?movement=${slugify(m)}#gallery`}
                className="group flex items-baseline justify-between py-0.5 text-base font-semibold leading-tight tracking-tight"
              >
                <span className="underline-offset-4 group-hover:underline">{m}</span>
                <span className="font-display text-sm font-normal text-paper/70">{toRoman(i + 1)}</span>
              </Link>
            </li>
          ))}
        </ol>
      </nav>
    </HeroRotator>
  );
}
