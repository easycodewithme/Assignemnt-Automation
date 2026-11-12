"use client";
import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, CheckCircle2, Copy, Loader2, Lock, Send, Sparkles } from "lucide-react";
import { useGrievances } from "@/lib/store";
import { DEPT_BY_ID } from "@/lib/departments";
import type { Classification, Grievance } from "@/lib/types";
import { Confidence, StatusPill, UrgencyPill } from "@/components/ui";

const EXAMPLES = [
  { tag: "Hindi", text: "हमारे गांव का ट्रांसफार्मर 5 दिन से जला हुआ है, बिजली नहीं है। मेरा नंबर 9876543210 है।" },
  { tag: "Hinglish", text: "Kotedar ne is mahine ka ration nahi diya, bolta hai stock khatam. Card number 1234 5678 9012." },
  { tag: "English", text: "My father's old age pension stopped after March. Village Kheda, block Milak. Please help urgently." },
  { tag: "Several problems", text: "Meri gali mein sewer overflow ho raha hai, isliye paani nahi aa raha, aur bijli bhi baar-baar ja rahi hai." },
  { tag: "Vague", text: "Please look into my matter, nobody is listening at the office." },
];
const BLOCKS = ["Sadar", "Bilaspur", "Milak", "Rampur", "Shahabad", "Swar"];
const MAX = 3000;

export default function SubmitPage() {
  const { add } = useGrievances();
  const [form, setForm] = useState({ citizenName: "", phone: "", block: BLOCKS[0], text: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ g: Grievance; parts: Grievance[]; warning?: string } | null>(null);

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
      const [g, ...parts] = add(form, ai);
      setResult({ g, parts, warning });
      setForm((f) => ({ ...f, text: "" }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_420px]">
      <form onSubmit={submit} className="card space-y-6 p-6 sm:p-8">
        <div className="space-y-1">
          <div className="eyebrow">Citizen</div>
          <h1 className="text-2xl font-semibold text-teal sm:text-3xl">File a grievance · शिकायत दर्ज करें</h1>
          <p className="text-muted">Write in Hindi, English or both. You will get a tracking number at once.</p>
        </div>

        <fieldset className="grid gap-4 sm:grid-cols-3">
          <legend className="sr-only">Your details</legend>
          <label className="field-label">Name · नाम
            <input className="input mt-1.5" required autoComplete="name" value={form.citizenName} onChange={(e) => setForm({ ...form, citizenName: e.target.value })} />
          </label>
          <label className="field-label">Mobile · मोबाइल
            <input className="input mt-1.5" type="tel" inputMode="numeric" autoComplete="tel-national" pattern="[6-9][0-9]{9}" title="10-digit mobile number" placeholder="98765 43210" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </label>
          <label className="field-label">Block · ब्लॉक
            <select className="input mt-1.5 cursor-pointer" value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })}>
              {BLOCKS.map((b) => <option key={b}>{b}</option>)}
            </select>
          </label>
        </fieldset>

        <label className="field-label">Your problem · आपकी समस्या
          <textarea className="input mt-1.5 min-h-40 leading-relaxed" required minLength={10} maxLength={MAX}
            placeholder="What happened, where, and since when? · क्या हुआ, कहाँ और कब से?"
            aria-describedby="text-help" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
          <span id="text-help" className="mt-1.5 flex justify-between text-xs font-normal text-muted">
            <span className="inline-flex items-center gap-1"><Lock className="size-3.5" aria-hidden /> Phone and Aadhaar numbers are hidden before the AI reads this.</span>
            <span>{form.text.length} / {MAX}</span>
          </span>
        </label>

        <div className="space-y-2">
          <div className="text-sm font-semibold text-ink">Or try an example</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {EXAMPLES.map((ex) => (
              <button type="button" key={ex.tag}
                className="flex min-h-11 cursor-pointer items-start gap-2 rounded-[0.625rem] border border-line bg-white p-3 text-left text-sm transition-colors hover:border-teal hover:bg-teal-soft"
                onClick={() => setForm({ ...form, citizenName: form.citizenName || "Demo Citizen", phone: form.phone || "9876543210", text: ex.text })}>
                <span className="pill shrink-0 bg-teal-soft text-teal">{ex.tag}</span>
                <span className="line-clamp-2 text-slate-700">{ex.text}</span>
              </button>
            ))}
          </div>
        </div>

        {error && <p role="alert" className="flex items-start gap-2 rounded-lg bg-danger-soft p-3 text-sm text-danger"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />{error}</p>}
        <button className="btn-primary w-full sm:w-auto" disabled={busy}>
          {busy ? <><Loader2 className="size-4 animate-spin" aria-hidden /> Analysing…</> : <><Send className="size-4" aria-hidden /> Submit grievance</>}
        </button>
      </form>

      <aside className="space-y-4 lg:sticky lg:top-6" aria-live="polite">
        {!result && !busy && (
          <div className="card p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-teal"><Sparkles className="size-5 text-saffron" aria-hidden /> What happens next</h2>
            <ol className="mt-4 space-y-4">
              {[
                "Phone and Aadhaar numbers are masked.",
                "The AI suggests department, urgency and a summary.",
                "Confident (70% or more)? It goes straight to the department.",
                "Otherwise a clerk checks it first.",
              ].map((t, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-700">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-teal text-xs font-semibold text-white">{i + 1}</span>{t}
                </li>
              ))}
            </ol>
          </div>
        )}
        {busy && (
          <div className="card space-y-3 p-6" aria-busy="true">
            <div className="flex items-center gap-2 font-semibold text-teal"><Loader2 className="size-5 animate-spin" aria-hidden /> Reading your complaint…</div>
            <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
          </div>
        )}
        {result && <ResultCard g={result.g} parts={result.parts} warning={result.warning} />}
      </aside>
    </div>
  );
}

