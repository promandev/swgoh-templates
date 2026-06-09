import { cn } from "@/lib/utils";

export type SpinnerSize = "sm" | "md" | "lg";

const SIZE: Record<SpinnerSize, { box: string; ring: number }> = {
  sm: { box: "size-4", ring: 2 },
  md: { box: "size-8", ring: 3 },
  lg: { box: "size-12", ring: 4 },
};

/**
 * Themed loading spinner — a glowing indigo ring built from a conic gradient,
 * matching the app's `--primary` accent. Respects `prefers-reduced-motion`
 * (handled globally in `globals.css`).
 */
export function Spinner({
  size = "md",
  className,
  ...props
}: { size?: SpinnerSize } & React.ComponentProps<"div">) {
  const { box, ring } = SIZE[size];
  const mask = `radial-gradient(farthest-side, transparent calc(100% - ${ring}px), #000 calc(100% - ${ring}px))`;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("relative shrink-0", box, className)}
      {...props}
    >
      <div
        className="absolute inset-0 animate-spin rounded-full"
        style={{
          background:
            "conic-gradient(from 90deg, transparent 0%, color-mix(in oklch, var(--primary) 25%, transparent) 40%, var(--primary) 100%)",
          mask,
          WebkitMask: mask,
          filter:
            "drop-shadow(0 0 6px color-mix(in oklch, var(--primary) 45%, transparent))",
        }}
      />
    </div>
  );
}

/** Spinner stacked with an optional label — for centered loading states. */
export function Loading({
  label,
  size = "md",
  className,
}: {
  label?: string;
  size?: SpinnerSize;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground",
        className,
      )}
    >
      <Spinner size={size} />
      {label ? <span>{label}</span> : null}
    </div>
  );
}

/**
 * Glassy overlay that covers its nearest positioned ancestor while something
 * loads. Drop it next to content inside a `relative` container.
 */
export function LoadingOverlay({
  label,
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-background/60 backdrop-blur-sm",
        className,
      )}
    >
      <Loading label={label} />
    </div>
  );
}
