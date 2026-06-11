"use client";

import { forwardRef } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { SwordsIcon } from "lucide-react";

import { CharacterAvatar } from "@/features/characters/components/character-avatar";
import {
  activeLevels,
  getTier,
  hasDatacronContent,
} from "@/features/datacrons/domain/datacron";
import { SetChip } from "@/features/mods/components/set-chip";
import { SlotIcon } from "@/features/mods/components/slot-icon";
import { MOD_DEFINITION_LIST } from "@/features/mods/constants/mod-definitions";
import { isPercentStat } from "@/features/mods/constants/mod-rules";
import { getBackgroundPreset } from "@/features/export/constants/backgrounds";
import { characterService } from "@/services/character-service";
import { cn } from "@/lib/utils";
import type { ModSlotConfig, Squad, SquadMember } from "@/types";
import { formatStatValue } from "@/utils/format";

export type ExportLayout = "desktop" | "mobile";

interface LayoutConfig {
  /** Fixed render width; the height grows with the member count. */
  width: number;
  /** Tailwind class for the card grid (how many character cards per row). */
  memberGridClass: string;
  /** Tailwind class for the mod grid column count inside a card. */
  modGridClass: string;
}

/**
 * Two export layouts for the infographic. Each member is a self-contained card;
 * desktop tiles two cards per row at full share width, mobile stacks one per row
 * so text stays legible on a phone screen.
 */
export const EXPORT_LAYOUTS: Record<ExportLayout, LayoutConfig> = {
  desktop: { width: 1600, memberGridClass: "grid-cols-2", modGridClass: "grid-cols-3" },
  mobile: { width: 760, memberGridClass: "grid-cols-1", modGridClass: "grid-cols-2" },
};

/** Back-compat alias used by the preview's default scale math. */
export const EXPORT_WIDTH = EXPORT_LAYOUTS.desktop.width;

function MemberModTile({
  config,
  slotKey,
}: {
  config: ModSlotConfig;
  slotKey: (typeof MOD_DEFINITION_LIST)[number];
}) {
  const tStats = useTranslations("Stats");
  const tSlots = useTranslations("Slots");
  const filledSecondaries = config.secondaries.filter((line) => line.stat);

  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-zinc-950/60 p-4 ring-1 ring-white/10">
      <div className="flex items-center gap-2 text-indigo-300">
        <SlotIcon slot={slotKey.id} className="size-6" />
        <span className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">
          {tSlots(slotKey.nameKey)}
        </span>
      </div>

      {config.primary.stat ? (
        <div className="rounded-xl bg-indigo-500/15 px-3 py-2 ring-1 ring-indigo-400/30">
          <p className="text-[0.7rem] font-medium tracking-wide text-indigo-300/80 uppercase">
            {tStats(config.primary.stat)}
          </p>
          <p className="text-lg leading-tight font-semibold text-indigo-200 tabular-nums">
            {formatStatValue(config.primary.stat, config.primary.value) || "—"}
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-white/5 px-3 py-2 text-sm text-zinc-500">
          —
        </div>
      )}

      <div className="flex flex-col gap-1">
        {filledSecondaries.length > 0 ? (
          filledSecondaries.map((line, index) => (
            <div
              key={`${line.stat}-${index}`}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span className="truncate text-zinc-400">
                {line.stat ? tStats(line.stat) : ""}
              </span>
              <span className="shrink-0 font-medium text-zinc-200 tabular-nums">
                {formatStatValue(line.stat, line.value)}
              </span>
            </div>
          ))
        ) : (
          <span className="text-sm text-zinc-600">·</span>
        )}
      </div>
    </div>
  );
}

