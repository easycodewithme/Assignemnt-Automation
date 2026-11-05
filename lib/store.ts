"use client";
// Demo storage: grievances live in the browser (localStorage) so the prototype
// needs no database and can be deployed anywhere. Production would use PostgreSQL
// with an append-only audit table (see README).

import { useCallback, useEffect, useState } from "react";
import { DEPT_BY_ID, type DepartmentId } from "./departments";
import { keywordClassify } from "./keyword";
import { maskPhone } from "./mask";
import type { Classification, Grievance, HistoryEntry, Status } from "./types";

const KEY = "grievance-router:v1";
const DAY = 86_400_000;

export function newId(n: number) {
  return `DM-2026-${String(n).padStart(5, "0")}`;
}

export function makeGrievance(
  seq: number,
  input: { citizenName: string; phone: string; block: string; text: string },
  ai: Classification,
  createdAt = new Date(),
): Grievance {
  const dept = ai.department;
  const dueAt = new Date(createdAt.getTime() + DEPT_BY_ID[dept].slaDays * DAY);
  const status: Status = ai.needsReview ? "needs_review" : "assigned";
  const history: HistoryEntry[] = [
    { at: createdAt.toISOString(), actor: "system", action: "Grievance received; tracking ID sent by SMS" },
    {
      at: createdAt.toISOString(), actor: "AI",
      action: `Suggested ${DEPT_BY_ID[dept].name} (${Math.round(ai.confidence * 100)}% confidence, ${ai.source})`,
    },
    ai.needsReview
      ? { at: createdAt.toISOString(), actor: "system", action: "Low confidence: sent to clerk review queue" }
      : { at: createdAt.toISOString(), actor: "system", action: `Auto-routed to ${DEPT_BY_ID[dept].name}` },
  ];
  return {
    id: newId(seq), createdAt: createdAt.toISOString(), dueAt: dueAt.toISOString(),
    citizenName: input.citizenName, phoneMasked: maskPhone(input.phone), block: input.block,
    text: input.text, status, department: dept, ai, history,
  };
}

// ---------- seed data ----------
const SEED: [string, string, number, Status][] = [
  ["मेरे गांव में पिछले तीन महीने से कोटेदार राशन नहीं दे रहा है। राशन कार्ड होने के बाद भी अनाज नहीं मिला।", "Sadar", 4, "assigned"],
  ["My widow pension has not come for 5 months. I have applied twice at the block office.", "Bilaspur", 12, "in_progress"],
  ["हमारे खेत पर पड़ोसी ने कब्जा कर लिया है, लेखपाल पैमाइश नहीं कर रहे।", "Rampur", 41, "in_progress"],
  ["Transformer burnt 6 days ago, whole village without bijli. Nobody from the department came.", "Sadar", 9, "in_progress"],
  ["गांव का हैंडपंप दो हफ्ते से खराब है, पीने का पानी नहीं है।", "Milak", 10, "assigned"],
  ["MGNREGA wages for 40 days work not paid since March. Pradhan says money not come.", "Shahabad", 35, "in_progress"],
  ["PHC में डॉक्टर हफ्ते में सिर्फ एक दिन आते हैं, दवा भी नहीं मिलती।", "Bilaspur", 3, "assigned"],
  ["Road from village to block is full of potholes, school children fall daily.", "Swar", 50, "in_progress"],
  ["मनरेगा जॉब कार्ड बनाने के लिए प्रधान पैसे मांग रहा है।", "Milak", 20, "resolved"],
  ["Mid day meal in primary school is not being given for 2 weeks.", "Sadar", 6, "resolved"],
  ["पड़ोसी जान से मारने की धमकी दे रहे हैं, थाने में एफआईआर नहीं लिखी जा रही।", "Rampur", 2, "in_progress"],
  ["My khatauni has wrong name after mutation (dakhil kharij). Need correction.", "Shahabad", 45, "assigned"],
  ["वृद्धावस्था पेंशन का फॉर्म छह महीने पहले भरा था, अभी तक कुछ नहीं हुआ।", "Swar", 33, "in_progress"],
  ["Electricity bill is 4 times higher than usual, meter seems faulty.", "Sadar", 14, "assigned"],
  ["नाली बंद है, गली में गंदा पानी भरा रहता है।", "Bilaspur", 5, "resolved"],
  ["PM Awas installment second not received, house half built.", "Milak", 60, "in_progress"],
  ["Ayushman card not working at district hospital, asked to pay for operation.", "Sadar", 1, "assigned"],
  ["स्कूल में शिक्षक रोज़ देर से आते हैं और बच्चों को पढ़ाते नहीं।", "Swar", 18, "resolved"],
  ["Ration card name of my son not added even after 3 applications.", "Rampur", 25, "in_progress"],
  ["Street light on main market road not working since one month.", "Shahabad", 15, "resolved"],
  ["Please help, the officer is not listening.", "Sadar", 1, "needs_review"],
  ["मेरी समस्या का समाधान नहीं हुआ, कृपया देखें।", "Milak", 2, "needs_review"],
  ["Scholarship for SC students not credited for last year.", "Bilaspur", 28, "assigned"],
  ["गांव में दो दिन से बिजली नहीं है और पानी की टंकी भी खाली है।", "Swar", 1, "needs_review"],
  ["Land boundary dispute with neighbour, patwari takes bribe.", "Rampur", 22, "resolved"],
];
const NAMES = ["Ramesh Kumar", "Sunita Devi", "Mohd. Irfan", "Geeta Yadav", "Rajpal Singh", "Kamla Devi", "Anil Verma", "Shabana Bano", "Suresh Pal", "Pooja Sharma"];

