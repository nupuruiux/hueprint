"use client";

import { useRouter } from "next/navigation";
import { paintings } from "@/lib/paintings";

// Opens a random painting's theme page.
export function SurpriseButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push(`/theme/${paintings[Math.floor(Math.random() * paintings.length)].id}`)}
      className="rounded-full bg-rosewood px-5 py-3 text-sm font-semibold text-paper transition-transform hover:-translate-y-px"
    >
      Surprise me
    </button>
  );
}
