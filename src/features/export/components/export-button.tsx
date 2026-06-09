"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ImageDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Squad } from "@/types";
import { ExportPreviewDialog } from "./export-preview-dialog";

export function ExportButton({ squad }: { squad: Squad }) {
  const t = useTranslations("Export");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <ImageDownIcon className="size-4" />
        <span className="hidden sm:inline">{t("button")}</span>
      </Button>
      <ExportPreviewDialog squad={squad} open={open} onOpenChange={setOpen} />
    </>
  );
}
