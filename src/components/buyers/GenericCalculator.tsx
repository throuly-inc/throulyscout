import { useState, useEffect, useLayoutEffect } from "react";
import { StateData, statesData } from "@/lib/states";
import {
  FinancialProfile,
  CREDIT_SCORE_RANGES,
  formatCurrency,
  LOAN_TYPES,
  LoanType,
  PROPERTY_TYPES,
  PropertyType,
} from "@/lib/calculator";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  CheckCircle,
  MapPin,
  DollarSign,
  CreditCard,
  PiggyBank,
  Home,
  ArrowRight,
  ArrowLeft,
  Building2,
  Zap,
  Briefcase,
  Star,
  HelpCircle,
  Building,
  Users,
  Edit2,
  Check,
  X,
  ChevronDown,
  Car,
  GraduationCap,
  Wallet,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FieldHint } from "@/components/common/FieldHint";
import { MoneyInput } from "@/components/ui/money-input";
import { FinancialHealthIntroModal } from "./FinancialHealthIntroModal";
import { StateCombobox } from "@/components/ui/state-combobox";

interface CalculatorInitialValues {
  selectedState?: StateData;
  homePrice?: number;
  hoaMonthly?: number;
  financialProfile?: FinancialProfile;
  loanTypeId?: string;
}

interface GenericCalculatorProps {
  onContinue: (
    state: StateData,
    homePrice: number,
    hoaMonthly: number,
    financialProfile: FinancialProfile,
    loanTypeId: string,
  ) => void;
  returnToReview?: number;
  initialValues?: CalculatorInitialValues;
  mode?: "full" | "location-only" | "post-location";
  onLocationContinue?: (state: StateData, yearlyIncome: number) => void;
}

type Step =
  | "location"
  | "property-type"
  | "buyer-profile"
  | "property-basic"
  | "income"
  | "savings"
  | "debt"
  | "rental-income"
  | "property-advanced";

type EditingSection = null | "location" | "property-type" | "home-price" | "income" | "savings" | "debt" | "loan-type";

const STEP_LABELS: Record<Step, string> = {
  location: "Location",
  "property-type": "Type",
  "buyer-profile": "Profile",
  "property-basic": "Property",
  income: "Income",
  savings: "Savings",
  debt: "Debt",
  "rental-income": "Rental",
  "property-advanced": "Details",
};

const PROPERTY_TYPE_ICONS: Record<PropertyType, React.ReactNode> = {
  "single-family": <Home className="w-6 h-6" />,
  "condo-coop": <Building className="w-6 h-6" />,
  "multi-family": <Users className="w-6 h-6" />,
};

