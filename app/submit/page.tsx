"use client";
import { useState } from "react";
import Link from "next/link";
import { useGrievances } from "@/lib/store";
import { DEPT_BY_ID } from "@/lib/departments";
import type { Classification, Grievance } from "@/lib/types";
import { Confidence, StatusPill, UrgencyPill } from "@/components/ui";

const EXAMPLES = [
  "हमारे गांव का ट्रांसफार्मर 5 दिन से जला हुआ है, बिजली नहीं है। मेरा नंबर 9876543210 है।",
  "Kotedar ne is mahine ka ration nahi diya, bolta hai stock khatam. Card number 1234 5678 9012.",
  "My father's old age pension stopped after March. Village Kheda, block Milak. Please help urgently.",
  "Please look into my matter, nobody is listening at the office.",
];
const BLOCKS = ["Sadar", "Bilaspur", "Milak", "Rampur", "Shahabad", "Swar"];

export default function SubmitPage() {
  const { add } = useGrievances();
  const [form, setForm] = useState({ citizenName: "", phone: "", block: BLOCKS[0], text: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ g: Grievance; warning?: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(""); setResult(null);
    try {
      const r = await fetch("/api/classify", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: form.text }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Something went wrong");
      const { warning, ...ai } = data as Classification & { warning?: string };
      const g = add(form, ai);
      setResult({ g, warning });
      setForm((f) => ({ ...f, text: "" }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
      <form onSubmit={submit} className="card space-y-4 p-6">
        <div>
          <h1 className="text-2xl font-bold text-teal">File a grievance · शिकायत दर्ज करें</h1>
          <p className="text-sm text-muted">Write in Hindi, English or both. You will get a tracking number.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm">Name · नाम
            <input className="input mt-1" required value={form.citizenName} onChange={(e) => setForm({ ...form, citizenName: e.target.value })} />
          </label>
          <label className="text-sm">Mobile · मोबाइल
            <input className="input mt-1" inputMode="numeric" pattern="[6-9][0-9]{9}" title="10-digit mobile number" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </label>
          <label className="text-sm">Block · ब्लॉक
            <select className="input mt-1" value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })}>
              {BLOCKS.map((b) => <option key={b}>{b}</option>)}
            </select>
          </label>
        </div>
        <label className="block text-sm">Your problem · आपकी समस्या
          <textarea className="input mt-1 min-h-36" required minLength={10} maxLength={3000} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
        </label>
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">Try an example</div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex, i) => (
              <button type="button" key={i} className="btn-ghost max-w-full truncate text-left text-xs font-normal"
                onClick={() => setForm({ ...form, citizenName: form.citizenName || "Demo Citizen", phone: form.phone || "9876543210", text: ex })}>
                {ex.slice(0, 48)}…
              </button>
            ))}
          </div>
        </div>
        {error && <p className="rounded-lg bg-danger/10 p-3 text-sm text-danger">{error}</p>}
        <button className="btn-primary" disabled={busy}>{busy ? "Analysing…" : "Submit grievance"}</button>
      </form>

      <aside className="space-y-4">
        {!result && (
          <div className="card p-6 text-sm text-slate-600">
            <h2 className="mb-2 font-bold text-teal">What happens next</h2>
            <ol className="list-decimal space-y-1 pl-5">
              <li>Phone and Aadhaar numbers are masked.</li>
              <li>The AI suggests department, urgency and a summary.</li>
              <li>If it is confident (≥70%), the case goes straight to the department.</li>
              <li>Otherwise a clerk checks it first.</li>
            </ol>
          </div>
        )}
        {result && <ResultCard g={result.g} warning={result.warning} />}
      </aside>
    </div>
  );
}

function ResultCard({ g, warning }: { g: Grievance; warning?: string }) {
  const ai = g.ai;
  return (
    <div className="card space-y-4 p-6">
      <div>
        <div className="text-xs uppercase tracking-wide text-muted">Tracking ID (sent by SMS)</div>
        <div className="font-mono text-2xl font-bold text-teal">{g.id}</div>
        <div className="mt-1 flex flex-wrap gap-2"><StatusPill s={g.status} /><UrgencyPill u={ai.urgency} /></div>
      </div>
      <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2 text-sm">
        <dt className="text-muted">Department</dt><dd className="font-semibold">{DEPT_BY_ID[g.department].name}</dd>
        <dt className="text-muted">Confidence</dt><dd><Confidence c={ai.confidence} /></dd>
        <dt className="text-muted">Summary</dt><dd>{ai.summary}</dd>
        <dt className="text-muted">Why</dt><dd>{ai.reason}</dd>
        {ai.location && (<><dt className="text-muted">Location</dt><dd>{ai.location}</dd></>)}
        {ai.scheme && (<><dt className="text-muted">Scheme</dt><dd>{ai.scheme}</dd></>)}
        <dt className="text-muted">Language</dt><dd>{ai.language}</dd>
        <dt className="text-muted">Deadline</dt><dd>{new Date(g.dueAt).toLocaleDateString("en-IN", { dateStyle: "medium" })} ({DEPT_BY_ID[g.department].slaDays} days)</dd>
        <dt className="text-muted">Engine</dt><dd className="font-mono text-xs">{ai.source}</dd>
      </dl>
      <details className="text-xs text-slate-600">
        <summary className="cursor-pointer font-semibold">Text sent to the AI (masked)</summary>
        <p className="mt-2 whitespace-pre-wrap rounded bg-slate-50 p-2">{ai.maskedText}</p>
      </details>
      {warning && <p className="rounded-lg bg-saffron/10 p-2 text-xs text-saffron">{warning}</p>}
      {g.status === "needs_review"
        ? <Link className="btn-ghost w-full" href="/review">Open clerk review queue →</Link>
        : <Link className="btn-ghost w-full" href="/cases">See it in the officer queue →</Link>}
    </div>
  );
}
