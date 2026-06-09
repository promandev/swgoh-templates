/** Faction alignment — drives the avatar fallback gradient and future filters. */
export type Alignment = "light" | "dark" | "neutral";

export interface Character {
  id: string;
  /** Display name. Kept in data (not i18n) since it is a proper noun. */
  name: string;
  /**
   * Local avatar path under /public, e.g. `/assets/characters/<id>.webp`.
   * Never a remote URL — the UI falls back to initials when the file is absent.
   */
  avatar: string;
  alignment: Alignment;
  /** Faction / category tags used for search and filtering. */
  factions: string[];
}
