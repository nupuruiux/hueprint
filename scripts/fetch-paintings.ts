// Pulls ~36 public-domain paintings from the Art Institute of Chicago API,
// downloads each image to public/paintings/, extracts its main colours, and
// saves everything to data/paintings.json. The app serves those local copies,
// so it never depends on the museum's servers at page load. (AIC's image
// server also refuses requests without the AIC-User-Agent header, which
// browsers can't send from an <img> tag.)
//
// Run with: npm run fetch:paintings

import { writeFile, readFile, mkdir, readdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { Vibrant } from "node-vibrant/node";
import { oklch } from "culori";

const API = "https://api.artic.edu/api/v1/artworks/search";
const IIIF = "https://www.artic.edu/iiif/2";
// AIC asks API users to identify themselves.
const HEADERS = {
  "Content-Type": "application/json",
  "AIC-User-Agent": "hueprint (https://github.com/nupuruiux/hueprint)",
};

const PER_MOVEMENT = 5;

const IMAGE_DIR = "public/paintings";
// 843 px wide is the size AIC caches best. Hero paintings run full-bleed,
// so they get a bigger copy.
const GALLERY_WIDTH = 843;
const HERO_WIDTH = 1600;

// AIC's style_title values are messy ("17th Century", "nineteenth century",
// "Renaissance"…), so we group them into six movements. Order = gallery order.
const MOVEMENTS = [
  {
    name: "Old Masters",
    styles: ["14th century", "15th century", "16th Century", "sixteenth century",
      "17th Century", "18th Century", "Renaissance", "Baroque", "Mannerism", "Flemish", "dutch"],
  },
  {
    name: "Romantic & Realist",
    styles: ["19th century", "nineteenth century", "Realism", "Neoclassicism",
      "Barbizon School", "Hudson River School", "Pre-Raphaelite"],
  },
  { name: "Impressionism", styles: ["Impressionism"] },
  { name: "Post-Impressionism", styles: ["Post-Impressionism", "Pointillism"] },
  { name: "Modern", styles: ["Modernism", "20th Century"] },
  {
    name: "Asian Traditions",
    styles: ["Japanese (culture or style)", "edo (japanese period)", "Chinese (culture or style)",
      "South Asian", "mughal", "Himalayan", "Korean (culture or style)"],
  },
] as const;

// Hand-picked portraits with strong figures for the rotating hero.
// Always included, on top of the per-movement picks. Edit freely.
const HERO_IDS = [
  95998, // Rembrandt, Old Man with a Gold Chain
  4081, // Moroni, Gian Lodovico Madruzzo
  111317, // Ingres, Amédée-David, the Comte de Pastoret
  4788, // Reynolds, Lady Sarah Bunbury Sacrificing to the Graces
  23972, // Correggio, Virgin and Child with the Young Saint John
];

// Old oils lean amber and brown, so the automatic picks are mostly warm.
// These cool-toned works keep the "Cool" filter (and the palettes) varied.
const VARIETY_IDS = [
  56905, // Whistler, Nocturne: Blue and Gold—Southampton Water
  72801, // Twachtman, Icebound
  109780, // Bellows, Love of Winter
  110507, // Böcklin, In the Sea
  14598, // Monet, The Beach at Sainte-Adresse
];

const FIELDS = ["id", "title", "artist_title", "date_display", "style_title",
  "image_id", "thumbnail", "credit_line"];

type ApiArtwork = {
  id: number;
  title: string;
  artist_title: string | null;
  date_display: string | null;
  style_title: string | null;
  image_id: string;
  thumbnail: { width: number; height: number; alt_text?: string } | null;
  credit_line: string | null;
};

type Swatch = { hex: string; population: number };

type Mood = "warm" | "cool" | "vivid" | "muted";

export type Painting = {
  id: number;
  title: string;
  artist_title: string;
  date_display: string;
  style_title: string | null;
  movement: string;
  image_id: string;
  width: number;
  height: number;
  credit: string;
  swatches: Swatch[]; // most common colour first
  moods: Mood[]; // always one of warm/cool + one of vivid/muted
  hero: boolean;
};

async function search(filters: object[], limit: number): Promise<ApiArtwork[]> {
  const res = await fetch(API, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      query: {
        bool: {
          filter: [
            { term: { is_public_domain: true } },
            { term: { "artwork_type_title.keyword": "Painting" } },
            { exists: { field: "image_id" } },
            ...filters,
          ],
        },
      },
      fields: FIELDS,
      limit,
    }),
  });
  if (!res.ok) throw new Error(`AIC search failed: ${res.status}`);
  const json = (await res.json()) as { data: ApiArtwork[] };
  return json.data;
}

// Museum highlights first; if a movement is short, fill with works people
// actually look at (AIC flags rarely viewed ones).
async function pickForMovement(styles: readonly string[]): Promise<ApiArtwork[]> {
  const styleFilter = { terms: { "style_title.keyword": styles } };
  const boosted = await search([styleFilter, { term: { is_boosted: true } }], 30);
  const picks = boosted.filter(usable).slice(0, PER_MOVEMENT);
  if (picks.length < PER_MOVEMENT) {
    const more = await search([styleFilter, { term: { has_not_been_viewed_much: false } }], 60);
    for (const art of more.filter(usable)) {
      if (picks.length >= PER_MOVEMENT) break;
      if (!picks.some((p) => p.id === art.id)) picks.push(art);
    }
  }
  return picks;
}

