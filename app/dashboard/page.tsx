"use client";
import type { LucideIcon } from "lucide-react";
import { AlarmClock, Bot, ClipboardCheck, FolderOpen, RotateCcw, Timer } from "lucide-react";
import { ageDays, isOpen, isOverdue, useGrievances } from "@/lib/store";
import { DEPARTMENTS, DEPT_BY_ID } from "@/lib/departments";
import { EmptyState, Loading, PageHeader, UrgencyPill } from "@/components/ui";

type Kpi = { label: string; value: string | number; tone: string; bg: string; icon: LucideIcon };

export default function DashboardPage() {
  const { list, reset } = useGrievances();
  if (!list) return <Loading />;

  const open = list.filter(isOpen);
  const overdue = list.filter((g) => isOverdue(g));
  const review = list.filter((g) => g.status === "needs_review");
  const resolved = list.filter((g) => g.status === "resolved");
  const avgDays = resolved.length ? Math.round(resolved.reduce((s, g) => s + ageDays(g), 0) / resolved.length) : 0;
  const autoRouted = list.filter((g) => !g.ai.needsReview).length;

  const byDept = DEPARTMENTS.filter((d) => d.id !== "OTHER").map((d) => {
    const mine = list.filter((g) => g.department === d.id && g.status !== "needs_review");
    return {
      d,
      open: mine.filter(isOpen).length,
      overdue: mine.filter((g) => isOverdue(g)).length,
      resolved: mine.filter((g) => g.status === "resolved").length,
    };
  }).filter((r) => r.open + r.resolved > 0).sort((a, b) => b.overdue - a.overdue || b.open - a.open);
  const maxOpen = Math.max(1, ...byDept.map((r) => r.open));

  const kpis: Kpi[] = [
    { label: "Open cases", value: open.length, tone: "text-teal", bg: "bg-teal-soft", icon: FolderOpen },
    { label: "Overdue", value: overdue.length, tone: "text-danger", bg: "bg-danger-soft", icon: AlarmClock },
    { label: "Waiting for clerk review", value: review.length, tone: "text-saffron", bg: "bg-saffron-soft", icon: ClipboardCheck },
    { label: "Avg days to resolve", value: avgDays, tone: "text-teal", bg: "bg-teal-soft", icon: Timer },
    { label: "Auto-routed by AI", value: `${Math.round((autoRouted / Math.max(1, list.length)) * 100)}%`, tone: "text-teal", bg: "bg-teal-soft", icon: Bot },
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="District Magistrate" title="District dashboard" subtitle="Live view of all grievances. Updates as soon as anyone acts on a case.">
        <button className="btn-ghost" onClick={reset}><RotateCcw className="size-4" aria-hidden /> Reset demo data</button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {kpis.map(({ label, value, tone, bg, icon: Icon }) => (
          <div key={label} className="card flex flex-col gap-3 p-4 sm:p-5">
            <span className={`grid size-9 place-items-center rounded-lg ${bg} ${tone}`}><Icon className="size-5" aria-hidden /></span>
            <div>
              <div className={`font-[family-name:var(--font-display)] text-3xl font-semibold ${tone}`}>{value}</div>
              <div className="text-sm text-muted">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="card min-w-0 p-5 sm:p-6" aria-labelledby="dept-h">
          <h2 id="dept-h" className="text-lg font-semibold text-ink">Departments, worst first</h2>
          <p className="mb-4 text-sm text-muted">Sorted by overdue cases, then open cases.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted">
                <tr><th scope="col" className="pb-2 font-semibold">Department</th><th scope="col" className="pb-2 font-semibold">Open</th><th scope="col" className="pb-2 text-right font-semibold">Overdue</th><th scope="col" className="pb-2 text-right font-semibold">Resolved</th></tr>
              </thead>
              <tbody>
                {byDept.map((r) => (
                  <tr key={r.d.id} className="border-t border-line">
                    <th scope="row" className="py-2.5 pr-3 text-left font-medium text-ink">{r.d.name}</th>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-28 overflow-hidden rounded-full bg-slate-100" aria-hidden>
                          <div className={`h-full rounded-full ${r.overdue ? "bg-danger" : "bg-teal"}`} style={{ width: `${(r.open / maxOpen) * 100}%` }} />
                        </div>
                        <span className="tabular-nums">{r.open}</span>
                      </div>
                    </td>
                    <td className={`py-2.5 text-right font-semibold tabular-nums ${r.overdue ? "text-danger" : "text-muted"}`}>{r.overdue}</td>
                    <td className="py-2.5 text-right tabular-nums text-slate-700">{r.resolved}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card min-w-0 p-5 sm:p-6" aria-labelledby="overdue-h">
          <h2 id="overdue-h" className="text-lg font-semibold text-ink">Most overdue cases</h2>
          <p className="mb-4 text-sm text-muted">Raise these in the weekly review meeting.</p>
          {overdue.length === 0
            ? <EmptyState icon={AlarmClock} title="No overdue cases" />
            : (
              <ul className="divide-y divide-line">
                {overdue.sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()).slice(0, 7).map((g) => (
                  <li key={g.id} className="space-y-1 py-3 text-sm first:pt-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-teal">{g.id}</span>
                      <UrgencyPill u={g.ai.urgency} />
                      <span className="pill ml-auto bg-danger-soft text-danger">{ageDays(g)} days old</span>
                    </div>
                    <div className="text-ink">{g.ai.summary}</div>
                    <div className="text-xs text-muted">{DEPT_BY_ID[g.department].name} · {g.block}</div>
                  </li>
                ))}
              </ul>
            )}
        </section>
      </div>
    </div>
  );
}
