"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Renders children at a fixed design width and scales them down to fit the
// available space, so the dashboard looks like a real (smaller) screen on
// narrow viewports instead of being squashed.
export function ScaleToFit({ width, children }: { width: number; children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number>();

  useEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const measure = () => {
      const s = Math.min(1, o.clientWidth / width);
      setScale(s);
      setHeight(i.offsetHeight * s);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(o);
    observer.observe(i);
    return () => observer.disconnect();
  }, [width]);

  return (
    <div ref={outer} className="w-full overflow-hidden" style={{ height }}>
      <div ref={inner} style={{ width, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        {children}
      </div>
    </div>
  );
}
