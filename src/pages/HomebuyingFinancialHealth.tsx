import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/ui/money-input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Activity,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  ShieldCheck,
  PiggyBank,
  TrendingUp,
  Home,
  Sparkles,
  RotateCcw,
  ChevronDown,
  Wallet,
  CreditCard,
  Save,
  Users,
  HelpCircle,
} from "lucide-react";
import { StateData } from "@/lib/states";
import {
  FinancialProfile,
  LOAN_TYPES,
  checkLoanEligibility,
  formatCurrency,
  formatPercent,
  getRateConfidenceBand,
} from "@/lib/calculator";
import {
  computeFinancialHealth,
  computeUnifiedQualification,
  creditTier,
  nextCreditTierTarget,
  STATUS_LABEL,
  StatusLevel,
} from "@/lib/financialHealth";

import { ResultsDisclaimer } from "@/components/common/ResultsDisclaimer";
import { SEO } from "@/components/seo/SEO";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { usePrivacy } from "@/contexts/PrivacyContext";

const SESSION_KEY = "throuly_buyers_session";

type BuyersSession = {
  selectedState: StateData;
  homePrice: number;
  hoaMonthly: number;
  financialProfile: FinancialProfile;
  loanTypeId: string;
};

function readSession(): BuyersSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as BuyersSession) : null;
  } catch {
    return null;
  }
}

const STATUS_META: Record<
  StatusLevel,
  { icon: typeof CheckCircle2; badgeClass: string; textClass: string; ring: string }
> = {
  strong: {
    icon: CheckCircle2,
    badgeClass: "bg-success/15 text-success border-success/30",
    textClass: "text-success",
    ring: "ring-success/30",
  },
  good: {
    icon: ShieldCheck,
    badgeClass: "bg-primary/10 text-primary border-primary/30",
    textClass: "text-primary",
    ring: "ring-primary/30",
  },
  attention: {
    icon: AlertTriangle,
    badgeClass: "bg-warning/15 text-warning border-warning/30",
    textClass: "text-warning",
    ring: "ring-warning/30",
  },
  risk: {
    icon: AlertCircle,
    badgeClass: "bg-destructive/10 text-destructive border-destructive/30",
    textClass: "text-destructive",
    ring: "ring-destructive/30",
  },
};

function StatusBadge({ status, className }: { status: StatusLevel; className?: string }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        meta.badgeClass,
        className,
      )}
    >
      <Icon aria-hidden="true" className="h-3 w-3" />
      {STATUS_LABEL[status]}
    </span>
  );
}

