"use client";
import { useState } from "react";
import { ArrowRight, Bot, CheckCheck, PenLine } from "lucide-react";
import { useGrievances } from "@/lib/store";
import { DEPARTMENTS, DEPT_BY_ID, type DepartmentId } from "@/lib/departments";
import { Confidence, EmptyState, Loading, PageHeader, UrgencyPill } from "@/components/ui";
import type { Grievance } from "@/lib/types";

export default function ReviewPage() {
  const { list, route } = useGrievances();
  if (!list) return <Loading />;
  const queue = list.filter((g) => g.status === "needs_review");
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Clerk" title="Review queue"
        subtitle="Cases where the AI was under 70% sure or could not match a department. You decide; every decision is logged.">
        <span className="pill bg-saffron-soft px-3 py-1 text-sm text-saffron">{queue.length} waiting</span>
      </PageHeader>
      {queue.length === 0 && <div className="card"><EmptyState icon={CheckCheck} title="Nothing to review" body="All grievances have been routed. New unclear cases will appear here." /></div>}
      {queue.map((g) => <ReviewItem key={g.id} g={g} onRoute={(d) => route(g.id, d)} />)}
    </div>
  );
}

function ReviewItem({ g, onRoute }: { g: Grievance; onRoute: (d: DepartmentId) => void }) {
  const suggested = g.ai.department;
  const [dept, setDept] = useState<DepartmentId | "">(suggested === "OTHER" ? "" : suggested);
  const selectId = `route-${g.id}`;
  return (
    <article className="card grid overflow-hidden md:grid-cols-[1fr_320px]" aria-label={`Grievance ${g.id}`}>
      <div className="space-y-3 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <span className="font-mono font-semibold text-teal">{g.id}</span>
          <UrgencyPill u={g.ai.urgency} />
          <span className="text-muted">{g.citizenName} · {g.block} · {new Date(g.createdAt).toLocaleDateString("en-IN")}</span>
        </div>
        <blockquote className="rounded-lg border-l-4 border-line bg-slate-50 p-4 text-ink">{g.text}</blockquote>
        <p className="text-sm"><span className="font-semibold text-muted">AI summary:</span> {g.ai.summary}</p>
      </div>
      <div className="space-y-4 border-t border-line bg-teal-soft p-5 sm:p-6 md:border-l md:border-t-0">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted"><Bot className="size-4" aria-hidden /> AI suggestion</div>
          <div className="font-semibold text-ink">{DEPT_BY_ID[suggested].name}</div>
          <Confidence c={g.ai.confidence} />
          <div className="text-xs text-slate-700">{g.ai.reason}</div>
        </div>
        <div>
          <label htmlFor={selectId} className="field-label">Send to</label>
          <select id={selectId} className="input mt-1.5 cursor-pointer" value={dept} onChange={(e) => setDept(e.target.value as DepartmentId)}>
            <option value="" disabled>Choose a department…</option>
            {DEPARTMENTS.filter((d) => d.id !== "OTHER").map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <button className="btn-primary w-full" disabled={!dept} onClick={() => dept && onRoute(dept)}>
          {!dept ? "Choose a department" : dept === suggested
            ? <><ArrowRight className="size-4" aria-hidden /> Confirm and route</>
            : <><PenLine className="size-4" aria-hidden /> Correct and route</>}
        </button>
      </div>
    </article>
  );
}
