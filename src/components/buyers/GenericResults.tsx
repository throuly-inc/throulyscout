import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { StateData, statesData } from "@/lib/states";
import {
  calculateMortgage,
  formatCurrency,
  formatPercent,
  DOWN_PAYMENT_OPTIONS,
  FinancialProfile,
  getQualificationStatus,
  LOAN_TYPES,
  CREDIT_SCORE_RANGES,
  calculateRentalIncomeOffset,
  getDTIColor,
  getRateConfidenceBand,
  getStateInsuranceRate,
} from "@/lib/calculator";
import { InvestorAnalysis } from "./InvestorAnalysis";
import { SmartInsights } from "./SmartInsights";
import { QualifyingPrograms } from "./QualifyingPrograms";
import { useIsMobile } from "@/hooks/use-mobile";
import { Reveal } from "./Reveal";
import { ResultsDisclaimer } from "@/components/common/ResultsDisclaimer";
import {
  DarkResultPanel,
  DarkEyebrow,
  DarkStatTile,
  DarkInsetCard,
} from "@/components/results/DarkResultPanels";
import { SegmentedCardSelector } from "@/components/common/SegmentedCardSelector";


import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  DollarSign,
  Home,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ArrowRight,
  Save,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  Info,
  HelpCircle,
  Users,
  Target,
  UserCheck,
  Landmark,
  Loader2,
  Building2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  RefreshCw,
  SlidersHorizontal,
  Lightbulb,
  Activity,
  MapPin,
  Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";

interface GenericResultsProps {
  state: StateData;
  homePrice: number;
  hoaMonthly: number;
  financialProfile: FinancialProfile;
  loanTypeId: string;
  onBack: () => void;
  onSave: () => void;
  /** If provided, save actions update this saved_scenarios row instead of inserting a new one. */
  editingScenarioId?: string | null;
  /** Optional pre-existing name to keep when updating in place. */
  editingScenarioName?: string | null;
}

function generatePriceOptions(basePrice: number, maxAffordable: number, comfortablePrice: number): number[] {
  const step = 50000;
  const prices = [
    // Anchor at least one or two options near the comfortable (standard-DTI)
    // price so the grid isn't only "Not Recommended"/"Not Qualified" options
    // when the user's chosen/max price is already at the edge of affordability.
    comfortablePrice > 0 ? comfortablePrice - step : 0,
    comfortablePrice > 0 ? comfortablePrice : 0,
    maxAffordable - step,
    maxAffordable,
    basePrice - step,
    basePrice,
    basePrice + step,
  ].filter((p, index, arr) => p > 0 && arr.indexOf(p) === index);

  return prices.sort((a, b) => a - b).slice(0, 6);
}

function getDTITargetLabel(loanType: {
  id: string;
  maxFrontEndDTI: number;
  maxDTI: number;
  expandedFrontEndDTI: number;
  expandedBackEndDTI: number;
}): { frontLabel: string; backLabel: string } {
  if (loanType.id === "fha") {
    return {
      frontLabel: `Target: ≤ ${loanType.maxFrontEndDTI}% (up to ${loanType.expandedFrontEndDTI}% with compensating factors)`,
      backLabel: `Max: ${loanType.maxDTI}% (up to ${loanType.expandedBackEndDTI}% with compensating factors)`,
    };
  }
  if (loanType.id === "conventional") {
    return {
      frontLabel: `Target: ≤ ${loanType.maxFrontEndDTI}% (up to ${loanType.expandedFrontEndDTI}% with strong credit)`,
      backLabel: `Max: ${loanType.maxDTI}% (up to ${loanType.expandedBackEndDTI}% with strong credit)`,
    };
  }
  return {
    frontLabel: `Target: ≤ ${loanType.maxFrontEndDTI}%`,
    backLabel: `Max: ${loanType.maxDTI}%`,
  };
}

/**
 * Reverse-calculate max home price from a target monthly payment
 * Uses binary search to find the price that produces the target payment
 */
function reverseCalcPriceFromPayment(
  targetMonthly: number,
  stateData: StateData,
  downPaymentPercent: number,
  hoaMonthly: number,
  loanTypeId: string,
  rateOverride?: number,
  creditScore?: number,
): number {
  const loanType = LOAN_TYPES.find((lt) => lt.id === loanTypeId) || LOAN_TYPES[0];
  const loanTermYears = 30;
  let low = 20000;
  let high = 5000000;

  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    const payment = calcMonthlyForPrice(
      mid,
      stateData,
      downPaymentPercent,
      hoaMonthly,
      loanTermYears,
      loanType,
      rateOverride,
      creditScore,
    );
    if (payment <= targetMonthly) {
      low = mid;
    } else {
      high = mid;
    }
    if (high - low < 500) break;
  }
  return Math.round(low);
}

