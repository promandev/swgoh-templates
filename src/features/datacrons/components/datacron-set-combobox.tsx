"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckIcon, ChevronsUpDownIcon, ScrollTextIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { DatacronSet } from "@/types";

/**
 * Single control to set a member's datacron set: type to search the current
 * sets, pick one from the list, or keep the typed text as a custom name. Mirrors
 * the character combobox but allows free-text entries (setId stays empty).
 */
export function DatacronSetCombobox({
  sets,
  setId,
  setName,
  onChange,
  id,
}: {
  sets: DatacronSet[];
  setId: string;
  setName: string;
  onChange: (next: { setId: string; setName: string }) => void;
  id?: string;
}) {
  const t = useTranslations("Datacron");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const trimmed = query.trim();

  const filtered = useMemo(() => {
    const q = trimmed.toLowerCase();
    if (!q) return sets;
    return sets.filter((set) => set.name.toLowerCase().includes(q));
  }, [sets, trimmed]);

  const showCustom =
    trimmed.length > 0 &&
    !sets.some((set) => set.name.toLowerCase() === trimmed.toLowerCase());

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger
        render={
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-9 w-full justify-start gap-2 px-2.5 font-normal"
          />
        }
      >
        <ScrollTextIcon className="size-3.5 shrink-0 opacity-60" />
        <span
          className={cn("truncate text-sm", !setName && "text-muted-foreground")}
        >
          {setName || t("setPlaceholder")}
        </span>
        <ChevronsUpDownIcon className="ml-auto size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(22rem,80vw)] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={t("setPlaceholder")}
          />
          <CommandList>
            {filtered.length === 0 && !showCustom ? (
              <CommandEmpty>{t("noResults")}</CommandEmpty>
            ) : null}

            {showCustom ? (
              <CommandGroup>
                <CommandItem
                  value={`custom-${trimmed}`}
                  onSelect={() => {
                    onChange({ setId: "", setName: trimmed });
                    setOpen(false);
                  }}
                >
                  <span className="truncate">
                    {t("useCustom", { name: trimmed })}
                  </span>
                </CommandItem>
              </CommandGroup>
            ) : null}

            {filtered.length > 0 ? (
              <CommandGroup>
                {filtered.map((set) => (
                  <CommandItem
                    key={set.id}
                    value={set.id}
                    onSelect={() => {
                      onChange({ setId: set.id, setName: set.name });
                      setOpen(false);
                    }}
                    className="gap-2"
                  >
                    <span className="truncate">{set.name}</span>
                    <CheckIcon
                      className={cn(
                        "ml-auto size-4",
                        setId === set.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
