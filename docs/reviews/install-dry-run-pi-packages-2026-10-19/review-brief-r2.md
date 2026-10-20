# Confirmation round 2 — install-dry-run-pi-packages, 2026-10-19 (Opus, the final reviewer)

Round 1 accepted `e3b73c90` (Opus LAND, Fable LAND 9/10, both recorded). This round reviews only what changed since then: `git diff e3b73c90..HEAD` on `feat/install-dry-run-pi-packages`.

- Why: the seat's land attempt at `e3b73c90` stopped on the full suite: 170 files, 167 PASS, 1 FAIL, 2 SKIP. The one FAIL was `apps/desk/test/knowledge-home-isolation.test.mjs`, "real-pi launchers isolate the knowledge home" (R-898). That check scans every `.mjs` under `docs/reviews/` for a literal `spawn("pi"` and requires each such file to set a temporary knowledge home. The seat's own wrong-code table, `seat-mutate.mjs`, holds pair W8, whose wrong code is the text `spawn("pi", ["install", …])`. The table only writes that text into a scratch worktree; it never launches pi itself. CI ran on `30a5baf9`, before the seat committed the table (`497d2807`), so CI never saw it.
- The change: W8's wrong code now reads `spawn(String("pi"), ["install", …])`. That spawns the same bare name, so the pair means the same thing, and the scanner no longer matches it. No product code, test or row changed.
- The seat re-ran W8 alone, unsplit, at the table's tip `30a5baf9`: `1/1 red`, named R-358, `0 survived` (record `seat-mutate-output-30a5baf9-W8.txt`). It re-ran `node apps/desk/test/knowledge-home-isolation.test.mjs` on the new tip: PASS.

Threat model and class as round 1. Check: (1) W8 still stages the same wrong code; (2) nothing else changed; (3) any MUST.

This is a confirmation round on the final tip after fixes to named findings or a merge of current main. Answer with the full review as your final message: MUST / SHOULD / NOTE, a score, and as the last line exactly `VERDICT: LAND` or `VERDICT: SEND-BACK`.
