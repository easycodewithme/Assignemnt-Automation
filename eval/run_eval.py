"""Run the labelled test cases against a running app and report routing accuracy.

Usage:  python eval/run_eval.py [base_url]     (default http://localhost:3000)

expect = department id, "OTHER" (must go to review), "REVIEW" (ambiguous: must go to review),
or "JOINT:A,B,..." (several problems: the main department plus "also" must be exactly these).
A case counts as correct if it is routed to the right department(s) automatically,
or if it is sent to human review when that is the expected safe behaviour.
A joint case also counts as correct if it goes to review with the right split suggested.
"""
import json
import sys
import urllib.request
from pathlib import Path

base = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"
cases = json.loads((Path(__file__).parent / "cases.json").read_text(encoding="utf-8"))

ok = auto = wrong_auto = 0
for c in cases:
    req = urllib.request.Request(
        f"{base}/api/classify",
        data=json.dumps({"text": c["text"]}).encode("utf-8"),
        headers={"content-type": "application/json"},
    )
    d = json.load(urllib.request.urlopen(req, timeout=60))
    exp, got, review = c["expect"], d["department"], d["needsReview"]
    if not review:
        auto += 1
    if exp.startswith("JOINT:"):
        want = set(exp[6:].split(","))
        have = {got} | {a["department"] for a in d.get("also") or []}
        good = have == want
        if not good and not review:
            wrong_auto += 1
        got = "+".join(sorted(have))
    elif exp in ("OTHER", "REVIEW"):
        good = review
    else:
        good = got == exp and not review
        if got != exp and not review:
            wrong_auto += 1
    ok += good
    mark = "OK  " if good else ("WRONG" if not review else "REVIEW")
    print(f"{mark:6} expect={exp:28} got={got:24} conf={d['confidence']:.2f} review={review!s:5} [{d['source']}]")

n = len(cases)
print(f"\nCorrect: {ok}/{n} ({ok / n:.0%})   auto-routed: {auto}/{n}   wrongly auto-routed: {wrong_auto}")
