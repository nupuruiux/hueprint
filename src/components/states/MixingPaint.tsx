// "Mixing paint…": dots in the image's colours swirl around and settle into a
// row of swatches, then loop. Pure CSS. With prefers-reduced-motion the
// global rule stops animations, so the swatches simply sit in place.

const DOTS_PER_COLOR = 9;
const FALLBACK = ["#7a1f3d", "#507b9c", "#c6b08f", "#2e6f73", "#e2725b", "#1f1a17"];

export function MixingPaint({ colors = FALLBACK, label = "Mixing paint…" }: { colors?: string[]; label?: string }) {
  const palette = colors.slice(0, 6);
  return (
    <div role="status" className="flex flex-col items-center gap-5 py-16">
      <div aria-hidden className="relative h-24 w-72">
        {palette.flatMap((color, c) =>
          Array.from({ length: DOTS_PER_COLOR }, (_, d) => {
            // Each dot starts somewhere on a ring and ends inside its colour's slot.
            const angle = (c * DOTS_PER_COLOR + d) * (360 / (palette.length * DOTS_PER_COLOR)) * 2.3;
            const slotX = (c - (palette.length - 1) / 2) * 44;
            const endX = slotX + ((d % 3) - 1) * 10;
            const endY = (Math.floor(d / 3) - 1) * 10;
            return (
              <span
                key={`${c}-${d}`}
                className="animate-mix absolute left-1/2 top-1/2 -ml-1.5 -mt-1.5 h-3 w-3 rounded-full"
                style={
                  {
                    background: color,
                    "--a": `${angle}deg`,
                    "--x": `${endX}px`,
                    "--y": `${endY}px`,
                    animationDelay: `${(d % 3) * 40}ms`,
                  } as React.CSSProperties
                }
              />
            );
          }),
        )}
      </div>
      <p className="font-display text-2xl italic text-ink-muted">{label}</p>
    </div>
  );
}
