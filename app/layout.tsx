import type { Metadata, Viewport } from "next";
import { Lexend, Noto_Sans } from "next/font/google";
import { ShieldCheck } from "lucide-react";
import { Nav } from "@/components/Nav";
import "./globals.css";

const heading = Lexend({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-heading", display: "swap" });
const body = Noto_Sans({ subsets: ["latin", "devanagari"], weight: ["400", "500", "600", "700"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: "Grievance Router – Smart Collectorate demo",
  description: "AI grievance classifier and router for a District Magistrate's office (prototype).",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0f4c4a" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable}`}>
      <body className="flex min-h-screen flex-col antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-teal focus:shadow">
          Skip to content
        </a>
        <Nav />
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">{children}</main>
        <footer className="border-t border-line bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-4 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-4 text-teal" aria-hidden /> Phone and Aadhaar numbers are masked before AI processing.</span>
            <span className="sm:ml-auto">Assessment prototype · hypothetical district · demo data stays in your browser</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