function MemberPanel({
  member,
  layout,
}: {
  member: SquadMember;
  layout: LayoutConfig;
}) {
  const t = useTranslations("Export");
  const tDatacron = useTranslations("Datacron");
  const tSets = useTranslations("Sets");
  const tTargets = useTranslations("TargetStats");
  const tStats = useTranslations("Stats");
  const character = member.characterId
    ? characterService.getById(member.characterId)
    : undefined;

  const targetStats = member.targetStats.filter(
    (line) => line.stat && line.value !== null,
  );
  const hasGoals = member.sets.length > 0 || targetStats.length > 0;

  return (
    <div className="flex h-full flex-col gap-5 rounded-3xl bg-zinc-900/70 p-6 ring-1 ring-white/10">
      {/* Identity — banner across the top of the card */}
      <div className="flex items-center gap-4 border-b border-white/10 pb-4">
        {character ? (
          <>
            <CharacterAvatar
              character={character}
              className="size-20 shrink-0 rounded-3xl ring-2 ring-indigo-400/30"
            />
            <div className="min-w-0">
              <p className="text-2xl leading-tight font-semibold text-white">
                {character.name}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {character.factions.slice(0, 3).map((faction) => (
                  <span
                    key={faction}
                    className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-zinc-400"
                  >
                    {faction}
                  </span>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-20 items-center text-xl font-medium text-zinc-600">
            {t("emptySlot")}
          </div>
        )}
      </div>

      {/* Mods */}
      <div className={cn("grid gap-3", layout.modGridClass)}>
        {MOD_DEFINITION_LIST.map((definition) => (
          <MemberModTile
            key={definition.id}
            slotKey={definition}
            config={member.mods[definition.id]}
          />
        ))}
      </div>

      {hasGoals ? (
        <div className="flex flex-wrap items-start gap-x-10 gap-y-3 rounded-2xl bg-white/5 px-5 py-3 ring-1 ring-white/10">
          {member.sets.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">
                {tSets("label")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {member.sets.map((set, index) => (
                  <SetChip
                    key={`${set}-${index}`}
                    set={set}
                    variant="export"
                    className="px-2.5 py-1 text-sm"
                  />
                ))}
              </div>
            </div>
          ) : null}

          {targetStats.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">
                {tTargets("label")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {targetStats.map((line, index) => (
                  <span
                    key={`${line.stat}-${index}`}
                    className="inline-flex items-center gap-1.5 rounded-md bg-zinc-950/50 px-2.5 py-1 text-sm ring-1 ring-white/10"
                  >
                    <span className="text-zinc-400">
                      {line.stat ? tStats(line.stat) : ""}
                    </span>
                    <span className="font-semibold text-zinc-100 tabular-nums">
                      {line.value}
                      {line.stat && isPercentStat(line.stat) ? "%" : ""}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {hasDatacronContent(member.datacron) ? (
        <div className="rounded-2xl bg-indigo-500/5 px-5 py-3 ring-1 ring-indigo-400/20">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold tracking-wide text-indigo-300/80 uppercase">
              {tDatacron("label")}
            </p>
            {member.datacron.setName ? (
              <span className="text-sm font-medium text-white">
                {member.datacron.setName}
              </span>
            ) : null}
            {activeLevels(member.datacron).length > 0 ? (
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-zinc-300 tabular-nums">
                {activeLevels(member.datacron).join(" · ")}
              </span>
            ) : null}
            {member.datacron.focused ? (
              <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-xs font-medium text-indigo-200">
                {tDatacron("focused")}
                {member.datacron.focusedLevel
                  ? ` ${member.datacron.focusedLevel}`
                  : ""}
              </span>
            ) : null}
          </div>

          {(member.datacron.perks?.length ?? 0) > 0 ? (
            <div className="mt-2 flex flex-col gap-0.5">
              {(member.datacron.perks ?? []).map((perk, index) => (
                <p key={`${perk.level}-${index}`} className="text-sm text-zinc-300">
                  <span className="text-zinc-500 tabular-nums">
                    {tDatacron("levelShort", { level: perk.level })}:{" "}
                  </span>
                  {perk.text}
                </p>
              ))}
            </div>
          ) : null}

          {activeLevels(member.datacron).some((level) =>
            getTier(member.datacron, level)?.recommendedSecondaries.trim(),
          ) ? (
            <div className="mt-2 flex flex-col gap-0.5">
              {activeLevels(member.datacron).map((level) => {
                const recommended = getTier(
                  member.datacron,
                  level,
                )?.recommendedSecondaries.trim();
                if (!recommended) return null;
                return (
                  <p key={level} className="text-sm text-zinc-300">
                    <span className="text-zinc-500 tabular-nums">{level}: </span>
                    {recommended}
                  </p>
                );
              })}
            </div>
          ) : null}

          {member.datacron.notes.trim() ? (
            <p className="mt-2 text-sm whitespace-pre-wrap text-zinc-400">
              {member.datacron.notes}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export const SquadExportCard = forwardRef<
  HTMLDivElement,
  { squad: Squad; layout?: ExportLayout }
>(function SquadExportCard({ squad, layout = "desktop" }, ref) {
  const t = useTranslations("Export");
  const tApp = useTranslations("App");
  const tSquads = useTranslations("Squads");
  const format = useFormatter();

  const config = EXPORT_LAYOUTS[layout];
  const background = getBackgroundPreset(squad.background).gradient;

  return (
    <div
      ref={ref}
      style={{ width: config.width, background }}
      className="relative font-sans text-white"
    >
      {/* Scrim keeps text legible over any background gradient. */}
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative flex flex-col gap-6 p-12">
        {/* Header */}
        <div className="flex items-start justify-between gap-6 border-b border-white/10 pb-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-zinc-400">
              <span className="flex size-9 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-indigo-700 text-white">
                <SwordsIcon className="size-5" />
              </span>
              <span className="text-sm font-medium tracking-wide">
                {tApp("title")}
              </span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white">
              {squad.name || tSquads("untitled")}
            </h1>
          </div>
          <div className="text-right text-sm text-zinc-400">
            <p className="font-medium text-zinc-300">
              {tSquads("members", { count: squad.size })}
            </p>
            <p>
              {t("exportedOn", {
                date: format.dateTime(new Date(), { dateStyle: "long" }),
              })}
            </p>
          </div>
        </div>

        {/* Members — infographic card grid */}
        <div className={cn("grid items-stretch gap-5", config.memberGridClass)}>
          {squad.members.map((member, index) => (
            <MemberPanel key={index} member={member} layout={config} />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 pt-5 text-xs text-zinc-500">
          <span>{t("generatedWith", { app: tApp("title") })}</span>
          <span>{tApp("subtitle")}</span>
        </div>
      </div>
    </div>
  );
});
