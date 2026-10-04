"use client";

import { oklab } from "culori";
import { useEffect, useRef, useState } from "react";

// The redline colour, after Figma's inspect lines. One constant, easy to swap.
const REDLINE = "#f0428a";
const SAMPLE_WIDTH = 80; // the painting is shrunk to this many pixels wide for the search
const LABEL_W = 190;
const LABEL_H = 36;
const MIN_GAP = 140; // px between annotated spots, so the lines don't bunch up

export type RedlineRole = { name: string; hex: string; note?: string };

type Placement = RedlineRole & { x: number; y: number; labelX: number; labelY: number; side: "left" | "right" };
type Box = { left: number; top: number; right: number; bottom: number };

type Props = { src: string; objectPosition: string; roles: RedlineRole[] };

// "Redlines on a masterpiece": design-spec annotations that point to where
// each colour actually is in the painting. Decorative, so hidden from
// screen readers (the colours are listed in the theme page itself).
export function HeroRedlines({ src, objectPosition, roles }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const [placements, setPlacements] = useState<Placement[]>([]);

  useEffect(() => {
    const section = ref.current?.parentElement;
    if (!section) return;
    let cancelled = false;
    let frame = 0;
    let cleanupResize = () => {};

    // Shrink the painting onto a small canvas: each pixel is then the
    // average colour of a patch of the painting.
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const w = SAMPLE_WIDTH;
      const h = Math.round((img.naturalHeight / img.naturalWidth) * w);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, w, h);
      const pixels = ctx.getImageData(0, 0, w, h).data;

      // For each role, rank every patch by how close its colour is (in OKLab,
      // where distance matches what the eye sees). Best matches first.
      const ranked = roles.map((role) => {
        const target = oklab(role.hex)!;
        const cells: { fx: number; fy: number; d: number }[] = [];
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            const c = oklab({ mode: "rgb", r: pixels[i] / 255, g: pixels[i + 1] / 255, b: pixels[i + 2] / 255 })!;
            const d = Math.hypot(c.l - target.l, c.a - target.a, c.b - target.b);
            cells.push({ fx: (x + 0.5) / w, fy: (y + 0.5) / h, d });
          }
        }
        return cells.sort((a, b) => a.d - b.d).slice(0, 400);
      });

      const layout = () => {
        if (cancelled) return;
        setPlacements(place(section, img, objectPosition, roles, ranked));
      };
      layout();
      const onResize = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(layout);
      };
      window.addEventListener("resize", onResize);
      cleanupResize = () => window.removeEventListener("resize", onResize);
    };

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      cleanupResize();
    };
  }, [src, objectPosition, roles]);

  return (
    <>
      <svg ref={ref} aria-hidden className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible">
        {placements.map((p, i) => {
          const edge = p.side === "right" ? p.labelX : p.labelX + LABEL_W;
          const midY = p.labelY + LABEL_H / 2;
          // Leader line: diagonal out of the spot, then level into the label.
          const elbowX = p.side === "right" ? edge - 24 : edge + 24;
          const d = `M ${p.x} ${p.y} L ${elbowX} ${midY} L ${edge} ${midY}`;
          const delay = `${0.3 + i * 0.25}s`;
          return (
            <g key={`${src}-${p.name}`}>
              {/* Dark halo under the line keeps it visible on light paintings. */}
              <path d={d} fill="none" stroke="rgb(20 17 15 / 0.45)" strokeWidth={3} pathLength={1} className="animate-draw" style={{ animationDelay: delay }} />
              <path d={d} fill="none" stroke={REDLINE} strokeWidth={1.25} pathLength={1} className="animate-draw" style={{ animationDelay: delay }} />
              <circle cx={p.x} cy={p.y} r={9} fill="none" stroke={REDLINE} strokeWidth={1.25} className="animate-pop" style={{ animationDelay: delay, transformOrigin: `${p.x}px ${p.y}px` }} />
              <circle cx={p.x} cy={p.y} r={3} fill={REDLINE} className="animate-pop" style={{ animationDelay: delay, transformOrigin: `${p.x}px ${p.y}px` }} />
            </g>
          );
        })}
      </svg>

      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        {placements.map((p, i) => (
          <div
            key={`${src}-${p.name}`}
            className="animate-label absolute flex items-center gap-2 rounded-sm px-2 text-ink shadow-[0_8px_20px_rgba(0,0,0,0.35)]"
            style={{
              left: p.labelX,
              top: p.labelY,
              width: LABEL_W,
              height: LABEL_H,
              background: "#f6f1ea",
              borderLeft: `3px solid ${REDLINE}`,
              animationDelay: `${0.65 + i * 0.25}s`,
            }}
          >
            <span className="h-5 w-5 shrink-0 rounded-sm ring-1 ring-ink/15" style={{ background: p.hex }} />
            <span className="text-xs font-semibold">{p.name}</span>
            <span className="font-mono text-[11px] uppercase text-ink-muted">{p.hex}</span>
            {p.note && <span className="ml-auto text-[11px] font-semibold">{p.note}</span>}
          </div>
        ))}
      </div>
    </>
  );
}

