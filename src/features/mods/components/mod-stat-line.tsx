"use client";

import { useTranslations } from "next-intl";
import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isPercentStat } from "@/features/mods/constants/mod-rules";
import type { StatId } from "@/types";
import { StatSelect } from "./stat-select";

interface ModStatLineProps {
  stat: StatId | null;
  value: number | null;
  options: readonly StatId[];
  onStatChange: (stat: StatId) => void;
  onValueChange: (value: number | null) => void;
  /** When set, the stat is fixed (square/diamond primary) and shown read-only. */
  fixedStatLabel?: string;
  onRemove?: () => void;
}

export function ModStatLine({
  stat,
  value,
  options,
  onStatChange,
  onValueChange,
  fixedStatLabel,
  onRemove,
}: ModStatLineProps) {
  const t = useTranslations("Mods");
  const tCommon = useTranslations("Common");
  const suffix = stat && isPercentStat(stat) ? "%" : "";

  return (
    <div className="flex items-center gap-1.5">
      {fixedStatLabel ? (
        <span className="flex h-7 flex-1 items-center rounded-lg border border-dashed border-border bg-muted/40 px-2.5 text-[0.8rem] font-medium text-muted-foreground">
          {fixedStatLabel}
        </span>
      ) : (
        <div className="flex-1">
          <StatSelect
            value={stat}
            options={options}
            onChange={onStatChange}
            placeholder={t("selectStat")}
            ariaLabel={t("selectStat")}
          />
        </div>
      )}

      <div className="relative w-20 shrink-0">
        <Input
          type="number"
          inputMode="decimal"
          step="any"
          min={0}
          value={value ?? ""}
          aria-label={t("value")}
          placeholder={t("valuePlaceholder")}
          onChange={(event) => {
            const raw = event.target.value;
            if (raw === "") {
              onValueChange(null);
              return;
            }
            const parsed = Number.parseFloat(raw);
            if (!Number.isNaN(parsed)) onValueChange(parsed);
          }}
          className="h-7 pr-5 text-right text-[0.8rem] tabular-nums"
        />
        {suffix ? (
          <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </div>

      {onRemove ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("removeSecondary")}
          title={tCommon("remove")}
          onClick={onRemove}
          className="shrink-0 text-muted-foreground hover:text-destructive"
        >
          <XIcon className="size-3.5" />
        </Button>
      ) : null}
    </div>
  );
}
