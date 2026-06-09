"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StatId } from "@/types";

export function StatSelect({
  value,
  options,
  onChange,
  placeholder,
  ariaLabel,
  disabled,
}: {
  value: StatId | null;
  options: readonly StatId[];
  onChange: (stat: StatId) => void;
  placeholder: string;
  ariaLabel: string;
  disabled?: boolean;
}) {
  const t = useTranslations("Stats");
  const items = useMemo(
    () => Object.fromEntries(options.map((id) => [id, t(id)])),
    [options, t],
  );

  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next as StatId);
      }}
      items={items}
      disabled={disabled}
    >
      <SelectTrigger
        size="sm"
        aria-label={ariaLabel}
        className="w-full min-w-0"
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((id) => (
          <SelectItem key={id} value={id}>
            {t(id)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