export function GenericCalculator({
  onContinue,
  returnToReview,
  initialValues,
  mode = "full",
  onLocationContinue,
}: GenericCalculatorProps) {
  const getSteps = (propertyType: PropertyType): Step[] => {
    if (mode === "location-only") return ["location"];
    const base: Step[] =
      mode === "post-location"
        ? ["property-type", "buyer-profile", "property-basic", "income", "savings", "debt"]
        : ["location", "property-type", "buyer-profile", "property-basic", "income", "savings", "debt"];
    if (propertyType === "multi-family") {
      base.push("rental-income");
    }
    base.push("property-advanced");
    return base;
  };

  // Map a numeric credit score back to its range label for pre-filling the form
  const getCreditScoreLabel = (score: number): string => {
    const range = CREDIT_SCORE_RANGES.find((r) => score >= r.min && score <= r.max);
    return range?.label ?? "";
  };

  // True when this mount is re-entering an existing session to review/edit it
  // (e.g. "Update my financial info" from Financial Health, via `?edit=1`),
  // as opposed to a brand-new calculation. Safe to restore every field —
  // including the buyer-profile ones below — since nothing is actually new.
  const startAtReview = !!returnToReview && returnToReview > 0;

  const [currentStep, setCurrentStep] = useState<Step>(mode === "post-location" ? "property-type" : "location");

  // Jump to review step when returning from results
  useLayoutEffect(() => {
    if (returnToReview && returnToReview > 0) {
      const steps = getSteps(propertyType);
      setCurrentStep(steps[steps.length - 1]);
    }
  }, [returnToReview]);

  // Editing state
  const [editingSection, setEditingSection] = useState<EditingSection>(null);
  const [tempHomePrice, setTempHomePrice] = useState<string>("");
  const [tempHoaMonthly, setTempHoaMonthly] = useState<string>("0");
  const [tempYearlyIncome, setTempYearlyIncome] = useState<string>("");
  const [tempSavings, setTempSavings] = useState<string>("");
  const [tempMonthlyDebt, setTempMonthlyDebt] = useState<string>("0");
  const [tempState, setTempState] = useState<StateData | null>(null);
  const [tempLoanTypeId, setTempLoanTypeId] = useState<string>("conventional");
  const [tempPropertyType, setTempPropertyType] = useState<PropertyType>("single-family");
  const [homePriceTooltipOpen, setHomePriceTooltipOpen] = useState(false);

  // Location & Property — seeded from initialValues when restoring a session
  const [selectedState, setSelectedState] = useState<StateData | null>(initialValues?.selectedState ?? null);
  const [homePrice, setHomePrice] = useState<string>(
    initialValues?.homePrice ? initialValues.homePrice.toString() : "",
  );
  const [includeHOA, setIncludeHOA] = useState((initialValues?.hoaMonthly ?? 0) > 0);
  const [hoaMonthly, setHoaMonthly] = useState<string>(
    initialValues?.hoaMonthly ? initialValues.hoaMonthly.toString() : "0",
  );

  // Property Type
  const [propertyType, setPropertyType] = useState<PropertyType>(
    initialValues?.financialProfile?.propertyType ?? "single-family",
  );

  // Buyer Profile — "Tell us about yourself" fields must ALWAYS start empty
  // for every fresh calculation. Never restore from initialValues / prior
  // session / cache — EXCEPT when re-entering an existing session to review
  // it (startAtReview), where showing blank fields would silently wipe the
  // buyer's real values if they submit without revisiting this step.
  const [isFirstTimeBuyer, setIsFirstTimeBuyer] = useState<boolean | null>(
    startAtReview ? initialValues?.financialProfile?.isFirstTimeBuyer ?? null : null,
  );
  const [employmentType, setEmploymentType] = useState<"w2" | "self-employed" | "retired" | "other" | "">(
    startAtReview ? initialValues?.financialProfile?.employmentType ?? "" : "",
  );
  const [employmentSelectOpen, setEmploymentSelectOpen] = useState(false);
  const [loanTypeId, setLoanTypeId] = useState<string>(startAtReview ? initialValues?.loanTypeId ?? "" : "");
  const [creditScoreRange, setCreditScoreRange] = useState<string>(
    startAtReview && initialValues?.financialProfile?.creditScore
      ? getCreditScoreLabel(initialValues.financialProfile.creditScore)
      : "",
  );
  // Track whether the current loanTypeId is our auto-suggestion (FHA for first-time
  // buyers) that the user hasn't confirmed or changed. Used so switching the
  // first-time answer back to "No" only clears loan type when it was our suggestion.
  const [loanTypeAutoSuggested, setLoanTypeAutoSuggested] = useState<boolean>(false);


  // Financial Profile
  const [yearlyIncome, setYearlyIncome] = useState<string>(
    initialValues?.financialProfile?.yearlyIncome ? initialValues.financialProfile.yearlyIncome.toString() : "",
  );
  const [savings, setSavings] = useState<string>(
    initialValues?.financialProfile?.savings !== undefined ? initialValues.financialProfile.savings.toString() : "",
  );
  const [savingsContributionPct, setSavingsContributionPct] = useState<string>("100");
  const [monthlyDebt, setMonthlyDebt] = useState<string>(
    initialValues?.financialProfile?.monthlyDebt !== undefined
      ? initialValues.financialProfile.monthlyDebt.toString()
      : "0",
  );

  // Debt breakdown by category (amount-only; empty/zero counts as $0)
  type DebtKey = "creditCard" | "carNote" | "studentLoan" | "personalLoan" | "collections" | "other";
  const DEBT_CATEGORIES: { key: DebtKey; label: string; icon: typeof CreditCard }[] = [
    { key: "creditCard", label: "Credit Card", icon: CreditCard },
    { key: "carNote", label: "Car Note", icon: Car },
    { key: "studentLoan", label: "Student Loan", icon: GraduationCap },
    { key: "personalLoan", label: "Personal Loan", icon: Wallet },
    { key: "collections", label: "Collections", icon: AlertCircle },
    { key: "other", label: "Other", icon: HelpCircle },
  ];
  const [debtBreakdown, setDebtBreakdown] = useState<Record<DebtKey, string>>({
    creditCard: "",
    carNote: "",
    studentLoan: "",
    personalLoan: "",
    collections: "",
    other: "",
  });

  useEffect(() => {
    const total = Object.values(debtBreakdown).reduce((sum, amount) => sum + (Number(amount) || 0), 0);
    setMonthlyDebt(total.toString());
  }, [debtBreakdown]);

  // Rental Income (Multi-family only)
  const [expectedRentalIncome, setExpectedRentalIncome] = useState<string>(
    initialValues?.financialProfile?.expectedRentalIncome?.toString() ?? "0",
  );
  const [rentalIncomePercentage, setRentalIncomePercentage] = useState<number>(
    initialValues?.financialProfile?.rentalIncomePercentage ?? 75,
  );

  const STEPS = getSteps(propertyType);

  useEffect(() => {
    const scroll = () => {
      window.scrollTo(0, 0);
      document.scrollingElement?.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    scroll();
    const raf = requestAnimationFrame(scroll);
    const timeout = window.setTimeout(scroll, 100);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timeout);
    };
  }, [currentStep]);

  const handleStateChange = (stateName: string) => {
    const state = statesData.find((s) => s.name === stateName);
    if (state) {
      setSelectedState(state);
      setHomePrice(state.medianHomePrice.toString());
    }
  };

  const handleEditStart = (section: EditingSection) => {
    setEditingSection(section);
    // Re-sync temporary values
    setTempHomePrice(homePrice);
    setTempHoaMonthly(hoaMonthly);
    setTempYearlyIncome(yearlyIncome);
    setTempSavings(savings);
    setTempMonthlyDebt(monthlyDebt);
    setTempState(selectedState);
    setTempLoanTypeId(loanTypeId);
    setTempPropertyType(propertyType);
  };

  const handleSaveEdit = (section: EditingSection) => {
    switch (section) {
      case "location":
        if (tempState) setSelectedState(tempState);
        break;
      case "property-type":
        setPropertyType(tempPropertyType);
        break;
      case "home-price":
        setHomePrice(tempHomePrice);
        setHoaMonthly(tempHoaMonthly);
        break;
      case "income":
        setYearlyIncome(tempYearlyIncome);
        break;
      case "savings":
        setSavings(tempSavings);
        break;
      case "debt":
        setMonthlyDebt(tempMonthlyDebt);
        break;
      case "loan-type":
        setLoanTypeId(tempLoanTypeId);
        break;
    }
    setEditingSection(null);
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
  };

  const handleNext = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  };

  const handleSubmit = () => {
    if (!selectedState) return;

    const selectedCreditRange = CREDIT_SCORE_RANGES.find((r) => r.label === creditScoreRange);
    const creditScore = selectedCreditRange ? Math.floor((selectedCreditRange.min + selectedCreditRange.max) / 2) : 700;

    const profile: FinancialProfile = {
      yearlyIncome: Number(yearlyIncome) || 100000,
      monthlyDebt: Number(monthlyDebt) || 0,
      savings: Math.round(
        (Number(savings) || 50000) * (Math.min(Math.max(Number(savingsContributionPct) || 100, 0), 100) / 100),
      ),
      creditScore,
      employmentType: employmentType || "w2",
      isFirstTimeBuyer: isFirstTimeBuyer ?? true,
      propertyType,
      expectedRentalIncome: propertyType === "multi-family" ? Number(expectedRentalIncome) || 0 : 0,
      rentalIncomePercentage: propertyType === "multi-family" ? rentalIncomePercentage : 75,
      totalSavings: Number(savings) || 50000,
      savingsContributionPct: Math.min(Math.max(Number(savingsContributionPct) || 100, 0), 100),
    };

    onContinue(
      selectedState,
      Number(homePrice) || selectedState.medianHomePrice,
      includeHOA ? Number(hoaMonthly) || 0 : 0,
      profile,
      loanTypeId,
    );
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case "location":
        if (mode === "location-only") return !!selectedState && Number(yearlyIncome) > 0;
        return !!selectedState;
      case "property-type":
        return !!propertyType;
      case "buyer-profile":
        return isFirstTimeBuyer !== null && !!employmentType && !!creditScoreRange && !!loanTypeId;

      case "property-basic":
        return Number(homePrice) > 0;
      case "income":
        return Number(yearlyIncome) > 0;
      case "savings":
        return Number(savings) >= 0;
      case "debt":
        return true;
      case "rental-income":
        return true;
      case "property-advanced":
        return true;
      default:
        return false;
    }
  };

  const stepIndex = STEPS.indexOf(currentStep);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const selectedLoanType = LOAN_TYPES.find((lt) => lt.id === loanTypeId);

  const renderStep = () => {
    switch (currentStep) {
      case "location":
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-accent" />
              </div>
              <h2 className="font-serif text-2xl text-foreground mb-2">Where are you looking to buy?</h2>
              <p className="text-muted-foreground">
                We'll calculate state-specific taxes, insurance, and closing costs
              </p>
            </div>

            <div data-tour="state">
              <Label className="text-base font-bold mb-3 block flex items-center gap-2">
                Select State
                <FieldHint label="state">
                  Property taxes, insurance rates, and typical mortgage rates vary a lot by state,
                  so your results here reflect real local numbers.
                </FieldHint>
              </Label>
              <StateCombobox
                value={selectedState?.name}
                onChange={handleStateChange}
                className="h-14 text-base"
              />
            </div>

            <div data-tour="income">
              <Label htmlFor="yearly-income" className="text-base font-bold mb-3 block flex items-center gap-2">
                What is your yearly income?
                <FieldHint label="yearly income">
                  Your total pay before taxes (salary, hourly, or self-employment). Lenders use
                  this to size how much monthly payment you can comfortably handle.
                </FieldHint>
              </Label>
              <MoneyInput
                id="yearly-income"
                value={yearlyIncome}
                onChange={setYearlyIncome}
                className="h-14 text-base"
                aria-label="Yearly income"
              />
            </div>

            {selectedState && (
              <Card className="p-5 bg-accent/5 border-accent/20">
                <h3 className="font-medium text-foreground mb-3">{selectedState.name} Market Snapshot</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Median Home Price</p>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(selectedState.medianHomePrice)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Rate Range (30yr)</p>
                    <p className="text-lg font-bold text-foreground">
                      {(selectedState.avgMortgageRate - 0.375).toFixed(2)}% –{" "}
                      {(selectedState.avgMortgageRate + 0.375).toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Property Tax</p>
                    <p className="text-lg font-bold text-foreground">{selectedState.avgPropertyTax}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Closing Costs</p>
                    <p className="text-lg font-bold text-foreground">~{selectedState.avgClosingCost}%</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        );

      case "property-type":
        return (
          <TooltipProvider>
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
                <h2 className="font-serif text-2xl text-foreground mb-2">What type of property are you buying?</h2>
                <p className="text-muted-foreground">
                  Different property types have different costs and financing options
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {PROPERTY_TYPES.map((pt) => (
                  <Tooltip key={pt.id}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => setPropertyType(pt.id)}
                        className={cn(
                          "p-4 rounded-lg border-2 text-left transition-all flex items-center gap-4",
                          propertyType === pt.id
                            ? "border-accent bg-accent/10"
                            : "border-border hover:border-muted-foreground",
                        )}
                      >
                        <div
                          className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                            propertyType === pt.id ? "bg-accent/20 text-accent" : "bg-secondary text-muted-foreground",
                          )}
                        >
                          {PROPERTY_TYPE_ICONS[pt.id]}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{pt.name}</p>
                            <HelpCircle className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {pt.id === "single-family" && "Standalone house with private yard"}
                            {pt.id === "condo-coop" && "Apartment you own, with shared amenities"}
                            {pt.id === "multi-family" && "Rent out units to help pay your mortgage"}
                          </p>
                        </div>
                        {pt.id === "multi-family" && (
                          <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                            Rental Income
                          </Badge>
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center" className="max-w-xs p-4">
                      <p className="text-sm">{pt.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>

              {propertyType === "multi-family" && (
                <Card className="p-4 bg-success/5 border-success/20">
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-success mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground text-sm">Rental Income Advantage</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Lenders can count 75% of expected rental income toward your qualifying income, allowing you to
                        afford a more expensive property.
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {propertyType === "condo-coop" && (
                <Card className="p-4 bg-accent/5 border-accent/20">
                  <div className="flex items-start gap-3">
                    <Building className="w-5 h-5 text-accent mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground text-sm">HOA Fees Apply</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Condos typically have monthly HOA fees that cover shared amenities, maintenance, and building
                        insurance.
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </TooltipProvider>
        );

      case "buyer-profile":
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-serif text-2xl text-foreground mb-2">Tell us about yourself</h2>
              <p className="text-muted-foreground">This helps determine which loan programs you may qualify for</p>
            </div>

            <div>
              <Label className="text-base font-bold mb-3 block">Are you a first-time homebuyer?</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsFirstTimeBuyer(true);
                    // Only auto-suggest FHA if the user hasn't picked a loan type yet.
                    // Never overwrite an explicit choice.
                    if (!loanTypeId) {
                      setLoanTypeId("fha");
                      setLoanTypeAutoSuggested(true);
                    }
                  }}
                  className={cn(
                    "p-4 rounded-lg border-2 text-left transition-all",
                    isFirstTimeBuyer === true
                      ? "border-accent bg-accent/10"
                      : "border-border hover:border-muted-foreground",
                  )}
                >
                  <Star className="w-5 h-5 text-accent mb-2" />
                  <p className="font-medium">Yes, first time</p>
                  <p className="text-xs text-muted-foreground">
                    Counts if you haven't owned a home in the last 3 years — may qualify for special programs
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsFirstTimeBuyer(false);
                    // Only clear the loan type if it's still our untouched FHA suggestion.
                    if (loanTypeAutoSuggested && loanTypeId === "fha") {
                      setLoanTypeId("");
                      setLoanTypeAutoSuggested(false);
                    }
                  }}
                  className={cn(
                    "p-4 rounded-lg border-2 text-left transition-all",
                    isFirstTimeBuyer === false
                      ? "border-accent bg-accent/10"
                      : "border-border hover:border-muted-foreground",
                  )}
                >
                  <Home className="w-5 h-5 text-muted-foreground mb-2" />
                  <p className="font-medium">No, I've owned recently</p>
                  <p className="text-xs text-muted-foreground">
                    Owned a home in the last 3 years — standard programs available
                  </p>
                </button>

              </div>
            </div>

            <div>
              <Label className="text-base font-bold mb-3 block">Employment Type</Label>
              <div>
                <button
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={employmentSelectOpen}
                  onClick={() => setEmploymentSelectOpen((open) => !open)}
                  className="flex h-14 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-left text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <span>
                    {employmentType === "w2"
                      ? "W-2 Employee"
                      : employmentType === "self-employed"
                        ? "Self-Employed"
                        : employmentType === "retired"
                          ? "Retired"
                          : employmentType === "other"
                            ? "Other"
                            : "How are you employed?"}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </button>
                {employmentSelectOpen && (
                  <div role="listbox" className="mt-2 rounded-md border bg-card p-1 shadow-md">
                    {[
                      { value: "w2", label: "W-2 Employee" },
                      { value: "self-employed", label: "Self-Employed" },
                      { value: "retired", label: "Retired" },
                      { value: "other", label: "Other" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={employmentType === option.value}
                        onClick={() => {
                          setEmploymentType(option.value as typeof employmentType);
                          setEmploymentSelectOpen(false);
                        }}
                        className={cn(
                          "flex h-8 w-full items-center gap-2 rounded-sm px-2 text-left text-sm",
                          employmentType === option.value && "bg-accent text-accent-foreground",
                        )}
                      >
                        <span className="flex h-4 w-4 items-center justify-center">
                          {employmentType === option.value && <Check className="h-4 w-4" />}
                        </span>
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {employmentType === "self-employed" && (
                <p className="text-xs text-muted-foreground mt-2">
                  Self-employed buyers typically need 2 years of tax returns for verification
                </p>
              )}
            </div>

            <div>
              <Label className="text-base font-bold mb-3 block">Credit Score Range</Label>
              <Select value={creditScoreRange} onValueChange={setCreditScoreRange}>
                <SelectTrigger className="h-14 text-base">
                  <SelectValue placeholder="Select your credit score range..." />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  {CREDIT_SCORE_RANGES.map((range) => (
                    <SelectItem key={range.label} value={range.label}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-base font-bold mb-3 block">Preferred Loan Type</Label>
              <Select
                value={loanTypeId}
                onValueChange={(v) => {
                  setLoanTypeId(v);
                  // Any manual selection means the user has confirmed a choice.
                  setLoanTypeAutoSuggested(false);
                }}
              >
                <SelectTrigger className="h-14 text-base">
                  <SelectValue placeholder="Select loan type..." />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  {LOAN_TYPES.map((lt) => (
                    <SelectItem key={lt.id} value={lt.id}>
                      <div className="flex items-center gap-2">
                        <span>{lt.name}</span>
                        <span className="text-xs text-muted-foreground">
                          (min {lt.minDownPayment}% down, {lt.minCreditScore}+ credit)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {loanTypeAutoSuggested && loanTypeId === "fha" && (
                <p className="text-xs text-muted-foreground mt-2">
                  We suggested FHA because it's a popular option for first-time buyers — you can change this.
                </p>
              )}
            </div>

          </div>
        );


      case "property-basic":
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Home className="w-8 h-8 text-accent" />
              </div>
              <h2 className="font-serif text-2xl text-foreground mb-2">What's your target home price?</h2>
              <p className="text-muted-foreground">We'll show you estimated monthly payments and costs</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Label className="text-base font-bold">Target Home Price Based on Income</Label>
                <TooltipProvider>
                  <Tooltip open={homePriceTooltipOpen} onOpenChange={setHomePriceTooltipOpen}>
                    <TooltipTrigger asChild>
                      <HelpCircle
                        className="w-4 h-4 text-muted-foreground cursor-help"
                        onClick={() => setHomePriceTooltipOpen((o) => !o)}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Market average price based on {selectedState.name} —{" "}
                        {formatCurrency(selectedState.medianHomePrice)}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <MoneyInput
                value={homePrice}
                onChange={setHomePrice}
                className="h-14 text-lg"
                aria-label="Home price"
              />
            </div>

            <div className="p-4 bg-secondary/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-accent" />
                  <div>
                    <Label className="text-base font-bold">Include HOA Fees?</Label>
                    <p className="text-sm text-muted-foreground">For condos, townhomes, or HOA communities</p>
                  </div>
                </div>
                <Switch checked={includeHOA} onCheckedChange={setIncludeHOA} />
              </div>

              {includeHOA && (
                <div className="mt-4 pt-4 border-t border-border">
                  <MoneyInput
                    value={hoaMonthly}
                    onChange={setHoaMonthly}
                    suffix="/month"
                    aria-label="Monthly HOA fees"
                  />
                </div>
              )}
            </div>

            {selectedLoanType && (
              <Card className="p-4 bg-accent/5 border-accent/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="font-medium text-sm">{selectedLoanType.name} Selected</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Min down payment: {selectedLoanType.minDownPayment}% • Min credit: {selectedLoanType.minCreditScore}+
                  • Max Debt-to-Income: {selectedLoanType.maxDTI}%
                </p>
              </Card>
            )}
          </div>
        );

      case "income":
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-success" />
              </div>
              <h2 className="font-serif text-2xl text-foreground mb-2">What's your annual household income?</h2>
              <p className="text-muted-foreground">Include income from all sources before taxes</p>
            </div>

            <div>
              <Label className="text-base font-bold mb-3 block">Yearly Household Income (Pre-Tax)</Label>
              <MoneyInput
                value={yearlyIncome}
                onChange={setYearlyIncome}
                className="h-14 text-lg"
                aria-label="Yearly household income"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Include salary, bonuses, commissions, self-employment, tips, overtime
              </p>
            </div>

            {Number(yearlyIncome) > 0 && (
              <>
                <Card className="p-4 bg-secondary/50">
                  <p className="text-sm text-muted-foreground">Monthly gross income</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(Number(yearlyIncome) / 12)}</p>
                </Card>

                {(() => {
                  const gross = Number(yearlyIncome);
                  const monthlyGross = gross / 12;

                  // 2025 Federal tax brackets (single filer simplified)
                  let federalTax = 0;
                  const brackets = [
                    { limit: 11925, rate: 0.1 },
                    { limit: 48475, rate: 0.12 },
                    { limit: 103350, rate: 0.22 },
                    { limit: 197300, rate: 0.24 },
                  ];
                  let remaining = gross;
                  let prev = 0;
                  for (const b of brackets) {
                    if (remaining <= 0) break;
                    const taxable = Math.min(remaining, b.limit - prev);
                    federalTax += taxable * b.rate;
                    remaining -= taxable;
                    prev = b.limit;
                  }
                  if (remaining > 0) federalTax += remaining * 0.32;

                  // State tax rates
                  const STATE_TAX_RATES: Record<string, number> = {
                    CA: 0.06,
                    NY: 0.055,
                    TX: 0,
                    FL: 0,
                    AZ: 0.028,
                    IL: 0.0495,
                    GA: 0.048,
                    NC: 0.045,
                    OH: 0.035,
                    PA: 0.0307,
                    MI: 0.0425,
                    NJ: 0.05,
                    MA: 0.05,
                    CO: 0.044,
                    VA: 0.045,
                    WA: 0,
                    TN: 0,
                    NV: 0,
                    AK: 0,
                    WY: 0,
                    SD: 0,
                    NH: 0,
                    OR: 0.07,
                    HI: 0.065,
                  };
                  const stateAbbr = selectedState?.abbreviation || "";
                  const stateRate = STATE_TAX_RATES[stateAbbr] ?? 0.04;
                  const stateTax = gross * stateRate;
                  const stateName = selectedState?.name || "State";

                  // FICA: 7.65% (SS 6.2% capped at $168,600 + Medicare 1.45%)
                  const ssCap = 168600;
                  const fica = Math.min(gross, ssCap) * 0.062 + gross * 0.0145;

                  const totalTax = federalTax + stateTax + fica;
                  const monthlyTakeHome = (gross - totalTax) / 12;

                  return (
                    <Card className="p-4 bg-secondary/50 space-y-3">
                      <p className="text-sm font-medium text-foreground">Estimated Monthly Take-Home</p>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Federal tax</span>
                          <span className="text-destructive">-{formatCurrency(federalTax / 12)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>
                            State tax ({stateName}){stateRate === 0 ? " — no income tax" : ""}
                          </span>
                          <span className="text-destructive">-{formatCurrency(stateTax / 12)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>FICA (Social Security + Medicare)</span>
                          <span className="text-destructive">-{formatCurrency(fica / 12)}</span>
                        </div>
                        <div className="border-t border-border pt-2 mt-2 flex justify-between items-baseline">
                          <span className="text-2xl font-bold text-foreground">Monthly take-home</span>
                          <span className="text-2xl font-bold text-foreground">{formatCurrency(monthlyTakeHome)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Lenders use your pre-tax income ({formatCurrency(monthlyGross)}/mo) for qualification. Your
                        take-home helps you understand your real budget after the mortgage payment.
                      </p>
                    </Card>
                  );
                })()}
              </>
            )}
          </div>
        );

      case "savings":
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <PiggyBank className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-serif text-2xl text-foreground mb-2">
                How much do you have available for this purchase?
              </h2>
              <p className="text-muted-foreground">This covers your down payment and closing costs</p>
            </div>

            <div>
              <Label className="text-base font-bold mb-3 block">Total Available Savings</Label>
              <MoneyInput
                value={savings}
                onChange={setSavings}
                className="h-14 text-lg"
                aria-label="Total available savings"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Include savings, checking, retirement (401k/IRA), gifts, proceeds from home sale
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-bold">
                  What % of your savings are you contributing to this purchase?
                </Label>
                <span className="text-base font-semibold text-foreground">{savingsContributionPct}%</span>
              </div>
              <Slider
                min={0}
                max={100}
                step={1}
                value={[Number(savingsContributionPct)]}
                onValueChange={([val]) => setSavingsContributionPct(val.toString())}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0%</span>
                <span>100%</span>
              </div>
              {Number(savings) > 0 && (
                <p className="text-sm text-muted-foreground mt-3">
                  Contributing {savingsContributionPct}% ={" "}
                  <span className="font-medium text-foreground">
                    {formatCurrency(Math.round((Number(savings) || 0) * (Number(savingsContributionPct) / 100)))}
                  </span>{" "}
                  applied toward your purchase
                </p>
              )}
            </div>
          </div>
        );

      case "debt":
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="font-serif text-2xl text-foreground mb-2">What are your current monthly debt payments?</h2>
              <p className="text-muted-foreground">This affects your debt-to-income ratio</p>
              <p className="text-sm text-muted-foreground mt-1">
                Enter the minimum monthly payment for each — not the total balance owed.
              </p>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-2">
                {DEBT_CATEGORIES.map(({ key, label, icon: Icon }) => {
                  const amount = debtBreakdown[key];
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-muted/60 text-muted-foreground flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-base font-medium flex-1">{label}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm text-muted-foreground">$</span>
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={amount && Number(amount) ? Number(amount).toLocaleString("en-US") : amount}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^0-9.]/g, "");
                            const parts = raw.split(".");
                            const sanitized = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : raw;
                            setDebtBreakdown((prev) => ({ ...prev, [key]: sanitized }));
                          }}
                          className="h-9 w-28 border-0 border-b-2 border-input bg-transparent rounded-none text-right px-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-accent"
                          aria-label={`${label} monthly payment`}
                        />
                        <span className="text-xs text-muted-foreground">/mo</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-secondary">
                <span className="text-base font-bold">Total Monthly Debt Payments</span>
                <span className="text-xl font-bold text-foreground">
                  ${Number(monthlyDebt).toLocaleString("en-US")}
                </span>
              </div>

              <p className="text-sm text-muted-foreground">
                This total is used for your debt-to-income ratio. Leave categories at $0 if they don't apply.
              </p>
            </div>

            <Card className="p-4 bg-muted/30 border-0">
              <p className="text-sm font-medium text-foreground mb-2">Don't include:</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Current rent or mortgage (you're buying a new home)</li>
                <li>Utilities, groceries, subscriptions</li>
                <li>Insurance premiums</li>
              </ul>
            </Card>
          </div>
        );

      case "rental-income":
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-success" />
              </div>
              <h2 className="font-serif text-2xl text-foreground mb-2">Expected Rental Income</h2>
              <p className="text-muted-foreground">Tell us about the rental income from your multi-family property</p>
            </div>

            <div>
              <Label className="text-base font-bold mb-3 block">Total Expected Monthly Rent</Label>
              <MoneyInput
                value={expectedRentalIncome}
                onChange={setExpectedRentalIncome}
                suffix="/month"
                className="h-14 text-lg"
                aria-label="Expected monthly rent"
              />
              <p className="text-sm text-muted-foreground mt-2">Combined rent from all units you plan to rent out</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-bold">Qualifying Percentage</Label>
                <Badge variant="outline" className="text-sm">
                  {rentalIncomePercentage}%
                </Badge>
              </div>
              <Slider
                value={[rentalIncomePercentage]}
                onValueChange={([value]) => setRentalIncomePercentage(value)}
                min={50}
                max={85}
                step={5}
                className="mb-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Conservative (50%)</span>
                <span>Standard (75%)</span>
                <span>Aggressive (85%)</span>
              </div>
            </div>

            <Card className="p-4 bg-success/5 border-success/20">
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-success mt-0.5" />
                <div>
                  <p className="font-medium text-foreground text-sm">Qualifying Income Offset</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Lenders count <span className="font-bold text-success">{rentalIncomePercentage}%</span> of your
                    rental income, adding{" "}
                    <span className="font-bold text-success">
                      {formatCurrency(Number(expectedRentalIncome) * (rentalIncomePercentage / 100))}/mo
                    </span>{" "}
                    to your qualifying income.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-secondary/50 border-dashed">
              <p className="text-sm font-medium text-foreground mb-2">How it works:</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Lenders use 75% as the standard qualifying rate</li>
                <li>The 25% discount accounts for vacancy and maintenance</li>
                <li>You'll need rental history or an appraisal to verify income</li>
              </ul>
            </Card>
          </div>
        );

      case "property-advanced":
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Home className="w-8 h-8 text-accent" />
              </div>
              <h2 className="font-serif text-2xl text-foreground mb-2">Review Your Details</h2>
              <p className="text-muted-foreground">Confirm everything looks correct before we calculate</p>
            </div>

            <Card className="p-4 bg-secondary/50">
              <div className="space-y-3 text-sm">
                {/* Location */}
                {editingSection === "location" ? (
                  <div className="space-y-3 pb-3 border-b border-border">
                    <StateCombobox
                      value={tempState?.name || ""}
                      onChange={(stateName) => {
                        const state = statesData.find((s) => s.name === stateName);
                        if (state) setTempState(state);
                      }}
                      placeholder="Select state..."
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveEdit("location")} className="flex-1 gap-2">
                        <Check className="w-4 h-4" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit} className="flex-1 gap-2">
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-muted-foreground">Location</span>
                      <p className="font-medium">{selectedState?.name}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleEditStart("location")}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* Property Type */}
                {editingSection === "property-type" ? (
                  <div className="space-y-3 pb-3 border-t border-b border-border pt-3">
                    <Select
                      value={tempPropertyType}
                      onValueChange={(value) => setTempPropertyType(value as PropertyType)}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {PROPERTY_TYPES.map((pt) => (
                          <SelectItem key={pt.id} value={pt.id}>
                            {pt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveEdit("property-type")} className="flex-1 gap-2">
                        <Check className="w-4 h-4" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit} className="flex-1 gap-2">
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-muted-foreground">Property Type</span>
                      <p className="font-medium">{PROPERTY_TYPES.find((pt) => pt.id === propertyType)?.name}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleEditStart("property-type")}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* Home Price */}
                {editingSection === "home-price" ? (
                  <div className="space-y-3 pb-3 border-t border-b border-border pt-3">
                    <div>
                      <Label className="text-xs font-medium mb-1 block">Target Home Price Based on Income</Label>
                      <MoneyInput
                        value={tempHomePrice}
                        onChange={setTempHomePrice}
                        className="h-10"
                        aria-label="Target home price"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveEdit("home-price")} className="flex-1 gap-2">
                        <Check className="w-4 h-4" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit} className="flex-1 gap-2">
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-muted-foreground">Home Price</span>
                      <p className="font-medium">{formatCurrency(Number(homePrice))}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleEditStart("home-price")}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* Loan Type */}
                {editingSection === "loan-type" ? (
                  <div className="space-y-3 pb-3 border-t border-b border-border pt-3">
                    <Select value={tempLoanTypeId} onValueChange={setTempLoanTypeId}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select loan type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {LOAN_TYPES.map((lt) => (
                          <SelectItem key={lt.id} value={lt.id}>
                            {lt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveEdit("loan-type")} className="flex-1 gap-2">
                        <Check className="w-4 h-4" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit} className="flex-1 gap-2">
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-muted-foreground">Loan Type</span>
                      <p className="font-medium">{selectedLoanType?.name}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleEditStart("loan-type")}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* Annual Income */}
                {editingSection === "income" ? (
                  <div className="space-y-3 pb-3 border-t border-b border-border pt-3">
                    <div>
                      <Label className="text-xs font-medium mb-1 block">Yearly Household Income (Pre-Tax)</Label>
                      <MoneyInput
                        value={tempYearlyIncome}
                        onChange={setTempYearlyIncome}
                        className="h-10"
                        aria-label="Yearly household income"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveEdit("income")} className="flex-1 gap-2">
                        <Check className="w-4 h-4" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit} className="flex-1 gap-2">
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-muted-foreground">Annual Income</span>
                      <p className="font-medium">{formatCurrency(Number(yearlyIncome))}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleEditStart("income")}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* Available Savings */}
                {editingSection === "savings" ? (
                  <div className="space-y-3 pb-3 border-t border-b border-border pt-3">
                    <div>
                      <Label className="text-xs font-medium mb-1 block">Available Funds</Label>
                      <MoneyInput
                        value={tempSavings}
                        onChange={setTempSavings}
                        className="h-10"
                        aria-label="Available funds"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveEdit("savings")} className="flex-1 gap-2">
                        <Check className="w-4 h-4" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit} className="flex-1 gap-2">
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-muted-foreground">Available Savings</span>
                      <p className="font-medium">{formatCurrency(Number(savings))}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleEditStart("savings")}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* Monthly Debt */}
                {editingSection === "debt" ? (
                  <div className="space-y-3 pb-3 border-t border-b border-border pt-3">
                    <div>
                      <Label className="text-xs font-medium mb-1 block">Total Monthly Debt Payments</Label>
                      <MoneyInput
                        value={tempMonthlyDebt}
                        onChange={setTempMonthlyDebt}
                        suffix="/month"
                        className="h-10"
                        aria-label="Total monthly debt payments"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveEdit("debt")} className="flex-1 gap-2">
                        <Check className="w-4 h-4" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit} className="flex-1 gap-2">
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-muted-foreground">Monthly Debt</span>
                      <p className="font-medium">{formatCurrency(Number(monthlyDebt))}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleEditStart("debt")}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {propertyType === "multi-family" && Number(expectedRentalIncome) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expected Rental Income</span>
                    <span className="font-medium text-success">
                      +{formatCurrency(Number(expectedRentalIncome) * (rentalIncomePercentage / 100))}/mo (
                      {rentalIncomePercentage}%)
                    </span>
                  </div>
                )}
                {includeHOA && Number(hoaMonthly) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">HOA</span>
                    <span className="font-medium">{formatCurrency(Number(hoaMonthly))}/mo</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const isLastStep = currentStep === STEPS[STEPS.length - 1];

  return (
    <div className="max-w-2xl mx-auto">
      <FinancialHealthIntroModal trigger={currentStep === "buyer-profile"} />
      {/* Badge */}
      <div className="flex justify-center mb-6">
        <Badge className="bg-success/20 text-success border-success/30 px-4 py-1.5 text-sm">
          <CheckCircle className="w-4 h-4 mr-2" />
          FREE - No Account Required
        </Badge>
      </div>

      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-3">Home Affordability Calculator</h1>
        <p className="text-muted-foreground">Get personalized qualification analysis with your financial details</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {STEPS.map((step, index) => (
            <button
              key={step}
              onClick={() => {
                if (index <= stepIndex) {
                  setCurrentStep(step);
                }
              }}
              className={cn(
                "text-xs font-medium transition-colors",
                index <= stepIndex ? "text-accent cursor-pointer" : "text-muted-foreground cursor-default",
              )}
            >
              {STEP_LABELS[step]}
            </button>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Form Card */}
      <Card className="p-6 md:p-8">
        {renderStep()}

        {(["property-type", "buyer-profile", "property-basic", "income", "savings", "debt"] as Step[]).includes(
          currentStep,
        ) && (
          <div
            role="note"
            className="mt-6 flex items-start gap-2 rounded-md bg-muted/50 border border-border/60 px-3 py-2 text-xs text-muted-foreground"
          >
            <HelpCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="leading-snug break-words">
              To ensure the best results, make sure you confirm your information. For example, for your credit score,
              check Credit Karma or a similar credit score checker rather than guessing.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex flex-col gap-3 mt-8 sm:flex-row">
          {stepIndex > 0 && (
            <Button variant="outline" size="lg" onClick={handleBack} className="w-full sm:flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}

          <Button
            data-tour="continue"
            variant="accent"
            size="lg"
            onClick={() => {
              if (mode === "location-only") {
                if (selectedState && Number(yearlyIncome) > 0 && onLocationContinue) {
                  onLocationContinue(selectedState, Number(yearlyIncome));
                }
                return;
              }
              isLastStep ? handleSubmit() : handleNext();
            }}
            disabled={!canProceed()}
            className={cn("w-full whitespace-normal text-center leading-snug sm:flex-1", stepIndex === 0 && "w-full")}
          >
            {mode === "location-only" ? "See My Affordability" : isLastStep ? "Your Homebuying Estimate" : "Continue"}
            {!(mode === "location-only" || isLastStep) && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </Card>
    </div>
  );
}
