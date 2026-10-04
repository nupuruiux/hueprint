"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { toCSS, toDTCG, toTailwind, type Strategy, type Theme } from "@/lib/theme";
import { slugify } from "@/lib/paintings";

const FORMATS = [
  { id: "css", label: "CSS variables", ext: "css", type: "text/css", hint: "Paste into your global stylesheet. Set data-theme=\"dark\" on <html> for dark mode." },
  { id: "tailwind", label: "Tailwind", ext: "tailwind.js", type: "text/javascript", hint: "Merge into tailwind.config.js. Uses the CSS variables, so add those too." },
  { id: "json", label: "JSON tokens", ext: "tokens.json", type: "application/json", hint: "W3C Design Tokens format. Import into Figma with the Tokens Studio plugin." },
] as const;
type FormatId = (typeof FORMATS)[number]["id"];

const STRATEGY_NAMES: Record<Strategy, string> = { faithful: "Faithful", soft: "Soft", bold: "Bold" };

type Props = { theme: Theme; defaultName: string; visible: boolean };

// Sticky bar + export dialog. No sign-in, no gate: export is free and immediate.
export function ExportPanel({ theme, defaultName, visible }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(defaultName);
  const [format, setFormat] = useState<FormatId>("css");
  const [status, setStatus] = useState("");
  const [open, setOpen] = useState(false);

  const label = name.trim() || defaultName;
  const code = { css: toCSS(theme, label), tailwind: toTailwind(theme, label), json: toDTCG(theme) }[format];
  const current = FORMATS.find((f) => f.id === format)!;

  function announce(message: string) {
    setStatus(message);
    setTimeout(() => setStatus((s) => (s === message ? "" : s)), 1600);
  }

  async function copy(text: string, what: string) {
    await navigator.clipboard?.writeText(text);
    announce(`${what} copied`);
  }

  // Makes a file in the browser and clicks a temporary link to save it.
  function download() {
    const url = URL.createObjectURL(new Blob([code], { type: current.type }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slugify(label)}-${theme.strategy}.${current.ext}`;
    a.click();
    URL.revokeObjectURL(url);
    announce(`Downloaded ${a.download}`);
  }

  // Tabs: arrow keys move between them (standard tab pattern).
  function onTabKey(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const i = FORMATS.findIndex((f) => f.id === format);
    const next = FORMATS[(i + (e.key === "ArrowRight" ? 1 : FORMATS.length - 1)) % FORMATS.length];
    setFormat(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  }

  return (
    <>
      {/* Sticky bar: slides up once you've scrolled past the direction tiles. */}
      <div
        // Hidden = moved below the screen edge AND invisible, so it can never show
        // by accident. Visibility switches at the end of the slide-out.
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-ink bg-ink text-paper transition-[translate,visibility] duration-300 ${visible ? "visible translate-y-0" : "invisible translate-y-full"}`}
        aria-hidden={!visible}
        inert={!visible}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <p className="min-w-0 flex-1 truncate text-sm">
            <span className="font-semibold">{label}</span>
            <span className="text-paper/70"> · {STRATEGY_NAMES[theme.strategy]}</span>
          </p>
          <button type="button" onClick={() => copy(window.location.href, "Share link")} className="hidden rounded-full border border-paper/40 px-4 py-2 text-sm font-semibold hover:border-paper sm:block">
            Copy share link
          </button>
          <button type="button" onClick={() => {
              dialog.current?.showModal();
              setOpen(true);
            }} className="rounded-full bg-paper px-4 py-2 text-sm font-semibold text-ink transition-transform hover:-translate-y-px">
            Export theme
          </button>
        </div>
      </div>

      {/* Native dialog: traps focus, closes on Escape, returns focus afterwards. */}
      <dialog
        ref={dialog}
        aria-labelledby="export-title"
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
        className="m-auto w-[min(56rem,calc(100vw-2rem))] rounded-lg bg-paper p-0 text-ink shadow-2xl backdrop:bg-night/60"
      >
        <div className="flex max-h-[85vh] flex-col p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="export-title" className="font-display text-3xl">
                Export <span className="italic">theme</span>
              </h2>
              <p className="text-sm text-ink-muted">{STRATEGY_NAMES[theme.strategy]} · light and dark · every text pair passes AA</p>
            </div>
            <button type="button" onClick={() => dialog.current?.close()} aria-label="Close" className="rounded-md p-2 text-ink-muted hover:bg-paper-deep hover:text-ink">
              ✕
            </button>
          </div>

          <label className="mt-5 block text-xs font-semibold uppercase tracking-widest text-ink-muted" htmlFor="theme-name">
            Theme name
          </label>
          <input
            id="theme-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full max-w-sm rounded-md border border-ink-muted bg-paper px-3 py-2 text-sm"
          />

          <div role="tablist" aria-label="Format" className="mt-5 flex gap-1 border-b border-line">
            {FORMATS.map((f) => (
              <button
                key={f.id}
                id={`tab-${f.id}`}
                type="button"
                role="tab"
                aria-selected={f.id === format}
                aria-controls="export-code"
                tabIndex={f.id === format ? 0 : -1}
                onClick={() => setFormat(f.id)}
                onKeyDown={onTabKey}
                className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold ${f.id === format ? "border-ink text-ink" : "border-transparent text-ink-muted hover:text-ink"}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div id="export-code" role="tabpanel" aria-labelledby={`tab-${format}`} className="mt-3 flex min-h-0 flex-1 flex-col">
            <p className="text-sm text-ink-muted">{current.hint}</p>
            <pre tabIndex={0} className="mt-3 min-h-0 flex-1 overflow-auto rounded-md bg-night p-4 font-mono text-xs leading-relaxed text-paper">
              <code>{code}</code>
            </pre>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => copy(code, current.label)} className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper">
              Copy {current.label}
            </button>
            <button type="button" onClick={download} className="rounded-full border border-ink px-4 py-2 text-sm font-semibold">
              Download
            </button>
            <button type="button" onClick={() => copy(window.location.href, "Share link")} className="text-sm font-semibold text-rosewood underline underline-offset-4">
              Copy share link
            </button>
            <p aria-live="polite" className="text-sm text-ink-muted">{status}</p>
          </div>
        </div>
      </dialog>

      {/* While the dialog is open the rest of the page is hidden from screen
          readers, so its own status line announces; otherwise this one does. */}
      {!open && <p aria-live="polite" className="sr-only">{status}</p>}
    </>
  );
}
