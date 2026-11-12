// No-AI fallback classifier: keyword matching in Hindi and English.
// Used when no API key is set, when the AI is down, and to seed demo data.
import { DEPARTMENTS, DEPT_BY_ID, type DepartmentId } from "./departments";
import { detectLanguage } from "./mask";
import type { Classification, Urgency } from "./types";

export const REVIEW_THRESHOLD = 0.7;

const HIGH_URGENCY = ["urgent", "urgently", "emergency", "threat", "danger", "fire", "flood", "dying", "no food", "तुरंत", "आपात", "धमकी", "खतरा", "आग", "बाढ़", "जान से", "भूखे", "मर रहे"];
const LOW_URGENCY = ["suggestion", "request", "सुझाव", "अनुरोध"];

// Split into words (Latin + Devanagari). A single-word keyword matches the start of a word,
// so "pension" matches "pensions" but "जल" (water) does not match inside "बिजली" (electricity).
// Multi-word keywords match as a phrase.
function tokens(text: string): string[] {
  return text.toLowerCase().split(/[^\p{L}\p{M}\p{N}]+/u).filter(Boolean);
}
function matches(text: string, words: string[], keyword: string): boolean {
  const k = keyword.toLowerCase();
  if (k.includes(" ")) return text.includes(k);
  // Short keywords (FIR, PHC, नल) must match a whole word: "fir" must not match "first".
  return words.some((w) => (k.length <= 3 ? w === k : w.startsWith(k)));
}

// ---------- keyword fallback (no AI) ----------
export function keywordClassify(text: string): Omit<Classification, "maskedText"> {
  const lower = text.toLowerCase();
  const words = tokens(text);
  const scores = DEPARTMENTS.filter((d) => d.id !== "OTHER")
    .map((d) => ({ d, score: d.keywords.filter((k) => matches(lower, words, k)).length }))
    .sort((a, b) => b.score - a.score);
  const [top, second] = scores;
  let department: DepartmentId = "OTHER";
  let confidence = 0.3;
  if (top.score > 0) {
    department = top.d.id;
    confidence = Math.min(0.9, 0.55 + 0.12 * top.score);
    if (second.score === top.score) confidence = 0.45; // tie: unsure
    else if (second.score > 0) confidence = Math.min(confidence, 0.55); // mentions two departments: let a person split it
  }
  const urgency: Urgency = HIGH_URGENCY.some((k) => matches(lower, words, k))
    ? "high"
    : LOW_URGENCY.some((k) => matches(lower, words, k)) ? "low" : "medium";
  return {
    department,
    category: department === "OTHER" ? "Unclassified" : DEPT_BY_ID[department].name,
    urgency,
    language: detectLanguage(text),
    summary: text.length > 140 ? text.slice(0, 137) + "..." : text,
    location: null,
    scheme: null,
    confidence,
    reason: top.score > 0
      ? `Matched ${top.score} keyword(s) for ${DEPT_BY_ID[department].name}`
      : "No department keywords found",
    needsReview: department === "OTHER" || confidence < REVIEW_THRESHOLD,
    source: "keyword-fallback",
    // Suggest a joint case when a second department also matches; a clerk confirms it.
    also: top.score > 0 && second.score > 0 ? [{ department: second.d.id, summary: `Also mentions ${DEPT_BY_ID[second.d.id].name.toLowerCase()} problem` }] : [],
  };
}
