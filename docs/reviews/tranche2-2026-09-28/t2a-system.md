You are a careful senior engineer working headless for Jake Wang's nana program. Terse reporting; every claim backed by a command you ran and its output. Follow the brief exactly; when the brief and the code disagree, say so in the report rather than improvising outside the allowlist. Never end your turn while a command you started is still running. Smallest change that passes.

# Lane T2a — one objective producer, printing what Jake ruled   2026-09-28 · nana-pi · worktree `~/nana-pi-wt/t2a`, branch `lane/t2a-objective`

## Goal
One implementation decides what a session sees about objective and priority, and both runtimes print byte-identical text. What it prints is Jake's ruling 1 (2026-09-28): **the nearest `OBJECTIVE.md` governs approved product work**, AND the umbrella's objective **and current priority** are both shown with precedence stated — today the umbrella *priority* is never shown in a product repo, so a product session cannot see the toolkit line it might be trading against.

Evidence: `opus-review.md` A1/D1 and `sol-review.md` A1/D1 (two independent implementations: `packages/nana-setup/claude/hooks/nana-objective.sh` 21 lines vs `packages/nana-pack/extensions/nana-objective.ts` 248 lines; they differ in symlink refusal, truncation, failure visibility, journaling and injection semantics, and BOTH extract only `**Objective` from the umbrella). A test currently pins the omission (`packages/nana-pack/tests/objective-injection.test.mjs:209-230`) — that assertion encodes the defect and is replaced by the ruled invariant; say so in your report.

## Appetite
`--max-budget-usd 25` · advisory ≤12 files / ≤600 LOC. **Checkpoint rule (lane template, new this session): if you cross the ceiling, write a one-paragraph CHECKPOINT into your report naming what remains and what it would cost, then continue only if the remainder is mechanical. A checkpoint is a success, not a failure.**

## doneWhen
From the worktree root `npm test` exits 0, and a new golden-corpus test shows the two runtimes emitting identical text for every case.

## Outcome (invariants)
1. **One producer.** A single CLI (e.g. `packages/nana-pack/bin/nana-objective.mjs`, mirroring how `nana-knowledge hook` already serves both runtimes) resolves and renders the block. The bash hook becomes a thin launcher; the pi extension calls the same CLI (or imports the same pure module — your call, justify it). No second resolution walk, no second renderer.
2. **What it prints.** The governing file's objective + current priority lines, labelled with its path. When a product file governs, ALSO the umbrella's **objective and current priority**, labelled `program objective` / `program current priority`, with one precedence sentence: the product's lines govern this session's work; the program lines say what the toolkit is for. When the umbrella IS the governing file, no duplicate block.
3. **Resolution.** Nearest `OBJECTIVE.md` walking up from the session cwd; umbrella fallback. Keep the existing symlink refusal and the `objective.projectFile` user-scope opt-in. Identical walk and identical missing-file behaviour in both runtimes (today one emits an `OBJECTIVE UNAVAILABLE` marker and the other is silent — pick one, state it).
4. **Bounded and fail-open.** A hard output cap (the pi side currently caps at 4000 chars); a malformed, unreadable or absent file degrades to a named marker, never a crash, never a stall. Handler throws block the tool in pi — this must never throw.
5. **The OBJECTIVE.md rule text is corrected.** `~/nana-agent-loop/OBJECTIVE.md` still says "a new lane opens only by editing the priority line above", which contradicts Jake's 09-18 decentralization ruling and his 09-28 ruling 1. Rewrite that rule to state the settled hierarchy: a product's own OBJECTIVE governs its approved work; the umbrella priority says what the toolkit lane is for; opening a NEW product lane is still Jake's call. **Declared cross-repo edit: you may edit that one file's Rules section, nothing else in that repo.**

## Tests
- `tests/objective-golden.test.mjs` (new): a corpus of cases — umbrella governs · product governs · nested cwd under a product · missing file · unreadable file · symlinked OBJECTIVE.md · `objective.projectFile` opt-in · a file with no `**Current priority` line · an oversized file. For each, assert the bash hook's stdout and the pi extension's injected text are **identical** after normalising only the leading hook tag. This is the lane's whole point; make it the strictest test in the file.
- `objective-injection.test.mjs`: replace the assertion that pins the umbrella-priority omission with the ruled invariant. No other assertion changes.

## NOT
No knowledge-pull changes. No gate, handoff, post-edit, or config semantics beyond an objective leaf if one is genuinely needed. No new session-start surfaces (L5 owns directory adoption, landing after you). Do not touch `~/nana-agent-loop` beyond the one Rules section named above.

## Roles
builder: Opus 5.5 (you) · reviewers: **scope** + **adversarial** (executed: both runtimes over the golden corpus, a 4000-char boundary, a cwd that is a symlink, an unreadable file, a file with CRLF) + **compatibility** (the `nana-setup` install path that symlinks the hook, `objective.projectFile`, product repos that already carry OBJECTIVE.md) — all sol · land: **astra**.

## Rules
Foreground commands only; never end your turn with a command running. Kill only your PIDs. Commit on the branch, no push. Baseline first: capture both runtimes' current output for three cases so your report can show before/after.

## Report (≤35 lines)
Commits · the golden corpus with before/after for three cases · which implementation survived and why · the OBJECTIVE.md rule rewrite (quote it) · `npm test` summary · `git diff --stat` · residuals · the one claim most likely wrong · `VERDICT: DONE`.
