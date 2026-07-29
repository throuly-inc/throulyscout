import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SegmentedCardOption {
  value: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

interface SegmentedCardSelectorProps {
  options: SegmentedCardOption[];
  value?: string;
  onSelect: (value: string) => void;
  className?: string;
  size?: "default" | "compact";
}

/**
 * Reusable card-style segmented selector.
 * Used for onboarding role selection AND for the results-page tab switcher
 * (Affordability / Financial Health). Same component, different option sets.
 */
export function SegmentedCardSelector({
  options,
  value,
  onSelect,
  className,
  size = "default",
}: SegmentedCardSelectorProps) {
  const cols =
    options.length >= 3 ? "md:grid-cols-3" : options.length === 2 ? "grid-cols-2" : "grid-cols-1";
  const compact = size === "compact";
  return (
    <div
      role="tablist"
      className={cn("grid gap-3 sm:gap-6", cols, className)}
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.value;
        return (
          <Card
            key={opt.value}
            role="tab"
            tabIndex={0}
            aria-selected={active}
            onClick={() => onSelect(opt.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(opt.value);
              }
            }}
            className={cn(
              "cursor-pointer hover:border-primary hover:shadow-lg transition-all duration-200 group",
              active && "border-primary shadow-md ring-1 ring-primary/40 bg-primary/5",
            )}
          >
            <CardContent
              className={cn(
                "text-center space-y-2 sm:space-y-4",
                compact ? "p-3 sm:p-5" : "p-5 sm:p-8",
              )}
            >
              <div
                className={cn(
                  "mx-auto rounded-2xl bg-primary/10 flex items-center justify-center transition-colors",
                  compact ? "w-10 h-10 sm:w-12 sm:h-12" : "w-12 h-12 sm:w-16 sm:h-16",
                  active ? "bg-primary/20" : "group-hover:bg-primary/20",
                )}
              >
                <Icon
                  className={cn(
                    "text-primary",
                    compact ? "w-5 h-5 sm:w-6 sm:h-6" : "w-6 h-6 sm:w-8 sm:h-8",
                  )}
                />
              </div>
              <h3
                className={cn(
                  "font-semibold text-foreground whitespace-nowrap",
                  compact ? "text-sm sm:text-base" : "text-base sm:text-xl",
                )}
              >
                {opt.label}
              </h3>
              <p
                className={cn(
                  "text-muted-foreground",
                  compact ? "text-[11px] sm:text-xs leading-snug" : "text-xs sm:text-sm",
                )}
              >
                {opt.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
