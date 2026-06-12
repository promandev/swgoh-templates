import { Skeleton } from "@/components/ui/skeleton";

export function SquadBuilderSkeleton() {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
      <div className="flex flex-col gap-3 lg:w-64 lg:shrink-0">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-2 lg:flex-col">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-48 rounded-xl lg:w-full" />
          ))}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    </div>
  );
}
