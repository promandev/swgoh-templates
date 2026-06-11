"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PlusIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  MAX_MOD_PIECES,
  MOD_SET_DEFINITIONS,
  MOD_SET_IDS,
} from "@/features/mods/constants/set-definitions";
import { cn } from "@/lib/utils";
import type { ModSetId } from "@/types";
import { SetChip } from "./set-chip";

/**
 * Edits the recommended set bonuses for a member. Sets may repeat (e.g. three
 * 2-piece Health sets) and are capped at {@link MAX_SETS}.
 */
export function SetSelector({
  value,
  onChange,
}: {
  value: ModSetId[];
  onChange: (sets: ModSetId[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("Sets");
  const usedPieces = value.reduce(
    (sum, id) => sum + MOD_SET_DEFINITIONS[id].pieces,
    0,
  );
  const remainingPieces = MAX_MOD_PIECES - usedPieces;
  // The smallest set is two pieces, so two free slots are needed to add another.
  const canAdd = remainingPieces >= 2;

  function addSet(id: ModSetId) {
    onChange([...value, id]);
    setOpen(false);
  }

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
        {t("label")}
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {value.length === 0 ? (
          <span className="text-xs text-muted-foreground">{t("empty")}</span>
        ) : (
          value.map((id, index) => (
            <span key={`${id}-${index}`} className="inline-flex items-center">
              <SetChip set={id} />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t("remove")}
                title={t("remove")}
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                className="-ml-1 size-5 text-muted-foreground hover:text-destructive"
              >
                <XIcon className="size-3" />
              </Button>
            </span>
          ))
        )}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canAdd}
                className="h-7 gap-1 border-dashed text-xs text-muted-foreground"
              >
                <PlusIcon className="size-3.5" />
                {t("add")}
              </Button>
            }
          />
          <PopoverContent align="start" className="w-56 gap-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              {t("pick")}
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {MOD_SET_IDS.map((id) => {
                const fits = MOD_SET_DEFINITIONS[id].pieces <= remainingPieces;
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={!fits}
                    onClick={() => addSet(id)}
                    className={cn(
                      "flex items-center justify-between gap-1 rounded-md px-2 py-1 text-left text-xs ring-1 transition hover:opacity-80",
                      MOD_SET_DEFINITIONS[id].chipClass,
                      !fits && "cursor-not-allowed opacity-30 hover:opacity-30",
                    )}
                  >
                    <span className="truncate">{t(`names.${id}`)}</span>
                    <span className="shrink-0 opacity-70 tabular-nums">
                      {t("pieces", { count: MOD_SET_DEFINITIONS[id].pieces })}
                    </span>
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
