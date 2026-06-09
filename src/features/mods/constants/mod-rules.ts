import type {
  ModConfiguration,
  ModSlotConfig,
  ModSlotId,
  StatId,
  StatLine,
} from "@/types";
import {
  MOD_DEFINITIONS,
  MOD_DEFINITION_LIST,
  SECONDARY_STAT_POOL,
} from "./mod-definitions";
import { getPrimary6DotValue } from "./primary-values";

/**
 * Behavioural rules for mods. All data comes from {@link MOD_DEFINITIONS}; this
 * module only exposes derived helpers and validations so the rest of the app
 * never needs to know how the rules are stored.
 */

export { isPercentStat } from "./stat-definitions";

/** Canonical slot order, derived from the mod definitions. */
export const MOD_SLOT_IDS: readonly ModSlotId[] = MOD_DEFINITION_LIST.map(
  (definition) => definition.id,
);

/** Maximum number of secondary stats a mod can roll. */
export const MAX_SECONDARIES = 4;

/** The complete pool of valid secondary stats. */
export const SECONDARY_STAT_IDS = SECONDARY_STAT_POOL;

export function isFixedPrimarySlot(slot: ModSlotId): boolean {
  return MOD_DEFINITIONS[slot].fixedPrimary !== null;
}

export function getPrimaryOptions(slot: ModSlotId): readonly StatId[] {
  return MOD_DEFINITIONS[slot].primaryOptions;
}

/**
 * Secondary stats still selectable for a given slot config: the slot's pool
 * minus its primary stat and minus stats already used by another secondary.
 * `currentIndex` lets the edited line keep its own value in the option list.
 */
export function getAvailableSecondaries(
  config: ModSlotConfig,
  currentIndex: number,
  slot?: ModSlotId,
): StatId[] {
  const pool = slot
    ? MOD_DEFINITIONS[slot].secondaryOptions
    : SECONDARY_STAT_POOL;
  const taken = new Set<StatId>();
  if (config.primary.stat) taken.add(config.primary.stat);
  config.secondaries.forEach((line, index) => {
    if (index !== currentIndex && line.stat) taken.add(line.stat);
  });
  return pool.filter((stat) => !taken.has(stat));
}

/** Whether a stat can legally be added as a secondary to this slot config. */
export function canAddSecondaryStat(
  config: ModSlotConfig,
  stat: StatId,
  slot?: ModSlotId,
): boolean {
  const pool = slot
    ? MOD_DEFINITIONS[slot].secondaryOptions
    : SECONDARY_STAT_POOL;
  if (!pool.includes(stat)) return false;
  if (config.primary.stat === stat) return false;
  return !config.secondaries.some((line) => line.stat === stat);
}

function emptyLine(): StatLine {
  return { stat: null, value: null };
}

function createSlot(slot: ModSlotId): ModSlotConfig {
  const fixedPrimary = MOD_DEFINITIONS[slot].fixedPrimary;
  return {
    primary: {
      stat: fixedPrimary,
      value: fixedPrimary ? getPrimary6DotValue(fixedPrimary) : null,
    },
    secondaries: [],
  };
}

/** A fresh, fully-typed mod configuration with fixed primaries pre-filled. */
export function createEmptyMods(): ModConfiguration {
  return MOD_SLOT_IDS.reduce((acc, slot) => {
    acc[slot] = createSlot(slot);
    return acc;
  }, {} as ModConfiguration);
}

export { emptyLine };
