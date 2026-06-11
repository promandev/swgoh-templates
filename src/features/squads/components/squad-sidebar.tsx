"use client";

import { useTranslations } from "next-intl";
import { ChevronRightIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSquadStore } from "@/stores/squad-store";

export function SquadSidebar({ onCreate }: { onCreate: () => void }) {
  const t = useTranslations("Squads");
  const squads = useSquadStore((s) => s.squads);
  const activeSquadId = useSquadStore((s) => s.activeSquadId);
  const setActiveSquad = useSquadStore((s) => s.setActiveSquad);

  return (
    <aside className="flex flex-col gap-3 lg:w-64 lg:shrink-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-semibold">{t("listTitle")}</h2>
          <span className="text-xs text-muted-foreground">
            {t("listCount", { count: squads.length })}
          </span>
        </div>
        <Button size="sm" onClick={onCreate}>
          <PlusIcon className="size-3.5" />
          <span className="hidden sm:inline">{t("newSquad")}</span>
        </Button>
      </div>

      <div className="relative lg:contents">
        <ul
          className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-x-visible lg:pb-0"
          aria-label={t("listTitle")}
        >
          {squads.map((squad) => {
            const isActive = squad.id === activeSquadId;
            return (
              <li key={squad.id} className="min-w-48 lg:min-w-0">
              <button
                type="button"
                onClick={() => setActiveSquad(squad.id)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "flex w-full flex-col gap-0.5 rounded-xl border px-3 py-2.5 text-left transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "border-primary/40 bg-primary/10 shadow-sm"
                    : "border-border/60 bg-card/40 hover:border-border hover:bg-card/70",
                )}
              >
                <span
                  className={cn(
                    "truncate text-sm font-medium",
                    !squad.name && "text-muted-foreground",
                  )}
                >
                  {squad.name || t("untitled")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("members", { count: squad.size })}
                </span>
              </button>
            </li>
            );
          })}
        </ul>
        {squads.length > 1 ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 flex items-center lg:hidden"
          >
            <span className="flex h-full w-12 items-center justify-end bg-linear-to-l from-background via-background/80 to-transparent pr-0.5 pb-1">
              <ChevronRightIcon className="size-4 animate-pulse text-muted-foreground" />
            </span>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
