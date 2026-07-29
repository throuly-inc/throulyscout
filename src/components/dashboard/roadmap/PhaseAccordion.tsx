import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TaskRow } from "./TaskRow";
import type { PhaseSummary } from "./useRoadmap";
import type { PhaseId, TaskState } from "./types";

interface Props {
  phases: PhaseSummary[];
  openId: PhaseId;
  onOpenChange: (id: PhaseId) => void;
  taskStates: Record<string, TaskState>;
  autoCompletedIds: Set<string>;
  autoReasons: Record<string, string>;
  onTaskChange: (taskId: string, patch: Partial<TaskState>) => void;
  onSwitchTab?: (tab: string) => void;
}

const STATUS_META = {
  not_started: { label: "Not started", cls: "bg-muted text-muted-foreground" },
  in_progress: { label: "In progress", cls: "bg-accent/15 text-accent-foreground border border-accent/30" },
  complete: { label: "Complete", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30" },
} as const;

export function PhaseAccordion({
  phases, openId, onOpenChange, taskStates, autoCompletedIds, autoReasons, onTaskChange, onSwitchTab,
}: Props) {
  return (
    <Accordion
      type="single"
      collapsible
      value={openId}
      onValueChange={(v) => v && onOpenChange(v as PhaseId)}
      className="space-y-3"
    >
      {phases.map((p) => {
        const meta = STATUS_META[p.status];
        return (
          <AccordionItem
            key={p.phase.id}
            value={p.phase.id}
            className="border rounded-lg bg-card"
            data-current={p.phase.id === openId}
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex-1 flex items-center justify-between gap-3 text-left">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{p.phase.name}</span>
                    <Badge className={`h-5 text-[10px] font-medium ${meta.cls}`} variant="secondary">
                      {meta.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.phase.description}</p>
                </div>
                <div className="text-right shrink-0 hidden sm:block">
                  <div className="text-xs text-muted-foreground">{p.completed}/{p.total}</div>
                  <div className="w-24 mt-1">
                    <Progress value={p.percent} className="h-1.5" />
                  </div>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-0">
              <div className="sm:hidden mb-3">
                <Progress value={p.percent} className="h-1.5" />
                <div className="text-xs text-muted-foreground mt-1">{p.completed} of {p.total} done</div>
              </div>
              {p.tasks.length === 0 ? (
                <p className="text-xs text-muted-foreground">No tasks in this phase yet.</p>
              ) : (
                <div className="space-y-2">
                  {p.tasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      state={taskStates[task.id]}
                      autoCompleted={autoCompletedIds.has(task.id)}
                      autoReason={autoReasons[task.id]}
                      onChange={(patch) => onTaskChange(task.id, patch)}
                      onSwitchTab={onSwitchTab}
                    />
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
