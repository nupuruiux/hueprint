import { clamp, contrast, hueDelta, hueDistance, toHex, toOklch, type Oklch } from "./color";
import { fixContrast, type Pair } from "./contrast";
import { buildScale } from "./scales";
import {
  ROLES,
  type Fix,
  type Locks,
  type Mode,
  type ModeTokens,
  type Primitives,
  type Role,
  type Scale,
  type Step,
  type Strategy,
  type Swatch,
  type Theme,
} from "./types";

const WHITE = "#ffffff";

type NeutralRole = "background" | "surface" | "surface-raised" | "border" | "text" | "text-muted";
type NeutralPick = Step | "white";

type StrategyConfig = {
  primaryChroma: number; // multiplies the painting's chroma
  primaryLightness?: number; // pulls the primary halfway toward this lightness
  neutralChroma: number; // how much of the painting's hue tints the greys
  statusChroma: number; // multiplies success / warning / danger chroma
  textTarget: number; // contrast target for body text
  pickBy: "coverage" | "chroma"; // how the primary is chosen
  light: Record<NeutralRole, NeutralPick>;
  dark: Record<NeutralRole, NeutralPick>;
};

// The three directions. Faithful keeps the painting's colours as they are;
// Soft lowers chroma for calm, airy surfaces; Bold takes the most saturated
// colour, darker surfaces and AAA text.
const STRATEGIES: Record<Strategy, StrategyConfig> = {
  faithful: {
    primaryChroma: 1,
    neutralChroma: 0.012,
    statusChroma: 1,
    textTarget: 4.5,
    pickBy: "coverage",
    light: { background: 100, surface: 50, "surface-raised": "white", border: 300, text: 900, "text-muted": 600 },
    dark: { background: 950, surface: 900, "surface-raised": 800, border: 700, text: 50, "text-muted": 300 },
  },
  soft: {
    primaryChroma: 0.6,
    primaryLightness: 0.66,
    neutralChroma: 0.008,
    statusChroma: 0.75,
    textTarget: 4.5,
    pickBy: "coverage",
    light: { background: 50, surface: "white", "surface-raised": "white", border: 200, text: 800, "text-muted": 500 },
    dark: { background: 900, surface: 800, "surface-raised": 700, border: 600, text: 100, "text-muted": 300 },
  },
  bold: {
    primaryChroma: 1.3,
    primaryLightness: 0.52,
    neutralChroma: 0.02,
    statusChroma: 1.15,
    textTarget: 7,
    pickBy: "chroma",
    light: { background: 200, surface: 100, "surface-raised": 50, border: 400, text: 950, "text-muted": 700 },
    dark: { background: 950, surface: 900, "surface-raised": 800, border: 600, text: 50, "text-muted": 200 },
  },
};

// Fixed hues for status colours (OKLCH), nudged toward the painting below.
const STATUS_HUES = { success: 145, warning: 80, danger: 25 } as const;

const MONOCHROME_CHROMA = 0.04; // below this everywhere, an image counts as monochrome
const MIN_COVERAGE = 0.02; // ignore specks covering less than 2% of the image

// Every pair that must be readable. Exported so tests can check them all.
export function requiredPairs(strategy: Strategy): Pair[] {
  return [...basePairs(strategy), ...stateAndFocusPairs()];
}

// Checked first: text, borders, brand and status colours.
function basePairs(strategy: Strategy): Pair[] {
  const t = STRATEGIES[strategy].textTarget;
  return [
    { fg: "text", bg: "background", target: t },
    { fg: "text", bg: "surface", target: t },
    { fg: "text", bg: "surface-raised", target: t },
    { fg: "text-muted", bg: "background", target: 4.5 },
    { fg: "text-muted", bg: "surface", target: 4.5 },
    { fg: "text-muted", bg: "surface-raised", target: 4.5 },
    { fg: "border", bg: "background", target: 3 },
    { fg: "border", bg: "surface", target: 3 },
    { fg: "primary", bg: "background", target: 3 },
    { fg: "primary", bg: "surface", target: 3 },
    { fg: "on-primary", bg: "primary", target: 4.5, adjust: "bg" },
    { fg: "secondary", bg: "background", target: 3 },
    { fg: "secondary", bg: "surface", target: 3 },
    { fg: "accent", bg: "background", target: 3 },
    { fg: "accent", bg: "surface", target: 3 },
    { fg: "success", bg: "surface", target: 4.5 },
    { fg: "success", bg: "background", target: 4.5 },
    { fg: "warning", bg: "surface", target: 4.5 },
    { fg: "warning", bg: "background", target: 4.5 },
    { fg: "danger", bg: "surface", target: 4.5 },
    { fg: "danger", bg: "background", target: 4.5 },
  ];
}

