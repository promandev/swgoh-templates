import { defineRouting } from "next-intl/routing";

/**
 * Central i18n routing definition. Adding a new language is a one-line change
 * here plus a matching `messages/<locale>.json` file.
 */
export const routing = defineRouting({
  locales: ["en", "es"],
  defaultLocale: "en",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
