import Link from "next/link";
import { Logo } from "./Logo";
import { movements, slugify } from "@/lib/paintings";

const REPO = "https://github.com/nupuruiux/hueprint";

// Footer index: neat columns of underlined links, after Spring '26.
export function SiteFooter() {
  const linkClass = "underline decoration-line underline-offset-4 transition-colors hover:text-rosewood hover:decoration-rosewood";

  return (
    <footer className="mt-auto border-t border-line bg-paper-deep">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm space-y-3">
          <Logo />
          <p className="font-display text-xl leading-snug text-ink-muted">
            Any painting, a UI theme you can actually ship.
          </p>
        </div>

        <nav aria-label="Movements">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-muted">Movements</h2>
          <ul className="space-y-2 text-sm">
            {movements.map((m) => (
              <li key={m}>
                <Link href={`/#${slugify(m)}`} className={linkClass}>{m}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Hueprint">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-muted">Hueprint</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href="/#how-it-works" className={linkClass}>How it works</Link></li>
            <li><Link href="/#upload" className={linkClass}>Upload an image</Link></li>
            <li><a href={REPO} className={linkClass}>GitHub</a></li>
          </ul>
        </nav>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-2 border-t border-line px-4 py-6 text-xs text-ink-muted sm:flex-row sm:justify-between sm:px-6">
        <p>
          Paintings courtesy of the{" "}
          <a href="https://www.artic.edu" className={linkClass}>Art Institute of Chicago</a>, public domain.
        </p>
        <p>Made by Nupur</p>
      </div>
    </footer>
  );
}
