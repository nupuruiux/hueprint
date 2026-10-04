// Shared types for the theme engine.

export type Strategy = "faithful" | "soft" | "bold";
export type Mode = "light" | "dark";

// A colour pulled from an image, with its OKLCH values and how much of the image it covers.
export type Swatch = {
  hex: string;
  population: number;
  coverage: number; // 0–1, share of the image
  l: number; // OKLCH lightness 0–1
  c: number; // OKLCH chroma (colourfulness), ~0–0.37
  h: number; // OKLCH hue angle 0–360
};

export const ROLES = [
  "background",
  "surface",
  "surface-raised",
  "border",
  "text",
  "text-muted",
  "primary",
  "primary-hover",
  "primary-pressed",
  "primary-disabled",
  "on-primary",
  "secondary",
  "accent",
  "success",
  "warning",
  "danger",
  "focus-ring",
] as const;
export type Role = (typeof ROLES)[number];

export const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
export type Step = (typeof STEPS)[number];
export type Scale = Record<Step, string>;

export type Primitives = {
  primary: Scale;
  secondary: Scale;
  accent: Scale;
  neutral: Scale;
};

export type Token = {
  hex: string;
  ref: string | null; // the primitive it comes from, e.g. "neutral.900"
  adjusted: boolean; // true if the contrast fixer moved it off that primitive
};

export type ModeTokens = Record<Role, Token>;

// One change made by the contrast fixer, for the "What we fixed" note.
export type Fix = {
  mode: Mode;
  role: Role;
  from: string;
  to: string;
  against: Role;
  ratio: number; // contrast after the fix
  target: number; // 3, 4.5 or 7
};

export type Theme = {
  strategy: Strategy;
  monochrome: boolean;
  primitives: Primitives;
  light: ModeTokens;
  dark: ModeTokens;
  fixes: Fix[];
  warnings: string[]; // pairs that couldn't pass because both colours are locked
};

// Locked roles keep their colour; everything else regenerates around them.
export type Locks = Partial<Record<Mode, Partial<Record<Role, string>>>>;
