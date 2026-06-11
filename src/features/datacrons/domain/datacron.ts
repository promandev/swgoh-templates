import {
  DATACRON_LEVELS,
  type DatacronLevel,
  type DatacronPerk,
  type DatacronTier,
  type MemberDatacron,
} from "@/types/datacron";

/** A fresh, empty datacron for a new squad member. */
export function createEmptyDatacron(): MemberDatacron {
  return {
    setName: "",
    setId: "",
    tiers: [],
    perks: [],
    focused: false,
    focusedLevel: null,
    notes: "",
  };
}

/** Whether the datacron holds any user-entered content worth showing. */
export function hasDatacronContent(datacron: MemberDatacron): boolean {
  return Boolean(
    datacron.setName.trim() ||
      datacron.tiers.length > 0 ||
      (datacron.perks?.length ?? 0) > 0 ||
      datacron.notes.trim(),
  );
}

/** Stable identity for a perk, used to toggle selection. */
export function perkKey(perk: DatacronPerk): string {
  return `${perk.level}|${perk.kind}|${perk.text}`;
}

/** Toggle a perk on/off, keeping perks sorted by level. */
export function togglePerk(
  datacron: MemberDatacron,
  perk: DatacronPerk,
): DatacronPerk[] {
  const perks = datacron.perks ?? [];
  const key = perkKey(perk);
  if (perks.some((current) => perkKey(current) === key)) {
    return perks.filter((current) => perkKey(current) !== key);
  }
  return [...perks, perk].sort((a, b) => a.level - b.level);
}

export function isLevelActive(
  datacron: MemberDatacron,
  level: DatacronLevel,
): boolean {
  return datacron.tiers.some((tier) => tier.level === level);
}

export function getTier(
  datacron: MemberDatacron,
  level: DatacronLevel,
): DatacronTier | undefined {
  return datacron.tiers.find((tier) => tier.level === level);
}

/** Active levels in canonical 3 → 9 order. */
export function activeLevels(datacron: MemberDatacron): DatacronLevel[] {
  return DATACRON_LEVELS.filter((level) => isLevelActive(datacron, level));
}

/** Toggle a tier on/off, keeping tiers sorted by level. */
export function toggleTier(
  datacron: MemberDatacron,
  level: DatacronLevel,
): DatacronTier[] {
  if (isLevelActive(datacron, level)) {
    return datacron.tiers.filter((tier) => tier.level !== level);
  }
  return [...datacron.tiers, { level, recommendedSecondaries: "" }].sort(
    (a, b) => a.level - b.level,
  );
}

/** Set the recommended secondaries text for one tier. */
export function setTierSecondaries(
  datacron: MemberDatacron,
  level: DatacronLevel,
  recommendedSecondaries: string,
): DatacronTier[] {
  return datacron.tiers.map((tier) =>
    tier.level === level ? { ...tier, recommendedSecondaries } : tier,
  );
}
