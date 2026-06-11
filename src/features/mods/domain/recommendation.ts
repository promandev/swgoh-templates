import { isFixedPrimarySlot } from "@/features/mods/constants/mod-rules";
import { getPrimary6DotValue } from "@/features/mods/constants/primary-values";
import type { ModConfiguration, ModSlotId, StatId } from "@/types";

/** A choice of primary stat per variable slot, as produced by the wizard. */
export type ChosenPrimaries = Partial<Record<ModSlotId, StatId>>;

/**
 * Overlays a set of chosen primary stats onto an existing mod configuration.
 * Only the four variable slots are touched (fixed square/diamond primaries and
 * any secondaries the user already typed are preserved), so applying a
 * recommendation refreshes the primaries without wiping manual work.
 */
export function buildRecommendedMods(
  base: ModConfiguration,
  primaries: ChosenPrimaries,
): ModConfiguration {
  const next: ModConfiguration = { ...base };
  for (const [slot, stat] of Object.entries(primaries) as [
    ModSlotId,
    StatId,
  ][]) {
    if (!stat || isFixedPrimarySlot(slot)) continue;
    next[slot] = {
      ...next[slot],
      primary: { stat, value: getPrimary6DotValue(stat) },
    };
  }
  return next;
}
