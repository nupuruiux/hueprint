"use client";

import Image from "next/image";
import Link from "next/link";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { HeroLoupe } from "./HeroLoupe";
import { HeroRedlines, type RedlineRole } from "./HeroRedlines";

export type HeroSlide = {
  id: number;
  src: string;
  alt: string;
  focus: string;
  credit: string;
  primary: string;
  buttonBg: string;
  buttonText: string;
  roles: RedlineRole[];
};

const ROTATE_MS = 10 * 1000; // next painting every 10 seconds

type Props = { slides: HeroSlide[]; startIndex: number; children: ReactNode };

// Rotates the hero painting every 10 seconds. Hovering the painting, or
// keyboard focus inside the hero, pauses it; when that ends (or the hero is
// scrolled out of view) a fresh 10-second countdown starts. A visible
// Pause/Play button covers touch and keyboard users too (WCAG 2.2.2).
export function HeroRotator({ slides, startIndex, children }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(startIndex);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [hovering, setHovering] = useState(false);
  const [focused, setFocused] = useState(false);
  // The Pause/Play button sets a choice. Until someone presses it, people who
  // ask their system for less motion get a still hero (starts paused).
  const reduceMotion = useReducedMotion();
  const [choice, setChoice] = useState<"paused" | "playing" | null>(null);
  const userPaused = choice ? choice === "paused" : !!reduceMotion;

  const slide = slides[index];
  const next = (index + 1) % slides.length;

  // Preload the next painting only once the page has finished loading, so it
  // doesn't compete with the first painting and the fonts for bandwidth.
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const done = () => setLoaded(true);
    if (document.readyState === "complete") {
      const id = requestAnimationFrame(done);
      return () => cancelAnimationFrame(id);
    }
    window.addEventListener("load", done, { once: true });
    return () => window.removeEventListener("load", done);
  }, []);

  // The countdown. Re-runs (= restarts from 10 s) whenever the painting
  // changes or a pause ends, because those values are its dependencies.
  useEffect(() => {
    if (hovering || focused || userPaused) return;
    const timer = setTimeout(() => {
      setPrevIndex(index);
      setIndex((index + 1) % slides.length);
    }, ROTATE_MS);
    return () => clearTimeout(timer);
  }, [index, hovering, focused, userPaused, slides.length]);

  // Scrolling past the hero doesn't fire "pointer left", so watch visibility:
  // once less than a fifth of the hero is on screen, the hover pause ends.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio < 0.2) setHovering(false);
      },
      { threshold: [0, 0.2] },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="Featured painting"
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovering(true)}
      onPointerLeave={() => setHovering(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }}
      className="on-dark relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-night text-paper"
    >
      {/* Mounted: the current painting, the previous one (while it fades out),
          and the next one (loading invisibly, ready for its fade-in).
          The other paintings aren't loaded until their turn. */}
      {slides.map((s, i) =>
        i === index || (i === next && loaded) || i === prevIndex ? (
          <Image
            key={s.id}
            src={s.src}
            alt={i === index ? s.alt : ""}
            aria-hidden={i !== index}
            fill
            priority={i === startIndex}
            sizes="100vw"
            className={`-z-20 object-cover transition-opacity duration-1000 ${i === index ? "opacity-100" : "opacity-0"}`}
            style={{ objectPosition: s.focus }}
          />
        ) : null,
      )}
      {/* Darken behind the frame (bottom on mobile, left on desktop) so text stays readable. */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-night/90 via-night/30 to-night/40 lg:bg-gradient-to-r lg:from-night/80 lg:via-night/20 lg:to-night/10" />
      <div aria-hidden className="hairline-grid pointer-events-none absolute inset-0 -z-10" />

      <HeroLoupe src={slide.src} objectPosition={slide.focus} />
      <HeroRedlines src={slide.src} objectPosition={slide.focus} roles={slide.roles} />

      <div data-no-loupe data-hero-frame className="relative z-10 mx-4 mb-16 mt-auto border border-paper/70 bg-night/40 p-6 backdrop-blur-[3px] sm:mx-auto sm:max-w-md sm:p-8 lg:my-auto lg:ml-[7vw] lg:max-w-[30rem]">
        {children}

        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
          <Link
            href={`/theme/${slide.id}`}
            className="relative rounded-full px-5 py-3 text-sm font-semibold shadow-lg transition hover:-translate-y-0.5"
            style={{ background: slide.buttonBg, color: slide.buttonText }}
          >
            Generate from this painting
            {/* Sticker label, slightly rotated. */}
            <span aria-hidden className="absolute -right-3 -top-3 rotate-12 rounded-sm bg-paper px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink shadow">
              Try me
            </span>
          </Link>
        </div>
      </div>

      <div data-no-loupe className="absolute bottom-4 right-4 z-10 flex items-center gap-3 text-xs leading-snug text-paper/80">
        <p className="hidden max-w-xs text-right sm:block">{slide.credit}</p>
        <p className="sr-only sm:hidden">{slide.credit}</p>
        <button
          type="button"
          onClick={() => setChoice(userPaused ? "playing" : "paused")}
          aria-label={userPaused ? "Resume painting rotation" : "Pause painting rotation"}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-paper/50 px-2.5 py-1 font-medium text-paper hover:border-paper"
        >
          <span aria-hidden>{userPaused ? "▶" : "❚❚"}</span>
          <span>
            {index + 1} / {slides.length}
          </span>
        </button>
      </div>
    </section>
  );
}
