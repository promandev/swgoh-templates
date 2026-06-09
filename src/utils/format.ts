import { isPercentStat } from "@/features/mods/constants/mod-rules";
import type { StatId } from "@/types";

/**
 * Formats a typed stat value for display, e.g. `+32`, `+5.5%`.
 * Returns an empty string when no value has been entered yet.
 */
export function formatStatValue(stat: StatId | null, value: number | null): string {
  if (value === null || Number.isNaN(value)) return "";
  const sign = value > 0 ? "+" : "";
  const suffix = stat && isPercentStat(stat) ? "%" : "";
  return `${sign}${value}${suffix}`;
}
