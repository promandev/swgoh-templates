import type { Alignment } from "@/types";

/** Up to two initials from a unit name, e.g. "Darth Vader" -> "DV". */
export function getInitials(name: string): string {
  const words = name
    .replace(/\(.*?\)/g, "") // drop parenthetical variants
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/** Tailwind gradient classes used for the initials avatar, keyed by faction. */
export const ALIGNMENT_GRADIENT: Record<Alignment, string> = {
  dark: "from-rose-500/80 to-red-700/80 text-white",
  light: "from-sky-400/80 to-indigo-600/80 text-white",
  neutral: "from-amber-400/80 to-orange-600/80 text-white",
};
