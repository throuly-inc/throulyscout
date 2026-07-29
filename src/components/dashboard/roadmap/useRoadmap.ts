import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PHASES, TASKS, LEGACY_ID_MAP } from "./phases";
import type {
  DocStatus,
  EmploymentType,
  PhaseDef,
  PhaseId,
  TaskDef,
  TaskState,
  TaskStatus,
} from "./types";

const LOCAL_KEY = "throuly_roadmap_progress_v1";
const LEGACY_KEY = "throuly_home_purchase_planner";

interface PhaseSummary {
  phase: PhaseDef;
  tasks: TaskDef[];
  completed: number;
  total: number;
  percent: number;
  status: "not_started" | "in_progress" | "complete";
}

export interface RoadmapView {
  loading: boolean;
  error: string | null;
  employment: EmploymentType | null;
  taskStates: Record<string, TaskState>;
  applicableTasks: TaskDef[];
  autoCompletedIds: Set<string>;
  autoReasons: Record<string, string>;
  phaseSummaries: PhaseSummary[];
  overallCompleted: number;
  overallTotal: number;
  overallPercent: number;
  currentPhase: PhaseDef;
  nextBestStep: TaskDef | null;
  secondaryStep: TaskDef | null;
  strengths: string[];
  needsAttention: string[];
  infoNeeded: string[];
  savingsGoal: number;
  savingsCurrent: number;
  updateTask: (taskId: string, patch: Partial<TaskState>) => void;
  setEmployment: (v: EmploymentType) => void;
}

interface SignalContext {
  hasSavingsGoal: boolean;
  hasBudget: boolean;
  hasSavedEstimate: boolean;
  hasCreditScore: boolean;
  hasLocations: boolean;
  hasMustHaves: boolean;
}

function loadLocal(): { tasks: Record<string, TaskState>; employment: EmploymentType | null } {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  // migrate legacy
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy) as Record<string, boolean>;
      const tasks: Record<string, TaskState> = {};
      Object.entries(parsed).forEach(([oldId, done]) => {
        const newId = LEGACY_ID_MAP[oldId];
        if (newId && done) tasks[newId] = { status: "complete" };
      });
      return { tasks, employment: null };
    }
  } catch { /* ignore */ }
  return { tasks: {}, employment: null };
}

function saveLocal(tasks: Record<string, TaskState>, employment: EmploymentType | null) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify({ tasks, employment }));
  } catch { /* ignore */ }
}

