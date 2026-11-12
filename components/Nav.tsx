"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardCheck, FilePlus2, Gauge, Landmark, Search, Briefcase, MessagesSquare } from "lucide-react";

const CITIZEN = [
  { href: "/submit", label: "File a grievance", icon: FilePlus2 },
  { href: "/track", label: "Track", icon: Search },
];
const STAFF = [
  { href: "/review", label: "Clerk review", icon: ClipboardCheck },
  { href: "/cases", label: "Officer cases", icon: Briefcase },
  { href: "/inbox", label: "Dept inbox", icon: MessagesSquare },
  { href: "/dashboard", label: "DM dashboard", icon: Gauge },
];

export function Nav() {
  const path = usePathname();
  const item = ({ href, label, icon: Icon }: (typeof CITIZEN)[number]) => {
    const active = path === href;
    return (
      <Link key={href} href={href} aria-current={active ? "page" : undefined}
        className={`inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-colors ${active ? "bg-white text-teal shadow-sm" : "text-white/90 hover:bg-white/10 hover:text-white"}`}>
        <Icon className="size-4" aria-hidden />
        {label}
      </Link>
    );
  };
  return (
    <header className="bg-teal text-white">
      <div className="h-1 bg-saffron-bright" aria-hidden />
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Smart Collectorate home">
          <span className="grid size-9 place-items-center rounded-lg bg-white/10"><Landmark className="size-5" aria-hidden /></span>
          <span className="leading-tight">
            <span className="block font-[family-name:var(--font-display)] text-base font-semibold">Smart Collectorate</span>
            <span className="block text-xs text-white/75">Grievance Router · शिकायत निवारण</span>
          </span>
        </Link>
        <nav aria-label="Main" className="-mx-1 flex max-w-full items-center gap-1 overflow-x-auto px-1 sm:ml-auto">
          <span className="sr-only">Citizen</span>
          {CITIZEN.map(item)}
          <span className="mx-1.5 h-6 w-px shrink-0 bg-white/25" aria-hidden />
          <span className="sr-only">Staff</span>
          {STAFF.map(item)}
        </nav>
      </div>
    </header>
  );
}
