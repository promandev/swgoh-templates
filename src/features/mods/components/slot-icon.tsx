import type { ModSlotId } from "@/types";
import { cn } from "@/lib/utils";

/**
 * The authentic SWGOH mod-slot icon for a given slot, served from
 * `public/icons/mods/<slot>.png` (the real in-game metallic frames). Rendered
 * as a CSS background so it embeds cleanly in the html-to-image export and
 * follows the `size-*` utility passed via `className`.
 */
export function SlotIcon({
  slot,
  className,
}: {
  slot: ModSlotId;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-hidden
      className={cn("inline-block size-7 bg-contain bg-center bg-no-repeat", className)}
      style={{ backgroundImage: `url(/icons/mods/${slot}.png)` }}
    />
  );
}
