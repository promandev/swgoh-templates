import { cn } from "@/lib/utils";

/**
 * Faction insignia for the Rebel/Empire theme toggle. These mask the project's
 * own icon art (`public/icons/*.png`) and paint it with `currentColor`, so the
 * shape stays perfectly faithful to the source while the active theme accent
 * recolors the fill — and it scales crisply to any size.
 */
function MaskEmblem({ src, className }: { src: string; className?: string }) {
  const mask = {
    WebkitMaskImage: `url(${src})`,
    maskImage: `url(${src})`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
    WebkitMaskSize: "contain",
    maskSize: "contain",
  } as const;
  return (
    <span
      aria-hidden
      style={mask}
      className={cn("inline-block bg-current", className)}
    />
  );
}

/** Galactic Empire cog. */
export function EmpireEmblem({ className }: { className?: string }) {
  return <MaskEmblem src="/icons/empireIcon.png" className={className} />;
}

/** Rebel Alliance starbird. */
export function RebelEmblem({ className }: { className?: string }) {
  return <MaskEmblem src="/icons/rebelIcon.png" className={className} />;
}
