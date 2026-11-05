import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grievance Router – Smart Collectorate demo",
  description: "AI grievance classifier and router for a District Magistrate's office (prototype).",
};

const NAV = [
  { href: "/submit", label: "File a grievance" },
  { href: "/track", label: "Track" },
  { href: "/review", label: "Clerk review" },
  { href: "/cases", label: "Officer cases" },
  { href: "/dashboard", label: "DM dashboard" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="bg-teal text-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            <Link href="/" className="text-lg font-bold">
              Smart Collectorate <span className="font-normal text-white/70">· Grievance Router</span>
            </Link>
            <nav className="flex flex-wrap gap-1 text-sm">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="rounded-md px-3 py-1.5 hover:bg-white/10">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 pb-8 text-xs text-muted">
          Prototype for an assessment. Hypothetical district; sample data only. Demo data is stored in your browser.
        </footer>
      </body>
    </html>
  );
}
