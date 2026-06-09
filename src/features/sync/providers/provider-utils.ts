/** Category tags that describe a role/class rather than a faction. */
export const ROLE_TAGS = new Set(
  [
    "Attacker",
    "Support",
    "Tank",
    "Healer",
    "Leader",
    "Crew Member",
    "Fleet Commander",
    "Galactic Legend",
  ].map((tag) => tag.toLowerCase()),
);

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function slugFromUrl(url: string | undefined, fallback: string): string {
  if (url) {
    const parts = url.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    if (last && !last.includes(".")) return last;
  }
  return slugify(fallback);
}

/** Drops role/class tags, keeping only faction-like categories. */
export function filterFactions(categories: string[] | undefined): string[] {
  return (categories ?? []).filter(
    (category) => !ROLE_TAGS.has(category.toLowerCase()),
  );
}
