"use client";
import { ageDays, isOpen, isOverdue, useGrievances } from "@/lib/store";
import { DEPARTMENTS, DEPT_BY_ID } from "@/lib/departments";
import { Loading, UrgencyPill } from "@/components/ui";

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

  const kpis = [
    { label: "Open cases", value: open.length, tone: "text-teal" },
    { label: "Overdue", value: overdue.length, tone: "text-danger" },
    { label: "Waiting for clerk review", value: review.length, tone: "text-saffron" },
    { label: "Avg days to resolve", value: avgDays, tone: "text-teal" },
    { label: "Auto-routed by AI", value: `${Math.round((autoRouted / Math.max(1, list.length)) * 100)}%`, tone: "text-teal" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-teal">District Magistrate dashboard</h1>
          <p className="text-sm text-muted">Live view of all grievances. Updated as soon as anyone acts on a case.</p>
        </div>
        <button className="btn-ghost text-xs" onClick={reset}>Reset demo data</button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className="card p-4">
            <div className={`text-3xl font-bold ${k.tone}`}>{k.value}</div>
            <div className="text-xs text-muted">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="card p-5">
          <h2 className="mb-3 font-bold text-teal">Departments, worst first</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted">
                <tr><th className="py-1">Department</th><th className="py-1">Open cases</th><th className="py-1 text-right">Overdue</th><th className="py-1 text-right">Resolved</th></tr>
              </thead>
              <tbody>
                {byDept.map((r) => (
                  <tr key={r.d.id} className="border-t border-slate-100">
                    <td className="py-2 pr-2">{r.d.name}</td>
                    <td className="py-2 pr-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full bg-teal" style={{ width: `${(r.open / maxOpen) * 100}%` }} />
                        </div>
                        {r.open}
                      </div>
                    </td>
                    <td className={`py-2 text-right font-semibold ${r.overdue ? "text-danger" : "text-slate-400"}`}>{r.overdue}</td>
                    <td className="py-2 text-right text-slate-600">{r.resolved}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="mb-3 font-bold text-teal">Most overdue cases</h2>
          <ul className="space-y-3">
            {overdue.sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()).slice(0, 7).map((g) => (
              <li key={g.id} className="text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-teal">{g.id}</span>
                  <UrgencyPill u={g.ai.urgency} />
                  <span className="ml-auto text-xs font-semibold text-danger">{ageDays(g)} days old</span>
                </div>
                <div className="text-slate-700">{g.ai.summary}</div>
                <div className="text-xs text-muted">{DEPT_BY_ID[g.department].name} · {g.block}</div>
              </li>
            ))}
            {overdue.length === 0 && <li className="text-sm text-muted">No overdue cases.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
