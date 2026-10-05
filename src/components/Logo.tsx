// Wordmark: "hueprint." in Newsreader semibold. Plain text, so it takes the
// surrounding colour (paper over the hero, ink on paper) and stays crisp at any size.
export function Logo({ className = "text-xl" }: { className?: string }) {
  return <span className={`inline-block font-display font-semibold leading-none tracking-[-0.01em] ${className}`}>hueprint.</span>;
}
