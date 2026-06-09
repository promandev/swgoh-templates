/** Every stat that can appear on a mod, as a stable id. Labels live in i18n. */
export type StatId =
  | "speed"
  | "health"
  | "healthPct"
  | "protection"
  | "protectionPct"
  | "offense"
  | "offensePct"
  | "defense"
  | "defensePct"
  | "potency"
  | "tenacity"
  | "criticalChance"
  | "criticalDamage"
  | "criticalAvoidance"
  | "accuracy";

/** The six mod shapes/slots, in canonical display order. */
export type ModSlotId =
  | "square"
  | "arrow"
  | "diamond"
  | "triangle"
  | "circle"
  | "cross";

/**
 * A single stat line. `stat` may be null while the slot is empty/being edited;
 * `value` is the number the user types by hand.
 */
export interface StatLine {
  stat: StatId | null;
  value: number | null;
}

export interface ModSlotConfig {
  /** Primary stat. For fixed slots the `stat` is preset and not editable. */
  primary: StatLine;
  /** Up to MAX_SECONDARIES secondary stat lines. */
  secondaries: StatLine[];
}

/** Full mod configuration for one character: one config per slot. */
export type ModConfiguration = Record<ModSlotId, ModSlotConfig>;
