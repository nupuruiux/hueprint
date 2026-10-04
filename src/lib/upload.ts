// Upload rules, kept separate from the UI so they can be tested.

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

// Returns a friendly error message, or null if the file is fine.
export function checkFile(file: { name: string; type: string; size: number }): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    const ext = file.name.includes(".") ? file.name.split(".").pop()!.toUpperCase() : "this kind of";
    return `That's a ${ext} file. Hueprint reads JPG, PNG and WebP images.`;
  }
  if (file.size > MAX_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return `That image is ${mb} MB and the limit is 10 MB. Try a smaller export or a screenshot.`;
  }
  return null;
}

// "My Painting_final.v2.png" → "My Painting_final.v2"; pasted images get a friendlier name.
export function displayName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "").trim();
  return !base || base === "image" ? "Your image" : base;
}
