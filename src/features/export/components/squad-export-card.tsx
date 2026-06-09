"use client";

import { forwardRef } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { SwordsIcon } from "lucide-react";

import { CharacterAvatar } from "@/features/characters/components/character-avatar";
import { SlotIcon } from "@/features/mods/components/slot-icon";
import { MOD_DEFINITION_LIST } from "@/features/mods/constants/mod-definitions";
import { characterService } from "@/services/character-service";
import type { ModSlotConfig, Squad, SquadMember } from "@/types";
import { formatStatValue } from "@/utils/format";

/** Fixed export width — the card height grows with the number of members. */
export const EXPORT_WIDTH = 1600;

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
      <div className="flex items-center gap-2 text-zinc-400">
        <SlotIcon slot={slotKey.id} className="size-4" />
        <span className="text-xs font-semibold tracking-wide uppercase">
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

function MemberPanel({ member }: { member: SquadMember }) {
  const t = useTranslations("Export");
  const tDatacron = useTranslations("Datacron");
  const character = member.characterId
    ? characterService.getById(member.characterId)
    : undefined;

  return (
    <div className="flex flex-col gap-5 rounded-3xl bg-zinc-900/70 p-6 ring-1 ring-white/10">
      <div className="flex gap-6">
        {/* Identity */}
        <div className="flex w-65 shrink-0 flex-col gap-3">
          {character ? (
            <>
              <CharacterAvatar
                character={character}
                className="size-24 rounded-3xl ring-2 ring-white/10"
              />
              <div>
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
            <div className="flex h-24 items-center text-xl font-medium text-zinc-600">
              {t("emptySlot")}
            </div>
          )}
        </div>

        {/* Mods */}
        <div className="grid flex-1 grid-cols-6 gap-3">
          {MOD_DEFINITION_LIST.map((definition) => (
            <MemberModTile
              key={definition.id}
              slotKey={definition}
              config={member.mods[definition.id]}
            />
          ))}
        </div>
      </div>

      {member.datacronNotes.trim() ? (
        <div className="rounded-2xl bg-indigo-500/5 px-5 py-3 ring-1 ring-indigo-400/20">
          <p className="text-xs font-semibold tracking-wide text-indigo-300/80 uppercase">
            {tDatacron("label")}
          </p>
          <p className="mt-1 text-sm whitespace-pre-wrap text-zinc-300">
            {member.datacronNotes}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export const SquadExportCard = forwardRef<HTMLDivElement, { squad: Squad }>(
  function SquadExportCard({ squad }, ref) {
    const t = useTranslations("Export");
    const tApp = useTranslations("App");
    const tSquads = useTranslations("Squads");
    const format = useFormatter();

    return (
      <div
        ref={ref}
        style={{ width: EXPORT_WIDTH }}
        className="flex flex-col gap-6 bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-12 font-sans text-white"
      >
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

        {/* Members */}
        <div className="flex flex-col gap-5">
          {squad.members.map((member, index) => (
            <MemberPanel key={index} member={member} />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 pt-5 text-xs text-zinc-500">
          <span>{t("generatedWith", { app: tApp("title") })}</span>
          <span>{tApp("subtitle")}</span>
        </div>
      </div>
    );
  },
);
