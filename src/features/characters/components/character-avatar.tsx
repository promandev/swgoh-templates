import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Character } from "@/types";
import { ALIGNMENT_GRADIENT, getInitials } from "@/utils/avatar";

export function CharacterAvatar({
  character,
  className,
}: {
  character: Character;
  className?: string;
}) {
  return (
    <Avatar className={cn("size-9 rounded-xl", className)}>
      {character.avatar ? (
        <AvatarImage
          src={character.avatar}
          alt=""
          className="rounded-xl object-cover"
        />
      ) : null}
      <AvatarFallback
        className={cn(
          "rounded-xl bg-linear-to-br text-[0.7rem] font-semibold",
          ALIGNMENT_GRADIENT[character.alignment],
        )}
      >
        {getInitials(character.name)}
      </AvatarFallback>
    </Avatar>
  );
}
