"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

const NAV = [
  { href: "/#gallery", label: "Gallery" },
  { href: "/#upload", label: "Upload" },
  { href: "/#how-it-works", label: "How it works" },
];

// On the home page the header floats transparently over the dark hero
// painting; everywhere else it sits on paper. Theme pages are a workspace,
// so they get a slim studio bar instead of the full site nav.
export function SiteHeader() {
  const pathname = usePathname();
  const overHero = pathname === "/";

  if (pathname.startsWith("/theme")) return <StudioBar />;

  return (
    <header
      className={
        overHero
          ? "on-dark absolute inset-x-0 top-0 z-20 text-paper"
          : "relative z-20 border-b border-line bg-paper text-ink"
      }
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" aria-label="Hueprint home">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 text-sm font-medium md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="opacity-90 transition-opacity hover:opacity-100 hover:underline underline-offset-4">
              {item.label}
            </Link>
          ))}
        </nav>

        {/* White pill CTA, like the Winter '26 nav. */}
        <Link
          href="/#upload"
          className={
            overHero
              ? "rounded-full bg-paper px-4 py-2 text-sm font-semibold text-ink transition-transform hover:-translate-y-px"
              : "rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper transition-transform hover:-translate-y-px"
          }
        >
          Upload yours
        </Link>
      </div>
    </header>
  );
}

function StudioBar() {
  return (
    <header className="relative z-20 border-b border-line bg-paper text-ink">
      <div className="mx-auto flex h-12 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" aria-label="Hueprint home">
          <Logo />
        </Link>
        <Link href="/#gallery" className="text-sm font-medium text-ink-muted underline-offset-4 hover:text-ink hover:underline">
          ← Gallery
        </Link>
      </div>
    </header>
  );
}
