"use client";
// Demo storage: grievances live in the browser (localStorage) so the prototype
// needs no database and can be deployed anywhere. Production would use PostgreSQL
// with an append-only audit table (see README).

import { useCallback, useEffect, useState } from "react";
import { DEPT_BY_ID, type DepartmentId } from "./departments";
import { keywordClassify } from "./keyword";
import { maskPhone } from "./mask";
import type { Circular, Classification, DeptRequest, Grievance, HistoryEntry, Status } from "./types";

const KEY = "grievance-router:v2";
const CIRC_KEY = "grievance-router:circulars:v1";
const DAY = 86_400_000;
const nowIso = () => new Date().toISOString();

export function newId(n: number) {
  return `DM-2026-${String(n).padStart(5, "0")}`;
}

type Input = { citizenName: string; phone: string; block: string; text: string };
type Part = { department: DepartmentId; summary: string };

/** Extra parts of a joint case: one child case per extra department, linked to the parent ID. */
function makeParts(parent: Grievance, parts: Part[], at: string, startIndex = 0): Grievance[] {
  return parts.map((p, i) => ({
    ...parent,
    id: `${parent.id}-${String.fromCharCode(66 + startIndex + i)}`, // -B, -C, ...
    jointId: parent.id,
    department: p.department,
    status: "assigned" as Status,
    resolvedAt: undefined,
    dueAt: new Date(new Date(at).getTime() + DEPT_BY_ID[p.department].slaDays * DAY).toISOString(),
    ai: { ...parent.ai, department: p.department, summary: p.summary, also: [] },
    notes: [], requests: [], transfers: 0, pendingTransfer: undefined,
    history: [
      { at, actor: "system", action: `Part of joint case ${parent.id} (lead: ${DEPT_BY_ID[parent.department].name})` },
      { at, actor: "system", action: `Sent to ${DEPT_BY_ID[p.department].name}: ${p.summary}` },
    ],
  }));
}

export function makeGrievance(seq: number, input: Input, ai: Classification, createdAt = new Date()): Grievance[] {
  const dept = ai.department;
  const at = createdAt.toISOString();
  const dueAt = new Date(createdAt.getTime() + DEPT_BY_ID[dept].slaDays * DAY);
  const status: Status = ai.needsReview ? "needs_review" : "assigned";
  const also = ai.also ?? [];
  const history: HistoryEntry[] = [
    { at, actor: "system", action: "Grievance received; tracking ID sent by SMS" },
    { at, actor: "AI", action: `Suggested ${DEPT_BY_ID[dept].name} (${Math.round(ai.confidence * 100)}% confidence, ${ai.source})` },
    ai.needsReview
      ? { at, actor: "system", action: "Low confidence: sent to clerk review queue" }
      : { at, actor: "system", action: `Auto-routed to ${DEPT_BY_ID[dept].name}` },
  ];
  if (also.length && !ai.needsReview)
    history.push({ at, actor: "AI", action: `Several problems found → joint case. ${DEPT_BY_ID[dept].name} leads; also sent to ${also.map((a) => DEPT_BY_ID[a.department].name).join(", ")}` });
  const g: Grievance = {
    id: newId(seq), createdAt: at, dueAt: dueAt.toISOString(),
    citizenName: input.citizenName, phoneMasked: maskPhone(input.phone), block: input.block,
    text: input.text, status, department: dept, ai, history, notes: [], requests: [], transfers: 0,
  };
  return ai.needsReview || !also.length ? [g] : [g, ...makeParts(g, also, at)];
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
  ["Meri gali mein sewer overflow ho raha hai, isliye paani nahi aa raha, aur bijli bhi baar-baar ja rahi hai.", "Sadar", 3, "in_progress"],
];
const NAMES = ["Ramesh Kumar", "Sunita Devi", "Mohd. Irfan", "Geeta Yadav", "Rajpal Singh", "Kamla Devi", "Anil Verma", "Shabana Bano", "Suresh Pal", "Pooja Sharma"];

