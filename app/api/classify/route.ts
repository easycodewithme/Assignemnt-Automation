import { NextResponse } from "next/server";
import { classifyGrievance } from "@/lib/classify";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { text?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (text.length < 10) return NextResponse.json({ error: "Please describe the problem in at least 10 characters." }, { status: 400 });
  if (text.length > 3000) return NextResponse.json({ error: "Text too long (max 3000 characters)." }, { status: 400 });

  const result = await classifyGrievance(text);
  return NextResponse.json(result);
}

export async function GET() {
  const provider = process.env.ANTHROPIC_API_KEY ? "anthropic" : process.env.OPENAI_API_KEY ? "openai" : process.env.GEMINI_API_KEY ? "gemini" : null;
  return NextResponse.json({ ai: provider ?? "keyword-fallback" });
}
