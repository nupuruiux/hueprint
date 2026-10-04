import { describe, expect, it } from "vitest";
import paintings from "../../../data/paintings.json";
import { buildTheme } from "./build";
import { toCSS, toDTCG, toTailwind } from "./export";
import { describeSwatches } from "./swatches";
import { ROLES } from "./types";

const theme = buildTheme(describeSwatches(paintings[0].swatches), "faithful");

describe("toCSS", () => {
  const css = toCSS(theme);

  it("has a :root block and a dark block with every role", () => {
    expect(css).toContain(":root {");
    expect(css).toContain('[data-theme="dark"] {');
    for (const role of ROLES) {
      expect(css).toContain(`--color-${role}: ${theme.light[role].hex};`);
      expect(css).toContain(`--color-${role}: ${theme.dark[role].hex};`);
    }
  });

  it("puts the theme name in the header comment", () => {
    expect(toCSS(theme, "Water Lilies")).toMatch(/^\/\* Water Lilies · faithful · made with Hueprint/);
    expect(toTailwind(theme, "Water Lilies")).toContain("// tailwind.config.js · Water Lilies (faithful)");
  });

  it("has balanced braces (valid block structure)", () => {
    expect(css.split("{").length).toBe(css.split("}").length);
  });
});

describe("toTailwind", () => {
  const config = toTailwind(theme);

  it("is runnable JavaScript that maps every role to its CSS variable", () => {
    // Run the snippet with a stand-in for Node's `module` object.
    const fakeModule = { exports: {} as { theme: { extend: { colors: Record<string, string> } } } };
    new Function("module", config)(fakeModule);
    const colors = fakeModule.exports.theme.extend.colors;
    expect(Object.keys(colors)).toEqual([...ROLES]);
    for (const role of ROLES) expect(colors[role]).toBe(`var(--color-${role})`);
  });
});

describe("toDTCG", () => {
  const doc = JSON.parse(toDTCG(theme));

  it("is valid JSON with primitives, light and dark token sets", () => {
    expect(Object.keys(doc)).toEqual(["primitives", "light", "dark", "$metadata"]);
    expect(doc.$metadata.tokenSetOrder).toEqual(["primitives", "light", "dark"]);
  });

  it("types every token as a colour", () => {
    for (const set of ["light", "dark"]) {
      for (const role of ROLES) expect(doc[set][role].$type).toBe("color");
    }
    expect(doc.primitives.neutral["500"]).toEqual({ $type: "color", $value: theme.primitives.neutral[500] });
  });

  it("uses references for untouched tokens, and every reference resolves", () => {
    for (const set of ["light", "dark"] as const) {
      for (const role of ROLES) {
        const value: string = doc[set][role].$value;
        const token = theme[set][role];
        if (value.startsWith("{")) {
          const [scale, step] = value.slice(1, -1).split(".");
          expect(doc.primitives[scale][step].$value).toBe(token.hex);
        } else {
          expect(value).toBe(token.hex);
        }
      }
    }
  });

  it("writes adjusted tokens as plain hex, not references", () => {
    for (const set of ["light", "dark"] as const) {
      for (const role of ROLES) {
        if (theme[set][role].adjusted) expect(doc[set][role].$value).toBe(theme[set][role].hex);
      }
    }
  });
});