function seed(): Grievance[] {
  const now = Date.now();
  const ago = (d: number) => new Date(now - d * DAY).toISOString();
  const out: Grievance[] = [];
  SEED.forEach(([text, block, daysAgo, status], i) => {
    const n = i + 1;
    const ai: Classification = { ...keywordClassify(text), maskedText: text, source: "seed-data", also: [] };
    ai.needsReview = status === "needs_review";
    if (n === 26) {
      // The proposal deck's example: one complaint, three departments, sewer is the root cause.
      Object.assign(ai, {
        department: "MUNICIPAL", category: "Sewer overflow", urgency: "high", confidence: 0.88,
        summary: "Sewer overflowing in the street (root cause); it has cut the water supply.",
        reason: "Sewer overflow is the root cause and a health risk",
        also: [
          { department: "WATER", summary: "No water supply: line contaminated by the sewer overflow; restart after sewer is cleared." },
          { department: "POWER", summary: "Repeated power cuts in the same street." },
        ],
      });
    }
    const parts = makeGrievance(n, { citizenName: NAMES[i % NAMES.length], phone: `98${String(10000000 + i * 7919).slice(0, 8)}`, block, text }, ai, new Date(now - daysAgo * DAY - i * 3_600_000));
    const g = parts[0];
    g.status = status;
    if (status === "resolved") {
      const took = Math.max(1, Math.round(daysAgo * 0.6));
      g.resolvedAt = new Date(new Date(g.createdAt).getTime() + took * DAY).toISOString();
      g.history.push({ at: g.resolvedAt, actor: "officer", action: "Marked resolved; citizen informed by SMS" });
    }
    // ---- internal communication examples ----
    if (n === 3) { // land encroachment: Revenue needs a police report first (overdue)
      g.requests = [{ id: "REQ-1", at: ago(12), from: "REVENUE", to: "POLICE", ask: "Send police for the land measurement (paimaish) and report on the encroachment; there is a threat of a fight.", dueAt: ago(5), status: "open" }];
      g.notes = [{ at: ago(12), by: "Revenue (Land Records)", text: "Lekhpal is ready to measure but needs police present." }];
      g.history.push({ at: ago(12), actor: "officer", action: "Report requested from Law & Order (Police), due in 7 days" });
    }
    if (n === 16) { // PM Awas: Rural asked Revenue to confirm land ownership (answered)
      g.requests = [{ id: "REQ-2", at: ago(20), from: "RURAL", to: "REVENUE", ask: "Confirm the plot is in the applicant's name before the 2nd instalment is released.", dueAt: ago(13), status: "answered", reply: "Confirmed: khasra 214 is in the applicant's name. Khatauni copy attached.", answeredAt: ago(15) }];
      g.history.push({ at: ago(15), actor: "officer", action: "Revenue (Land Records) replied to report request" });
    }
    if (n === 8) { // village road: bounced once, second transfer waits for ADM approval
      g.department = "RURAL"; g.transfers = 1;
      g.history.push({ at: ago(40), actor: "officer", action: "Transferred Public Works (Roads) → Rural Development. Reason: village link road belongs to the panchayat" });
      g.pendingTransfer = { to: "ROADS", by: "RURAL", at: ago(2), reason: "It is a PWD major district road, not a panchayat road" };
      g.history.push({ at: ago(2), actor: "officer", action: "Asked to transfer back to Public Works (Roads): waiting for ADM approval (second transfer)" });
    }
    if (n === 4) g.notes = [{ at: ago(8), by: "Electricity", text: "New transformer issued from store; crane booked for tomorrow." }];
    if (n === 26) {
      g.notes = [{ at: ago(2), by: "Municipal Council (Sewer & Sanitation)", text: "Sewer line jetting team sent; expect clear by tomorrow. Water team: please wait for our update before flushing the line." }];
      parts[1].notes = [{ at: ago(1), by: "Water & Sanitation", text: "Ready to flush and restart supply as soon as Municipal confirms the sewer is clear." }];
      parts[2].status = "resolved";
      parts[2].resolvedAt = ago(1);
      parts[2].history.push({ at: ago(1), actor: "officer", action: "Loose feeder cable fixed; marked resolved, citizen informed by SMS" });
    }
    out.push(...parts);
  });
  return out;
}

