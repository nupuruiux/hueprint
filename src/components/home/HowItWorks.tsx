// Three steps, each with a tiny visual made from real UI pieces.
const STEPS = [
  { title: "Pick", body: "A painting from the gallery, or any image of your own." },
  { title: "Choose a direction", body: "Faithful, Soft or Bold. Every option already passes WCAG AA." },
  { title: "Export", body: "CSS variables, Tailwind or design tokens for Figma. Free, no sign-up." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-8">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <h2 id="how-title" className="font-display text-5xl leading-none sm:text-6xl">
          How it <span className="italic">works</span>
        </h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="rounded-xl border border-line bg-paper p-6">
              <span aria-hidden className="block h-24 rounded-md bg-paper-deep p-4">
                <StepVisual index={i} />
              </span>
              <p className="mt-5 font-display text-lg text-ink-muted">{["I", "II", "III"][i]}</p>
              <h3 className="text-xl font-bold tracking-tight">{step.title}</h3>
              <p className="mt-1 text-ink-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function StepVisual({ index }: { index: number }) {
  if (index === 0) {
    // A tiny gallery of swatch "paintings".
    return (
      <span className="flex h-full items-end gap-2">
        {["#7a6232", "#507b9c", "#ad412e", "#c6b08f"].map((c, i) => (
          <span key={c} className="flex-1 rounded-sm ring-1 ring-ink/10" style={{ background: c, height: `${[70, 100, 55, 85][i]}%` }} />
        ))}
      </span>
    );
  }
  if (index === 1) {
    // Three option chips, the first selected.
    return (
      <span className="flex h-full items-center gap-2">
        {["Faithful", "Soft", "Bold"].map((label, i) => (
          <span key={label} className={`rounded-full border px-3 py-1 text-xs font-semibold ${i === 0 ? "border-ink bg-ink text-paper" : "border-ink-muted/40"}`}>
            {label}
          </span>
        ))}
      </span>
    );
  }
  // A snippet of exported CSS.
  return (
    <span className="block h-full overflow-hidden rounded-sm bg-night p-2 font-mono text-[10px] leading-relaxed text-paper/90">
      :root {"{"}
      <br />
      &nbsp;&nbsp;--color-primary: #507b9c;
      <br />
      &nbsp;&nbsp;--color-text: #1d2023;
      <br />
      {"}"}
    </span>
  );
}
