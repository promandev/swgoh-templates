"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useActiveSquad } from "@/features/squads/hooks/use-active-squad";
import { useSquadStore } from "@/stores/squad-store";
import { EmptySquads } from "./empty-squads";
import { SquadBuilderSkeleton } from "./squad-builder-skeleton";
import { SquadSidebar } from "./squad-sidebar";
import { SquadTable } from "./squad-table";
import { SquadToolbar } from "./squad-toolbar";

export function SquadBuilderApp() {
  const t = useTranslations("Squads");
  const tToasts = useTranslations("Toasts");

  const hasHydrated = useSquadStore((s) => s.hasHydrated);
  const squadCount = useSquadStore((s) => s.squads.length);
  const createSquad = useSquadStore((s) => s.createSquad);
  const activeSquad = useActiveSquad();

  function handleCreate() {
    createSquad(t("defaultName"));
    toast.success(tToasts("squadCreated"));
  }

  if (!hasHydrated) {
    return <SquadBuilderSkeleton />;
  }

  if (squadCount === 0) {
    return <EmptySquads onCreate={handleCreate} />;
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
      <SquadSidebar onCreate={handleCreate} />
      <div className="min-w-0 flex-1">
        {activeSquad ? (
          <div className="flex flex-col gap-3">
            <SquadToolbar squad={activeSquad} />
            <SquadTable squad={activeSquad} />
          </div>
        ) : (
          <div className="glass rounded-2xl p-10 text-center text-sm text-muted-foreground">
            {t("selectPrompt")}
          </div>
        )}
      </div>
    </div>
  );
}
