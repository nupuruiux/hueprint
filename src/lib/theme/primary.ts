// The first piece of the theme engine: pick a painting's brand colour.
// Step 3 builds the full engine (roles, contrast fixing, dark mode) around this.
import { formatHex, oklch, wcagContrast } from "culori";

type Swatch = { hex: string; population: number };

const WHITE = "#ffffff";
const INK = "#1f1a17";

// Brief, step 2: "the most saturated colour that covers a decent part of
// the image". Score = chroma × √coverage, so a vivid speck can't win over
// a colour that actually shapes the painting, but coverage isn't everything.
export function pickPrimary(swatches: Swatch[]): string {
  const total = swatches.reduce((sum, s) => sum + s.population, 0) || 1;
  let best = swatches[0]?.hex ?? "#7a1f3d";
  let bestScore = -1;
  for (const s of swatches) {
    const c = oklch(s.hex)?.c ?? 0;
    const score = c * Math.sqrt(s.population / total);
    if (score > bestScore) {
      bestScore = score;
      best = s.hex;
    }
  }
  return best;
}

// A button colour plus the text colour that sits on it, passing WCAG AA (4.5:1).
// If neither white nor ink text passes, darken the colour in small OKLCH
// lightness steps until white does: hue and chroma stay, so it still
// reads as the painting's colour.
export function buttonColors(hex: string): { bg: string; text: string } {
  if (wcagContrast(WHITE, hex) >= 4.5) return { bg: hex, text: WHITE };
  if (wcagContrast(INK, hex) >= 4.5) return { bg: hex, text: INK };

  const color = oklch(hex);
  if (!color) return { bg: INK, text: WHITE };
  let l = color.l;
  let bg = hex;
  while (l > 0 && wcagContrast(WHITE, bg) < 4.5) {
    l -= 0.02;
    bg = formatHex({ ...color, l });
  }
  return { bg, text: WHITE };
}

export function contrastRatio(a: string, b: string): number {
  return wcagContrast(a, b);
}
