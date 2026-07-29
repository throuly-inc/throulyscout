import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  PiggyBank,
  Plus,
  Trash2,
  TrendingUp,
  Target,
  Calendar,
  Wallet,
  Sparkles,
  Pencil,
  Check,
  AlertTriangle,
  Info,
  Home,
  ArrowRight,
  RotateCcw,
  Save,
  Heart,
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/lib/calculator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  useSavingsProjection,
  computeSavingsProjection,
  type ExpenseRow,
  type ReadinessTargets,
} from "@/hooks/useSavingsProjection";
import { StatusBadge } from "./savings/StatusBadge";
import { AnimatedNumber } from "./savings/AnimatedNumber";
import { TrajectoryChart } from "./savings/TrajectoryChart";
import { SwipeableRow } from "./savings/SwipeableRow";
import { MobileStickyStatus } from "./savings/MobileStickyStatus";

const STORAGE_KEY = "throuly_savings_goal_planner";
const META_ID = "__meta";

interface PlannerMeta {
  goalName: string;
  readiness: ReadinessTargets;
  thisMonthSaved: number | null;
  thisMonthPeriod: string | null; // yyyy-mm
}

const DEFAULT_META: PlannerMeta = {
  goalName: "Down Payment",
  readiness: {
    closingCosts: 0,
    emergencyReserve: 0,
    moving: 0,
    initialHome: 0,
    savedClosing: 0,
    savedEmergency: 0,
    savedMoving: 0,
    savedInitial: 0,
  },
  thisMonthSaved: null,
  thisMonthPeriod: null,
};

const DEFAULT_EXPENSES: ExpenseRow[] = [
  { id: "rent", label: "Rent / Mortgage", amount: null },
  { id: "debt", label: "Debt Payments (loans, cards)", amount: null },
  { id: "utilities", label: "Utilities & Internet", amount: null },
  { id: "food", label: "Groceries & Food", amount: null },
  { id: "transport", label: "Transportation", amount: null },
  { id: "subs", label: "Subscriptions & Memberships", amount: null },
  { id: "other", label: "Other", amount: null },
];

interface Props {
  defaultGoal?: number;
  defaultIncome?: number;
  defaultCurrentSavings?: number;
  defaultMonthlyDebt?: number;
  userId?: string | null;
}

