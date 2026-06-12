import { useTranslations } from "next-intl";
import { SwordsIcon } from "lucide-react";

import { ThemeToggle } from "./theme-toggle";
import { LocaleSwitcher } from "./locale-switcher";

export function AppHeader() {
  const t = useTranslations("App");

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[120rem] items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-xl bg-linear-to-br from-primary to-indigo-700 text-primary-foreground shadow-sm">
            <SwordsIcon className="size-4" aria-hidden />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight sm:text-base">
              {t("title")}
            </p>
            <p className="hidden text-xs text-muted-foreground sm:block">
              {t("subtitle")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
