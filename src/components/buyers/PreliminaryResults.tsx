import { useState, useMemo } from "react";
import { StateData } from "@/lib/states";
import {
  calculateMortgage,
  formatCurrency,
  formatPercent,
  FinancialProfile,
  LOAN_TYPES,
  DOWN_PAYMENT_OPTIONS,
} from "@/lib/calculator";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ResultsDisclaimer } from "@/components/common/ResultsDisclaimer";
import {
  DarkResultPanel,
  DarkEyebrow,
  DarkStatTile,
  DarkInsetCard,
  DarkHeadlineValue,
  DarkCostList,
  DarkCostRow,
} from "@/components/results/DarkResultPanels";
import {
  TrendingUp,
  DollarSign,
  Home,
  ShieldCheck,
  ArrowRight,
  Save,
  RefreshCw,
  CreditCard,
  PiggyBank,
  Target,
  Sparkles,
  HelpCircle,
} from "lucide-react";

interface PreliminaryResultsProps {
  state: StateData;
  yearlyIncome: number;
  onContinueFull: (avgHomePrice: number) => void;
  onTryDifferentState: () => void;
  onSave: () => void;
}

export function PreliminaryResults({
  state,
  yearlyIncome,
  onContinueFull,
  onTryDifferentState,
  onSave,
}: PreliminaryResultsProps) {
  const [downPaymentPct, setDownPaymentPct] = useState<number>(20);
  const [sellerConcession, setSellerConcession] = useState(false);
  const [concessionAmount, setConcessionAmount] = useState<number | null>(null);

  const profile: FinancialProfile = useMemo(
    () => ({
      yearlyIncome,
      monthlyDebt: 0,
      savings: 0,
      creditScore: 720,
      employmentType: "w2",
      isFirstTimeBuyer: true,
    }),
    [yearlyIncome],
  );

  const probeCalc = calculateMortgage(400000, downPaymentPct, state, profile, 0, "conventional");
  const highEnd = probeCalc.maxAffordablePrice;
  const lowEnd = Math.round(highEnd * 0.7);

  const highCalc = calculateMortgage(highEnd, downPaymentPct, state, profile, 0, "conventional");
  const lowCalc = calculateMortgage(lowEnd, downPaymentPct, state, profile, 0, "conventional");

  const conventional = LOAN_TYPES.find((lt) => lt.id === "conventional")!;
  const totalCashPctOfHome = highEnd > 0 ? (highCalc.totalCashNeeded / highEnd) * 100 : 0;
  const maxConcession = highCalc.closingCosts;
  const appliedConcession = sellerConcession
    ? Math.min(maxConcession, concessionAmount ?? maxConcession)
    : 0;
  const effectiveClosing = Math.max(0, highCalc.closingCosts - appliedConcession);
  const effectiveTotal = highCalc.downPaymentAmount + effectiveClosing;
  const effectiveTotalPct = highEnd > 0 ? (effectiveTotal / highEnd) * 100 : 0;

  return (
    <TooltipProvider>
    <div className="max-w-6xl mx-auto">
      {/* Header — matches "Your Home Affordability Results" */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <h1 className="font-serif text-2xl md:text-3xl text-foreground">
            What you'll need in {state.name}
          </h1>
          <Badge className="bg-accent/20 text-accent border-accent/30">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Quick Estimate
          </Badge>
        </div>
        <p className="text-muted-foreground">
          A snapshot based on your state and income. Continue for fully personalized results.
        </p>
      </div>

      {/* Home Price Range — hero banner (mirrors Max Affordable Price banner) */}
      <Card className="p-6 mb-6 bg-gradient-to-r from-accent/10 to-primary/10 border-accent/30">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="w-6 h-6 text-accent" />
          <span className="text-muted-foreground">Home Price Range You Qualify For</span>
        </div>
        <p className="font-serif text-4xl text-accent mb-2">
          {formatCurrency(lowEnd)} <span className="text-muted-foreground">–</span>{" "}
          {formatCurrency(highEnd)}
        </p>
        <p className="text-sm text-muted-foreground">
          With {downPaymentPct}% down, based on {state.name}'s tax & insurance rates
        </p>
      </Card>

      {/* Down Payment Selector — same pattern as final results */}
      <Card className="p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-accent" />
          <h2 className="font-medium text-foreground">Select Down Payment</h2>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
          {DOWN_PAYMENT_OPTIONS.map((dp) => {
            const dpCalc = calculateMortgage(highEnd, dp, state, profile, 0, "conventional");
            return (
              <button
                key={dp}
                onClick={() => setDownPaymentPct(dp)}
                className={cn(
                  "py-3 px-2 sm:px-4 rounded-lg border-2 text-center transition-all",
                  downPaymentPct === dp
                    ? "border-accent bg-accent/10"
                    : "border-border hover:border-muted-foreground",
                )}
              >
                <span className="text-base font-bold">{dp}%</span>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(dpCalc.downPaymentAmount)}
                </p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Upfront Costs Needed — dark treatment matching "Monthly Estimate" panel */}
      <DarkResultPanel className="mb-4">
        <DarkEyebrow icon={<DollarSign className="w-3.5 h-3.5" />}>Upfront Costs Needed</DarkEyebrow>
        <div className={cn("grid grid-cols-2 auto-rows-fr items-stretch gap-3", sellerConcession ? "sm:grid-cols-4" : "sm:grid-cols-3")}>
          <DarkStatTile label={`Down Payment (${downPaymentPct}%)`} value={formatCurrency(highCalc.downPaymentAmount)} />
          <DarkStatTile
            label="Closing Costs"
            value={formatCurrency(effectiveClosing)}
            tooltip={
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" aria-label="Seller's Concession info" className="inline-flex h-4 w-4 items-center justify-center">
                    <HelpCircle className="w-3 h-3 font-semibold text-foreground/80" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-medium mb-1">Seller's Concession</p>
                  <p>
                    A seller's concession is when the seller agrees to cover your closing costs as part of the deal
                    negotiation. This reduces your upfront cash needed at closing.
                  </p>
                </TooltipContent>
              </Tooltip>
            }
          />
          {sellerConcession && (
            <DarkStatTile
              label="Seller's Concession"
              value={`−${formatCurrency(appliedConcession)}`}
              valueClassName="text-success"
            />
          )}
          <DarkStatTile
            label={`Total Upfront (~${formatPercent(effectiveTotalPct, 0)})`}
            value={formatCurrency(effectiveTotal)}
            emphasis
          />
        </div>

        {/* Seller's Concession toggle */}
        <DarkInsetCard className="mt-4 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <Switch
                id="prelim-seller-concession"
                checked={sellerConcession}
                onCheckedChange={setSellerConcession}
              />
              <Label htmlFor="prelim-seller-concession" className="text-sm font-semibold text-foreground cursor-pointer">
                Apply Seller's Concession
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" aria-label="Seller's Concession info">
                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </TooltipTrigger>

                <TooltipContent className="max-w-xs">
                  <p>
                    A seller's concession is when the seller agrees to cover your closing costs as part of the deal
                    negotiation. This reduces your upfront cash needed at closing.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            {sellerConcession && (
              <span className="text-xs text-success font-medium">
                Saving {formatCurrency(appliedConcession)}
              </span>
            )}
          </div>
        </DarkInsetCard>

        {sellerConcession && (
          <DarkInsetCard className="mt-3 p-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold text-foreground">Concession amount</Label>
              <span className="text-sm font-bold text-foreground tabular-nums">
                {formatCurrency(appliedConcession)}{" "}
                <span className="text-foreground/60 font-semibold">
                  / {formatCurrency(maxConcession)}
                </span>
              </span>
            </div>
            <Slider
              value={[appliedConcession]}
              min={0}
              max={maxConcession}
              step={Math.max(100, Math.round(maxConcession / 100 / 100) * 100)}
              onValueChange={(v) => setConcessionAmount(v[0] ?? 0)}
            />
            <div className="flex justify-between text-[11px] font-semibold text-foreground/70 mt-1.5">
              <span>$0</span>
              <span>{formatCurrency(maxConcession)} (full)</span>
            </div>

          </DarkInsetCard>
        )}
      </DarkResultPanel>

      {/* Monthly Payment Breakdown — dark treatment matching reference */}
      <DarkResultPanel className="mb-4">
        <DarkEyebrow icon={<Home className="w-3.5 h-3.5" />}>Monthly Payment Breakdown</DarkEyebrow>
        <DarkHeadlineValue
          value={formatCurrency(highCalc.totalMonthlyPayment)}
          suffix="/mo"
        />
        <p className="mt-2 mb-5 text-sm font-semibold text-foreground/80">
          Based on a home priced at {formatCurrency(highEnd)} (top of your range).
        </p>
        <DarkCostList>
          <DarkCostRow label="Principal & Interest" value={formatCurrency(highCalc.monthlyMortgage)} />
          <DarkCostRow label="Property Tax" value={formatCurrency(highCalc.monthlyPropertyTax)} />
          <DarkCostRow label="Homeowners Insurance" value={formatCurrency(highCalc.monthlyInsurance)} />
          {highCalc.monthlyPMI > 0 && (
            <DarkCostRow label="PMI" value={formatCurrency(highCalc.monthlyPMI)} />
          )}
        </DarkCostList>
        <ResultsDisclaimer variant="inline" className="mt-5" />

      </DarkResultPanel>


      {/* Qualification Requirements — mirrors "Minimum Income Required" gradient card */}
      <Card className="p-5 mb-4 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-primary" />
          <h2 className="font-medium text-foreground">Qualification Requirements</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-4 bg-card/60 rounded-lg border border-border">
            <div className="flex items-center gap-2 text-primary mb-2">
              <DollarSign className="w-4 h-4" />
              <p className="text-xs text-muted-foreground">Yearly Income Range</p>
            </div>
            <p className="font-serif text-lg text-foreground">
              {formatCurrency(lowCalc.minIncomeRequired)} – {formatCurrency(highCalc.minIncomeRequired)}
            </p>
          </div>
          <div className="p-4 bg-card/60 rounded-lg border border-border">
            <div className="flex items-center gap-2 text-primary mb-2">
              <CreditCard className="w-4 h-4" />
              <p className="text-xs text-muted-foreground">Min Credit Score</p>
            </div>
            <p className="font-serif text-lg text-foreground">{conventional.minCreditScore}+</p>
          </div>
          <div className="p-4 bg-card/60 rounded-lg border border-border">
            <div className="flex items-center gap-2 text-primary mb-2">
              <PiggyBank className="w-4 h-4" />
              <p className="text-xs text-muted-foreground">Total Savings Needed</p>
            </div>
            <p className="font-serif text-lg text-foreground">
              {formatCurrency(highCalc.totalCashNeeded)}
            </p>
          </div>
        </div>
      </Card>

      {/* Want Personalized Results? — gradient hero banner */}
      <Card className="p-6 mb-6 bg-gradient-to-r from-accent/10 to-primary/10 border-accent/30 text-center">
        <Badge className="mb-3 bg-accent/20 text-accent border-accent/30">
          <ShieldCheck className="w-3.5 h-3.5 mr-1" />
          Personalize
        </Badge>
        <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-2">
          Want Personalized Results?
        </h2>
        <p className="text-muted-foreground mb-5 max-w-xl mx-auto">
          Get full personalized results based on your complete financial picture — credit score, savings, debts, and more.
        </p>
        <Button variant="accent" size="lg" onClick={() => onContinueFull(Math.round((lowEnd + highEnd) / 2))}>
          Continue to Full Calculator
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Card>

      {/* Bottom Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" size="lg" onClick={onTryDifferentState} className="flex-1">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try a Different State
        </Button>
        <Button variant="default" size="lg" onClick={onSave} className="flex-1">
          <Save className="w-4 h-4 mr-2" />
          Save Results
        </Button>
      </div>

      <ResultsDisclaimer variant="footer" />
    </div>
    </TooltipProvider>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function UpfrontCostTile({
  label,
  value,
  valueClassName,
  tooltip,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  tooltip?: React.ReactNode;
}) {
  return (
    <div className="flex h-[72px] flex-col justify-center rounded-md border border-border bg-card/60 px-3 py-2.5">
      <div className="flex h-4 items-center gap-1 text-[11px] leading-none text-muted-foreground">
        <span className="truncate">{label}</span>
        {tooltip}
      </div>
      <p className={cn("mt-2 text-base font-bold leading-none text-foreground tabular-nums", valueClassName)}>{value}</p>
    </div>
  );
}
