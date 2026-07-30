import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Single source of truth for results-page disclaimer copy.
 */
export const DISCLAIMER_SHORT = "This is an estimate, not an official pre-approval.";
export const DISCLAIMER_LONG =
  "This estimate is for informational purposes only and does not constitute an official pre-approval or loan commitment. Final approval, terms, and rates are determined by a licensed loan officer after a full application and underwriting review.";
export const DISCLAIMER_CTA_LABEL = "Speak with a loan officer";

interface ResultsDisclaimerProps {
  variant: "inline" | "footer";
  /** Kept for backwards compatibility with older call sites; ignored. */
  tone?: "light" | "dark";
  className?: string;
}

export function ResultsDisclaimer({ variant, className }: ResultsDisclaimerProps) {
  if (variant === "inline") {
    return (
      <div
        role="note"
        aria-label="Estimate disclaimer"
        className={cn(
          "flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-muted/60 px-3 py-1.5 text-xs sm:text-sm font-semibold text-foreground break-words",
          className,
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" aria-label="Disclaimer details" className="shrink-0">
              <Info aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>{DISCLAIMER_LONG}</p>
          </TooltipContent>
        </Tooltip>
        <span className="break-words">{DISCLAIMER_SHORT}</span>
      </div>
    );
  }

  return (
    <aside
      role="note"
      aria-label="Estimate disclaimer"
      className={cn(
        "mt-8 rounded-lg border border-border bg-muted/60 px-4 py-3 text-xs sm:text-sm font-semibold text-foreground",
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="leading-relaxed break-words">
          {DISCLAIMER_LONG}{" "}
          <strong className="font-bold text-foreground">{DISCLAIMER_CTA_LABEL}</strong>.
        </p>
      </div>
    </aside>
  );
}
