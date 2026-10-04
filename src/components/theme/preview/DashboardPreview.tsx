// A sample SaaS dashboard, coloured only with the theme's --t-* variables.
// Buttons are type="button" and there are no links, so nothing navigates.
// tabIndex={-1} keeps keyboard users from tabbing through fake controls;
// mouse users can still hover and click to see hover / pressed / focus colours.

const NAV = ["Overview", "Invoices", "Customers", "Reports", "Settings"];
const KPIS = [
  { label: "Revenue", value: "$48,210", delta: "+12.4%", up: true },
  { label: "Paid invoices", value: "312", delta: "+8.1%", up: true },
  { label: "Avg. days to pay", value: "9.6", delta: "−1.2", up: true },
  { label: "Overdue", value: "$3,940", delta: "+2.3%", up: false },
];
const ROWS = [
  { id: "INV-1042", customer: "Atelier Monet", amount: "$1,240.00", status: "Paid" },
  { id: "INV-1041", customer: "Gold Chain Co.", amount: "$860.00", status: "Pending" },
  { id: "INV-1040", customer: "Water Lily Studio", amount: "$2,115.50", status: "Overdue" },
  { id: "INV-1039", customer: "Grande Jatte Ltd", amount: "$540.00", status: "Paid" },
] as const;
const STATUS = { Paid: "success", Pending: "warning", Overdue: "danger" } as const;

// Two series for the chart (revenue and expenses), 0–100 scale.
const REVENUE = [32, 40, 36, 52, 48, 61, 58, 70, 66, 78, 74, 88];
const EXPENSES = [20, 24, 30, 28, 34, 33, 38, 36, 42, 40, 45, 47];

