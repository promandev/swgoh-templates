"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ScrollTextIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  activeLevels,
  getTier,
  hasDatacronContent,
  isLevelActive,
  setTierSecondaries,
  toggleTier,
} from "@/features/datacrons/domain/datacron";
import { datacronService } from "@/services/datacron-service";
import { DATACRON_LEVELS } from "@/types/datacron";
import type { MemberDatacron } from "@/types";

export function DatacronField({
  value,
  onChange,
  fieldId,
}: {
  value: MemberDatacron;
  onChange: (datacron: MemberDatacron) => void;
  fieldId: string;
}) {
  const t = useTranslations("Datacron");
  const tCommon = useTranslations("Common");
  const [open, setOpen] = useState(false);
  const sets = useMemo(() => datacronService.getSets(), []);

  const hasContent = hasDatacronContent(value);
  const levels = activeLevels(value);

  function update(partial: Partial<MemberDatacron>) {
    onChange({ ...value, ...partial });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            aria-label={t("title")}
            className={cn(
              "flex h-auto min-h-14 w-full items-start justify-start gap-2 p-2 text-left font-normal",
              !hasContent && "border-dashed text-muted-foreground",
            )}
          />
        }
      >
        <ScrollTextIcon className="mt-0.5 size-3.5 shrink-0 opacity-70" />
        {hasContent ? (
          <span className="flex min-w-0 flex-col gap-1">
            <span className="truncate text-xs font-medium">
              {value.setName || t("title")}
            </span>
            <span className="flex flex-wrap gap-1">
              {levels.length > 0 ? (
                <span className="rounded bg-muted px-1.5 py-0.5 text-[0.65rem] text-muted-foreground tabular-nums">
                  {levels.join(" · ")}
                </span>
              ) : null}
              {value.focused ? (
                <span className="rounded bg-primary/12 px-1.5 py-0.5 text-[0.65rem] font-medium text-primary">
                  {t("focused")}
                  {value.focusedLevel ? ` ${value.focusedLevel}` : ""}
                </span>
              ) : null}
            </span>
          </span>
        ) : (
          <span className="text-xs">{t("add")}</span>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto pr-1">
          {/* Set */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${fieldId}-set`} className="text-xs text-muted-foreground">
              {t("setLabel")}
            </Label>
            <div className="flex gap-2">
              <Input
                id={`${fieldId}-set`}
                value={value.setName}
                placeholder={t("setPlaceholder")}
                onChange={(event) =>
                  update({ setName: event.target.value, setId: "" })
                }
                className="h-9"
              />
              {sets.length > 0 ? (
                <Select
                  value={value.setId || null}
                  items={Object.fromEntries(sets.map((s) => [s.id, s.name]))}
                  onValueChange={(id) => {
                    const set = sets.find((s) => s.id === id);
                    if (set) update({ setId: set.id, setName: set.name });
                  }}
                >
                  <SelectTrigger aria-label={t("setPick")} className="h-9 w-40 shrink-0">
                    <SelectValue placeholder={t("setPick")} />
                  </SelectTrigger>
                  <SelectContent>
                    {sets.map((set) => (
                      <SelectItem key={set.id} value={set.id}>
                        {set.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
            </div>
          </div>

          {/* Levels */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">{t("levels")}</span>
            <div className="flex gap-1.5">
              {DATACRON_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  aria-pressed={isLevelActive(value, level)}
                  onClick={() => update({ tiers: toggleTier(value, level) })}
                  className={cn(
                    "flex-1 rounded-lg border py-1.5 text-sm font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isLevelActive(value, level)
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border/60 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Recommended secondaries per active level */}
          {levels.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              <span className="text-xs text-muted-foreground">
                {t("recommendedSecondaries")}
              </span>
              {levels.map((level) => (
                <div key={level} className="flex items-center gap-2">
                  <span className="w-12 shrink-0 text-xs font-medium text-muted-foreground tabular-nums">
                    {t("levelShort", { level })}
                  </span>
                  <Input
                    value={getTier(value, level)?.recommendedSecondaries ?? ""}
                    placeholder={t("secondariesPlaceholder")}
                    onChange={(event) =>
                      update({
                        tiers: setTierSecondaries(value, level, event.target.value),
                      })
                    }
                    className="h-8 text-sm"
                  />
                </div>
              ))}
            </div>
          ) : null}

          {/* Focused */}
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2">
            <button
              type="button"
              aria-pressed={value.focused}
              onClick={() =>
                update({
                  focused: !value.focused,
                  focusedLevel: value.focused ? null : value.focusedLevel,
                })
              }
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                value.focused
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {t("focused")}
            </button>
            {value.focused ? (
              <div className="flex items-center gap-2">
                <Label
                  htmlFor={`${fieldId}-focused`}
                  className="text-xs text-muted-foreground"
                >
                  {t("focusedLevel")}
                </Label>
                <Input
                  id={`${fieldId}-focused`}
                  type="number"
                  inputMode="numeric"
                  min={10}
                  max={20}
                  value={value.focusedLevel ?? ""}
                  onChange={(event) => {
                    const raw = event.target.value;
                    update({
                      focusedLevel: raw === "" ? null : Number.parseInt(raw, 10),
                    });
                  }}
                  className="h-8 w-20 text-right tabular-nums"
                />
              </div>
            ) : null}
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${fieldId}-notes`} className="text-xs text-muted-foreground">
              {t("notes")}
            </Label>
            <Textarea
              id={`${fieldId}-notes`}
              value={value.notes}
              placeholder={t("placeholder")}
              onChange={(event) => update({ notes: event.target.value })}
              rows={3}
              className="resize-none text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            {tCommon("done")}
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
