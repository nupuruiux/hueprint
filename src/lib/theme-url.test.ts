import { describe, expect, it } from "vitest";
import { parseThemeState, serializeThemeState } from "./theme-url";

describe("theme URL state", () => {
  it("defaults to Faithful, light mode, nothing locked", () => {
    expect(parseThemeState(new URLSearchParams())).toEqual({ strategy: "faithful", mode: "light", locks: { light: {}, dark: {} } });
  });

  it("reads direction, mode and locks for both modes", () => {
    const state = parseThemeState(new URLSearchParams("v=soft&mode=dark&lock=primary_C0392B.text-muted_6e636a&dlock=text_f0eeec"));
    expect(state).toEqual({
      strategy: "soft",
      mode: "dark",
      locks: { light: { primary: "#c0392b", "text-muted": "#6e636a" }, dark: { text: "#f0eeec" } },
    });
  });

  it("skips anything malformed instead of breaking", () => {
    const state = parseThemeState(new URLSearchParams("v=loud&mode=sepia&lock=primary_zzz.nope_123456.text_abcdef"));
    expect(state).toEqual({ strategy: "faithful", mode: "light", locks: { light: { text: "#abcdef" }, dark: {} } });
  });

  it("round-trips, and leaves defaults out of the link", () => {
    const state = parseThemeState(new URLSearchParams("v=bold&lock=accent_112233"));
    const query = serializeThemeState(state).toString();
    expect(query).toBe("v=bold&lock=accent_112233");
    expect(parseThemeState(new URLSearchParams(query))).toEqual(state);
  });

  it("keeps readable separators in the link (no %-encoding)", () => {
    const query = serializeThemeState({ strategy: "faithful", mode: "light", locks: { light: { "text-muted": "#6e636a", primary: "#c0392b" } } }).toString();
    expect(query).toBe("lock=text-muted_6e636a.primary_c0392b");
  });

  it("keeps unrelated params that were already there", () => {
    const query = serializeThemeState({ strategy: "soft", mode: "light", locks: {} }, new URLSearchParams("ref=gallery")).toString();
    expect(query).toBe("ref=gallery&v=soft");
  });
});
