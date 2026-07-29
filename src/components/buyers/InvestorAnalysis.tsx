import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  TrendingUp,
  HelpCircle,
  DollarSign,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  calculateInvestorMetrics,
  formatCurrency,
  formatPercent,
  ExpenseAssumptions,
} from "@/lib/calculator";
import { cn } from "@/lib/utils";

interface InvestorAnalysisProps {
  homePrice: number;
  monthlyMortgage: number;
  monthlyPropertyTax: number;
  monthlyInsurance: number;
  monthlyPMI: number;
  monthlyHOA: number;
  totalCashNeeded: number;
  expectedRentalIncome: number;
}

export function InvestorAnalysis({
  homePrice,
  monthlyMortgage,
  monthlyPropertyTax,
  monthlyInsurance,
  monthlyPMI,
  monthlyHOA,
  totalCashNeeded,
  expectedRentalIncome,
}: InvestorAnalysisProps) {
  const [expenses, setExpenses] = useState<ExpenseAssumptions>({
    vacancyRate: 5,
    maintenanceRate: 5,
    managementRate: 8,
    capexRate: 5,
  });

  const metrics = calculateInvestorMetrics(
    homePrice,
    expectedRentalIncome,
    expenses,
    monthlyMortgage,
    monthlyPropertyTax,
    monthlyInsurance,
    monthlyPMI,
    monthlyHOA,
    totalCashNeeded
  );

  const sliders = [
    { key: "vacancyRate" as const, label: "Vacancy", min: 0, max: 15, tip: "Expected % of time units are empty" },
    { key: "maintenanceRate" as const, label: "Maintenance", min: 0, max: 15, tip: "Annual repair & upkeep costs as % of rent" },
    { key: "managementRate" as const, label: "Management", min: 0, max: 12, tip: "Property management fee as % of rent" },
    { key: "capexRate" as const, label: "CapEx Reserve", min: 0, max: 10, tip: "Capital expenditure reserve as % of rent" },
  ];

  return (
    <TooltipProvider>
      <Card className="p-5 mb-4">
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 className="w-5 h-5 text-accent" />
          <h3 className="font-medium text-foreground">Investment Analysis</h3>
          <Badge variant="outline" className="text-xs">Multi-Family</Badge>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <MetricCard
            label="Gross Yield"
            value={formatPercent(metrics.grossRentalYield)}
            tip="Annual rental income ÷ home price"
            positive={metrics.grossRentalYield > 0}
          />
          <MetricCard
            label="Cap Rate"
            value={formatPercent(metrics.capRate)}
            tip="Net Operating Income ÷ home price"
            positive={metrics.capRate > 0}
          />
          <MetricCard
            label="Cash-on-Cash"
            value={formatPercent(metrics.cashOnCashReturn)}
            tip="Annual cash flow ÷ total cash invested"
            positive={metrics.cashOnCashReturn > 0}
          />
          <MetricCard
            label="Monthly Cash Flow"
            value={formatCurrency(metrics.monthlyCashFlow)}
            tip="Net rental income after all expenses & mortgage"
            positive={metrics.monthlyCashFlow > 0}
          />
        </div>

        {/* NOI Summary */}
        <div className="p-4 bg-secondary rounded-lg mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Annual Rental Income</span>
            <span className="font-medium text-success">{formatCurrency(metrics.annualRentalIncome)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Annual Expenses</span>
            <span className="font-medium text-destructive">−{formatCurrency(metrics.annualExpenses)}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-border pt-2">
            <span className="font-medium text-foreground">Net Operating Income (NOI)</span>
            <span className={cn("font-bold", metrics.noi >= 0 ? "text-success" : "text-destructive")}>
              {formatCurrency(metrics.noi)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Annual Mortgage Payments</span>
            <span className="font-medium">−{formatCurrency(metrics.annualMortgagePayments)}</span>
          </div>
        </div>

        {/* Expense Sliders */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Expense Assumptions</h4>
          {sliders.map((s) => (
            <div key={s.key} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Label className="text-sm">{s.label}</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent><p>{s.tip}</p></TooltipContent>
                  </Tooltip>
                </div>
                <span className="text-sm font-medium">{expenses[s.key]}%</span>
              </div>
              <Slider
                min={s.min}
                max={s.max}
                step={1}
                value={[expenses[s.key]]}
                onValueChange={([v]) => setExpenses((prev) => ({ ...prev, [s.key]: v }))}
              />
            </div>
          ))}
        </div>
      </Card>
    </TooltipProvider>
  );
}

function MetricCard({ label, value, tip, positive }: { label: string; value: string; tip: string; positive: boolean }) {
  return (
    <TooltipProvider>
      <div className="p-3 bg-secondary rounded-lg text-center">
        <div className="flex items-center justify-center gap-1 mb-1">
          <span className="text-xs text-muted-foreground">{label}</span>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="w-3 h-3 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent><p>{tip}</p></TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-center justify-center gap-1">
          {positive ? (
            <ArrowUpRight className="w-4 h-4 text-success" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-destructive" />
          )}
          <span className={cn("text-lg font-bold", positive ? "text-success" : "text-destructive")}>
            {value}
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
}
