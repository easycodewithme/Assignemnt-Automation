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
}
