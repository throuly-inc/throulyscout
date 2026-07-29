import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import type { TaskDef } from "./types";

interface Props {
  primary: TaskDef | null;
  secondary: TaskDef | null;
  onSecondary?: (task: TaskDef) => void;
  onSwitchTab?: (tab: string) => void;
}

function ctaProps(task: TaskDef, onSwitchTab?: (tab: string) => void) {
  if (task.cta?.to) return { as: "link" as const, to: task.cta.to, label: task.cta.label };
  if (task.cta?.tab && onSwitchTab) {
    return { as: "button" as const, onClick: () => onSwitchTab(task.cta!.tab!), label: task.cta.label };
  }
  return null;
}

export function NextBestStepCard({ primary, secondary, onSwitchTab }: Props) {
  if (!primary) {
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="p-5 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          <div className="text-sm">
            <div className="font-semibold text-foreground">Great work — every step is complete.</div>
            <div className="text-muted-foreground">Review any phase to refresh your plan.</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const primaryCta = ctaProps(primary, onSwitchTab);
  const secondaryCta = secondary ? ctaProps(secondary, onSwitchTab) : null;

  return (
    <Card className="border-accent/40 bg-accent/5">
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Next best step</div>
            <div className="text-lg font-semibold text-foreground">{primary.title}</div>
            <p className="text-sm text-muted-foreground mt-1">{primary.why ?? primary.summary}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {primaryCta?.as === "link" && (
            <Button asChild size="sm">
              <Link to={primaryCta.to!}>{primaryCta.label} <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link>
            </Button>
          )}
          {primaryCta?.as === "button" && (
            <Button size="sm" onClick={primaryCta.onClick}>
              {primaryCta.label} <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          )}
          {secondaryCta?.as === "link" && (
            <Button asChild size="sm" variant="outline">
              <Link to={secondaryCta.to!}>Also: {secondary!.title}</Link>
            </Button>
          )}
          {secondaryCta?.as === "button" && (
            <Button size="sm" variant="outline" onClick={secondaryCta.onClick}>
              Also: {secondary!.title}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
