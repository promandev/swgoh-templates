"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { SparklesIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CharacterCombobox } from "@/features/characters/components/character-combobox";
import { DatacronField } from "@/features/datacrons/components/datacron-field";
import { ModCell } from "@/features/mods/components/mod-cell";
import { ModRecommendationWizard } from "@/features/mods/components/mod-recommendation-wizard";
import { SetSelector } from "@/features/mods/components/set-selector";
import { SlotIcon } from "@/features/mods/components/slot-icon";
import { TargetStatsField } from "@/features/mods/components/target-stats-field";
import { MOD_SLOT_IDS } from "@/features/mods/constants/mod-rules";
import { characterService } from "@/services/character-service";
import { modRecommendationService } from "@/services/mod-recommendation-service";
import { useSquadStore } from "@/stores/squad-store";
import type { SquadMember } from "@/types";

export function SquadMemberRow({
  squadId,
  index,
  member,
}: {
  squadId: string;
  index: number;
  member: SquadMember;
}) {
  const t = useTranslations("Builder");
  const tSlots = useTranslations("Slots");
  const tCharacter = useTranslations("Character");
  const tToasts = useTranslations("Toasts");
  const tRecommendations = useTranslations("Recommendations");

  const [wizardOpen, setWizardOpen] = useState(false);
  const character = member.characterId
    ? characterService.getById(member.characterId)
    : undefined;
  const hasRecommendation = modRecommendationService.hasRecommendation(
    member.characterId,
  );

  const setMemberCharacter = useSquadStore((s) => s.setMemberCharacter);
  const setMemberMod = useSquadStore((s) => s.setMemberMod);
  const setMemberDatacron = useSquadStore((s) => s.setMemberDatacron);
  const setMemberSets = useSquadStore((s) => s.setMemberSets);
  const setMemberTargetStats = useSquadStore((s) => s.setMemberTargetStats);

  const characterInputId = `character-${squadId}-${index}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      role="row"
      className="grid gap-3 rounded-2xl border border-border/60 bg-card/50 p-3 shadow-sm md:grid-cols-[minmax(180px,200px)_repeat(6,minmax(116px,1fr))_minmax(150px,180px)] md:items-stretch md:gap-2 md:rounded-none md:border-0 md:border-b md:border-border/40 md:bg-transparent md:p-2 md:shadow-none"
    >
      {/* Character */}
      <div className="flex flex-col gap-1.5 md:justify-center">
        <span className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground md:hidden">
          {t("memberLabel", { index: index + 1 })}
        </span>
        <div className="flex items-center gap-1.5">
          <div className="min-w-0 flex-1">
            <CharacterCombobox
              id={characterInputId}
              value={member.characterId}
              onChange={(characterId) => {
                setMemberCharacter(squadId, index, characterId);
                const next = characterService.getById(characterId);
                if (next) {
                  toast.success(tToasts("characterSet", { name: next.name }));
                }
                // Open the wizard automatically when the new character has a
                // recommendation meta; otherwise it stays closed for manual entry.
                setWizardOpen(
                  modRecommendationService.hasRecommendation(characterId),
                );
              }}
            />
          </div>
          {member.characterId ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={tCharacter("clear")}
              title={tCharacter("clear")}
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => {
                setMemberCharacter(squadId, index, null);
                toast(tToasts("characterCleared"));
              }}
            >
              <XIcon className="size-4" />
            </Button>
          ) : null}
        </div>

        {member.characterId && hasRecommendation ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 self-start border-dashed text-xs text-muted-foreground"
            onClick={() => setWizardOpen(true)}
          >
            <SparklesIcon className="size-3.5" />
            {tRecommendations("open")}
          </Button>
        ) : null}

        {member.characterId && character ? (
          <ModRecommendationWizard
            key={member.characterId}
            squadId={squadId}
            index={index}
            characterId={member.characterId}
            characterName={character.name}
            open={wizardOpen}
            onOpenChange={setWizardOpen}
          />
        ) : null}
      </div>

      {/* Mods — children flow into the table grid on desktop via md:contents */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:contents">
        {MOD_SLOT_IDS.map((slot) => (
          <div
            key={slot}
            role="cell"
            className="flex flex-col gap-1 md:justify-center md:px-0.5"
          >
            <span className="flex items-center gap-1 text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground md:hidden">
              <SlotIcon slot={slot} className="size-3" />
              {tSlots(`${slot}.name`)}
            </span>
            <ModCell
              slot={slot}
              config={member.mods[slot]}
              onChange={(config) => setMemberMod(squadId, index, slot, config)}
            />
          </div>
        ))}
      </div>

      {/* Datacron */}
      <div className="flex flex-col gap-1.5 md:justify-center">
        <span className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground md:hidden">
          {t("columnDatacron")}
        </span>
        <DatacronField
          fieldId={`datacron-${squadId}-${index}`}
          value={member.datacron}
          onChange={(datacron) => setMemberDatacron(squadId, index, datacron)}
        />
      </div>

      {/* Sets + target stats — spans the full table width below the row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-8 md:col-span-full md:mt-1 md:border-t md:border-border/30 md:pt-2.5">
        <SetSelector
          value={member.sets}
          onChange={(sets) => setMemberSets(squadId, index, sets)}
        />
        <div className="sm:max-w-xs sm:flex-1">
          <TargetStatsField
            value={member.targetStats}
            onChange={(targetStats) =>
              setMemberTargetStats(squadId, index, targetStats)
            }
          />
        </div>
      </div>
    </motion.div>
  );
}
