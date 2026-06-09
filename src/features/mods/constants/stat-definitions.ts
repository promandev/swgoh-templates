import type { StatId } from "@/types";

/**
 * Single source of truth for every stat. `labelKey` matches the id and resolves
 * under the i18n "Stats" namespace; `isPercent` drives value formatting.
 */
export interface StatDefinition {
  id: StatId;
  labelKey: StatId;
  isPercent: boolean;
}

function def(id: StatId, isPercent: boolean): StatDefinition {
  return { id, labelKey: id, isPercent };
}

export const STAT_DEFINITIONS: Record<StatId, StatDefinition> = {
  speed: def("speed", false),
  health: def("health", false),
  healthPct: def("healthPct", true),
  protection: def("protection", false),
  protectionPct: def("protectionPct", true),
  offense: def("offense", false),
  offensePct: def("offensePct", true),
  defense: def("defense", false),
  defensePct: def("defensePct", true),
  potency: def("potency", true),
  tenacity: def("tenacity", true),
  criticalChance: def("criticalChance", true),
  criticalDamage: def("criticalDamage", true),
  criticalAvoidance: def("criticalAvoidance", true),
  accuracy: def("accuracy", true),
};

export function isPercentStat(stat: StatId): boolean {
  return STAT_DEFINITIONS[stat].isPercent;
}