// Choose a spot for each role that's on screen, clear of the frame, header
// and corner controls, not too close to another spot, and with room for its
// label. Uses the same object-fit: cover maths as the CSS to map painting
// coordinates to screen pixels.
function place(
  section: HTMLElement,
  img: HTMLImageElement,
  objectPosition: string,
  roles: RedlineRole[],
  ranked: { fx: number; fy: number }[][],
): Placement[] {
  const box = section.getBoundingClientRect();
  const W = box.width;
  const H = box.height;
  const [posX, posY] = objectPosition.split(" ").map((v) => parseFloat(v) / 100);
  const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
  const drawnW = img.naturalWidth * scale;
  const drawnH = img.naturalHeight * scale;
  const offsetX = (W - drawnW) * posX;
  const offsetY = (H - drawnH) * posY;

  const pad = 16;
  const blocked: Box[] = [
    { left: 0, top: 0, right: W, bottom: 80 }, // header
    { left: W - 360, top: H - 70, right: W, bottom: H }, // credit + pause button
  ];
  const frameEl = section.querySelector("[data-hero-frame]");
  if (frameEl) {
    const f = frameEl.getBoundingClientRect();
    blocked.push({ left: f.left - box.left - pad, top: f.top - box.top - pad, right: f.right - box.left + pad, bottom: f.bottom - box.top + pad });
  }

  const max = W < 768 ? 2 : 3; // fewer annotations on phones
  const chosen: Placement[] = [];

  for (let r = 0; r < roles.length && chosen.length < max; r++) {
    for (const cell of ranked[r]) {
      const x = offsetX + cell.fx * drawnW;
      const y = offsetY + cell.fy * drawnH;
      if (x < pad || y < pad || x > W - pad || y > H - pad) continue;
      if (blocked.some((b) => inside(x, y, b))) continue;
      if (chosen.some((c) => Math.hypot(c.x - x, c.y - y) < MIN_GAP)) continue;

      // Try the label up-and-out first (toward the side with more room),
      // then below, then on the other side. Use the first spot that fits.
      const towardRight = x < W / 2;
      const options: { side: "left" | "right"; dy: number }[] = [
        { side: towardRight ? "right" : "left", dy: -60 },
        { side: towardRight ? "right" : "left", dy: 24 },
        { side: towardRight ? "left" : "right", dy: -60 },
        { side: towardRight ? "left" : "right", dy: 24 },
      ];
      const fit = options.find(({ side, dy }) => {
        const left = side === "right" ? x + 70 : x - 70 - LABEL_W;
        const label = { left, top: y + dy, right: left + LABEL_W, bottom: y + dy + LABEL_H };
        if (label.left < pad || label.top < pad || label.right > W - pad || label.bottom > H - pad) return false;
        if (blocked.some((b) => overlaps(label, b))) return false;
        return !chosen.some((c) =>
          overlaps(label, { left: c.labelX - 8, top: c.labelY - 8, right: c.labelX + LABEL_W + 8, bottom: c.labelY + LABEL_H + 8 }),
        );
      });
      if (!fit) continue;

      const labelX = fit.side === "right" ? x + 70 : x - 70 - LABEL_W;
      chosen.push({ ...roles[r], x, y, labelX, labelY: y + fit.dy, side: fit.side });
      break;
    }
  }
  return chosen;
}

function inside(x: number, y: number, b: Box) {
  return x > b.left && x < b.right && y > b.top && y < b.bottom;
}

function overlaps(a: Box, b: Box) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}
