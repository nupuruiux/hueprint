import { toOklch } from "./color";
import type { Swatch } from "./types";

// Adds OKLCH values and coverage to raw extracted colours, most common first.
export function describeSwatches(raw: { hex: string; population: number }[]): Swatch[] {
  const total = raw.reduce((sum, s) => sum + s.population, 0) || 1;
  return raw
    .map((s) => ({ ...s, coverage: s.population / total, ...toOklch(s.hex) }))
    .sort((a, b) => b.population - a.population);
}
