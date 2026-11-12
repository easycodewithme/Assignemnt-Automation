// The fixed list of departments. The AI may only pick from this list.
// slaDays = target days to dispose of a case (assumed; set by the office in discovery).

export type DepartmentId =
  | "REVENUE" | "FOOD" | "RURAL" | "WELFARE" | "POWER"
  | "WATER" | "MUNICIPAL" | "HEALTH" | "POLICE" | "EDUCATION" | "ROADS" | "OTHER";

export interface Department {
  id: DepartmentId;
  name: string;
  nameHi: string;
  slaDays: number;
  examples: string; // shown to the LLM so it knows what belongs here
  keywords: string[]; // used by the no-AI fallback classifier
}

export const DEPARTMENTS: Department[] = [
  {
    id: "REVENUE", name: "Revenue (Land Records)", nameHi: "राजस्व विभाग", slaDays: 30,
    examples: "land records, khatauni, mutation (dakhil-kharij), boundary measurement, encroachment, land disputes",
    keywords: ["land", "khatauni", "khasra", "mutation", "dakhil", "kharij", "boundary", "encroach", "kabza", "patwari", "lekhpal", "जमीन", "ज़मीन", "खतौनी", "खसरा", "दाखिल", "खारिज", "कब्जा", "कब्ज़ा", "नामांतरण", "पैमाइश", "लेखपाल", "पटवारी", "भूमि"],
  },
  {
    id: "FOOD", name: "Food & Civil Supplies", nameHi: "खाद्य एवं रसद विभाग", slaDays: 15,
    examples: "ration card, PDS shop / kotedar not giving grain, wrong quantity, name missing from ration card",
    keywords: ["ration", "pds", "kotedar", "grain", "wheat", "rice", "राशन", "कोटेदार", "अनाज", "गेहूं", "गेहूँ", "चावल", "राशन कार्ड"],
  },
  {
    id: "RURAL", name: "Rural Development", nameHi: "ग्राम्य विकास विभाग", slaDays: 30,
    examples: "MGNREGA wages and job cards, PM Awas housing, village toilets, panchayat works",
    keywords: ["mgnrega", "nrega", "manrega", "job card", "awas", "housing", "wages", "toilet", "pradhan", "panchayat", "मनरेगा", "आवास", "मजदूरी", "मज़दूरी", "जॉब कार्ड", "शौचालय", "प्रधान", "पंचायत"],
  },
  {
    id: "WELFARE", name: "Social Welfare (Pensions)", nameHi: "समाज कल्याण विभाग", slaDays: 21,
    examples: "old-age, widow and disability pensions not received, scholarships",
    keywords: ["pension", "widow", "old age", "disability", "disabled", "scholarship", "पेंशन", "विधवा", "वृद्धा", "वृद्धावस्था", "विकलांग", "दिव्यांग", "छात्रवृत्ति"],
  },
  {
    id: "POWER", name: "Electricity", nameHi: "विद्युत विभाग", slaDays: 7,
    examples: "power cuts, burnt transformer, wrong electricity bill, new connection",
    keywords: ["electricity", "bijli", "transformer", "power cut", "meter", "electric bill", "बिजली", "ट्रांसफार्मर", "ट्रांसफॉर्मर", "मीटर", "बिजली बिल", "कनेक्शन"],
  },
  {
    id: "WATER", name: "Water & Sanitation", nameHi: "जल एवं स्वच्छता विभाग", slaDays: 7,
    examples: "drinking water, broken hand pump, tap connection (Jal Jeevan), blocked drains",
    keywords: ["water", "hand pump", "handpump", "tap", "drain", "पानी", "हैंडपंप", "हैण्डपम्प", "नल", "नाली", "पेयजल", "जल जीवन"],
  },
  {
    id: "MUNICIPAL", name: "Municipal Council (Sewer & Sanitation)", nameHi: "नगर पालिका परिषद", slaDays: 5,
    examples: "town sewer overflow or blockage, garbage not collected, town sanitation (urban areas)",
    keywords: ["sewer", "sewage", "garbage", "kooda", "nagar palika", "municipal", "सीवर", "कूड़ा", "कचरा", "नगर पालिका"],
  },
  {
    id: "HEALTH", name: "Health", nameHi: "स्वास्थ्य विभाग", slaDays: 7,
    examples: "hospital or PHC problems, doctor absent, medicines, ambulance, Ayushman card",
    keywords: ["hospital", "doctor", "phc", "chc", "medicine", "ambulance", "ayushman", "अस्पताल", "डॉक्टर", "डाक्टर", "दवा", "दवाई", "एम्बुलेंस", "आयुष्मान", "इलाज"],
  },
  {
    id: "POLICE", name: "Law & Order (Police)", nameHi: "पुलिस / कानून व्यवस्था", slaDays: 3,
    examples: "threats, violence, theft, harassment, police not registering FIR",
    keywords: ["police", "fir", "threat", "theft", "stolen", "harass", "beat", "fight", "पुलिस", "एफआईआर", "धमकी", "चोरी", "मारपीट", "उत्पीड़न", "थाना"],
  },
  {
    id: "EDUCATION", name: "Education", nameHi: "शिक्षा विभाग", slaDays: 15,
    examples: "government school issues, teacher absent, mid-day meal, admission, uniforms",
    keywords: ["school", "teacher", "mid day meal", "mid-day", "admission", "स्कूल", "विद्यालय", "शिक्षक", "अध्यापक", "मिड डे मील", "दाखिला"],
  },
  {
    id: "ROADS", name: "Public Works (Roads)", nameHi: "लोक निर्माण विभाग", slaDays: 30,
    examples: "broken roads, potholes, bridges, street lights",
    keywords: ["road", "pothole", "bridge", "street light", "सड़क", "सडक", "गड्ढा", "गड्ढे", "पुल", "स्ट्रीट लाइट"],
  },
  {
    id: "OTHER", name: "Unclear – needs manual routing", nameHi: "अन्य", slaDays: 7,
    examples: "anything that does not clearly fit one department above",
    keywords: [],
  },
];

export const DEPT_BY_ID: Record<DepartmentId, Department> = Object.fromEntries(
  DEPARTMENTS.map((d) => [d.id, d]),
) as Record<DepartmentId, Department>;

export const isDepartmentId = (v: unknown): v is DepartmentId =>
  typeof v === "string" && v in DEPT_BY_ID;
