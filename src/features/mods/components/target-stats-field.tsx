"use client";

import { useTranslations } from "next-intl";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ModStatLine } from "@/features/mods/components/mod-stat-line";
import {
  MAX_TARGET_STATS,
  TARGET_STAT_POOL,
} from "@/features/mods/constants/target-stats";
import type { StatId, StatTarget } from "@/types";

/**
 * The "radio spinner": up to {@link MAX_TARGET_STATS} aggregate stat goals
 * (stat + amount) the author wants this character to reach. Each stat can be
 * picked once.
 */
export function TargetStatsField({
  value,
  onChange,
}: {
  value: StatTarget[];
  onChange: (targets: StatTarget[]) => void;
}) {
  const t = useTranslations("TargetStats");

  function availableFor(currentIndex: number): StatId[] {
    const taken = new Set<StatId>();
    value.forEach((line, index) => {
      if (index !== currentIndex && line.stat) taken.add(line.stat);
    });
    return TARGET_STAT_POOL.filter((stat) => !taken.has(stat));
  }

  function update(index: number, patch: Partial<StatTarget>) {
    onChange(value.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  const canAdd =
    value.length < MAX_TARGET_STATS && availableFor(-1).length > 0;

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
      <span className="shrink-0 text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
        {t("label")}
      </span>

      {value.map((line, index) => (
        <div key={index} className="w-44 max-w-full">
          <ModStatLine
            stat={line.stat}
            value={line.value}
            options={availableFor(index)}
            onStatChange={(stat) => update(index, { stat })}
            onValueChange={(next) => update(index, { value: next })}
            onRemove={() => onChange(value.filter((_, i) => i !== index))}
          />
        </div>
      ))}

      <Button
        type="button"
        variant="ghost"
        size={value.length > 0 ? "icon-sm" : "sm"}
        disabled={!canAdd}
        onClick={() => onChange([...value, { stat: null, value: null }])}
        aria-label={t("add")}
        title={
          value.length >= MAX_TARGET_STATS
            ? t("maxReached", { max: MAX_TARGET_STATS })
            : t("add")
        }
        className="h-7 justify-start text-muted-foreground"
      >
        <PlusIcon className="size-3.5" />
        {value.length === 0 ? t("add") : null}
      </Button>
    </div>
  );
}