function InfoTip({ text }: { text: string }) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="More information"
            className="text-muted-foreground hover:text-foreground"
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Activity;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-3 flex items-start gap-2">
      <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 text-accent" />
      <div>
        <h2 className="font-serif text-xl font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function HomebuyingFinancialHealth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { guardSave, isPrivateMode } = usePrivacy();
  const { user } = useAuth();
  const session = useMemo(readSession, []);
  const [savedSnapshotInputs, setSavedSnapshotInputs] = useState<string | null>(null);
  const [savedRowId, setSavedRowId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<Date | null>(null);


  useEffect(() => {
    window.scrollTo(0, 0);
    if (!session) navigate("/buyers", { replace: true });
  }, [session, navigate]);

  // Editable assumptions (monthly-cost editors)
  const initialLoanType = useMemo(
    () => LOAN_TYPES.find((lt) => lt.id === session?.loanTypeId) || LOAN_TYPES[0],
    [session],
  );
  // Default to the same down payment the affordability calculator uses so the
  // Max here matches the Max shown on the results page (single source of truth).
  const [downPct, setDownPct] = useState<number>(initialLoanType.minDownPayment);
  const [rateOverride, setRateOverride] = useState<number | undefined>(undefined);
  const [hoaEdit, setHoaEdit] = useState<number>(session?.hoaMonthly ?? 0);

  // What-if simulator overrides
  const [sim, setSim] = useState<{
    income: number;
    debt: number;
    credit: number;
    savings: number;
    downPct: number;
    rate: number;
    hoa: number;
    // True once the Interest Rate slider has been touched directly — from
    // then on it stops auto-following the Credit Score slider.
    rateTouched: boolean;
  } | null>(null);

  const baseInputs = useMemo(() => {
    if (!session) return null;
    return {
      state: session.selectedState,
      profile: session.financialProfile,
      hoaMonthly: hoaEdit,
      loanTypeId: session.loanTypeId,
      targetHomePrice: session.homePrice,
      overrides: {
        downPaymentPercent: downPct,
        rateOverride,
      },
    };
  }, [session, hoaEdit, downPct, rateOverride]);

  const baseReport = useMemo(
    () => (baseInputs ? computeFinancialHealth(baseInputs) : null),
    [baseInputs],
  );

  const simReport = useMemo(() => {
    if (!session || !sim) return null;
    return computeFinancialHealth({
      state: session.selectedState,
      profile: session.financialProfile,
      hoaMonthly: sim.hoa,
      loanTypeId: session.loanTypeId,
      targetHomePrice: session.homePrice,
      overrides: {
        yearlyIncome: sim.income,
        monthlyDebt: sim.debt,
        creditScore: sim.credit,
        savings: sim.savings,
        downPaymentPercent: sim.downPct,
        rateOverride: sim.rate,
      },
    });
  }, [session, sim]);

  // Initialize sim once we know the base rate
  useEffect(() => {
    if (!session || sim || !baseReport) return;
    setSim({
      income: session.financialProfile.yearlyIncome,
      debt: session.financialProfile.monthlyDebt,
      credit: session.financialProfile.creditScore,
      savings: session.financialProfile.savings,
      downPct,
      rate: baseReport.monthlyAtComfortable.rateRange.mid,
      hoa: hoaEdit,
      rateTouched: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, baseReport]);

  if (!session || !baseReport) return null;

  const { selectedState, financialProfile } = session;
  const report = baseReport;
  const monthly = report.monthlyAtComfortable;
  const grossMonthly = financialProfile.yearlyIncome / 12;
  const loanType = report.loanType;

  const currentInputs = useMemo(() => {
    if (!session || !baseReport) return null;
    return {
      state: session.selectedState.name,
      stateAbbreviation: session.selectedState.abbreviation,
      loanTypeId: session.loanTypeId,
      hoaMonthly: hoaEdit,
      downPaymentPercent: downPct,
      rateOverride: rateOverride ?? null,
      yearlyIncome: session.financialProfile.yearlyIncome,
      monthlyDebt: session.financialProfile.monthlyDebt,
      creditScore: session.financialProfile.creditScore,
      savings: session.financialProfile.savings,
      employmentType: session.financialProfile.employmentType ?? "w2",
      propertyType: session.financialProfile.propertyType ?? null,
      isFirstTimeBuyer: session.financialProfile.isFirstTimeBuyer ?? null,
    };
  }, [session, baseReport, hoaEdit, downPct, rateOverride]);

  const currentInputsKey = useMemo(
    () => (currentInputs ? JSON.stringify(currentInputs) : null),
    [currentInputs],
  );

  const hasChangesSinceSave =
    !savedSnapshotInputs || savedSnapshotInputs !== currentInputsKey;

  // Load any previously saved financial health report for this user
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) return;
      const { data } = await supabase
        .from("saved_scenarios")
        .select("id, inputs")
        .eq("user_id", user.id)
        .eq("scenario_name", "Financial Health Report")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled && data) {
        setSavedRowId(data.id as string);
        if (data.inputs) setSavedSnapshotInputs(JSON.stringify(data.inputs));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const buildResultsPayload = () => {
    if (!baseReport) return null;
    const qual = computeUnifiedQualification(
      baseReport,
      session!.financialProfile,
      downPct,
    );
    return {
      overallScore: baseReport.overallScore,
      status: baseReport.status,
      statusLabel: baseReport.statusLabel,
      summarySentence: baseReport.summarySentence,
      comfortable: baseReport.comfortable,
      stretch: baseReport.stretch,
      maximum: baseReport.maximum,
      cash: baseReport.cash,
      factors: baseReport.factors,
      loanTypeId: baseReport.loanType.id,
      loanTypeName: baseReport.loanType.name,
      totalMonthlyPayment: baseReport.monthlyAtComfortable.totalMonthlyPayment,
      backEndDTI: baseReport.monthlyAtComfortable.backEndDTI,
      totalCashNeeded: baseReport.cash.cashToClose,
      // Unified qualification — dashboard/results read from this.
      qualifies: qual.qualifies,
      qualificationLabel: qual.label,
      qualificationStatus: qual.qualifies ? "strong" : "unlikely",
      qualificationReason: qual.reason,
      savedAt: new Date().toISOString(),
    };
  };

  // Upsert helper: update the existing FH row in place, or insert if none.
  // This is the single source of truth the dashboard reads from.
  const persistFinancialHealth = async (): Promise<boolean> => {
    if (!user || !currentInputs || !baseReport) return false;
    const resultsPayload = buildResultsPayload();
    if (savedRowId) {
      const { error } = await supabase
        .from("saved_scenarios")
        .update({
          inputs: currentInputs as any,
          results: resultsPayload as any,
        })
        .eq("id", savedRowId)
        .eq("user_id", user.id);
      if (error) return false;
    } else {
      const { data, error } = await supabase
        .from("saved_scenarios")
        .insert({
          user_id: user.id,
          scenario_name: "Financial Health Report",
          inputs: currentInputs as any,
          results: resultsPayload as any,
        })
        .select("id")
        .maybeSingle();
      if (error) return false;
      if (data?.id) setSavedRowId(data.id as string);
    }
    setSavedSnapshotInputs(currentInputsKey);
    setLastAutoSavedAt(new Date());
    return true;
  };

  // Auto-sync: whenever inputs change, upsert after a short debounce so the
  // dashboard and results page always see the latest numbers. Skipped while
  // Private Mode is on — nothing should be written to the account silently.
  useEffect(() => {
    if (!user || !currentInputsKey || !baseReport || isPrivateMode) return;
    if (savedSnapshotInputs === currentInputsKey) return;
    const t = window.setTimeout(() => {
      void persistFinancialHealth();
    }, 800);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentInputsKey, savedRowId, isPrivateMode]);

  const handleSaveAndViewResults = async () => {
    if (!guardSave("save your financial health report")) return;
    if (!currentInputs || !baseReport) return;
    const resultsPayload = buildResultsPayload();

    // Not signed in → skip save/auth and go straight to results.
    if (!user) {
      navigate("/homebuying-estimate/results");
      return;
    }

    // Signed in → upsert (skip if unchanged) then go to results.
    if (hasChangesSinceSave) {
      setIsSaving(true);
      const ok = await persistFinancialHealth();
      setIsSaving(false);
      if (!ok) {
        toast({
          title: "Couldn't save",
          description: "Please try again in a moment.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Report saved",
        description: "Opening your affordability results…",
      });
    }
    navigate("/homebuying-estimate/results");
  };


  const resetSim = () => {
    if (!session || !baseReport) return;
    setSim({
      income: financialProfile.yearlyIncome,
      debt: financialProfile.monthlyDebt,
      credit: financialProfile.creditScore,
      savings: financialProfile.savings,
      downPct,
      rate: baseReport.monthlyAtComfortable.rateRange.mid,
      hoa: hoaEdit,
      rateTouched: false,
    });
  };

  // Loan programs
  const programs = LOAN_TYPES.map((lt) => {
    const el = checkLoanEligibility(lt, financialProfile, Math.max(lt.minDownPayment, downPct), monthly.homePrice);
    let benefit = "";
    let tradeoff = "";
    switch (lt.id) {
      case "conventional":
        benefit = "Flexible for any occupancy; PMI drops off at 20% equity.";
        tradeoff = "Pricing is credit-sensitive; PMI required below 20% down.";
        break;
      case "fha":
        benefit = "Low down payment and lenient credit thresholds.";
        tradeoff = "Upfront and annual MIP for the life of the loan below 10% down.";
        break;
      case "va":
        benefit = "No down payment and no monthly mortgage insurance.";
        tradeoff = "Requires military service; funding fee applies.";
        break;
      case "usda":
        benefit = "No down payment for eligible rural areas.";
        tradeoff = "Location and income limits; guarantee fees apply.";
        break;
    }
    return { lt, el, benefit, tradeoff };
  });

  // Risks
  const FACTOR_TIPS: Record<string, string> = {
    dti: "Debt-to-income ratio: your total monthly debt payments (including the new mortgage) divided by your gross monthly income. Lenders typically want this at or below 43–50%.",
    credit: "Your credit score tier drives your interest rate. Big pricing improvements typically happen at 620, 660, 700, 720, and 740.",
    savings: "How much of the estimated cash needed at closing (down payment + closing costs + prepaids) your current savings cover.",
    monthly: "Your estimated total housing payment (PITI + HOA) as a share of your gross monthly income. ~28% or less is considered comfortable.",
    reserves: "‘Mo PITI’ = months of Principal, Interest, Taxes & Insurance payments you'd have left in savings after closing. 3+ months is generally recommended.",
    program: "Whether your inputs meet the standard eligibility rules for your selected loan program (credit, DTI, down payment, etc.).",
  };
  const positives: { label: string; value: string; tip: string }[] = [];
  const concerns: { label: string; value: string; tip: string }[] = [];
  report.factors.forEach((f) => {
    const item = { label: f.label, value: f.value, tip: FACTOR_TIPS[f.key] ?? f.explanation };
    if (f.status === "strong" || f.status === "good") positives.push(item);
    else concerns.push(item);
  });

  // Next steps — up to 3 based on inputs
  const steps: {
    title: string;
    why: string;
    effect: string;
    action: string;
    horizon: string;
  }[] = [];
  const nextTier = nextCreditTierTarget(financialProfile.creditScore);
  if (nextTier && financialProfile.creditScore < 740) {
    steps.push({
      title: `Improve credit score to ${nextTier}+`,
      why: `You're currently at ${financialProfile.creditScore} (${creditTier(financialProfile.creditScore)}).`,
      effect: "May unlock a lower rate tier and reduce your estimated monthly payment.",
      action: "Pay down revolving balances below 30% utilization and avoid new credit inquiries.",
      horizon: "1–3 months",
    });
  }
  if (financialProfile.monthlyDebt > 200 && monthly.backEndDTI > 28) {
    steps.push({
      title: "Reduce monthly debt",
      why: `You report ${formatCurrency(financialProfile.monthlyDebt)}/mo in debts, raising your DTI to ${formatPercent(monthly.backEndDTI)}.`,
      effect: "Every $100/mo of debt eliminated may add roughly $18–22k to your buying power.",
      action: "Prioritize the highest-payment revolving account first.",
      horizon: "1–6 months",
    });
  }
  if (report.cash.remainingAfterClosing < report.cash.recommendedReserve) {
    const gap = Math.max(0, report.cash.recommendedReserve - report.cash.remainingAfterClosing);
    steps.push({
      title: "Grow savings before closing",
      why: `Estimated cash remaining after closing (${formatCurrency(Math.max(0, report.cash.remainingAfterClosing))}) is below the recommended 3-month reserve.`,
      effect: `Adding about ${formatCurrency(gap)} would put you in a stronger position for unexpected costs.`,
      action: "Automate weekly transfers to a high-yield savings account earmarked for closing.",
      horizon: "3–12 months",
    });
  }
  if (steps.length === 0) {
    steps.push({
      title: "Lock a competitive rate when you're ready",
      why: "Your DTI, credit, and savings all support your qualifying number.",
      effect: "Small rate differences can meaningfully change your monthly payment.",
      action: "Shop 2–3 lenders when you're within 60 days of a target property.",
      horizon: "When ready to shop",
    });
  }

  const activeReport = simReport ?? report;

  // Score ring geometry
  const RING_R = 110;
  const RING_C = 2 * Math.PI * RING_R;
  const ringPct = Math.max(0, Math.min(1, report.overallScore / 100));
  const ringOffset = RING_C * (1 - ringPct);

  const eligiblePrograms = programs.filter((p) => p.el.eligible);
  const ineligiblePrograms = programs.filter((p) => !p.el.eligible);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Your Home Buying Financial Health | Throuly"
        description="A personalized financial readiness report for home buying: score, comfortable budget, monthly cost, and actions to improve your buying power."
        path="/homebuying-estimate/financial-health"
      />
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Breadcrumb / step */}
          <div className="mb-6 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/buyers?edit=1")}
              className="-ml-2"
            >
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Step 1 of 2 · Financial health
            </p>
          </div>

          {/* 1. HERO — editorial headline + score ring */}
          <header className="mb-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 border-b border-border/60 pb-10 animate-fade-in">
            <div className="max-w-lg">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                Your Personal Report
              </p>
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight text-foreground">
                Your Home Buying <span className="italic text-primary">Financial Health</span>
              </h1>
              <p className="mt-4 text-base sm:text-lg leading-relaxed text-muted-foreground">
                {report.summarySentence}
              </p>
            </div>
            <div className="relative flex h-48 w-48 sm:h-60 sm:w-60 shrink-0 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 256 256">
                <circle cx="128" cy="128" r={RING_R} fill="none" strokeWidth="12" className="stroke-primary/10" />
                <circle
                  cx="128"
                  cy="128"
                  r={RING_R}
                  fill="none"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={RING_C}
                  strokeDashoffset={ringOffset}
                  className={cn("transition-[stroke-dashoffset] duration-1000 ease-out", STATUS_META[report.status].textClass)}
                  style={{ stroke: "currentColor" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-serif text-5xl sm:text-6xl font-bold tabular-nums">{report.overallScore}</span>
                <span className={cn("mt-1 text-[10px] font-bold uppercase tracking-[0.2em]", STATUS_META[report.status].textClass)}>
                  {report.statusLabel}
                </span>
                <span className="text-[10px] text-muted-foreground">out of 100</span>
              </div>
            </div>
          </header>

          {/* 2. 6-Factor scorecard grid */}
          <section aria-labelledby="scorecards" className="mb-10">
            <h2 id="scorecards" className="mb-4 font-serif text-2xl font-semibold">
              At a glance
            </h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              {report.factors.map((f) => {
                const meta = STATUS_META[f.status];
                const tip = (({
                  dti: "Debt-to-income ratio: monthly debt payments ÷ gross monthly income.",
                  credit: "Your FICO score tier. Drives your interest rate pricing.",
                  savings: "How much of the cash needed at closing your savings cover.",
                  monthly: "Housing payment (PITI + HOA) as % of gross monthly income.",
                  reserves: "Months of PITI (Principal, Interest, Taxes, Insurance) left in savings after closing.",
                  program: "Whether you meet your selected loan program's standard eligibility rules.",
                } as Record<string, string>)[f.key]) ?? f.explanation;
                return (
                  <div
                    key={f.key}
                    className="group flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-md lg:aspect-square lg:justify-between lg:gap-0"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
                        {f.label}
                      </span>
                      <InfoTip text={tip} />
                    </div>
                    <span className="text-xs font-medium tabular-nums text-foreground/80">
                      {f.value}
                    </span>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          f.status === "strong" && "bg-success",
                          f.status === "good" && "bg-primary",
                          f.status === "attention" && "bg-warning",
                          f.status === "risk" && "bg-destructive",
                        )}
                        style={{ width: `${Math.max(6, f.score)}%` }}
                      />
                    </div>
                    <span className={cn("font-serif text-lg font-semibold leading-tight", meta.textClass)}>
                      {STATUS_LABEL[f.status]}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 3. Core metric deep dives — DTI / Credit / Savings */}
          <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* DTI */}
            <Card className="p-6">
              <div className="mb-2 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <h3 className="font-serif text-xl font-semibold">DTI Ratio</h3>
              </div>
              <p className="mb-5 text-sm text-muted-foreground">
                Your monthly obligations vs income.
              </p>
              {/* Mini bar visualization */}
              <div className="mb-4 flex h-12 items-end justify-between gap-1">
                {[45, 60, 80, 100].map((h, i) => {
                  const isActive = i === Math.min(3, Math.floor(monthly.backEndDTI / 12));
                  return (
                    <div
                      key={i}
                      className={cn(
                        "w-full rounded-sm transition-all",
                        isActive ? "bg-primary" : "bg-success/30",
                      )}
                      style={{ height: `${h}%` }}
                    />
                  );
                })}
              </div>
              <div className="flex items-baseline gap-2">
                <span className={cn("font-serif text-3xl font-bold tabular-nums", STATUS_META[report.factors[1].status].textClass)}>
                  {formatPercent(monthly.backEndDTI)}
                </span>
                <span className="text-xs text-muted-foreground">of ≤ {loanType.maxDTI}%</span>
              </div>
            </Card>

            {/* Credit */}
            <Card className="p-6">
              <div className="mb-2 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <h3 className="font-serif text-xl font-semibold">Credit Score</h3>
              </div>
              <p className="mb-5 text-sm text-muted-foreground">
                Affects your rate and loan pricing.
              </p>
              <div className="mb-3 flex items-center gap-3">
                <span className="font-serif text-4xl font-bold tabular-nums">{financialProfile.creditScore}</span>
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                  {creditTier(financialProfile.creditScore)}
                </Badge>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-700"
                  style={{ width: `${Math.min(100, ((financialProfile.creditScore - 500) / 350) * 100)}%` }}
                />
              </div>
              {(() => {
                const target = nextCreditTierTarget(financialProfile.creditScore);
                if (!target || financialProfile.creditScore >= 740) return null;
                return (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Reaching <strong className="text-foreground">{target}+</strong> may unlock better pricing.
                  </p>
                );
              })()}
            </Card>

            {/* Savings */}
            <Card className="p-6">
              <div className="mb-2 flex items-center gap-2">
                <PiggyBank className="h-4 w-4 text-primary" />
                <h3 className="font-serif text-xl font-semibold">Savings</h3>
              </div>
              <p className="mb-5 text-sm text-muted-foreground">
                Liquid assets for down payment and closing.
              </p>
              <div className="mb-4 font-serif text-3xl font-bold tabular-nums">
                {formatCurrency(report.cash.savings)}
              </div>
              <div className="flex gap-1.5">
                <div className="h-2 flex-1 rounded-full bg-primary/25" />
                <div
                  className={cn(
                    "h-2 rounded-full",
                    report.cash.remainingAfterClosing >= report.cash.recommendedReserve
                      ? "bg-success w-16"
                      : report.cash.remainingAfterClosing > 0
                        ? "bg-warning w-10"
                        : "bg-destructive w-6",
                  )}
                />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                <span className={cn("font-medium", report.cash.remainingAfterClosing < 0 && "text-destructive")}>
                  {formatCurrency(Math.max(0, report.cash.remainingAfterClosing))}
                </span>{" "}
                remaining after closing
              </p>
            </Card>
          </div>

          {/* Savings & cash detail grid (kept — user needs full data) */}
          <Card className="mb-10 p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <SectionHeader
                icon={PiggyBank}
                title="Cash readiness at closing"
                subtitle={`Based on closing on a home at ${formatCurrency(report.comfortable.price)}.`}
              />
              <StatusBadge status={report.cash.status} className="shrink-0 whitespace-nowrap" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <MiniStat label="Total savings" value={report.cash.savings} />
              <MiniStat label="Down payment" value={report.cash.downPayment} />
              <MiniStat label="Closing costs" value={report.cash.closingCosts} />
              <MiniStat label="Prepaids (est.)" value={report.cash.prepaids} tip="Estimated ~1% of home price for prepaid taxes, insurance, and interest at closing." />
              <MiniStat label="Recommended reserve" value={report.cash.recommendedReserve} tip="Roughly 3 months of estimated PITI, kept aside for unexpected expenses." />
              <MiniStat
                label="Cash remaining after closing"
                value={report.cash.remainingAfterClosing}
                emphasize
              />
            </div>
          </Card>

          {/* 4. Buying Power Tiers (with Recommended ribbon on comfortable) */}
          <section className="mb-10">
            <h2 className="mb-6 font-serif text-3xl font-bold">Your buying power tiers</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Comfortable — RECOMMENDED */}
              <div className="relative overflow-hidden rounded-3xl border-2 border-primary bg-primary/5 p-6 ring-4 sm:ring-8 ring-primary/5">
                <div className="absolute right-0 top-0 rounded-bl-xl bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
                  Recommended
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  Comfortable
                </span>
                <div className="my-2 font-serif text-3xl font-bold tabular-nums">
                  {report.comfortable.price > 0 ? formatCurrency(report.comfortable.price) : "—"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {report.comfortable.price > 0
                    ? `~${formatCurrency(report.comfortable.monthly)}/mo estimated housing`
                    : "Awaiting your income"}
                </p>
                <p className="mt-3 text-sm text-foreground/80 leading-relaxed">
                  {report.comfortable.description}
                </p>
              </div>
              {/* Stretch */}
              <div className="rounded-3xl border-2 border-warning/30 bg-warning/5 p-6">
                <span className="text-[10px] font-bold uppercase tracking-widest text-warning">
                  Stretch
                </span>
                <div className="my-2 font-serif text-3xl font-bold tabular-nums">
                  {report.stretch.price > 0 ? formatCurrency(report.stretch.price) : "—"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {report.stretch.price > 0
                    ? `~${formatCurrency(report.stretch.monthly)}/mo estimated housing`
                    : "Awaiting your income"}
                </p>
                <p className="mt-3 text-sm text-foreground/80 leading-relaxed">
                  {report.stretch.description}
                </p>
              </div>
              {/* Max */}
              <div className="rounded-3xl border-2 border-destructive/20 bg-destructive/5 p-6">
                <span className="text-[10px] font-bold uppercase tracking-widest text-destructive">
                  Maximum cap
                </span>
                <div className="my-2 font-serif text-3xl font-bold tabular-nums">
                  {report.maximum.price > 0 ? formatCurrency(report.maximum.price) : "—"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {report.maximum.price > 0
                    ? `~${formatCurrency(report.maximum.monthly)}/mo estimated housing`
                    : "Awaiting your income"}
                </p>
                <p className="mt-3 text-sm text-foreground/80 leading-relaxed">
                  {report.maximum.description}
                </p>
              </div>
            </div>
          </section>

          {/* 5. Monthly Estimate (v3-style dark hero) + editable assumptions */}
          <section className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2 rounded-[32px] bg-card text-foreground border border-border p-6 sm:p-8 md:p-10 shadow-2xl">
            <div>
              <p className="mb-6 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
                Monthly Estimate
              </p>
              <div className="mb-1 font-serif text-4xl sm:text-5xl md:text-6xl font-bold tabular-nums break-words">
                {formatCurrency(
                  monthly.totalMonthlyPayment + Math.round((monthly.homePrice * 0.01) / 12),
                )}
                <span className="ml-2 font-serif text-lg sm:text-xl italic font-semibold text-foreground/70">/mo</span>
              </div>
              <p className="mb-6 text-sm font-semibold text-foreground/70">
                At your comfortable budget of {formatCurrency(report.comfortable.price)}
              </p>
              <div className="space-y-3 border-t border-border pt-5">
                <DarkCostRow label="Principal & interest" value={formatCurrency(monthly.monthlyMortgage)} />
                <DarkCostRow label="Property taxes" value={formatCurrency(monthly.monthlyPropertyTax)} />
                <DarkCostRow label="Homeowners insurance" value={formatCurrency(monthly.monthlyInsurance)} />
                {monthly.monthlyPMI > 0 && (
                  <DarkCostRow label="Mortgage insurance (PMI/MIP)" value={formatCurrency(monthly.monthlyPMI)} />
                )}
                {hoaEdit > 0 && <DarkCostRow label="HOA fees" value={formatCurrency(hoaEdit)} />}
                <DarkCostRow
                  label="Maintenance reserve"
                  value={formatCurrency(Math.round((monthly.homePrice * 0.01) / 12))}
                />
              </div>
            </div>
            <div className="rounded-2xl bg-muted/50 p-5 sm:p-6 space-y-6 border border-border">
              <h4 className="text-sm font-bold">Editable assumptions</h4>
              <div>
                <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest font-semibold text-foreground/70">
                  <span>Down payment</span>
                  <span className="tabular-nums text-foreground">{downPct}%</span>
                </div>
                <Slider
                  value={[downPct]}
                  onValueChange={(v) => setDownPct(v[0])}
                  min={Math.max(0, loanType.minDownPayment)}
                  max={50}
                  step={0.5}
                />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest font-semibold text-foreground/70">
                  <span>Interest rate</span>
                  <span className="tabular-nums text-foreground">
                    {formatPercent(rateOverride ?? monthly.rateRange.mid, 3)}
                  </span>
                </div>
                <Slider
                  value={[rateOverride ?? monthly.rateRange.mid]}
                  onValueChange={(v) => setRateOverride(v[0])}
                  min={3}
                  max={10}
                  step={0.125}
                />
              </div>
              <div>
                <Label className="mb-1 block text-[10px] font-bold uppercase tracking-widest font-semibold text-foreground/70">
                  HOA (monthly)
                </Label>
                <MoneyInput
                  value={hoaEdit || ""}
                  onChange={(raw) => setHoaEdit(Number(raw) || 0)}
                  placeholder="0"
                  className="bg-muted border-border text-foreground placeholder:font-semibold text-foreground/60"
                  aria-label="Monthly HOA"
                />
              </div>
              <p className="text-[11px] font-semibold text-foreground/70 leading-relaxed">
                Rate range: {formatPercent(monthly.rateRange.low, 3)}–
                {formatPercent(monthly.rateRange.high, 3)} · {loanType.name} · {selectedState.name}
              </p>
            </div>
          </section>

          {/* 6. DTI detail (small strip) */}
          <Card className="mb-10 p-5 sm:p-6">
            <SectionHeader
              icon={Activity}
              title="Debt-to-income breakdown"
              subtitle="How your income and existing debt shape your qualifying number."
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-secondary/60 p-3">
                <p className="text-xs text-muted-foreground">Monthly gross income</p>
                <p className="font-semibold tabular-nums">{formatCurrency(grossMonthly)}</p>
              </div>
              <div className="rounded-lg bg-secondary/60 p-3">
                <p className="text-xs text-muted-foreground">Monthly debt payments</p>
                <p className="font-semibold tabular-nums">{formatCurrency(financialProfile.monthlyDebt)}</p>
              </div>
              <div className="rounded-lg bg-secondary/60 p-3">
                <p className="text-xs text-muted-foreground">Program target</p>
                <p className="font-semibold tabular-nums">≤ {loanType.maxDTI}%</p>
              </div>
              <div className="rounded-lg bg-secondary/60 p-3">
                <p className="text-xs text-muted-foreground">Expanded cap</p>
                <p className="font-semibold tabular-nums">≤ {loanType.expandedBackEndDTI}%</p>
              </div>
            </div>
          </Card>

          {/* 7. Program Fit + Risk Analysis (v3-style two-column) */}
          <section className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Program Fit — v3 list-style */}
            <div className="rounded-3xl border border-border/60 bg-card p-6 md:p-8">
              <h3 className="mb-6 font-serif text-2xl italic">Program fit</h3>
              <ul className="space-y-1.5">
                {eligiblePrograms.map(({ lt, benefit }) => (
                  <li key={lt.id} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span className="flex-1 min-w-0">
                      <span className="font-medium">{lt.name}</span>
                      <span className="block text-xs text-muted-foreground truncate">{benefit}</span>
                    </span>
                    <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-success">Match</span>
                  </li>
                ))}
                {ineligiblePrograms.map(({ lt, el }) => (
                  <li key={lt.id} className="flex items-start gap-2 text-sm opacity-50">
                    <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 min-w-0">
                      <span className="font-medium">{lt.name}</span>
                      <span className="block text-xs text-muted-foreground truncate">{el.reason}</span>
                    </span>
                    <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Ineligible
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[11px] italic text-muted-foreground">
                Lenders confirm final eligibility.
              </p>
            </div>

            {/* Risk Analysis — v3 style */}
            <div className={cn(
              "rounded-3xl border p-6 md:p-8 bg-card",
              concerns.length > 0 ? "border-destructive/20" : "border-success/20",
            )}>
              <h3 className="mb-6 font-serif text-2xl italic">Risk analysis</h3>
              {positives.length > 0 && (
                <div className="mb-5">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Working in your favor
                  </p>
                  <ul className="space-y-1.5">
                    {positives.map((p) => (
                      <li key={p.label} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        <span className="flex-1">
                          {p.label}: <span className="font-medium">{p.value}</span>
                        </span>
                        <InfoTip text={p.tip} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {concerns.length > 0 ? (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-destructive">
                    Needs attention
                  </p>
                  <ul className="space-y-1.5">
                    {concerns.map((c) => (
                      <li key={c.label} className="flex items-start gap-2 text-sm">
                        <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                        <span className="flex-1">
                          {c.label}: <span className="font-medium">{c.value}</span>
                        </span>
                        <InfoTip text={c.tip} />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No concerns identified in your inputs.</p>
              )}
            </div>
          </section>

          {/* 8. Your Action Plan — v3 numbered with hover animation */}
          <section className="mb-10 rounded-[32px] bg-primary p-6 sm:p-8 md:p-12 text-primary-foreground">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] opacity-80">
              Your action plan
            </p>
            <h2 className="mb-8 font-serif text-3xl md:text-4xl italic">
              Next best moves.
            </h2>
            <div className="space-y-6">
              {steps.slice(0, 3).map((s, i) => (
                <div key={s.title} className="group flex gap-4 sm:gap-6">
                  <div className="font-serif text-4xl font-bold tabular-nums opacity-25 transition-opacity duration-300 group-hover:opacity-100">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="flex-1 border-b border-primary-foreground/15 pb-6 last:border-b-0">
                    <h4 className="mb-1 text-lg font-bold">{s.title}</h4>
                    <p className="mb-2 text-sm opacity-80">{s.why}</p>
                    <p className="text-sm opacity-70">
                      <span className="font-semibold opacity-100">Do this: </span>{s.action}
                    </p>
                    <p className="mt-2 text-[11px] italic opacity-60">Time horizon · {s.horizon}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 9. What-if Simulator — v3-style dark hero with projected panel */}
          {sim && (
            <section className="mb-10 relative overflow-hidden rounded-[32px] bg-primary p-6 sm:p-8 md:p-12 text-primary-foreground">
              <div className="pointer-events-none absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-primary-foreground/10 blur-3xl" />
              <div className="relative">
                <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                  <div>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] opacity-80">
                      The Simulator
                    </p>
                    <h2 className="font-serif text-3xl md:text-4xl italic">
                      The "What-if" simulator
                    </h2>
                    <p className="mt-2 max-w-md text-sm font-semibold opacity-80">
                      Move the sliders — every number updates instantly.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetSim}
                    className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  >
                    <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2">
                  <div className="space-y-6">
                    <SimSlider
                      label="Annual income"
                      value={sim.income}
                      onChange={(v) => setSim({ ...sim, income: v })}
                      min={20000}
                      max={500000}
                      step={1000}
                      format={(v) => formatCurrency(v)}
                    />
                    <SimSlider
                      label="Monthly debt payments"
                      value={sim.debt}
                      onChange={(v) => setSim({ ...sim, debt: v })}
                      min={0}
                      max={5000}
                      step={25}
                      format={(v) => formatCurrency(v)}
                    />
                    <SimSlider
                      label="Credit score"
                      value={sim.credit}
                      onChange={(v) => {
                        if (sim.rateTouched) {
                          setSim({ ...sim, credit: v });
                          return;
                        }
                        // Auto-follow the credit-adjusted rate until the user
                        // manually overrides the Interest Rate slider below.
                        const autoRate = getRateConfidenceBand(
                          selectedState.avgMortgageRate,
                          loanType,
                          v,
                        ).mid;
                        setSim({ ...sim, credit: v, rate: autoRate });
                      }}
                      min={500}
                      max={850}
                      step={1}
                      format={(v) => `${v}`}
                    />
                    <SimSlider
                      label="Savings"
                      value={sim.savings}
                      onChange={(v) => setSim({ ...sim, savings: v })}
                      min={0}
                      max={500000}
                      step={1000}
                      format={(v) => formatCurrency(v)}
                    />
                    <SimSlider
                      label="Down payment"
                      value={sim.downPct}
                      onChange={(v) => setSim({ ...sim, downPct: v })}
                      min={Math.max(0, loanType.minDownPayment)}
                      max={50}
                      step={0.5}
                      format={(v) => `${v}%`}
                    />
                    <SimSlider
                      label="Interest rate"
                      value={sim.rate}
                      onChange={(v) => setSim({ ...sim, rate: v, rateTouched: true })}
                      min={3}
                      max={10}
                      step={0.125}
                      format={(v) => formatPercent(v, 3)}
                    />
                    <SimSlider
                      label="HOA (monthly)"
                      value={sim.hoa}
                      onChange={(v) => setSim({ ...sim, hoa: v })}
                      min={0}
                      max={2000}
                      step={25}
                      format={(v) => formatCurrency(v)}
                    />
                  </div>

                  {/* Projected panel — inset translucent card on the ink section. */}
                  <div className="flex flex-col rounded-2xl border border-primary-foreground/15 bg-primary-foreground/[0.07] p-6 sm:p-8">
                    <p className="mb-6 text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">
                      Projected outcome
                    </p>
                    <div className="mb-8">
                      <div className="mb-1 text-[10px] font-bold uppercase tracking-widest opacity-80">
                        Comfortable budget
                      </div>
                      <div className="font-serif text-4xl sm:text-5xl font-bold tabular-nums break-words">
                        {formatCurrency(activeReport.comfortable.price)}
                      </div>
                      {activeReport.comfortable.price !== report.comfortable.price && (
                        <div className="mt-2 text-xs font-semibold opacity-70">
                          was {formatCurrency(report.comfortable.price)}
                        </div>
                      )}
                    </div>
                    <div className="space-y-3 border-t border-primary-foreground/15 pt-5">

                      <SimResult
                        label="Health score"
                        value={`${activeReport.overallScore} / 100`}
                        baseValue={`${report.overallScore}`}
                        status={activeReport.status}
                      />
                      <SimResult
                        label="Stretch budget"
                        value={formatCurrency(activeReport.stretch.price)}
                        baseValue={formatCurrency(report.stretch.price)}
                      />
                      <SimResult
                        label="Max est. approval"
                        value={formatCurrency(activeReport.maximum.price)}
                        baseValue={formatCurrency(report.maximum.price)}
                      />
                      <SimResult
                        label="Monthly housing cost"
                        value={formatCurrency(activeReport.comfortable.monthly)}
                        baseValue={formatCurrency(report.comfortable.monthly)}
                      />
                      <SimResult
                        label="Cash after closing"
                        value={formatCurrency(activeReport.cash.remainingAfterClosing)}
                        baseValue={formatCurrency(report.cash.remainingAfterClosing)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* How we calculated */}
          <Collapsible className="mb-8">
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="inline-flex items-center gap-2">
                  <Info className="h-4 w-4" /> How we calculated this
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="mt-2 p-5 text-sm text-muted-foreground leading-relaxed">
                <p className="mb-2">
                  The financial health score (0–100) is a weighted blend of six factors:
                </p>
                <ul className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <li>· Debt-to-income (25%)</li>
                  <li>· Credit health (20%)</li>
                  <li>· Savings readiness (20%)</li>
                  <li>· Monthly affordability (15%)</li>
                  <li>· Cash reserves after closing (10%)</li>
                  <li>· Income stability (10%)</li>
                </ul>
                <p className="mb-2">
                  Budgets: <strong className="text-foreground">Comfortable</strong> is the highest
                  home price whose total estimated monthly housing stays within ~28% of gross
                  income.{" "}
                  <strong className="text-foreground">Stretch</strong> uses the {loanType.name}{" "}
                  program's standard back-end DTI cap ({loanType.maxDTI}%).{" "}
                  <strong className="text-foreground">Max estimated approval</strong> uses expanded
                  DTI limits ({loanType.expandedBackEndDTI}%).
                </p>
                <p>
                  This is an educational estimate, not a credit report, appraisal, or lending
                  decision. Actual terms may vary by lender.
                </p>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* 12. CTAs */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <Button
              variant="accent"
              size="lg"
              onClick={handleSaveAndViewResults}
              disabled={isSaving}
              className="sm:flex-1 py-6 text-sm sm:text-base whitespace-normal text-center leading-snug h-auto min-h-[3.5rem]"
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
              ) : user ? (
                <Save className="mr-2 h-4 w-4 shrink-0" />
              ) : null}
              <span className="hidden sm:inline">
                {user ? "Save and view my financial results" : "View my financial results"}
              </span>
              <span className="sm:hidden">{user ? "Save & view results" : "View results"}</span>
              <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
            </Button>
            {user && savedSnapshotInputs && !hasChangesSinceSave && (
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate("/dashboard/client#estimates")}
              >
                <CheckCircle2 className="mr-1 h-4 w-4" /> Saved · View on dashboard
              </Button>
            )}
          </div>
          <div className="mb-8 flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const params = new URLSearchParams({
                  state: selectedState.name,
                  homePrice: String(monthly.homePrice),
                  income: String(financialProfile.yearlyIncome),
                  firstTime: String(financialProfile.isFirstTimeBuyer ?? true),
                });
                navigate(`/buyers/programs?${params.toString()}`);
              }}
            >
              Review loan programs
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/buyers?edit=1")}>
              Update my financial info
            </Button>
          </div>

          <ResultsDisclaimer variant="footer" />
        </div>
      </main>
      <Footer />
    </div>
  );
}

function DarkCostRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="font-semibold text-foreground/80">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tip,
  emphasize,
}: {
  label: string;
  value: number;
  tip?: string;
  emphasize?: boolean;
}) {
  return (
    <div className={cn("rounded-lg p-3", emphasize ? "border border-primary/30 bg-primary/5" : "bg-secondary/60")}>
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        {label}
        {tip && <InfoTip text={tip} />}
      </p>
      <p
        className={cn(
          "font-semibold tabular-nums",
          emphasize && "font-serif text-lg text-primary",
          value < 0 && "text-destructive",
        )}
      >
        {formatCurrency(value)}
      </p>
    </div>
  );
}

function BudgetTierCard({
  label,
  price,
  monthly,
  description,
  emphasis,
  muted,
}: {
  label: string;
  price: number;
  monthly: number;
  description: string;
  emphasis?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        emphasis
          ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
          : muted
            ? "border-dashed border-border bg-transparent"
            : "border-border bg-secondary/40",
      )}
    >
      <p className={cn("text-xs font-medium uppercase tracking-wide", emphasis ? "text-primary" : "text-muted-foreground")}>
        {label}
      </p>
      <p
        className={cn(
          "font-serif font-bold tabular-nums",
          emphasis ? "text-3xl text-primary" : muted ? "text-xl text-muted-foreground" : "text-2xl",
        )}
      >
        {formatCurrency(price)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        ~{formatCurrency(monthly)}/mo estimated housing
      </p>
      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function CostRow({ label, value, tip }: { label: string; value: number; tip?: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-1 text-muted-foreground">
        {label}
        {tip && <InfoTip text={tip} />}
      </span>
      <span className="tabular-nums">{formatCurrency(value)}</span>
    </div>
  );
}

function SimSlider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <Label className="font-bold">{label}</Label>
        <span className="tabular-nums font-bold opacity-90">{format(value)}</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
        min={min}
        max={max}
        step={step}
        className="[&>span:first-child]:bg-primary-foreground/20 [&>span:first-child>span]:bg-primary-foreground [&_[role=slider]]:border-primary-foreground [&_[role=slider]]:bg-primary"
      />
    </div>
  );
}


function SimResult({
  label,
  value,
  baseValue,
  status,
}: {
  label: string;
  value: string;
  baseValue: string;
  status?: StatusLevel;
}) {
  const changed = value !== baseValue;
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm font-semibold opacity-80">{label}</span>
      <div className="text-right">
        <p
          className={cn(
            "font-serif text-base font-bold tabular-nums",
            // On the ink section, `text-primary` (ink) would be invisible.
            status && STATUS_META[status].textClass.replace("text-primary", "text-primary-foreground"),
          )}
        >

          {value}
        </p>
        {changed && (
          <p className="text-[10px] font-semibold uppercase tracking-wide opacity-60">
            was {baseValue}
          </p>
        )}
      </div>
    </div>

  );
}
