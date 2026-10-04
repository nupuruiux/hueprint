import { describe, expect, it } from "vitest";
import paintings from "../../../data/paintings.json";
import { contrast } from "./color";
import { buildOptions, buildTheme, isMonochrome, pickPrimary, primitiveHex, requiredPairs } from "./build";
import { describeSwatches } from "./swatches";
import { ROLES, type Mode, type Strategy } from "./types";

const STRATEGIES: Strategy[] = ["faithful", "soft", "bold"];
const MODES: Mode[] = ["light", "dark"];
const HEX = /^#[0-9a-f]{6}$/;

// The project's promise: every generated theme passes WCAG AA, in both modes.
describe("every painting × direction × mode passes its contrast pairs", () => {
  for (const painting of paintings) {
    it(`${painting.id} · ${painting.title.slice(0, 40)}`, () => {
      const swatches = describeSwatches(painting.swatches);
      for (const strategy of STRATEGIES) {
        const theme = buildTheme(swatches, strategy);
        expect(theme.warnings).toEqual([]);
        for (const mode of MODES) {
          for (const role of ROLES) expect(theme[mode][role].hex).toMatch(HEX);
          for (const pair of requiredPairs(strategy)) {
            const ratio = contrast(theme[mode][pair.fg].hex, theme[mode][pair.bg].hex);
            expect(ratio, `${strategy} ${mode}: ${pair.fg} on ${pair.bg}`).toBeGreaterThanOrEqual(pair.target);
          }
        }
      }
    });
  }
});

const rembrandt = describeSwatches(paintings.find((p) => p.id === 95998)!.swatches);
const waterLilies = describeSwatches(paintings.find((p) => p.id === 16568)!.swatches);

describe("buildTheme", () => {
  it("Faithful keeps the painting's own primary colour in the primary scale", () => {
    const theme = buildTheme(waterLilies, "faithful");
    const picked = pickPrimary(waterLilies).hex;
    expect(Object.values(theme.primitives.primary)).toContain(picked);
  });

  it("Soft is calmer than Faithful, Bold is more saturated", () => {
    const options = buildOptions(waterLilies);
    const chroma = (s: Strategy) => describeSwatches([{ hex: options[s].light.primary.hex, population: 1 }])[0].c;
    expect(chroma("soft")).toBeLessThan(chroma("faithful"));
    expect(chroma("bold")).toBeGreaterThanOrEqual(chroma("faithful"));
  });

  it("Bold body text reaches AAA (7:1)", () => {
    const theme = buildTheme(rembrandt, "bold");
    expect(contrast(theme.light.text.hex, theme.light.background.hex)).toBeGreaterThanOrEqual(7);
    expect(contrast(theme.dark.text.hex, theme.dark.background.hex)).toBeGreaterThanOrEqual(7);
  });

  it("dark mode flips the neutrals: dark background, light text", () => {
    const theme = buildTheme(rembrandt, "faithful");
    const l = (hex: string) => describeSwatches([{ hex, population: 1 }])[0].l;
    expect(l(theme.dark.background.hex)).toBeLessThan(0.3);
    expect(l(theme.dark.text.hex)).toBeGreaterThan(0.85);
  });

  it("every token points at a real primitive unless it was adjusted or has none", () => {
    const theme = buildTheme(rembrandt, "faithful");
    for (const mode of MODES) {
      for (const role of ROLES) {
        const { hex, ref, adjusted } = theme[mode][role];
        if (ref && !adjusted) expect(primitiveHex(theme.primitives, ref)).toBe(hex);
      }
    }
  });

  it("hover and pressed get progressively darker under a light label", () => {
    const theme = buildTheme(rembrandt, "faithful");
    const l = (hex: string) => describeSwatches([{ hex, population: 1 }])[0].l;
    const { primary, "primary-hover": hover, "primary-pressed": pressed } = theme.light;
    if (l(theme.light["on-primary"].hex) > l(primary.hex)) {
      expect(l(hover.hex)).toBeLessThan(l(primary.hex));
      expect(l(pressed.hex)).toBeLessThan(l(hover.hex));
    }
  });

  it("records what the contrast fixer changed", () => {
    const theme = buildTheme(waterLilies, "soft");
    for (const fix of theme.fixes) {
      expect(fix.from).not.toBe(fix.to);
      expect(theme[fix.mode][fix.role].hex).toBe(fix.to);
    }
  });
});

describe("locks", () => {
  it("a locked role keeps its exact colour, and everything else still passes", () => {
    const theme = buildTheme(rembrandt, "faithful", { light: { primary: "#c0392b" } });
    expect(theme.light.primary.hex).toBe("#c0392b");
    for (const pair of requiredPairs("faithful")) {
      const ratio = contrast(theme.light[pair.fg].hex, theme.light[pair.bg].hex);
      expect(ratio, `${pair.fg} on ${pair.bg}`).toBeGreaterThanOrEqual(pair.target);
    }
  });

  it("states regenerate around a locked primary", () => {
    const theme = buildTheme(rembrandt, "faithful", { light: { primary: "#1d4ed8" } });
    expect(theme.light["primary-hover"].hex).not.toBe(buildTheme(rembrandt, "faithful").light["primary-hover"].hex);
  });

  it("never repaints the backgrounds to make room for a locked colour; warns instead", () => {
    const base = buildTheme(waterLilies, "soft");
    const theme = buildTheme(waterLilies, "soft", { dark: { accent: "#18525a" } });
    expect(theme.dark.accent.hex).toBe("#18525a");
    expect(theme.dark.background.hex).toBe(base.dark.background.hex);
    expect(theme.dark.surface.hex).toBe(base.dark.surface.hex);
    expect(theme.warnings.some((w) => w.startsWith("accent on"))).toBe(true);
    // Text is untouched by the lock and still passes.
    expect(contrast(theme.dark.text.hex, theme.dark.background.hex)).toBeGreaterThanOrEqual(4.5);
  });

  it("warns when two locked colours can't pass together", () => {
    const theme = buildTheme(rembrandt, "faithful", { light: { text: "#cccccc", background: "#ffffff" } });
    expect(theme.warnings.length).toBeGreaterThan(0);
  });
});

describe("low-colour images", () => {
  const greys = describeSwatches([
    { hex: "#1a1a1a", population: 400 },
    { hex: "#5a5a5a", population: 300 },
    { hex: "#9a9a9a", population: 200 },
    { hex: "#e0e0e0", population: 100 },
  ]);

  it("are detected as monochrome", () => {
    expect(isMonochrome(greys)).toBe(true);
    expect(isMonochrome(waterLilies)).toBe(false);
  });

  it("still get a full theme with one accent that passes AA", () => {
    for (const strategy of STRATEGIES) {
      const theme = buildTheme(greys, strategy);
      expect(theme.monochrome).toBe(true);
      for (const mode of MODES) {
        for (const pair of requiredPairs(strategy)) {
          expect(contrast(theme[mode][pair.fg].hex, theme[mode][pair.bg].hex)).toBeGreaterThanOrEqual(pair.target);
        }
      }
    }
  });
});
