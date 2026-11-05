import Link from "next/link";

const STEPS = [
  { href: "/submit", who: "Citizen", title: "File a grievance", body: "Type a complaint in Hindi, English or both. Get a tracking ID straight away." },
  { href: "/review", who: "Clerk", title: "Review unsure cases", body: "When the AI is under 70% sure, a clerk confirms or corrects the department." },
  { href: "/cases", who: "Officer", title: "Work your queue", body: "Each department sees only its cases, with a summary and a deadline." },
  { href: "/dashboard", who: "DM", title: "See everything", body: "Backlog, overdue cases and load by department on one screen." },
];

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold text-teal sm:text-4xl">AI grievance classifier and router</h1>
        <p className="max-w-3xl text-lg text-slate-700">
          A working proof for one use case from the proposal: every grievance gets a tracking number, the AI suggests the right
          department and urgency, and a person checks anything the AI is unsure about.
        </p>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <Link key={s.href} href={s.href} className="card group p-5 hover:border-teal">
            <div className="text-xs font-semibold uppercase tracking-wide text-saffron">
              {i + 1}. {s.who}
            </div>
            <div className="mt-1 text-lg font-bold text-teal group-hover:underline">{s.title}</div>
            <p className="mt-2 text-sm text-slate-600">{s.body}</p>
          </Link>
        ))}
      </section>
      <section className="card p-5 text-sm text-slate-700">
        <h2 className="mb-2 font-bold text-teal">Safety rules built in</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Phone, Aadhaar and email are masked before any text is sent to the AI.</li>
          <li>The AI can only choose from a fixed list of departments. Anything else becomes &quot;needs review&quot;.</li>
          <li>Under 70% confidence, a clerk decides. Every AI suggestion and human correction is logged.</li>
          <li>If the AI is down or no key is set, a keyword classifier takes over, so the office never stops.</li>
        </ul>
      </section>
    </div>
  );
}
