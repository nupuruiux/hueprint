// Theme page state lives in the URL, so any result can be shared as a link:
//   /theme/95998?v=soft&mode=dark&lock=primary_c0392b.text-muted_6e636a&dlock=text_f0eeec
// v      direction (faithful is the default and is left out)
// mode   which mode the token list shows (light is the default)
// lock   roles locked in light mode, as role_hex pairs joined by "."
// dlock  the same for dark mode
// "_" and "." are used because URLs keep them as they are, so links stay readable.
import { ROLES, type Locks, type Mode, type Role, type Strategy } from "@/lib/theme";

export type ThemeState = { strategy: Strategy; mode: Mode; locks: Locks };

const STRATEGIES: Strategy[] = ["faithful", "soft", "bold"];
const HEX = /^[0-9a-f]{6}$/i;

export function parseThemeState(params: URLSearchParams): ThemeState {
  const v = params.get("v");
  return {
    strategy: STRATEGIES.includes(v as Strategy) ? (v as Strategy) : "faithful",
    mode: params.get("mode") === "dark" ? "dark" : "light",
    locks: { light: parseLocks(params.get("lock")), dark: parseLocks(params.get("dlock")) },
  };
}

// Writes the state into a copy of `params`, leaving out defaults so links stay short.
export function serializeThemeState(state: ThemeState, params = new URLSearchParams()): URLSearchParams {
  const next = new URLSearchParams(params);
  const set = (key: string, value: string | null) => (value ? next.set(key, value) : next.delete(key));
  set("v", state.strategy === "faithful" ? null : state.strategy);
  set("mode", state.mode === "light" ? null : state.mode);
  set("lock", formatLocks(state.locks.light));
  set("dlock", formatLocks(state.locks.dark));
  return next;
}

// Anything malformed (unknown role, bad hex) is skipped, so a mangled link
// still opens a working theme.
function parseLocks(value: string | null): Partial<Record<Role, string>> {
  const locks: Partial<Record<Role, string>> = {};
  for (const entry of value?.split(".") ?? []) {
    const [role, hex] = entry.split("_");
    if (ROLES.includes(role as Role) && HEX.test(hex ?? "")) locks[role as Role] = `#${hex.toLowerCase()}`;
  }
  return locks;
}

function formatLocks(locks: Partial<Record<Role, string>> | undefined): string | null {
  const entries = Object.entries(locks ?? {}).map(([role, hex]) => `${role}_${hex.replace("#", "")}`);
  return entries.length ? entries.join(".") : null;
}
