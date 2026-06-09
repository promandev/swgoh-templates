import type { StatId } from "@/types";

/**
 * Canonical maximum PRIMARY stat values for a fully-leveled 6-dot (6E) mod.
 * Values verified against swgoh.wiki and gaming-fans.com. Speed is a flat bonus;
 * every other primary is a percentage. Flat stats (health/protection/offense/
 * defense) never appear as primaries, so they are intentionally absent.
 *
 * Used to auto-fill a mod's primary value the moment its stat is chosen, so a
 * user only has to pick the stat — the game-accurate number follows.
 */
export const PRIMARY_6DOT_VALUES: Partial<Record<StatId, number>> = {
  speed: 32,
  offensePct: 8.5,
  defensePct: 20,
  healthPct: 16,
  protectionPct: 24,
  criticalChance: 20,
  criticalDamage: 42,
  potency: 30,
  tenacity: 35,
  accuracy: 30,
  criticalAvoidance: 35,
};

/** The 6-dot primary value for a stat, or null when the stat has no primary. */
export function getPrimary6DotValue(stat: StatId): number | null {
  return PRIMARY_6DOT_VALUES[stat] ?? null;
}
