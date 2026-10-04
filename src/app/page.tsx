import { connection } from "next/server";
import { Hero } from "@/components/home/Hero";
import { SwatchMarquee } from "@/components/home/SwatchMarquee";
import { Gallery } from "@/components/home/Gallery";
import { heroPaintings, paintings } from "@/lib/paintings";

export default async function Home() {
  // Render per request (not once at build time) so the hero painting
  // rotates on every visit.
  await connection();
  // A server component renders once per request and never re-renders, so a
  // random pick here is stable for that visit (the pattern in Next's docs).
  // eslint-disable-next-line react-hooks/purity
  const heroStart = Math.floor(Math.random() * heroPaintings.length);

  return (
    <>
      <Hero startIndex={heroStart} />
      <SwatchMarquee />
      <Gallery paintings={paintings} />
    </>
  );
}