// Skip works missing what the UI needs, and very long thin objects
// (scrolls, altar frontals) that look odd in a masonry grid.
function usable(a: ApiArtwork): boolean {
  if (!a.image_id || !a.thumbnail?.width || !a.thumbnail?.height) return false;
  const ratio = a.thumbnail.width / a.thumbnail.height;
  return ratio > 0.4 && ratio < 2.2;
}

// Saves the image to public/paintings/{id}.jpg. Skips the download if the
// file is already there, to go easy on the museum's servers when re-running.
async function downloadImage(art: ApiArtwork, width: number): Promise<Buffer> {
  const path = `${IMAGE_DIR}/${art.id}.jpg`;
  if (existsSync(path)) return readFile(path);
  const res = await fetch(`${IIIF}/${art.image_id}/full/${width},/0/default.jpg`, { headers: HEADERS });
  if (!res.ok) throw new Error(`Image for ${art.id} failed: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(path, buffer);
  return buffer;
}

async function extractSwatches(image: Buffer): Promise<Swatch[]> {
  const palette = await Vibrant.from(image).getPalette();
  return Object.values(palette)
    .filter((s) => s !== null)
    .map((s) => ({ hex: s.hex, population: s.population }))
    .sort((a, b) => b.population - a.population);
}

// Average chroma (colourfulness in OKLCH), weighted by how much of the
// painting each swatch covers.
function averageChroma(swatches: Swatch[]): number {
  const total = swatches.reduce((sum, s) => sum + s.population, 0) || 1;
  return swatches.reduce((sum, s) => sum + (oklch(s.hex)?.c ?? 0) * s.population, 0) / total;
}

// Warm or cool: is most of the painting's *colourful* area warm or cool?
// Each swatch counts by coverage × chroma, so near-greys barely count.
// In OKLCH, reds/oranges/yellows sit roughly 0–110° and pinks wrap past 340°.
function temperature(swatches: Swatch[]): "warm" | "cool" {
  let warm = 0;
  let cool = 0;
  for (const s of swatches) {
    const c = oklch(s.hex);
    if (!c || c.h === undefined) continue;
    const weight = s.population * c.c;
    if (c.h < 110 || c.h >= 340) warm += weight;
    else cool += weight;
  }
  return cool > warm ? "cool" : "warm";
}

async function main() {
  const chosen: { art: ApiArtwork; movement: string }[] = [];

  for (const m of MOVEMENTS) {
    const picks = await pickForMovement(m.styles);
    console.log(`${m.name}: ${picks.length}`);
    for (const art of picks) chosen.push({ art, movement: m.name });
  }

  // Add hand-picked paintings that weren't already picked.
  const missing = [...HERO_IDS, ...VARIETY_IDS].filter((id) => !chosen.some((c) => c.art.id === id));
  if (missing.length) {
    const extras = await search([{ terms: { id: missing } }], missing.length);
    for (const art of extras) {
      const movement = MOVEMENTS.find((m) =>
        (m.styles as readonly string[]).includes(art.style_title ?? ""))?.name ?? "Old Masters";
      chosen.push({ art, movement });
    }
  }

  await mkdir(IMAGE_DIR, { recursive: true });
  const paintings: Omit<Painting, "moods">[] = [];
  for (const { art, movement } of chosen) {
    const isHero = HERO_IDS.includes(art.id);
    const image = await downloadImage(art, isHero ? HERO_WIDTH : GALLERY_WIDTH);
    const swatches = await extractSwatches(image);
    paintings.push({
      id: art.id,
      title: art.title,
      artist_title: art.artist_title ?? "Unknown artist",
      date_display: art.date_display ?? "",
      style_title: art.style_title,
      movement,
      image_id: art.image_id,
      width: art.thumbnail!.width,
      height: art.thumbnail!.height,
      credit: `${art.credit_line ?? "Art Institute of Chicago"} · Art Institute of Chicago`,
      swatches,
      hero: isHero,
    });
    process.stdout.write(".");
  }
  console.log();

  // Vivid vs muted is relative to this collection: split at the median
  // chroma so both filters always have roughly half the paintings.
  const chromas = paintings.map((p) => averageChroma(p.swatches)).sort((a, b) => a - b);
  const median = chromas[Math.floor(chromas.length / 2)];

  const withMoods: Painting[] = paintings.map((p) => ({
    ...p,
    moods: [temperature(p.swatches), averageChroma(p.swatches) >= median ? "vivid" : "muted"],
  }));

  // Remove images of paintings that are no longer in the list.
  const keep = new Set(withMoods.map((p) => `${p.id}.jpg`));
  for (const file of await readdir(IMAGE_DIR)) {
    if (!keep.has(file)) await rm(`${IMAGE_DIR}/${file}`);
  }

  await mkdir("data", { recursive: true });
  await writeFile("data/paintings.json", JSON.stringify(withMoods, null, 2) + "\n");

  const count = (mood: Mood) => withMoods.filter((p) => p.moods.includes(mood)).length;
  console.log(`Saved ${withMoods.length} paintings to data/paintings.json`);
  console.log(`warm ${count("warm")} · cool ${count("cool")} · vivid ${count("vivid")} · muted ${count("muted")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
