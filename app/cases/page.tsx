"use client";
import { useState } from "react";
import { CalendarClock, CheckCircle2, ChevronDown, Filter, Inbox, Play } from "lucide-react";
import { daysLeft, isOverdue, useGrievances } from "@/lib/store";
import { DEPARTMENTS, DEPT_BY_ID, type DepartmentId } from "@/lib/departments";
import { EmptyState, History, Loading, PageHeader, StatusPill, UrgencyPill } from "@/components/ui";

const EDGE = { high: "border-l-danger", medium: "border-l-saffron-bright", low: "border-l-slate-300" } as const;

export default function CasesPage() {
  const { list, update } = useGrievances();
  const [dept, setDept] = useState<DepartmentId | "ALL">("ALL");
  const [showResolved, setShowResolved] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  if (!list) return <Loading />;

  const rows = list
    .filter((g) => g.status !== "needs_review")
    .filter((g) => dept === "ALL" || g.department === dept)
    .filter((g) => showResolved || g.status !== "resolved")
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  const overdueCount = rows.filter((g) => isOverdue(g)).length;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Officer" title="Department cases" subtitle="Each officer sees their own department. Sorted by deadline, overdue first." />

      <div className="card flex flex-wrap items-center gap-3 p-3 sm:p-4">
        <Filter className="size-4 text-muted" aria-hidden />
        <label htmlFor="dept-filter" className="sr-only">Department</label>
        <select id="dept-filter" className="input w-auto min-w-56 cursor-pointer" value={dept} onChange={(e) => setDept(e.target.value as DepartmentId | "ALL")}>
          <option value="ALL">All departments</option>
          {DEPARTMENTS.filter((d) => d.id !== "OTHER").map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" className="size-4 accent-teal" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} /> Show resolved
        </label>
        <span className="ml-auto text-sm text-muted">{rows.length} case(s){overdueCount > 0 && <> · <b className="text-danger">{overdueCount} overdue</b></>}</span>
      </div>

      <div className="space-y-3">
        {rows.length === 0 && <div className="card"><EmptyState icon={Inbox} title="No cases here" body="Try another department, or include resolved cases." /></div>}
        {rows.map((g) => {
          const left = daysLeft(g);
          const overdue = isOverdue(g);
          const expanded = open === g.id;
          const dueCls = g.status === "resolved" ? "bg-success-soft text-success" : overdue ? "bg-danger-soft text-danger" : left <= 2 ? "bg-saffron-soft text-saffron" : "bg-slate-100 text-slate-700";
          return (
            <article key={g.id} className={`card border-l-4 p-4 sm:p-5 ${EDGE[g.ai.urgency] ?? EDGE.medium}`}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <button className="inline-flex min-h-9 cursor-pointer items-center gap-1 font-mono text-sm font-semibold text-teal hover:underline"
                  aria-expanded={expanded} onClick={() => setOpen(expanded ? null : g.id)}>
                  {g.id}<ChevronDown className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden />
                </button>
                <StatusPill s={g.status} />
                <UrgencyPill u={g.ai.urgency} />
                <span className="text-sm text-muted">{DEPT_BY_ID[g.department].name} · {g.block}</span>
                <span className={`pill ml-auto px-3 py-1 text-sm ${dueCls}`}>
                  <CalendarClock className="size-4" aria-hidden />
                  {g.status === "resolved" ? "Done" : overdue ? `Overdue by ${-left} day(s)` : `${left} day(s) left`}
                </span>
              </div>
              <p className="mt-2 text-ink">{g.ai.summary}</p>
              {expanded && (
                <div className="mt-4 space-y-4 rounded-lg bg-slate-50 p-4">
                  <p className="text-sm"><span className="font-semibold text-muted">Original:</span> {g.text}</p>
                  <History g={g} />
                </div>
              )}
              {g.status !== "resolved" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {g.status === "assigned" && (
                    <button className="btn-ghost" onClick={() => update(g.id, { status: "in_progress" }, "officer", "Started work; field verification requested")}><Play className="size-4" aria-hidden /> Start work</button>
                  )}
                  <button className="btn-ghost" onClick={() => update(g.id, { status: "resolved", resolvedAt: new Date().toISOString() }, "officer", "Marked resolved; citizen informed by SMS")}><CheckCircle2 className="size-4" aria-hidden /> Mark resolved</button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
