"use client";
// Department inbox: everything other departments and the DM office need from this department.
import { useEffect, useState } from "react";
import { BellRing, CheckCheck, ClipboardList, GitFork, Inbox, Megaphone, Reply, Send } from "lucide-react";
import { jointParts, useGrievances } from "@/lib/store";
import { DEPARTMENTS, DEPT_BY_ID, type DepartmentId } from "@/lib/departments";
import type { DeptRequest, Grievance } from "@/lib/types";
import { EmptyState, Loading, PageHeader, StatusPill } from "@/components/ui";

const ME_KEY = "grievance-router:inbox-dept";
const date = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { dateStyle: "medium" });

export default function InboxPage() {
  const api = useGrievances();
  const { list, circulars, answerRequest, ackCircular } = api;
  const [me, setMe] = useState<DepartmentId>("POLICE");
  useEffect(() => {
    try { const v = localStorage.getItem(ME_KEY); if (v && v in DEPT_BY_ID) setMe(v as DepartmentId); } catch {}
  }, []);
  const choose = (v: DepartmentId) => { setMe(v); try { localStorage.setItem(ME_KEY, v); } catch {} };
  if (!list) return <Loading />;

  const all = list.flatMap((g) => (g.requests ?? []).map((r) => ({ g, r })));
  const incoming = all.filter(({ r }) => r.to === me).sort((a, b) => Number(a.r.status === "answered") - Number(b.r.status === "answered") || a.r.dueAt.localeCompare(b.r.dueAt));
  const outgoing = all.filter(({ r }) => r.from === me);
  const joint = list.filter((g) => g.department === me && jointParts(list, g).length > 1);
  const myCirculars = circulars.filter((c) => c.to.includes(me));
  const openIn = incoming.filter(({ r }) => r.status === "open");
  const late = openIn.filter(({ r }) => new Date(r.dueAt).getTime() < Date.now());
  const unread = myCirculars.filter((c) => !c.acks[me]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Department" title="Department inbox" subtitle="What other departments and the DM office need from you. Every request has a deadline and is logged on the case.">
        <div className="w-full sm:w-72">
          <label htmlFor="me" className="field-label">You are working as</label>
          <select id="me" className="input mt-1.5 cursor-pointer" value={me} onChange={(e) => choose(e.target.value as DepartmentId)}>
            {DEPARTMENTS.filter((d) => d.id !== "OTHER").map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Requests to answer", value: openIn.length, tone: "text-teal" },
          { label: "Overdue requests", value: late.length, tone: late.length ? "text-danger" : "text-teal" },
          { label: "Joint cases", value: joint.length, tone: "text-teal" },
          { label: "Circulars to acknowledge", value: unread.length, tone: unread.length ? "text-saffron" : "text-teal" },
        ].map((k) => (
          <div key={k.label} className="card p-4">
            <div className={`font-[family-name:var(--font-display)] text-3xl font-semibold ${k.tone}`}>{k.value}</div>
            <div className="text-sm text-muted">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card min-w-0 space-y-4 p-5 sm:p-6" aria-labelledby="in-h">
          <h2 id="in-h" className="flex items-center gap-2 text-lg font-semibold text-ink"><ClipboardList className="size-5 text-teal" aria-hidden /> Requests to {DEPT_BY_ID[me].name}</h2>
          {incoming.length === 0 && <EmptyState icon={Inbox} title="No requests" body="When another department needs a report, NOC or site visit from you, it appears here." />}
          <ul className="space-y-3">
            {incoming.map(({ g, r }) => <IncomingRequest key={r.id} g={g} r={r} onReply={(t) => answerRequest(g.id, r.id, t)} />)}
          </ul>
        </section>

        <div className="min-w-0 space-y-6">
          <section className="card space-y-4 p-5 sm:p-6" aria-labelledby="circ-h">
            <h2 id="circ-h" className="flex items-center gap-2 text-lg font-semibold text-ink"><Megaphone className="size-5 text-teal" aria-hidden /> Circulars from the DM office</h2>
            {myCirculars.length === 0 && <p className="text-sm text-muted">No circulars for your department.</p>}
            {myCirculars.map((c) => (
              <article key={c.id} className="space-y-2 rounded-lg bg-slate-50 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2"><b className="text-ink">{c.title}</b><span className="ml-auto text-xs text-muted">{date(c.at)}</span></div>
                <p className="text-slate-700">{c.body}</p>
                {c.acks[me]
                  ? <p className="flex items-center gap-1.5 text-xs font-semibold text-success"><CheckCheck className="size-4" aria-hidden /> Acknowledged {date(c.acks[me]!)}</p>
                  : <button className="btn-ghost" onClick={() => ackCircular(c.id, me)}><BellRing className="size-4" aria-hidden /> Acknowledge</button>}
              </article>
            ))}
          </section>

          <section className="card space-y-3 p-5 sm:p-6" aria-labelledby="out-h">
            <h2 id="out-h" className="flex items-center gap-2 text-lg font-semibold text-ink"><Send className="size-5 text-teal" aria-hidden /> Your requests to others</h2>
            {outgoing.length === 0 && <p className="text-sm text-muted">None. Ask from a case on the Officer cases page.</p>}
            <ul className="space-y-2 text-sm">
              {outgoing.map(({ g, r }) => (
                <li key={r.id} className="flex flex-wrap items-center gap-2 rounded-md bg-slate-50 p-2.5">
                  <span className="font-mono text-xs font-semibold text-teal">{g.id}</span>
                  <span>to <b>{DEPT_BY_ID[r.to].name}</b></span>
                  <RequestState r={r} />
                  <span className="w-full text-slate-700">{r.ask}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card space-y-3 p-5 sm:p-6" aria-labelledby="joint-h">
            <h2 id="joint-h" className="flex items-center gap-2 text-lg font-semibold text-ink"><GitFork className="size-5 text-teal" aria-hidden /> Joint cases you are part of</h2>
            {joint.length === 0 && <p className="text-sm text-muted">None right now.</p>}
            {joint.map((g) => (
              <div key={g.id} className="space-y-1.5 rounded-lg bg-slate-50 p-3 text-sm">
                <div className="font-mono text-xs font-semibold text-teal">{g.jointId ?? g.id}</div>
                {jointParts(list, g).map((p) => (
                  <div key={p.id} className="flex flex-wrap items-center gap-2">
                    <span className={p.department === me ? "font-semibold text-ink" : "text-slate-700"}>{DEPT_BY_ID[p.department].name}{!p.jointId && " (lead)"}</span>
                    <span className="ml-auto"><StatusPill s={p.status} /></span>
                  </div>
                ))}
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}

function RequestState({ r }: { r: DeptRequest }) {
  const late = r.status === "open" && new Date(r.dueAt).getTime() < Date.now();
  return (
    <span className={`pill ml-auto ${r.status === "answered" ? "bg-success-soft text-success" : late ? "bg-danger-soft text-danger" : "bg-saffron-soft text-saffron"}`}>
      {r.status === "answered" ? "Answered" : late ? "Overdue" : `Due ${date(r.dueAt)}`}
    </span>
  );
}

function IncomingRequest({ g, r, onReply }: { g: Grievance; r: DeptRequest; onReply: (t: string) => void }) {
  const [text, setText] = useState("");
  return (
    <li className="space-y-2 rounded-lg border border-line p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs font-semibold text-teal">{g.id}</span>
        <span>from <b>{DEPT_BY_ID[r.from].name}</b></span>
        <RequestState r={r} />
      </div>
      <p className="font-medium text-ink">{r.ask}</p>
      <p className="text-xs text-muted">Case: {g.ai.summary} · {g.block}</p>
      {r.status === "answered"
        ? <p className="border-l-2 border-success pl-2 text-slate-700"><b>Your reply:</b> {r.reply}</p>
        : (
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) onReply(text.trim()); }}>
            <label className="sr-only" htmlFor={`reply-${r.id}`}>Reply</label>
            <input id={`reply-${r.id}`} className="input" placeholder="Your report or answer" value={text} onChange={(e) => setText(e.target.value)} />
            <button className="btn-primary shrink-0" disabled={!text.trim()}><Reply className="size-4" aria-hidden /> Reply</button>
          </form>
        )}
    </li>
  );
}