// Checked after hover/pressed states are derived from the final primary.
function stateAndFocusPairs(): Pair[] {
  return [
    { fg: "on-primary", bg: "primary-hover", target: 4.5, adjust: "bg" },
    { fg: "on-primary", bg: "primary-pressed", target: 4.5, adjust: "bg" },
    { fg: "focus-ring", bg: "background", target: 3 },
    { fg: "focus-ring", bg: "surface", target: 3 },
  ];
}

// Brief, step 2: "the most saturated colour that covers a decent part of the
// image". Score = chroma × √coverage, so a vivid speck can't beat a colour
// that shapes the painting. Bold just takes the most saturated colour.
export function pickPrimary(swatches: Swatch[], pickBy: "coverage" | "chroma" = "coverage"): Swatch {
  const pool = swatches.filter((s) => s.coverage >= MIN_COVERAGE);
  const candidates = pool.length ? pool : swatches;
  const score = (s: Swatch) => (pickBy === "chroma" ? s.c : s.c * Math.sqrt(s.coverage));
  return candidates.reduce((best, s) => (score(s) > score(best) ? s : best), candidates[0]);
}

export function isMonochrome(swatches: Swatch[]): boolean {
  const pool = swatches.filter((s) => s.coverage >= MIN_COVERAGE);
  return (pool.length ? pool : swatches).every((s) => s.c < MONOCHROME_CHROMA);
}

// Applies a direction's chroma and lightness to a colour from the painting.
function shape(color: Oklch, config: StrategyConfig): Oklch {
  const l = config.primaryLightness === undefined ? color.l : color.l + (config.primaryLightness - color.l) * 0.5;
  return { l, c: color.c * config.primaryChroma, h: color.h };
}

// Next-best colours for secondary and accent: colourful enough, and at least
// 30° of hue away from the primary (and each other) so they read as different.
function pickSupporting(swatches: Swatch[], primary: Swatch): Swatch[] {
  const picked: Swatch[] = [];
  const ranked = [...swatches].sort((a, b) => b.c * Math.sqrt(b.coverage) - a.c * Math.sqrt(a.coverage));
  for (const s of ranked) {
    if (s.hex === primary.hex || s.c < 0.03) continue;
    if ([primary, ...picked].some((p) => hueDistance(p.h, s.h) < 30)) continue;
    picked.push(s);
    if (picked.length === 2) break;
  }
  return picked;
}