export function DashboardPreview() {
  return (
    <div className="flex min-h-[560px] overflow-hidden rounded-lg border border-(--t-border) bg-(--t-background) text-sm text-(--t-text)">
      {/* Sidebar with an active item */}
      <aside className="flex w-48 shrink-0 flex-col gap-1 border-r border-(--t-border) bg-(--t-surface) p-3">
        <div className="mb-4 flex items-center gap-2 px-2 pt-1">
          <span className="h-6 w-6 rounded-md bg-(--t-primary)" />
          <span className="font-semibold">Ledgerly</span>
        </div>
        {NAV.map((item, i) => (
          <button
            key={item}
            type="button"
            tabIndex={-1}
            className={`rounded-md px-3 py-2 text-left font-medium ${
              i === 1 ? "bg-(--t-primary) text-(--t-on-primary)" : "text-(--t-text-muted) hover:bg-(--t-background) hover:text-(--t-text)"
            }`}
          >
            {item}
          </button>
        ))}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar with search and actions */}
        <header className="flex items-center gap-3 border-b border-(--t-border) bg-(--t-surface) px-5 py-3">
          <input
            tabIndex={-1}
            placeholder="Search invoices…"
            className="w-64 rounded-md border border-(--t-border) bg-(--t-surface-raised) px-3 py-1.5 text-(--t-text) outline-none placeholder:text-(--t-text-muted) focus:border-(--t-focus-ring) focus:ring-2 focus:ring-(--t-focus-ring)"
          />
          <span className="ml-auto flex items-center gap-2">
            <button type="button" tabIndex={-1} disabled className="rounded-md bg-(--t-primary-disabled) px-3 py-1.5 font-semibold text-(--t-on-primary) opacity-80">
              Archived
            </button>
            <button type="button" tabIndex={-1} className="rounded-md border border-(--t-border) bg-(--t-surface-raised) px-3 py-1.5 font-semibold text-(--t-text) hover:bg-(--t-background)">
              Export
            </button>
            <button type="button" tabIndex={-1} className="rounded-md bg-(--t-primary) px-3 py-1.5 font-semibold text-(--t-on-primary) hover:bg-(--t-primary-hover) active:bg-(--t-primary-pressed)">
              New invoice
            </button>
          </span>
        </header>

        <main className="space-y-4 p-5">
          <h3 className="text-lg font-semibold">Invoices</h3>

          {/* KPI cards */}
          <div className="grid grid-cols-4 gap-3">
            {KPIS.map((k) => (
              <div key={k.label} className="rounded-lg border border-(--t-border) bg-(--t-surface) p-3">
                <p className="text-xs text-(--t-text-muted)">{k.label}</p>
                <p className="mt-1 text-xl font-semibold">{k.value}</p>
                <p className={`mt-1 text-xs font-semibold ${k.up ? "text-(--t-success)" : "text-(--t-danger)"}`}>{k.delta} vs last month</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[1.6fr_1fr] gap-3">
            <Chart />

            {/* Form input with a visible focus state (shown statically, so it's always visible) */}
            <div className="rounded-lg border border-(--t-border) bg-(--t-surface) p-3">
              <p className="font-semibold">Quick note</p>
              <label className="mt-3 block text-xs text-(--t-text-muted)">Customer</label>
              <input tabIndex={-1} defaultValue="Atelier Monet" className="mt-1 w-full rounded-md border border-(--t-border) bg-(--t-surface-raised) px-3 py-1.5 text-(--t-text) outline-none" />
              <label className="mt-3 block text-xs text-(--t-text-muted)">Note (focused)</label>
              <input tabIndex={-1} defaultValue="Thanks for the quick payment!" className="mt-1 w-full rounded-md border border-(--t-focus-ring) bg-(--t-surface-raised) px-3 py-1.5 text-(--t-text) outline-none ring-2 ring-(--t-focus-ring) ring-offset-2 ring-offset-(--t-surface)" />
              <p className="mt-2 text-xs text-(--t-danger)">Due date is in the past.</p>
            </div>
          </div>

          {/* Data table with status badges */}
          <div className="overflow-hidden rounded-lg border border-(--t-border) bg-(--t-surface)">
            <table className="w-full text-left">
              <thead className="text-xs text-(--t-text-muted)">
                <tr className="border-b border-(--t-border)">
                  <th className="px-4 py-2 font-medium">Invoice</th>
                  <th className="px-4 py-2 font-medium">Customer</th>
                  <th className="px-4 py-2 font-medium">Amount</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.id} className="border-b border-(--t-border) last:border-0">
                    <td className="px-4 py-2 font-mono text-xs">{r.id}</td>
                    <td className="px-4 py-2">{r.customer}</td>
                    <td className="px-4 py-2">{r.amount}</td>
                    <td className="px-4 py-2">
                      <Badge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}

export function Badge({ status }: { status: keyof typeof STATUS }) {
  const role = STATUS[status];
  // Status text sits straight on the surface (that's the pair checked for AA),
  // with a border in the same colour. Text, not colour alone, carries the meaning.
  const color = { success: "text-(--t-success) border-(--t-success)", warning: "text-(--t-warning) border-(--t-warning)", danger: "text-(--t-danger) border-(--t-danger)" }[role];
  return <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${color}`}>{status}</span>;
}

function Chart() {
  const w = 520;
  const h = 170;
  const x = (i: number) => (i / (REVENUE.length - 1)) * w;
  const y = (v: number) => h - (v / 100) * h;
  const line = (data: number[]) => data.map((v, i) => `${i ? "L" : "M"} ${x(i)} ${y(v)}`).join(" ");

  return (
    <div className="rounded-lg border border-(--t-border) bg-(--t-surface) p-3">
      <div className="flex items-baseline justify-between">
        <p className="font-semibold">Revenue vs expenses</p>
        <p className="flex gap-3 text-xs text-(--t-text-muted)">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-(--t-primary)" />Revenue</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-(--t-accent)" />Expenses</span>
        </p>
      </div>
      <svg viewBox={`0 -10 ${w} ${h + 30}`} className="mt-2 w-full">
        {[0, 25, 50, 75, 100].map((v) => (
          <line key={v} x1={0} x2={w} y1={y(v)} y2={y(v)} className="stroke-(--t-border)" strokeWidth={1} strokeDasharray={v ? "3 4" : undefined} />
        ))}
        <path d={`${line(REVENUE)} L ${w} ${h} L 0 ${h} Z`} className="fill-(--t-primary)" opacity={0.12} />
        <path d={line(REVENUE)} fill="none" className="stroke-(--t-primary)" strokeWidth={2.5} strokeLinejoin="round" />
        <path d={line(EXPENSES)} fill="none" className="stroke-(--t-accent)" strokeWidth={2} strokeDasharray="6 4" strokeLinejoin="round" />
        <circle cx={x(11)} cy={y(88)} r={4.5} className="fill-(--t-primary) stroke-(--t-surface)" strokeWidth={2} />
        {["Jan", "Mar", "May", "Jul", "Sep", "Nov"].map((m, i) => (
          <text key={m} x={x(i * 2)} y={h + 18} className="fill-(--t-text-muted)" fontSize={11} textAnchor={i === 0 ? "start" : "middle"}>
            {m}
          </text>
        ))}
      </svg>
    </div>
  );
}
