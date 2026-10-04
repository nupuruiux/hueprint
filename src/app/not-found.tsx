import Link from "next/link";
import { SurpriseButton } from "@/components/states/SurpriseButton";

// 404 in the same editorial voice as the rest of the site.
export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-24 sm:px-6">
      <p className="font-display text-2xl text-ink-muted">CDIV · 404</p>
      <h1 className="mt-3 font-display text-6xl leading-[0.95] sm:text-7xl">
        This room of the <span className="italic">museum</span> is empty
      </h1>
      <p className="mt-6 max-w-xl text-lg text-ink-muted">
        The painting you were looking for isn&apos;t in our collection, or the link lost a few letters on the way.
      </p>
      <div className="mt-10 flex flex-wrap items-center gap-5">
        <SurpriseButton />
        <Link href="/#gallery" className="font-semibold underline underline-offset-4 hover:text-rosewood">
          Back to the gallery
        </Link>
      </div>
    </div>
  );
}
