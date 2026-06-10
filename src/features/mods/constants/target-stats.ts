import type { StatId } from "@/types";

/**
 * The aggregate stats a squad author can set a goal for (the "radio spinner").
 * These are whole-character totals — flat values like Speed/Health/Protection
 * and percentages like Potency/Tenacity — not per-mod lines, so the pool is the
 * curated set people actually target rather than every roll-able stat.
 */
export const TARGET_STAT_POOL: readonly StatId[] = [
  "speed",
  "health",
  "protection",
  "offense",
  "defense",
  "potency",
  "tenacity",
  "criticalChance",
  "criticalDamage",
  "criticalAvoidance",
  "accuracy",
] as const;

/** Maximum number of target stats per member. */
export const MAX_TARGET_STATS = 4;