export function buildTheme(swatches: Swatch[], strategy: Strategy, locks: Locks = {}): Theme {
  const config = STRATEGIES[strategy];
  const monochrome = isMonochrome(swatches);
  const faithful = strategy === "faithful";
  const chosen = pickPrimary(swatches, config.pickBy);

  // Low-colour images still get a theme: neutrals plus one accent. The
  // accent takes the image's faint tint if it has one (sepia → warm).
  const primaryBase: Oklch = monochrome
    ? { l: 0.5, c: 0.12, h: chosen.c > 0.01 ? chosen.h : 260 }
    : faithful
      ? { l: chosen.l, c: chosen.c, h: chosen.h }
      : shape(chosen, config);
  const primary = buildScale(primaryBase, faithful && !monochrome);

  // Secondary and accent from the painting, or from the primary's own scale
  // if the painting doesn't have enough distinct colours.
  const supporting = monochrome ? [] : pickSupporting(swatches, chosen);
  const fallback = (step: Step) => toOklch(primary.scale[step]);
  const secondaryBase = supporting[0] ? (faithful ? supporting[0] : shape(supporting[0], config)) : fallback(700);
  const accentBase = supporting[1] ? (faithful ? supporting[1] : shape(supporting[1], config)) : fallback(400);
  const secondary = buildScale(secondaryBase, faithful && !!supporting[0]);
  const accent = buildScale(accentBase, faithful && !!supporting[1]);

  // Greys tinted with the hue of the colour covering most of the painting.
  const dominant = swatches[0];
  const neutralHue = dominant && dominant.c > 0.01 ? dominant.h : primaryBase.h;
  const neutral = buildScale({ l: 0.6, c: config.neutralChroma, h: neutralHue });

  const primitives: Primitives = {
    primary: primary.scale,
    secondary: secondary.scale,
    accent: accent.scale,
    neutral: neutral.scale,
  };
  const bases = { primary: primary.baseStep, secondary: secondary.baseStep, accent: accent.baseStep };

  const light = buildMode("light", { config, strategy, primitives, bases, primaryBase, locks });
  const dark = buildMode("dark", { config, strategy, primitives, bases, primaryBase, locks });

  return {
    strategy,
    monochrome,
    primitives,
    light: light.tokens,
    dark: dark.tokens,
    fixes: [...light.fixes, ...dark.fixes],
    warnings: [...light.warnings, ...dark.warnings],
  };
}

export function buildOptions(swatches: Swatch[], locks: Locks = {}): Record<Strategy, Theme> {
  return {
    faithful: buildTheme(swatches, "faithful", locks),
    soft: buildTheme(swatches, "soft", locks),
    bold: buildTheme(swatches, "bold", locks),
  };
}

type ModeContext = {
  config: StrategyConfig;
  strategy: Strategy;
  primitives: Primitives;
  bases: { primary: Step; secondary: Step; accent: Step };
  primaryBase: Oklch;
  locks: Locks;
};

