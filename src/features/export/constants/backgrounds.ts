/**
 * Curated background presets for the exported template. Each is a pure CSS
 * gradient evoking a Star Wars locale (no copyrighted imagery), supplied as an
 * inline `background` shorthand so `html-to-image` captures it reliably in the
 * downloaded PNG. A dark scrim is layered over these by the export card so the
 * white text stays legible on every option.
 */
export interface BackgroundPreset {
  id: string;
  /** i18n key under the "Backgrounds" namespace. */
  nameKey: string;
  /** CSS `background` shorthand applied to the export card root. */
  gradient: string;
}

export const BACKGROUND_PRESETS: readonly BackgroundPreset[] = [
  {
    id: "deep-space",
    nameKey: "deepSpace",
    gradient:
      "radial-gradient(120% 80% at 80% -10%, #1e293b 0%, transparent 55%), linear-gradient(135deg, #09090b 0%, #18181b 55%, #09090b 100%)",
  },
  {
    id: "tatooine",
    nameKey: "tatooine",
    gradient:
      "radial-gradient(90% 70% at 70% 15%, #f4a04a 0%, transparent 55%), linear-gradient(160deg, #7a3d12 0%, #b9742b 45%, #3a1d0a 100%)",
  },
  {
    id: "hoth",
    nameKey: "hoth",
    gradient:
      "radial-gradient(100% 70% at 50% 0%, #dfeefc 0%, transparent 60%), linear-gradient(160deg, #6f93b8 0%, #98b6d4 45%, #2a3f57 100%)",
  },
  {
    id: "death-star",
    nameKey: "deathStar",
    gradient:
      "radial-gradient(90% 70% at 30% 10%, #3a4250 0%, transparent 55%), linear-gradient(150deg, #1a1d24 0%, #2b313b 50%, #0d0f13 100%)",
  },
  {
    id: "endor",
    nameKey: "endor",
    gradient:
      "radial-gradient(100% 70% at 60% 10%, #4a7a3c 0%, transparent 55%), linear-gradient(160deg, #1f3a1c 0%, #2f5226 45%, #0e1c0c 100%)",
  },
  {
    id: "bespin",
    nameKey: "bespin",
    gradient:
      "radial-gradient(100% 75% at 50% 5%, #ffb27a 0%, transparent 55%), linear-gradient(165deg, #c95f3e 0%, #e08a5a 40%, #5a2740 100%)",
  },
  {
    id: "mustafar",
    nameKey: "mustafar",
    gradient:
      "radial-gradient(90% 70% at 50% 100%, #ff5a2c 0%, transparent 55%), linear-gradient(160deg, #2a0d08 0%, #6e1c0e 55%, #120403 100%)",
  },
  {
    id: "coruscant",
    nameKey: "coruscant",
    gradient:
      "radial-gradient(100% 70% at 70% 10%, #6b5cd6 0%, transparent 55%), linear-gradient(160deg, #1c1f3a 0%, #34306b 45%, #0c0d1c 100%)",
  },
  {
    id: "dagobah",
    nameKey: "dagobah",
    gradient:
      "radial-gradient(100% 70% at 40% 15%, #5d6b3a 0%, transparent 55%), linear-gradient(160deg, #232c1c 0%, #3a4528 50%, #10140c 100%)",
  },
  {
    id: "yavin",
    nameKey: "yavin",
    gradient:
      "radial-gradient(100% 75% at 60% 5%, #cda85a 0%, transparent 55%), linear-gradient(165deg, #2f3a1f 0%, #57613a 45%, #15180e 100%)",
  },
  {
    id: "starfield",
    nameKey: "starfield",
    gradient:
      "radial-gradient(80% 60% at 75% 20%, #2c3e6b 0%, transparent 55%), radial-gradient(70% 60% at 20% 80%, #1b2b52 0%, transparent 55%), linear-gradient(160deg, #060814 0%, #0d1430 55%, #04060f 100%)",
  },
] as const;

/** The first preset is the default applied to squads without an explicit pick. */
export const DEFAULT_BACKGROUND_ID = BACKGROUND_PRESETS[0].id;

export function getBackgroundPreset(id: string | undefined): BackgroundPreset {
  return (
    BACKGROUND_PRESETS.find((preset) => preset.id === id) ?? BACKGROUND_PRESETS[0]
  );
}
