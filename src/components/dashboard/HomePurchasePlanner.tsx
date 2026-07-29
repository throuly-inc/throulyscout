import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useRoadmap } from "./roadmap/useRoadmap";
import { RoadmapSummaryCard } from "./roadmap/RoadmapSummaryCard";
import { MilestoneTracker } from "./roadmap/MilestoneTracker";
import { NextBestStepCard } from "./roadmap/NextBestStepCard";
import { PhaseAccordion } from "./roadmap/PhaseAccordion";
import { ReadinessSummaryCard } from "./roadmap/ReadinessSummaryCard";
import { CostsToPrepareCard } from "./roadmap/CostsToPrepareCard";
import { DocumentChecklistCard } from "./roadmap/DocumentChecklistCard";
import { RoadmapDisclaimer } from "./roadmap/RoadmapDisclaimer";
import type { PhaseId } from "./roadmap/types";
import { Link } from "react-router-dom";

interface Props {
  userId?: string | null;
  onSwitchTab?: (tab: string) => void;
}

export function HomePurchasePlanner({ userId = null, onSwitchTab }: Props) {
  const rm = useRoadmap(userId);
  const [openPhase, setOpenPhase] = useState<PhaseId>("financial");

  useEffect(() => {
    if (!rm.loading) setOpenPhase(rm.currentPhase.id);
  }, [rm.loading, rm.currentPhase.id]);

  if (rm.loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const isEmpty = rm.overallCompleted === 0 && !rm.employment && !rm.savingsGoal;

  const message =
    rm.overallPercent === 0
      ? "Let's start with the basics."
      : rm.overallPercent < 40
      ? "You're building your foundation."
      : rm.overallPercent < 75
      ? "You're on your way — keep going."
      : rm.overallPercent < 100
      ? "You're almost ready."
      : "All planned tasks complete.";

  return (
    <div className="space-y-4">
      <RoadmapSummaryCard
        overallPercent={rm.overallPercent}
        completed={rm.overallCompleted}
        total={rm.overallTotal}
        currentPhase={rm.currentPhase}
        nextBestStep={rm.nextBestStep}
        personalMessage={message}
      />

      <MilestoneTracker
        phases={rm.phaseSummaries}
        currentId={openPhase}
        onSelect={(id) => setOpenPhase(id)}
      />

      {isEmpty ? (
        <Card className="border-accent/40 bg-accent/5">
          <CardContent className="p-6 text-center space-y-3">
            <h3 className="text-lg font-serif text-foreground">Let's build your home-buying plan</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Start by telling us your savings goal, expected purchase timeline, and estimated home budget. We'll organize the next steps for you.
            </p>
            <Button asChild size="sm">
              <Link to="/homebuying-estimate/financial-health">
                Set Up My Roadmap <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <NextBestStepCard
          primary={rm.nextBestStep}
          secondary={rm.secondaryStep}
          onSwitchTab={onSwitchTab}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <PhaseAccordion
            phases={rm.phaseSummaries}
            openId={openPhase}
            onOpenChange={setOpenPhase}
            taskStates={rm.taskStates}
            autoCompletedIds={rm.autoCompletedIds}
            autoReasons={rm.autoReasons}
            onTaskChange={rm.updateTask}
            onSwitchTab={onSwitchTab}
          />
        </div>
        <div className="space-y-4">
          <ReadinessSummaryCard
            strengths={rm.strengths}
            needsAttention={rm.needsAttention}
            infoNeeded={rm.infoNeeded}
          />
          <CostsToPrepareCard
            savingsGoal={rm.savingsGoal}
            savingsCurrent={rm.savingsCurrent}
          />
        </div>
      </div>

      <DocumentChecklistCard employment={rm.employment} onChange={rm.setEmployment} />

      {rm.error && (
        <p className="text-xs text-destructive">Some data couldn't load: {rm.error}</p>
      )}

      <RoadmapDisclaimer />
    </div>
  );
}
