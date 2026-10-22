# Research: review tool (pi-review, review-round, review-ledger, nana-land)

Lane: process, 2026-10-13. Research only. The repo was read at main `9974218`. Nothing in the repo was edited.
Scratch evidence in this folder: `overcap-raw.jsonl` (distinct over-cap reasons by repo), `reparse.mjs`
(re-reads recorded review outputs with main's verdict reader), `probe-land.mjs` and `probe-land-output.txt`
(nana-land probe in a scratch repo with a scratch home).

## Q1. Does pi-review append a standard instruction today?

Yes, one. It is an orientation sentence, not a verdict or materiality instruction.

- `packages/nana-pack/bin/pi-review.mjs:177`:
  ```js
  r = await runWatchdog('pi-review', { ...w, cwd: tempRoot, piArgs: [...w.piArgs, '--append-system-prompt', `Your cwd is an immutable checkout of revision ${sourceRevision} at ${tempRoot}; read files there, not in other worktrees`], childEnv: { NANA_ROLE: 'reviewer', NANA_REVIEW_ROOT: tempRoot }, accept: reviewShaped });
  ```
- R-974 pins it (`REQUIREMENTS.md:419`): the test's fake pi prints `"$*"` as its fourth line, and
  `packages/nana-pack/tests/immutable-review.test.mjs:89` checks that line `.includes(...)` the sentence.
- The only success check on the review's content is `review-shape.mjs:15`: `/^[^\w\r\n]*VERDICT\b/m`. That means
  some line starts with `VERDICT`. Nothing tells the reviewer where to put the verdict line or which words to use. Today
  every brief carries that rule. It comes in two conflicting styles:
  - nana-pi briefs since 10-13 say "last line exactly `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not use
    LAND-WITH-FIXES." See `docs/reviews/ci-pi-pin-2026-10-13/review-brief.md:8-14,28`.
  - yokai-world briefs say "the FIRST line must be exactly `VERDICT: <WORD> <n>/10` … where <WORD> is LAND,
    LAND-WITH-FIXES or SEND-BACK … The word "verdict" must appear nowhere else". This is in 26+ briefs under
    `~/yokai-world/docs/reviews/*/`.
  - Shared memory `~/.claude/nana-memory/shared/reference_pi_review_procedure.md` ("The review must start with
    a VERDICT line") still says: "Every review brief must say: first line exactly `VERDICT: LAND | LAND-WITH-FIXES | SEND-BACK`."
    This is stale against the owner's 10-13 ruling. Seats in every repo read it.
- `pi-worker` already loads a prompt file the same way. `pi-worker.mjs:92-98` reads `prompts/builder-preamble.md`,
  renders it to a temp file, and passes `--append-system-prompt <preambleFile> --append-system-prompt <briefPath>`.

### pi facts (pi 1.0.2, installed)
- `--append-system-prompt` can be repeated. Sources: `docs/cli.md:219-220` ("Appends text or an existing file … and is
  repeatable") and `dist/cli/args.js:74-76` (pushes to an array).
- The parts are joined with a blank line: `dist/core/agent-session.js:1243` (`join("\n\n")`). They go into the
  system-prompt addendum (`dist/core/system-prompt.js:95-96`), in argv order.
- Text or path: `dist/core/resource-loader.js:100-114` (`resolvePromptInput`). An existing path is read. Anything
  else, including a **missing** path, is appended as literal text without a word. Passing a file path therefore fails open
  if the file is missing.

## Q2. Where should a standard last-line verdict instruction and the materiality bar go?

**Recommendation:** put it in `pi-review.mjs:177`, as a second `--append-system-prompt` placed **after** the
immutable-checkout sentence. Keep the text in one declared file, `packages/nana-pack/prompts/review-standard.md`.
That file sits beside `builder-preamble.md`; it is the declared surface for a contract value, not an inline literal.
pi-review reads the file itself with `readFileSync`, before the detached worktree is created, and passes the **text**,
not the path. If the file is unreadable, pi-review refuses before admission, so no round is consumed. Passing the
path instead would risk the silent literal-path fallback described above.

Why this spot carries it exactly once per call:
- Every pi-review launch goes through line 177. There is no worker mode (`--worker` was removed, `review-round.mjs:467-470`).
- `runWatchdog` reuses the same `piArgs` on each attempt (`pi-watchdog.mjs:104`), and each attempt is a fresh pi
  session. So each attempt sees it exactly once.
- Placing it after the immutable sentence keeps R-974's test green. The fake pi's line 4 (`"$*"`) still contains that
  sentence before any newline the new text adds.

What it does **not** cover:
- `review-ledger run` wraps an arbitrary command, for example `claude -p` (`review-ledger.mjs:86-92`). It cannot
  inject a system prompt. That path keeps relying on the brief. Record this as a residual. Do not add machinery for it.
- Briefs that still paste the bar will show it twice. The working pattern and the builder-brief rules should say that
  pi-review carries the bar, so briefs state only the threat model and the lane class.

Proposed text. It is compatible with the parser. I checked each verdict form below against `verdictWord`
(`review-round.mjs:413-444`):
> Classify every finding MUST, SHOULD or NOTE. A MUST names a realistic input under the brief's threat model and a
> consequence that matters: data lost or corrupted, a security or review boundary bypassed in practice, wrong output
> someone acts on, a broken install, hook or CI gate, or a regression of behaviour main has today. If you cannot name
> both, it is a SHOULD or NOTE. Contrived inputs, rare edge cases, wording, citation bookkeeping and test-evidence gaps
> are SHOULD or NOTE. A confirmation round reviews only the change since the last round and whether the named MUSTs are
> closed. Give the full review in your final message; do not write it to a file. The last line of your answer is
> exactly `VERDICT: LAND` when there is no MUST, or `VERDICT: SEND-BACK` when there is one, optionally followed by a
> score such as 9/10. Do not use LAND-WITH-FIXES. Write no other verdict line, except an identical one on the first line
> if the brief asks for it.

How the parser handles these forms:
- A final line `VERDICT: LAND 9/10` matches `finalGrammar` (`review-round.mjs:428`).
- When the final line is selected, body lines that mention "verdict" are ignored. Only a first line that carries a
  verdict label must agree with it (`review-round.mjs:431-438`).
- That is why a last-line verdict is the robust form. Re-reading every recorded review output that still exists with
  main's reader (`reparse.mjs`) gives these empty verdicts today:
  - trading-zone: 19 of 172.
  - yokai-world: 7 of 137.
  - nana-pi: 8 of 169 readable outputs.
- Causes of those empty verdicts:
  - trading-zone's 19: a first-line `VERDICT: LAND` followed by a body line such as "This verdict accepts the
    documents…" (`review-round.mjs:442`).
  - yokai-world: 6 come from extra prose on the first line (`VERDICT: LAND-WITH-FIXES 9/10 — behavior is correct…`),
    and 1 from a body mention.
- Each empty verdict blocks that revision for good: nana-land refuses any non-LAND value, and empty counts as non-LAND
  (R-1004, `nana-land.mjs:92`). With a last-line verdict, all 19 trading-zone cases would have recorded LAND.
- **Conflict risk with yokai-world:** its briefs say "the word verdict must appear nowhere else" and allow
  LAND-WITH-FIXES. The appended text has to permit an identical first-line verdict, which the wording above does.
  yokai-world's briefs and the shared-memory reference still need updating. That is seat work across repos, not this
  lane's code. A reviewer that follows the yokai brief (first line `LAND-WITH-FIXES`) and the appended text (last line
  `SEND-BACK`) records an empty verdict. That outcome is safe, because it is not LAND, but it wastes the round.

A suggested row from the lane range: "R-11xx: The pi-review child shall receive the review standard from
`prompts/review-standard.md` exactly once as an appended system prompt, after the immutable-checkout sentence, and
pi-review shall refuse before admission when that file cannot be read." Test: the fake pi from
`immutable-review.test.mjs` counts the standard text in argv and expects exactly 1. A second case uses a missing
prompt file and expects exit 1 with no round recorded.

Option, not recommended: when the review is admitted with the standard over-cap reason, pi-review could also name the
previous round's revision so the reviewer reviews only the delta. The brief already names the delta base, so this
adds complexity for no new information.

## Q3. How is --over-cap handled and recorded today?

1. **Parsing.** pi-review reads its own options only from the argv **before** `--` (`pi-review.mjs:42-47`), then
   passes those options to `admit` (`pi-review.mjs:168`). review-ledger does the same (`review-ledger.mjs:34-35, 79`).
   `review-ledger check` refuses the flag: `review-ledger.mjs:64`, "check takes no --over-cap".
2. **Validation.** `optValue` at `review-round.mjs:127-135` throws on a missing value, a blank value, or a value that
   starts with `-`, and returns the trimmed value. `parseReview` reads it at `review-round.mjs:476`.
3. **Decision.** `decide()` at `review-round.mjs:449-464`. A revision already counted returns `allow` with no override
   (`:459-461`). Otherwise it returns `roundCapVerdict(round, overCap)`:
   ```js
   export function roundCapVerdict(projected, overCap) {            // review-round.mjs:113-116
     if (projected === null || projected === undefined || projected <= REVIEW_ROUND_CAP) return 'allow';
     return overCap && String(overCap).trim() ? 'override' : 'refuse';
   }
   ```
4. **Admission and audit** (`review-round.mjs:570-581`):
   ```js
   const d = decide(p, q.key, q.revision, q.overCap, true);
   if (d.verdict === 'refuse') return { ok: false, message: REFUSE(d) };
   const override = d.verdict === 'override' ? q.overCap : undefined;
   if (override) appendAudit(p, { kind: 'override', ...q.key, revision: q.revision, role: q.role, reason: override, round: d.round, launcher });
   … res = { …, override, …, overCapReason: override ?? null, … }   // reservation file
   … note += ` — OVER CAP, override recorded: ${override}`
   ```
   - An `--over-cap` given while under the cap is ignored and **not recorded**. A test pins this:
     `review-ledger.test.mjs:992,1007`, "omits unused override reasons".
   - The refusal text invites a free-text reason. `review-round.mjs:556-557`: `To run anyway: --over-cap "<what changed>"`.
   - A refusal happens before any reservation, so no round is consumed. pi-review refuses after building the detached
     checkout (`:136-146, 168-169`) and cleans the checkout up in `finally` (`:202-203`).
5. **Completion.** The tally and audit lines carry `override` and `overCap: held.overCapReason ?? held.override ?? null`
   (`review-round.mjs:640-641`). `review-ledger report` prints `overCap` as the last column, with whitespace replaced
   by `_` (`review-ledger.mjs:57-58`). **nana-land never reads `overCap`.** The reason is audit metadata only.
6. **Docs and rows.**
   - Pack README: `packages/nana-pack/README.md:127-131` ("non-blank and not a flag") and `:231`.
   - R-720 (`REQUIREMENTS.md:395`, "non-blank, non-flag reason") and R-842 (`:396`) are both **untested**.
   - R-970 (`:459`) covers the report.
   - The standard reason appears only in the working-pattern text: `templates/_shared/working-under-nana-pi.md:27`,
     `AGENTS.md:95` and `CLAUDE.md:95`. It entered in `eb937f8` (2026-10-10). No code checks it.

### Distinct --over-cap reasons in the user ledger

Source: `~/.pi/agent/review-ledger.jsonl`, which runs 2026-09-28 to 2026-10-13 and has never rotated, plus the tally.

| repo | override events | distinct reasons | dates |
|---|---|---|---|
| trading-zone | 17 (11 items) | 1: the **exact standard** | 10-11..10-12 |
| yokai-world | 16 (11 items) | 1: `confirmation round on the final tip after fixes to named findings`, the **old short form without "or a merge of current main"** | 10-11..**10-13** |
| work-project | 0 | none (16 v1 rounds, no verdicts, no overrides) | — |
| nana-agent-loop | 0 | none | — |
| nana-pi | 79 | 64 free-text reasons, each used once (09-29..10-10, e.g. "land review after sol r3 BLOCK; r4 closes its two items…"); then the old short form ×10 (10-10..10-11); then the exact standard ×5 (10-11..10-13) | — |

No script in yokai-world, trading-zone, work-project, nana-agent-loop, jev-research or the-hive passes `--over-cap`. I
grepped `*.sh`, `*.mjs`, `*.js`, `*.ts`, `*.py` and `*.json`. Every caller is a seat typing the command.

### What enforcing the standard reason would change

- **trading-zone:** nothing. Its AGENTS.md and CLAUDE.md at line 65 carry the standard reason sentence.
- **yokai-world: every over-cap launch is refused** until its seat types the full text. Its last one was today.
  - Its `AGENTS.md:70` land checklist predates `eb937f8` and has no standard-reason sentence. Its working-pattern
    section was never refreshed with `nana-setup project`. That is inferred from the text; the file was last committed 10-13.
  - Cost per refusal: one re-run. No round is consumed, but pi-review rebuilds the detached checkout first.
  - The refusal must print the exact standard text so it can be copied.
- **work-project and nana-agent-loop:** no runtime change. `~/nana-agent-loop/OBJECTIVE.md:13` documents
  `--over-cap "<what changed since r3>"` as free text, and that line goes stale.
- **Cross-repo code contract, the important one:** `~/nana-agent-loop/app/scripts/review-round.mjs` re-exports
  `roundCapVerdict`. `~/nana-agent-loop/app/tests/review-round.test.ts:42-44` asserts
  `roundCapVerdict(4, 'worker rewrote the buffer path') === 'override'`. nana-pi mirrors that assertion in
  `packages/nana-pack/tests/review-round.test.mjs:34`, under the comment "roundCapVerdict keeps its pre-T2b contract",
  `:10`. **Putting the check inside `roundCapVerdict` turns nana-agent-loop's suite red.** Put it in `decide()` or
  `admit()` instead, in `review-round.mjs`, after `roundCapVerdict` returns `'override'`.
- **Enforce in review-round.mjs, not only in pi-review.mjs.** `review-ledger run` uses the same `admit()`. A check
  only in pi-review would leave review-ledger run as the place for non-standard reasons.
- **nana-pi tests to update:**
  - `review-ledger.test.mjs:654-659`, reason "instrumented X": expect it refused, plus a standard-reason case that runs.
  - `:978`, ``retry ${i}``: switch to the standard reason, or the R-722 rotation check loses its override records.
  - `:1003-1013`, "approved exception": switch to the standard reason.
  - `:992`, "not actually over cap": unaffected, because unused reasons are not validated.
  - `review-round.test.mjs:57-61`: `optValue` stays generic. Do not change it.
- **Rows and docs to update:**
  - R-720 needs a new row from R-1100..R-1119 that refuses a non-standard reason and names the standard text. R-720
    stays as the base rule or is retired by split.
  - README `:127-131` and `:231`.
  - The REFUSE text at `review-round.mjs:556-557`.
- **No inline tunables:**
  - Define the standard reason once, for example in `packages/nana-pack/lib/verdict-config.mjs` or a new review
    config module, with its provenance: contract value, the owner's 2026-10-10 land-rule text, and the row.
  - Add one test that seals the value and names the row.
  - Add one test that checks `templates/_shared/working-under-nana-pi.md` contains the constant, so the docs cannot
    drift from the code.
- **Matching:** compare the trimmed value with runs of whitespace collapsed, case-sensitive and exact. Do not accept
  yokai's short form: one standard text, and the refusal message is the migration path.
  - Option: accept the standard text followed by optional detail. That keeps the audit useful, since today's fixed
    reason carries no information, but it adds a parse rule.
- **Behaviour narrowed (inferred, policy):**
  - The README's escape "instrument/implement first, then `--over-cap "<what changed>"`" goes away. A confirmation
    round becomes the only way past three.
  - Of the 64 free-text nana-pi reasons, several were first land reviews after a slice item hit its cap, for example
    "land review after sol r3 BLOCK". Those are not confirmation rounds.
  - The cap counts per item, and nana-land accepts any item name. A seat that is refused can therefore start a new
    `--item` slug, which keeps no cap history. This is honest variation, not forgery, and it is in scope. The plan
    should say whether that is acceptable or whether the working pattern forbids renaming items.

## Q4. Does nana-land treat LAND-WITH-FIXES as not LAND?

Yes, strictly. Quoted from `packages/nana-pack/bin/nana-land.mjs:89-97`:
```js
const checkRecords = (rounds, reservations) => {
  for (const { sha, item } of refs) {
    if (!rounds.some((r) => r.v === 2 && r.revision === sha && r.item === item && r.verdict === "LAND" && r.unverified !== true)) throw new Error(`no verified version-2 LAND review for item ${item} at revision ${sha}`);
    const bad = rounds.filter((r) => r.unverified !== true && (r.revision === sha || r.head === sha) && Object.hasOwn(r, "verdict") && r.verdict !== "LAND");
    if (bad.length) throw new Error(`non-LAND verdict record(s) for ${sha}: ${bad.map((r) => `${r.item}/${r.revision}/${r.verdict ?? "empty"}`).join(", ")}`);
```
- The check runs twice: before the suite (`:98`) and under the ledger lock right before the merge (`:107-108`).
- Rows: R-976, R-1004, R-1005 and R-1011 (`REQUIREMENTS.md:469-479`). R-1004's wording, "a verdict field whose value
  is not LAND", covers LAND-WITH-FIXES by construction. No land test uses LAND-WITH-FIXES by name; the tests use
  SEND-BACK and the empty verdict.
- **Probe** (`probe-land.mjs`, scratch repo and scratch home, main's code):
  - Only LAND-WITH-FIXES at the tip → `refused: no verified version-2 LAND review for item x at revision e0e80c7…`.
  - LAND from a second reviewer plus LAND-WITH-FIXES on the same tip → `refused: non-LAND verdict record(s) …
    x/e0e80c7…/LAND-WITH-FIXES`.
- So one LAND-WITH-FIXES blocks the revision **for good**, even when another reviewer said LAND. The only way out is a
  new commit and a new round. That round is often over the cap, which is why the standard over-cap reason exists.
- The tally shows the cost. Recorded LAND-WITH-FIXES rounds: nana-pi 18, yokai-world 41 (58 if re-read with today's
  reader), nana-agent-loop 1.

## Q5. What breaks if reviewers stop emitting LAND-WITH-FIXES?

Nothing in the code. Behaviour and documents change.

- **Code:**
  - The verdict reader is word-agnostic: `[A-Z]+(?:-[A-Z]+)*` (`review-round.mjs:428-429`).
  - The review-shape check needs only a line starting with `VERDICT` (`review-shape.mjs:15`).
  - nana-land accepts only `LAND` (`nana-land.mjs:91-93`).
  - No code lists the allowed verdict words. `apps/bench/lib/catch-extract.mjs:140` reads only LAND|BLOCK, for old
    studies, and is unrelated.
- **Tests:** `review-ledger.test.mjs:187-192` accepts `VERDICT: LAND-WITH-FIXES` as a parse form and expects it
  recorded as such. **Keep it.** Old outputs and yokai-world still produce it, and recording an honest non-LAND word is
  what makes nana-land refuse. Do not make pi-review reject or rewrite LAND-WITH-FIXES. It already blocks the land.
- **Behaviour:**
  - A review with only SHOULDs now says LAND, and the tip can land as it is. The seat records the SHOULDs as residuals.
  - If the seat still applies those fixes, the fix commit is uncovered and nana-land refuses it (`nana-land.mjs:99-103`,
    R-1002). It needs a round on the new tip, a delta-only confirmation.
  - "LAND, then fix for free" does not exist. It never did.
- **Plan reviews:**
  - Plan reviews used LAND-WITH-FIXES to mean "ready once these fixes are applied", for example
    `docs/reviews/req-tree-2026-10-09/sol-plan-brief.md:56` and ci-pi-pin plan r1.
  - A plan commit is never named in `--reviewed`, so it never blocked a land.
  - Under the new words, a plan review with SHOULDs says LAND. If the seat then applies those fixes, that collides with
    The owner's 10-11 rule "once every reviewer says LAND, no further edits".
  - The working-pattern text should say whether plan SHOULDs may be applied after LAND without a round. This is a
    candidate YOUR CALL item for the owner. My reading: yes for plans, because nothing lands on a plan item. Mark that as
    inferred.
- **Documents still listing LAND-WITH-FIXES as allowed:**
  - About 26+ yokai-world briefs.
  - Shared memory `reference_pi_review_procedure.md`, the section "The review must start with a VERDICT line".
  - nana-pi review briefs up to 10-12, which are history and stay unchanged.
  - The nana-pi narrative in `docs/sessions/2026-10.md`, which is also history.
- **Optional:** nana-land's refusal message could name the case: "LAND-WITH-FIXES is not LAND; fix in a new commit
  and run a delta-only confirmation round". Low value; leave it out unless cheap.

## Builder note for the draft

- These changes touch `review-round.mjs`, which writes the evidence nana-land relies on, and they are pinned by a
  cross-repo exported contract (`roundCapVerdict`). That makes this the riskier part of the lane. Per the 10-13 split,
  Sonnet 5.5 should build it.
- The prompt file and the working-pattern text are small and fit luna, with every test named by exact title.
- The parallel test runner is a separate question; another researcher covers it.
