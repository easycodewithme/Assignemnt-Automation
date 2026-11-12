"use client";
import { useState } from "react";
import { Check, MessageSquareText, Search, SearchX } from "lucide-react";
import { jointParts, useGrievances } from "@/lib/store";
import { DEPT_BY_ID } from "@/lib/departments";
import type { Status } from "@/lib/types";
import { EmptyState, History, Loading, PageHeader, StatusPill } from "@/components/ui";

const STAGES: { key: Status[]; label: string }[] = [
  { key: ["needs_review", "assigned", "in_progress", "resolved"], label: "Received" },
  { key: ["assigned", "in_progress", "resolved"], label: "With department" },
  { key: ["in_progress", "resolved"], label: "Work started" },
  { key: ["resolved"], label: "Resolved" },
];

export default function TrackPage() {
  const { list } = useGrievances();
  const [q, setQ] = useState("");
  if (!list) return <Loading />;
  const g = list.find((x) => x.id.toLowerCase() === q.trim().toLowerCase());
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader eyebrow="Citizen" title="Track your grievance · स्थिति जानें" subtitle="Enter the tracking ID from your SMS." />
      <label className="relative block">
        <span className="sr-only">Tracking ID</span>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
        <input className="input pl-11 font-mono text-lg" placeholder="DM-2026-00001" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>

      {q && !g && <div className="card"><EmptyState icon={SearchX} title="No grievance with this ID yet" body="Check the ID in your SMS. It looks like DM-2026-00001." /></div>}

      {g && (
        <div className="card space-y-6 p-6">
          <div className="flex flex-wrap items-center gap-3"><span className="font-mono text-lg font-bold text-teal">{g.id}</span><StatusPill s={g.status} /></div>

          <ol className="grid grid-cols-4 gap-2" aria-label="Progress">
            {STAGES.map((st, i) => {
              const done = st.key.includes(g.status);
              return (
                <li key={st.label} className="flex flex-col items-center gap-1.5 text-center">
                  <span className={`grid size-8 place-items-center rounded-full text-sm font-semibold ${done ? "bg-teal text-white" : "border-2 border-line bg-white text-muted"}`}>
                    {done ? <Check className="size-4" aria-hidden /> : i + 1}
                  </span>
                  <span className={`text-xs ${done ? "font-semibold text-ink" : "text-muted"}`}>{st.label}<span className="sr-only">{done ? " (done)" : " (pending)"}</span></span>
                </li>
              );
            })}
          </ol>

          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-teal-soft p-4"><dt className="text-xs text-muted">Department</dt><dd className="font-semibold text-ink">{g.status === "needs_review" ? "Being checked by our staff" : DEPT_BY_ID[g.department].name}</dd></div>
            <div className="rounded-lg bg-teal-soft p-4"><dt className="text-xs text-muted">Expected by</dt><dd className="font-semibold text-ink">{new Date(g.dueAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</dd></div>
          </dl>
          {jointParts(list, g).length > 1 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-ink">Your complaint has {jointParts(list, g).length} parts, each with its own department</h2>
              <ul className="space-y-2 text-sm">
                {jointParts(list, g).map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-line p-3">
                    <span className="font-semibold text-ink">{DEPT_BY_ID[p.department].name}</span>
                    <span className="ml-auto"><StatusPill s={p.status} /></span>
                    <span className="w-full text-slate-700">{p.ai.summary}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted">Your complaint closes only when every part is fixed. You get an SMS as each part is done.</p>
            </div>
          )}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-ink">History</h2>
            <History g={g} />
          </div>
        </div>
      )}
      <p className="flex items-start gap-2 text-sm text-muted"><MessageSquareText className="mt-0.5 size-4 shrink-0" aria-hidden /> In production, citizens also get updates on SMS and WhatsApp, so there is no need to visit the office.</p>
    </div>
  );
}
