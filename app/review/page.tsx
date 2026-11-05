"use client";
import { useState } from "react";
import { useGrievances } from "@/lib/store";
import { DEPARTMENTS, DEPT_BY_ID, type DepartmentId } from "@/lib/departments";
import { Confidence, Loading, UrgencyPill } from "@/components/ui";
import type { Grievance } from "@/lib/types";

export default function ReviewPage() {
  const { list, route } = useGrievances();
  if (!list) return <Loading />;
  const queue = list.filter((g) => g.status === "needs_review");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-teal">Clerk review queue</h1>
        <p className="text-sm text-muted">
          Cases where the AI was under 70% sure, or could not match a department. A person decides; every decision is logged.
        </p>
      </div>
      {queue.length === 0 && <div className="card p-6 text-sm text-slate-600">Nothing to review. 🎉</div>}
      {queue.map((g) => <ReviewItem key={g.id} g={g} onRoute={(d) => route(g.id, d)} />)}
    </div>
  );
}

function ReviewItem({ g, onRoute }: { g: Grievance; onRoute: (d: DepartmentId) => void }) {
  const suggested = g.ai.department;
  const [dept, setDept] = useState<DepartmentId | "">(suggested === "OTHER" ? "" : suggested);
  return (
    <div className="card grid gap-4 p-5 md:grid-cols-[1fr_300px]">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-mono font-semibold text-teal">{g.id}</span>
          <span className="text-muted">· {g.citizenName} · {g.block} · {new Date(g.createdAt).toLocaleDateString("en-IN")}</span>
          <UrgencyPill u={g.ai.urgency} />
        </div>
        <p className="rounded-lg bg-slate-50 p-3 text-sm">{g.text}</p>
        <p className="text-sm"><span className="text-muted">AI summary:</span> {g.ai.summary}</p>
      </div>
      <div className="space-y-3 rounded-lg bg-teal-soft p-4 text-sm">
        <div>
          <div className="text-xs text-muted">AI suggestion</div>
          <div className="font-semibold">{DEPT_BY_ID[suggested].name}</div>
          <Confidence c={g.ai.confidence} />
          <div className="mt-1 text-xs text-slate-600">{g.ai.reason}</div>
        </div>
        <label className="block text-xs text-muted">Send to
          <select className="input mt-1" value={dept} onChange={(e) => setDept(e.target.value as DepartmentId)}>
            <option value="" disabled>Choose a department…</option>
            {DEPARTMENTS.filter((d) => d.id !== "OTHER").map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </label>
        <button className="btn-primary w-full" disabled={!dept} onClick={() => dept && onRoute(dept)}>
          {!dept ? "Choose a department" : dept === suggested ? "Confirm and route" : "Correct and route"}
        </button>
      </div>
    </div>
  );
}
