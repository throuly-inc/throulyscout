import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Result-panel primitives. Originally introduced as a dark treatment; reverted
 * to the app's light cream/off-white card look. Component names are kept for
 * backwards compatibility with existing consumers.
 *
 * Supporting text (labels, cost rows, disclaimer copy) uses semibold/bold
 * weights and full foreground contrast — no light gray subtext.
 */

export function DarkResultPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[32px] bg-card text-foreground border border-border p-6 sm:p-8 md:p-10 shadow-sm",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function DarkEyebrow({
  icon,
  children,
  className,
}: {
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "mb-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-accent",
        className,
      )}
    >
      {icon}
      {children}
    </p>
  );
}

/** Big serif numeric headline. */
export function DarkHeadlineValue({
  value,
  suffix,
  className,
}: {
  value: ReactNode;
  suffix?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "font-serif text-4xl sm:text-5xl md:text-6xl font-bold tabular-nums break-words leading-tight text-foreground",
        className,
      )}
    >
      {value}
      {suffix && (
        <span className="ml-2 font-serif text-lg sm:text-xl italic font-semibold text-foreground/70">
          {suffix}
        </span>
      )}
    </div>
  );
}

/** Label/value row with subtle divider — matches breakdown rows. */
export function DarkCostRow({
  label,
  value,
  valueClassName,
}: {
  label: ReactNode;
  value: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className="font-semibold text-foreground truncate">{label}</span>
      <span className={cn("font-bold text-foreground tabular-nums", valueClassName)}>
        {value}
      </span>
    </div>
  );
}

/** Group of DarkCostRow with a top hairline divider. */
export function DarkCostList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3 border-t border-border pt-5", className)}>
      {children}
    </div>
  );
}

/** Inset lighter card, matches the "Editable assumptions" treatment. */
export function DarkInsetCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-muted/50 border border-border p-5 sm:p-6 text-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * A single "stat tile" for grids like Upfront Costs (Down Payment / Closing / Total).
 * Small indigo all-caps label above a serif numeral.
 */
export function DarkStatTile({
  label,
  value,
  tooltip,
  valueClassName,
  emphasis = false,
}: {
  label: ReactNode;
  value: ReactNode;
  tooltip?: ReactNode;
  valueClassName?: string;
  /** Emphasis tile gets a subtle accent-tinted border. */
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-muted/40 border p-4 sm:p-5 flex flex-col justify-between min-h-[92px]",
        emphasis ? "border-accent/60" : "border-border",
      )}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
        <span className="truncate">{label}</span>
        {tooltip}
      </div>
      <p
        className={cn(
          "mt-3 font-serif text-2xl sm:text-3xl font-bold text-foreground tabular-nums leading-none",
          valueClassName,
        )}
      >
        {value}
      </p>
    </div>
  );
}
