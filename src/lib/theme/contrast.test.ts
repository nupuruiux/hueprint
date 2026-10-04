import { describe, expect, it } from "vitest";
import { contrast } from "./color";
import { describeFix, fixContrast, nudge, type Pair } from "./contrast";
import type { Role } from "./types";

// Fills every role with white so each test only sets what it cares about.
function colors(overrides: Partial<Record<Role, string>>): Record<Role, string> {
  const base = {} as Record<Role, string>;
  for (const role of ["background", "surface", "surface-raised", "border", "text", "text-muted", "primary", "primary-hover", "primary-pressed", "primary-disabled", "on-primary", "secondary", "accent", "success", "warning", "danger", "focus-ring"] as Role[]) {
    base[role] = "#ffffff";
  }
  return { ...base, ...overrides };
}

const textOnBackground: Pair[] = [{ fg: "text", bg: "background", target: 4.5 }];

describe("fixContrast", () => {
  it("leaves pairs that already pass alone", () => {
    const input = colors({ text: "#1f1a17", background: "#ffffff" });
    const { adjusted, fixes } = fixContrast(input, textOnBackground, { mode: "light" });
    expect(adjusted.text).toBe("#1f1a17");
    expect(fixes).toEqual([]);
  });

  it("darkens light grey text on white until it passes AA, and records the fix", () => {
    const input = colors({ text: "#aaaaaa", background: "#ffffff" });
    const { adjusted, fixes } = fixContrast(input, textOnBackground, { mode: "light" });
    expect(contrast(adjusted.text, adjusted.background)).toBeGreaterThanOrEqual(4.5);
    expect(fixes).toHaveLength(1);
    expect(fixes[0]).toMatchObject({ role: "text", from: "#aaaaaa", to: adjusted.text, against: "background", target: 4.5 });
  });

  it("only moves as far as needed (lands just above the target)", () => {
    const input = colors({ text: "#aaaaaa", background: "#ffffff" });
    const { adjusted } = fixContrast(input, textOnBackground, { mode: "light" });
    expect(contrast(adjusted.text, adjusted.background)).toBeLessThan(5);
  });

  it("lightens dark text on a dark background", () => {
    const input = colors({ text: "#444444", background: "#111111" });
    const { adjusted } = fixContrast(input, textOnBackground, { mode: "dark" });
    expect(contrast(adjusted.text, adjusted.background)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps the hue: a muddy red stays red", () => {
    const input = colors({ text: "#d08080", background: "#ffffff" });
    const { adjusted } = fixContrast(input, textOnBackground, { mode: "light" });
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(adjusted.text.slice(i, i + 2), 16));
    expect(r).toBeGreaterThan(g);
    expect(r).toBeGreaterThan(b);
  });

  it("reaches AAA (7:1) when asked", () => {
    const input = colors({ text: "#777777", background: "#ffffff" });
    const { adjusted } = fixContrast(input, [{ fg: "text", bg: "background", target: 7 }], { mode: "light" });
    expect(contrast(adjusted.text, adjusted.background)).toBeGreaterThanOrEqual(7);
  });

  it("moves the other side when the usual side is locked", () => {
    const input = colors({ text: "#999999", background: "#ffffff" });
    const { adjusted } = fixContrast(input, textOnBackground, { mode: "light", locked: new Set<Role>(["text"]) });
    expect(adjusted.text).toBe("#999999");
    expect(adjusted.background).not.toBe("#ffffff");
    expect(contrast(adjusted.text, adjusted.background)).toBeGreaterThanOrEqual(4.5);
  });

  it("warns instead of changing anything when both sides are locked", () => {
    const input = colors({ text: "#999999", background: "#ffffff" });
    const { adjusted, warnings } = fixContrast(input, textOnBackground, { mode: "light", locked: new Set<Role>(["text", "background"]) });
    expect(adjusted.text).toBe("#999999");
    expect(warnings).toHaveLength(1);
  });

  it("adjusts the background side of a pair when asked (button colour, not its label)", () => {
    const input = colors({ "on-primary": "#ffffff", primary: "#e0a0a0" });
    const { adjusted } = fixContrast(input, [{ fg: "on-primary", bg: "primary", target: 4.5, adjust: "bg" }], { mode: "light" });
    expect(adjusted["on-primary"]).toBe("#ffffff");
    expect(contrast(adjusted["on-primary"], adjusted.primary)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps the original colour in the fix when a role is moved more than once", () => {
    const input = colors({ text: "#bbbbbb", background: "#ffffff", surface: "#eeeeee" });
    const pairs: Pair[] = [
      { fg: "text", bg: "background", target: 4.5 },
      { fg: "text", bg: "surface", target: 4.5 },
    ];
    const { fixes } = fixContrast(input, pairs, { mode: "light" });
    expect(fixes).toHaveLength(1);
    expect(fixes[0].from).toBe("#bbbbbb");
  });
});

describe("nudge", () => {
  it("falls back to black when no lightness is dark enough", () => {
    expect(nudge("#ffffff", "#ffffff", 22)).toBe("#000000");
  });
});

describe("describeFix", () => {
  it("writes a plain-English note for the UI", () => {
    const note = describeFix({ mode: "light", role: "text-muted", from: "#8a7f86", to: "#6e636a", against: "background", ratio: 4.6, target: 4.5 });
    expect(note).toBe("Darkened text-muted from #8a7f86 to #6e636a to pass AA (4.5:1) on background. Now 4.6:1, AA.");
  });
});
