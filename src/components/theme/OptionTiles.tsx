import type { Mode, ModeTokens, Strategy, Theme } from "@/lib/theme";

const COPY: Record<Strategy, { name: string; blurb: string }> = {
  faithful: { name: "Faithful", blurb: "As close to the painting as possible, contrast-fixed." },
  soft: { name: "Soft", blurb: "Lower chroma, airy surfaces. Calm." },
  bold: { name: "Bold", blurb: "The most saturated colour, darker surfaces, AAA text." },
};

type Props = {
  options: Record<Strategy, Theme>;
  selected: Strategy;
  mode: Mode;
  onSelect: (strategy: Strategy) => void;
};

// Three directions as a radio group: arrow keys move between them, and the
// choice is announced. Faithful is the default (fewer choices, faster pick).
export function OptionTiles({ options, selected, mode, onSelect }: Props) {
  return (
    <fieldset>
      <legend className="font-display text-3xl sm:text-4xl">
        Choose a <span className="italic">direction</span>
      </legend>
      <p className="mt-2 text-ink-muted">Every option passes WCAG AA. Pick the mood; everything below updates.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {(Object.keys(COPY) as Strategy[]).map((strategy) => {
          const tokens = options[strategy][mode];
          const isSelected = strategy === selected;
          return (
            <label key={strategy} className="group relative block cursor-pointer">
              <input
                type="radio"
                name="direction"
                value={strategy}
                checked={isSelected}
                onChange={() => onSelect(strategy)}
                className="peer sr-only"
              />
              <span
                className={`flex h-full flex-col rounded-md border bg-paper p-4 transition peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-rosewood ${
                  isSelected ? "border-ink shadow-[0_0_0_1px_var(--color-ink)]" : "border-line hover:border-ink-muted"
                }`}
              >
                <span className="flex items-baseline justify-between">
                  <span className="font-display text-2xl italic">{COPY[strategy].name}</span>
                  {isSelected && <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-paper">Selected</span>}
                </span>
                <span className="mt-1 text-sm text-pretty text-ink-muted">{COPY[strategy].blurb}</span>

                <span aria-hidden className="mt-4 flex h-6 overflow-hidden rounded-sm ring-1 ring-ink/10">
                  {(["primary", "secondary", "accent", "surface", "text"] as const).map((role) => (
                    <span key={role} className="flex-1" style={{ background: tokens[role].hex }} />
                  ))}
                </span>
                <MiniPreview tokens={tokens} />
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

// A tiny card + button in the option's own colours.
function MiniPreview({ tokens }: { tokens: ModeTokens }) {
  return (
    <span aria-hidden className="mt-3 block rounded-sm p-3" style={{ background: tokens.background.hex }}>
      <span className="block rounded-sm p-3" style={{ background: tokens.surface.hex, border: `1px solid ${tokens.border.hex}` }}>
        <span className="block text-sm font-semibold" style={{ color: tokens.text.hex }}>Monthly report</span>
        <span className="block text-xs" style={{ color: tokens["text-muted"].hex }}>Updated 2 min ago</span>
        <span className="mt-3 flex items-center gap-2">
          <span className="rounded px-2.5 py-1 text-xs font-semibold" style={{ background: tokens.primary.hex, color: tokens["on-primary"].hex }}>
            Export
          </span>
          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ color: tokens.success.hex, border: `1px solid ${tokens.success.hex}` }}>
            Paid
          </span>
        </span>
      </span>
    </span>
  );
}
