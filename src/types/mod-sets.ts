import type { StatId } from "./mods";

/**
 * The eight SWGOH mod set bonuses, as stable ids. Labels live in i18n
 * (`Sets.names`). A full loadout is six mods: either one 4-piece set plus one
 * 2-piece set, or three 2-piece sets.
 */
export type ModSetId =
  | "speed"
  | "health"
  | "defense"
  | "offense"
  | "criticalChance"
  | "criticalDamage"
  | "potency"
  | "tenacity";

/**
 * A target stat the squad author wants this character to reach (the
 * "radio spinner"): a stat plus the desired amount. `stat`/`value` may be null
 * while a row is being filled in. Up to MAX_TARGET_STATS per member.
 */
export interface StatTarget {
  stat: StatId | null;
  value: number | null;
}
