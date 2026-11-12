"use client";
// Internal communication on a case: joint parts, report requests between departments,
// transfers with a reason (second transfer needs ADM approval) and case notes.
import { useState } from "react";
import { ArrowRightLeft, ClipboardList, GitFork, MessageSquare, Plus, Send, ShieldAlert } from "lucide-react";
import { DEPARTMENTS, DEPT_BY_ID, type DepartmentId } from "@/lib/departments";
import { jointParts, useGrievances } from "@/lib/store";
import type { Grievance } from "@/lib/types";
import { StatusPill } from "@/components/ui";

type Api = ReturnType<typeof useGrievances>;
const REAL_DEPTS = DEPARTMENTS.filter((d) => d.id !== "OTHER");
const fmt = (iso: string) => new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

function Section({ icon: Icon, title, children }: { icon: typeof Send; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-lg border border-line bg-white p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-ink"><Icon className="size-4 text-teal" aria-hidden />{title}</h3>
      {children}
    </section>
  );
}

function DeptSelect({ id, value, onChange, exclude, label }: { id: string; value: string; onChange: (v: DepartmentId) => void; exclude: DepartmentId[]; label: string }) {
  return (
    <>
      <label htmlFor={id} className="sr-only">{label}</label>
      <select id={id} className="input cursor-pointer" value={value} onChange={(e) => onChange(e.target.value as DepartmentId)}>
        <option value="" disabled>{label}…</option>
        {REAL_DEPTS.filter((d) => !exclude.includes(d.id)).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>
    </>
  );
}

export function Coordination({ g, list, api }: { g: Grievance; list: Grievance[]; api: Api }) {
  const me = g.department;
  const parts = jointParts(list, g);
  const [reqTo, setReqTo] = useState<DepartmentId | "">("");
  const [ask, setAsk] = useState("");
  const [days, setDays] = useState(7);
  const [trTo, setTrTo] = useState<DepartmentId | "">("");
  const [reason, setReason] = useState("");
  const [partDept, setPartDept] = useState<DepartmentId | "">("");
  const [partWhat, setPartWhat] = useState("");
  const [note, setNote] = useState("");
  const open = g.status !== "resolved";

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {/* Joint case */}
      <Section icon={GitFork} title={parts.length > 1 ? `Joint case · ${parts.length} departments` : "Needs another department too?"}>
        {parts.length > 1 && (
          <ul className="space-y-2 text-sm">
            {parts.map((p) => (
              <li key={p.id} className={`flex flex-wrap items-center gap-2 rounded-md px-2.5 py-2 ${p.id === g.id ? "bg-teal-soft" : "bg-slate-50"}`}>
                <span className="font-mono text-xs font-semibold text-teal">{p.id}</span>
                {!p.jointId && <span className="pill bg-saffron-soft text-saffron">Lead</span>}
                <span className="font-medium text-ink">{DEPT_BY_ID[p.department].name}</span>
                <span className="ml-auto"><StatusPill s={p.status} /></span>
                <span className="w-full text-xs text-slate-700">{p.ai.summary}</span>
              </li>
            ))}
          </ul>
        )}
        {open && (
          <form className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]" onSubmit={(e) => { e.preventDefault(); if (partDept && partWhat.trim()) { api.addPart(g.id, partDept, partWhat.trim()); setPartDept(""); setPartWhat(""); } }}>
            <DeptSelect id={`part-${g.id}`} value={partDept} onChange={setPartDept} exclude={parts.map((p) => p.department)} label="Add department" />
            <label className="sr-only" htmlFor={`partw-${g.id}`}>What they must do</label>
            <input id={`partw-${g.id}`} className="input" placeholder="What they must do" value={partWhat} onChange={(e) => setPartWhat(e.target.value)} />
            <button className="btn-ghost" disabled={!partDept || !partWhat.trim()}><Plus className="size-4" aria-hidden /> Add part</button>
          </form>
        )}
        <p className="text-xs text-muted">The citizen keeps one tracking ID. Each department works its own part with its own deadline.</p>
      </Section>

      {/* Report requests */}
      <Section icon={ClipboardList} title="Report requests between departments">
        {(g.requests ?? []).length === 0 && <p className="text-sm text-muted">No requests yet.</p>}
        <ul className="space-y-2 text-sm">
          {(g.requests ?? []).map((r) => {
            const late = r.status === "open" && new Date(r.dueAt).getTime() < Date.now();
            return (
              <li key={r.id} className="rounded-md bg-slate-50 p-2.5">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-ink">{DEPT_BY_ID[r.from].name} → {DEPT_BY_ID[r.to].name}</span>
                  <span className={`pill ml-auto ${r.status === "answered" ? "bg-success-soft text-success" : late ? "bg-danger-soft text-danger" : "bg-saffron-soft text-saffron"}`}>
                    {r.status === "answered" ? "Answered" : late ? "Overdue" : `Due ${new Date(r.dueAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}`}
                  </span>
                </div>
                <p className="mt-1 text-ink">{r.ask}</p>
                {r.reply && <p className="mt-1 border-l-2 border-success pl-2 text-slate-700"><b>Reply:</b> {r.reply}</p>}
              </li>
            );
          })}
        </ul>
        {open && (
          <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); if (reqTo && ask.trim()) { api.requestReport(g.id, me, reqTo, ask.trim(), days); setReqTo(""); setAsk(""); } }}>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <DeptSelect id={`req-${g.id}`} value={reqTo} onChange={setReqTo} exclude={[me]} label="Ask department" />
              <label className="sr-only" htmlFor={`days-${g.id}`}>Deadline</label>
              <select id={`days-${g.id}`} className="input cursor-pointer" value={days} onChange={(e) => setDays(Number(e.target.value))}>
                {[2, 3, 7, 15].map((d) => <option key={d} value={d}>{d} days</option>)}
              </select>
            </div>
            <label className="sr-only" htmlFor={`ask-${g.id}`}>What do you need</label>
            <input id={`ask-${g.id}`} className="input" placeholder="What do you need? e.g. site report, NOC, joint visit" value={ask} onChange={(e) => setAsk(e.target.value)} />
            <button className="btn-ghost" disabled={!reqTo || !ask.trim()}><Send className="size-4" aria-hidden /> Send request</button>
          </form>
        )}
      </Section>

      {/* Transfer */}
      <Section icon={ArrowRightLeft} title="Wrong department? Transfer with a reason">
        {g.pendingTransfer ? (
          <p className="flex items-start gap-2 rounded-md bg-saffron-soft p-2.5 text-sm text-saffron">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            Waiting for ADM approval to move to {DEPT_BY_ID[g.pendingTransfer.to].name}. Reason: {g.pendingTransfer.reason}
          </p>
        ) : open ? (
          <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); if (trTo && reason.trim().length >= 10) { api.transfer(g.id, trTo, reason.trim()); setTrTo(""); setReason(""); } }}>
            <DeptSelect id={`tr-${g.id}`} value={trTo} onChange={setTrTo} exclude={[me]} label="Transfer to" />
            <label className="sr-only" htmlFor={`reason-${g.id}`}>Reason</label>
            <input id={`reason-${g.id}`} className="input" placeholder="Reason (required, at least 10 characters)" value={reason} onChange={(e) => setReason(e.target.value)} />
            <button className="btn-ghost" disabled={!trTo || reason.trim().length < 10}>
              <ArrowRightLeft className="size-4" aria-hidden /> {(g.transfers ?? 0) >= 1 ? "Ask ADM to approve transfer" : "Transfer"}
            </button>
          </form>
        ) : <p className="text-sm text-muted">Case is closed.</p>}
        <p className="text-xs text-muted">Transferred {g.transfers ?? 0} time(s). The second transfer needs ADM approval, so cases cannot bounce between departments.</p>
      </Section>

      {/* Notes */}
      <Section icon={MessageSquare} title="Case notes (instead of WhatsApp)">
        <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
          {(g.notes ?? []).length === 0 && <li className="text-muted">No notes yet.</li>}
          {(g.notes ?? []).map((n, i) => (
            <li key={i} className="rounded-md bg-slate-50 p-2.5">
              <div className="text-xs text-muted"><b className="text-ink">{n.by}</b> · {fmt(n.at)}</div>
              <div className="text-ink">{n.text}</div>
            </li>
          ))}
        </ul>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (note.trim()) { api.addNote(g.id, DEPT_BY_ID[me].name, note.trim()); setNote(""); } }}>
          <label className="sr-only" htmlFor={`note-${g.id}`}>Add a note</label>
          <input id={`note-${g.id}`} className="input" placeholder={`Note as ${DEPT_BY_ID[me].name}`} value={note} onChange={(e) => setNote(e.target.value)} />
          <button className="btn-ghost shrink-0" disabled={!note.trim()} aria-label="Add note"><Send className="size-4" aria-hidden /></button>
        </form>
      </Section>
    </div>
  );
}
