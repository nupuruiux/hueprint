import { contrast, toHex, toOklch, wcagLevel } from "./color";
import type { Fix, Mode, Role } from "./types";

// A pair of roles that must be readable together. `fg` is adjusted by
// default; `adjust: "bg"` adjusts the other side instead (used for button
// colours, where we'd rather move the button than its label).
export type Pair = { fg: Role; bg: Role; target: number; adjust?: "fg" | "bg" };

type Colors = Record<Role, string>;

const STEP = 0.005; // OKLCH lightness nudge per try
const MAX_PASSES = 4;

// Checks every pair and, where one fails, nudges a colour's lightness step by
// step until it passes. Hue and chroma stay, so it still looks like the same
// colour. Locked roles are never changed: the other side of the pair moves
// instead, and if both are locked we report a warning.
// Fixing one pair can break another that shares a colour, so it repeats
// until a full pass changes nothing.
export function fixContrast(
  colors: Colors,
  pairs: Pair[],
  options: { mode: Mode; locked?: Set<Role> },
): { adjusted: Colors; fixes: Fix[]; warnings: string[] } {
  const adjusted = { ...colors };
  const locked = options.locked ?? new Set<Role>();
  const fixes = new Map<Role, Fix>();
  const warnings = new Set<string>();

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    let changed = false;
    for (const pair of pairs) {
      if (contrast(adjusted[pair.fg], adjusted[pair.bg]) >= pair.target) continue;

      let move: Role = pair.adjust === "bg" ? pair.bg : pair.fg;
      let other: Role = move === pair.fg ? pair.bg : pair.fg;
      if (locked.has(move)) [move, other] = [other, move];
      if (locked.has(move)) {
        warnings.add(`${pair.fg} on ${pair.bg} can't reach ${pair.target}:1 because both are locked`);
        continue;
      }

      const before = adjusted[move];
      const after = nudge(before, adjusted[other], pair.target);
      if (after === before) continue;
      adjusted[move] = after;
      changed = true;

      // Keep one entry per role: its original colour and where it ended up.
      const earlier = fixes.get(move);
      fixes.set(move, {
        mode: options.mode,
        role: move,
        from: earlier?.from ?? colors[move],
        to: after,
        against: other,
        ratio: contrast(after, adjusted[other]),
        target: pair.target,
      });
    }
    if (!changed) break;
  }

  return { adjusted, fixes: [...fixes.values()].filter((f) => f.from !== f.to), warnings: [...warnings] };
}

// Moves `hex` away from `against` in lightness until the pair reaches
// `target`. Against a light colour that means darker; against a dark one,
// lighter. Falls back to black or white if even the extreme isn't enough.
export function nudge(hex: string, against: string, target: number): string {
  const color = toOklch(hex);
  const direction = toOklch(against).l > 0.5 ? -1 : 1;
  for (let l = color.l; l >= 0 && l <= 1; l += direction * STEP) {
    const candidate = toHex({ ...color, l });
    if (contrast(candidate, against) >= target) return candidate;
  }
  return direction < 0 ? "#000000" : "#ffffff";
}

// "Darkened text-muted from #8a7f86 to #6e636a to pass AA (4.5:1) on background."
export function describeFix(fix: Fix): string {
  const verb = toOklch(fix.to).l < toOklch(fix.from).l ? "Darkened" : "Lightened";
  const level = fix.target >= 7 ? "AAA" : fix.target >= 4.5 ? "AA" : "AA for large text and UI";
  return `${verb} ${fix.role} from ${fix.from} to ${fix.to} to pass ${level} (${fix.target}:1) on ${fix.against}. Now ${fix.ratio.toFixed(1)}:1, ${wcagLevel(fix.ratio)}.`;
}
