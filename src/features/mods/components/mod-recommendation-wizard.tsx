"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SetChip } from "@/features/mods/components/set-chip";
import { SlotIcon } from "@/features/mods/components/slot-icon";
import { isFixedPrimarySlot, MOD_SLOT_IDS } from "@/features/mods/constants/mod-rules";
import type { ChosenPrimaries } from "@/features/mods/domain/recommendation";
import { modRecommendationService } from "@/services/mod-recommendation-service";
import { useSquadStore } from "@/stores/squad-store";
import { cn } from "@/lib/utils";
import type { ModSlotId } from "@/types";

/** Variable-primary slots, in canonical order (arrow → cross). */
const VARIABLE_SLOTS: readonly ModSlotId[] = MOD_SLOT_IDS.filter(
  (slot) => !isFixedPrimarySlot(slot),
);

function pct(usage: number): number {
  return Math.round(usage * 100);
}

/**
 * Two-step assistant that proposes the most-used mod meta for a character — set
 * loadouts (step 1) and per-slot primaries (step 2), each with its usage share —
 * and writes the picked combination onto the member. Everything stays editable
 * in the row afterwards; the wizard is optional and only opens on demand.
 */
export function ModRecommendationWizard({
  squadId,
  index,
  characterId,
  characterName,
  open,
  onOpenChange,
}: {
  squadId: string;
  index: number;
  characterId: string;
  characterName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Recommendations");
  const tSlots = useTranslations("Slots");
  const tStats = useTranslations("Stats");
  const tToasts = useTranslations("Toasts");

  const applyRecommendation = useSquadStore((s) => s.applyRecommendation);
  const recommendation = modRecommendationService.get(characterId);

  const slotsWithData = useMemo(
    () =>
      VARIABLE_SLOTS.filter(
        (slot) => (recommendation?.primaryOptions[slot]?.length ?? 0) > 0,
      ),
    [recommendation],
  );

  // Start on step 1 (sets) when there is set data, otherwise jump to primaries.
  const [step, setStep] = useState<1 | 2>(() =>
    (recommendation?.setOptions.length ?? 0) > 0 ? 1 : 2,
  );
  // Pre-select the meta: the most-used loadout and the top primary per slot.
  const [setIndex, setSetIndex] = useState(0);
  const [primaries, setPrimaries] = useState<ChosenPrimaries>(() => {
    const initial: ChosenPrimaries = {};
    for (const slot of slotsWithData) {
      const top = recommendation?.primaryOptions[slot]?.[0];
      if (top) initial[slot] = top.stat;
    }
    return initial;
  });

  if (!recommendation) return null;

  const setOptions = recommendation.setOptions;
  const hasSets = setOptions.length > 0;
  const hasPrimaries = slotsWithData.length > 0;
  // Step 2 only matters when there are primaries; otherwise step 1 is terminal.
  const lastStep: 1 | 2 = hasPrimaries ? 2 : 1;

  function handleApply() {
    applyRecommendation(squadId, index, {
      sets: hasSets ? setOptions[setIndex]?.sets : undefined,
      primaries: hasPrimaries ? primaries : undefined,
    });
    toast.success(tToasts("recommendationsApplied", { name: characterName }));
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title", { name: characterName })}</DialogTitle>
          <DialogDescription>
            {step === 1 ? t("step1Description") : t("step2Description")}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className={cn(step === 1 && "text-foreground")}>
            {t("step1Label")}
          </span>
          {hasPrimaries ? (
            <>
              <ArrowRightIcon className="size-3" />
              <span className={cn(step === 2 && "text-foreground")}>
                {t("step2Label")}
              </span>
            </>
          ) : null}
        </div>

        <div className="max-h-[55vh] overflow-y-auto">
          {step === 1 ? (
            <div className="flex flex-col gap-2">
              {hasSets ? (
                setOptions.map((option, i) => {
                  const selected = i === setIndex;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSetIndex(i)}
                      aria-pressed={selected}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition",
                        selected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border/60 hover:bg-muted/50",
                      )}
                    >
                      <span className="flex flex-wrap items-center gap-1.5">
                        {option.sets.map((set, si) => (
                          <SetChip key={`${set}-${si}`} set={set} />
                        ))}
                      </span>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
                        {t("usage", { percent: pct(option.usage) })}
                      </span>
                    </button>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">{t("noSets")}</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {slotsWithData.map((slot) => (
                <div key={slot} className="flex flex-col gap-1.5">
                  <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <SlotIcon slot={slot} className="size-4" />
                    {tSlots(`${slot}.name`)}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {recommendation.primaryOptions[slot]?.map((option, i) => {
                      const selected = primaries[slot] === option.stat;
                      return (
                        <button
                          key={`${option.stat}-${i}`}
                          type="button"
                          onClick={() =>
                            setPrimaries((prev) => ({
                              ...prev,
                              [slot]: option.stat,
                            }))
                          }
                          aria-pressed={selected}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm transition",
                            selected
                              ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                              : "border-border/60 hover:bg-muted/50",
                          )}
                        >
                          <span>{tStats(option.stat)}</span>
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {t("usage", { percent: pct(option.usage) })}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <DialogClose render={<Button variant="ghost" />}>
            {t("skip")}
          </DialogClose>
          <div className="flex gap-2">
            {step === 2 && hasSets ? (
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeftIcon className="size-4" />
                {t("back")}
              </Button>
            ) : null}
            {step < lastStep ? (
              <Button onClick={() => setStep(2)} disabled={!hasSets}>
                {t("next")}
                <ArrowRightIcon className="size-4" />
              </Button>
            ) : (
              <Button onClick={handleApply}>
                <CheckIcon className="size-4" />
                {t("apply")}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
