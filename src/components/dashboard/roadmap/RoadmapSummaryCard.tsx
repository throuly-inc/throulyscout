import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Compass } from "lucide-react";
import type { PhaseDef, TaskDef } from "./types";

interface Props {
  overallPercent: number;
  completed: number;
  total: number;
  currentPhase: PhaseDef;
  nextBestStep: TaskDef | null;
  personalMessage: string;
}

export function RoadmapSummaryCard({
  overallPercent,
  completed,
  total,
  currentPhase,
  nextBestStep,
  personalMessage,
}: Props) {
  const remaining = Math.max(0, total - completed);
  return (
    <Card className="relative overflow-hidden border-accent/30">
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{ background: "var(--grad)" }} />
      <CardContent className="relative p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground mb-1">
              <Compass className="w-3.5 h-3.5" />
              Your Home-Buying Roadmap
            </div>
            <h2 className="text-2xl md:text-3xl font-serif text-foreground">
              {overallPercent}% complete
              <span className="text-base font-sans text-muted-foreground ml-2">
                — {completed} of {total} steps
              </span>
            </h2>
          </div>
          <div className="text-sm text-right">
            <div className="text-muted-foreground">Current phase</div>
            <div className="font-semibold text-foreground">{currentPhase.name}</div>
          </div>
        </div>

        <Progress value={overallPercent} className="h-2 mb-4" aria-label={`Overall roadmap ${overallPercent}% complete`} />

        <div className="grid gap-3 sm:grid-cols-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Next step</div>
            <div className="font-medium text-foreground">{nextBestStep?.title ?? "You've completed the roadmap"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Remaining</div>
            <div className="font-medium text-foreground">{remaining} step{remaining === 1 ? "" : "s"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Status</div>
            <div className="font-medium text-foreground">{personalMessage}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
