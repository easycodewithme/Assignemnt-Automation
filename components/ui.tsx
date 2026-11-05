import { DEPT_BY_ID, type DepartmentId } from "@/lib/departments";
import type { Grievance, Status, Urgency } from "@/lib/types";

export function UrgencyPill({ u }: { u: Urgency }) {
  const cls = u === "high" ? "bg-danger/10 text-danger" : u === "medium" ? "bg-saffron/10 text-saffron" : "bg-slate-100 text-slate-600";
  return <span className={`pill ${cls}`}>{u} urgency</span>;
}

const STATUS_LABEL: Record<Status, string> = {
  needs_review: "Needs review", assigned: "Assigned", in_progress: "In progress", resolved: "Resolved",
};
export function StatusPill({ s }: { s: Status }) {
  const cls = s === "needs_review" ? "bg-saffron/15 text-saffron" : s === "resolved" ? "bg-emerald-100 text-emerald-700" : "bg-teal-soft text-teal";
  return <span className={`pill ${cls}`}>{STATUS_LABEL[s]}</span>;
}

export function DeptName({ id }: { id: DepartmentId }) {
  return <span>{DEPT_BY_ID[id].name}</span>;
}

export function Confidence({ c }: { c: number }) {
  const pct = Math.round(c * 100);
  const color = c >= 0.7 ? "bg-teal" : c >= 0.5 ? "bg-saffron" : "bg-danger";
  return (
    <span className="inline-flex items-center gap-2 text-xs text-slate-600">
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
        <span className={`block h-full ${color}`} style={{ width: `${pct}%` }} />
      </span>
      {pct}%
    </span>
  );
}

export function History({ g }: { g: Grievance }) {
  return (
    <ol className="space-y-1 text-xs text-slate-600">
      {g.history.map((h, i) => (
        <li key={i}>
          <span className="text-muted">{new Date(h.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>{" "}
          · <b className="text-ink">{h.actor}</b>: {h.action}
        </li>
      ))}
    </ol>
  );
}

export function Loading() {
  return <p className="text-sm text-muted">Loading…</p>;
}
