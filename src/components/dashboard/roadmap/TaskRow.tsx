import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ChevronDown, Info, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import type { TaskDef, TaskState, DocStatus } from "./types";
import { DOC_STATUS_LABEL } from "./useRoadmap";

interface Props {
  task: TaskDef;
  state: TaskState | undefined;
  autoCompleted: boolean;
  autoReason?: string;
  onChange: (patch: Partial<TaskState>) => void;
  onSwitchTab?: (tab: string) => void;
}

export function TaskRow({ task, state, autoCompleted, autoReason, onChange, onSwitchTab }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isDoc = task.category === "document";
  const isComplete = autoCompleted
    ? true
    : isDoc
    ? state?.doc_status === "ready" || state?.doc_status === "uploaded"
    : state?.status === "complete";

  const toggleManual = () => {
    if (autoCompleted) return;
    onChange({ status: isComplete ? "not_started" : "complete" });
  };

  return (
    <div className="rounded-md border border-border bg-background/60 hover:border-accent/30 transition-colors">
      <div className="flex items-start gap-3 px-3 py-2.5">
        {isDoc ? (
          <div className="mt-1 w-4 h-4 rounded-sm border border-border flex items-center justify-center" aria-hidden>
            {isComplete && <span className="w-2 h-2 rounded-sm bg-accent" />}
          </div>
        ) : (
          <Checkbox
            checked={isComplete}
            onCheckedChange={toggleManual}
            disabled={autoCompleted}
            aria-label={`Mark ${task.title} ${isComplete ? "incomplete" : "complete"}`}
            className="mt-0.5"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-medium ${isComplete ? "line-through text-muted-foreground" : "text-foreground"}`}>
              {task.title}
            </p>
            {autoCompleted && (
              <Badge variant="secondary" className="gap-1 text-[10px] h-5">
                <Lock className="w-2.5 h-2.5" /> Auto
              </Badge>
            )}
            {task.effort && !isComplete && (
              <span className="text-[10px] text-muted-foreground">· {task.effort}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{task.summary}</p>
          {autoCompleted && autoReason && (
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">{autoReason}</p>
          )}

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {task.why && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
              >
                <Info className="w-3 h-3 mr-1" /> Why this matters
                <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${expanded ? "rotate-180" : ""}`} />
              </Button>
            )}
            {task.cta && !isComplete && (
              task.cta.to ? (
                <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs">
                  <Link to={task.cta.to}>{task.cta.label} <ArrowRight className="w-3 h-3 ml-1" /></Link>
                </Button>
              ) : task.cta.tab && onSwitchTab ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs"
                  onClick={() => onSwitchTab(task.cta!.tab!)}
                >
                  {task.cta.label} <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              ) : null
            )}
            {isDoc && (
              <Select
                value={state?.doc_status ?? "not_started"}
                onValueChange={(v) => onChange({ doc_status: v as DocStatus })}
              >
                <SelectTrigger className="h-7 w-[140px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DOC_STATUS_LABEL).map(([v, label]) => (
                    <SelectItem key={v} value={v}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {expanded && task.why && (
            <div className="mt-2 rounded-md bg-muted/40 border border-border p-3 text-xs text-muted-foreground space-y-2">
              <p>{task.why}</p>
              <Textarea
                value={state?.note ?? ""}
                onChange={(e) => onChange({ note: e.target.value })}
                placeholder="Private note (only you can see this)"
                className="text-xs min-h-[60px]"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
