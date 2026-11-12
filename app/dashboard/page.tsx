"use client";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { AlarmClock, ArrowRightLeft, Bot, Check, ClipboardCheck, ClipboardList, FolderOpen, GitFork, Megaphone, RotateCcw, Send, X } from "lucide-react";
import { ageDays, isOpen, isOverdue, openRequests, useGrievances } from "@/lib/store";
import { DEPARTMENTS, DEPT_BY_ID, type DepartmentId } from "@/lib/departments";
import { EmptyState, Loading, PageHeader, UrgencyPill } from "@/components/ui";

type Kpi = { label: string; value: string | number; tone: string; bg: string; icon: LucideIcon };

export default function DashboardPage() {
  const { list, reset, circulars, decideTransfer, postCircular } = useGrievances();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  if (!list) return <Loading />;

  const open = list.filter(isOpen);
  const overdue = list.filter((g) => isOverdue(g));
  const review = list.filter((g) => g.status === "needs_review");
  const autoRouted = list.filter((g) => !g.ai.needsReview).length;
  const waiting = list.filter((g) => isOpen(g) && openRequests(g).length > 0);
  const jointIds = new Set(list.filter((g) => g.jointId).map((g) => g.jointId));
  const approvals = list.filter((g) => g.pendingTransfer);
  // Which department is holding others up: open report requests addressed to it.
  const blockerCount: Record<string, number> = {};
  list.flatMap(openRequests).forEach((r) => { blockerCount[r.to] = (blockerCount[r.to] ?? 0) + 1; });
  const blockers = Object.entries(blockerCount).sort((a, b) => b[1] - a[1]);

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
    { label: "Waiting on another dept", value: waiting.length, tone: "text-saffron", bg: "bg-saffron-soft", icon: ClipboardList },
    { label: "Joint cases", value: jointIds.size, tone: "text-teal", bg: "bg-teal-soft", icon: GitFork },
    { label: "Auto-routed by AI", value: `${Math.round((autoRouted / Math.max(1, list.length)) * 100)}%`, tone: "text-teal", bg: "bg-teal-soft", icon: Bot },
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="District Magistrate" title="District dashboard" subtitle="Live view of all grievances. Updates as soon as anyone acts on a case.">
        <button className="btn-ghost" onClick={reset}><RotateCcw className="size-4" aria-hidden /> Reset demo data</button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
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

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card min-w-0 space-y-3 p-5 sm:p-6" aria-labelledby="adm-h">
          <h2 id="adm-h" className="flex items-center gap-2 text-lg font-semibold text-ink"><ArrowRightLeft className="size-5 text-teal" aria-hidden /> ADM approvals: second transfers</h2>
          <p className="text-sm text-muted">A case already transferred once can move again only with ADM approval, so it cannot bounce between departments.</p>
          {approvals.length === 0 && <EmptyState icon={Check} title="Nothing to approve" />}
          {approvals.map((g) => (
            <div key={g.id} className="space-y-2 rounded-lg bg-slate-50 p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs font-semibold text-teal">{g.id}</span><span className="text-ink">{g.ai.summary}</span></div>
              <p><b>{DEPT_BY_ID[g.pendingTransfer!.by].name}</b> wants to move it to <b>{DEPT_BY_ID[g.pendingTransfer!.to].name}</b>. Reason: {g.pendingTransfer!.reason}</p>
              <div className="flex flex-wrap gap-2">
                <button className="btn-primary" onClick={() => decideTransfer(g.id, true)}><Check className="size-4" aria-hidden /> Approve transfer</button>
                <button className="btn-ghost" onClick={() => decideTransfer(g.id, false)}><X className="size-4" aria-hidden /> Keep with {DEPT_BY_ID[g.department].name}</button>
              </div>
            </div>
          ))}
          <h3 className="pt-2 text-sm font-semibold text-ink">Who is holding others up</h3>
          {blockers.length === 0 ? <p className="text-sm text-muted">No open requests between departments.</p> : (
            <ul className="space-y-1.5 text-sm">
              {blockers.map(([d, n]) => (
                <li key={d} className="flex items-center gap-2"><span className="text-ink">{DEPT_BY_ID[d as DepartmentId].name}</span><span className="pill ml-auto bg-saffron-soft text-saffron">{n} open request(s)</span></li>
              ))}
            </ul>
          )}
        </section>

        <section className="card min-w-0 space-y-3 p-5 sm:p-6" aria-labelledby="circ-h">
          <h2 id="circ-h" className="flex items-center gap-2 text-lg font-semibold text-ink"><Megaphone className="size-5 text-teal" aria-hidden /> Circulars to departments</h2>
          <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); if (title.trim() && body.trim()) { postCircular(title.trim(), body.trim(), DEPARTMENTS.filter((d) => d.id !== "OTHER").map((d) => d.id)); setTitle(""); setBody(""); } }}>
            <label className="sr-only" htmlFor="c-title">Title</label>
            <input id="c-title" className="input" placeholder="Title, e.g. Weekly review moved to Tuesday" value={title} onChange={(e) => setTitle(e.target.value)} />
            <label className="sr-only" htmlFor="c-body">Message</label>
            <textarea id="c-body" className="input min-h-20" placeholder="Message to all departments" value={body} onChange={(e) => setBody(e.target.value)} />
            <button className="btn-ghost" disabled={!title.trim() || !body.trim()}><Send className="size-4" aria-hidden /> Send to all departments</button>
          </form>
          <ul className="space-y-2 text-sm">
            {circulars.map((c) => {
              const acked = c.to.filter((d) => c.acks[d]);
              return (
                <li key={c.id} className="rounded-lg bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center gap-2"><b className="text-ink">{c.title}</b><span className={`pill ml-auto ${acked.length === c.to.length ? "bg-success-soft text-success" : "bg-saffron-soft text-saffron"}`}>{acked.length} / {c.to.length} acknowledged</span></div>
                  {acked.length < c.to.length && <p className="mt-1 text-xs text-muted">Not yet: {c.to.filter((d) => !c.acks[d]).map((d) => DEPT_BY_ID[d].name).join(", ")}</p>}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