export function useRoadmap(userId: string | null): RoadmapView {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskStates, setTaskStates] = useState<Record<string, TaskState>>({});
  const [employment, setEmploymentState] = useState<EmploymentType | null>(null);
  const [signals, setSignals] = useState<SignalContext>({
    hasSavingsGoal: false,
    hasBudget: false,
    hasSavedEstimate: false,
    hasCreditScore: false,
    hasLocations: false,
    hasMustHaves: false,
  });
  const [savingsGoal, setSavingsGoal] = useState(0);
  const [savingsCurrent, setSavingsCurrent] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const local = loadLocal();
      if (!cancelled) {
        setTaskStates(local.tasks);
        setEmploymentState(local.employment);
      }
      if (!userId) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const [rp, sp, sr, bq, ufp] = await Promise.all([
          supabase.from("roadmap_progress").select("tasks, employment_type").eq("user_id", userId).maybeSingle(),
          supabase.from("savings_plans").select("goal, current_savings, monthly_income, expenses").eq("user_id", userId).maybeSingle(),
          supabase.from("saved_results").select("id").eq("user_id", userId).limit(1),
          supabase.from("buyer_questionnaires").select("preferred_states, preferred_cities, property_type, bedrooms_min").eq("user_id", userId).maybeSingle(),
          supabase.from("user_financial_profiles").select("credit_score").eq("user_id", userId).maybeSingle(),
        ]);
        if (cancelled) return;

        if (rp.data) {
          const merged = { ...local.tasks, ...(rp.data.tasks as Record<string, TaskState> ?? {}) };
          setTaskStates(merged);
          setEmploymentState((rp.data.employment_type as EmploymentType | null) ?? local.employment);
        } else if (Object.keys(local.tasks).length > 0) {
          // Migrate local to remote
          await supabase.from("roadmap_progress").upsert([{
            user_id: userId,
            tasks: local.tasks as any,
            employment_type: local.employment ?? undefined,
          }]);

          try { localStorage.removeItem(LEGACY_KEY); } catch { /* ignore */ }
        }

        const goal = Number(sp.data?.goal ?? 0);
        const currentSavings = Number(sp.data?.current_savings ?? 0);
        const income = Number(sp.data?.monthly_income ?? 0);
        const expenses = sp.data?.expenses;
        const hasExpenses = Array.isArray(expenses)
          ? expenses.some((e) => e && typeof e === "object" && Number((e as { amount?: unknown }).amount) > 0)
          : false;
        setSavingsGoal(goal);
        setSavingsCurrent(currentSavings);

        const bqRow = bq.data;
        setSignals({
          hasSavingsGoal: goal > 0,
          hasBudget: income > 0 && hasExpenses,
          hasSavedEstimate: !!sr.data && sr.data.length > 0,
          hasCreditScore: !!ufp.data?.credit_score,
          hasLocations: !!(bqRow?.preferred_states?.length || bqRow?.preferred_cities?.length),
          hasMustHaves: !!(bqRow?.property_type || bqRow?.bedrooms_min),
        });
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load roadmap");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  // Debounced persist
  const persist = useCallback((tasks: Record<string, TaskState>, emp: EmploymentType | null) => {
    saveLocal(tasks, emp);
    if (!userId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      supabase.from("roadmap_progress").upsert([{
        user_id: userId,
        tasks: tasks as any,
        employment_type: emp ?? undefined,
      }]).then(({ error: err }) => {
        if (err) console.warn("roadmap upsert failed", err.message);
      });

    }, 500);
  }, [userId]);

  const updateTask = useCallback((taskId: string, patch: Partial<TaskState>) => {
    setTaskStates((prev) => {
      const next = { ...prev, [taskId]: { ...prev[taskId], ...patch, updated_at: new Date().toISOString() } };
      persist(next, employment);
      return next;
    });
  }, [persist, employment]);

  const setEmployment = useCallback((v: EmploymentType) => {
    setEmploymentState(v);
    persist(taskStates, v);
  }, [persist, taskStates]);

  const applicableTasks = useMemo(
    () => TASKS.filter((t) => !t.appliesTo || t.appliesTo({ employment })),
    [employment]
  );

  const autoReasons = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    if (signals.hasSavingsGoal) map.down_payment_goal = "Detected from your Savings Planner goal";
    if (signals.hasBudget) map.monthly_budget = "Detected from your Savings Planner budget";
    if (signals.hasSavedEstimate) map.affordability_estimate = "Detected from your saved estimate";
    if (signals.hasCreditScore) map.credit_score = "Detected from your financial profile";
    if (signals.hasLocations) map.locations = "Detected from your buyer preferences";
    if (signals.hasMustHaves) map.must_haves = "Detected from your buyer preferences";
    return map;
  }, [signals]);

  const autoCompletedIds = useMemo(() => new Set(Object.keys(autoReasons)), [autoReasons]);

  const isComplete = useCallback((t: TaskDef): boolean => {
    if (autoCompletedIds.has(t.id)) return true;
    const s = taskStates[t.id];
    if (t.category === "document") {
      return s?.doc_status === "ready" || s?.doc_status === "uploaded";
    }
    return s?.status === "complete";
  }, [autoCompletedIds, taskStates]);

  const phaseSummaries: PhaseSummary[] = useMemo(() => {
    return PHASES.map((phase) => {
      const phaseTasks = applicableTasks.filter((t) => t.phase === phase.id);
      const completed = phaseTasks.filter(isComplete).length;
      const total = phaseTasks.length;
      const percent = total ? Math.round((completed / total) * 100) : 0;
      const status: PhaseSummary["status"] =
        completed === 0 ? "not_started" : completed === total ? "complete" : "in_progress";
      return { phase, tasks: phaseTasks, completed, total, percent, status };
    });
  }, [applicableTasks, isComplete]);

  const overallCompleted = phaseSummaries.reduce((sum, p) => sum + p.completed, 0);
  const overallTotal = phaseSummaries.reduce((sum, p) => sum + p.total, 0);
  const overallPercent = overallTotal ? Math.round((overallCompleted / overallTotal) * 100) : 0;

  const currentPhase = useMemo(() => {
    const first = phaseSummaries.find((p) => p.status !== "complete");
    return (first ?? phaseSummaries[phaseSummaries.length - 1]).phase;
  }, [phaseSummaries]);

  // Next-best-step priority: financial foundations > docs > mortgage > search > offer > closing
  const nextBestStep = useMemo<TaskDef | null>(() => {
    const priority: string[] = [
      "affordability_estimate",
      "credit_score",
      "monthly_budget",
      "down_payment_goal",
      "closing_costs_budget",
      "emergency_reserve",
      "reduce_debt",
    ];
    for (const id of priority) {
      const t = applicableTasks.find((x) => x.id === id);
      if (t && !isComplete(t)) return t;
    }
    for (const p of phaseSummaries) {
      const t = p.tasks.find((x) => !isComplete(x));
      if (t) return t;
    }
    return null;
  }, [applicableTasks, isComplete, phaseSummaries]);

  const secondaryStep = useMemo<TaskDef | null>(() => {
    if (!nextBestStep) return null;
    for (const p of phaseSummaries) {
      const t = p.tasks.find((x) => !isComplete(x) && x.id !== nextBestStep.id);
      if (t) return t;
    }
    return null;
  }, [nextBestStep, phaseSummaries, isComplete]);

  const strengths: string[] = useMemo(() => {
    const s: string[] = [];
    if (signals.hasSavingsGoal) s.push("Down-payment goal set");
    if (signals.hasBudget) s.push("Monthly budget completed");
    if (signals.hasSavedEstimate) s.push("Affordability estimate saved");
    if (signals.hasLocations) s.push("Preferred locations chosen");
    if (signals.hasCreditScore) s.push("Credit information on file");
    return s;
  }, [signals]);

  const needsAttention: string[] = useMemo(() => {
    const n: string[] = [];
    if (!signals.hasCreditScore) n.push("Credit information has not been reviewed");
    if (!signals.hasSavingsGoal) n.push("Down-payment goal is not set");
    if (!signals.hasBudget) n.push("Monthly budget is incomplete");
    if (!taskStates.closing_costs_budget) n.push("Closing costs are not planned yet");
    if (!taskStates.emergency_reserve) n.push("Emergency reserve is not planned yet");
    if (!isComplete(TASKS.find((t) => t.id === "preapproved")!)) n.push("Mortgage pre-approval has not been completed");
    return n;
  }, [signals, taskStates, isComplete]);

  const infoNeeded: string[] = useMemo(() => {
    const i: string[] = [];
    if (!employment) i.push("Employment type");
    if (!signals.hasCreditScore) i.push("Estimated credit range");
    if (!signals.hasLocations) i.push("Preferred purchase location");
    if (!signals.hasMustHaves) i.push("Property type or bedrooms");
    return i;
  }, [employment, signals]);

  return {
    loading,
    error,
    employment,
    taskStates,
    applicableTasks,
    autoCompletedIds,
    autoReasons,
    phaseSummaries,
    overallCompleted,
    overallTotal,
    overallPercent,
    currentPhase,
    nextBestStep,
    secondaryStep,
    strengths,
    needsAttention,
    infoNeeded,
    savingsGoal,
    savingsCurrent,
    updateTask,
    setEmployment,
  };
}

export type { PhaseSummary };
export const DOC_STATUS_LABEL: Record<DocStatus, string> = {
  not_started: "Not started",
  requested: "Requested",
  uploaded: "Uploaded",
  ready: "Ready",
  needs_update: "Needs update",
};
export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  complete: "Complete",
};
