import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/lib/calculator";
import { statesData } from "@/lib/states";
import { clearActiveBuyerSession } from "@/lib/buyerSessionStorage";

interface Props {
  report: any | null;
  loading?: boolean;
}

// Semantic status meta — uses design tokens so it adapts with theme.
const STATUS_META: Record<
  string,
  {
    icon: any;
    pillClass: string;
    dotClass: string;
    barClass: string;
    panelClass: string;
    label: string;
  }
> = {
  strong: {
    icon: CheckCircle2,
    pillClass: "bg-success/15 text-success border-success/30",
    dotClass: "bg-success",
    barClass: "bg-success",
    panelClass: "bg-success/5",
    label: "Excellent",
  },
  good: {
    icon: ShieldCheck,
    pillClass: "bg-success/15 text-success border-success/30",
    dotClass: "bg-success",
    barClass: "bg-success",
    panelClass: "bg-accent/5",
    label: "Good standing",
  },
  attention: {
    icon: AlertTriangle,
    pillClass: "bg-warning/15 text-warning border-warning/30",
    dotClass: "bg-warning",
    barClass: "bg-warning",
    panelClass: "bg-warning/5",
    label: "Needs attention",
  },
  risk: {
    icon: AlertCircle,
    pillClass: "bg-destructive/10 text-destructive border-destructive/30",
    dotClass: "bg-destructive",
    barClass: "bg-destructive",
    panelClass: "bg-destructive/5",
    label: "High risk",
  },
};

const SectionHeader = () => (
  <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
    Financial Health Report
  </p>
);

function factorBarColor(score: number): string {
  if (score >= 80) return "bg-success";
  if (score >= 65) return "bg-accent";
  if (score >= 45) return "bg-warning";
  return "bg-destructive";
}

function relativeTime(d: Date): string {
  const diffMs = Date.now() - d.getTime();
  const day = 24 * 60 * 60 * 1000;
  const days = Math.round(diffMs / day);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return d.toLocaleDateString();
}

