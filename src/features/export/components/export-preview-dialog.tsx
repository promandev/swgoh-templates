"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { DownloadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LoadingOverlay, Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BACKGROUND_PRESETS,
  getBackgroundPreset,
} from "@/features/export/constants/backgrounds";
import { useIsMobile } from "@/hooks/use-media-query";
import { useSquadStore } from "@/stores/squad-store";
import type { Squad } from "@/types";
import { toFileSlug } from "@/utils/download";
import { useExport } from "../hooks/use-export";
import { EXPORT_LAYOUTS, SquadExportCard } from "./squad-export-card";

export function ExportPreviewDialog({
  squad,
  open,
  onOpenChange,
}: {
  squad: Squad;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Export");
  const tBackgrounds = useTranslations("Backgrounds");
  const tCommon = useTranslations("Common");
  const { exportPng, isExporting } = useExport();
  const setSquadBackground = useSquadStore((s) => s.setSquadBackground);

  // Background names are looked up dynamically; cast to the translator's key type.
  const bgName = (key: string) =>
    tBackgrounds(key as Parameters<typeof tBackgrounds>[0]);

  const isMobile = useIsMobile();
  const layout = isMobile ? "mobile" : "desktop";
  const layoutWidth = EXPORT_LAYOUTS[layout].width;
  const activeBackground = getBackgroundPreset(squad.background);

  const cardRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  const [naturalHeight, setNaturalHeight] = useState(0);

  // Fit the full-size card into the preview viewport for the active layout.
  // A ResizeObserver keeps the scale/height in sync as the card's real height
  // settles (late-loading avatars, added sets/target stats) and as the dialog
  // resizes, so the absolutely-positioned card never spills out of its frame.
  useEffect(() => {
    if (!open) return;
    const measure = () => {
      const viewport = viewportRef.current;
      const card = cardRef.current;
      if (!viewport || !card) return;
      const available = viewport.clientWidth - 24;
      if (available > 0) setScale(Math.min(1, available / layoutWidth));
      setNaturalHeight(card.scrollHeight);
    };
    const frame = requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    if (viewportRef.current) observer.observe(viewportRef.current);
    if (cardRef.current) observer.observe(cardRef.current);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [open, squad, layoutWidth]);

  async function handleDownload() {
    if (!cardRef.current) return;
    try {
      await exportPng(
        cardRef.current,
        `swgoh-${toFileSlug(squad.name)}`,
        squad.id,
      );
      toast.success(t("downloaded"));
      onOpenChange(false);
    } catch {
      toast.error(t("error"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(64rem,calc(100vw-2rem))] max-w-[min(64rem,calc(100vw-2rem))] sm:max-w-[min(64rem,calc(100vw-2rem))]">
        <DialogHeader>
          <DialogTitle>{t("previewTitle")}</DialogTitle>
          <DialogDescription>{t("previewDescription")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">
            {tBackgrounds("label")}
          </Label>
          <Select
            value={activeBackground.id}
            items={Object.fromEntries(
              BACKGROUND_PRESETS.map((preset) => [
                preset.id,
                bgName(preset.nameKey),
              ]),
            )}
            onValueChange={(value) => {
              if (value) setSquadBackground(squad.id, value as string);
            }}
          >
            <SelectTrigger className="w-full max-w-xs sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BACKGROUND_PRESETS.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  <span
                    className="size-4 shrink-0 rounded-full ring-1 ring-white/20"
                    style={{ background: preset.gradient }}
                  />
                  {bgName(preset.nameKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative">
          <div
            ref={viewportRef}
            className="max-h-[56vh] overflow-x-hidden overflow-y-auto rounded-xl bg-zinc-950 p-3"
          >
            <div
              className="relative mx-auto overflow-hidden"
              style={{
                width: layoutWidth * scale,
                height: naturalHeight * scale || undefined,
              }}
            >
              <div
                style={{
                  width: layoutWidth,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  position: "absolute",
                  top: 0,
                  left: 0,
                }}
              >
                <SquadExportCard ref={cardRef} squad={squad} layout={layout} />
              </div>
            </div>
          </div>
          {isExporting ? <LoadingOverlay label={t("generating")} /> : null}
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            {tCommon("cancel")}
          </DialogClose>
          <Button onClick={handleDownload} disabled={isExporting}>
            {isExporting ? <Spinner size="sm" /> : <DownloadIcon className="size-4" />}
            {t("download")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
