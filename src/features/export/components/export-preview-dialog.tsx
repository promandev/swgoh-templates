"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { DownloadIcon, Loader2Icon } from "lucide-react";

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
import type { Squad } from "@/types";
import { toFileSlug } from "@/utils/download";
import { useExport } from "../hooks/use-export";
import { EXPORT_WIDTH, SquadExportCard } from "./squad-export-card";

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
  const tCommon = useTranslations("Common");
  const { exportPng, isExporting } = useExport();

  const cardRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  const [naturalHeight, setNaturalHeight] = useState(0);

  // Fit the full-size (1600px) card into the preview viewport.
  useEffect(() => {
    if (!open) return;
    const measure = () => {
      const viewport = viewportRef.current;
      const card = cardRef.current;
      if (!viewport || !card) return;
      const available = viewport.clientWidth - 24;
      setScale(Math.min(1, available / EXPORT_WIDTH));
      setNaturalHeight(card.scrollHeight);
    };
    const frame = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
    };
  }, [open, squad]);

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
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>{t("previewTitle")}</DialogTitle>
          <DialogDescription>{t("previewDescription")}</DialogDescription>
        </DialogHeader>

        <div
          ref={viewportRef}
          className="max-h-[62vh] overflow-auto rounded-xl bg-zinc-950 p-3"
        >
          <div
            className="relative mx-auto"
            style={{
              width: EXPORT_WIDTH * scale,
              height: naturalHeight * scale || undefined,
            }}
          >
            <div
              style={{
                width: EXPORT_WIDTH,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                position: "absolute",
                top: 0,
                left: 0,
              }}
            >
              <SquadExportCard ref={cardRef} squad={squad} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            {tCommon("cancel")}
          </DialogClose>
          <Button onClick={handleDownload} disabled={isExporting}>
            {isExporting ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <DownloadIcon className="size-4" />
            )}
            {t("download")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
