// Server-side grievance classifier.
// 1. Mask personal data.  2. Ask the LLM (any provider) for strict JSON.
// 3. Validate the answer against the fixed department list.
// 4. If there is no API key, the call fails, or the answer is invalid -> keyword fallback.
// 5. Low confidence or "OTHER" -> needsReview = true (a clerk must confirm).

import { DEPARTMENTS, DEPT_BY_ID, isDepartmentId, type DepartmentId } from "./departments";
import { detectLanguage, maskPII } from "./mask";
import { keywordClassify, REVIEW_THRESHOLD } from "./keyword";
import type { Classification, Urgency } from "./types";

// ---------- LLM prompt ----------
function buildPrompt(maskedText: string) {
  const deptList = DEPARTMENTS.map((d) => `- ${d.id}: ${d.name} — ${d.examples}`).join("\n");
  const system = `You route citizen grievances for a District Magistrate's office in India.
Grievances may be in Hindi, English or a mix (Hinglish). Personal numbers are already masked.

Pick exactly ONE department id from this list. Never invent a new one. If it is unclear or fits none, use OTHER.
${deptList}

Urgency: "high" = risk to life, safety, food or health, or violence/threats; "medium" = normal service failure; "low" = suggestion or minor issue.
confidence = your honest probability (0 to 1) that the department is correct. Use below 0.7 if the text is vague, mentions several departments, or you are guessing.

Reply with ONLY a JSON object, no other text:
{"department": "<ID>", "category": "<short category in English>", "urgency": "high|medium|low",
 "summary": "<one neutral sentence in English for the officer>", "location": "<village/block/ward or null>",
 "scheme": "<government scheme named, or null>", "confidence": <0-1>, "reason": "<one short sentence: why this department>"}`;
  return { system, user: `Grievance:\n"""\n${maskedText}\n"""` };
}

// ---------- provider calls (plain fetch, no SDKs) ----------
type Provider = "anthropic" | "openai" | "gemini";

function pickProvider(): { provider: Provider; key: string; model: string } | null {
  const forced = process.env.LLM_PROVIDER as Provider | undefined;
  const keys: Record<Provider, string | undefined> = {
    anthropic: process.env.ANTHROPIC_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
  };
  const defaults: Record<Provider, string> = {
    anthropic: "claude-sonnet-5-5",
    openai: "gpt-4o-mini",
    gemini: "gemini-2.5-flash",
  };
  const order: Provider[] = forced ? [forced] : ["anthropic", "openai", "gemini"];
  for (const p of order) {
    const key = keys[p];
    if (key) return { provider: p, key, model: process.env.LLM_MODEL || defaults[p] };
  }
  return null;
}

async function callLLM(provider: Provider, key: string, model: string, system: string, user: string): Promise<string> {
  const signal = AbortSignal.timeout(20000);
  if (provider === "anthropic") {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", signal,
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model, max_tokens: 300, system, messages: [{ role: "user", content: user }] }),
    });
    if (!r.ok) throw new Error(`Anthropic ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const j = await r.json();
    return j.content?.find((c: { type: string }) => c.type === "text")?.text ?? "";
  }
  if (provider === "openai") {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", signal,
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        model, temperature: 0, response_format: { type: "json_object" },
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
      }),
    });
    if (!r.ok) throw new Error(`OpenAI ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const j = await r.json();
    return j.choices?.[0]?.message?.content ?? "";
  }
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST", signal,
    headers: { "x-goog-api-key": key, "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { temperature: 0, responseMimeType: "application/json" },
    }),
  });
  if (!r.ok) throw new Error(`Gemini ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  return j.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

function extractJSON(raw: string): Record<string, unknown> {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("No JSON in model output");
  return JSON.parse(raw.slice(start, end + 1));
}

const str = (v: unknown) => (typeof v === "string" && v.trim() && v.trim().toLowerCase() !== "null" ? v.trim() : null);

// ---------- main entry ----------
export async function classifyGrievance(text: string): Promise<Classification & { warning?: string }> {
  const maskedText = maskPII(text);
  const llm = pickProvider();
  if (!llm) return { ...keywordClassify(maskedText), maskedText, warning: "No API key set: using keyword fallback" };

  try {
    const { system, user } = buildPrompt(maskedText);
    const out = extractJSON(await callLLM(llm.provider, llm.key, llm.model, system, user));

    // Guardrail: the department must be from our fixed list.
    const validDept = isDepartmentId(out.department);
    const department: DepartmentId = validDept ? (out.department as DepartmentId) : "OTHER";
    let confidence = Number(out.confidence);
    if (!Number.isFinite(confidence)) confidence = 0.5;
    confidence = Math.max(0, Math.min(1, confidence));
    if (!validDept) confidence = Math.min(confidence, 0.3);
    const urgency: Urgency = ["high", "medium", "low"].includes(out.urgency as string) ? (out.urgency as Urgency) : "medium";

    return {
      department,
      category: str(out.category) ?? DEPT_BY_ID[department].name,
      urgency,
      language: detectLanguage(text),
      summary: str(out.summary) ?? maskedText.slice(0, 140),
      location: str(out.location),
      scheme: str(out.scheme),
      confidence,
      reason: (str(out.reason) ?? "") + (validDept ? "" : " (model returned an unknown department)"),
      needsReview: department === "OTHER" || confidence < REVIEW_THRESHOLD,
      source: `llm:${llm.provider}/${llm.model}`,
      maskedText,
    };
  } catch (e) {
    // Fallback: the office keeps working even if the AI is down.
    const fb = keywordClassify(maskedText);
    return { ...fb, maskedText, needsReview: true, warning: `AI unavailable (${(e as Error).message}); keyword fallback used and sent for review` };
  }
}
