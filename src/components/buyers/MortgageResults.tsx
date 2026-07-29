import { useState } from "react";
import { StateData } from "@/lib/states";
import { FinancialProfile, calculateMortgage, formatCurrency, formatPercent, DOWN_PAYMENT_OPTIONS, getQualificationStatus } from "@/lib/calculator";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { CheckCircle, XCircle, TrendingUp, Home, DollarSign, Percent, Users, Save, SlidersHorizontal, CreditCard, PiggyBank, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

import { ResultsDisclaimer } from "@/components/common/ResultsDisclaimer";

interface MortgageResultsProps {
  state: StateData;
  profile: FinancialProfile;
  homePrice: number;
  hoaMonthly: number;
  onConnectAgent: () => void;
  onSaveResults: () => void;
}

const PRICE_OPTIONS = [200000, 300000, 400000, 500000, 600000, 750000, 900000, 1000000];

export function MortgageResults({
  state,
  profile: initialProfile,
  hoaMonthly,
  onConnectAgent,
  onSaveResults,
}: MortgageResultsProps) {
  const [selectedDownPayment, setSelectedDownPayment] = useState<number>(20);
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [showSellersModal, setShowSellersModal] = useState(false);
  
  const [yearlyIncome, setYearlyIncome] = useState(initialProfile.yearlyIncome);
  const [monthlyDebt, setMonthlyDebt] = useState(initialProfile.monthlyDebt);
  const [savings, setSavings] = useState(initialProfile.savings);
  const [creditScore, setCreditScore] = useState(initialProfile.creditScore);

  const profile: FinancialProfile = {
    yearlyIncome,
    monthlyDebt,
    savings,
    creditScore,
  };

  const priceResults = PRICE_OPTIONS.map((price) => {
    const calc = calculateMortgage(price, selectedDownPayment, state, profile, hoaMonthly);
    return {
      price,
      // Badge reflects DTI + credit qualification so it stays consistent with
      // "you qualify for up to". Savings is surfaced separately as `cashShort`.
      qualifies: calc.qualifiesLoan,
      cashShort: calc.cashShortfall > 0,
      cashShortfall: calc.cashShortfall,
      monthlyPayment: calc.totalMonthlyPayment,
      dtiRatio: calc.backEndDTI,
      cashNeeded: calc.totalCashNeeded,
    };
  });

  const qualifiedPrices = priceResults.filter((r) => r.qualifies);
  const maxQualifiedPrice = qualifiedPrices.length > 0 
    ? Math.max(...qualifiedPrices.map((r) => r.price))
    : 0;

  const displayPrice = selectedPrice || maxQualifiedPrice || PRICE_OPTIONS[0];
  const selectedCalc = calculateMortgage(displayPrice, selectedDownPayment, state, profile, hoaMonthly);

  const allDownPaymentCalcs = DOWN_PAYMENT_OPTIONS.map((dp) =>
    calculateMortgage(displayPrice, dp, state, profile, hoaMonthly)
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <aside className="lg:w-80 shrink-0">
        <Card className="p-6 sticky top-4">
          <div className="flex items-center gap-2 mb-6">
            <SlidersHorizontal className="w-5 h-5 text-accent" />
            <h3 className="font-serif text-lg text-foreground">Financial Profile</h3>
          </div>
          
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-accent" />
                Yearly Income
              </Label>
              <MoneyInput
                value={yearlyIncome}
                onChange={(raw) => setYearlyIncome(Number(raw) || 0)}
                className="h-9"
                aria-label="Yearly income"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <CreditCard className="w-4 h-4 text-destructive" />
                Monthly Debt
              </Label>
              <MoneyInput
                value={monthlyDebt}
                onChange={(raw) => setMonthlyDebt(Number(raw) || 0)}
                className="h-9"
                aria-label="Monthly debt"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <PiggyBank className="w-4 h-4 text-success" />
                Available Savings
              </Label>
              <MoneyInput
                value={savings}
                onChange={(raw) => setSavings(Number(raw) || 0)}
                className="h-9"
                aria-label="Available savings"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Credit Score</Label>
                <span className="text-lg font-bold text-foreground">{creditScore}</span>
              </div>
              <Slider
                value={[creditScore]}
                onValueChange={(value) => setCreditScore(value[0])}
                min={300}
                max={850}
                step={10}
                className="w-full"
              />
            </div>
          </div>
        </Card>
      </aside>

      <div className="flex-1 space-y-6">
        <div className="text-center">
          <h2 className="font-serif text-3xl text-foreground mb-2">Your Investment Analysis</h2>
          <p className="text-muted-foreground">Qualification results for {state.name}</p>
        </div>

        <Card className="p-6">
          <h3 className="font-serif text-xl text-foreground mb-4">
            Monthly Payment ({selectedDownPayment}% Down on {formatCurrency(displayPrice)})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Principal & Interest", value: selectedCalc.monthlyMortgage, icon: Home },
              { label: "Property Tax", value: selectedCalc.monthlyPropertyTax, icon: DollarSign },
              { label: "Insurance", value: selectedCalc.monthlyInsurance, icon: Home },
              { label: "PMI", value: selectedCalc.monthlyPMI, icon: Percent },
              { label: "HOA", value: selectedCalc.monthlyHOA, icon: Home },
              { label: "Total", value: selectedCalc.totalMonthlyPayment, icon: DollarSign },
            ].map((item, index) => {
              const Icon = item.icon;
              const isTotal = index === 5;
              return (
                <div key={item.label} className={cn("p-4 rounded-xl text-center", isTotal ? "bg-accent text-accent-foreground" : "bg-secondary")}>
                  <Icon className={cn("w-5 h-5 mx-auto mb-2", isTotal ? "text-accent-foreground" : "text-muted-foreground")} />
                  <p className={cn("text-xs mb-1", isTotal ? "text-accent-foreground/80" : "text-muted-foreground")}>{item.label}</p>
                  <p className={cn("font-bold", isTotal ? "text-lg" : "")}>{formatCurrency(item.value)}</p>
                </div>
              );
            })}
          </div>
          <ResultsDisclaimer variant="inline" className="mt-4" />
        </Card>

        <div>
          <h3 className="font-serif text-xl text-foreground mb-4">Down Payment Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {allDownPaymentCalcs.map((calc) => (
              <Card
                key={calc.downPaymentPercent}
                onClick={() => setSelectedDownPayment(calc.downPaymentPercent)}
                className={cn(
                  "p-5 relative cursor-pointer transition-all",
                  selectedDownPayment === calc.downPaymentPercent && "ring-2 ring-accent",
                  calc.qualifiesLoan ? "border-success/50 hover:border-success" : "border-destructive/30 opacity-75"
                )}
              >
                <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                  {calc.qualifiesLoan ? (
                    <Badge className="bg-success text-success-foreground text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />Qualified
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs">
                      <XCircle className="w-3 h-3 mr-1" />Not Qualified
                    </Badge>
                  )}
                  {calc.qualifiesLoan && calc.cashShortfall > 0 && (
                    <span
                      className="text-[10px] font-medium text-warning bg-warning/10 border border-warning/30 rounded-full px-1.5 py-0.5"
                      title={`Save ${formatCurrency(calc.cashShortfall)} more for closing`}
                    >
                      Cash short
                    </span>
                  )}
                </div>
                <div className="mb-3">
                  <span className="text-3xl font-bold text-foreground">{calc.downPaymentPercent}%</span>
                  <span className="text-muted-foreground ml-1 text-sm">down</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Down Payment</span>
                    <span className="font-semibold">{formatCurrency(calc.downPaymentAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cash Needed</span>
                    <span className={cn("font-bold", calc.cashShortfall > 0 && "text-warning")}>
                      {formatCurrency(calc.totalCashNeeded)}
                    </span>
                  </div>
                </div>
                <div className="mt-3 p-2 bg-secondary rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-xs">Monthly</span>
                    <span className="font-serif text-lg font-bold">{formatCurrency(calc.totalMonthlyPayment)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            <span className="text-sm text-muted-foreground">With {selectedDownPayment}% down, you qualify for up to</span>
          </div>
          <p className="font-serif text-4xl text-accent">
            {maxQualifiedPrice > 0 ? formatCurrency(maxQualifiedPrice) : "Under $200K"}
          </p>
        </div>

        <div>
          <h3 className="font-serif text-xl text-foreground mb-4">Price Qualification Status</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {priceResults.map((result) => (
              <Card
                key={result.price}
                onClick={() => setSelectedPrice(result.price)}
                className={cn(
                  "p-4 cursor-pointer hover:scale-105 transition-all",
                  selectedPrice === result.price && "ring-2 ring-accent",
                  result.qualifies ? "border-success/50 bg-success/5" : "border-destructive/30 bg-destructive/5 opacity-80"
                )}
              >
                <div className="flex items-center justify-between mb-2 gap-1 flex-wrap">
                  {result.qualifies ? (
                    <Badge className="bg-success text-success-foreground text-xs"><CheckCircle className="w-3 h-3 mr-1" />Qualified</Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs"><XCircle className="w-3 h-3 mr-1" />Not Qualified</Badge>
                  )}
                  {result.qualifies && result.cashShort && (
                    <span
                      className="text-[10px] font-medium text-warning bg-warning/10 border border-warning/30 rounded-full px-1.5 py-0.5"
                      title={`Save ${formatCurrency(result.cashShortfall)} more for closing`}
                    >
                      Cash short
                    </span>
                  )}
                </div>
                <p className="font-serif text-xl font-bold text-foreground">{formatCurrency(result.price)}</p>
                <div className="mt-2 text-xs text-muted-foreground space-y-1">
                  <p>Monthly: {formatCurrency(result.monthlyPayment)}</p>
                  <p className={cn(result.dtiRatio <= 36 ? "text-success" : result.dtiRatio <= 43 ? "text-warning" : "text-destructive")}>
                    DTI: {formatPercent(result.dtiRatio)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <Card className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="secondary" size="lg" onClick={onSaveResults}>
              <Save className="w-5 h-5 mr-2" />Save Results
            </Button>
          </div>
        </Card>

        <ResultsDisclaimer variant="footer" />
      </div>

    </div>
  );
}
