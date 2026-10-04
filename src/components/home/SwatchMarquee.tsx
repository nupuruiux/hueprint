import { paintings } from "@/lib/paintings";
import { contrastRatio, pickPrimary } from "@/lib/theme/primary";

// A slow strip of real colours: each painting's primary. Decorative, so
// hidden from screen readers. Pauses on hover; static with reduced motion.
export function SwatchMarquee() {
  const colors = paintings.map((p) => pickPrimary(p.swatches));

  return (
    <div aria-hidden className="group overflow-hidden border-b border-line bg-paper py-4">
      {/* The list is rendered twice and slides by half its width, so the loop is seamless. */}
      <div className="flex w-max animate-marquee gap-3 group-hover:[animation-play-state:paused]">
        {[...colors, ...colors].map((hex, i) => (
          <span
            key={i}
            className="flex h-12 w-28 items-end rounded-md px-2 pb-1.5 font-mono text-[11px] uppercase"
            // Label in whichever of white or ink reads better on the swatch.
            style={{ background: hex, color: contrastRatio("#ffffff", hex) >= contrastRatio("#1f1a17", hex) ? "#ffffff" : "#1f1a17" }}
          >
            {hex}
          </span>
        ))}
      </div>
    </div>
  );
}
