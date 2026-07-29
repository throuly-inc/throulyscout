import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Info, TrendingDown, Shield, Landmark, DollarSign, Star } from "lucide-react";
import { formatCurrency, formatPercent, MortgageCalculation, FinancialProfile, LoanType } from "@/lib/calculator";
import { cn } from "@/lib/utils";

interface SmartInsightsProps {
  calc: MortgageCalculation;
  financialProfile: FinancialProfile;
  loanType: LoanType;
  selectedDownPayment: number;
  stateName: string;
  loanTypeId: string;
}

interface Recommendation {
  type: "red" | "yellow" | "green" | "blue";
  icon: React.ReactNode;
  title: string;
  message: string;
  priority: number;
}

export function SmartInsights({
  calc,
  financialProfile,
  loanType,
  selectedDownPayment,
  stateName,
  loanTypeId,
}: SmartInsightsProps) {
  const navigate = useNavigate();
  const recommendations: Recommendation[] = [];

  // Savings opportunity insight — pinned as top insight when contribution < 100%
  const totalSavings = financialProfile.totalSavings;
  const contributionPct = financialProfile.savingsContributionPct ?? 100;
  const committedSavings = financialProfile.savings;

  let savingsOpportunityInsight: Recommendation | null = null;
  if (totalSavings !== undefined && contributionPct < 100) {
    const uncommitted = totalSavings - committedSavings;
    const remainingPct = 100 - contributionPct;
    savingsOpportunityInsight = {
      type: "green",
      icon: <Star className="w-5 h-5" />,
      title: "Savings Opportunity",
      message: `You still have ${formatCurrency(uncommitted)} in savings not committed to this purchase. Contributing an additional ${remainingPct}% could strengthen your offer, boost your down payment, or reduce mortgage insurance costs.`,
      priority: 0,
    };
  }

  const backEndDTI = calc.backEndDTI;
  const grossMonthlyIncome = financialProfile.yearlyIncome / 12;
  const estimatedTakeHome = grossMonthlyIncome * 0.75;
  const housingPctOfTakeHome = estimatedTakeHome > 0 ? (calc.totalMonthlyPayment / estimatedTakeHome) * 100 : 0;

  // DTI recommendations
  if (backEndDTI > 43) {
    const debtReduction = Math.round(((backEndDTI - 40) / 100) * grossMonthlyIncome);
    recommendations.push({
      type: "red",
      icon: <AlertTriangle className="w-5 h-5" />,
      title: "High Debt-to-Income Ratio",
      message: `Your DTI is ${formatPercent(backEndDTI)} which exceeds standard limits. Consider: reducing your target home price, paying down ${formatCurrency(debtReduction)}/mo in monthly debt first, or increasing your down payment to reduce the loan amount.`,
      priority: 1,
    });
  } else if (backEndDTI >= 36) {
    recommendations.push({
      type: "yellow",
      icon: <AlertTriangle className="w-5 h-5" />,
      title: "Manageable but Tight DTI",
      message: `Your DTI of ${formatPercent(backEndDTI)} is manageable but leaves limited room. FHA loans allow up to 56.99% with compensating factors, but a lower DTI means better rates and easier approval.`,
      priority: 3,
    });
  } else {
    recommendations.push({
      type: "green",
      icon: <CheckCircle2 className="w-5 h-5" />,
      title: "Strong DTI Position",
      message: `Your DTI of ${formatPercent(backEndDTI)} is strong. You're well-positioned for competitive rates and fast approval.`,
      priority: 5,
    });
  }

  // PMI recommendation
  if (selectedDownPayment < 20 && calc.monthlyPMI > 0) {
    const twentyPctAmount = Math.round(calc.homePrice * 0.2);
    const annualPMISavings = calc.monthlyPMI * 12;
    recommendations.push({
      type: "blue",
      icon: <Shield className="w-5 h-5" />,
      title: "Mortgage Insurance Cost",
      message: `Putting down ${selectedDownPayment}% means you'll pay ${formatCurrency(calc.monthlyPMI)}/mo in mortgage insurance. Increasing to 20% (${formatCurrency(twentyPctAmount)}) eliminates PMI and saves you ${formatCurrency(annualPMISavings)}/year.`,
      priority: 2,
    });
  }

  // Savings / reserves recommendation
  const remainingSavings = financialProfile.savings - calc.totalCashNeeded;
  if (remainingSavings > 0) {
    const reserveMonths = Math.floor(remainingSavings / calc.totalMonthlyPayment);
    const recommendedReserve = calc.totalMonthlyPayment * 3;
    const meetsThreshold = remainingSavings >= recommendedReserve;
    recommendations.push({
      type: "blue",
      icon: <DollarSign className="w-5 h-5" />,
      title: "Cash Reserves",
      message: `After closing costs, you'll have ${formatCurrency(remainingSavings)} in reserves (${reserveMonths} months of payments). Lenders like to see 2-3 months of payments (${formatCurrency(recommendedReserve)}) in reserves — you ${meetsThreshold ? "meet" : "don't meet"} this threshold.`,
      priority: 4,
    });
  }

  // Housing cost vs take-home
  if (housingPctOfTakeHome > 30) {
    const targetMonthly = Math.round(estimatedTakeHome * 0.3);
    recommendations.push({
      type: "yellow",
      icon: <TrendingDown className="w-5 h-5" />,
      title: "Housing Cost Warning",
      message: `Your mortgage would be ${Math.round(housingPctOfTakeHome)}% of your estimated take-home pay. Financial advisors recommend keeping housing costs under 30% of take-home. Consider targeting ${formatCurrency(targetMonthly)}/mo or less.`,
      priority: 2,
    });
  }

  // FHA tip
  if (loanType.id === "fha" && financialProfile.creditScore >= 580) {
    recommendations.push({
      type: "blue",
      icon: <Info className="w-5 h-5" />,
      title: "FHA Loan Tip",
      message: `With FHA, you qualify for the minimum 3.5% down. If you can put 10%+ down, your monthly PMI drops off after 11 years instead of lasting the life of the loan.`,
      priority: 6,
    });
  }

  const topRecs = recommendations.sort((a, b) => a.priority - b.priority).slice(0, 4);

  const borderColors = {
    red: "border-l-destructive",
    yellow: "border-l-warning",
    green: "border-l-success",
    blue: "border-l-primary",
  };

  const iconColors = {
    red: "text-destructive",
    yellow: "text-warning",
    green: "text-success",
    blue: "text-primary",
  };

  const bgColors = {
    red: "bg-destructive/5",
    yellow: "bg-warning/5",
    green: "bg-success/5",
    blue: "bg-primary/5",
  };

  return (
    <div className="space-y-3">
      {/* Savings opportunity — always first, highlighted */}
      {savingsOpportunityInsight && (
        <Card className="p-4 border-l-4 border-l-success bg-success/10 ring-1 ring-success/30">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0 text-success">
              <Star className="w-5 h-5 fill-success" />
            </span>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-foreground text-sm">{savingsOpportunityInsight.title}</p>
                <Badge className="text-xs bg-success/20 text-success border-success/30 hover:bg-success/20">
                  Top Insight
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{savingsOpportunityInsight.message}</p>
            </div>
          </div>
        </Card>
      )}

      {topRecs.map((rec, i) => (
        <Card key={i} className={cn("p-4 border-l-4", borderColors[rec.type], bgColors[rec.type])}>
          <div className="flex items-start gap-3">
            <span className={cn("mt-0.5 shrink-0", iconColors[rec.type])}>{rec.icon}</span>
            <div>
              <p className="font-medium text-foreground text-sm mb-1">{rec.title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{rec.message}</p>
            </div>
          </div>
        </Card>
      ))}

      {/* Loan officer note */}
      <Card className="p-4 border-l-4 border-l-accent bg-accent/5">
        <div className="flex items-start gap-3">
          <Landmark className="w-5 h-5 text-accent mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-foreground text-sm mb-1">Want personalized advice?</p>
            <p className="text-sm text-muted-foreground">
              Speak with a licensed loan officer for a full financial review and personalized rate.
            </p>
          </div>
        </div>
      </Card>

    </div>
  );
}
