import type { Mode } from "@/lib/theme";

// Light / Dark switch. Used by both the preview and the token list; they
// share one setting (?mode= in the URL).
export function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (mode: Mode) => void }) {
  return (
    <div role="group" aria-label="Colour mode" className="flex rounded-full border border-ink-muted/50 p-1">
      {(["light", "dark"] as const).map((m) => (
        <button
          key={m}
          type="button"
          aria-pressed={mode === m}
          onClick={() => onChange(m)}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition-colors ${mode === m ? "bg-ink text-paper" : "text-ink hover:bg-paper-deep"}`}
        >
          {m}
        </button>
      ))}
    </div>
  );
}
