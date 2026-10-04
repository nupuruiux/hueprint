"use client";

import { useState } from "react";
import { describeFix, STEPS, type Mode, type Role, type Swatch, type Theme } from "@/lib/theme";
import { ModeToggle } from "./ModeToggle";
import { RoleRow } from "./RoleRow";

const GROUPS: { title: string; roles: Role[] }[] = [
  { title: "Surfaces", roles: ["background", "surface", "surface-raised", "border"] },
  { title: "Text", roles: ["text", "text-muted"] },
  { title: "Brand", roles: ["primary", "primary-hover", "primary-pressed", "primary-disabled", "on-primary", "secondary", "accent", "focus-ring"] },
  { title: "Status", roles: ["success", "warning", "danger"] },
];

type Props = {
  theme: Theme;
  mode: Mode;
  swatches: Swatch[];
  locks: Partial<Record<Role, string>>;
  onModeChange: (mode: Mode) => void;
  onLock: (role: Role, hex: string | null) => void;
  onResetLocks: () => void;
};

export function TokenPanel({ theme, mode, swatches, locks, onModeChange, onLock, onResetLocks }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const tokens = theme[mode];
  const fixes = theme.fixes.filter((f) => f.mode === mode);
  const lockCount = Object.keys(locks).length;

  async function copy(hex: string) {
    await navigator.clipboard?.writeText(hex);
    setCopied(hex);
    setTimeout(() => setCopied((c) => (c === hex ? null : c)), 1400);
  }

  return (
    <section aria-labelledby="tokens-title">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
        <div>
          <h2 id="tokens-title" className="font-display text-4xl sm:text-5xl">
            The <span className="italic">tokens</span>
          </h2>
          <p className="mt-2 text-ink-muted">
            Click a hex to copy it. Lock a colour to keep it; everything else regenerates around it.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lockCount > 0 && (
            <button type="button" onClick={onResetLocks} className="text-sm font-medium text-rosewood underline underline-offset-4">
              Unlock all ({lockCount})
            </button>
          )}
          <ModeToggle mode={mode} onChange={onModeChange} />
        </div>
      </div>

      {/* Copy feedback for screen readers. */}
      <p aria-live="polite" className="sr-only">{copied ? `Copied ${copied}` : ""}</p>

      <Notes theme={theme} fixes={fixes.map(describeFix)} />

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-10">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-muted">{group.title}</h3>
              <ul className="mt-2 divide-y divide-line border-y border-line">
                {group.roles.map((role) => (
                  <RoleRow
                    key={role}
                    role={role}
                    tokens={tokens}
                    swatches={swatches}
                    locked={role in locks}
                    copied={copied === tokens[role].hex}
                    onCopy={copy}
                    onLock={onLock}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Primitives theme={theme} copied={copied} onCopy={copy} />
      </div>
    </section>
  );
}

// "What we fixed", the monochrome note, and lock conflicts.
function Notes({ theme, fixes }: { theme: Theme; fixes: string[] }) {
  return (
    <div className="mt-6 space-y-3">
      {theme.monochrome && (
        <p className="rounded-md bg-paper-deep px-4 py-3 text-sm">
          This one&apos;s mostly monochrome, so we leaned on a single accent.
        </p>
      )}
      {theme.warnings.map((w) => (
        <p key={w} className="rounded-md border border-rosewood px-4 py-3 text-sm">
          <strong className="font-semibold text-rosewood">Can&apos;t pass: </strong>
          {w}. Unlock or swap the locked colour to fix it.
        </p>
      ))}
      <details className="group rounded-md border border-line px-4 py-3" open={fixes.length > 0 && fixes.length <= 3}>
        <summary className="cursor-pointer text-sm font-semibold">
          What we fixed <span className="font-normal text-ink-muted">({fixes.length ? `${fixes.length} ${fixes.length === 1 ? "colour" : "colours"}` : "nothing"})</span>
        </summary>
        {fixes.length ? (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-muted">
            {fixes.map((f) => <li key={f}>{f}</li>)}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-ink-muted">The painting&apos;s colours passed as they were.</p>
        )}
      </details>
    </div>
  );
}

// The raw colour scales the semantic roles point to.
function Primitives({ theme, copied, onCopy }: { theme: Theme; copied: string | null; onCopy: (hex: string) => void }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-muted">Primitives</h3>
      <div className="mt-3 space-y-5">
        {(Object.keys(theme.primitives) as (keyof Theme["primitives"])[]).map((name) => (
          <div key={name}>
            <p className="text-sm font-semibold capitalize">{name}</p>
            <ul className="mt-1.5 grid grid-cols-11 overflow-hidden rounded-sm ring-1 ring-ink/10">
              {STEPS.map((step) => {
                const hex = theme.primitives[name][step];
                return (
                  <li key={step}>
                    <button
                      type="button"
                      onClick={() => onCopy(hex)}
                      title={`${name}.${step} ${hex}`}
                      aria-label={`Copy ${name} ${step}, ${hex}`}
                      className="block h-10 w-full transition-transform hover:scale-y-110 focus-visible:relative focus-visible:z-10"
                      style={{ background: hex }}
                    />
                  </li>
                );
              })}
            </ul>
            <p className="mt-1 flex justify-between font-mono text-[10px] text-ink-muted">
              <span>50</span>
              <span>{copied && Object.values(theme.primitives[name]).includes(copied) ? `Copied ${copied}` : "500"}</span>
              <span>950</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
