// Mixed-type wordmark: bold grotesk "Hue" + italic serif "print",
// borrowed from the Winter '26 "Ren*ai*ssance" headline.
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`text-xl leading-none tracking-tight ${className}`}>
      <span className="font-sans font-bold">Hue</span>
      <span className="font-display italic">print</span>
    </span>
  );
}
