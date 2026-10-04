import { describe, expect, it } from "vitest";
import { checkFile, displayName } from "./upload";

describe("checkFile", () => {
  it("accepts JPG, PNG and WebP up to 10 MB", () => {
    expect(checkFile({ name: "a.jpg", type: "image/jpeg", size: 1000 })).toBeNull();
    expect(checkFile({ name: "a.png", type: "image/png", size: 10 * 1024 * 1024 })).toBeNull();
    expect(checkFile({ name: "a.webp", type: "image/webp", size: 5 })).toBeNull();
  });

  it("explains unsupported formats, naming the extension", () => {
    expect(checkFile({ name: "scan.HEIC", type: "image/heic", size: 1000 })).toBe("That's a HEIC file. Hueprint reads JPG, PNG and WebP images.");
    expect(checkFile({ name: "notes.pdf", type: "application/pdf", size: 1000 })).toMatch(/^That's a PDF file/);
  });

  it("explains files over 10 MB with their size", () => {
    expect(checkFile({ name: "big.png", type: "image/png", size: 14.2 * 1024 * 1024 })).toBe(
      "That image is 14.2 MB and the limit is 10 MB. Try a smaller export or a screenshot.",
    );
  });
});

describe("displayName", () => {
  it("drops the extension", () => {
    expect(displayName("My Painting_final.v2.png")).toBe("My Painting_final.v2");
  });

  it("gives pasted images (named 'image.png') a friendlier name", () => {
    expect(displayName("image.png")).toBe("Your image");
    expect(displayName(".png")).toBe("Your image");
  });
});
