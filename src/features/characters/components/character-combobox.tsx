"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";

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
import { characterService } from "@/services/character-service";
import { CharacterAvatar } from "./character-avatar";

export function CharacterCombobox({
  value,
  onChange,
  id,
}: {
  value: string | null;
  onChange: (characterId: string) => void;
  id?: string;
}) {
  const t = useTranslations("Character");
  const [open, setOpen] = useState(false);
  const characters = useMemo(() => characterService.getAll(), []);
  const selected = value ? characterService.getById(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-11 w-full justify-start gap-2.5 px-2 font-normal"
          />
        }
      >
        {selected ? (
          <>
            <CharacterAvatar character={selected} className="size-9" />
            <span className="truncate text-sm font-medium">
              {selected.name}
            </span>
          </>
        ) : (
          <span className="truncate text-muted-foreground">{t("select")}</span>
        )}
        <ChevronsUpDownIcon className="ml-auto size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <Command>
          <CommandInput placeholder={t("searchPlaceholder")} />
          <CommandList>
            <CommandEmpty>{t("noResults")}</CommandEmpty>
            <CommandGroup>
              {characters.map((character) => (
                <CommandItem
                  key={character.id}
                  value={character.name}
                  onSelect={() => {
                    onChange(character.id);
                    setOpen(false);
                  }}
                  className="gap-2.5"
                >
                  <CharacterAvatar character={character} className="size-7" />
                  <span className="truncate">{character.name}</span>
                  <CheckIcon
                    className={cn(
                      "ml-auto size-4",
                      value === character.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
