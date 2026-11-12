import type { DepartmentId } from "./departments";

export type Urgency = "high" | "medium" | "low";
export type Status = "needs_review" | "assigned" | "in_progress" | "resolved";

/** What the classifier (AI or fallback) returns. */
export interface Classification {
  department: DepartmentId;
  category: string;
  urgency: Urgency;
  language: "hi" | "en" | "mixed";
  summary: string; // one line, English, for the officer
  location: string | null;
  scheme: string | null;
  confidence: number; // 0..1
  reason: string; // why this department (shown to the clerk)
  needsReview: boolean;
  source: string; // e.g. "llm:anthropic/claude-haiku-5-5" or "keyword-fallback"
  maskedText: string; // the exact text that was sent to the AI
  /** Extra problems in the same complaint that belong to other departments (joint case). */
  also?: { department: DepartmentId; summary: string }[];
}

export interface HistoryEntry {
  at: string;
  actor: string; // "system", "AI", "clerk", "officer"
  action: string;
}

export interface Grievance {
  id: string;
  createdAt: string;
  dueAt: string;
  citizenName: string;
  phoneMasked: string;
  block: string;
  text: string;
  status: Status;
  department: DepartmentId;
  ai: Classification;
  resolvedAt?: string;
  history: HistoryEntry[];
  // ---- internal communication ----
  /** Set on the extra parts of a joint case: the tracking ID the citizen holds. */
  jointId?: string;
  notes?: Note[];
  requests?: DeptRequest[];
  transfers?: number;
  /** A second transfer waits for ADM approval (stops ping-pong between departments). */
  pendingTransfer?: { to: DepartmentId; reason: string; by: DepartmentId; at: string };
}

export interface Note { at: string; by: string; text: string }

/** One department asks another for a report / NOC / site visit, with a deadline. */
export interface DeptRequest {
  id: string;
  at: string;
  from: DepartmentId;
  to: DepartmentId;
  ask: string;
  dueAt: string;
  status: "open" | "answered";
  reply?: string;
  answeredAt?: string;
}

/** Circular from the DM office to departments, with acknowledgements. */
export interface Circular { id: string; at: string; title: string; body: string; to: DepartmentId[]; acks: Partial<Record<DepartmentId, string>> }
