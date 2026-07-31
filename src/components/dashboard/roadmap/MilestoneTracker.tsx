import { Check } from "lucide-react";
import type { PhaseSummary } from "./useRoadmap";
import type { PhaseId } from "./types";

interface Props {
  phases: PhaseSummary[];
  currentId: PhaseId | "";
  onSelect: (id: PhaseId) => void;
}

export function MilestoneTracker({ phases, currentId, onSelect }: Props) {
  return (
    <nav aria-label="Home-buying milestones" className="w-full overflow-x-auto">
      <ol className="flex items-center gap-2 min-w-max py-1">
        {phases.map((p, idx) => {
          const isCurrent = p.phase.id === currentId;
          const isDone = p.status === "complete";
          const stateLabel = isDone ? "Complete" : isCurrent ? "Current" : "Upcoming";
          return (
            <li key={p.phase.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSelect(p.phase.id)}
                aria-current={isCurrent ? "step" : undefined}
                className={`flex items-center gap-2 px-3 py-2 rounded-full border text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                  isCurrent
                    ? "border-accent bg-accent/10 text-foreground"
                    : isDone
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "border-border bg-background/60 text-muted-foreground hover:border-accent/40"
                }`}
              >
                <span
                  aria-hidden
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold ${
                    isDone
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isDone ? <Check className="w-3 h-3" /> : idx + 1}
                </span>
                <span>{p.phase.shortName}</span>
                <span className="sr-only"> — {stateLabel}, {p.completed} of {p.total} tasks done</span>
              </button>
              {idx < phases.length - 1 && (
                <span aria-hidden className="w-4 h-px bg-border" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
