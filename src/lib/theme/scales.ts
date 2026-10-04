import { toHex, type Oklch } from "./color";
import { STEPS, type Scale, type Step } from "./types";

// Target lightness for each step, light (50) to dark (950).
export const STEP_LIGHTNESS: Record<Step, number> = {
  50: 0.975, 100: 0.94, 200: 0.88, 300: 0.8, 400: 0.71, 500: 0.62,
  600: 0.53, 700: 0.44, 800: 0.35, 900: 0.25, 950: 0.18,
};

// Screens can't show much colour in very light or very dark tones, so chroma
// tapers off toward both ends of the scale and peaks in the middle.
function taper(l: number): number {
  return Math.max(0.2, 1 - Math.abs(l - 0.6) * 1.5);
}

// A 50–950 scale with the base colour's hue. If `keepBase` is on, the step
// closest in lightness IS the base colour, so the scale contains the exact
// colour from the painting. Returns which step that is.
export function buildScale(base: Oklch, keepBase = false): { scale: Scale; baseStep: Step } {
  const scale = {} as Scale;
  let baseStep: Step = 500;
  let closest = Infinity;
  for (const step of STEPS) {
    const l = STEP_LIGHTNESS[step];
    scale[step] = toHex({ l, c: base.c * taper(l), h: base.h });
    const distance = Math.abs(l - base.l);
    if (distance < closest) {
      closest = distance;
      baseStep = step;
    }
  }
  if (keepBase) scale[baseStep] = toHex(base);
  return { scale, baseStep };
}
