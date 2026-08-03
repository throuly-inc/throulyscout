import { useMemo } from "react";

export interface ExpenseRow {
  id: string;
  label: string;
  /** null = incomplete (user hasn't filled it in yet). 0 = confirmed zero. */
  amount: number | null;
}

export type SavingsStatus =
  | "no-data"
  | "goal-reached"
  | "ahead"
  | "on-track"
  | "slightly-behind"
  | "off-track";

export interface ReadinessTargets {
  closingCosts: number;
  emergencyReserve: number;
  moving: number;
  initialHome: number;
  /** Saved-so-far per bucket (down payment inferred from currentSavings vs goal). */
  savedClosing: number;
  savedEmergency: number;
  savedMoving: number;
  savedInitial: number;
}

export interface SavingsInputs {
  goal: number;
  goalName?: string;
  currentSavings: number;
  monthlyIncome: number;
  targetMonths: number;
  expenses: ExpenseRow[];
  /** Optional readiness targets (from meta). */
  readiness?: Partial<ReadinessTargets>;
  /** Optional this-month check-in amount. */
  thisMonthSaved?: number | null;
}

export interface HealthBreakdownItem {
  key: string;
  label: string;
  score: number; // 0..1
  weight: number;
  helping: string | null;
  hurting: string | null;
}

export interface SavingsProjection {
  totalExpenses: number;
  monthlySavingsAvailable: number;
  savingsRate: number | null;
  remaining: number;
  monthsToGoal: number | null;
  monthlyNeededForTarget: number | null;
  shortfall: number;
  goalProgress: number;
  status: SavingsStatus;
  projectionSeries: Array<{ month: number; balance: number; goal: number }>;
  // New fields
  targetDate: Date;
  projectedGoalDate: Date | null;
  aheadBehindPerMonth: number | null;
  budgetIncomplete: boolean;
  negativeCashflow: boolean;
  noTimeline: boolean;
  healthScore: number;
  healthLabel: "Excellent" | "Good" | "Needs attention" | "At risk";
  healthBreakdown: HealthBreakdownItem[];
  readiness: ReadinessTargets;
}

