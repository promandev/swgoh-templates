"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PlusIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  MAX_SECONDARIES,
  getAvailableSecondaries,
  getPrimaryOptions,
  isFixedPrimarySlot,
} from "@/features/mods/constants/mod-rules";
import type { ModSlotConfig, ModSlotId, StatId, StatLine } from "@/types";
import { formatStatValue } from "@/utils/format";
import { ModStatLine } from "./mod-stat-line";
import { SlotIcon } from "./slot-icon";

function StatChip({
  stat,
  value,
  variant,
  label,
}: {
  stat: StatId | null;
  value: number | null;
  variant: "primary" | "secondary";
  label: string;
}) {
  const formatted = formatStatValue(stat, value);
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.7rem] leading-tight",
        variant === "primary"
          ? "bg-primary/12 font-semibold text-primary ring-1 ring-primary/20"
          : "bg-muted text-muted-foreground",
      )}
    >
      <span className="truncate">{label}</span>
      {formatted ? (
        <span className="font-medium tabular-nums">{formatted}</span>
      ) : null}
    </span>
  );
}

export function ModCell({
  slot,
  config,
  onChange,
}: {
  slot: ModSlotId;
  config: ModSlotConfig;
  onChange: (config: ModSlotConfig) => void;
}) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("Mods");
  const tStats = useTranslations("Stats");
  const tSlots = useTranslations("Slots");

  const fixed = isFixedPrimarySlot(slot);
  const primaryOptions = getPrimaryOptions(slot);
  const filledSecondaries = config.secondaries.filter((line) => line.stat);
  const hasContent = Boolean(config.primary.stat) || filledSecondaries.length > 0;
  const slotName = tSlots(`${slot}.name`);

  function patch(next: Partial<ModSlotConfig>) {
    onChange({ ...config, ...next });
  }

  function updateSecondary(index: number, line: Partial<StatLine>) {
    patch({
      secondaries: config.secondaries.map((current, i) =>
        i === index ? { ...current, ...line } : current,
      ),
    });
  }

  const canAddSecondary =
    config.secondaries.length < MAX_SECONDARIES &&
    getAvailableSecondaries(config, config.secondaries.length).length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            aria-label={`${slotName} — ${t("editorTitle", { slot: slotName })}`}
            className={cn(
              "flex h-auto min-h-14 w-full flex-col items-start justify-start gap-1 p-2 text-left font-normal",
              !hasContent && "border-dashed text-muted-foreground",
            )}
          />
        }
      >
        {hasContent ? (
          <div className="flex w-full flex-col gap-1">
            {config.primary.stat ? (
              <StatChip
                variant="primary"
                stat={config.primary.stat}
                value={config.primary.value}
                label={tStats(config.primary.stat)}
              />
            ) : null}
            {filledSecondaries.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {filledSecondaries.map((line, index) => (
                  <StatChip
                    key={`${line.stat}-${index}`}
                    variant="secondary"
                    stat={line.stat}
                    value={line.value}
                    label={line.stat ? tStats(line.stat) : ""}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <span className="flex w-full items-center gap-1.5 text-xs">
            <SlotIcon slot={slot} className="size-3.5" />
            {t("emptySummary")}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent align="start" className="w-80 gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/12 text-primary">
            <SlotIcon slot={slot} className="size-4" />
          </span>
          <p className="text-sm font-semibold">
            {t("editorTitle", { slot: slotName })}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              {t("primary")}
            </p>
            {fixed ? (
              <Badge variant="secondary" className="text-[0.65rem]">
                {t("primaryFixed")}
              </Badge>
            ) : null}
          </div>
          <ModStatLine
            stat={config.primary.stat}
            value={config.primary.value}
            options={primaryOptions}
            fixedStatLabel={
              fixed && config.primary.stat
                ? tStats(config.primary.stat)
                : undefined
            }
            onStatChange={(stat) =>
              patch({ primary: { ...config.primary, stat } })
            }
            onValueChange={(value) =>
              patch({ primary: { ...config.primary, value } })
            }
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            {t("secondaries")}
          </p>
          {config.secondaries.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-2.5 py-2 text-xs text-muted-foreground">
              {t("noSecondaries")}
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {config.secondaries.map((line, index) => (
                <ModStatLine
                  key={index}
                  stat={line.stat}
                  value={line.value}
                  options={getAvailableSecondaries(config, index)}
                  onStatChange={(stat) => updateSecondary(index, { stat })}
                  onValueChange={(value) => updateSecondary(index, { value })}
                  onRemove={() =>
                    patch({
                      secondaries: config.secondaries.filter(
                        (_, i) => i !== index,
                      ),
                    })
                  }
                />
              ))}
            </div>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!canAddSecondary}
            onClick={() =>
              patch({
                secondaries: [
                  ...config.secondaries,
                  { stat: null, value: null },
                ],
              })
            }
            className="justify-start text-muted-foreground"
          >
            <PlusIcon className="size-3.5" />
            {config.secondaries.length >= MAX_SECONDARIES
              ? t("maxReached", { max: MAX_SECONDARIES })
              : t("addSecondary")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