function ResultCard({ g, parts, warning }: { g: Grievance; parts: Grievance[]; warning?: string }) {
  const ai = g.ai;
  const [copied, setCopied] = useState(false);
  return (
    <div className="card overflow-hidden">
      <div className="space-y-2 bg-teal p-6 text-white">
        <div className="flex items-center gap-2 text-sm font-semibold text-white/90"><CheckCircle2 className="size-5" aria-hidden /> Grievance received · शिकायत दर्ज</div>
        <div className="text-xs uppercase tracking-wider text-white/75">Tracking ID (sent by SMS)</div>
        <div className="flex items-center gap-2">
          <div className="font-mono text-2xl font-bold">{g.id}</div>
          <button type="button" aria-label="Copy tracking ID" className="grid size-9 cursor-pointer place-items-center rounded-lg hover:bg-white/10"
            onClick={() => { navigator.clipboard?.writeText(g.id); setCopied(true); }}>
            {copied ? <CheckCircle2 className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          </button>
        </div>
      </div>
      <div className="space-y-5 p-6">
        <div className="flex flex-wrap gap-2"><StatusPill s={g.status} /><UrgencyPill u={ai.urgency} /></div>
        <dl className="grid grid-cols-[100px_1fr] gap-x-3 gap-y-2.5 text-sm">
          <dt className="text-muted">Department</dt><dd className="font-semibold">{DEPT_BY_ID[g.department].name}</dd>
          <dt className="text-muted">Confidence</dt><dd><Confidence c={ai.confidence} /></dd>
          <dt className="text-muted">Summary</dt><dd>{ai.summary}</dd>
          <dt className="text-muted">Why</dt><dd className="text-slate-700">{ai.reason}</dd>
          {ai.location && (<><dt className="text-muted">Location</dt><dd>{ai.location}</dd></>)}
          {ai.scheme && (<><dt className="text-muted">Scheme</dt><dd>{ai.scheme}</dd></>)}
          <dt className="text-muted">Language</dt><dd>{ai.language}</dd>
          <dt className="text-muted">Deadline</dt><dd>{new Date(g.dueAt).toLocaleDateString("en-IN", { dateStyle: "medium" })} ({DEPT_BY_ID[g.department].slaDays} days)</dd>
          {(ai.also?.length ?? 0) > 0 && (<>
            <dt className="text-muted">{parts.length ? "Joint case" : "Also found"}</dt>
            <dd>
              <ul className="space-y-1.5">
                {(parts.length ? parts.map((p) => ({ id: p.id, department: p.department, summary: p.ai.summary })) : ai.also!.map((a) => ({ id: "", ...a }))).map((p) => (
                  <li key={p.department} className="rounded-md bg-teal-soft px-2.5 py-1.5">
                    {p.id && <span className="mr-1.5 font-mono text-xs font-semibold text-teal">{p.id}</span>}
                    <span className="font-semibold">{DEPT_BY_ID[p.department].name}</span>
                    <span className="block text-xs text-slate-700">{p.summary}</span>
                  </li>
                ))}
              </ul>
              <span className="mt-1.5 block text-xs text-muted">{parts.length ? `${DEPT_BY_ID[g.department].name} leads. One tracking ID for the citizen; it closes when every part is fixed.` : "A clerk confirms the split before it is sent."}</span>
            </dd>
          </>)}
          <dt className="text-muted">Engine</dt><dd className="font-mono text-xs break-all">{ai.source}</dd>
        </dl>
        <details className="rounded-lg border border-line text-sm">
          <summary className="cursor-pointer p-3 font-semibold text-ink">Text sent to the AI (masked)</summary>
          <p className="whitespace-pre-wrap border-t border-line bg-slate-50 p-3 text-slate-700">{ai.maskedText}</p>
        </details>
        {warning && <p className="rounded-lg bg-saffron-soft p-3 text-xs text-saffron">{warning}</p>}
        {g.status === "needs_review"
          ? <Link className="btn-ghost w-full" href="/review">Open clerk review queue <ArrowRight className="size-4" aria-hidden /></Link>
          : <Link className="btn-ghost w-full" href="/cases">See it in the officer queue <ArrowRight className="size-4" aria-hidden /></Link>}
      </div>
    </div>
  );
}
