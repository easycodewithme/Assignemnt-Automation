"use client";
import { useState } from "react";
import { useGrievances } from "@/lib/store";
import { DEPT_BY_ID } from "@/lib/departments";
import { History, Loading, StatusPill } from "@/components/ui";

export default function TrackPage() {
  const { list } = useGrievances();
  const [q, setQ] = useState("");
  if (!list) return <Loading />;
  const g = list.find((x) => x.id.toLowerCase() === q.trim().toLowerCase());
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-bold text-teal">Track your grievance · स्थिति जानें</h1>
      <input className="input font-mono" placeholder="DM-2026-00001" value={q} onChange={(e) => setQ(e.target.value)} />
      {q && !g && <p className="text-sm text-muted">No grievance with this ID yet.</p>}
      {g && (
        <div className="card space-y-3 p-5">
          <div className="flex items-center gap-3"><span className="font-mono font-bold text-teal">{g.id}</span><StatusPill s={g.status} /></div>
          <p className="text-sm">Department: <b>{g.status === "needs_review" ? "Being checked by our staff" : DEPT_BY_ID[g.department].name}</b></p>
          <p className="text-sm">Expected by: <b>{new Date(g.dueAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</b></p>
          <History g={g} />
        </div>
      )}
      <p className="text-xs text-muted">In production, citizens would also get this on SMS and WhatsApp, so there is no need to visit the office.</p>
    </div>
  );
}