export function FinancialHealthSummary({ report, loading }: Props) {
  const navigate = useNavigate();
  if (loading) return null;

  const seedSessionFromReport = (): boolean => {
    if (!report?.inputs) return false;
    const i = report.inputs;
    const stateObj =
      statesData.find((s) => s.abbreviation === i.stateAbbreviation) ||
      statesData.find((s) => s.name === i.state);
    if (!stateObj) return false;
    try {
      sessionStorage.setItem(
        "throuly_buyers_session",
        JSON.stringify({
          selectedState: stateObj,
          homePrice: Number(i.homePrice) || 400000,
          hoaMonthly: Number(i.hoaMonthly) || 0,
          financialProfile: {
            yearlyIncome: Number(i.yearlyIncome) || 0,
            monthlyDebt: Number(i.monthlyDebt) || 0,
            savings: Number(i.savings) || 0,
            creditScore: Number(i.creditScore) || 720,
            employmentType: i.employmentType || "w2",
            propertyType: i.propertyType || undefined,
            isFirstTimeBuyer: i.isFirstTimeBuyer ?? true,
          },
          loanTypeId: i.loanTypeId || "conventional",
        }),
      );
      return true;
    } catch {
      return false;
    }
  };

  if (!report) {
    return (
      <div className="space-y-3">
        <SectionHeader />
        <Card>
          <CardContent className="py-6 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div>
              <p className="font-medium text-foreground">
                You haven't saved a Financial Health report yet.
              </p>
              <p className="text-sm text-muted-foreground">
                Complete Step 1 to see your score, comfortable budget, and factor breakdown here.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                clearActiveBuyerSession();
                navigate("/buyers");
              }}
            >
              Start Step 1: Financial Health
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const r = report.results || {};
  const status = (r.status as string) || "good";
  const meta = STATUS_META[status] || STATUS_META.good;
  const StatusIcon = meta.icon;
  const score = Number(r.overallScore || 0);
  const savedAt = r.savedAt ? new Date(r.savedAt) : null;

  const tiers = [
    { key: "comfortable", label: "Comfortable", data: r.comfortable },
    { key: "stretch", label: "Stretch", data: r.stretch },
    { key: "maximum", label: "Maximum", data: r.maximum },
  ].filter((t) => t.data && t.data.price);

  const factors: any[] = Array.isArray(r.factors) ? r.factors : [];
  const topFactors = factors.slice(0, 4);

  const goToFullReport = () => {
    if (seedSessionFromReport()) {
      navigate("/homebuying-estimate/financial-health");
    } else {
      navigate("/buyers");
    }
  };
  const goToAffordability = () => {
    if (seedSessionFromReport()) {
      navigate("/homebuying-estimate/results");
    } else {
      navigate("/buyers");
    }
  };

  const priceShort = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 2)}M`;
    if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
    return formatCurrency(n);
  };

  return (
    <div className="space-y-3">
      <SectionHeader />
      <Card className="overflow-hidden rounded-3xl border-2 border-foreground shadow-[6px_6px_0_0_hsl(var(--foreground))]">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            {/* Left: score + status */}
            <div
              className={`p-6 md:p-7 md:w-[260px] shrink-0 border-b md:border-b-0 md:border-r border-foreground/10 flex flex-col justify-between ${meta.panelClass}`}
            >
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold tracking-widest uppercase">
                    Financial Health
                  </span>
                  {savedAt && (
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {relativeTime(savedAt)}
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-serif text-6xl font-semibold text-foreground tabular-nums leading-none">
                    {score}
                  </span>
                  <span className="text-base font-semibold text-muted-foreground">/100</span>
                </div>
                <Badge
                  variant="outline"
                  className={`mt-2 gap-1.5 rounded-md ${meta.pillClass}`}
                >
                  <span className={`inline-block h-2 w-2 rounded-full ${meta.dotClass} animate-pulse`} />
                  <StatusIcon className="h-3 w-3" />
                  {r.statusLabel || meta.label}
                </Badge>
              </div>
              {r.summarySentence && (
                <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                  {r.summarySentence}
                </p>
              )}
            </div>

            {/* Right: tiers + factors + CTAs */}
            <div className="flex-1 p-6 md:p-7 flex flex-col gap-5">
              {tiers.length > 0 && (
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {tiers.map((t) => {
                    const price = Number(t.data.price) || 0;
                    const monthly = Number(t.data.monthly) || 0;
                    let variant =
                      "bg-background border-border/60 hover:border-accent/60";
                    let labelClass = "text-muted-foreground";
                    let priceClass = "text-foreground";
                    let subClass = "text-muted-foreground";
                    if (t.key === "stretch") {
                      variant = "bg-accent/10 border-accent/30 hover:border-accent";
                      labelClass = "text-accent";
                    } else if (t.key === "maximum") {
                      variant = "bg-foreground border-foreground";
                      labelClass = "text-background/60";
                      priceClass = "text-background";
                      subClass = "text-background/70";
                    }
                    return (
                      <div
                        key={t.key}
                        className={`rounded-xl border p-3 transition-colors ${variant}`}
                      >
                        <p
                          className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${labelClass}`}
                        >
                          {t.label}
                        </p>
                        <p
                          className={`font-serif text-lg font-semibold tabular-nums ${priceClass}`}
                        >
                          {priceShort(price)}
                        </p>
                        <p className={`text-[11px] ${subClass}`}>
                          ~{formatCurrency(monthly)}/mo
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-col lg:flex-row items-stretch lg:items-end justify-between gap-5 pt-4 border-t border-foreground/5">
                {topFactors.length > 0 && (
                  <div className="flex-1 space-y-3">
                    {topFactors.map((f, i) => {
                      const s = Math.max(0, Math.min(100, Number(f.score) || 0));
                      return (
                        <div key={i}>
                          <div className="flex justify-between mb-1 text-[11px] font-medium text-foreground">
                            <span>{f.label}</span>
                            <span className="tabular-nums font-bold">{Math.round(s)}</span>
                          </div>
                          <div className="w-full h-1.5 bg-foreground/5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${factorBarColor(s)}`}
                              style={{ width: `${s}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex flex-col gap-2 shrink-0 lg:w-48">
                  <Button
                    size="sm"
                    onClick={goToFullReport}
                    className="rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 font-semibold shadow-md shadow-accent/20"
                  >
                    View full report
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={goToAffordability}
                    className="rounded-xl border-foreground/20 hover:bg-foreground/5 font-semibold"
                  >
                    View affordability
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
