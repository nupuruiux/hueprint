"use client";

import { useEffect, useRef, useState } from "react";
import { contrast } from "@/lib/theme";

const SIZE = 120; // loupe diameter, px
const ZOOM = 2.5; // magnification inside the loupe
const MAX_PINS = 6;

type Props = { src: string; objectPosition: string };

// Eyedropper loupe over the hero painting: a magnifier whose ring takes the
// exact colour under the cursor, with its hex. Click to pin a colour.
// Mouse/trackpad only; touch devices keep the plain hero.
export function HeroLoupe({ src, objectPosition }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const loupeRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const currentHex = useRef<string | null>(null);
  const [pins, setPins] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const hero = ref.current?.parentElement;
    const loupe = loupeRef.current;
    if (!hero || !loupe || !window.matchMedia("(hover: hover)").matches) return;

    // Draw the painting into an off-screen canvas so we can read its pixels.
    // This works because the image is served from our own site.
    const img = new Image();
    img.src = src;
    let ctx: CanvasRenderingContext2D | null = null;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx?.drawImage(img, 0, 0);
      loupe.style.backgroundImage = `url(${src})`;
    };

    const [posX, posY] = objectPosition.split(" ").map((v) => parseFloat(v) / 100);

    const hide = () => {
      loupe.style.opacity = "0";
      hero.style.cursor = "";
      currentHex.current = null;
    };

    const move = (e: PointerEvent) => {
      // Over the frame, links or buttons, show the normal cursor instead.
      if (!ctx || (e.target as Element).closest("a, button, [data-no-loupe]")) return hide();

      const box = hero.getBoundingClientRect();
      const x = e.clientX - box.left;
      const y = e.clientY - box.top;

      // The painting is drawn with object-fit: cover, so work out where the
      // cursor lands on the original image: same scale and offset as the CSS.
      const scale = Math.max(box.width / img.naturalWidth, box.height / img.naturalHeight);
      const drawnW = img.naturalWidth * scale;
      const drawnH = img.naturalHeight * scale;
      const offsetX = (box.width - drawnW) * posX;
      const offsetY = (box.height - drawnH) * posY;
      const imgX = Math.round((x - offsetX) / scale);
      const imgY = Math.round((y - offsetY) / scale);

      const [r, g, b] = ctx.getImageData(imgX, imgY, 1, 1).data;
      const hex = "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("");
      currentHex.current = hex;

      // Magnified view: the same painting, scaled up, centred on the cursor.
      loupe.style.opacity = "1";
      loupe.style.transform = `translate(${x - SIZE / 2}px, ${y - SIZE / 2}px)`;
      loupe.style.backgroundSize = `${drawnW * ZOOM}px ${drawnH * ZOOM}px`;
      loupe.style.backgroundPosition = `${SIZE / 2 - (x - offsetX) * ZOOM}px ${SIZE / 2 - (y - offsetY) * ZOOM}px`;
      loupe.style.borderColor = hex;
      if (labelRef.current) labelRef.current.textContent = hex.toUpperCase();
      hero.style.cursor = "none";
    };

    const click = (e: PointerEvent) => {
      const hex = currentHex.current;
      if (!hex || (e.target as Element).closest("a, button, [data-no-loupe]")) return;
      setPins((prev) => [hex, ...prev.filter((p) => p !== hex)].slice(0, MAX_PINS));
    };

    hero.addEventListener("pointermove", move);
    hero.addEventListener("pointerleave", hide);
    hero.addEventListener("click", click as EventListener);
    return () => {
      hero.removeEventListener("pointermove", move);
      hero.removeEventListener("pointerleave", hide);
      hero.removeEventListener("click", click as EventListener);
      hero.style.cursor = "";
    };
  }, [src, objectPosition]);

  async function copy(hex: string) {
    await navigator.clipboard?.writeText(hex.toUpperCase());
    setCopied(hex);
    setTimeout(() => setCopied(null), 1200);
  }

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 z-20">
      <div
        ref={loupeRef}
        aria-hidden
        className="absolute left-0 top-0 rounded-full border-[6px] bg-night bg-no-repeat opacity-0 shadow-[0_12px_32px_rgba(0,0,0,0.5)] outline-2 outline-paper transition-opacity duration-200"
        style={{ width: SIZE, height: SIZE }}
      >
        {/* Crosshair dot marks the sampled pixel. */}
        <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-paper ring-1 ring-night" />
        <span
          ref={labelRef}
          className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-paper px-2.5 py-1 font-mono text-xs font-semibold text-ink"
        />
      </div>

      {/* Picks row only on wide screens: below lg the frame fills the width and there's no free space. */}
      {pins.length > 0 && (
        <div data-no-loupe className="pointer-events-auto absolute bottom-16 right-4 hidden flex-col items-end gap-2 lg:flex">
          <p className="text-xs font-semibold uppercase tracking-widest text-paper/80">
            Your picks · click to copy
          </p>
          <ul className="flex gap-1.5">
            {pins.map((hex) => (
              <li key={hex}>
                <button
                  type="button"
                  onClick={() => copy(hex)}
                  className="h-11 w-16 rounded-md px-1.5 pt-5 text-left font-mono text-[10px] uppercase shadow-lg transition-transform hover:-translate-y-0.5"
                  style={{ background: hex, color: contrast("#ffffff", hex) >= contrast("#1f1a17", hex) ? "#ffffff" : "#1f1a17" }}
                  aria-label={`Copy ${hex.toUpperCase()}`}
                >
                  {copied === hex ? "Copied" : hex}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
