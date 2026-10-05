"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { buildOptions, describeSwatches, type Mode, type Role, type Strategy } from "@/lib/theme";
import { parseThemeState, serializeThemeState, type ThemeState } from "@/lib/theme-url";
import { ExportPanel } from "./ExportPanel";
import { OptionTiles } from "./OptionTiles";
import { LivePreview } from "./preview/LivePreview";
import { TokenPanel } from "./TokenPanel";

// The interactive part of the theme page. All state lives in the URL, so
// every change is shareable and the back button works as expected.
// shareable: false for uploads, whose image can't travel in a link.
type Props = { title: string; swatches: { hex: string; population: number }[]; shareable?: boolean };

export function ThemeStudio({ title, swatches: raw, shareable = true }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const state = parseThemeState(params);

  const swatches = useMemo(() => describeSwatches(raw), [raw]);
  // Locks apply to all three directions, so the tiles reflect them too.
  // This only re-runs when the URL changes, and the engine takes milliseconds.
  const options = buildOptions(swatches, state.locks);
  const theme = options[state.strategy];

  function update(next: Partial<ThemeState>) {
    const query = serializeThemeState({ ...state, ...next }, params).toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  }

  function setLock(mode: Mode, role: Role, hex: string | null) {
    const forMode = { ...state.locks[mode] };
    if (hex) forMode[role] = hex;
    else delete forMode[role];
    update({ locks: { ...state.locks, [mode]: forMode } });
  }

  return (
    <>
      <div className="space-y-16">
        <OptionTiles
          options={options}
          selected={state.strategy}
          mode={state.mode}
          onSelect={(strategy: Strategy) => update({ strategy })}
        />
        {/* Right after the tiles, so you see the dashboard react as you pick. */}
        <LivePreview tokens={theme[state.mode]} mode={state.mode} onModeChange={(mode) => update({ mode })} />
        <TokenPanel
          theme={theme}
          mode={state.mode}
          swatches={swatches}
          locks={state.locks[state.mode] ?? {}}
          onModeChange={(mode) => update({ mode })}
          onLock={(role, hex) => setLock(state.mode, role, hex)}
          onResetLocks={() => update({ locks: { ...state.locks, [state.mode]: {} } })}
        />
      </div>
      {/* Outside the spaced wrapper: space-y-16 adds a bottom margin to its
          children, which would lift this fixed bar 64px off the bottom edge. */}
      <ExportPanel theme={theme} defaultName={title} shareable={shareable} />
    </>
  );
}
