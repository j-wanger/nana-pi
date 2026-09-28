# Review brief — lane T2a: one objective producer (gpt-5.6-sol, round 1 of 3) — roles: scope · adversarial · compatibility

Read-only except probes under a temp HOME (scratch only under /tmp; never modify a worktree). Worktree `~/nana-pi-wt/t2a`, branch `lane/t2a-objective`, commits `73f5079` + `1fac281` on main `1553c80`. Diff: `~/nana-pi/docs/reviews/tranche2-2026-09-28/t2a-r2.patch`. Reports: `t2a-worker-r1.md`, `t2a-worker-r2.md`. Contract: `t2a-brief.md` + `t2a-fix-brief.md`.

Context: Jake's ruling 1 (2026-09-28) — the nearest `OBJECTIVE.md` governs approved product work, and the umbrella's objective AND current priority are both shown with precedence stated. Before this lane two independent implementations disagreed and neither ever showed the umbrella priority in a product repo.

**The seat already found and sent back one regression** (r1 unified onto pi's semantics, which needed the `objective.projectFile` opt-in, so on a machine with no `nana-pack.json` a product's own objective was ignored and the session was told UNAVAILABLE). r2 restored unconditional walk-up. Verify the fix rather than rediscovering it.

Seat-verified: `npm test` → 69 files, 3323 checks, exit 0.

**Scope role**
S1. Allowlist/NOT respected? 7 files, +599/−214 at r1 (inside the ~600 guide, no checkpoint needed) plus r2. The worker declares changes beyond the brief: a `loadUserObjective()` added to `config.ts`, and in r2 the doctor message, README section and extension header. Justified or creep?
S2. **Vacuous tests.** The worker declared three checks in `objective-injection.test.mjs` that had become unfalsifiable, and its own r1 corpus case 11 that "passed without testing anything". It rewrote them. **Independently verify each rewritten check can FAIL**: revert the producer behaviour it targets (in your own scratch copy) and confirm the check goes red. Any check that cannot be made to fail is a finding.
S3. Did r2's restoration reintroduce anything r1 removed, or weaken a guard (regular-file check, 256 KiB read cap, 12000-char output cap, symlink refusal, never throws)?

**Adversarial role** — executed probes, both runtimes.
A1. Run the golden corpus's premise yourself: pick 5 cases and confirm hook and pi output are byte-identical after stripping only the tag line. Then find a case the corpus does NOT cover where they diverge.
A2. **The provenance question the seat raised to Jake** (`~/nana-pi/HANDOFF.md` item 0a): with walk-up unconditional, any repo's `OBJECTIVE.md` — including a freshly cloned one — becomes governing system-prompt text with no owner opt-in. This is the same class L1's nana-trust and L3's legacy-handoff exclusion were built to close. Assess the actual exposure: what can an attacker-authored `OBJECTIVE.md` make a session do that it could not before? Is the seat's proposed mitigation (a provenance label when the governing file is outside a trusted/owned location, framed as untrusted data like the knowledge pointers) sufficient, or is nana-trust required? **Do not implement — rule on it for Jake.**
A3. Stalls and hangs: a FIFO at the objective path, a 300 MiB file, a file that is a directory, a symlinked cwd, a cwd deleted mid-run, CRLF, invalid UTF-8, a file with 10k `**Objective` lines. The hook must never hang (it runs at every session start) and pi must never throw.
A4. The worker's most-doubted claim: if bash receives a stale `PWD` the walk starts from the wrong directory. Test it (`env PWD=/elsewhere bash hook`).

**Compatibility role**
C1. `nana-setup install` symlinks the hook — does the new launcher still work through that symlink, and does `nana-setup doctor` report truthfully after the r2 message change?
C2. Product repos that already carry `OBJECTIVE.md` (`~/aml-desk`, `~/the-hive`, `~/jev-research`, `~/returner`, `~/game-world`): spot-check two and report what a session start now prints versus before.
C3. `objective.path`, `objective.projectFile` (now rename-only; `null`/`false`/absent all mean `OBJECTIVE.md`), and the user-scope `~/.pi/agent/nana-objective.md` seed — all still honoured, and is the precedence between them documented where an owner reads it?
C4. The uncommitted edit to `~/nana-agent-loop/OBJECTIVE.md` Rules (the seat will commit it): does its wording match what the code now does?

End with findings severity-sorted, `file:line`, role tag per finding; residuals; `VERDICT: LAND` or `VERDICT: BLOCK`.
