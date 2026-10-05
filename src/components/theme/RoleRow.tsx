"use client";

import { useEffect, useRef, useState } from "react";
import { contrast, wcagLevel, type ModeTokens, type Role, type Swatch } from "@/lib/theme";

// Which pair each role's contrast badge reports, and the target it must hit.
// Backgrounds show the text that sits on them; buttons show their label.
const BADGES: Partial<Record<Role, { fg: Role; bg: Role; target: number }>> = {
  background: { fg: "text", bg: "background", target: 4.5 },
  surface: { fg: "text", bg: "surface", target: 4.5 },
  "surface-raised": { fg: "text", bg: "surface-raised", target: 4.5 },
  border: { fg: "border", bg: "surface", target: 3 },
  text: { fg: "text", bg: "background", target: 4.5 },
  "text-muted": { fg: "text-muted", bg: "background", target: 4.5 },
  primary: { fg: "on-primary", bg: "primary", target: 4.5 },
  "primary-hover": { fg: "on-primary", bg: "primary-hover", target: 4.5 },
  "primary-pressed": { fg: "on-primary", bg: "primary-pressed", target: 4.5 },
  "on-primary": { fg: "on-primary", bg: "primary", target: 4.5 },
  secondary: { fg: "secondary", bg: "background", target: 3 },
  accent: { fg: "accent", bg: "background", target: 3 },
  success: { fg: "success", bg: "surface", target: 4.5 },
  warning: { fg: "warning", bg: "surface", target: 4.5 },
  danger: { fg: "danger", bg: "surface", target: 4.5 },
  "focus-ring": { fg: "focus-ring", bg: "background", target: 3 },
};

// Roles that are backgrounds get an "Aa" sample of what sits on them.
// (Not primary-disabled: disabled controls are exempt from contrast rules,
// so a text sample there would suggest a readability it doesn't promise.)
const SAMPLE_TEXT: Partial<Record<Role, Role>> = {
  background: "text",
  surface: "text",
  "surface-raised": "text",
  primary: "on-primary",
  "primary-hover": "on-primary",
  "primary-pressed": "on-primary",
};

type Props = {
  role: Role;
  tokens: ModeTokens;
  swatches: Swatch[];
  locked: boolean;
  copied: boolean;
  onCopy: (hex: string) => void;
  onLock: (role: Role, hex: string | null) => void;
};

export function RoleRow({ role, tokens, swatches, locked, copied, onCopy, onLock }: Props) {
  const token = tokens[role];
  const badge = BADGES[role];
  const sample = SAMPLE_TEXT[role];

  return (
    <li className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 py-3 sm:grid-cols-[3rem_minmax(0,1fr)_6.5rem_minmax(0,15rem)_auto]">
      <span
        aria-hidden
        className="flex h-12 w-12 items-center justify-center rounded-md font-display text-lg ring-1 ring-ink/10"
        style={{ background: token.hex, color: sample ? tokens[sample].hex : undefined }}
      >
        {sample ? "Aa" : ""}
      </span>

      <span className="min-w-0">
        <span className="block font-mono text-sm font-semibold">{role}</span>
        <span className="block truncate text-xs text-ink-muted">
          {locked ? "Locked by you" : token.ref ? `→ ${token.ref}${token.adjusted ? " · adjusted for contrast" : ""}` : "Fixed hue, tinted to the painting"}
        </span>
      </span>

      <button
        type="button"
        onClick={() => onCopy(token.hex)}
        aria-label={`Copy ${role}, ${token.hex}`}
        className="col-start-2 w-max rounded px-1.5 py-0.5 text-left font-mono text-sm uppercase hover:bg-paper-deep sm:col-start-auto"
      >
        {copied ? "Copied" : token.hex}
      </button>

      <span className="col-start-2 sm:col-start-auto">
        {badge ? <ContrastBadge tokens={tokens} {...badge} /> : <span className="text-xs text-ink-muted">Disabled: exempt from contrast rules</span>}
      </span>

      <span className="col-start-3 row-span-1 row-start-1 flex items-center gap-1 sm:col-start-auto sm:row-start-auto">
        <button
          type="button"
          aria-pressed={locked}
          aria-label={locked ? `Unlock ${role}` : `Lock ${role}`}
          title={locked ? "Unlock" : "Lock this colour"}
          onClick={() => onLock(role, locked ? null : token.hex)}
          className={`rounded-md p-2 transition-colors ${locked ? "bg-ink text-paper" : "text-ink-muted hover:bg-paper-deep hover:text-ink"}`}
        >
          <LockIcon locked={locked} />
        </button>
        <SwapMenu role={role} current={token.hex} swatches={swatches} onPick={(hex) => onLock(role, hex)} />
      </span>
    </li>
  );
}

// Text first, never colour alone: the ratio and level are spelled out.
function ContrastBadge({ tokens, fg, bg, target }: { tokens: ModeTokens; fg: Role; bg: Role; target: number }) {
  const ratio = contrast(tokens[fg].hex, tokens[bg].hex);
  const passes = ratio >= target;
  const level = target === 3 && passes && ratio < 4.5 ? "AA (UI)" : wcagLevel(ratio);
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 text-xs">
      <span className={`rounded-sm px-1.5 py-0.5 font-semibold ${passes ? "bg-paper-deep text-ink" : "bg-rosewood text-paper"}`}>
        {passes ? "✓" : "✕"} {ratio.toFixed(1)}:1 {level}
      </span>
      <span className="text-ink-muted">
        {fg} on {bg}
      </span>
    </span>
  );
}

// Popover with the painting's other colours. Picking one locks the role to it.
function SwapMenu({ role, current, swatches, onPick }: { role: Role; current: string; swatches: Swatch[]; onPick: (hex: string) => void }) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLSpanElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  // Close on outside click or Escape (and return focus to the trigger).
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!wrapper.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span ref={wrapper} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`Swap ${role} for another colour from the painting`}
        title="Swap colour"
        onClick={() => setOpen((o) => !o)}
        className={`rounded-md p-2 transition-colors ${open ? "bg-paper-deep text-ink" : "text-ink-muted hover:bg-paper-deep hover:text-ink"}`}
      >
        <SwapIcon />
      </button>
      {open && (
        <span className="absolute right-0 top-full z-20 mt-1 block w-60 rounded-md border border-line bg-paper p-3 shadow-xl">
          <span className="block text-xs font-semibold">Swap {role} for…</span>
          <span className="mt-2 grid grid-cols-4 gap-2">
            {swatches.map((s, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Use ${s.hex}`}
                aria-current={s.hex === current || undefined}
                onClick={() => {
                  onPick(s.hex);
                  setOpen(false);
                  trigger.current?.focus();
                }}
                className="h-11 rounded-md ring-1 ring-ink/10 transition-transform hover:scale-105 aria-[current]:ring-2 aria-[current]:ring-ink"
                style={{ background: s.hex }}
              />
            ))}
          </span>
          <span className="mt-2 block text-[11px] leading-snug text-ink-muted">Swapping locks the role; contrast is re-checked for everything else.</span>
        </span>
      )}
    </span>
  );
}

function LockIcon({ locked }: { locked: boolean }) {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d={locked ? "M8 11V7a4 4 0 0 1 8 0v4" : "M8 11V7a4 4 0 0 1 7.5-2"} />
    </svg>
  );
}

function SwapIcon() {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" />
    </svg>
  );
}
