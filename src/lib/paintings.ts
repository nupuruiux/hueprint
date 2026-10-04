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

// The rotating hero: hand-picked portraits (HERO_IDS in the fetch script).
export const heroPaintings = paintings.filter((p) => p.hero);

// Where each hero's figure sits, as a CSS object-position, so the full-bleed
// crop keeps the face in view on wide and narrow screens.
const HERO_FOCUS: Record<number, string> = {
  95998: "50% 30%", // Rembrandt
  111317: "45% 22%", // Ingres
  23972: "50% 22%", // Correggio
  4788: "60% 26%", // Reynolds
  4081: "52% 10%", // Moroni
};

export function heroFocus(p: Painting): string {
  return HERO_FOCUS[p.id] ?? "50% 30%";
}

// Title, artist, date and source: shown wherever a painting appears.
export function creditLine(p: Painting): string {
  return [p.title, p.artist_title, p.date_display].filter(Boolean).join(", ") + " · Art Institute of Chicago";
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