function buildMode(mode: Mode, ctx: ModeContext): { tokens: ModeTokens; fixes: Fix[]; warnings: string[] } {
  const { config, primitives, bases } = ctx;
  const colors = {} as Record<Role, string>;
  const refs = {} as Record<Role, string | null>;
  const set = (role: Role, hex: string, ref: string | null) => {
    colors[role] = hex;
    refs[role] = ref;
  };

  // Neutrals: the scale is flipped for dark mode (dark background, light text).
  for (const [role, pick] of Object.entries(config[mode]) as [NeutralRole, NeutralPick][]) {
    if (pick === "white") set(role, WHITE, "white");
    else set(role, primitives.neutral[pick], `neutral.${pick}`);
  }

  // Brand colours. Dark mode lowers lightness and chroma slightly (brief,
  // step 7); the contrast fixer then lifts them if they're too dark to see.
  for (const name of ["primary", "secondary", "accent"] as const) {
    const base = primitives[name][bases[name]];
    if (mode === "light") {
      set(name, base, `${name}.${bases[name]}`);
    } else {
      const c = toOklch(base);
      const hex = toHex({ l: c.l - 0.03, c: c.c * 0.9, h: c.h });
      set(name, hex, `${name}.${nearestStep(primitives[name], hex)}`);
    }
  }

  // Status colours: fixed hues, turned up to 12° toward the painting's
  // primary hue so they feel like they belong to it.
  for (const [role, hue] of Object.entries(STATUS_HUES) as [keyof typeof STATUS_HUES, number][]) {
    const h = hue + clamp(hueDelta(hue, ctx.primaryBase.h) * 0.15, -12, 12);
    const c = clamp(ctx.primaryBase.c, 0.1, 0.16) * config.statusChroma;
    const l = mode === "light" ? (role === "warning" ? 0.58 : 0.52) : 0.76;
    set(role, toHex({ l, c, h }), null);
  }

  // Locked roles override whatever was generated.
  const locked = new Set<Role>();
  for (const [role, hex] of Object.entries(ctx.locks[mode] ?? {}) as [Role, string][]) {
    set(role, hex, null);
    locked.add(role);
  }

  const darkText = primitives.neutral[950];
  const lightText = mode === "light" ? WHITE : primitives.neutral[50];
  // Button label. The primary has to stand out 3:1 from the background, so
  // it ends up darker than a light background and lighter than a dark one.
  // So: light label in light mode, dark label in dark mode, which always
  // works. Only if the primary is locked (and can't move) do we pick
  // whichever label reads better on it.
  const pickOnPrimary = () => {
    if (locked.has("on-primary")) return;
    const useLight = locked.has("primary")
      ? contrast(lightText, colors.primary) >= contrast(darkText, colors.primary)
      : mode === "light";
    set("on-primary", useLight ? lightText : darkText, useLight ? (lightText === WHITE ? "white" : "neutral.50") : "neutral.950");
  };

  // Stage 1: fix the base pairs.
  const allFixes = new Map<Role, Fix>();
  const warnings = new Set<string>();
  const record = (result: ReturnType<typeof fixContrast>) => {
    Object.assign(colors, result.adjusted);
    for (const fix of result.fixes) {
      const earlier = allFixes.get(fix.role);
      allFixes.set(fix.role, { ...fix, from: earlier?.from ?? fix.from });
    }
    result.warnings.forEach((w) => warnings.add(w));
  };

  // Order matters: first make the primary stand out from the backgrounds,
  // then add its label and check everything together. With the label rule
  // above, "keep the label readable" and "keep the primary visible" push the
  // primary the same way instead of fighting each other.
  const withoutLabel = basePairs(ctx.strategy).filter((p) => p.fg !== "on-primary");
  record(fixContrast(colors, withoutLabel, { mode, locked }));
  pickOnPrimary();
  record(fixContrast(colors, basePairs(ctx.strategy), { mode, locked }));

  // Stage 2: states derived from the final primary (brief, step 5).
  // Hover/pressed move away from the label colour, so the label stays
  // readable: darker under light text, lighter under dark text.
  const p = toOklch(colors.primary);
  const labelIsLighter = toOklch(colors["on-primary"]).l > p.l;
  const shift = (amount: number) => toHex({ ...p, l: labelIsLighter ? p.l * (1 - amount) : Math.min(0.98, p.l * (1 + amount)) });
  const surfaceL = toOklch(colors.surface).l;
  if (!locked.has("primary-hover")) set("primary-hover", shift(0.08), refs.primary);
  if (!locked.has("primary-pressed")) set("primary-pressed", shift(0.14), refs.primary);
  if (!locked.has("primary-disabled")) set("primary-disabled", toHex({ l: p.l + (surfaceL - p.l) * 0.4, c: p.c * 0.3, h: p.h }), refs.primary);
  if (!locked.has("focus-ring")) set("focus-ring", colors.primary, refs.primary);
  record(fixContrast(colors, stateAndFocusPairs(), { mode, locked }));

  // Each token remembers its primitive, and whether the fixer moved it off it.
  const tokens = {} as ModeTokens;
  for (const role of ROLES) {
    const ref = refs[role];
    tokens[role] = { hex: colors[role], ref, adjusted: ref !== null && primitiveHex(primitives, ref) !== colors[role] };
  }
  return { tokens, fixes: [...allFixes.values()].filter((f) => f.from !== f.to), warnings: [...warnings] };
}

function nearestStep(scale: Scale, hex: string): Step {
  const l = toOklch(hex).l;
  let best: Step = 500;
  let distance = Infinity;
  for (const [step, value] of Object.entries(scale)) {
    const d = Math.abs(toOklch(value).l - l);
    if (d < distance) {
      distance = d;
      best = Number(step) as Step;
    }
  }
  return best;
}

export function primitiveHex(primitives: Primitives, ref: string): string | undefined {
  if (ref === "white") return WHITE;
  const [scale, step] = ref.split(".") as [keyof Primitives, string];
  return primitives[scale]?.[Number(step) as Step];
}
