"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ScrollTextIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function DatacronField({
  value,
  onChange,
  fieldId,
}: {
  value: string;
  onChange: (value: string) => void;
  fieldId: string;
}) {
  const t = useTranslations("Datacron");
  const [open, setOpen] = useState(false);
  const hasValue = value.trim().length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            aria-label={t("label")}
            className={cn(
              "flex h-auto min-h-14 w-full items-start justify-start gap-2 p-2 text-left font-normal",
              !hasValue && "border-dashed text-muted-foreground",
            )}
          />
        }
      >
        <ScrollTextIcon className="mt-0.5 size-3.5 shrink-0 opacity-70" />
        <span className="line-clamp-3 text-xs whitespace-pre-wrap">
          {hasValue ? value : t("empty")}
        </span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={fieldId} className="text-xs text-muted-foreground">
            {t("label")}
          </Label>
          <Textarea
            id={fieldId}
            value={value}
            placeholder={t("placeholder")}
            onChange={(event) => onChange(event.target.value)}
            rows={5}
            className="resize-none text-sm"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
