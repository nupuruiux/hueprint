import { Badge } from "./DashboardPreview";

const CARDS = [
  { title: "Atelier Monet", meta: "Due 12 Oct · INV-1042", amount: "$1,240", status: "Paid" },
  { title: "Gold Chain Co.", meta: "Due 18 Oct · INV-1041", amount: "$860", status: "Pending" },
  { title: "Water Lily Studio", meta: "Due 2 Oct · INV-1040", amount: "$2,115", status: "Overdue" },
] as const;

const TABS = ["Home", "Invoices", "Clients", "Profile"];

// A phone screen in the theme. Same rules as the dashboard: --t-* variables
// only, nothing navigates.
export function MobilePreview() {
  return (
    <div className="mx-auto w-[300px] rounded-[2.5rem] border-[10px] border-ink bg-ink shadow-2xl">
      <div className="flex h-[580px] flex-col overflow-hidden rounded-[1.75rem] bg-(--t-background) text-sm text-(--t-text)">
        {/* Header */}
        <div className="flex items-center justify-between bg-(--t-surface) px-4 pb-3 pt-5">
          <div>
            <p className="text-xs text-(--t-text-muted)">Good morning</p>
            <p className="text-base font-semibold">Invoices</p>
          </div>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-(--t-secondary) text-xs font-semibold text-(--t-surface)" aria-hidden />
        </div>

        {/* List of cards */}
        <div className="flex-1 space-y-2.5 overflow-hidden p-3">
          {CARDS.map((c) => (
            <div key={c.title} className="rounded-xl border border-(--t-border) bg-(--t-surface) p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{c.title}</p>
                  <p className="text-xs text-(--t-text-muted)">{c.meta}</p>
                </div>
                <p className="font-semibold">{c.amount}</p>
              </div>
              <div className="mt-2">
                <Badge status={c.status} />
              </div>
            </div>
          ))}
          <button type="button" tabIndex={-1} className="mt-1 w-full rounded-xl bg-(--t-primary) py-3 font-semibold text-(--t-on-primary) hover:bg-(--t-primary-hover) active:bg-(--t-primary-pressed)">
            Pay $2,115 now
          </button>
        </div>

        {/* Bottom tab bar. The active tab's label stays in the text colour
            (primary is only guaranteed 3:1 on surfaces, too low for small text);
            the icon and indicator carry the primary colour. */}
        <nav className="grid grid-cols-4 border-t border-(--t-border) bg-(--t-surface) pb-3 pt-2">
          {TABS.map((tab, i) => (
            <button key={tab} type="button" tabIndex={-1} className="flex flex-col items-center gap-1 text-[11px]">
              <span className={`h-1 w-6 rounded-full ${i === 1 ? "bg-(--t-primary)" : "bg-transparent"}`} />
              <span className={`h-5 w-5 rounded-md ${i === 1 ? "bg-(--t-primary)" : "border-2 border-(--t-text-muted)"}`} />
              <span className={i === 1 ? "font-semibold text-(--t-text)" : "text-(--t-text-muted)"}>{tab}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