const SEED_CIRCULARS = (): Circular[] => [{
  id: "CIR-1", at: new Date(Date.now() - 2 * DAY).toISOString(),
  title: "Monsoon preparedness: drains, sewers and transformers",
  body: "Report drain and sewer cleaning and transformer checks in your area by Friday. Where your work depends on another department, raise a joint case or a report request in the system, not on WhatsApp.",
  to: ["WATER", "MUNICIPAL", "POWER", "ROADS", "RURAL", "HEALTH"],
  acks: { WATER: new Date(Date.now() - DAY).toISOString(), ROADS: new Date(Date.now() - DAY).toISOString() },
}];

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
function loadCirculars(): Circular[] {
  try {
    const raw = localStorage.getItem(CIRC_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const c = SEED_CIRCULARS();
  saveCirculars(c);
  return c;
}
function saveCirculars(c: Circular[]) {
  try { localStorage.setItem(CIRC_KEY, JSON.stringify(c)); } catch {}
}

export function useGrievances() {
  const [list, setList] = useState<Grievance[] | null>(null);
  const [circulars, setCirculars] = useState<Circular[]>([]);
  useEffect(() => {
    setList(load());
    setCirculars(loadCirculars());
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setList(load());
      if (e.key === CIRC_KEY) setCirculars(loadCirculars());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const commit = useCallback((next: Grievance[]) => { save(next); setList(next); }, []);

  const add = useCallback((input: Input, ai: Classification) => {
    const cur = load();
    const seq = cur.filter((g) => !g.jointId).length + 1;
    const parts = makeGrievance(seq, input, ai);
    commit([...parts, ...cur]);
    return parts;
  }, [commit]);

  /** Change one case and append to its audit history. */
  const edit = useCallback((id: string, fn: (g: Grievance) => Partial<Grievance>, actor: string, action: string) => {
    const cur = load();
    commit(cur.map((g) => g.id === id
      ? { ...g, ...fn(g), history: [...g.history, { at: nowIso(), actor, action }] }
      : g));
  }, [commit]);

  const update = useCallback((id: string, patch: Partial<Grievance>, actor: string, action: string) =>
    edit(id, () => patch, actor, action), [edit]);

  /** Clerk confirms or corrects the AI, optionally keeping the extra parts of a joint case. */
  const route = useCallback((id: string, dept: DepartmentId, parts: Part[] = [], actor = "clerk") => {
    const cur = load();
    const g0 = cur.find((g) => g.id === id);
    if (!g0) return;
    const changed = dept !== g0.ai.department;
    const at = nowIso();
    const g: Grievance = {
      ...g0, department: dept, status: "assigned",
      dueAt: new Date(new Date(g0.createdAt).getTime() + DEPT_BY_ID[dept].slaDays * DAY).toISOString(),
      history: [...g0.history, {
        at, actor, action: changed
          ? `Corrected AI suggestion → ${DEPT_BY_ID[dept].name} (logged for model improvement)`
          : `Confirmed AI suggestion → ${DEPT_BY_ID[dept].name}`,
      }],
    };
    const keep = parts.filter((p) => p.department !== dept);
    if (keep.length) g.history.push({ at, actor, action: `Joint case: ${DEPT_BY_ID[dept].name} leads; also sent to ${keep.map((p) => DEPT_BY_ID[p.department].name).join(", ")}` });
    commit(cur.flatMap((x) => (x.id === id ? [g, ...makeParts(g, keep, at)] : [x])));
  }, [commit]);

  // ---------- internal communication ----------
  const addNote = useCallback((id: string, by: string, text: string) =>
    edit(id, (g) => ({ notes: [...(g.notes ?? []), { at: nowIso(), by, text }] }), "officer", `Case note added by ${by}`), [edit]);

  const requestReport = useCallback((id: string, from: DepartmentId, to: DepartmentId, ask: string, days: number) =>
    edit(id, (g) => {
      const r: DeptRequest = { id: `REQ-${Date.now().toString(36).toUpperCase()}`, at: nowIso(), from, to, ask, dueAt: new Date(Date.now() + days * DAY).toISOString(), status: "open" };
      return { requests: [...(g.requests ?? []), r] };
    }, "officer", `Report requested from ${DEPT_BY_ID[to].name}, due in ${days} day(s)`), [edit]);

  const answerRequest = useCallback((id: string, reqId: string, reply: string) => {
    const r = load().find((x) => x.id === id)?.requests?.find((x) => x.id === reqId);
    if (!r) return;
    edit(id, (g) => ({
      requests: (g.requests ?? []).map((x) => x.id === reqId ? { ...x, status: "answered" as const, reply, answeredAt: nowIso() } : x),
    }), "officer", `${DEPT_BY_ID[r.to].name} replied to the report request`);
  }, [edit]);

  /** First transfer happens at once (reason required); a second one needs ADM approval. */
  const transfer = useCallback((id: string, to: DepartmentId, reason: string) => {
    const g = load().find((x) => x.id === id);
    if (!g) return;
    const from = g.department;
    if ((g.transfers ?? 0) >= 1) {
      edit(id, () => ({ pendingTransfer: { to, reason, by: from, at: nowIso() } }), "officer",
        `Asked to transfer to ${DEPT_BY_ID[to].name}: waiting for ADM approval (second transfer). Reason: ${reason}`);
      return;
    }
    edit(id, (g) => ({
      department: to, status: "assigned", transfers: (g.transfers ?? 0) + 1,
      dueAt: new Date(Date.now() + DEPT_BY_ID[to].slaDays * DAY).toISOString(),
    }), "officer", `Transferred ${DEPT_BY_ID[from].name} → ${DEPT_BY_ID[to].name}. Reason: ${reason}`);
  }, [edit]);

  const decideTransfer = useCallback((id: string, approve: boolean) => {
    const g = load().find((x) => x.id === id);
    const p = g?.pendingTransfer;
    if (!g || !p) return;
    edit(id, (g) => approve
      ? { department: p.to, status: "assigned", transfers: (g.transfers ?? 0) + 1, pendingTransfer: undefined, dueAt: new Date(Date.now() + DEPT_BY_ID[p.to].slaDays * DAY).toISOString() }
      : { pendingTransfer: undefined },
    "ADM", approve ? `Approved transfer to ${DEPT_BY_ID[p.to].name}` : `Rejected transfer to ${DEPT_BY_ID[p.to].name}: ${DEPT_BY_ID[g.department].name} keeps the case`);
  }, [edit]);

  /** Add a supporting department to an existing case (turns it into a joint case). */
  const addPart = useCallback((id: string, department: DepartmentId, summary: string) => {
    const cur = load();
    const g = cur.find((x) => x.id === id);
    if (!g) return;
    const rootId = g.jointId ?? g.id;
    const root = cur.find((x) => x.id === rootId) ?? g;
    const count = cur.filter((x) => x.jointId === rootId).length;
    const at = nowIso();
    const [part] = makeParts(root, [{ department, summary }], at, count);
    commit(cur.flatMap((x) => x.id === rootId
      ? [{ ...x, history: [...x.history, { at, actor: "officer", action: `Joint case: added ${DEPT_BY_ID[department].name} (${summary})` }] }, part]
      : [x]));
  }, [commit]);

  const postCircular = useCallback((title: string, body: string, to: DepartmentId[]) => {
    const next: Circular[] = [{ id: `CIR-${Date.now().toString(36).toUpperCase()}`, at: nowIso(), title, body, to, acks: {} }, ...loadCirculars()];
    saveCirculars(next); setCirculars(next);
  }, []);
  const ackCircular = useCallback((cid: string, dept: DepartmentId) => {
    const next = loadCirculars().map((c) => c.id === cid ? { ...c, acks: { ...c.acks, [dept]: nowIso() } } : c);
    saveCirculars(next); setCirculars(next);
  }, []);

  const reset = useCallback(() => {
    commit(seed());
    const c = SEED_CIRCULARS();
    saveCirculars(c); setCirculars(c);
  }, [commit]);

  return { list, circulars, add, update, route, reset, addNote, requestReport, answerRequest, transfer, decideTransfer, addPart, postCircular, ackCircular };
}

// ---------- helpers for views ----------
export const isOpen = (g: Grievance) => g.status !== "resolved";
export const isOverdue = (g: Grievance, now = Date.now()) => isOpen(g) && new Date(g.dueAt).getTime() < now;
export const ageDays = (g: Grievance, now = Date.now()) =>
  Math.floor(((g.resolvedAt ? new Date(g.resolvedAt).getTime() : now) - new Date(g.createdAt).getTime()) / DAY);
export const daysLeft = (g: Grievance, now = Date.now()) => Math.ceil((new Date(g.dueAt).getTime() - now) / DAY);
export const openRequests = (g: Grievance) => (g.requests ?? []).filter((r) => r.status === "open");
/** All parts of the joint case this case belongs to (including itself), lead first. */
export const jointParts = (list: Grievance[], g: Grievance) => {
  const root = g.jointId ?? g.id;
  return list.filter((x) => x.id === root || x.jointId === root).sort((a, b) => a.id.localeCompare(b.id));
};
