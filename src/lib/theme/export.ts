// Export formats: CSS variables, a Tailwind config snippet, and W3C Design
// Tokens (DTCG) JSON, which Tokens Studio can import into Figma.
import { ROLES, STEPS, type ModeTokens, type Theme } from "./types";

export function toCSS(theme: Theme): string {
  const block = (selector: string, tokens: ModeTokens) =>
    `${selector} {\n${ROLES.map((role) => `  --color-${role}: ${tokens[role].hex};`).join("\n")}\n}`;
  return [
    `/* Hueprint theme · ${theme.strategy}. Every text pair passes WCAG AA. */`,
    block(":root", theme.light),
    block('[data-theme="dark"]', theme.dark),
  ].join("\n\n") + "\n";
}

// Colours point at the CSS variables, so light/dark switching keeps working.
export function toTailwind(theme: Theme): string {
  const colors = ROLES.map((role) => `        "${role}": "var(--color-${role})",`).join("\n");
  return `// tailwind.config.js · Hueprint theme (${theme.strategy}).
// Use together with the CSS variables export.
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
${colors}
      },
    },
  },
};
`;
}

type DtcgToken = { $type: "color"; $value: string };

// Three token sets: primitives, light and dark. Semantic tokens that still
// equal their primitive are written as references like "{neutral.100}";
// ones the contrast fixer adjusted are written as plain hex.
export function toDTCG(theme: Theme): string {
  const color = (value: string): DtcgToken => ({ $type: "color", $value: value });

  const primitives: Record<string, Record<string, DtcgToken>> = {};
  for (const [name, scale] of Object.entries(theme.primitives)) {
    primitives[name] = Object.fromEntries(STEPS.map((step) => [String(step), color(scale[step])]));
  }

  const semantic = (tokens: ModeTokens) =>
    Object.fromEntries(
      ROLES.map((role) => {
        const { hex, ref, adjusted } = tokens[role];
        const useRef = ref !== null && ref !== "white" && !adjusted;
        return [role, color(useRef ? `{${ref}}` : hex)];
      }),
    );

  const doc = {
    primitives,
    light: semantic(theme.light),
    dark: semantic(theme.dark),
    $metadata: { tokenSetOrder: ["primitives", "light", "dark"] },
  };
  return JSON.stringify(doc, null, 2) + "\n";
}
