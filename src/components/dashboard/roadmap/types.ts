export type PhaseId =
  | "financial"
  | "documents"
  | "mortgage"
  | "search"
  | "offer"
  | "closing";

export type TaskCategory = "auto" | "manual" | "document" | "external";
export type TaskStatus = "not_started" | "in_progress" | "complete";
export type DocStatus =
  | "not_started"
  | "requested"
  | "uploaded"
  | "ready"
  | "needs_update";
export type EmploymentType =
  | "w2"
  | "self_employed"
  | "1099"
  | "retired"
  | "multiple"
  | "other";

export interface TaskDef {
  id: string;
  phase: PhaseId;
  title: string;
  summary: string;
  why?: string;
  effort?: string;
  category: TaskCategory;
  cta?: { label: string; to?: string; tab?: string };
  /** When true, task hidden unless predicate matches user context. */
  appliesTo?: (ctx: { employment: EmploymentType | null }) => boolean;
  /** Source label shown when auto-completed. */
  autoSource?: string;
}

export interface PhaseDef {
  id: PhaseId;
  name: string;
  shortName: string;
  description: string;
}

export interface TaskState {
  status?: TaskStatus;
  doc_status?: DocStatus;
  note?: string;
  updated_at?: string;
}

export interface RoadmapProgressRow {
  user_id: string;
  tasks: Record<string, TaskState>;
  employment_type: EmploymentType | null;
  readiness_meta: Record<string, unknown>;
}
