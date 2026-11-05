"use client";
import { useState } from "react";
import { daysLeft, isOverdue, useGrievances } from "@/lib/store";
import { DEPARTMENTS, DEPT_BY_ID, type DepartmentId } from "@/lib/departments";
import { History, Loading, StatusPill, UrgencyPill } from "@/components/ui";

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

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-teal">Officer cases</h1>
          <p className="text-sm text-muted">Each officer sees their own department. Sorted by deadline; overdue first.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <select className="input w-auto" value={dept} onChange={(e) => setDept(e.target.value as DepartmentId | "ALL")}>
            <option value="ALL">All departments</option>
            {DEPARTMENTS.filter((d) => d.id !== "OTHER").map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <label className="flex items-center gap-2"><input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} /> Show resolved</label>
        </div>
      </div>

      <div className="card divide-y divide-slate-100">
        {rows.length === 0 && <p className="p-5 text-sm text-muted">No cases.</p>}
        {rows.map((g) => {
          const left = daysLeft(g);
          const overdue = isOverdue(g);
          return (
            <div key={g.id} className="p-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <button className="font-mono text-sm font-semibold text-teal hover:underline" onClick={() => setOpen(open === g.id ? null : g.id)}>{g.id}</button>
                <StatusPill s={g.status} />
                <UrgencyPill u={g.ai.urgency} />
                <span className="text-sm text-slate-600">{DEPT_BY_ID[g.department].name} · {g.block}</span>
                <span className={`ml-auto text-sm font-semibold ${g.status === "resolved" ? "text-emerald-700" : overdue ? "text-danger" : left <= 2 ? "text-saffron" : "text-slate-600"}`}>
                  {g.status === "resolved" ? "Done" : overdue ? `Overdue by ${-left} day(s)` : `${left} day(s) left`}
                </span>
              </div>
              <p className="mt-1 text-sm">{g.ai.summary}</p>
              {open === g.id && (
                <div className="mt-3 space-y-3 rounded-lg bg-slate-50 p-3">
                  <p className="text-sm"><span className="text-muted">Original:</span> {g.text}</p>
                  <History g={g} />
                </div>
              )}
              {g.status !== "resolved" && (
                <div className="mt-2 flex gap-2">
                  {g.status === "assigned" && (
                    <button className="btn-ghost py-1 text-xs" onClick={() => update(g.id, { status: "in_progress" }, "officer", "Started work; field verification requested")}>Start work</button>
                  )}
                  <button className="btn-ghost py-1 text-xs" onClick={() => update(g.id, { status: "resolved", resolvedAt: new Date().toISOString() }, "officer", "Marked resolved; citizen informed by SMS")}>Mark resolved</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
