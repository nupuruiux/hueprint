// Small colour helpers. All maths happens in OKLCH: its lightness steps
// look even to the eye, unlike RGB or HSL.
import { clampChroma, converter, formatHex, wcagContrast } from "culori";

export type Oklch = { l: number; c: number; h: number };

const toOklchColor = converter("oklch");

export function toOklch(hex: string): Oklch {
  const c = toOklchColor(hex);
  // Greys have no hue; treat it as 0 so the maths stays simple.
  return { l: c?.l ?? 0, c: c?.c ?? 0, h: c?.h ?? 0 };
}

// Back to hex. Very colourful OKLCH values can fall outside what a screen
// can show (sRGB), so chroma is reduced until the colour fits.
export function toHex({ l, c, h }: Oklch): string {
  const fitted = clampChroma({ mode: "oklch", l: clamp(l, 0, 1), c: Math.max(0, c), h }, "oklch");
  return formatHex(fitted);
}

export function contrast(a: string, b: string): number {
  return wcagContrast(a, b);
}

export function wcagLevel(ratio: number): "AAA" | "AA" | "AA Large" | "Fail" {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA Large";
  return "Fail";
}

// Smallest angle between two hues, 0–180.
export function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

// Signed shortest turn from hue a to hue b, -180–180.
export function hueDelta(a: number, b: number): number {
  return ((b - a + 540) % 360) - 180;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