export function addMonths(base: Date, months: number): Date {
  const d = new Date(base);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function computeSavingsProjection(inputs: SavingsInputs): SavingsProjection {
  const {
    goal,
    currentSavings,
    monthlyIncome,
    targetMonths,
    expenses,
    readiness: rIn,
  } = inputs;

  const completedExpenses = expenses.filter((e) => e.amount !== null);
  const anyCompleted = completedExpenses.length > 0;
  const totalExpenses = completedExpenses.reduce(
    (s, e) => s + (Number(e.amount) || 0),
    0,
  );
  const budgetIncomplete = !anyCompleted || monthlyIncome <= 0;
  const negativeCashflow = monthlyIncome > 0 && totalExpenses > monthlyIncome;
  const noTimeline = !(targetMonths > 0);

  const monthlySavingsAvailable = budgetIncomplete
    ? 0
    : Math.max(0, monthlyIncome - totalExpenses);
  const savingsRate = budgetIncomplete
    ? null
    : monthlyIncome > 0
    ? (monthlySavingsAvailable / monthlyIncome) * 100
    : null;

  const remaining = Math.max(0, goal - currentSavings);
  const monthsToGoal =
    remaining <= 0
      ? 0
      : monthlySavingsAvailable > 0
      ? Math.ceil(remaining / monthlySavingsAvailable)
      : null;

  const goalProgress = goal > 0 ? Math.min(100, (currentSavings / goal) * 100) : 0;
  const monthlyNeededForTarget =
    goal <= 0
      ? null
      : targetMonths > 0 && remaining > 0
      ? Math.ceil(remaining / targetMonths)
      : remaining <= 0
      ? 0
      : null;

  const shortfall =
    monthlyNeededForTarget != null
      ? Math.max(0, monthlyNeededForTarget - monthlySavingsAvailable)
      : 0;
  const aheadBehindPerMonth =
    monthlyNeededForTarget != null
      ? monthlySavingsAvailable - monthlyNeededForTarget
      : null;

  const today = new Date();
  const targetDate = addMonths(today, Math.max(1, targetMonths || 24));
  const projectedGoalDate =
    monthsToGoal != null ? addMonths(today, monthsToGoal) : null;

  let status: SavingsStatus;
  if (budgetIncomplete) status = "no-data";
  else if (goal > 0 && currentSavings >= goal) status = "goal-reached";
  else if (aheadBehindPerMonth == null) status = "no-data";
  else if (aheadBehindPerMonth >= (monthlyNeededForTarget || 0) * 0.15) status = "ahead";
  else if (aheadBehindPerMonth >= 0) status = "on-track";
  else if (aheadBehindPerMonth >= -(monthlyNeededForTarget || 1) * 0.15)
    status = "slightly-behind";
  else status = "off-track";

  const horizon = Math.min(
    60,
    Math.max(12, targetMonths || 24, monthsToGoal ?? targetMonths ?? 24),
  );
  const projectionSeries = Array.from({ length: horizon + 1 }, (_, m) => ({
    month: m,
    balance: Math.round(currentSavings + monthlySavingsAvailable * m),
    goal,
  }));

  // Readiness
  const readiness: ReadinessTargets = {
    closingCosts: rIn?.closingCosts ?? 0,
    emergencyReserve: rIn?.emergencyReserve ?? 0,
    moving: rIn?.moving ?? 0,
    initialHome: rIn?.initialHome ?? 0,
    savedClosing: rIn?.savedClosing ?? 0,
    savedEmergency: rIn?.savedEmergency ?? 0,
    savedMoving: rIn?.savedMoving ?? 0,
    savedInitial: rIn?.savedInitial ?? 0,
  };

  // Health breakdown
  const rateScore =
    savingsRate == null ? 0 : Math.min(1, Math.max(0, savingsRate / 20));
  const progressScore = goal > 0 ? Math.min(1, currentSavings / goal) : 0;
  const paceScore =
    monthlyNeededForTarget && monthlyNeededForTarget > 0
      ? Math.min(1, monthlySavingsAvailable / monthlyNeededForTarget)
      : monthlyNeededForTarget === 0
      ? 1
      : 0;
  const emergencyScore =
    readiness.emergencyReserve > 0
      ? Math.min(1, readiness.savedEmergency / readiness.emergencyReserve)
      : 0;
  const closingScore =
    readiness.closingCosts > 0
      ? Math.min(1, readiness.savedClosing / readiness.closingCosts)
      : 0;
  const cashflowScore = budgetIncomplete ? 0 : negativeCashflow ? 0 : 1;

  const breakdown: HealthBreakdownItem[] = [
    {
      key: "rate",
      label: "Savings rate",
      score: rateScore,
      weight: 25,
      helping:
        rateScore >= 0.75 ? "You're saving a healthy share of income." : null,
      hurting: rateScore < 0.5 ? "Savings rate is below 10% of income." : null,
    },
    {
      key: "progress",
      label: "Goal progress",
      score: progressScore,
      weight: 25,
      helping: progressScore >= 0.75 ? "You've made strong progress toward your goal." : null,
      hurting: progressScore < 0.25 ? "You're in the early stretch of your goal." : null,
    },
    {
      key: "pace",
      label: "On pace",
      score: paceScore,
      weight: 20,
      helping: paceScore >= 1 ? "Your current pace meets or exceeds the amount required." : null,
      hurting: paceScore < 0.8 && monthlyNeededForTarget != null
        ? "Current pace is short of your monthly target."
        : null,
    },
    {
      key: "emergency",
      label: "Emergency reserve",
      score: emergencyScore,
      weight: 10,
      helping: emergencyScore >= 1 ? "Emergency reserve is fully funded." : null,
      hurting:
        readiness.emergencyReserve === 0
          ? "Emergency reserve target not set."
          : emergencyScore < 0.5
          ? "Emergency reserve is under half-funded."
          : null,
    },
    {
      key: "closing",
      label: "Closing costs",
      score: closingScore,
      weight: 10,
      helping: closingScore >= 1 ? "Closing costs are covered." : null,
      hurting:
        readiness.closingCosts === 0
          ? "Closing costs not yet accounted for."
          : closingScore < 0.5
          ? "Less than half of closing costs saved."
          : null,
    },
    {
      key: "cashflow",
      label: "Cashflow",
      score: cashflowScore,
      weight: 10,
      helping: cashflowScore === 1 && !budgetIncomplete ? "Income comfortably covers expenses." : null,
      hurting: negativeCashflow ? "Your expenses exceed your monthly income." : null,
    },
  ];

  const healthScore = Math.round(
    breakdown.reduce((s, b) => s + b.score * b.weight, 0),
  );
  const healthLabel: SavingsProjection["healthLabel"] =
    healthScore >= 80
      ? "Excellent"
      : healthScore >= 60
      ? "Good"
      : healthScore >= 40
      ? "Needs attention"
      : "At risk";

  return {
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
    noTimeline,
    healthScore,
    healthLabel,
    healthBreakdown: breakdown,
    readiness,
  };
}

export function useSavingsProjection(inputs: SavingsInputs): SavingsProjection {
  return useMemo(() => computeSavingsProjection(inputs), [
    inputs.goal,
    inputs.currentSavings,
    inputs.monthlyIncome,
    inputs.targetMonths,
    inputs.expenses,
    inputs.readiness,
    inputs.thisMonthSaved,
  ]);
}
