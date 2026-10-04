// Read-only access to data/paintings.json (made by scripts/fetch-paintings.ts).
import data from "../../data/paintings.json";
import type { Painting } from "../../scripts/fetch-paintings";

export type { Painting };

export const paintings = data as Painting[];

// Movements in gallery order. The script writes paintings grouped by movement,
// so first appearance gives the right order.
export const movements: string[] = [...new Set(paintings.map((p) => p.movement))];

export function paintingsIn(movement: string): Painting[] {
  return paintings.filter((p) => p.movement === movement);
}

// Local copy saved by the fetch script. next/image makes the smaller sizes.
export function imageUrl(p: Painting): string {
  return `/paintings/${p.id}.jpg`;
}

export function altText(p: Painting): string {
  return `${p.title} by ${p.artist_title}`;
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const ROMAN: [number, string][] = [
  [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
];

// 1 → "I", 6 → "VI". Only needs to cover the movement index.
export function toRoman(n: number): string {
  let out = "";
  for (const [value, numeral] of ROMAN) {
    while (n >= value) {
      out += numeral;
      n -= value;
    }
  }
  return out;
}
