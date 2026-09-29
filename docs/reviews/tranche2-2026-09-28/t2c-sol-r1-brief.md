# Review brief — lane T2c: the provenance label (gpt-5.6-sol, round 1 of 3) — roles: scope · adversarial · compatibility

Read-only except probes under a temp HOME (scratch only under /tmp; never modify a worktree). Worktree `~/nana-pi-wt/t2c`, branch `lane/t2c-provenance-label`, commits `3bec2d0` + `a33c77a` on main `72c55d1`. Diff: `t2c-r2.patch`. Reports: `t2c-worker-r1.md`, `t2c-worker-r2.md`. Contract: `t2c-brief.md` + `t2c-fix-brief.md`.

**What this is.** Jake ruled (2026-09-28) that a governing `OBJECTIVE.md` whose folder the owner never vouched for carries a provenance label framed as untrusted DATA — **not** trust-gating. He was shown your r1 recommendation from lane T2a (require nana-trust) and chose the label knowing it is defence in depth, not a boundary. Do not re-litigate the ruling; review the implementation and whether the risk acceptance is recorded honestly.

**The seat already found and sent back one defect** — my own specification error. I had defined "vouched" as "pi would have asked (a trust-requiring `.pi/` resource exists) OR the owner recorded trust". That disjunction is right inside L1's config loader, where it is ANDed with pi's live `isProjectTrusted()`, but used alone it means "pi would have asked", not "you said yes". Seat probe proved the consequence: a folder with `.pi/settings.json` was unlabelled even when `trust.json` recorded **false**. The predicate is now: only a recorded affirmative for the folder or its nearest recorded ancestor clears the label; a recorded `false`, no record, or any unusable store all label. The resource list, the `.agents/skills` walk and `isProjectTrusted()` play no part — which also removes the pi-version drift the worker named as its doubt.

**Seat-verified:** `npm test` → 71 files, 3908 checks, exit 0. Probes: resource + no record → labelled; resource + recorded `false` → labelled; recorded `true` (canonical key) → not labelled, from both a canonical and a non-canonical cwd. My first probe wrongly wrote a NON-canonical key into `trust.json` and read the label as a bug; the implementation canonicalizes like pi does, so a hand-written non-canonical key matches neither nana nor pi — confirm that is the right call.

**Scope role**
S1. 3 files, +250/−9 against a ≤8 file / ≤350 LOC appetite — inside, no checkpoint needed. Verify. Subtraction-test the fail-closed cases (size cap, foreign owner, FIFO, non-regular): each is extra code; does each earn it, or is the store simply "parse it or fail closed"?
S2. NOT-list: no trust gating, no change to which file governs or to precedence, no parsed-line changes, nothing outside the objective producer. Verify the file still governs when labelled.
S3. The worker renamed the predicate and changed the label wording ("never decided trust" → "has not recorded trust") because the old wording was false for a recorded decline. Is the new wording exactly true?

**Adversarial role** — executed probes.
A1. Every trust shape against the REAL store: folder, nearest ancestor, `null` falling through, a nearer `false` over a parent `true`, BOM, symlinked `trust.json`, a store that is a directory, mode 000, a FIFO, >1 MiB, foreign-owned (the worker could only fake `getuid` in-process — try harder if you can), a key with a trailing slash, a key differing by case on a case-insensitive filesystem, a relative key, a `~`-prefixed key.
A2. **Spoofing and suppression.** Can repo content produce or remove a label? An objective line containing the label's own text; a file named to imitate the label; a directory name carrying the wording; a `projectFile` value crafted to change the labelled path. Exactly one real label must appear, and only from the producer.
A3. **Both runtimes byte-identical** on labelled and unlabelled cases — pick five and diff.
A4. Does the label survive the sanitizer correctly — is every path in it through `displayPath()`, including in the labelled case where two paths appear (file and folder)?
A5. Fail-closed direction: find any input where an unusable or ambiguous trust store results in NO label. That would be the defect that matters most.

**Compatibility role**
C1. The behaviour change: repos trusted only in-session now carry the label until `/trust` is run. Spot-check what a session start prints today in two real product repos (`~/aml-desk`, `~/the-hive`) — labelled or not, and is that the right answer for each?
C2. Is the risk acceptance recorded honestly in the pack README — that the label is defence in depth, NOT a boundary, that a model can still follow attacker-authored text, that sol recommended trust-gating and Jake accepted the residual deliberately? Quote what you find and say whether it overclaims.
C3. Anything else that documents the objective contract and now needs the label mentioned (`AGENTS.md`, `templates/_shared/`, doctor).

End with findings severity-sorted, `file:line`, role tag per finding; residuals; `VERDICT: LAND` or `VERDICT: BLOCK`.
