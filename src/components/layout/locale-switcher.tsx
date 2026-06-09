"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LanguagesIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { routing } from "@/i18n/routing";
import { usePathname, useRouter } from "@/i18n/navigation";

export function LocaleSwitcher() {
  const t = useTranslations("Language");
  const activeLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchTo(locale: (typeof routing.locales)[number]) {
    if (locale === activeLocale) return;
    startTransition(() => {
      router.replace(pathname, { locale });
    });
  }

  return (
    <div
      role="group"
      aria-label={t("label")}
      className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-card/40 p-0.5"
    >
      <LanguagesIcon
        className="ml-1 size-3.5 text-muted-foreground"
        aria-hidden
      />
      {routing.locales.map((locale) => (
        <button
          key={locale}
          type="button"
          disabled={isPending}
          onClick={() => switchTo(locale)}
          aria-pressed={locale === activeLocale}
          className={cn(
            "rounded-md px-2 py-1 text-xs font-medium uppercase transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            locale === activeLocale
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {locale}
        </button>
      ))}
    </div>
  );
}
