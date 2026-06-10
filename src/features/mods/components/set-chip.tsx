"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { MOD_SET_DEFINITIONS } from "@/features/mods/constants/set-definitions";
import type { ModSetId } from "@/types";

/**
 * A colour-coded mod-set badge (label + piece count). `variant` switches the
 * palette between the in-app editor (theme aware) and the export card (always
 * on a dark background).
 */
export function SetChip({
  set,
  variant = "app",
  className,
}: {
  set: ModSetId;
  variant?: "app" | "export";
  className?: string;
}) {
  const t = useTranslations("Sets");
  const definition = MOD_SET_DEFINITIONS[set];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.7rem] font-medium leading-tight ring-1",
        variant === "export"
          ? definition.exportChipClass
          : definition.chipClass,
        className,
      )}
    >
      <span className="truncate">{t(`names.${set}`)}</span>
      <span className="opacity-70 tabular-nums">
        {t("pieces", { count: definition.pieces })}
      </span>
    </span>
  );
}
