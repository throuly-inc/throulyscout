import { FinancialProfile } from "@/lib/calculator";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { DollarSign, CreditCard, PiggyBank, Car, GraduationCap, Wallet, AlertCircle, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { FieldHint } from "@/components/common/FieldHint";

interface FinancialProfileFormProps {
  profile: FinancialProfile;
  onProfileChange: (profile: FinancialProfile) => void;
}

type DebtKey = "creditCard" | "carNote" | "studentLoan" | "personalLoan" | "collections";

const DEBT_CATEGORIES: { key: DebtKey; label: string; icon: typeof CreditCard }[] = [
  { key: "creditCard", label: "Credit Card", icon: CreditCard },
  { key: "carNote", label: "Car Note", icon: Car },
  { key: "studentLoan", label: "Student Loan", icon: GraduationCap },
  { key: "personalLoan", label: "Personal Loan", icon: Wallet },
  { key: "collections", label: "Collections", icon: AlertCircle },
];

export function FinancialProfileForm({ profile, onProfileChange }: FinancialProfileFormProps) {
  const [debts, setDebts] = useState<Record<DebtKey, { selected: boolean; amount: number }>>({
    creditCard: { selected: false, amount: 0 },
    carNote: { selected: false, amount: 0 },
    studentLoan: { selected: false, amount: 0 },
    personalLoan: { selected: false, amount: 0 },
    collections: { selected: false, amount: 0 },
  });

  const totalDebt = Object.values(debts).reduce(
    (sum, d) => sum + (d.selected ? d.amount || 0 : 0),
    0,
  );

  useEffect(() => {
    if (totalDebt !== profile.monthlyDebt) {
      onProfileChange({ ...profile, monthlyDebt: totalDebt });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalDebt]);

  const handleChange = (field: keyof FinancialProfile, value: number) => {
    onProfileChange({ ...profile, [field]: value });
  };

  const toggleDebt = (key: DebtKey) => {
    setDebts((prev) => ({ ...prev, [key]: { ...prev[key], selected: !prev[key].selected } }));
  };

  const updateAmount = (key: DebtKey, value: number) => {
    setDebts((prev) => ({ ...prev, [key]: { ...prev[key], amount: value } }));
  };

  return (
    <div className="space-y-6" data-tour="financials">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Yearly Income */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-accent" />
            Yearly Income
            <FieldHint label="yearly income">
              Your total pay before taxes. Lenders use this to figure out how much home you can
              comfortably afford.
            </FieldHint>
          </Label>
          <MoneyInput
            value={profile.yearlyIncome}
            onChange={(raw) => handleChange("yearlyIncome", Number(raw) || 0)}
            aria-label="Yearly income"
          />
        </div>

        {/* Savings */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <PiggyBank className="w-4 h-4 text-success" />
            Available Savings
            <FieldHint label="available savings">
              Cash you could put toward a down payment and closing costs. Retirement accounts don't
              need to be included.
            </FieldHint>
          </Label>
          <MoneyInput
            value={profile.savings}
            onChange={(raw) => handleChange("savings", Number(raw) || 0)}
            aria-label="Available savings"
            className="text-foreground font-semibold placeholder:text-muted-foreground/60"
            placeholder="0"
          />
        </div>
      </div>

      {/* Monthly Debt Breakdown */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-destructive" />
          Monthly Debt Payments
          <FieldHint label="monthly debt payments">
            What you already pay each month toward credit cards, car notes, student loans, and
            similar. This directly affects your debt-to-income (DTI) ratio.
          </FieldHint>
        </Label>
        <p className="text-xs text-muted-foreground">Select all that apply, then enter the monthly amount.</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {DEBT_CATEGORIES.map(({ key, label, icon: Icon }) => {
            const item = debts[key];
            return (
              <div key={key} className="space-y-2">
                <button
                  type="button"
                  onClick={() => toggleDebt(key)}
                  aria-pressed={item.selected}
                  aria-label={`Toggle ${label}`}
                  className={cn(
                    "w-full flex items-center gap-2 p-3 rounded-md border-2 transition-colors text-left",
                    item.selected
                      ? "border-accent bg-accent/5"
                      : "border-input hover:border-accent/50",
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium flex-1">{label}</span>
                  {item.selected && <Check className="w-4 h-4 text-accent" />}
                </button>
                {item.selected && (
                  <MoneyInput
                    value={item.amount || ""}
                    onChange={(raw) => updateAmount(key, Number(raw) || 0)}
                    className="h-9"
                    aria-label={`${label} monthly amount`}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between p-3 rounded-md bg-muted/50 border border-border">
          <span className="text-sm font-medium">Total Monthly Debt Payments</span>
          <span className="text-lg font-bold text-foreground">
            ${totalDebt.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Credit Score */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            Credit Score
            <FieldHint label="credit score">
              A rough estimate of your credit health. Higher scores usually unlock lower interest
              rates. Not sure? Check Credit Karma or your bank's free score.
            </FieldHint>
          </Label>
          <span className="text-2xl font-bold text-foreground">{profile.creditScore}</span>
        </div>
        <Slider
          value={[profile.creditScore]}
          onValueChange={(value) => handleChange("creditScore", value[0])}
          min={300}
          max={850}
          step={10}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Poor (300-579)</span>
          <span>Fair (580-669)</span>
          <span>Good (670-739)</span>
          <span>Excellent (740-850)</span>
        </div>
      </div>
    </div>
  );
}
