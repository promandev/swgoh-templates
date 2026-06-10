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
  MAX_SETS,
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
  const canAdd = value.length < MAX_SETS;

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
              {MOD_SET_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => addSet(id)}
                  className={cn(
                    "flex items-center justify-between gap-1 rounded-md px-2 py-1 text-left text-xs ring-1 transition hover:opacity-80",
                    MOD_SET_DEFINITIONS[id].chipClass,
                  )}
                >
                  <span className="truncate">{t(`names.${id}`)}</span>
                  <span className="shrink-0 opacity-70 tabular-nums">
                    {t("pieces", { count: MOD_SET_DEFINITIONS[id].pieces })}
                  </span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
