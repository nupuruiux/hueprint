// Browser-only: extract colours from an image (used for uploads).
// Kept apart from the rest of the engine so the pure functions can run
// anywhere, including tests and the server.
import { Vibrant } from "node-vibrant/browser";
import { describeSwatches } from "./swatches";
import type { Swatch } from "./types";

export async function extractColors(src: string): Promise<Swatch[]> {
  const palette = await Vibrant.from(src).getPalette();
  const raw = Object.values(palette)
    .filter((s) => s !== null)
    .map((s) => ({ hex: s.hex, population: s.population }));
  return describeSwatches(raw);
}
