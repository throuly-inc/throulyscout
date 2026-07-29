import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";

interface Props {
  strengths: string[];
  needsAttention: string[];
  infoNeeded: string[];
}

function List({ items, icon, label, empty }: { items: string[]; icon: React.ReactNode; label: string; empty: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
        {icon}{label}
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-1">
          {items.map((s) => (
            <li key={s} className="text-sm text-foreground">• {s}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ReadinessSummaryCard({ strengths, needsAttention, infoNeeded }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Your Readiness Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <List
          items={strengths}
          icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
          label="Strengths"
          empty="Complete a few steps to build up your strengths."
        />
        <List
          items={needsAttention}
          icon={<AlertCircle className="w-3.5 h-3.5 text-amber-600" />}
          label="Needs attention"
          empty="Nothing needs attention right now."
        />
        <List
          items={infoNeeded}
          icon={<HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />}
          label="Information needed"
          empty="We have what we need to guide you."
        />
      </CardContent>
    </Card>
  );
}
