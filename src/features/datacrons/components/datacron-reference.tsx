"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { CheckIcon, PlusIcon } from "lucide-react";

import { perkKey } from "@/features/datacrons/domain/datacron";
import { cn } from "@/lib/utils";
import type {
  DatacronAbility,
  DatacronPerk,
  DatacronSet,
  DatacronStatOption,
} from "@/types";

/** Groups a list by its numeric `level`, ascending. */
function groupByLevel<T extends { level: number }>(items: T[]): [number, T[]][] {
  const map = new Map<number, T[]>();
  for (const item of items) {
    const bucket = map.get(item.level);
    if (bucket) bucket.push(item);
    else map.set(item.level, [item]);
  }
  return [...map.entries()].sort(([a], [b]) => a - b);
}

function abilityPerk(ability: DatacronAbility): DatacronPerk {
  return {
    level: ability.level,
    kind: "ability",
    text: `${ability.focus} — ${ability.text}`,
  };
}

function statPerk(stat: DatacronStatOption): DatacronPerk {
  return {
    level: stat.level,
    kind: "stat",
    text: `${stat.stat} ${stat.value}`.trim(),
  };
}

/**
 * Reference for the selected datacron set: its focus abilities (levels 3/6/9)
 * and rollable stat pool. Each entry is a toggle — picking it adds that perk to
 * the member's datacron, where it renders per level in the exported template.
 */
export function DatacronReference({
  set,
  selected,
  onToggle,
}: {
  set: DatacronSet;
  selected: DatacronPerk[];
  onToggle: (perk: DatacronPerk) => void;
}) {
  const t = useTranslations("Datacron");

  const abilityGroups = useMemo(
    () => groupByLevel(set.abilities ?? []),
    [set.abilities],
  );
  const statGroups = useMemo(
    () => groupByLevel(set.statPool ?? []),
    [set.statPool],
  );
  const selectedKeys = useMemo(
    () => new Set(selected.map(perkKey)),
    [selected],
  );

  if (abilityGroups.length === 0 && statGroups.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">
          {t("reference")}
        </span>
        <span className="text-[0.65rem] text-muted-foreground">
          {t("pickHint")}
        </span>
      </div>

      {abilityGroups.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
            {t("abilities")}
          </span>
          {abilityGroups.map(([level, abilities]) => (
            <div key={level} className="flex flex-col gap-1">
              <span className="text-[0.65rem] font-semibold text-primary/80 tabular-nums">
                {t("levelShort", { level })}
              </span>
              <div className="flex flex-col gap-1">
                {abilities.map((ability, index) => {
                  const perk = abilityPerk(ability);
                  const active = selectedKeys.has(perkKey(perk));
                  return (
                    <button
                      key={`${ability.focus}-${index}`}
                      type="button"
                      aria-pressed={active}
                      onClick={() => onToggle(perk)}
                      className={cn(
                        "flex items-start gap-1.5 rounded-md border px-1.5 py-1 text-left text-xs transition-colors",
                        active
                          ? "border-primary/40 bg-primary/10"
                          : "border-transparent hover:border-border/60 hover:bg-background",
                      )}
                    >
                      <span className="mt-0.5 shrink-0 text-muted-foreground">
                        {active ? (
                          <CheckIcon className="size-3 text-primary" />
                        ) : (
                          <PlusIcon className="size-3" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="font-medium text-foreground">
                          {ability.focus}
                        </span>
                        <span className="text-muted-foreground">
                          {" "}
                          — {ability.text}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {statGroups.length > 0 ? (
        <div className="flex flex-col gap-2">
          <span className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
            {t("statPool")}
          </span>
          {statGroups.map(([level, stats]) => (
            <div key={level} className="flex flex-wrap items-center gap-1">
              <span className="mr-0.5 text-[0.65rem] font-semibold text-primary/80 tabular-nums">
                {t("levelShort", { level })}
              </span>
              {stats.map((stat, index) => {
                const perk = statPerk(stat);
                const active = selectedKeys.has(perkKey(perk));
                return (
                  <button
                    key={`${stat.stat}-${index}`}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onToggle(perk)}
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-[0.7rem] ring-1 transition-colors",
                      active
                        ? "bg-primary/10 text-foreground ring-primary/40"
                        : "bg-background text-muted-foreground ring-border/60 hover:text-foreground hover:ring-primary/40",
                    )}
                  >
                    {stat.stat}
                    {stat.value ? (
                      <span className="ml-1 font-medium tabular-nums">
                        {stat.value}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
