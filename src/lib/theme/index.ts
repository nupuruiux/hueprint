// The theme engine: pure functions, no UI. See docs/BRIEF.md → "Theme generation logic".
// (extractColors lives in ./extract because it needs a browser.)
export * from "./types";
export { contrast, wcagLevel } from "./color";
export { describeSwatches } from "./swatches";
export { buildScale } from "./scales";
export { fixContrast, describeFix, type Pair } from "./contrast";
export { buildTheme, buildOptions, pickPrimary, isMonochrome, requiredPairs } from "./build";
export { toCSS, toTailwind, toDTCG } from "./export";
