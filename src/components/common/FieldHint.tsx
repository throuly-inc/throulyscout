import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface FieldHintProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Small "?" info icon paired with a tooltip. Use next to form field labels
 * to explain what the field is and why it matters, in plain English.
 */
export function FieldHint({ label, children, className }: FieldHintProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={`What is ${label}?`}
          className={cn(
            "inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-accent focus:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 transition-colors",
            className,
          )}
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[240px] text-xs leading-snug">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}
