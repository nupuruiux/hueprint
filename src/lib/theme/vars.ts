import { ROLES, type ModeTokens } from "./types";

// A theme as CSS variables (--t-primary, --t-surface…), to set on a preview
// container. Only elements inside it see these, so the site's own colours
// never change. The --t- prefix keeps them apart from the site's --color-*.
export function themeVars(tokens: ModeTokens): Record<string, string> {
  return Object.fromEntries(ROLES.map((role) => [`--t-${role}`, tokens[role].hex]));
}
