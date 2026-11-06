import type { LucideIcon } from "lucide-react";
import { AlertTriangle, CheckCircle2, CircleDot, Clock, Eye, Inbox, Loader2 } from "lucide-react";
import { DEPT_BY_ID, type DepartmentId } from "@/lib/departments";
import type { Grievance, Status, Urgency } from "@/lib/types";

const URGENCY: Record<Urgency, { label: string; cls: string; icon: LucideIcon }> = {
  high: { label: "High urgency", cls: "bg-danger-soft text-danger", icon: AlertTriangle },
  medium: { label: "Medium urgency", cls: "bg-saffron-soft text-saffron", icon: Clock },
  low: { label: "Low urgency", cls: "bg-slate-100 text-slate-700", icon: CircleDot },
};
export function UrgencyPill({ u }: { u: Urgency }) {
  const { label, cls, icon: Icon } = URGENCY[u] ?? URGENCY.medium;
  return <span className={`pill ${cls}`}><Icon className="size-3.5" aria-hidden />{label}</span>;
}

const STATUS: Record<Status, { label: string; cls: string; icon: LucideIcon }> = {
  needs_review: { label: "Needs review", cls: "bg-saffron-soft text-saffron", icon: Eye },
  assigned: { label: "Assigned", cls: "bg-teal-soft text-teal", icon: Inbox },
  in_progress: { label: "In progress", cls: "bg-blue-50 text-blue-800", icon: Loader2 },
  resolved: { label: "Resolved", cls: "bg-success-soft text-success", icon: CheckCircle2 },
};
export function StatusPill({ s }: { s: Status }) {
  const { label, cls, icon: Icon } = STATUS[s];
  return <span className={`pill ${cls}`}><Icon className="size-3.5" aria-hidden />{label}</span>;
}

export function DeptName({ id }: { id: DepartmentId }) {
  return <span>{DEPT_BY_ID[id].name}</span>;
}

export function Confidence({ c }: { c: number }) {
  const pct = Math.round(c * 100);
  const color = c >= 0.7 ? "bg-teal" : c >= 0.5 ? "bg-saffron-bright" : "bg-danger";
  return (
    <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
      <span className="h-2 w-20 overflow-hidden rounded-full bg-slate-200" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="AI confidence">
        <span className={`block h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </span>
      {pct}%
    </span>
  );
}

const ACTOR_DOT: Record<string, string> = { system: "bg-slate-400", AI: "bg-saffron-bright", clerk: "bg-teal", officer: "bg-blue-700", citizen: "bg-slate-600" };
export function History({ g }: { g: Grievance }) {
  return (
    <ol className="relative space-y-3 border-l-2 border-line pl-5 text-sm">
      {g.history.map((h, i) => (
        <li key={i} className="relative">
          <span className={`absolute -left-[27px] top-1.5 size-3 rounded-full ring-4 ring-white ${ACTOR_DOT[h.actor] ?? "bg-slate-400"}`} aria-hidden />
          <div className="text-xs text-muted">{new Date(h.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} · <span className="font-semibold capitalize text-ink">{h.actor}</span></div>
          <div className="text-ink">{h.action}</div>
        </li>
      ))}
    </ol>
  );
}

export function PageHeader({ eyebrow, title, subtitle, children }: { eyebrow?: string; title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-1">
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1 className="text-2xl font-semibold text-teal sm:text-3xl">{title}</h1>
        {subtitle && <p className="max-w-2xl text-muted">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-teal-soft text-teal"><Icon className="size-6" aria-hidden /></span>
      <p className="font-semibold text-ink">{title}</p>
      {body && <p className="max-w-sm text-sm text-muted">{body}</p>}
    </div>
  );
}

export function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200" />
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200/70" />)}
      </div>
    </div>
  );
}
