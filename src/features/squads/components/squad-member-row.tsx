"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CharacterCombobox } from "@/features/characters/components/character-combobox";
import { DatacronField } from "@/features/datacrons/components/datacron-field";
import { ModCell } from "@/features/mods/components/mod-cell";
import { SlotIcon } from "@/features/mods/components/slot-icon";
import { MOD_SLOT_IDS } from "@/features/mods/constants/mod-rules";
import { characterService } from "@/services/character-service";
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

  const setMemberCharacter = useSquadStore((s) => s.setMemberCharacter);
  const setMemberMod = useSquadStore((s) => s.setMemberMod);
  const setMemberDatacron = useSquadStore((s) => s.setMemberDatacron);

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
                const character = characterService.getById(characterId);
                if (character) {
                  toast.success(
                    tToasts("characterSet", { name: character.name }),
                  );
                }
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
          value={member.datacronNotes}
          onChange={(value) => setMemberDatacron(squadId, index, value)}
        />
      </div>
    </motion.div>
  );
}
