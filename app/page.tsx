import Link from "next/link";
import { ArrowRight, Briefcase, ClipboardCheck, FilePlus2, Gauge, LifeBuoy, ListChecks, Lock, ShieldCheck } from "lucide-react";

const STEPS = [
  { href: "/submit", who: "Citizen", title: "File a grievance", body: "Type a complaint in Hindi, English or both. Get a tracking ID straight away.", icon: FilePlus2 },
  { href: "/review", who: "Clerk", title: "Review unsure cases", body: "When the AI is under 70% sure, a clerk confirms or corrects the department.", icon: ClipboardCheck },
  { href: "/cases", who: "Officer", title: "Work your queue", body: "Each department sees its own cases, with a summary and a deadline.", icon: Briefcase },
  { href: "/dashboard", who: "DM", title: "See everything", body: "Backlog, overdue cases and load by department on one screen.", icon: Gauge },
];
const SAFETY = [
  { icon: Lock, title: "Personal data masked", body: "Phone, Aadhaar and email are hidden before any text reaches the AI." },
  { icon: ListChecks, title: "Fixed department list", body: "The AI can only pick a real department. Anything else goes to a person." },
  { icon: ShieldCheck, title: "A person decides", body: "Under 70% confidence a clerk routes it. Every AI step and correction is logged." },
  { icon: LifeBuoy, title: "Never stops", body: "If the AI is down, a keyword classifier takes over and sends cases for review." },
];

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <div className="eyebrow">Smart Collectorate · working prototype</div>
          <h1 className="text-3xl font-semibold text-teal sm:text-5xl">Every grievance tracked, routed on day one</h1>
          <p className="max-w-2xl text-lg text-slate-700">
            Citizens file in Hindi, English or Hinglish. AI suggests the department, urgency and a one-line summary. A person checks
            anything the AI is unsure about, and the DM sees every delay on one screen.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/submit" className="btn-primary">File a grievance <ArrowRight className="size-4" aria-hidden /></Link>
            <Link href="/dashboard" className="btn-ghost">Open DM dashboard</Link>
          </div>
        </div>
        <div className="card grid grid-cols-2 gap-px overflow-hidden bg-line p-0">
          {[
            ["22 / 22", "test cases routed correctly by the AI, incl. joint cases"],
            ["0", "sent to the wrong department"],
            ["70%", "confidence needed to route without a clerk"],
            ["2", "languages: Hindi and English"],
          ].map(([n, l]) => (
            <div key={l} className="bg-white p-5">
              <div className="font-[family-name:var(--font-display)] text-3xl font-semibold text-teal">{n}</div>
              <div className="mt-1 text-sm text-muted">{l}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-ink">Try it as each person in the office</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ href, who, title, body, icon: Icon }, i) => (
            <Link key={href} href={href} className="card group flex flex-col gap-3 p-5 transition-colors hover:border-teal">
              <span className="grid size-11 place-items-center rounded-xl bg-teal-soft text-teal transition-colors group-hover:bg-teal group-hover:text-white">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <div className="eyebrow">{i + 1}. {who}</div>
                <div className="mt-1 text-lg font-semibold text-teal">{title}</div>
              </div>
              <p className="flex-1 text-sm text-slate-700">{body}</p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-teal">Open <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-xl font-semibold text-ink">Safety rules built in</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SAFETY.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-3">
              <Icon className="mt-0.5 size-5 shrink-0 text-saffron" aria-hidden />
              <div>
                <div className="font-semibold text-ink">{title}</div>
                <p className="text-sm text-slate-700">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
