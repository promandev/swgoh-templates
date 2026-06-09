"use client";

import { AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SlotIcon } from "@/features/mods/components/slot-icon";
import { MOD_SLOT_IDS } from "@/features/mods/constants/mod-rules";
import type { Squad } from "@/types";
import { SquadMemberRow } from "./squad-member-row";

const GRID_COLUMNS =
  "md:grid-cols-[minmax(180px,200px)_repeat(6,minmax(116px,1fr))_minmax(150px,180px)]";

export function SquadTable({ squad }: { squad: Squad }) {
  const t = useTranslations("Builder");
  const tSlots = useTranslations("Slots");

  return (
    <div className="glass overflow-x-auto rounded-2xl p-2 sm:p-3">
      <div className="md:min-w-[60rem]">
        {/* Desktop column header */}
        <div
          role="row"
          className={`hidden gap-2 border-b border-border/60 px-2 pb-2 text-xs font-medium text-muted-foreground md:grid ${GRID_COLUMNS}`}
        >
          <span className="flex items-center">{t("columnCharacter")}</span>
          {MOD_SLOT_IDS.map((slot) => (
            <Tooltip key={slot}>
              <TooltipTrigger
                render={
                  <span
                    tabIndex={0}
                    className="flex cursor-default items-center justify-center gap-1 rounded-md py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                }
              >
                <SlotIcon slot={slot} className="size-3.5" />
                <span>{tSlots(`${slot}.name`)}</span>
              </TooltipTrigger>
              <TooltipContent>{tSlots(`${slot}.tooltip`)}</TooltipContent>
            </Tooltip>
          ))}
          <span className="flex items-center justify-end">
            {t("columnDatacron")}
          </span>
        </div>

        {/* Rows */}
        <div role="rowgroup" className="flex flex-col gap-3 pt-3 md:gap-0 md:pt-0">
          <AnimatePresence initial={false}>
            {squad.members.map((member, index) => (
              <SquadMemberRow
                key={index}
                squadId={squad.id}
                index={index}
                member={member}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
