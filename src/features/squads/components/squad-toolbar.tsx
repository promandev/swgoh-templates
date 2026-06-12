"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Trash2Icon, UsersIcon } from "lucide-react";

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
import { ExportButton } from "@/features/export/components/export-button";
import { cn } from "@/lib/utils";
import { useSquadStore } from "@/stores/squad-store";
import type { Squad, SquadSize } from "@/types";

const SIZE_OPTIONS: { value: SquadSize; labelKey: "sizeThree" | "sizeFive" }[] = [
  { value: 3, labelKey: "sizeThree" },
  { value: 5, labelKey: "sizeFive" },
];

export function SquadToolbar({ squad }: { squad: Squad }) {
  const t = useTranslations("Squads");
  const tCommon = useTranslations("Common");
  const tToasts = useTranslations("Toasts");
  const renameSquad = useSquadStore((s) => s.renameSquad);
  const setSquadSize = useSquadStore((s) => s.setSquadSize);
  const deleteSquad = useSquadStore((s) => s.deleteSquad);
  const [deleteOpen, setDeleteOpen] = useState(false);

  function changeSize(size: SquadSize) {
    if (size === squad.size) return;
    setSquadSize(squad.id, size);
    toast.success(tToasts("sizeChanged"));
  }

  return (
    <div className="glass flex flex-col gap-2 rounded-2xl p-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-3">
        <Label htmlFor={`squad-name-${squad.id}`} className="sr-only">
          {t("renamePlaceholder")}
        </Label>
        <Input
          id={`squad-name-${squad.id}`}
          value={squad.name}
          placeholder={t("renamePlaceholder")}
          onChange={(event) => renameSquad(squad.id, event.target.value)}
          className="h-9 max-w-sm text-base font-semibold"
        />
        <p className="hidden shrink-0 items-center gap-1.5 text-xs text-muted-foreground sm:flex">
          <UsersIcon className="size-3.5" />
          {t("members", { count: squad.size })}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div
          role="group"
          aria-label={t("sizeLabel")}
          className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-card/40 p-0.5"
        >
          {SIZE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => changeSize(option.value)}
              aria-pressed={squad.size === option.value}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                squad.size === option.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(option.labelKey)}
            </button>
          ))}
        </div>

        <ExportButton squad={squad} />

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogTrigger
            render={
              <Button
                variant="destructive"
                size="icon"
                aria-label={t("delete")}
                title={t("delete")}
              />
            }
          >
            <Trash2Icon className="size-4" />
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t("deleteTitle")}</DialogTitle>
              <DialogDescription>
                {t("deleteDescription", { name: squad.name || t("untitled") })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                {tCommon("cancel")}
              </DialogClose>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteSquad(squad.id);
                  setDeleteOpen(false);
                  toast.success(tToasts("squadDeleted"));
                }}
              >
                {t("delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
