import { themeVars, type Mode, type ModeTokens } from "@/lib/theme";
import { ModeToggle } from "../ModeToggle";
import { DashboardPreview } from "./DashboardPreview";
import { MobilePreview } from "./MobilePreview";
import { ScaleToFit } from "./ScaleToFit";

type Props = { tokens: ModeTokens; mode: Mode; onModeChange: (mode: Mode) => void };

// The theme in context: a desktop dashboard and a phone screen. The theme's
// CSS variables are set on this container only, so the site around it never
// changes colour. Each preview is announced as one image with a description.
export function LivePreview({ tokens, mode, onModeChange }: Props) {
  return (
    <section aria-labelledby="preview-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="preview-title" className="font-display text-3xl sm:text-4xl">
            See it <span className="italic">live</span>
          </h2>
          <p className="mt-2 text-ink-muted">Hover and click around: buttons show their hover, pressed and focus colours.</p>
        </div>
        <ModeToggle mode={mode} onChange={onModeChange} />
      </div>

      {/* minmax(0,1fr) + min-w-0 let the column be narrower than the 880px
          dashboard inside it, so ScaleToFit can measure the real space. */}
      <div style={themeVars(tokens)} className="mt-6 grid grid-cols-[minmax(0,1fr)] items-start gap-8 rounded-xl bg-paper-deep p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div role="img" className="min-w-0" aria-label={`Sample invoicing dashboard in this theme, ${mode} mode: sidebar, search, four stat cards, a revenue chart, a form and an invoice table with paid, pending and overdue badges.`}>
          <div aria-hidden>
            <ScaleToFit width={880}>
              <DashboardPreview />
            </ScaleToFit>
          </div>
        </div>
        <div role="img" aria-label={`Sample phone screen in this theme, ${mode} mode: invoice cards, a pay button and a bottom tab bar.`}>
          <div aria-hidden>
            <MobilePreview />
          </div>
        </div>
      </div>
    </section>
  );
}
