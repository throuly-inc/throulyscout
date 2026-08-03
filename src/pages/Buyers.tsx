import { useState, useCallback, useEffect, useLayoutEffect, useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GenericCalculator } from "@/components/buyers/GenericCalculator";
import { GenericResults } from "@/components/buyers/GenericResults";
import { PreliminaryResults } from "@/components/buyers/PreliminaryResults";
import { StateData, statesData } from "@/lib/states";
import { FinancialProfile, PropertyType, LOAN_TYPES } from "@/lib/calculator";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { CalculationLimitBanner } from "@/components/premium/CalculationLimitBanner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SEO } from "@/components/seo/SEO";
import { usePrivacy } from "@/contexts/PrivacyContext";

type Step = "location" | "preliminary" | "full-calculator" | "results";

const DEFAULT_PROFILE: FinancialProfile = {
  yearlyIncome: 100000,
  monthlyDebt: 500,
  savings: 50000,
  creditScore: 720,
  employmentType: "w2",
  isFirstTimeBuyer: true,
};

const FREE_CALC_LIMIT = 5;

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

const Buyers = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { canAccess } = useSubscription();
  const hasUnlimited = canAccess("unlimited_calculations");
  const { guardSave } = usePrivacy();
  const [searchParams] = useSearchParams();

  // Prefill from URL (e.g. Smart Buyer Strategies "Model this scenario" buttons)
  const prefill = useMemo(() => {
    const propertyTypeParam = searchParams.get("propertyType") as PropertyType | null;
    const validPropertyTypes: PropertyType[] = ["single-family", "condo-coop", "multi-family"];
    const propertyType =
      propertyTypeParam && validPropertyTypes.includes(propertyTypeParam) ? propertyTypeParam : undefined;
    const loanTypeParam = searchParams.get("loanType");
    const loanTypeId = LOAN_TYPES.find((l) => l.id === loanTypeParam)?.id;
    const priceNum = Number(searchParams.get("price"));
    const homePrice = Number.isFinite(priceNum) && priceNum > 0 ? priceNum : undefined;
    const stateParam = searchParams.get("state");
    const state = stateParam ? statesData.find((s) => s.abbreviation === stateParam || s.name === stateParam) : undefined;
    const strategy = searchParams.get("strategy");
    return { propertyType, loanTypeId, homePrice, state, strategy };
  }, [searchParams]);

  const [restoredSession] = useState<BuyersSession | null>(() => {
    // If a strategy prefill is in the URL, ignore any restored session so the prefill wins.
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("strategy")) {
      return null;
    }
    // If a saved scenario is being reopened, ignore any restored session.
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("scenario")) {
      return null;
    }
    return readSession();
  });

  // "?edit=1" means the user hit Back from a results/financial-health page to
  // revisit their inputs — go straight to the full calculator step instead of
  // bouncing forward to results again.
  const editIntent =
    typeof window !== "undefined" && !!new URLSearchParams(window.location.search).get("edit");

  const [step, setStep] = useState<Step>(() =>
    editIntent && restoredSession ? "full-calculator" : "location",
  );
  const [loadingScenario, setLoadingScenario] = useState<boolean>(
    typeof window !== "undefined" && !!new URLSearchParams(window.location.search).get("scenario"),
  );

  // Reopen a saved scenario from the dashboard: hydrate session + jump to results.
  useEffect(() => {
    const scenarioId = searchParams.get("scenario");
    if (!scenarioId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("saved_scenarios")
          .select("id, scenario_name, inputs")
          .eq("id", scenarioId)
          .maybeSingle();
        if (cancelled) return;
        if (error || !data) {
          toast({
            title: "Estimate not found",
            description: "That saved estimate could not be loaded.",
            variant: "destructive",
          });
          setLoadingScenario(false);
          return;
        }
        const inputs: any = data.inputs || {};
        const state =
          statesData.find(
            (s) => s.abbreviation === inputs.stateAbbreviation || s.name === inputs.state || s.name === inputs.stateName,
          ) || null;
        if (!state) {
          toast({ title: "Estimate could not be reopened", variant: "destructive" });
          setLoadingScenario(false);
          return;
        }
        const profile: FinancialProfile = {
          yearlyIncome: inputs.yearlyIncome ?? DEFAULT_PROFILE.yearlyIncome,
          monthlyDebt: inputs.monthlyDebt ?? DEFAULT_PROFILE.monthlyDebt,
          savings: inputs.savings ?? DEFAULT_PROFILE.savings,
          creditScore: inputs.creditScore ?? DEFAULT_PROFILE.creditScore,
          employmentType: inputs.employmentType ?? DEFAULT_PROFILE.employmentType,
          isFirstTimeBuyer: inputs.isFirstTimeBuyer ?? DEFAULT_PROFILE.isFirstTimeBuyer,
          propertyType: inputs.propertyType,
        };
        const session: BuyersSession = {
          selectedState: state,
          homePrice: inputs.homePrice ?? state.medianHomePrice ?? 400000,
          hoaMonthly: inputs.hoaMonthly ?? 0,
          financialProfile: profile,
          loanTypeId: inputs.loanTypeId ?? "conventional",
        };
        try {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
          sessionStorage.setItem(
            "throuly_editing_scenario",
            JSON.stringify({ id: data.id, name: data.scenario_name }),
          );
        } catch {
          // ignore
        }
        navigate("/homebuying-estimate/results", { replace: true });
      } catch (err) {
        console.error("Failed to reopen scenario", err);
        setLoadingScenario(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loadingScenario || (editIntent && restoredSession)) return;
    if (restoredSession) {
      // Clear any stale editing marker when resuming a plain session
      try {
        sessionStorage.removeItem("throuly_editing_scenario");
      } catch {
        // ignore
      }
      navigate("/homebuying-estimate/financial-health", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [selectedState, setSelectedState] = useState<StateData | null>(
    prefill.state ?? restoredSession?.selectedState ?? null,
  );
  const [homePrice, setHomePrice] = useState(
    prefill.homePrice ?? restoredSession?.homePrice ?? 400000,
  );
  const [hoaMonthly, setHoaMonthly] = useState(restoredSession?.hoaMonthly ?? 0);
  const [financialProfile, setFinancialProfile] = useState<FinancialProfile>(() => {
    const base = restoredSession?.financialProfile ?? DEFAULT_PROFILE;
    return prefill.propertyType ? { ...base, propertyType: prefill.propertyType } : base;
  });
  const [loanTypeId, setLoanTypeId] = useState<string>(
    prefill.loanTypeId ?? restoredSession?.loanTypeId ?? "conventional",
  );
  // Land directly on the "Review Your Details" step when re-entering via
  // "?edit=1" (e.g. "Update my financial info"), instead of the first step
  // of a brand-new calculation wizard.
  const [returnToReview, setReturnToReview] = useState(editIntent && restoredSession ? 1 : 0);
  const [calcCount, setCalcCount] = useState(0);
  const [prelimYearlyIncome, setPrelimYearlyIncome] = useState<number>(
    restoredSession?.financialProfile?.yearlyIncome ?? 100000,
  );

  // Show a one-time toast when landing from a strategy CTA
  useEffect(() => {
    if (prefill.strategy) {
      toast({
        title: "Strategy inputs pre-filled",
        description: "Adjust anything before continuing — nothing is saved until you save it.",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    if (step === "results" && selectedState) {
      try {
        const session: BuyersSession = { selectedState, homePrice, hoaMonthly, financialProfile, loanTypeId };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } catch {
        // ignore
      }
    }
  }, [step, selectedState, homePrice, hoaMonthly, financialProfile, loanTypeId]);

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
  }, [step]);

  const handleLocationContinue = (state: StateData, yearlyIncome: number) => {
    if (!hasUnlimited && calcCount >= FREE_CALC_LIMIT) return;
    setSelectedState(state);
    setPrelimYearlyIncome(yearlyIncome);
    setFinancialProfile((p) => ({ ...p, yearlyIncome }));
    setHomePrice(state.medianHomePrice);
    setStep("preliminary");
  };

  const handleCalculatorContinue = (
    state: StateData,
    price: number,
    hoa: number,
    profile: FinancialProfile,
    loanType: string,
  ) => {
    if (!hasUnlimited && calcCount >= FREE_CALC_LIMIT) return;

    try {
      const session: BuyersSession = {
        selectedState: state,
        homePrice: price,
        hoaMonthly: hoa,
        financialProfile: profile,
        loanTypeId: loanType,
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      // ignore
    }

    setSelectedState(state);
    setHomePrice(price);
    setHoaMonthly(hoa);
    setFinancialProfile(profile);
    setLoanTypeId(loanType);
    setCalcCount((c) => c + 1);
    navigate("/homebuying-estimate/financial-health");
  };

  const handleBackToReview = useCallback(() => {
    setStep("full-calculator");
    setReturnToReview((prev) => prev + 1);
  }, []);

  const handleSaveResults = () => {
    if (!guardSave("save your results")) return;
    toast({
      title: "Results Saved",
      description: "Your home affordability analysis has been saved.",
    });
  };

  const handleSavePrelim = async () => {
    if (!guardSave("save your results")) return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      toast({
        title: "Sign in to save",
        description: "Create a free account to save your results.",
      });
      navigate("/auth");
      return;
    }
    toast({
      title: "Results Saved",
      description: "Your preliminary affordability has been saved.",
    });
  };

  const limitReached = !hasUnlimited && calcCount >= FREE_CALC_LIMIT;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Home Affordability Calculator — All 50 States | Throuly"
        description="Throuly's home affordability calculator shows how much house you can afford in all 50 states, with DTI-based limits and side-by-side loan comparisons."
        path="/buyers"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Throuly Home Affordability Calculator",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Web",
          description: "A privacy-first home affordability calculator that estimates your buying power, monthly payment, and down payment across all 50 U.S. states.",
          url: "https://throulyscout.com/buyers",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }}
      />
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="sr-only">Home Affordability Calculator</h1>
          {limitReached && step === "location" && (
            <div className="mb-6">
              <CalculationLimitBanner used={calcCount} max={FREE_CALC_LIMIT} />
            </div>
          )}

          {step === "location" && (
            <GenericCalculator
              mode="location-only"
              onLocationContinue={handleLocationContinue}
              onContinue={() => {}}
              initialValues={restoredSession ?? undefined}
            />
          )}

          {step === "preliminary" && selectedState && (
            <PreliminaryResults
              state={selectedState}
              yearlyIncome={prelimYearlyIncome}
              onContinueFull={(avgPrice) => {
                setHomePrice(avgPrice);
                setStep("full-calculator");
              }}
              onTryDifferentState={() => setStep("location")}
              onSave={handleSavePrelim}
            />
          )}

          {step === "full-calculator" && selectedState && (
            <GenericCalculator
              mode="post-location"
              onContinue={handleCalculatorContinue}
              returnToReview={returnToReview}
              initialValues={{
                selectedState,
                homePrice,
                hoaMonthly,
                financialProfile,
                loanTypeId,
              }}
            />
          )}

          {step === "results" && selectedState && (
            <GenericResults
              state={selectedState}
              homePrice={homePrice}
              hoaMonthly={hoaMonthly}
              financialProfile={financialProfile}
              loanTypeId={loanTypeId}
              onBack={handleBackToReview}
              onSave={handleSaveResults}
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Buyers;
