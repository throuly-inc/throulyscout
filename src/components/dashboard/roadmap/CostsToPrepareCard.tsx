import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CostItem {
  key: string;
  label: string;
  estimate?: number | null;
  planned?: number | null;
}

interface Props {
  savingsGoal: number;
  savingsCurrent: number;
}

function fmt(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return `$${Math.round(n).toLocaleString()}`;
}

function status(item: CostItem): { label: string; cls: string } {
  if (item.estimate == null) return { label: "Info needed", cls: "bg-muted text-muted-foreground" };
  const planned = item.planned ?? 0;
  if (planned >= item.estimate) return { label: "Covered", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" };
  if (planned > 0) return { label: "Partially covered", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400" };
  return { label: "Not planned", cls: "bg-muted text-muted-foreground" };
}

export function CostsToPrepareCard({ savingsGoal, savingsCurrent }: Props) {
  // Only derive an estimate for down payment from the user's saved goal.
  // Everything else is "Info needed" until the user completes related planning.
  const items: CostItem[] = [
    {
      key: "down",
      label: "Down payment + closing (combined goal)",
      estimate: savingsGoal || null,
      planned: savingsCurrent,
    },
    { key: "earnest", label: "Earnest money" },
    { key: "inspection", label: "Inspection" },
    { key: "appraisal", label: "Appraisal" },
    { key: "insurance", label: "Homeowners insurance (prepaid)" },
    { key: "moving", label: "Moving expenses" },
    { key: "initial", label: "Initial repairs or furnishings" },
    { key: "reserve", label: "Emergency reserve after closing" },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Costs to Prepare For</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => {
          const s = status(item);
          return (
            <div key={item.key} className="flex items-start justify-between gap-2 border-b border-border/60 last:border-0 pb-2 last:pb-0">
              <div className="min-w-0 flex-1">
                <div className="text-sm text-foreground">{item.label}</div>
                <div className="text-[11px] text-muted-foreground">
                  Estimate {fmt(item.estimate)} · Saved {fmt(item.planned)}
                </div>
              </div>
              <Badge variant="secondary" className={`text-[10px] h-5 shrink-0 whitespace-nowrap ${s.cls}`}>
                {s.label}
              </Badge>
            </div>
          );
        })}
        <p className="text-[11px] text-muted-foreground pt-1">
          Amounts are estimates. Actual costs vary by property, location, lender, and loan type.
        </p>
      </CardContent>
    </Card>
  );
}
