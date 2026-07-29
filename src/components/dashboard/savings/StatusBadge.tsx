import { Badge } from "@/components/ui/badge";
import type { SavingsStatus } from "@/hooks/useSavingsProjection";
import { cn } from "@/lib/utils";

const LABELS: Record<SavingsStatus, string> = {
  "no-data": "Add your numbers",
  "goal-reached": "Goal reached 🎉",
  ahead: "Ahead of schedule",
  "on-track": "On track",
  "slightly-behind": "Slightly behind",
  "off-track": "Off track",
};

const STYLES: Record<SavingsStatus, string> = {
  "no-data": "border-border text-muted-foreground bg-muted",
  "goal-reached": "border-success text-success bg-success/10",
  ahead: "border-success text-success bg-success/10",
  "on-track": "border-success text-success bg-success/10",
  "slightly-behind": "border-warning text-warning bg-warning/10",
  "off-track": "border-destructive text-destructive bg-destructive/10",
};

interface Props {
  status: SavingsStatus;
  className?: string;
}

export function StatusBadge({ status, className }: Props) {
  return (
    <Badge
      variant="outline"
      aria-live="polite"
      role="status"
      className={cn(STYLES[status], className)}
    >
      {LABELS[status]}
    </Badge>
  );
}
