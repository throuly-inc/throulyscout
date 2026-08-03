import { useState, useEffect, useMemo } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, Settings, Search, Bookmark, MapPin, Trash2, Calculator, ArrowRight, Sparkles, Gift } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { formatCurrency, calculateMortgage } from "@/lib/calculator";
import { statesData, type StateData } from "@/lib/states";
import { clearActiveBuyerSession } from "@/lib/buyerSessionStorage";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SavingsGoalPlanner } from "@/components/dashboard/SavingsGoalPlanner";
import { HomePurchasePlanner } from "@/components/dashboard/HomePurchasePlanner";
import { QualifyingPrograms } from "@/components/buyers/QualifyingPrograms";
import { NextBestStepCard } from "@/components/dashboard/roadmap/NextBestStepCard";
import { useRoadmap } from "@/components/dashboard/roadmap/useRoadmap";

import { FinancialHealthTrackers } from "@/components/dashboard/FinancialHealthTrackers";
import { FinancialHealthSummary } from "@/components/dashboard/FinancialHealthSummary";
import { ComingSoonModal } from "@/components/common/ComingSoonModal";
import { ScenarioSwitcher, type BuyerScenarioInputs } from "@/components/buyers/ScenarioSwitcher";


export default function ClientDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [estimates, setEstimates] = useState<any[]>([]);
  const [financialHealth, setFinancialHealth] = useState<any | null>(null);
  const [financialHealthLoading, setFinancialHealthLoading] = useState(true);
  // The Financial Health page is the single source of truth. When a saved
  // Financial Health record exists we synthesize the primary estimate from it
  // so the dashboard numbers and qualification badge always match the FH page.
  const fhDerivedEstimate = useMemo(() => {
    if (!financialHealth?.inputs || !financialHealth?.results) return null;
    const inp = financialHealth.inputs;
    const res = financialHealth.results;
    const homePrice = res?.comfortable?.price || inp.homePrice || 0;
    return {
      id: financialHealth.id,
      created_at: financialHealth.created_at,
      inputs: { ...inp, homePrice },
      results: {
        totalMonthlyPayment:
          res.totalMonthlyPayment ?? res?.comfortable?.monthly ?? 0,
        totalCashNeeded: res.totalCashNeeded ?? res?.cash?.cashToClose ?? 0,
        qualificationStatus: res.qualificationStatus ?? (res.qualifies ? "strong" : "unlikely"),
        qualifies: !!res.qualifies,
      },
    };
  }, [financialHealth]);

  const latestEstimate = fhDerivedEstimate || estimates[0] || null;
  const originalEstimate = !fhDerivedEstimate && estimates.length > 1 ? estimates[estimates.length - 1] : null;
  // The Financial Health record auto-syncs on every calculator visit, even
  // ones the user never explicitly saved. When real saved scenarios exist,
  // default to the most recently *saved* one instead of silently surfacing
  // whatever state the user last poked at out of curiosity.
  const defaultEstimate =
    originalEstimate || (fhDerivedEstimate && estimates.length > 0 ? estimates[0] : latestEstimate);

  // When the buyer has more than one saved calculator result, let them pick
  // which one drives the Estimate card, Savings Planner, and Programs tab —
  // instead of silently always using the most recent.
  const [selectedEstimateId, setSelectedEstimateId] = useState<string | null>(null);
  const estimateOptions = useMemo(() => {
    const opts: { id: string; label: string; estimate: any }[] = [];
    if (fhDerivedEstimate) {
      opts.push({ id: fhDerivedEstimate.id, label: "Current (Financial Health)", estimate: fhDerivedEstimate });
    }
    for (const e of estimates) {
      if (opts.some((o) => o.id === e.id)) continue;
      const state = e.inputs?.state || "Unknown state";
      const dateLabel = e.created_at ? format(new Date(e.created_at), "MMM d, yyyy") : "";
      opts.push({ id: e.id, label: dateLabel ? `${state} · ${dateLabel}` : state, estimate: e });
    }
    return opts;
  }, [fhDerivedEstimate, estimates]);
  const selectedOverride = selectedEstimateId
    ? estimateOptions.find((o) => o.id === selectedEstimateId)?.estimate ?? null
    : null;
  const mainEstimate = selectedOverride || defaultEstimate;
  const updatedEstimate = !selectedOverride && originalEstimate ? estimates[0] : null;

  const [estimateLoading, setEstimateLoading] = useState(true);
  const { toast } = useToast();
  const [comingSoonLabel, setComingSoonLabel] = useState<string | null>(null);
  const roadmap = useRoadmap(user?.id ?? null);
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window === "undefined") return "estimates";
    const h = window.location.hash.replace("#", "");
    return ["estimates", "savings", "checklist", "programs"].includes(h) ? h : "estimates";
  });
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace("#", "");
      if (["estimates", "savings", "checklist", "programs"].includes(h)) setActiveTab(h);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    if (!user) return;
    loadSavedSearches();
    loadLatestEstimate();
    loadFinancialHealth();
  }, [user]);


  const loadSavedSearches = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("saved_searches" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setSavedSearches((data as any[]) || []);
  };

  const loadLatestEstimate = async () => {
    if (!user) return;
    setEstimateLoading(true);
    const { data } = await supabase
      .from("saved_scenarios")
      .select("*")
      .eq("user_id", user.id)
      .neq("scenario_name", "Financial Health Report")
      .order("created_at", { ascending: false })
      .limit(20);
    // Market Analysis saves (from the Analyzer's "Save Analysis" button) have
    // a different shape than a buyer-calculator estimate (no homePrice/
    // results), so they don't belong in the dashboard's estimate switcher —
    // including them produces a "$0" estimate if one happens to be newest.
    const calculatorEstimates = ((data as any[]) || []).filter(
      (e) => e.inputs?.type !== "market_analysis",
    );
    setEstimates(calculatorEstimates.slice(0, 5));
    setEstimateLoading(false);
  };

  const loadFinancialHealth = async () => {
    if (!user) return;
    setFinancialHealthLoading(true);
    const { data } = await supabase
      .from("saved_scenarios")
      .select("*")
      .eq("user_id", user.id)
      .eq("scenario_name", "Financial Health Report")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setFinancialHealth(data);
    setFinancialHealthLoading(false);
  };


  const loadEstimateIntoBuyers = (est: any) => {
    if (!est) return;
    const inputs = est.inputs || {};
    import("@/lib/states").then(({ getStateByAbbreviation, getStateByName }) => {
      const stateData =
        (inputs.stateAbbreviation && getStateByAbbreviation(inputs.stateAbbreviation)) ||
        (inputs.state && getStateByName(inputs.state));
      if (!stateData) {
        navigate("/buyers");
        return;
      }
      const session = {
        selectedState: stateData,
        homePrice: inputs.homePrice || 400000,
        hoaMonthly: inputs.hoaMonthly || 0,
        financialProfile: {
          yearlyIncome: inputs.yearlyIncome || 100000,
          monthlyDebt: inputs.monthlyDebt || 500,
          savings: inputs.savings || 50000,
          creditScore: inputs.creditScore || 720,
          employmentType: inputs.employmentType || "w2",
          isFirstTimeBuyer: inputs.isFirstTimeBuyer ?? true,
          propertyType: inputs.propertyType,
        },
        loanTypeId: inputs.loanTypeId || "conventional",
      };
      try {
        sessionStorage.setItem("throuly_buyers_session", JSON.stringify(session));
        if (est.id && est.name) {
          sessionStorage.setItem(
            "throuly_editing_scenario",
            JSON.stringify({ id: est.id, name: est.name }),
          );
        } else {
          sessionStorage.removeItem("throuly_editing_scenario");
        }
      } catch {
        // ignore
      }
      navigate("/homebuying-estimate/results");
    });
  };

  const viewFullEstimate = () => loadEstimateIntoBuyers(mainEstimate);

  const handleLoadSavedScenario = (inputs: BuyerScenarioInputs) => {
    const stateData = statesData.find(
      (s) => s.abbreviation === inputs.stateAbbreviation || s.name === inputs.stateName,
    );
    if (!stateData) {
      navigate("/buyers");
      return;
    }
    const session = {
      selectedState: stateData,
      homePrice: inputs.homePrice,
      hoaMonthly: inputs.hoaMonthly,
      financialProfile: {
        yearlyIncome: inputs.yearlyIncome,
        monthlyDebt: inputs.monthlyDebt,
        savings: inputs.savings,
        creditScore: inputs.creditScore,
        employmentType: "w2",
        isFirstTimeBuyer: inputs.isFirstTimeBuyer,
      },
      loanTypeId: inputs.loanTypeId || "conventional",
    };
    try {
      sessionStorage.setItem("throuly_buyers_session", JSON.stringify(session));
      sessionStorage.removeItem("throuly_editing_scenario");
    } catch {
      // ignore
    }
    navigate("/homebuying-estimate/results");
  };

  const suggestedStates = useMemo(() => {
    if (!mainEstimate) return [] as { state: StateData; calc: ReturnType<typeof calculateMortgage> }[];
    const inputs = mainEstimate.inputs || {};
    const profile = {
      yearlyIncome: inputs.yearlyIncome ?? 100000,
      monthlyDebt: inputs.monthlyDebt ?? 500,
      savings: inputs.savings ?? 50000,
      creditScore: inputs.creditScore ?? 720,
      employmentType: inputs.employmentType ?? "w2",
      isFirstTimeBuyer: inputs.isFirstTimeBuyer ?? true,
      propertyType: inputs.propertyType,
    };
    const downPct = inputs.downPaymentPercent ?? 20;
    const loanTypeId = inputs.loanTypeId ?? "conventional";
    const currentPrice = inputs.homePrice ?? 0;
    const savedStateNames = new Set(
      estimates.map((e) => (e?.inputs?.state || "").toString().toLowerCase()).filter(Boolean),
    );
    return statesData
      .filter((s) => !savedStateNames.has(s.name.toLowerCase()))
      .map((s) => ({ state: s, calc: calculateMortgage(s.medianHomePrice, downPct, s, profile as any, 0, loanTypeId) }))
      .filter(({ calc }) => calc.qualifies)
      .sort(
        (a, b) => Math.abs(a.state.medianHomePrice - currentPrice) - Math.abs(b.state.medianHomePrice - currentPrice),
      )
      .slice(0, 3);
  }, [mainEstimate, estimates]);

  const reviewSuggestedEstimate = (s: StateData) => {
    if (!mainEstimate) return;
    const inputs = mainEstimate.inputs || {};
    const session = {
      selectedState: s,
      homePrice: s.medianHomePrice,
      hoaMonthly: 0,
      financialProfile: {
        yearlyIncome: inputs.yearlyIncome ?? 100000,
        monthlyDebt: inputs.monthlyDebt ?? 500,
        savings: inputs.savings ?? 50000,
        creditScore: inputs.creditScore ?? 720,
        employmentType: inputs.employmentType ?? "w2",
        isFirstTimeBuyer: inputs.isFirstTimeBuyer ?? true,
        propertyType: inputs.propertyType,
      },
      loanTypeId: inputs.loanTypeId ?? "conventional",
    };
    try {
      sessionStorage.setItem("throuly_buyers_session", JSON.stringify(session));
    } catch {
      /* ignore */
    }
    navigate("/buyers");
  };

  const deleteSavedSearch = async (id: string) => {
    const { error } = await supabase
      .from("saved_searches" as any)
      .delete()
      .eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: "Couldn't delete the search. Please try again.", variant: "destructive" });
    } else {
      setSavedSearches((prev) => prev.filter((s) => s.id !== id));
      toast({ title: "Search deleted" });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!profile?.onboarding_complete) return <Navigate to="/onboarding" replace />;


  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Decorative background blobs for color */}
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-[var(--scout)] opacity-[0.08] blur-3xl" />
        <div className="absolute top-40 -right-32 h-96 w-96 rounded-full bg-[var(--list)] opacity-[0.08] blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-[var(--compass)] opacity-[0.06] blur-3xl" />
      </div>

      <main className="relative max-w-4xl mx-auto p-6 pt-24 space-y-6">
        {/* Hero header */}
        <div
          className="relative overflow-hidden rounded-2xl p-6 md:p-8 text-primary-foreground"
          style={{ background: "var(--grad)" }}
        >
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-[var(--indigo-lt)] opacity-30 blur-3xl" />
          <div className="absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-[var(--scout)] opacity-30 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] opacity-70">Welcome back</p>
              <h2 className="font-serif text-3xl md:text-4xl mt-1">
                {profile?.full_name ? `Hi, ${profile.full_name.split(" ")[0]}` : "My Dashboard"}
              </h2>
              <p className="text-sm opacity-80 mt-2">Track your transactions, estimates, and saved searches.</p>
            </div>
            {user && <NotificationBell userId={user.id} />}
          </div>
          <div className="relative mt-5 flex flex-wrap gap-2">
            <Button
              size="sm"
              className="bg-[var(--scout)] hover:bg-[var(--scout)]/90 text-white border-0"
              onClick={() => setComingSoonLabel("Find Properties")}
            >
              <Search className="w-4 h-4 mr-2" /> Find Properties
            </Button>
            <Link to="/dashboard/client/preferences">
              <Button size="sm" className="bg-[var(--compass)] hover:bg-[var(--compass)]/90 text-white border-0">
                <Settings className="w-4 h-4 mr-2" /> Preferences
              </Button>
            </Link>
            <Link to="/analyzer">
              <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground border-0">
                <Sparkles className="w-4 h-4 mr-2" /> Analyzer
              </Button>
            </Link>
          </div>
        </div>

        {estimateOptions.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0">Viewing estimate:</span>
            <Select
              value={selectedEstimateId ?? mainEstimate?.id ?? ""}
              onValueChange={(id) => setSelectedEstimateId(id)}
            >
              <SelectTrigger className="h-8 w-auto min-w-[200px] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {estimateOptions.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Planning Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v);
            try {
              history.replaceState(null, "", `#${v}`);
            } catch {}
          }}
          className="w-full"
        >
          {(() => {
            const TABS = ["estimates", "savings", "checklist", "programs"] as const;
            const activeIndex = Math.max(0, TABS.indexOf(activeTab as typeof TABS[number]));
            const triggerCls =
              "relative z-10 w-full min-w-0 justify-center rounded-md px-1.5 py-2 sm:px-3 sm:py-2.5 text-[11px] sm:text-sm font-semibold whitespace-nowrap text-white/80 hover:text-white data-[state=active]:bg-transparent data-[state=active]:text-foreground transition-colors duration-300 ease-out";
            return (
              <TabsList className="relative grid grid-cols-4 gap-1 h-auto w-full bg-[#262759] rounded-xl shadow-sm p-1">
                <span
                  aria-hidden="true"
                  className="absolute top-1 bottom-1 left-1 rounded-md bg-background shadow-sm transition-transform duration-300 ease-out pointer-events-none"
                  style={{
                    width: "calc((100% - 1.25rem) / 4)",
                    transform: `translateX(calc(${activeIndex} * (100% + 0.25rem)))`,
                  }}
                />
                <TabsTrigger value="estimates" aria-label="Saved Estimates" className={triggerCls}>
                  <Bookmark className="w-4 h-4 shrink-0" />
                  {activeTab === "estimates" && <span className="ml-1.5 sm:hidden">Saved</span>}
                  <span className="hidden sm:inline sm:ml-1.5">Saved Estimates</span>
                </TabsTrigger>
                <TabsTrigger value="savings" aria-label="Savings Planner" className={triggerCls}>
                  <Calculator className="w-4 h-4 shrink-0" />
                  {activeTab === "savings" && <span className="ml-1.5 sm:hidden">Savings</span>}
                  <span className="hidden sm:inline sm:ml-1.5">Savings Planner</span>
                </TabsTrigger>
                <TabsTrigger value="checklist" aria-label="Purchase Planner" className={triggerCls}>
                  <Home className="w-4 h-4 shrink-0" />
                  {activeTab === "checklist" && <span className="ml-1.5 sm:hidden">Purchase</span>}
                  <span className="hidden sm:inline sm:ml-1.5">Purchase Planner</span>
                </TabsTrigger>
                <TabsTrigger value="programs" aria-label="Programs" className={triggerCls}>
                  <Gift className="w-4 h-4 shrink-0" />
                  {activeTab === "programs" && <span className="ml-1.5 sm:hidden">Programs</span>}
                  <span className="hidden sm:inline sm:ml-1.5">Programs</span>
                </TabsTrigger>
              </TabsList>
            );
          })()}

          <TabsContent value="estimates" className="mt-4 space-y-4">
            {!roadmap.loading && (
              <NextBestStepCard
                primary={roadmap.nextBestStep}
                secondary={roadmap.secondaryStep}
                onSwitchTab={setActiveTab}
              />
            )}
            <FinancialHealthSummary report={financialHealth} loading={financialHealthLoading} />
            {!estimateLoading && !financialHealthLoading &&
              (mainEstimate ? (
                <Card className="border-accent/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-accent text-accent-foreground">
                            <Calculator className="w-4 h-4" />
                          </span>
                          Your Estimate
                        </CardTitle>
                        <p className="mt-2 text-base font-semibold uppercase tracking-wide text-accent">
                          {mainEstimate.inputs?.state || "—"}
                        </p>
                        <p className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mt-1">
                          {formatCurrency(mainEstimate.inputs?.homePrice || 0)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <Badge
                          variant={mainEstimate.results?.qualificationStatus === "unlikely" ? "secondary" : "default"}
                        >
                          {mainEstimate.results?.qualificationStatus === "unlikely"
                            ? "Needs Work"
                            : mainEstimate.results?.qualificationStatus === "strong"
                              ? "Strong Fit"
                              : "Likely Qualifies"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                      <div className="rounded-lg border border-accent/30 bg-accent/10 p-3">
                        <p className="text-xs uppercase tracking-wide text-accent font-medium">Monthly Payment</p>
                        <p className="text-lg font-semibold text-foreground mt-1">
                          {formatCurrency(mainEstimate.results?.totalMonthlyPayment || 0)}
                        </p>
                      </div>
                      <div
                        className="rounded-lg border p-3"
                        style={{ borderColor: "rgba(2,132,199,0.3)", backgroundColor: "var(--scout-dim)" }}
                      >
                        <p className="text-xs uppercase tracking-wide font-medium" style={{ color: "var(--scout)" }}>
                          Cash to Close
                        </p>
                        <p className="text-lg font-semibold text-foreground mt-1">
                          {formatCurrency(mainEstimate.results?.totalCashNeeded || 0)}
                        </p>
                      </div>
                      <div
                        className="rounded-lg border p-3"
                        style={{ borderColor: "rgba(5,150,105,0.3)", backgroundColor: "var(--compass-dim)" }}
                      >
                        <p className="text-xs uppercase tracking-wide font-medium" style={{ color: "var(--compass)" }}>
                          Saved
                        </p>
                        <p className="text-lg font-semibold text-foreground mt-1">
                          {format(new Date(mainEstimate.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>

                    {suggestedStates.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-accent/20">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-2">
                          Other states you may qualify for
                        </p>
                        <div className="space-y-2">
                          {suggestedStates.map(({ state, calc }) => (
                            <div
                              key={state.abbreviation}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-accent/20 bg-background/60 px-3 py-2"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-foreground truncate">{state.name}</p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {formatCurrency(state.medianHomePrice)} home ·{" "}
                                    {formatCurrency(calc.totalMonthlyPayment)}/mo ·{" "}
                                    {formatCurrency(calc.totalCashNeeded)} cash
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs"
                                onClick={() => reviewSuggestedEstimate(state)}
                              >
                                Review Estimate <ArrowRight className="w-3 h-3 ml-1" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {updatedEstimate && (
                      <div className="mt-5 pt-4 border-t border-accent/20">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-2">
                          Updated estimate
                        </p>
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-accent/20 bg-background/60 px-3 py-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {updatedEstimate.inputs?.state || "—"}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {formatCurrency(updatedEstimate.inputs?.homePrice || 0)} home ·{" "}
                                {formatCurrency(updatedEstimate.results?.totalMonthlyPayment || 0)}/mo ·{" "}
                                {formatCurrency(updatedEstimate.results?.totalCashNeeded || 0)} cash · Saved{" "}
                                {format(new Date(updatedEstimate.created_at), "MMM d, yyyy")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-accent text-accent-foreground hover:bg-accent">Updated</Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={() => loadEstimateIntoBuyers(updatedEstimate)}
                            >
                              View <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end mt-4">
                      <Button
                        size="sm"
                        onClick={viewFullEstimate}
                        className="bg-accent hover:bg-accent/90 text-accent-foreground"
                      >
                        View Full Results <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="relative overflow-hidden border-accent/20">
                  <div
                    className="absolute inset-0 opacity-[0.06] pointer-events-none"
                    style={{ background: "var(--grad)" }}
                  />
                  <CardContent className="relative py-6 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-accent/15 text-accent">
                        <Calculator className="w-5 h-5" />
                      </span>
                      <p className="text-sm text-muted-foreground">
                        No estimate yet — try the Home Affordability Calculator
                      </p>
                    </div>
                    <Link to="/buyers" onClick={clearActiveBuyerSession}>
                      <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                        Get Started <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            <div className="mt-4">
              <ScenarioSwitcher onLoad={handleLoadSavedScenario} userId={user?.id ?? null} />
            </div>
            <FinancialHealthTrackers estimate={mainEstimate} loading={estimateLoading} />
          </TabsContent>

          <TabsContent value="savings" className="mt-4">
            <SavingsGoalPlanner
              defaultGoal={mainEstimate?.results?.totalCashNeeded || 50000}
              defaultIncome={Math.round((mainEstimate?.inputs?.yearlyIncome || 0) / 12)}
              defaultCurrentSavings={Number(mainEstimate?.inputs?.savings) || 0}
              defaultMonthlyDebt={Number(mainEstimate?.inputs?.monthlyDebt) || 0}
              userId={user?.id ?? null}
            />
          </TabsContent>

          <TabsContent value="checklist" className="mt-4">
            <HomePurchasePlanner userId={user?.id ?? null} onSwitchTab={setActiveTab} />
          </TabsContent>


          <TabsContent value="programs" className="mt-4">
            {mainEstimate ? (
              <Card>
                <CardContent className="pt-6">
                  <QualifyingPrograms
                    stateName={mainEstimate.inputs?.state || ""}
                    homePrice={mainEstimate.inputs?.homePrice || 0}
                    yearlyIncome={mainEstimate.inputs?.yearlyIncome || 0}
                    isFirstTimeBuyer={mainEstimate.inputs?.isFirstTimeBuyer ?? true}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-10 text-center space-y-3">
                  <Gift className="w-10 h-10 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    Save an estimate first so we can match you to programs in your state.
                  </p>
                  <Link to="/buyers" onClick={clearActiveBuyerSession}>
                    <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                      Start an Estimate <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>


        {/* Saved Searches */}
        {savedSearches.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-serif text-lg text-foreground">My Saved Searches</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {savedSearches.map((search) => {
                const filters = search.filters || {};
                return (
                  <Card key={search.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{search.search_name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <MapPin className="w-3 h-3" />
                          <span>{search.state}</span>
                          {filters.priceRange && (
                            <span>
                              · {formatCurrency(filters.priceRange[0])} - {formatCurrency(filters.priceRange[1])}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Saved {format(new Date(search.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="outline" size="sm" onClick={() => setComingSoonLabel("Seller Matching")}>
                          Run Search
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteSavedSearch(search.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </main>
      <ComingSoonModal
        open={!!comingSoonLabel}
        label={comingSoonLabel || ""}
        onClose={() => setComingSoonLabel(null)}
      />
    </div>
  );
}
