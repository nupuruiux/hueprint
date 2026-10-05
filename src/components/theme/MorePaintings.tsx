import { PaintingCard } from "@/components/home/PaintingCard";
import { paintings, type Painting } from "@/lib/paintings";

// "Try another painting": 4 from the same movement (topped up from the rest
// of the gallery if the movement is small). Ends the page with a next step.
export function MorePaintings({ painting }: { painting: Painting }) {
  const others = paintings.filter((p) => p.id !== painting.id);
  const sameMovement = others.filter((p) => p.movement === painting.movement);
  // Start at a different spot for each painting so neighbours don't all
  // suggest the same four.
  const start = painting.id % Math.max(sameMovement.length, 1);
  const rotated = [...sameMovement.slice(start), ...sameMovement.slice(0, start)];
  const picks = [...rotated, ...others.filter((p) => p.movement !== painting.movement)].slice(0, 4);

  return (
    <section aria-labelledby="more-title" className="mt-24 border-t border-line pt-12">
      <h2 id="more-title" className="font-display text-3xl sm:text-4xl">
        Try another <span className="italic">painting</span>
      </h2>
      <p className="mt-2 text-ink-muted">More from {painting.movement}.</p>
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-2 sm:gap-x-6 md:grid-cols-4">
        {picks.map((p, i) => (
          <PaintingCard key={p.id} painting={p} index={i} />
        ))}
      </div>
    </section>
  );
}
