import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DollarSign, TrendingUp, Target, CheckCircle2, Lightbulb } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { formatCurrency } from "@/lib/calculator";
import { statesData } from "@/lib/states";

interface Props {
  estimate: any | null;
  loading: boolean;
}

const CREDIT_LEVELS = [
  { label: "Poor", min: 0 },
  { label: "Fair", min: 580 },
  { label: "Good", min: 670 },
  { label: "Very Good", min: 740 },
  { label: "Excellent", min: 800 },
];

function creditLevelIndex(score: number) {
  let idx = 0;
  CREDIT_LEVELS.forEach((l, i) => {
    if (score >= l.min) idx = i;
  });
  return idx;
}

const SectionHeader = () => (
  <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">MAJOR QUALIFICATION FACTORS</p>
);

export function FinancialHealthTrackers({ estimate, loading }: Props) {
  const navigate = useNavigate();
  if (loading) return null;

  const goToResults = () => {
    if (!estimate) {
      navigate("/buyers");
      return;
    }
    const i = estimate.inputs || {};
    const abbr = i.stateAbbreviation || i.state;
    const stateObj =
      statesData.find((s) => s.abbreviation === abbr) || statesData.find((s) => s.name === i.state) || statesData[0];
    try {
      sessionStorage.setItem(
        "throuly_buyers_session",
        JSON.stringify({
          selectedState: stateObj,
          homePrice: Number(i.homePrice) || 400000,
          hoaMonthly: Number(i.hoaMonthly) || 0,
          financialProfile: {
            yearlyIncome: Number(i.yearlyIncome) || 100000,
            monthlyDebt: Number(i.monthlyDebt) || 0,
            savings: Number(i.savings) || 0,
            creditScore: Number(i.creditScore) || 720,
            employmentType: i.employmentType || "w2",
            isFirstTimeBuyer: i.isFirstTimeBuyer ?? true,
          },
          loanTypeId: i.loanTypeId || "conventional",
        }),
      );
    } catch {}
    navigate("/buyers");
  };

  if (!estimate) {
    return (
      <div className="space-y-3">
        <SectionHeader />
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Complete the{" "}
              <Link to="/buyers" className="text-accent underline underline-offset-4">
                Home Affordability Calculator
              </Link>{" "}
              to unlock your trackers.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const inputs = estimate.inputs || {};
  const results = estimate.results || {};

  const savings = Number(inputs.savings || 0);
  const totalCashNeeded = Number(results.totalCashNeeded || 0);
  const savingsPct = totalCashNeeded > 0 ? Math.min(100, (savings / totalCashNeeded) * 100) : 0;
  const savingsGap = Math.max(0, totalCashNeeded - savings);
  const savingsMet = savings >= totalCashNeeded && totalCashNeeded > 0;

  const dti = Number(results.backEndDTI || 0);
  const dtiPct = Math.min(100, (dti / 43) * 100);
  const dtiColor = dti < 36 ? "text-success" : dti <= 43 ? "text-warning" : "text-destructive";
  const dtiFill = dti < 36 ? "bg-success" : dti <= 43 ? "bg-warning" : "bg-destructive";
  const monthlyDebt = Number(inputs.monthlyDebt || 0);
  const buyingPowerImpact = Math.round(monthlyDebt * 0.5 * 140); // ~$140 home price per $1 monthly debt reduction

  const creditScore = Number(inputs.creditScore || 0);
  const cIdx = creditLevelIndex(creditScore);
  const creditLabel = CREDIT_LEVELS[cIdx].label;
  const nextLevel = CREDIT_LEVELS[cIdx + 1];
  const creditPct = ((cIdx + 1) / CREDIT_LEVELS.length) * 100;

  const yearlyIncome = Number(inputs.yearlyIncome || 0);
  // Estimate min income required from monthly payment / 0.36 / 12
  const totalMonthly = Number(results.totalMonthlyPayment || 0);
  const minIncome = Math.round(((totalMonthly + monthlyDebt) * 12) / 0.43);
  const incomePct = minIncome > 0 ? Math.min(100, (yearlyIncome / minIncome) * 100) : 100;
  const incomeMet = yearlyIncome >= minIncome;
  const incomeGap = Math.abs(yearlyIncome - minIncome);

  // Quick win insight
  let insight = "";
  if (dti > 43) {
    insight = `Pay down ${formatCurrency(Math.ceil((((dti - 36) / 100) * yearlyIncome) / 12))} in monthly debt to drop your DTI under 36%.`;
  } else if (!savingsMet && savingsGap > 0) {
    const monthlyTarget = Math.ceil(savingsGap / 12);
    insight = `Save ${formatCurrency(monthlyTarget)}/mo for 12 months to fully fund your closing costs and down payment.`;
  } else if (nextLevel && creditScore < nextLevel.min) {
    insight = `Reach a ${nextLevel.label} credit score (${nextLevel.min}+) to unlock better rates and lower PMI.`;
  } else if (!incomeMet) {
    insight = `An additional ${formatCurrency(incomeGap)}/year in income would comfortably cover this home.`;
  } else {
    insight = `You're in great shape — consider increasing your down payment to reduce your monthly payment.`;
  }

  return (
    <div className="space-y-3">
      <SectionHeader />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Savings Goal */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <DollarSign className="w-3.5 h-3.5 text-accent" />
              Savings Goal
            </div>
            <p className="font-serif text-3xl font-semibold text-foreground">{formatCurrency(savings)}</p>
            <p className="text-sm text-muted-foreground">
              Need <span className="font-semibold text-foreground">{formatCurrency(totalCashNeeded)}</span> total ·{" "}
              <span className={savingsMet ? "text-success font-semibold" : "text-warning font-semibold"}>
                {savingsMet ? "Goal met" : `${formatCurrency(savingsGap)} to go`}
              </span>
            </p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Current savings</span>
                <span>{Math.round(savingsPct)}% there</span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-accent transition-all" style={{ width: `${savingsPct}%` }} />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.location.hash = "savings";
                setTimeout(() => {
                  document.getElementById("savings-planner")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 60);
              }}
              className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
            >
              Open Savings Planner
            </Button>
          </CardContent>
        </Card>

        {/* DTI */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <TrendingUp className="w-3.5 h-3.5 text-accent" />
              Debt-to-Income
            </div>
            <p className={`font-serif text-3xl font-semibold ${dtiColor}`}>{dti.toFixed(1)}%</p>
            <p className={`text-sm font-medium ${dtiColor}`}>
              {dti < 36 ? "✓ Comfortably under 36%" : dti <= 43 ? "✓ Within the 43% limit" : "Over the 43% limit"}
            </p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Your DTI</span>
                <span>Target ≤ 43%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div className={`h-full transition-all ${dtiFill}`} style={{ width: `${dtiPct}%` }} />
              </div>
            </div>
            {monthlyDebt > 0 && (
              <p className="text-xs text-muted-foreground">
                Reducing monthly debt by{" "}
                <span className="text-foreground font-semibold">{formatCurrency(Math.round(monthlyDebt / 2))}/mo</span>{" "}
                improves buying power by ~{formatCurrency(buyingPowerImpact)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Credit Score */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Target className="w-3.5 h-3.5 text-accent" />
              Credit Score Range
            </div>
            <p className="font-serif text-3xl font-semibold text-foreground">{creditLabel}</p>
            <p className="text-sm text-muted-foreground">
              Score: <span className="font-semibold text-foreground">{creditScore}</span>
            </p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{CREDIT_LEVELS[0].label}</span>
                <span>{CREDIT_LEVELS[CREDIT_LEVELS.length - 1].label}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${creditPct}%` }} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {nextLevel
                ? `Reaching ${nextLevel.min}+ unlocks better rates and lower PMI.`
                : "You qualify for the best available rates."}
            </p>
          </CardContent>
        </Card>

        {/* Income vs Requirement */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
              Income vs Requirement
            </div>
            <p className="font-serif text-3xl font-semibold text-foreground">{formatCurrency(yearlyIncome)}</p>
            <p className={`text-sm font-medium ${incomeMet ? "text-success" : "text-destructive"}`}>
              {incomeMet
                ? `✓ ${formatCurrency(incomeGap)} above minimum required`
                : `Need ${formatCurrency(incomeGap)} more annually`}
            </p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Min required: {formatCurrency(minIncome)}</span>
                <span>Your income</span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-success transition-all" style={{ width: `${incomePct}%` }} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {incomeMet ? "You comfortably qualify." : "Increase income or lower target price."}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Insight strip */}
      <Card className="bg-accent/5 border-accent/20">
        <CardContent className="p-4 flex items-start gap-3">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-accent/10 shrink-0">
            <Lightbulb className="w-4 h-4 text-accent" />
          </span>
          <div className="text-sm">
            <span className="font-semibold text-foreground">Quick Win · </span>
            <span className="text-muted-foreground">{insight}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
