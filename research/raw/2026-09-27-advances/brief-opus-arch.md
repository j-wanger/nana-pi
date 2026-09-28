# Brief — architecture review of tranche 1 (Opus 5.5)

You are the architecture reviewer. Read-only over the repos; write only your report. Today is 2026-09-28.

Context: `~/nana-pi/research/agentic-advances-and-nana-review-2026-09-27.md` (synthesis v2) proposes four "tranche 1" changes to nana-pack that do not wait on any human ruling:
1. Config safety — schema-normalize `nana-pack.json` at `loadConfig`; malformed block keeps the default policy; loud log.
2. Gate — self-protection of `nana-pack.json` (both scopes) and Claude settings/hooks; allow-pattern exceptions authorize only the matched segment; missing destructive forms; positive+negative corpus with benign false positives fixed.
3. Handoff — project-trust requirement (or user-scope storage keyed by cwd hash); provenance label; stale-but-trusted summaries become a one-line pointer; reviewer/non-writer behavior for pickup AND compaction writes; one project-root rule shared by config and handoff.
4. Canonical test path — root `npm test` in nana-pi over every package test file + desk unit; fix the inverted `doctor` detail text.

Evidence for the defects: `raw/2026-09-27-advances/opus-review.md` §C (executed probes in `/private/tmp/claude-501/-Users-jwang-nana-agent-loop/3beaf51b-41bb-4cfe-a961-e0a5d433d832/scratchpad/w3/gate-probe.mjs`, `gate2-probe.mjs`), `sol-review.md` §C, and `astra-r1.md` §C/§F (the harm-if-adopted analysis and the blast-radius acceptance contract you must honor).

Read the code: `~/nana-pi/packages/nana-pack/extensions/nana-gate.ts`, `nana-handoff.ts`, `nana-objective.ts`, `nana-post-edit.ts`, `lib/config.ts`, `README.md`, `tests/*.test.mjs`; `~/nana-pi/packages/nana-setup/lib/doctor.mjs` + tests; `~/nana-pi/AGENTS.md` (rules: cross-platform, degrade gracefully, tool_call handler errors BLOCK the tool, gate is advisory-by-load-path); installed pi docs at `$(npm root -g)/@earendil-works/pi-coding-agent/docs/` (extensions.md, security.md, settings.md) for what pi 0.84.4 actually offers (trust API, session events, config resolution).

Deliver, for each of the four items, a lane contract the seat can hand to a headless Opus 5.5 worker:
- Outcome (what is true after), not design prescription (DOCTRINE: spec the contract, not the design).
- Invariants + the deterministic tests that pin them (name the test file and each case; include the gate-survives-after mutation test for the gate lane).
- File allowlist and what the lane must NOT touch.
- Pi-extension constraints that shape the design (e.g. handler errors block the tool; project trust API; where cwd vs root can be resolved; win32).
- Conflicts or coupling between the four lanes (shared `config.ts`; handoff root rule vs objective walk) and the safe sequencing.
- Where the change would break an existing documented feature or test (name it) and what the replacement contract is.
- Honest cost including tests + the adversarial pass, and the one claim you'd most expect to be wrong.

Also answer: is item 3's "one project-root rule" a tranche-1 change or does it belong with the objective-producer lane (tranche 2, after Jake's ruling)? Recommend.

Write to `~/nana-pi/research/raw/2026-09-27-advances/opus-arch-tranche1.md` with the Write tool; final message ≤10 lines ending `VERDICT: DONE`.
