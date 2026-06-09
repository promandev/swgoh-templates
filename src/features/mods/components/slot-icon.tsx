import { MOD_DEFINITIONS } from "@/features/mods/constants/mod-definitions";
import type { ModSlotId } from "@/types";
import { cn } from "@/lib/utils";

export function SlotIcon({
  slot,
  className,
}: {
  slot: ModSlotId;
  className?: string;
}) {
  const Icon = MOD_DEFINITIONS[slot].icon;
  return <Icon className={cn("size-4", className)} aria-hidden />;
}