// ---- inline validated number field ----
interface NumberFieldProps {
  id?: string;
  value: number | null;
  onChange: (n: number | null) => void;
  placeholder?: string;
  className?: string;
  min?: number;
  ariaLabel?: string;
  allowEmpty?: boolean;
}
function NumberField({
  id,
  value,
  onChange,
  placeholder,
  className,
  min = 0,
  ariaLabel,
  allowEmpty = false,
}: NumberFieldProps) {
  const [raw, setRaw] = useState<string>(value != null ? String(value) : "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const parsed = Number(raw);
    if (value == null) {
      if (raw !== "") setRaw("");
      return;
    }
    if (!raw || Number.isNaN(parsed) || parsed !== value) {
      setRaw(String(value));
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handle = (s: string) => {
    setRaw(s);
    if (s === "") {
      setError(null);
      onChange(allowEmpty ? null : 0);
      return;
    }
    const n = Number(s);
    if (Number.isNaN(n)) {
      setError("Enter a valid number");
      return;
    }
    if (n < min) {
      setError(`Must be ${min} or greater`);
      return;
    }
    setError(null);
    onChange(n);
  };

  return (
    <div className="space-y-1">
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        aria-label={ariaLabel}
        aria-invalid={!!error}
        className={`[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
          error ? "border-destructive focus-visible:ring-destructive" : ""
        } ${className || ""}`}
        value={raw}
        onChange={(e) => handle(e.target.value)}
        placeholder={placeholder}
      />
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

const fmtDate = (d: Date | null) =>
  d ? d.toLocaleDateString(undefined, { month: "long", year: "numeric" }) : "—";

const fmtTime = (m: number | null) => {
  if (m === null) return "—";
  if (m === 0) return "Done";
  if (m >= 12) return `${Math.floor(m / 12)}y ${m % 12}m`;
  return `${m} mo`;
};

const currentPeriod = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

function InfoTip({ text }: { text: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="More info"
            className="inline-flex text-muted-foreground hover:text-foreground"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-[240px] text-xs">{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function SavingsGoalPlanner({
  defaultGoal = 50000,
  defaultIncome = 0,
  defaultCurrentSavings = 0,
  defaultMonthlyDebt = 0,
  userId = null,
}: Props) {
  const { toast } = useToast();
  const [goal, setGoal] = useState<number>(defaultGoal);
  const [currentSavings, setCurrentSavings] = useState<number>(defaultCurrentSavings);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(defaultIncome);
  const [targetMonths, setTargetMonths] = useState<number>(24);
  const [expenses, setExpenses] = useState<ExpenseRow[]>(() =>
    DEFAULT_EXPENSES.map((e) =>
      e.id === "debt" && defaultMonthlyDebt ? { ...e, amount: defaultMonthlyDebt } : e,
    ),
  );
  const [meta, setMeta] = useState<PlannerMeta>(DEFAULT_META);
  const [hydrated, setHydrated] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  // Load: prefer Supabase for signed-in users, fall back to localStorage
  useEffect(() => {
    let cancelled = false;
    const parseFromStore = (raw: any) => {
      if (raw.goal) setGoal(Number(raw.goal));
      if (raw.currentSavings != null) setCurrentSavings(Number(raw.currentSavings));
      if (raw.monthlyIncome) setMonthlyIncome(Number(raw.monthlyIncome));
      if (raw.targetMonths) setTargetMonths(Number(raw.targetMonths));
      if (Array.isArray(raw.expenses) && raw.expenses.length) {
        const metaRow = raw.expenses.find((e: any) => e?.id === META_ID);
        const rows = raw.expenses
          .filter((e: any) => e?.id !== META_ID)
          .map((e: any) => ({
            id: String(e.id),
            label: String(e.label ?? ""),
            amount: e.amount === null || e.amount === undefined ? null : Number(e.amount),
          }));
        if (rows.length) setExpenses(rows);
        if (metaRow?.meta) {
          const m = metaRow.meta as Partial<PlannerMeta>;
          setMeta({
            goalName: m.goalName ?? DEFAULT_META.goalName,
            readiness: { ...DEFAULT_META.readiness, ...(m.readiness ?? {}) },
            thisMonthSaved: m.thisMonthSaved ?? null,
            thisMonthPeriod: m.thisMonthPeriod ?? null,
          });
        }
      }
    };

    const loadLocal = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) parseFromStore(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    };

    (async () => {
      if (userId) {
        const { data } = await supabase
          .from("savings_plans")
          .select("goal,current_savings,monthly_income,target_months,expenses")
          .eq("user_id", userId)
          .maybeSingle();
        if (cancelled) return;
        if (data) {
          parseFromStore({
            goal: data.goal,
            currentSavings: data.current_savings,
            monthlyIncome: data.monthly_income,
            targetMonths: data.target_months,
            expenses: data.expenses,
          });
        } else {
          loadLocal();
        }
      } else {
        loadLocal();
      }
      if (!cancelled) setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Sync parent-provided defaults if user hasn't set values yet
  useEffect(() => {
    if (defaultMonthlyDebt) {
      setExpenses((prev) => {
        const idx = prev.findIndex((e) => e.id === "debt");
        if (idx === -1) return prev;
        if (prev[idx].amount == null) {
          const next = [...prev];
          next[idx] = { ...next[idx], amount: defaultMonthlyDebt };
          return next;
        }
        return prev;
      });
    }
  }, [defaultMonthlyDebt]);
  useEffect(() => {
    if (defaultIncome > 0) setMonthlyIncome((v) => v || defaultIncome);
  }, [defaultIncome]);
  useEffect(() => {
    if (defaultCurrentSavings > 0) setCurrentSavings((v) => v || defaultCurrentSavings);
  }, [defaultCurrentSavings]);

  // Persist: localStorage always + debounced Supabase upsert for signed-in users
  useEffect(() => {
    if (!hydrated) return;
    const expensesPayload = [
      ...expenses,
      { id: META_ID, label: META_ID, amount: null, meta } as any,
    ];
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          goal,
          currentSavings,
          monthlyIncome,
          targetMonths,
          expenses: expensesPayload,
        }),
      );
    } catch {
      /* ignore */
    }
    if (!userId) return;
    const timer = setTimeout(() => {
      supabase
        .from("savings_plans")
        .upsert({
          user_id: userId,
          goal,
          current_savings: currentSavings,
          monthly_income: monthlyIncome,
          target_months: targetMonths,
          expenses: expensesPayload as unknown as never,
        })
        .then(({ error }) => {
          if (error) {
            toast({
              title: "Couldn't save",
              description: "Your changes are saved locally. Try again shortly.",
              variant: "destructive",
            });
          }
        });
    }, 600);
    return () => clearTimeout(timer);
  }, [hydrated, userId, goal, currentSavings, monthlyIncome, targetMonths, expenses, meta, toast]);

  const projection = useSavingsProjection({
    goal,
    currentSavings,
    monthlyIncome,
    targetMonths,
    expenses,
    readiness: meta.readiness,
    thisMonthSaved: meta.thisMonthSaved,
  });
  const {
    totalExpenses,
    monthlySavingsAvailable,
    savingsRate,
    remaining,
    monthsToGoal,
    monthlyNeededForTarget,
    shortfall,
    goalProgress,
    status,
    projectionSeries,
    targetDate,
    projectedGoalDate,
    aheadBehindPerMonth,
    budgetIncomplete,
    negativeCashflow,
    healthScore,
    healthLabel,
    healthBreakdown,
  } = projection;

  const updateExpense = useCallback(
    (id: string, patch: Partial<ExpenseRow>) =>
      setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e))),
    [],
  );
  const removeExpense = (id: string) =>
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  const addExpense = () =>
    setExpenses((prev) => [
      ...prev,
      { id: `exp_${Date.now()}`, label: "New Expense", amount: null },
    ]);

  const expensesPct =
    monthlyIncome > 0 ? Math.round((totalExpenses / monthlyIncome) * 100) : 0;

  // ---------- What-If simulator ----------
  const [sim, setSim] = useState({
    extraMonthly: 0,
    lumpSum: 0,
    goalDelta: 0,
    monthsDelta: 0,
    expenseCut: 0,
  });
  const simActive =
    sim.extraMonthly !== 0 ||
    sim.lumpSum !== 0 ||
    sim.goalDelta !== 0 ||
    sim.monthsDelta !== 0 ||
    sim.expenseCut !== 0;

  const simProjection = useMemo(() => {
    if (!simActive) return null;
    const simExpenses = expenses.map((e) => {
      if (e.amount == null) return e;
      const cut = sim.expenseCut > 0 && totalExpenses > 0
        ? (e.amount / totalExpenses) * sim.expenseCut
        : 0;
      return { ...e, amount: Math.max(0, e.amount - cut) };
    });
    return computeSavingsProjection({
      goal: Math.max(0, goal + sim.goalDelta),
      currentSavings: currentSavings + sim.lumpSum,
      monthlyIncome: monthlyIncome + sim.extraMonthly,
      targetMonths: Math.max(1, targetMonths + sim.monthsDelta),
      expenses: simExpenses,
      readiness: meta.readiness,
    });
  }, [sim, simActive, expenses, totalExpenses, goal, currentSavings, monthlyIncome, targetMonths, meta.readiness]);

  const applySim = () => {
    setGoal((g) => Math.max(0, g + sim.goalDelta));
    setTargetMonths((t) => Math.max(1, t + sim.monthsDelta));
    if (sim.lumpSum) setCurrentSavings((c) => c + sim.lumpSum);
    if (sim.extraMonthly) setMonthlyIncome((i) => i + sim.extraMonthly);
    setSim({ extraMonthly: 0, lumpSum: 0, goalDelta: 0, monthsDelta: 0, expenseCut: 0 });
    toast({ title: "Applied to your plan" });
  };
  const resetSim = () =>
    setSim({ extraMonthly: 0, lumpSum: 0, goalDelta: 0, monthsDelta: 0, expenseCut: 0 });

  // ---------- Sections ----------
  const helpingReasons = healthBreakdown
    .filter((b) => b.helping)
    .sort((a, b) => b.score * b.weight - a.score * a.weight)
    .slice(0, 2);
  const hurtingReasons = healthBreakdown
    .filter((b) => b.hurting)
    .sort((a, b) => (1 - a.score) * a.weight - (1 - b.score) * b.weight)
    .slice(0, 2);

  const goalSummary = (
    <Card ref={heroRef} className="relative overflow-hidden border-accent/30">
      <div
        className="absolute inset-0 opacity-[0.10] pointer-events-none"
        style={{ background: "var(--grad)" }}
      />
      <CardContent className="relative p-5 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-accent text-accent-foreground shrink-0">
              <PiggyBank className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Savings Planner · {meta.goalName}
              </p>
              <p className="font-serif text-xl sm:text-2xl font-semibold text-foreground truncate">
                You've saved{" "}
                <AnimatedNumber value={currentSavings} format={formatCurrency} /> of{" "}
                {formatCurrency(goal)}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {remaining > 0
                  ? `Only ${formatCurrency(remaining)} left.`
                  : "You've reached your goal 🎉"}{" "}
                {projectedGoalDate && remaining > 0
                  ? `On pace for ${fmtDate(projectedGoalDate)}.`
                  : ""}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={status} />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditingGoal((v) => !v)}
              className="text-xs h-8"
            >
              {editingGoal ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1" /> Done
                </>
              ) : (
                <>
                  <Pencil className="w-3.5 h-3.5 mr-1" /> Edit goal
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              <AnimatedNumber value={goalProgress} format={(n) => `${Math.round(n)}%`} />{" "}
              of goal
            </span>
            <span>{formatCurrency(remaining)} to go</span>
          </div>
          <Progress value={goalProgress} className="h-3" />
        </div>

        {editingGoal && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
            <div className="space-y-1.5">
              <Label htmlFor="goal-name">Goal name</Label>
              <Input
                id="goal-name"
                value={meta.goalName}
                onChange={(e) => setMeta((m) => ({ ...m, goalName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal-amount">Savings goal</Label>
              <NumberField id="goal-amount" value={goal} onChange={(n) => setGoal(n ?? 0)} placeholder="50000" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="current-savings">Current savings</Label>
              <NumberField
                id="current-savings"
                value={currentSavings}
                onChange={(n) => setCurrentSavings(n ?? 0)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="monthly-income">Monthly take-home</Label>
              <NumberField
                id="monthly-income"
                value={monthlyIncome}
                onChange={(n) => setMonthlyIncome(n ?? 0)}
                placeholder="5000"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="target-months">Target timeline (months)</Label>
              <NumberField
                id="target-months"
                value={targetMonths}
                onChange={(n) => setTargetMonths(Math.max(1, n ?? 1))}
                placeholder="24"
                min={1}
              />
              <p className="text-[11px] text-muted-foreground">
                Target date: {fmtDate(targetDate)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const metricTile = (opts: {
    icon: ReactNode;
    label: string;
    value: ReactNode;
    hint?: string;
    tip?: string;
  }) => (
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {opts.icon}
          <span>{opts.label}</span>
          {opts.tip && <InfoTip text={opts.tip} />}
        </div>
        <p className="font-serif text-xl font-semibold text-foreground mt-1.5">
          {opts.value}
        </p>
        {opts.hint && <p className="text-[11px] text-muted-foreground mt-1">{opts.hint}</p>}
      </CardContent>
    </Card>
  );

  const metricTiles = (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {metricTile({
        icon: <Wallet className="w-3.5 h-3.5 text-accent" />,
        label: "Remaining",
        value: formatCurrency(remaining),
        hint: `of ${formatCurrency(goal)} goal`,
      })}
      {metricTile({
        icon: <Target className="w-3.5 h-3.5 text-accent" />,
        label: "Required / mo",
        value: monthlyNeededForTarget != null ? formatCurrency(monthlyNeededForTarget) : "—",
        hint:
          monthlyNeededForTarget != null
            ? `to hit ${fmtDate(targetDate)}`
            : "Set a timeline to compute",
        tip: "How much you need to set aside each month to reach your goal by the target date.",
      })}
      {metricTile({
        icon: <TrendingUp className="w-3.5 h-3.5 text-accent" />,
        label: "Available / mo",
        value: budgetIncomplete ? "—" : formatCurrency(monthlySavingsAvailable),
        hint: budgetIncomplete
          ? "Complete your monthly budget"
          : savingsRate != null
          ? `${savingsRate.toFixed(1)}% of income`
          : "",
        tip: "Take-home income minus your entered expenses.",
      })}
      {metricTile({
        icon: <Calendar className="w-3.5 h-3.5 text-accent" />,
        label: "Projected date",
        value: fmtDate(projectedGoalDate),
        hint:
          monthsToGoal != null
            ? `in ${fmtTime(monthsToGoal)}`
            : "Add monthly savings to project",
        tip: "When your current pace would reach your goal.",
      })}
    </div>
  );

  const milestoneTimeline = (() => {
    const closing = meta.readiness.closingCosts;
    const items = [
      { label: "Today", value: formatCurrency(currentSavings), done: true },
      closing > 0
        ? {
            label: "Closing costs",
            value: formatCurrency(closing),
            done: currentSavings >= closing,
          }
        : null,
      { label: meta.goalName, value: formatCurrency(goal), done: currentSavings >= goal },
      { label: "Target", value: fmtDate(targetDate), done: false },
    ].filter(Boolean) as Array<{ label: string; value: string; done: boolean }>;
    return (
      <div className="flex items-center gap-2 overflow-x-auto pt-3 mt-3 border-t border-border">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2 shrink-0">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                it.done ? "bg-accent" : "bg-muted-foreground/40"
              }`}
            />
            <div className="text-[11px]">
              <div className="font-semibold text-foreground">{it.label}</div>
              <div className="text-muted-foreground">{it.value}</div>
            </div>
            {i < items.length - 1 && (
              <ArrowRight className="w-3 h-3 text-muted-foreground/60 mx-1" />
            )}
          </div>
        ))}
      </div>
    );
  })();

  const projectionCard = (
    <Card className="relative overflow-hidden border-accent/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          Projection
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <TrajectoryChart
          data={(simProjection ?? projection).projectionSeries}
          goal={simProjection?.projectionSeries[0]?.goal ?? goal}
          currentSavings={currentSavings + (simProjection ? sim.lumpSum : 0)}
        />
        {milestoneTimeline}
      </CardContent>
    </Card>
  );

  const healthColor =
    healthScore >= 80
      ? "text-success"
      : healthScore >= 60
      ? "text-accent"
      : healthScore >= 40
      ? "text-warning"
      : "text-destructive";

  const healthCard = (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Heart className="w-4 h-4 text-accent" />
          Savings Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-3">
          <span className={`font-serif text-4xl font-semibold ${healthColor}`}>
            {healthScore}
          </span>
          <span className="text-sm text-muted-foreground">/ 100 · {healthLabel}</span>
        </div>
        <Progress value={healthScore} className="h-2" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-success">
              Helping your score
            </p>
            {helpingReasons.length ? (
              <ul className="text-sm text-foreground space-y-1">
                {helpingReasons.map((r) => (
                  <li key={r.key}>• {r.helping}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Enter more info to build strengths.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-warning">
              Needs attention
            </p>
            {hurtingReasons.length ? (
              <ul className="text-sm text-foreground space-y-1">
                {hurtingReasons.map((r) => (
                  <li key={r.key}>• {r.hurting}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nothing pressing — great work.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const budgetCard = (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="w-4 h-4 text-accent" />
            Monthly Budget
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={editMode ? "default" : "ghost"}
              onClick={() => {
                setEditMode((v) => !v);
                setRevealedId(null);
              }}
              className="min-h-[44px] sm:min-h-0 sm:hidden"
              aria-pressed={editMode}
            >
              {editMode ? "Done" : "Edit"}
            </Button>
            <Button size="sm" variant="outline" onClick={addExpense} className="min-h-[44px] sm:min-h-0">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add
            </Button>
          </div>
        </div>
        <p className="sm:hidden text-[11px] text-muted-foreground mt-1">
          Tip: swipe a row left to delete, or tap Edit.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {budgetIncomplete && (
          <div className="flex items-start gap-2 rounded-md bg-muted/60 border border-border px-3 py-2 text-xs text-muted-foreground">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              Complete your monthly budget to receive an accurate savings projection.
            </span>
          </div>
        )}
        {negativeCashflow && (
          <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-xs text-destructive">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>Your expenses exceed your monthly income.</span>
          </div>
        )}
        <div className="hidden sm:grid grid-cols-[1fr,140px,40px] gap-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <span>Category</span>
          <span className="text-right">Monthly amount</span>
          <span />
        </div>
        {expenses.map((e) => {
          const rowContent = (
            <div className="grid grid-cols-[1fr,110px] sm:grid-cols-[1fr,140px,40px] gap-2 items-start bg-background">
              <Input
                value={e.label}
                onChange={(ev) => updateExpense(e.id, { label: ev.target.value })}
                className="min-h-[44px] sm:min-h-0"
              />
              <NumberField
                value={e.amount}
                onChange={(n) => updateExpense(e.id, { amount: n })}
                placeholder="—"
                className="text-right min-h-[44px] sm:min-h-0"
                ariaLabel={`${e.label} amount`}
                allowEmpty
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removeExpense(e.id)}
                aria-label="Remove"
                className="hidden sm:inline-flex sm:min-h-0 sm:min-w-0"
              >
                <Trash2 className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          );
          return (
            <div key={e.id}>
              <div className="sm:hidden">
                <SwipeableRow
                  onDelete={() => {
                    removeExpense(e.id);
                    setRevealedId(null);
                  }}
                  revealed={revealedId === e.id}
                  onRevealChange={(v) => setRevealedId(v ? e.id : null)}
                  editMode={editMode}
                  ariaLabel={e.label}
                >
                  {rowContent}
                </SwipeableRow>
              </div>
              <div className="hidden sm:block">{rowContent}</div>
            </div>
          );
        })}
        <div className="flex justify-between text-sm pt-3 border-t border-border">
          <span className="text-muted-foreground">Total monthly expenses</span>
          <span className="font-semibold text-foreground">
            {formatCurrency(totalExpenses)}
            {monthlyIncome > 0 && (
              <span className="text-muted-foreground font-normal"> · {expensesPct}% of income</span>
            )}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Take-home income</span>
          <span className="font-semibold text-foreground">{formatCurrency(monthlyIncome)}</span>
        </div>
        <div className="flex justify-between text-sm pt-2 border-t border-border">
          <span className="text-foreground font-semibold">Available to save</span>
          <span
            className={`font-semibold ${
              budgetIncomplete
                ? "text-muted-foreground"
                : monthlySavingsAvailable > 0
                ? "text-success"
                : "text-destructive"
            }`}
          >
            {budgetIncomplete ? "—" : `${formatCurrency(monthlySavingsAvailable)}/mo`}
          </span>
        </div>
        <div className="flex justify-end pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast({ title: "Budget saved", description: "Your budget is up to date." })}
          >
            <Save className="w-3.5 h-3.5 mr-1" /> Save budget
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // ---------- Insights ----------
  const insights: Array<{ text: string; cta: { label: string; onClick: () => void } }> = [];
  if (monthlyNeededForTarget != null && aheadBehindPerMonth != null) {
    if (aheadBehindPerMonth >= 0) {
      insights.push({
        text: `Your current available savings exceeds the required monthly contribution by ${formatCurrency(
          aheadBehindPerMonth,
        )}.`,
        cta: { label: "Keep current plan", onClick: () => toast({ title: "Nice work — keep going." }) },
      });
    } else {
      const cutForOneMonth = Math.round(shortfall);
      insights.push({
        text: `Reducing monthly expenses by ${formatCurrency(
          cutForOneMonth,
        )} would put you back on pace.`,
        cta: {
          label: "Adjust budget",
          onClick: () => document.getElementById("budget-anchor")?.scrollIntoView({ behavior: "smooth" }),
        },
      });
    }
  }
  if (monthlySavingsAvailable > 0 && remaining > 0) {
    const boost = 300;
    const currentMonths = monthsToGoal ?? Infinity;
    const boosted = Math.ceil(remaining / (monthlySavingsAvailable + boost));
    const monthsSaved = Number.isFinite(currentMonths) ? currentMonths - boosted : null;
    if (monthsSaved && monthsSaved > 0) {
      insights.push({
        text: `Saving an additional ${formatCurrency(boost)} per month would reach your goal about ${monthsSaved} month${
          monthsSaved === 1 ? "" : "s"
        } sooner.`,
        cta: {
          label: "Explore a faster plan",
          onClick: () => document.getElementById("simulator-anchor")?.scrollIntoView({ behavior: "smooth" }),
        },
      });
    }
  }
  if (budgetIncomplete) {
    insights.push({
      text: "We need your income and expenses to personalize recommendations.",
      cta: {
        label: "Complete budget",
        onClick: () => document.getElementById("budget-anchor")?.scrollIntoView({ behavior: "smooth" }),
      },
    });
  }

  const insightsCard = (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          Ways to Reach Your Goal Faster
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Add a bit more info and we'll suggest ways to reach your goal sooner.
          </p>
        ) : (
          insights.map((ins, i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-md border border-border p-3"
            >
              <p className="text-sm text-foreground">{ins.text}</p>
              <Button size="sm" variant="outline" onClick={ins.cta.onClick} className="shrink-0">
                {ins.cta.label}
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );

  // ---------- Simulator ----------
  const simCard = (
    <Card id="simulator-anchor">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            Explore Your Options
          </CardTitle>
          {simActive && (
            <Button size="sm" variant="ghost" onClick={resetSim}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Extra monthly savings: {formatCurrency(sim.extraMonthly)}</Label>
            <Slider
              value={[sim.extraMonthly]}
              min={0}
              max={2000}
              step={25}
              onValueChange={([v]) => setSim((s) => ({ ...s, extraMonthly: v }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>One-time contribution: {formatCurrency(sim.lumpSum)}</Label>
            <Slider
              value={[sim.lumpSum]}
              min={0}
              max={20000}
              step={250}
              onValueChange={([v]) => setSim((s) => ({ ...s, lumpSum: v }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Cut expenses by: {formatCurrency(sim.expenseCut)}</Label>
            <Slider
              value={[sim.expenseCut]}
              min={0}
              max={Math.max(200, Math.round(totalExpenses))}
              step={25}
              onValueChange={([v]) => setSim((s) => ({ ...s, expenseCut: v }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              Shift timeline: {sim.monthsDelta > 0 ? "+" : ""}
              {sim.monthsDelta} mo
            </Label>
            <Slider
              value={[sim.monthsDelta]}
              min={-12}
              max={24}
              step={1}
              onValueChange={([v]) => setSim((s) => ({ ...s, monthsDelta: v }))}
            />
          </div>
        </div>
        {simProjection && (
          <div className="rounded-md border border-accent/30 bg-accent/5 p-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">New date</p>
              <p className="font-semibold">{fmtDate(simProjection.projectedGoalDate)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Required / mo
              </p>
              <p className="font-semibold">
                {simProjection.monthlyNeededForTarget != null
                  ? formatCurrency(simProjection.monthlyNeededForTarget)
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Months saved
              </p>
              <p className="font-semibold">
                {monthsToGoal != null && simProjection.monthsToGoal != null
                  ? Math.max(0, monthsToGoal - simProjection.monthsToGoal)
                  : "—"}
              </p>
            </div>
          </div>
        )}
        <div className="flex justify-end">
          <Button size="sm" onClick={applySim} disabled={!simActive}>
            Apply to my plan
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // ---------- Readiness ----------
  const readinessItems: Array<{
    key: keyof ReadinessTargets;
    savedKey: keyof ReadinessTargets;
    label: string;
    target: number;
    saved: number;
  }> = [
    {
      key: "closingCosts",
      savedKey: "savedClosing",
      label: "Down payment",
      target: goal,
      saved: currentSavings,
    },
    {
      key: "closingCosts",
      savedKey: "savedClosing",
      label: "Closing costs",
      target: meta.readiness.closingCosts,
      saved: meta.readiness.savedClosing,
    },
    {
      key: "emergencyReserve",
      savedKey: "savedEmergency",
      label: "Emergency reserve",
      target: meta.readiness.emergencyReserve,
      saved: meta.readiness.savedEmergency,
    },
    {
      key: "moving",
      savedKey: "savedMoving",
      label: "Moving expenses",
      target: meta.readiness.moving,
      saved: meta.readiness.savedMoving,
    },
    {
      key: "initialHome",
      savedKey: "savedInitial",
      label: "Initial home expenses",
      target: meta.readiness.initialHome,
      saved: meta.readiness.savedInitial,
    },
  ];

  const readinessStatus = (target: number, saved: number) => {
    if (target === 0) return { label: "Info needed", cls: "text-muted-foreground bg-muted" };
    if (saved >= target) return { label: "Complete", cls: "text-success bg-success/10" };
    if (saved > 0) return { label: "In progress", cls: "text-accent bg-accent/10" };
    return { label: "Not started", cls: "text-warning bg-warning/10" };
  };

  const readinessCard = (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Home className="w-4 h-4 text-accent" />
          Home-Buying Savings Readiness
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {readinessItems.map((item, i) => {
          const pct = item.target > 0 ? Math.min(100, (item.saved / item.target) * 100) : 0;
          const st = readinessStatus(item.target, item.saved);
          return (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium text-foreground">{item.label}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${st.cls}`}>
                  {st.label}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  {formatCurrency(item.saved)}{" "}
                  {item.target > 0 && <>of {formatCurrency(item.target)}</>}
                </span>
                {i > 0 && (
                  <div className="flex items-center gap-1">
                    <NumberField
                      value={item.target}
                      onChange={(n) =>
                        setMeta((m) => ({
                          ...m,
                          readiness: { ...m.readiness, [item.key]: n ?? 0 },
                        }))
                      }
                      placeholder="Target"
                      className="h-7 w-20 text-xs"
                      ariaLabel={`${item.label} target`}
                    />
                    <NumberField
                      value={item.saved}
                      onChange={(n) =>
                        setMeta((m) => ({
                          ...m,
                          readiness: { ...m.readiness, [item.savedKey]: n ?? 0 },
                        }))
                      }
                      placeholder="Saved"
                      className="h-7 w-20 text-xs"
                      ariaLabel={`${item.label} saved`}
                    />
                  </div>
                )}
              </div>
              <Progress value={pct} className="h-1.5" />
            </div>
          );
        })}
        <p className="text-[11px] text-muted-foreground pt-2 border-t border-border">
          This planner provides educational estimates and does not represent mortgage
          approval, loan qualification, or financial advice.
        </p>
        <div className="flex justify-end">
          <Link to="/buyers">
            <Button size="sm" variant="outline">
              See what I may be able to afford <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  // ---------- Monthly Check-In ----------
  const period = currentPeriod();
  const thisMonth = meta.thisMonthPeriod === period ? meta.thisMonthSaved ?? 0 : 0;
  const monthDelta =
    monthlyNeededForTarget != null ? thisMonth - monthlyNeededForTarget : null;

  const checkInCard = (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="w-4 h-4 text-accent" />
          This Month's Check-In
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="this-month">Saved this month</Label>
            <NumberField
              id="this-month"
              value={meta.thisMonthPeriod === period ? meta.thisMonthSaved : null}
              onChange={(n) =>
                setMeta((m) => ({ ...m, thisMonthSaved: n, thisMonthPeriod: period }))
              }
              placeholder="0"
              allowEmpty
            />
          </div>
          <div className="space-y-1.5">
            <Label>Monthly target</Label>
            <p className="text-sm font-semibold text-foreground pt-2">
              {monthlyNeededForTarget != null ? formatCurrency(monthlyNeededForTarget) : "—"}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <p
              className={`text-sm font-semibold pt-2 ${
                monthDelta == null
                  ? "text-muted-foreground"
                  : monthDelta >= 0
                  ? "text-success"
                  : "text-warning"
              }`}
            >
              {monthDelta == null
                ? "Add this month's savings"
                : monthDelta >= 0
                ? `${formatCurrency(monthDelta)} ahead`
                : `${formatCurrency(Math.abs(monthDelta))} behind`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // ---------- Next Best Step ----------
  const nextSteps =
    remaining <= 0
      ? [
          { label: "Review purchasing power", to: "/buyers" },
          { label: "Estimate closing costs", to: "/buyers" },
          { label: "Explore home-buying programs", to: "/buyers/programs" },
        ]
      : [
          budgetIncomplete && { label: "Complete your monthly budget", to: "#budget-anchor" },
          { label: "Add this month's savings", to: "#checkin-anchor" },
          monthlyNeededForTarget != null && {
            label: "Review your required monthly contribution",
            to: "#simulator-anchor",
          },
          { label: "Explore ways to reach the goal sooner", to: "#simulator-anchor" },
        ].filter(Boolean) as Array<{ label: string; to: string }>;

  const nextStepCard = (
    <Card className="border-accent/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="w-4 h-4 text-accent" />
          {remaining <= 0 ? "You reached your savings goal 🎉" : "Your next best step"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {nextSteps.map((s, i) =>
          s.to.startsWith("#") ? (
            <Button
              key={i}
              size="sm"
              variant={i === 0 ? "default" : "outline"}
              onClick={() =>
                document
                  .getElementById(s.to.slice(1))
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              {s.label} <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          ) : (
            <Link key={i} to={s.to}>
              <Button size="sm" variant={i === 0 ? "default" : "outline"}>
                {s.label} <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          ),
        )}
      </CardContent>
    </Card>
  );

  // ---------- Skeleton ----------
  if (!hydrated) {
    return (
      <div className="space-y-4">
        <div className="h-40 rounded-lg bg-muted animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
        <div className="h-56 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div id="savings-planner" className="space-y-4">
      <MobileStickyStatus
        sentinelRef={heroRef as unknown as React.RefObject<HTMLElement>}
        status={status}
        progressPct={goalProgress}
      />

      <Card
        ref={heroRef}
        className="overflow-hidden rounded-3xl border-2 border-foreground shadow-[6px_6px_0_0_hsl(var(--foreground))] animate-fade-in"
      >
        <CardContent className="p-0">
          <div className="flex flex-col xl:flex-row">
            <div className="p-5 sm:p-6 md:p-7 xl:w-[42%] shrink-0 border-b xl:border-b-0 xl:border-r border-foreground/10 bg-accent/5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Savings Planner · {meta.goalName}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingGoal((v) => !v)}
                  className="text-xs h-8 -mt-1 shrink-0"
                >
                  {editingGoal ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1" /> Done
                    </>
                  ) : (
                    <>
                      <Pencil className="w-3.5 h-3.5 mr-1" /> Edit goal
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-5 space-y-3">
                <StatusBadge status={status} />
                <h2 className="font-serif text-5xl md:text-7xl font-semibold leading-none text-foreground">
                  <AnimatedNumber value={currentSavings} format={formatCurrency} />
                </h2>
                <p className="font-serif italic text-xl md:text-2xl text-muted-foreground">
                  of {formatCurrency(goal)} saved
                </p>
              </div>

              <div className="mt-5 space-y-2">
                <Progress value={goalProgress} className="h-2" />
                <p className="text-sm text-foreground/80">
                  {remaining > 0
                    ? `Only ${formatCurrency(remaining)} left.`
                    : "You've reached your goal 🎉"}{" "}
                  {projectedGoalDate && remaining > 0
                    ? `On pace for ${fmtDate(projectedGoalDate)}.`
                    : ""}
                </p>
              </div>

              {editingGoal && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-4 border-t border-border">
                  <div className="space-y-1.5">
                    <Label htmlFor="goal-name">Goal name</Label>
                    <Input
                      id="goal-name"
                      value={meta.goalName}
                      onChange={(e) => setMeta((m) => ({ ...m, goalName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="goal-amount">Savings goal</Label>
                    <NumberField
                      id="goal-amount"
                      value={goal}
                      onChange={(n) => setGoal(n ?? 0)}
                      placeholder="50000"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="current-savings">Current savings</Label>
                    <NumberField
                      id="current-savings"
                      value={currentSavings}
                      onChange={(n) => setCurrentSavings(n ?? 0)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="monthly-income">Monthly take-home</Label>
                    <NumberField
                      id="monthly-income"
                      value={monthlyIncome}
                      onChange={(n) => setMonthlyIncome(n ?? 0)}
                      placeholder="5000"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="target-months">Target timeline (months)</Label>
                    <NumberField
                      id="target-months"
                      value={targetMonths}
                      onChange={(n) => setTargetMonths(Math.max(1, n ?? 1))}
                      placeholder="24"
                      min={1}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Target date: {fmtDate(targetDate)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 p-5 sm:p-6 md:p-7 space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                {[
                  {
                    label: "Remaining",
                    value: formatCurrency(remaining),
                    hint: `of ${formatCurrency(goal)} goal`,
                  },
                  {
                    label: "Required / mo",
                    value: monthlyNeededForTarget != null ? formatCurrency(monthlyNeededForTarget) : "—",
                    hint: monthlyNeededForTarget != null ? `to hit ${fmtDate(targetDate)}` : "Set a timeline",
                  },
                  {
                    label: "Available / mo",
                    value: budgetIncomplete ? "—" : formatCurrency(monthlySavingsAvailable),
                    hint: budgetIncomplete
                      ? "Complete budget"
                      : savingsRate != null
                      ? `${savingsRate.toFixed(1)}% of income`
                      : "",
                  },
                  {
                    label: "Projected",
                    value: fmtDate(projectedGoalDate),
                    hint: monthsToGoal != null ? `in ${fmtTime(monthsToGoal)}` : "Add savings to project",
                  },
                ].map((item, i) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-border/70 bg-background/70 p-3 transition-all duration-200 hover:border-accent/50 hover:-translate-y-0.5"
                    style={{ animationDelay: `${80 + i * 60}ms`, animationFillMode: "backwards" }}
                  >
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="font-serif text-lg sm:text-xl font-semibold text-foreground mt-1 tabular-nums">
                      {item.value}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">{item.hint}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-4 pt-5 border-t border-foreground/5">
                <div className="rounded-xl border border-accent/30 p-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                    <p className="font-serif text-base font-semibold text-foreground">Projection</p>
                  </div>
                  <TrajectoryChart
                    data={(simProjection ?? projection).projectionSeries}
                    goal={simProjection?.projectionSeries[0]?.goal ?? goal}
                    currentSavings={currentSavings + (simProjection ? sim.lumpSum : 0)}
                  />
                  {milestoneTimeline}
                </div>

                <div className="rounded-xl border border-border/70 bg-accent/5 p-4 transition-all duration-300 hover:border-accent/40 hover:-translate-y-0.5">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-accent" />
                    <p className="font-serif text-base font-semibold text-foreground">Savings Health</p>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className={`font-serif text-4xl font-semibold ${healthColor}`}>
                      {healthScore}
                    </span>
                    <span className="text-sm text-muted-foreground">/ 100 · {healthLabel}</span>
                  </div>
                  <Progress value={healthScore} className="h-2 mt-3" />
                  <div className="mt-4 space-y-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-success">
                        Helping your score
                      </p>
                      {helpingReasons.length ? (
                        <ul className="mt-1 text-xs text-foreground space-y-1">
                          {helpingReasons.map((r) => (
                            <li key={r.key}>• {r.helping}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground">Enter more info to build strengths.</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-warning">
                        Needs attention
                      </p>
                      {hurtingReasons.length ? (
                        <ul className="mt-1 text-xs text-foreground space-y-1">
                          {hurtingReasons.map((r) => (
                            <li key={r.key}>• {r.hurting}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground">Nothing pressing — great work.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div
        className="animate-fade-in transition-all duration-300 hover:-translate-y-0.5"
        style={{ animationDelay: "120ms", animationFillMode: "backwards" }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4 text-accent" />
              Your Plan
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Budget, readiness, monthly check-in, and what-ifs — all in one place.
            </p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="budget" className="w-full">
              <TabsList className="grid grid-cols-2 sm:grid-cols-4 h-auto gap-1 bg-muted/60 p-1">
                <TabsTrigger value="budget" className="text-xs sm:text-sm py-2">
                  <Wallet className="w-3.5 h-3.5 mr-1.5" />
                  Budget
                </TabsTrigger>
                <TabsTrigger value="readiness" className="text-xs sm:text-sm py-2">
                  <Home className="w-3.5 h-3.5 mr-1.5" />
                  Readiness
                </TabsTrigger>
                <TabsTrigger value="checkin" className="text-xs sm:text-sm py-2">
                  <Calendar className="w-3.5 h-3.5 mr-1.5" />
                  Check-In
                </TabsTrigger>
                <TabsTrigger value="explore" className="text-xs sm:text-sm py-2">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Explore
                </TabsTrigger>
              </TabsList>

              <div
                className="mt-4 [&_[role=tabpanel]>div]:border-0 [&_[role=tabpanel]>div]:shadow-none [&_[role=tabpanel]>div]:bg-transparent [&_[role=tabpanel]>div]:rounded-none [&_[role=tabpanel]>div>div]:px-0 [&_[role=tabpanel]>div>div]:pt-0 [&_[role=tabpanel]>div>div:first-child]:pb-3"
              >
                <TabsContent value="budget" id="budget-anchor" className="mt-0 animate-fade-in">
                  {budgetCard}
                </TabsContent>
                <TabsContent value="readiness" className="mt-0 animate-fade-in">
                  {readinessCard}
                </TabsContent>
                <TabsContent value="checkin" id="checkin-anchor" className="mt-0 animate-fade-in">
                  {checkInCard}
                </TabsContent>
                <TabsContent value="explore" className="mt-0 animate-fade-in">
                  {simCard}
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        <div
          className="mt-4 animate-fade-in"
          style={{ animationDelay: "200ms", animationFillMode: "backwards" }}
        >
          {insightsCard}
        </div>

        <Link
          to="/buyers"
          className="block mt-4 animate-fade-in"
          style={{ animationDelay: "240ms", animationFillMode: "backwards" }}
        >
          <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12 text-sm font-semibold transition-transform duration-200 hover:-translate-y-0.5">
            See what I may be able to afford
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>


      <p className="text-[11px] leading-relaxed text-muted-foreground text-center italic max-w-3xl mx-auto pt-2">
        This planner provides educational estimates and does not represent mortgage
        approval, loan qualification, or financial advice.
      </p>
    </div>
  );
}