function seed(): Grievance[] {
  const now = Date.now();
  return SEED.map(([text, block, daysAgo, status], i) => {
    const ai: Classification = { ...keywordClassify(text), maskedText: text, source: "seed-data" };
    if (status !== "needs_review") ai.needsReview = false;
    if (status === "needs_review") ai.needsReview = true;
    const g = makeGrievance(i + 1, { citizenName: NAMES[i % NAMES.length], phone: `98${String(10000000 + i * 7919).slice(0, 8)}`, block, text }, ai, new Date(now - daysAgo * DAY - i * 3_600_000));
    g.status = status;
    if (status === "resolved") {
      const took = Math.max(1, Math.round(daysAgo * 0.6));
      g.resolvedAt = new Date(new Date(g.createdAt).getTime() + took * DAY).toISOString();
      g.history.push({ at: g.resolvedAt, actor: "officer", action: "Marked resolved; citizen informed by SMS" });
    }
    return g;
  });
}

// ---------- persistence ----------
function load(): Grievance[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const s = seed();
  save(s);
  return s;
}
function save(list: Grievance[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
}

export function useGrievances() {
  const [list, setList] = useState<Grievance[] | null>(null);
  useEffect(() => {
    setList(load());
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) setList(load()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const commit = useCallback((next: Grievance[]) => { save(next); setList(next); }, []);

  const add = useCallback((input: { citizenName: string; phone: string; block: string; text: string }, ai: Classification) => {
    const cur = load();
    const g = makeGrievance(cur.length + 1, input, ai);
    commit([g, ...cur]);
    return g;
  }, [commit]);

  const update = useCallback((id: string, patch: Partial<Grievance>, actor: string, action: string) => {
    const cur = load();
    commit(cur.map((g) => g.id === id
      ? { ...g, ...patch, history: [...g.history, { at: new Date().toISOString(), actor, action }] }
      : g));
  }, [commit]);

  const route = useCallback((id: string, dept: DepartmentId, actor = "clerk") => {
    const cur = load().find((g) => g.id === id);
    if (!cur) return;
    const changed = dept !== cur.ai.department;
    update(id, {
      department: dept, status: "assigned",
      dueAt: new Date(new Date(cur.createdAt).getTime() + DEPT_BY_ID[dept].slaDays * DAY).toISOString(),
    }, actor, changed
      ? `Corrected AI suggestion → ${DEPT_BY_ID[dept].name} (logged for model improvement)`
      : `Confirmed AI suggestion → ${DEPT_BY_ID[dept].name}`);
  }, [update]);

  const reset = useCallback(() => commit(seed()), [commit]);

  return { list, add, update, route, reset };
}

// ---------- helpers for views ----------
export const isOpen = (g: Grievance) => g.status !== "resolved";
export const isOverdue = (g: Grievance, now = Date.now()) => isOpen(g) && new Date(g.dueAt).getTime() < now;
export const ageDays = (g: Grievance, now = Date.now()) =>
  Math.floor(((g.resolvedAt ? new Date(g.resolvedAt).getTime() : now) - new Date(g.createdAt).getTime()) / DAY);
export const daysLeft = (g: Grievance, now = Date.now()) => Math.ceil((new Date(g.dueAt).getTime() - now) / DAY);