function calcMonthlyForPrice(
  homePrice: number,
  stateData: StateData,
  downPaymentPercent: number,
  hoaMonthly: number,
  loanTermYears: number,
  loanType: any,
  rateOverride?: number,
  creditScore?: number,
): number {
  const downPaymentAmount = homePrice * (downPaymentPercent / 100);
  const baseLoanAmount = homePrice - downPaymentAmount;
  const upfrontMIP = loanType.id === "fha" ? baseLoanAmount * 0.0175 : 0;
  const loanAmount = baseLoanAmount + upfrontMIP;
  const rateRange = getRateConfidenceBand(stateData.avgMortgageRate, loanType, creditScore);
  const rate = rateOverride ?? rateRange.mid;
  const monthlyRate = rate / 100 / 12;
  const numPayments = loanTermYears * 12;
  const monthlyMortgage =
    loanAmount > 0
      ? (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
        (Math.pow(1 + monthlyRate, numPayments) - 1)
      : 0;
  const monthlyPropertyTax = (homePrice * (stateData.avgPropertyTax / 100)) / 12;
  const insuranceRate = getStateInsuranceRate(stateData.abbreviation);
  const monthlyInsurance = (homePrice * insuranceRate) / 12;
  let monthlyPMI = 0;
  if (loanType.id === "fha") {
    monthlyPMI = (baseLoanAmount * 0.0085) / 12;
  } else if (loanType.requiresPMI && downPaymentPercent < 20) {
    monthlyPMI = (baseLoanAmount * loanType.pmiRate) / 12;
  }
  return monthlyMortgage + monthlyPropertyTax + monthlyInsurance + monthlyPMI + hoaMonthly;
}

export function GenericResults({
  state: initialState,
  homePrice,
  hoaMonthly: initialHoa,
  financialProfile: initialFinancialProfile,
  loanTypeId: initialLoanTypeId,
  onBack,
  onSave,
  editingScenarioId = null,
  editingScenarioName = null,
}: GenericResultsProps) {
  const { toast } = useToast();
  const navigate = useNavigate();

  // All editable inputs as local state
  const [currentState, setCurrentState] = useState<StateData>(initialState);
  // Default the displayed "Home Price" to the AVERAGE affordable price (≈85% of
  // max qualified) so the headline, monthly payment and minimum income required
  // all stay aligned with what the buyer can realistically afford. The user can
  // still edit the price in the inputs panel or via the target-payment slider.
  const [selectedPrice, setSelectedPrice] = useState<number>(() => {
    const probe = calculateMortgage(
      homePrice && homePrice > 0 ? homePrice : 400000,
      20,
      initialState,
      initialFinancialProfile,
      initialHoa,
      initialLoanTypeId,
    );
    const avg = Math.round((probe.maxAffordablePrice * 0.85) / 1000) * 1000;
    return avg > 0 ? avg : homePrice;
  });
  const [currentLoanTypeId, setCurrentLoanTypeId] = useState<string>(initialLoanTypeId);
  const [yearlyIncome, setYearlyIncome] = useState<number>(initialFinancialProfile.yearlyIncome);
  const [monthlyDebt, setMonthlyDebt] = useState<number>(initialFinancialProfile.monthlyDebt);
  const [savings, setSavings] = useState<number>(initialFinancialProfile.savings);
  const [creditScore, setCreditScore] = useState<number>(initialFinancialProfile.creditScore);
  const [isFirstTimeBuyer, setIsFirstTimeBuyer] = useState<boolean>(initialFinancialProfile.isFirstTimeBuyer ?? true);
  const [hoaMonthly, setHoaMonthly] = useState<number>(initialHoa);

  // Inline edit form staging values
  const [editPrice, setEditPrice] = useState<string>(homePrice.toString());
  const [editIncome, setEditIncome] = useState<string>(initialFinancialProfile.yearlyIncome.toString());
  const [editSavings, setEditSavings] = useState<string>(initialFinancialProfile.savings.toString());
  const [editDebt, setEditDebt] = useState<string>(initialFinancialProfile.monthlyDebt.toString());
  const [editHoa, setEditHoa] = useState<string>(initialHoa.toString());

  const loanType = LOAN_TYPES.find((lt) => lt.id === currentLoanTypeId) || LOAN_TYPES[0];
  const [selectedDownPayment, setSelectedDownPayment] = useState<number>(loanType.minDownPayment);
  const [user, setUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState<Record<string, any> | null>(null);
  const [inputsExpanded, setInputsExpanded] = useState(false);

  // Two-view results: "Affordability" (headline number) vs "Financial Health" (how we got it)
  const [activeView, setActiveView] = useState<"affordability" | "health">("affordability");
  // Buyer's stated target price entered in the questionnaire (never blended with qualifying number)
  const targetHomePrice = homePrice;

  // Desired monthly payment state
  const [targetPaymentEnabled, setTargetPaymentEnabled] = useState(false);
  const [targetPayment, setTargetPayment] = useState<number>(0);
  const [targetPaymentInput, setTargetPaymentInput] = useState<string>("");

  // Custom rate override state
  const [customRate, setCustomRate] = useState<number | null>(null);
  const [showRateAdjust, setShowRateAdjust] = useState(false);

  // Seller's concession toggle — when on, seller covers up to closing costs (slider)
  const [sellerConcession, setSellerConcession] = useState(false);
  const [concessionAmount, setConcessionAmount] = useState<number | null>(null);

  // Smart Insights collapsible state
  const isMobile = useIsMobile();
  const [insightsExpanded, setInsightsExpanded] = useState(true);
  const insightsContentRef = useRef<HTMLDivElement>(null);
  const programsRef = useRef<HTMLDivElement>(null);
  const [programsVisible, setProgramsVisible] = useState(false);
  const [programsBouncing, setProgramsBouncing] = useState(true);
  const [programsTooltipOpen, setProgramsTooltipOpen] = useState(false);
  const [showProgramsPrompt, setShowProgramsPrompt] = useState(false);

  // Show "Would you like to see programs you qualify for?" only once per browser
  useEffect(() => {
    if (localStorage.getItem("throuly_programs_prompt_seen") === "true") return;
    const t = setTimeout(() => {
      setShowProgramsPrompt(true);
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  const dismissProgramsPrompt = (go = false) => {
    setShowProgramsPrompt(false);
    localStorage.setItem("throuly_programs_prompt_seen", "true");
    if (go) goToPrograms();
  };

  const goToPrograms = () => {
    const params = new URLSearchParams({
      state: currentState.name,
      homePrice: String(effectivePrice),
      income: String(financialProfile.yearlyIncome),
      firstTime: String(financialProfile.isFirstTimeBuyer ?? true),
    });
    navigate(`/buyers/programs?${params.toString()}`);
  };

  useEffect(() => {
    const el = programsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setProgramsVisible(entry.isIntersecting), {
      threshold: 0.1,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Default collapsed on mobile, expanded on desktop
  useEffect(() => {
    setInsightsExpanded(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const financialProfile: FinancialProfile = {
    ...initialFinancialProfile,
    yearlyIncome,
    monthlyDebt,
    savings,
    creditScore,
    isFirstTimeBuyer,
  };

  // Keep the session in sync with any inline edits made on the results page
  useEffect(() => {
    try {
      sessionStorage.setItem(
        "throuly_buyers_session",
        JSON.stringify({
          selectedState: currentState,
          homePrice: selectedPrice,
          hoaMonthly,
          financialProfile,
          loanTypeId: currentLoanTypeId,
        }),
      );
    } catch {
      // ignore
    }
  }, [
    currentState,
    selectedPrice,
    hoaMonthly,
    yearlyIncome,
    monthlyDebt,
    savings,
    creditScore,
    isFirstTimeBuyer,
    currentLoanTypeId,
  ]);

  const rateArg = customRate ?? undefined;

  // Original calc (based on selected price)
  const originalCalc = calculateMortgage(
    selectedPrice,
    selectedDownPayment,
    currentState,
    financialProfile,
    hoaMonthly,
    currentLoanTypeId,
    rateArg,
  );

  // Initialize target payment when not yet set
  useEffect(() => {
    if (!targetPaymentEnabled) {
      setTargetPayment(originalCalc.totalMonthlyPayment);
      setTargetPaymentInput(originalCalc.totalMonthlyPayment.toString());
    }
  }, [originalCalc.totalMonthlyPayment, targetPaymentEnabled]);

  // Reverse-calc price from target payment
  const adjustedPrice = useMemo(() => {
    if (!targetPaymentEnabled) return selectedPrice;
    return reverseCalcPriceFromPayment(
      targetPayment,
      currentState,
      selectedDownPayment,
      hoaMonthly,
      currentLoanTypeId,
      rateArg,
      financialProfile.creditScore,
    );
  }, [
    targetPaymentEnabled,
    targetPayment,
    currentState,
    selectedDownPayment,
    hoaMonthly,
    currentLoanTypeId,
    selectedPrice,
    rateArg,
    financialProfile.creditScore,
  ]);

  // The effective calc used everywhere
  const effectivePrice = targetPaymentEnabled ? adjustedPrice : selectedPrice;
  const calc = targetPaymentEnabled
    ? calculateMortgage(
        adjustedPrice,
        selectedDownPayment,
        currentState,
        financialProfile,
        hoaMonthly,
        currentLoanTypeId,
        rateArg,
      )
    : originalCalc;

  const qualStatus = getQualificationStatus(
    calc.frontEndDTI,
    calc.backEndDTI,
    financialProfile.creditScore,
    financialProfile.savings >= calc.totalCashNeeded,
    loanType,
  );
  // A price anchored to the standard (non-expanded) DTI caps, with a small
  // safety margin so it lands clearly within — not right at — the target,
  // for use as a "Qualified" anchor in the price comparison grid below.
  const grossMonthlyIncome = financialProfile.yearlyIncome / 12;
  const comfortableTargetMonthly = Math.max(
    0,
    Math.min(
      grossMonthlyIncome * (loanType.maxFrontEndDTI / 100),
      grossMonthlyIncome * (loanType.maxDTI / 100) - financialProfile.monthlyDebt,
    ) * 0.9,
  );
  const comfortablePrice =
    comfortableTargetMonthly > 0
      ? reverseCalcPriceFromPayment(
          comfortableTargetMonthly,
          currentState,
          selectedDownPayment,
          hoaMonthly,
          currentLoanTypeId,
          rateArg,
          financialProfile.creditScore,
        )
      : 0;
  const priceOptions = generatePriceOptions(effectivePrice, calc.maxAffordablePrice, comfortablePrice);
  const dtiLabels = getDTITargetLabel(loanType);

  // Min payment at lowest comparison price
  const minPriceCalc = calculateMortgage(
    50000,
    selectedDownPayment,
    currentState,
    financialProfile,
    hoaMonthly,
    currentLoanTypeId,
    rateArg,
  );
  const minPossiblePayment = minPriceCalc.totalMonthlyPayment;

  const currentSnapshot = useMemo(
    () => ({
      stateName: currentState.name,
      homePrice: effectivePrice,
      selectedPrice,
      downPaymentPercent: selectedDownPayment,
      loanTypeId: currentLoanTypeId,
      hoaMonthly,
      yearlyIncome: financialProfile.yearlyIncome,
      monthlyDebt: financialProfile.monthlyDebt,
      savings: financialProfile.savings,
      creditScore: financialProfile.creditScore,
      isFirstTimeBuyer: financialProfile.isFirstTimeBuyer,
      employmentType: financialProfile.employmentType,
      propertyType: financialProfile.propertyType,
      customRate,
      targetPaymentEnabled,
      targetPayment,
      sellerConcession,
      concessionAmount,
      editPrice,
      editIncome,
      editSavings,
      editDebt,
      editHoa,
    }),
    [
      currentState.name,
      effectivePrice,
      selectedPrice,
      selectedDownPayment,
      currentLoanTypeId,
      hoaMonthly,
      financialProfile.yearlyIncome,
      financialProfile.monthlyDebt,
      financialProfile.savings,
      financialProfile.creditScore,
      financialProfile.isFirstTimeBuyer,
      financialProfile.employmentType,
      financialProfile.propertyType,
      customRate,
      targetPaymentEnabled,
      targetPayment,
      sellerConcession,
      concessionAmount,
      editPrice,
      editIncome,
      editSavings,
      editDebt,
      editHoa,
    ],
  );

  const hasChangesSinceSave = useMemo(() => {
    if (!savedSnapshot) return false;
    return JSON.stringify(savedSnapshot) !== JSON.stringify(currentSnapshot);
  }, [savedSnapshot, currentSnapshot]);

  const scenarioInputs = useMemo(
    () => ({
      state: currentState.name,
      stateAbbreviation: currentState.abbreviation,
      homePrice: effectivePrice,
      downPaymentPercent: selectedDownPayment,
      hoaMonthly,
      loanTypeId: currentLoanTypeId,
      yearlyIncome: financialProfile.yearlyIncome,
      monthlyDebt: financialProfile.monthlyDebt,
      savings: financialProfile.savings,
      creditScore: financialProfile.creditScore,
      employmentType: financialProfile.employmentType,
      isFirstTimeBuyer: financialProfile.isFirstTimeBuyer,
      propertyType: financialProfile.propertyType,
    }),
    [
      currentState.name,
      currentState.abbreviation,
      effectivePrice,
      selectedDownPayment,
      hoaMonthly,
      currentLoanTypeId,
      financialProfile.yearlyIncome,
      financialProfile.monthlyDebt,
      financialProfile.savings,
      financialProfile.creditScore,
      financialProfile.employmentType,
      financialProfile.isFirstTimeBuyer,
      financialProfile.propertyType,
    ],
  );

  // Auto-save is disabled: scenarios are only persisted when the user explicitly
  // taps "Save estimate" or "Save as new state scenario". This keeps the saved
  // scenarios list intentional and prevents it from filling up automatically.

  // Find which credit score range label matches
  const currentCreditLabel =
    CREDIT_SCORE_RANGES.find((r) => creditScore >= r.min && creditScore <= r.max)?.label ||
    CREDIT_SCORE_RANGES[1].label;

  const [showSignInModal, setShowSignInModal] = useState(false);
  const [signInContext, setSignInContext] = useState<"save" | "edit-inputs">("save");

  // Gate for any action that would change inputs after the user has already seen
  // their result. Viewing/scrolling/expanding to read is never gated — only
  // mutations. Returns true if the caller may proceed (signed-in user).
  const requireAccountForEdit = useCallback((): boolean => {
    if (user) return true;
    setSignInContext("edit-inputs");
    setShowSignInModal(true);
    return false;
  }, [user]);

  const handleRecalculate = () => {
    if (!requireAccountForEdit()) return;
    const newPrice = Number(editPrice) || selectedPrice;
    const newIncome = Number(editIncome) || yearlyIncome;
    const newSavings = Number(editSavings) || savings;
    const newDebt = Number(editDebt) || 0;
    const newHoa = Number(editHoa) || 0;

    setSelectedPrice(newPrice);
    setYearlyIncome(newIncome);
    setSavings(newSavings);
    setMonthlyDebt(newDebt);
    setHoaMonthly(newHoa);
    setTargetPaymentEnabled(false);

    const newLoanType = LOAN_TYPES.find((lt) => lt.id === currentLoanTypeId) || LOAN_TYPES[0];
    if (selectedDownPayment < newLoanType.minDownPayment) {
      setSelectedDownPayment(newLoanType.minDownPayment);
    }

    toast({
      title: "Recalculated",
      description: "Results updated with your new inputs.",
    });
  };


  const handleSaveToDevice = () => {
    const scenario = {
      id: crypto.randomUUID(),
      type: "buyer" as const,
      state: currentState.name,
      homePrice: effectivePrice,
      downPaymentPercent: selectedDownPayment,
      monthlyPayment: calc.totalMonthlyPayment,
      dtiRatio: calc.backEndDTI,
      totalCashNeeded: calc.totalCashNeeded,
      hoaMonthly,
      qualifies: qualStatus.status !== "unlikely",
      timestamp: new Date().toISOString(),
    };
    const saved = JSON.parse(localStorage.getItem("throuly_saved_scenarios") || "[]");
    saved.unshift(scenario);
    localStorage.setItem("throuly_saved_scenarios", JSON.stringify(saved));
    toast({
      title: "Saved to Device",
      description: "Saved to your device — no account needed.",
    });
  };




  const [isSavingNewState, setIsSavingNewState] = useState(false);

  const [newStateSavedForAbbr, setNewStateSavedForAbbr] = useState<string | null>(null);

  const isDifferentState = currentState.abbreviation !== initialState.abbreviation;

  const handleSaveAsNewStateScenario = async () => {
    if (!user) {
      setSignInContext("save");
      setShowSignInModal(true);
      return;
    }
    setIsSavingNewState(true);
    try {
      const { data: existing } = await supabase
        .from("saved_scenarios" as any)
        .select("id")
        .eq("user_id", user.id)
        .neq("scenario_name", "Financial Health Report")
        .not("scenario_name", "ilike", "%Auto-saved%");
      if ((existing || []).length >= 5) {
        toast({
          title: "Save limit reached",
          description: "You already have 5 saved scenarios. Delete one from your dashboard to make room.",
          variant: "destructive",
        });
        setIsSavingNewState(false);
        return;
      }
      const scenarioResults = {
        monthlyMortgage: calc.monthlyMortgage,
        monthlyPropertyTax: calc.monthlyPropertyTax,
        monthlyInsurance: calc.monthlyInsurance,
        monthlyPMI: calc.monthlyPMI,
        monthlyHOA: calc.monthlyHOA,
        totalMonthlyPayment: calc.totalMonthlyPayment,
        downPaymentAmount: calc.downPaymentAmount,
        closingCosts: calc.closingCosts,
        totalCashNeeded: calc.totalCashNeeded,
        frontEndDTI: calc.frontEndDTI,
        backEndDTI: calc.backEndDTI,
        maxAffordablePrice: calc.maxAffordablePrice,
        qualificationStatus: qualStatus.status,
        upfrontMIP: calc.upfrontMIP,
      };
      const dateStr = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const { error } = await supabase.from("saved_scenarios" as any).insert({
        user_id: user.id,
        scenario_name: `${currentState.name} — ${dateStr}`,
        inputs: scenarioInputs,
        results: scenarioResults,
      });
      if (error) throw error;
      setNewStateSavedForAbbr(currentState.abbreviation);
      toast({
        title: `${currentState.name} scenario saved`,
        description: "View it anytime from your dashboard.",
      });
      onSave();
    } catch (err) {
      console.error("Save as new scenario failed:", err);
      toast({
        title: "Couldn't save",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsSavingNewState(false);
    }
  };



  const handleSaveResults = async () => {
    if (!user) {
      setSignInContext("save");
      setShowSignInModal(true);
      return;
    }

    setIsSaving(true);
    try {
      const scenarioResults = {
        monthlyMortgage: calc.monthlyMortgage,
        monthlyPropertyTax: calc.monthlyPropertyTax,
        monthlyInsurance: calc.monthlyInsurance,
        monthlyPMI: calc.monthlyPMI,
        monthlyHOA: calc.monthlyHOA,
        totalMonthlyPayment: calc.totalMonthlyPayment,
        downPaymentAmount: calc.downPaymentAmount,
        closingCosts: calc.closingCosts,
        totalCashNeeded: calc.totalCashNeeded,
        frontEndDTI: calc.frontEndDTI,
        backEndDTI: calc.backEndDTI,
        maxAffordablePrice: calc.maxAffordablePrice,
        qualificationStatus: qualStatus.status,
        upfrontMIP: calc.upfrontMIP,
      };

      // Update-in-place mode when editing a saved scenario
      if (editingScenarioId) {
        const { error: updateError } = await supabase
          .from("saved_scenarios" as any)
          .update({ inputs: scenarioInputs, results: scenarioResults })
          .eq("id", editingScenarioId)
          .eq("user_id", user.id);
        if (updateError) throw updateError;
        toast({
          title: "Estimate updated",
          description: `${editingScenarioName || "Your estimate"} was updated.`,
        });
        setSavedSnapshot(currentSnapshot);
        onSave();
        return;
      }

      const { data: existing } = await supabase
        .from("saved_scenarios" as any)
        .select("id")
        .eq("user_id", user.id)
        .neq("scenario_name", "Financial Health Report")
        .not("scenario_name", "ilike", "%Auto-saved%");

      // Count check — enforce 5-scenario cap (excludes auto-saved estimates)
      if ((existing || []).length >= 5) {
        toast({
          title: "Save limit reached",
          description: "You already have 5 saved scenarios. Delete one from your dashboard to make room.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      // Duplicate check (keeps existing behavior)
      const { data: dupe } = await supabase
        .from("saved_scenarios" as any)
        .select("id")
        .eq("user_id", user.id)
        .contains("inputs", scenarioInputs)
        .containedBy("inputs", scenarioInputs)
        .limit(1);

      if (dupe && dupe.length > 0) {
        toast({
          title: "Already saved",
          description: "This estimate is already in your account.",
        });
        setSavedSnapshot(currentSnapshot);
        return;
      }

      const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

      const { error } = await supabase.from("saved_scenarios" as any).insert({
        user_id: user.id,
        scenario_name: `${currentState.name} — ${dateStr}`,
        inputs: scenarioInputs,
        results: scenarioResults,
      });

      if (error) throw error;

      toast({
        title: "Estimate saved!",
        description: "View it anytime from your dashboard.",
      });
      setSavedSnapshot(currentSnapshot);
      onSave();
    } catch (error) {
      console.error("Error saving results:", error);
      try {
        const { error: fallbackError } = await supabase.from("saved_results").insert({
          user_id: user.id,
          state: currentState.name,
          home_price: effectivePrice,
          down_payment_percent: selectedDownPayment,
          monthly_payment: calc.totalMonthlyPayment,
          dti_ratio: calc.backEndDTI,
          total_cash_needed: calc.totalCashNeeded,
          hoa_monthly: hoaMonthly,
          qualifies: qualStatus.status !== "unlikely",
        });
        if (fallbackError) throw fallbackError;
        toast({
          title: "Estimate saved!",
          description: "View it anytime from your dashboard.",
        });
        setSavedSnapshot(currentSnapshot);
        onSave();
      } catch (fallbackError) {
        console.error("Fallback save error:", fallbackError);
        toast({
          title: "Error",
          description: "Failed to save results. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleTargetPaymentChange = (value: number) => {
    setTargetPayment(value);
    setTargetPaymentInput(value.toString());
    setTargetPaymentEnabled(true);
  };

  const handleTargetPaymentInputChange = (val: string) => {
    setTargetPaymentInput(val);
    const num = Number(val);
    if (num >= 500 && num <= 8000) {
      setTargetPayment(num);
      setTargetPaymentEnabled(true);
    }
  };

  const resetTargetPayment = () => {
    setTargetPaymentEnabled(false);
    setTargetPayment(originalCalc.totalMonthlyPayment);
    setTargetPaymentInput(originalCalc.totalMonthlyPayment.toString());
  };

  // PMI info text helper
  const getPMIInfoText = () => {
    if (loanType.id === "fha") {
      return selectedDownPayment < 10
        ? `Upfront PMI of 1.75% financed into loan. Monthly PMI required for the life of the loan (down payment < 10%).`
        : `Upfront PMI of 1.75% financed into loan. Monthly PMI required for 11 years (down payment ≥ 10%).`;
    }
    if (loanType.id === "conventional" && selectedDownPayment < 20) {
      return `PMI of ${formatCurrency(calc.monthlyPMI)}/mo required until you reach 20% equity, then it drops off automatically.`;
    }
    return "No PMI required.";
  };

  const showPMIRow = !(loanType.id === "conventional" && selectedDownPayment >= 20);

  return (
    <TooltipProvider>
      <div className="max-w-6xl mx-auto">
        {/* Back Button at Top */}
        <Button
          variant="ghost"
          size="lg"
          onClick={() => {
            if (!requireAccountForEdit()) return;
            onBack();
          }}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Step 1: Financial Health
        </Button>




        {/* Header with Qualification Status */}
        <Reveal delay={50}>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="font-serif text-2xl md:text-3xl text-foreground">Your Home Affordability Results</h1>
              <Badge
                className={cn(
                  "text-sm",
                  qualStatus.status === "excellent" && "bg-success text-success-foreground",
                  qualStatus.status === "good" && "bg-success/80 text-success-foreground",
                  qualStatus.status === "fair" && "bg-warning text-warning-foreground",
                  qualStatus.status === "unlikely" && "bg-destructive text-destructive-foreground",
                )}
              >
                {qualStatus.status === "excellent" && <CheckCircle2 className="w-4 h-4 mr-1" />}
                {qualStatus.status === "good" && <CheckCircle2 className="w-4 h-4 mr-1" />}
                {qualStatus.status === "fair" && <AlertTriangle className="w-4 h-4 mr-1" />}
                {qualStatus.status === "unlikely" && <XCircle className="w-4 h-4 mr-1" />}
                {qualStatus.status.charAt(0).toUpperCase() + qualStatus.status.slice(1)}
              </Badge>
            </div>
            <p className="text-muted-foreground">{qualStatus.message}</p>
          </div>
        </Reveal>


        {/* Desktop: two-column layout for main content + insights sidebar */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main content column */}
          <div className="flex-1 min-w-0">
            {/* Collapsible Inputs Section */}
            <Reveal delay={50}>
              <Card className="p-4 mb-6">
                <button
                  onClick={() => setInputsExpanded(!inputsExpanded)}
                  className="w-full flex items-center justify-between text-left"
                >

                  <span className="font-medium text-foreground flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-accent" />
                    Your Inputs
                  </span>
                  {inputsExpanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                {inputsExpanded && (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Location</Label>
                        <Select
                          value={currentState.name}
                          onValueChange={(v) => {
                            const s = statesData.find((st) => st.name === v);
                            if (s) setCurrentState(s);
                          }}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-[250px] bg-card">
                            {statesData.map((s) => (
                              <SelectItem key={s.abbreviation} value={s.name}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Home Price</Label>
                        <MoneyInput
                          value={editPrice}
                          onChange={setEditPrice}
                          className="mt-1"
                          aria-label="Home price"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Loan Type</Label>
                        <Select value={currentLoanTypeId} onValueChange={setCurrentLoanTypeId}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card">
                            {LOAN_TYPES.map((lt) => (
                              <SelectItem key={lt.id} value={lt.id}>
                                {lt.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">HOA Monthly</Label>
                        <MoneyInput
                          value={editHoa}
                          onChange={setEditHoa}
                          className="mt-1"
                          aria-label="HOA monthly"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Annual Income</Label>
                        <MoneyInput
                          value={editIncome}
                          onChange={setEditIncome}
                          className="mt-1"
                          aria-label="Annual income"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Available Savings</Label>
                        <MoneyInput
                          value={editSavings}
                          onChange={setEditSavings}
                          className="mt-1"
                          aria-label="Available savings"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Monthly Debt</Label>
                        <MoneyInput
                          value={editDebt}
                          onChange={setEditDebt}
                          className="mt-1"
                          aria-label="Monthly debt"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Credit Score Range</Label>
                        <Select
                          value={currentCreditLabel}
                          onValueChange={(v) => {
                            const range = CREDIT_SCORE_RANGES.find((r) => r.label === v);
                            if (range) setCreditScore(Math.floor((range.min + range.max) / 2));
                          }}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card">
                            {CREDIT_SCORE_RANGES.map((r) => (
                              <SelectItem key={r.label} value={r.label}>
                                {r.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch checked={isFirstTimeBuyer} onCheckedChange={setIsFirstTimeBuyer} />
                        <Label className="text-sm text-muted-foreground">First-Time Buyer</Label>
                      </div>
                      <Button onClick={handleRecalculate} size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Recalculate
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </Reveal>

            {/* Rate Range Banner */}
            <Reveal delay={50}>
              <Card className="p-4 mb-6 bg-secondary/50">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Rate Confidence Band</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>
                        Rates vary by lender, credit score, and market conditions. This range represents typical rates
                        available today.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Low</span>
                      <span>{customRate !== null ? "Custom" : "Mid"}</span>
                      <span>High</span>
                    </div>
                    <div className="h-2 bg-gradient-to-r from-success via-accent to-warning rounded-full" />
                    <div className="flex justify-between text-sm font-medium mt-1">
                      <span>{calc.rateRange.low}%</span>
                      <span className="text-accent">
                        {customRate !== null ? `${customRate}%` : `${calc.rateRange.mid}%`}
                      </span>
                      <span>{calc.rateRange.high}%</span>
                    </div>
                  </div>
                  <Badge variant="outline">{loanType.name}</Badge>
                </div>

                {/* Rate note */}
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                  Your results use a {customRate !== null ? "custom" : `mid-range ${loanType.name}`} rate of{" "}
                  <span className="font-medium text-foreground">{customRate ?? calc.rateRange.mid}%</span>. Actual rates
                  vary by lender — even a 0.5% difference can change your buying power by $15,000–$25,000. Speak with a
                  licensed loan officer to get your personalized rate.
                </p>


                {/* Adjust Rate toggle */}
                <div className="mt-3">
                  <button
                    onClick={() => setShowRateAdjust(!showRateAdjust)}
                    className="text-sm text-primary font-medium hover:text-primary/80 flex items-center gap-1"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    {showRateAdjust ? "Hide Rate Adjuster" : "Adjust Rate"}
                  </button>

                  {showRateAdjust && (
                    <div className="mt-3 p-3 bg-background rounded-lg border border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-muted-foreground">Custom Interest Rate</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-foreground">
                            {customRate !== null ? customRate : calc.rateRange.mid}%
                          </span>
                          {customRate !== null && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => {
                                if (!requireAccountForEdit()) return;
                                setCustomRate(null);
                              }}

                            >
                              Reset
                            </Button>
                          )}
                        </div>
                      </div>
                      <Slider
                        value={[customRate !== null ? customRate : calc.rateRange.mid]}
                        onValueChange={([v]) => {
                          if (!requireAccountForEdit()) return;
                          setCustomRate(Math.round(v * 1000) / 1000);
                        }}

                        min={5.0}
                        max={8.0}
                        step={0.125}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>5.0%</span>
                        <span>8.0%</span>
                      </div>
                      {customRate !== null && (
                        <p className="text-xs text-muted-foreground">
                          {customRate < calc.rateRange.mid ? (
                            <span className="text-success">
                              ↓ {(calc.rateRange.mid - customRate).toFixed(3)}% lower than mid-range — your buying power
                              increases.
                            </span>
                          ) : customRate > calc.rateRange.mid ? (
                            <span className="text-warning">
                              ↑ {(customRate - calc.rateRange.mid).toFixed(3)}% higher than mid-range — your buying
                              power decreases.
                            </span>
                          ) : (
                            <span>Same as the mid-range rate.</span>
                          )}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </Reveal>

            {activeView === "affordability" && (
              <>
            {/* You qualify for — headline dollar amount from calculation, never the buyer's stated target */}
            <Reveal delay={50}>
              <Card className="p-6 sm:p-8 mb-6 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 border-primary/30">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Maximum you may qualify for
                </p>
                <p className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-primary tabular-nums break-words leading-tight">
                  {formatCurrency(calc.maxAffordablePrice)}
                </p>
                {targetHomePrice > 0 && Math.abs(targetHomePrice - calc.maxAffordablePrice) > 1000 && (
                  <p className="mt-3 text-sm sm:text-base text-muted-foreground">
                    Your target:{" "}
                    <span className="font-medium text-foreground/80">{formatCurrency(targetHomePrice)}</span>
                    {targetHomePrice > calc.maxAffordablePrice ? (
                      <span className="ml-2 text-xs sm:text-sm text-warning">
                        (above your qualifying amount)
                      </span>
                    ) : (
                      <span className="ml-2 text-xs sm:text-sm text-success">
                        (within your qualifying range)
                      </span>
                    )}
                  </p>
                )}
                <p className="mt-3 text-xs sm:text-sm text-muted-foreground">
                  Based on your income, debts, credit, and down payment.
                </p>
                {homePrice > 0 && (
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                    Comfortable target from Step 1:{" "}
                    <span className="font-medium text-foreground/80 tabular-nums">
                      {formatCurrency(homePrice)}
                    </span>
                  </p>
                )}
              </Card>
            </Reveal>


            {/* Down Payment Selector */}
            <Reveal delay={50}>
              <Card className="p-5 mb-4">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5 text-accent" />
                  <h3 className="font-medium text-foreground">Select Down Payment</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {DOWN_PAYMENT_OPTIONS.map((dp) => {
                    const dpCalc = calculateMortgage(
                      effectivePrice,
                      dp,
                      currentState,
                      financialProfile,
                      hoaMonthly,
                      currentLoanTypeId,
                      rateArg,
                    );
                    const meetsMinimum = dp >= loanType.minDownPayment;
                    return (
                      <button
                        key={dp}
                        onClick={() => {
                          if (!meetsMinimum) return;
                          if (!requireAccountForEdit()) return;
                          setSelectedDownPayment(dp);
                        }}

                        disabled={!meetsMinimum}
                        className={cn(
                          "py-3 px-4 rounded-lg border-2 text-center transition-all",
                          selectedDownPayment === dp
                            ? "border-accent bg-accent/10"
                            : "border-border hover:border-muted-foreground",
                          !meetsMinimum && "opacity-40 cursor-not-allowed",
                          !dpCalc.qualifies && "opacity-60",
                        )}
                      >
                        <span className="text-lg font-bold">{dp}%</span>
                        <p className="text-xs text-muted-foreground mt-1">{formatCurrency(dpCalc.downPaymentAmount)}</p>
                      </button>
                    );
                  })}
                </div>
              </Card>
            </Reveal>

            {/* Cash to Close Breakdown */}
            <Reveal delay={50}>
              <DarkResultPanel className="mb-4">
                <div className="flex items-center gap-2 mb-5">
                  <DarkEyebrow icon={<DollarSign className="w-3.5 h-3.5" />} className="mb-0">
                    Cash to Close
                  </DarkEyebrow>
                  {financialProfile.savings <
                    calc.totalCashNeeded -
                      (sellerConcession ? Math.min(calc.closingCosts, concessionAmount ?? calc.closingCosts) : 0) && (
                    <Badge variant="destructive" className="ml-auto text-xs">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Insufficient Savings
                    </Badge>
                  )}
                </div>
                {(() => {
                  const maxConcession = calc.closingCosts;
                  const appliedConcession = sellerConcession
                    ? Math.min(maxConcession, concessionAmount ?? maxConcession)
                    : 0;
                  const effectiveClosing = Math.max(0, calc.closingCosts - appliedConcession);
                  const effectiveTotal = calc.downPaymentAmount + effectiveClosing;
                  const meetsSavings = financialProfile.savings >= effectiveTotal;
                  return (
                    <>
                      <div
                        className={cn("grid gap-3 grid-cols-2", sellerConcession ? "sm:grid-cols-4" : "sm:grid-cols-3")}
                      >
                        <DarkStatTile
                          label={`Down Payment (${selectedDownPayment}%)`}
                          value={formatCurrency(calc.downPaymentAmount)}
                        />
                        <DarkStatTile
                          label={`Closing Costs (~${formatPercent(currentState.avgClosingCost, 0)})`}
                          value={formatCurrency(effectiveClosing)}
                          tooltip={
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button type="button" aria-label="Seller's Concession info">
                                  <HelpCircle className="w-3 h-3 font-semibold text-foreground/80" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="font-medium mb-1">Seller's Concession</p>
                                <p>
                                  A seller's concession is when the seller agrees to cover your closing costs as part of
                                  the deal negotiation. This reduces your upfront cash needed at closing.
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
                          label="Total Cash Needed"
                          value={formatCurrency(effectiveTotal)}
                          valueClassName={meetsSavings ? "text-success" : "text-destructive"}
                          emphasis
                        />
                      </div>

                      {/* Seller's Concession toggle */}
                      <DarkInsetCard className="mt-4 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Switch
                              id="seller-concession"
                              checked={sellerConcession}
                              onCheckedChange={setSellerConcession}
                            />
                            <Label htmlFor="seller-concession" className="text-sm text-foreground cursor-pointer">
                              Apply Seller's Concession
                            </Label>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button type="button" aria-label="Seller's Concession info">
                                  <HelpCircle className="w-3.5 h-3.5 font-semibold text-foreground/80" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>
                                  A seller's concession is when the seller agrees to cover your closing costs as part of
                                  the deal negotiation. This reduces your upfront cash needed at closing.
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
                            <Label className="text-sm text-foreground">Concession amount</Label>
                            <span className="text-sm font-medium text-foreground tabular-nums">
                              {formatCurrency(appliedConcession)}{" "}
                              <span className="font-semibold text-foreground/70 font-normal">
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

                      <DarkInsetCard className="mt-3 p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-foreground/80">Your available savings</span>
                          <span className="font-bold text-foreground tabular-nums">
                            {formatCurrency(financialProfile.savings)}
                          </span>
                        </div>
                      </DarkInsetCard>
                    </>
                  );
                })()}
              </DarkResultPanel>
            </Reveal>


            {/* Monthly Payment Breakdown — FIX 1: PMI renamed */}
            <Reveal delay={50}>
              <Card className="p-5 mb-4">
                <div className="flex items-center gap-2 mb-4">
                  <Home className="w-5 h-5 text-accent" />
                  <h3 className="font-medium text-foreground">Monthly Payment Breakdown</h3>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>
                        These are estimates. Actual amounts will vary based on your specific lender, property, and local
                        rates.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Principal & Interest</span>
                    <span className="font-medium">{formatCurrency(calc.monthlyMortgage)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Property Taxes</span>
                    <span className="font-medium">{formatCurrency(calc.monthlyPropertyTax)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Home Insurance</span>
                    <span className="font-medium">{formatCurrency(calc.monthlyInsurance)}</span>
                  </div>
                  {showPMIRow && calc.monthlyPMI > 0 && (
                    <>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground flex items-center gap-1">
                          PMI (Mortgage Insurance)
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="w-3 h-3" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>{getPMIInfoText()}</p>
                            </TooltipContent>
                          </Tooltip>
                        </span>
                        <span className="font-medium">{formatCurrency(calc.monthlyPMI)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground bg-secondary/50 p-2 rounded">
                        {getPMIInfoText()}
                      </div>
                    </>
                  )}
                  {hoaMonthly > 0 && (
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">HOA</span>
                      <span className="font-medium">{formatCurrency(hoaMonthly)}</span>
                    </div>
                  )}
                  <div className="bg-accent/10 rounded-lg px-3 py-3 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-foreground">Total Monthly Payment</span>
                      <span className="text-xl font-bold text-accent">
                        {formatCurrency(targetPaymentEnabled ? targetPayment : calc.totalMonthlyPayment)}/mo
                      </span>
                    </div>
                    <ResultsDisclaimer variant="inline" className="mt-3 bg-background/60" />


                    {/* Adjust Monthly Payment — nested inside the purple Total box */}
                    <div className="mt-4 pt-4 border-t border-accent/20">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <SlidersHorizontal className="w-4 h-4 text-accent" />
                          <p className="text-sm font-medium text-foreground">
                            Would you like to adjust your monthly payment to fit your budget?
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            variant={targetPaymentEnabled ? "accent" : "outline"}
                            size="sm"
                            onClick={() => {
                              setTargetPaymentEnabled(true);
                              const seed = targetPayment || originalCalc.totalMonthlyPayment;
                              setTargetPayment(seed);
                              setTargetPaymentInput(seed.toString());
                            }}
                            className="min-w-[72px]"
                          >
                            Yes
                          </Button>
                          <Button
                            variant={!targetPaymentEnabled ? "accent" : "outline"}
                            size="sm"
                            onClick={resetTargetPayment}
                            className="min-w-[72px]"
                          >
                            No
                          </Button>
                        </div>
                      </div>

                      {targetPaymentEnabled && (
                        <div className="space-y-4 mt-4">
                          <h4 className="text-sm font-medium text-foreground">What's your ideal monthly payment?</h4>
                          <MoneyInput
                            value={targetPaymentInput}
                            onChange={handleTargetPaymentInputChange}
                            suffix="/mo"
                            aria-label="Target monthly payment"
                          />
                          <Slider
                            value={[targetPayment]}
                            onValueChange={([v]) => handleTargetPaymentChange(v)}
                            min={500}
                            max={8000}
                            step={50}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>$500</span>
                            <span>$8,000</span>
                          </div>

                          <div className="p-3 bg-background/60 rounded-lg text-sm">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-muted-foreground">Your original estimate:</span>
                              <span className="font-medium">{formatCurrency(originalCalc.totalMonthlyPayment)}/mo</span>
                              <span className="text-muted-foreground">→ Your target:</span>
                              <span className="font-bold text-accent">{formatCurrency(targetPayment)}/mo</span>
                              {targetPayment !== originalCalc.totalMonthlyPayment && (
                                <Badge
                                  variant={targetPayment < originalCalc.totalMonthlyPayment ? "secondary" : "outline"}
                                  className="text-xs"
                                >
                                  {targetPayment < originalCalc.totalMonthlyPayment ? "−" : "+"}
                                  {formatCurrency(Math.abs(targetPayment - originalCalc.totalMonthlyPayment))}
                                </Badge>
                              )}
                            </div>
                            <p className="text-muted-foreground mt-2">
                              Adjusted home price:{" "}
                              <span className="font-bold text-foreground">{formatCurrency(adjustedPrice)}</span>
                            </p>
                            {targetPayment < minPossiblePayment && (
                              <p className="text-warning mt-2 text-xs">
                                The minimum monthly payment at current rates is approximately{" "}
                                {formatCurrency(minPossiblePayment)}/mo for a $50,000 home.
                              </p>
                            )}
                            {targetPayment > originalCalc.totalMonthlyPayment && (
                              <p className="text-success mt-2 text-xs">
                                Great news — you have room in your budget! You could afford up to{" "}
                                {formatCurrency(adjustedPrice)} with this payment.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </Reveal>

            {/* Investor Analysis (multi-family only) */}
            {financialProfile.propertyType === "multi-family" &&
              financialProfile.expectedRentalIncome &&
              financialProfile.expectedRentalIncome > 0 && (
                <InvestorAnalysis
                  homePrice={effectivePrice}
                  monthlyMortgage={calc.monthlyMortgage}
                  monthlyPropertyTax={calc.monthlyPropertyTax}
                  monthlyInsurance={calc.monthlyInsurance}
                  monthlyPMI={calc.monthlyPMI}
                  monthlyHOA={initialHoa}
                  totalCashNeeded={calc.totalCashNeeded}
                  expectedRentalIncome={financialProfile.expectedRentalIncome}
                />
              )}
              </>
            )}


            {activeView === "affordability" && (
              <>
            {/* Price Qualification Grid */}
            <Reveal delay={50}>
              <Card className="p-5 mb-4">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <h3 className="font-medium text-foreground">Compare Home Prices</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {priceOptions.map((price) => {
                    const priceCalc = calculateMortgage(
                      price,
                      selectedDownPayment,
                      currentState,
                      financialProfile,
                      hoaMonthly,
                      currentLoanTypeId,
                      rateArg,
                    );
                    // Three-state badge aligned with buying-power tiers:
                    //  - Qualified:      within standard DTI (comfortable/stretch)
                    //  - Not Recommended: qualifies for the loan (within expanded
                    //                     max cap) but exceeds standard DTI target
                    //  - Not Qualified:   fails loan qualification (over max cap)
                    const loanQualifies = priceCalc.qualifiesLoan;
                    const withinComfort =
                      loanQualifies &&
                      priceCalc.backEndDTI <= loanType.maxDTI &&
                      priceCalc.frontEndDTI <= loanType.maxFrontEndDTI;
                    const notRecommended = loanQualifies && !withinComfort;
                    const cashShort = priceCalc.cashShortfall > 0;

                    const badgeLabel = withinComfort
                      ? "Qualified"
                      : notRecommended
                        ? "Not Recommended"
                        : "Not Qualified";
                    const badgeColor = withinComfort
                      ? "text-success"
                      : notRecommended
                        ? "text-warning"
                        : "text-destructive";
                    const BadgeIcon = withinComfort
                      ? CheckCircle2
                      : notRecommended
                        ? AlertCircle
                        : XCircle;

                    return (
                      <button
                        key={price}
                        onClick={() => {
                          setSelectedPrice(price);
                          setTargetPaymentEnabled(false);
                        }}
                        className={cn(
                          "p-5 rounded-xl border-2 transition-all text-left",
                          effectivePrice === price
                            ? "border-accent bg-accent/5"
                            : "border-border hover:border-muted-foreground",
                          !loanQualifies && "opacity-60",
                        )}
                      >
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <BadgeIcon className={cn("w-4 h-4", badgeColor)} />
                          <span className={cn("text-xs font-medium", badgeColor)}>
                            {badgeLabel}
                          </span>
                          {loanQualifies && cashShort && (
                            <span
                              className="text-[10px] font-medium text-warning bg-warning/10 border border-warning/30 rounded-full px-1.5 py-0.5"
                              title={`Save ${formatCurrency(priceCalc.cashShortfall)} more for closing`}
                            >
                              Cash short
                            </span>
                          )}
                        </div>
                        <p className="text-lg font-bold text-foreground mb-2">{formatCurrency(price)}</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Monthly</span>
                            <span className="font-medium">{formatCurrency(priceCalc.totalMonthlyPayment)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Cash Needed</span>
                            <span className={cn("font-medium", cashShort && "text-warning")}>
                              {formatCurrency(priceCalc.totalCashNeeded)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">DTI</span>
                            <span
                              className={cn(
                                "font-medium",
                                getDTIColor(priceCalc.backEndDTI, loanType.maxDTI, loanType.expandedBackEndDTI),
                              )}
                            >
                              {formatPercent(priceCalc.backEndDTI)}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>
            </Reveal>
              </>
            )}

            {/* Disclaimer */}
            <Reveal delay={50}>
              <Card className="p-4 mb-6 bg-muted/50 border-muted">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium mb-1">Important Disclosure</p>
                    <p>
                      These estimates are for informational purposes only and do not constitute a loan offer or
                      guarantee. Actual rates, payments, and qualification depend on individual circumstances, credit
                      profile, property details, and lender requirements. Consult with a licensed mortgage professional
                      for personalized advice.
                    </p>
                  </div>
                </div>
              </Card>
            </Reveal>




            {/* Different-state save prompt */}
            {isDifferentState && (
              <Reveal delay={30}>
                <Card className="p-4 border-accent/40 bg-accent/5 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                  <div className="flex items-start gap-2 min-w-0">
                    <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        You're now viewing {currentState.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Save this as a separate scenario in your dashboard to compare it with {initialState.name}.
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleSaveAsNewStateScenario}
                    disabled={isSavingNewState || newStateSavedForAbbr === currentState.abbreviation}
                    className="shrink-0"
                  >
                    {isSavingNewState ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : newStateSavedForAbbr === currentState.abbreviation ? (
                      <Check className="w-4 h-4 mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {newStateSavedForAbbr === currentState.abbreviation
                      ? "Saved to dashboard"
                      : `Save ${currentState.name} scenario`}
                  </Button>
                </Card>
              </Reveal>
            )}

            {/* Action Buttons */}
            <Reveal delay={50}>
              <div className="grid grid-cols-1 gap-3">
                <Button variant="outline" size="lg" className="w-full" onClick={onBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Review Step 1: Financial Health
                </Button>
                {/* Always visible */}
                <Button
                  variant="outline"
                  size="lg"
                  onClick={savedSnapshot && !hasChangesSinceSave ? () => navigate("/dashboard") : handleSaveResults}
                  disabled={isSaving}
                  className="w-full"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : savedSnapshot && !hasChangesSinceSave ? (
                    <ArrowRight className="w-4 h-4 mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isSaving
                    ? "Saving..."
                    : savedSnapshot && !hasChangesSinceSave
                      ? "View Dashboard"
                      : "Save to My Account"}
                </Button>
              </div>
            </Reveal>
          </div>

          {/* Right sidebar — Programs + Smart Insights as separate sections */}
          <div className="w-full lg:w-80 lg:shrink-0">
            <div className="lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-1 space-y-4">
              {/* Smart Insights */}
              <div>
                <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5 mb-2">
                  <Lightbulb className="w-4 h-4 text-accent" />
                  <span className="font-semibold text-sm text-foreground">Smart Insights</span>
                </div>
                <div ref={insightsContentRef}>
                  <SmartInsights
                    calc={calc}
                    financialProfile={financialProfile}
                    loanType={loanType}
                    selectedDownPayment={selectedDownPayment}
                    stateName={currentState.name}
                    loanTypeId={currentLoanTypeId}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <ResultsDisclaimer variant="footer" />


        {/* Programs Prompt Dialog */}
        <Dialog open={showProgramsPrompt} onOpenChange={setShowProgramsPrompt}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="text-center items-center">
              <DialogTitle className="flex items-center justify-center gap-2 text-center">
                <Landmark className="w-5 h-5 text-accent" />
                Would you like to see programs you qualify for?
              </DialogTitle>
              <DialogDescription className="text-center">
                Discover down-payment assistance, grants, and tax credits available in {currentState.name} based on your
                income and home price.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button variant="outline" onClick={() => dismissProgramsPrompt()} className="w-full sm:w-auto">
                No thanks
              </Button>
              <Button onClick={() => dismissProgramsPrompt(true)} className="w-full sm:w-auto">
                Yes, show me
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Sign In Modal */}
        <Dialog open={showSignInModal} onOpenChange={setShowSignInModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {signInContext === "edit-inputs"
                  ? "Create a free account to adjust your inputs and compare scenarios"
                  : "Sign in to save your estimate"}
              </DialogTitle>
              <DialogDescription>
                {signInContext === "edit-inputs"
                  ? "Your current result stays visible. An account is optional — you can keep viewing this estimate without signing up. Nothing from this session is saved unless you create one."

                  : "Create an account or sign in to save your homebuying estimate and access it anytime from your dashboard."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-center">
              {signInContext === "edit-inputs" && (
                <Button variant="outline" onClick={() => setShowSignInModal(false)} className="w-full sm:w-auto">
                  Keep viewing my result
                </Button>
              )}
              <Button
                onClick={() => {
                  if (signInContext === "save") {
                    try {
                      const dateStr = new Date().toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });
                      const payload = {
                        scenario_name: `Homebuying Estimate ${dateStr}`,
                        inputs: {
                          state: currentState.name,
                          stateAbbreviation: currentState.abbreviation,
                          homePrice: effectivePrice,
                          downPaymentPercent: selectedDownPayment,
                          hoaMonthly,
                          loanTypeId: currentLoanTypeId,
                          yearlyIncome: financialProfile.yearlyIncome,
                          monthlyDebt: financialProfile.monthlyDebt,
                          savings: financialProfile.savings,
                          creditScore: financialProfile.creditScore,
                          employmentType: financialProfile.employmentType,
                          isFirstTimeBuyer: financialProfile.isFirstTimeBuyer,
                          propertyType: financialProfile.propertyType,
                        },
                        results: {
                          monthlyMortgage: calc.monthlyMortgage,
                          monthlyPropertyTax: calc.monthlyPropertyTax,
                          monthlyInsurance: calc.monthlyInsurance,
                          monthlyPMI: calc.monthlyPMI,
                          monthlyHOA: calc.monthlyHOA,
                          totalMonthlyPayment: calc.totalMonthlyPayment,
                          downPaymentAmount: calc.downPaymentAmount,
                          closingCosts: calc.closingCosts,
                          totalCashNeeded: calc.totalCashNeeded,
                          frontEndDTI: calc.frontEndDTI,
                          backEndDTI: calc.backEndDTI,
                          maxAffordablePrice: calc.maxAffordablePrice,
                          qualificationStatus: qualStatus.status,
                          upfrontMIP: calc.upfrontMIP,
                        },
                      };
                      localStorage.setItem("throuly_pending_save", JSON.stringify(payload));
                    } catch {
                      // ignore
                    }
                  }
                  navigate("/auth");
                }}
                className="w-full sm:w-auto"
              >
                Continue to Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
