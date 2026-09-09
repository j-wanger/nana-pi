# Study: pi tool profiles — a navigation/metadata pilot

Pre-registered 2026-09-08. **Amended 2026-09-09** after an independent pre-registration review
(verdict FIX-FIRST). Registered and not yet run: `results.jsonl` holds one **pilot smoke** run
(`code-define-small × pi-defaults × rep 0`, fingerprint `387cd4a5…`), recorded to prove the
prepared agent dir, the pinned settings and the measurement path. The pre-amendment smoke belongs
to a different study definition and is kept only as a parser fixture
(`apps/bench/test/fixtures/real-smoke-stream.jsonl`); mixing it in would average two experiments,
which the fingerprint check now refuses outright.

## Goal, and what this can and cannot show

`docs/tools-research-2026-09-08.md` claims pi's default tool set (`read, bash, edit, write`) is
*not* a defect, that adding `grep/find/ls` buys "a modest win", and that the verdict is "judge by
feel". This replaces feel with numbers on identical tasks: deterministic correctness, tokens
(including an extension's nested LLM calls), wall time, tool-call mix.

It is a **pilot over navigation, small edits and metadata lookups** — not a general verdict on
these tool sets. Six code tasks are short navigation queries and both edits touch one module; the
research tasks are registry/doc lookups. A result here transfers to that shape of work and no
further. Adding a realistic multi-file maintenance task is the obvious next study.

## Profiles

| | name | tools | delta |
|---|---|---|---|
| A | `pi-defaults` | read, bash, edit, write | pi 0.84.4's default set. grep/find/ls off, so the prompt adds *"Use bash for file operations like ls, rg, find"* (`dist/core/system-prompt.js:61-69`). Code family only. |
| B | `lean-code` | + grep, find, ls | the brief's recommendation. Both families. |
| B′ | `lean-code-hinted` | B | plus `--append-system-prompt "Prefer grep/find/ls over bash rg/find/ls; use bash for tests, git, builds"`. Code family only. |
| C | `research` | B + web_search, source_check, fetch_content, get_search_content | pi-web-access 0.28.0. **Both families** — adopting C means running it on code work too, and extra tool descriptions plus extension startup can move code results even when the web tools go unused. Its earlier code-family "no regression" condition was unmeasured and is now measured. |

C's extension is pinned **by content**, not by path: `study.json:pinnedSha` carries the sha256 of
`index.ts` and of `package-lock.json`, and the runner refuses to spend if either moves. The bench
sidecar (below) is pinned the same way.

## Isolation

Every run: `--no-session --no-skills --no-context-files --no-prompt-templates --no-extensions
--no-approve` (usage.md:205, 226-231, 249), a fresh temp cwd, a fresh session dir, and
`PI_CODING_AGENT_DIR` (environment-variables.md:81) pointing at a **prepared config directory**
at `~/.pi/bench-agent`, rebuilt at study start with pinned settings:

- `retry.enabled: false`, `retry.maxRetries: 0`, `retry.provider.maxRetries: 0` — pi's agent-level
  auto-retry defaults to ON with 3 attempts (settings.md:143-144). Left alone, a transient 529
  would be silently paid for and never appear in the data.
- `compaction.enabled: false` (settings.md:118, default true) — compaction spends its own tokens.
- No `defaultTools` key: `--tools` must be the only thing choosing the tool set.
- `defaultProjectTrust: "never"` (usage.md:126-128).

`auth.json` is copied fresh from `~/.pi/agent` before **every** run, so an upstream OAuth refresh
propagates. **Limitation:** a token pi refreshes *inside* the bench dir is discarded rather than
written back — a benchmark should not mutate the operator's credentials. If a study outlives the
token lifetime, runs will start failing with an auth error, which the record classifies as
`needs-key` rather than as a wrong answer.

Model pinned `--provider openai-codex --model gpt-5.6-sol --thinking medium` (usage.md:189-192);
pi pinned to 0.84.4; `PI_OFFLINE=1`, `PI_SKIP_VERSION_CHECK=1`, `PI_TELEMETRY=0`.

**Pre-flight, zero tokens.** Before any spend the runner starts each profile under `--mode rpc`
and sends `get_state` (rpc.md:185), which loads settings, resolves the model and executes every
`-e` extension without ever calling the model. It asserts the model resolved, the extensions
loaded, and `autoCompactionEnabled === false` — the last being proof that our pinned settings are
the ones pi read. A second, paid probe (one call per extension profile) then asks the model to
list its tools, because RPC cannot confirm tool *registration*.

## Measurement

`--mode json` (usage.md:175) writes one event per line. Spend = own tokens + nested tokens.

- Own tokens: sum `usage` over every `message_end` carrying one (session-format.md:104-117). The
  provider adapter *assigns* usage per API call (`pi-ai/.../openai-responses-shared.js:443-453`)
  and `input` excludes cached tokens (line 445), so the four buckets are disjoint.
- **Nested tokens.** pi-web-access issues its own OpenAI Responses request inside `web_search` and
  returns only `{answer, results}` — that spend would never reach pi's accounting, and C would
  look cheaper for exactly the reason we are running the study. A bench-owned sidecar extension
  (`apps/bench/ext/bench-nested-usage.ts`) rides along on any extension-bearing profile,
  instruments `globalThis.fetch`, and reports the nested usage on the tool result, which pi
  persists (extensions.md:851, 2013). It registers no tools and adds no prompt text, so it cannot
  shift the comparison. It edits nothing in pi-web-access, so that package's content hash stays
  equal to the upstream tarball. *Limitations:* under parallel tool calls, attribution between
  concurrent tools can be wrong (the run total is still exact), and unmeasurable usage is recorded
  as `nestedUnknown`, **never as 0**. Any C cell with `nestedUnknown` makes C's cost comparison
  inconclusive.
- Completion: `agent_end` is **not** terminal — "may still be followed by retry, compaction, or
  queued continuations" (rpc.md:864). A run counts as OK only with a clean process exit **and**
  `agent_settled` (rpc.md:866) **and** no tool call left without a result **and** a passing
  checker. Retries, compactions and extension errors are counted from the stream (rpc.md:1109,
  json.md:31, rpc.md:1171).
- Tool calls: `tool_execution_start` by `toolName`. `--tools` did not suppress pi's built-in
  `parallel` in a live check, so it is counted for every profile.

**No LLM judge anywhere. No retries** — a failed tuple is written down and skipped on resume, so
resuming can never quietly become retrying.

**Grader failures are not model failures.** An oracle timeout, an HTTP error, a schema mismatch or
a drifted pin is recorded as `grader-error` and leaves the success denominator entirely.

## Tasks

**CODE family (A, B, B′, C), 8 tasks** on a frozen fixture — a snapshot of `~/nana-pi` itself (95
tracked files, excluding `apps/bench`, `research/`, `docs/`, `node_modules`, `.git`) pinned by
`fixtureSha256 bb0d0345…db0f`. Private, so absent from training data. Each task JSON carries a
`keyDerivation` block naming the command and its output.

`code-define-small` (`blocks.mjs:53`) · `code-define-large` (`server.mjs:949`, in an 86 KB file) ·
`code-callsites` (7) · `code-glob-count` (10) · `code-imports` (exact 6-element JSON array) ·
`code-exports` · `code-bugfix` · `code-guard`.

The two edit tasks are graded on **what changed**, not only on whether the suite is green:

- `code-bugfix`: a declared one-line mutation breaks 1 of 112 assertions. Passing requires the
  suite to exit 0 **and** the only changed file to be `blocks.mjs`, with the whole test tree
  byte-identical. That closes both gaming routes the review found: editing the suite, and dropping
  `process.exit(0)` into an unrelated imported module.
- `code-guard`: passing requires the new test file to exist, to call `clampText` **outside a
  comment**, to exit 0, to leave the existing suite green under a bench-owned probe, to change
  nothing but the guard site and that one new file — and to **fail** when the guard is reverted
  from the pinned fixture. A test that asserts nothing is rejected.

**RESEARCH family (B, C), 6 tasks**, no fixture. B has no web tools but does have `bash` (curl,
node), so this measures dedicated web tools against shelling out, not against nothing. Answers are
matched **whole**, never by substring — `contains` would accept 1304 for a key of 304.

Keys are computed live and **snapshotted once per comparison block**, so both arms are graded
against the same fetch. The oracle's transport and shape are validated first; a failure is a
grader error. r1 (`chalk` `dist-tags.latest`) and r2 (`undici` versions currently listed) are
deliberately drift-prone and the live key absorbs it. r3 (`chalk@5.3.0` `dist.shasum`), r4
(`protobufjs@7.5.4` license) and r6 (the boolean option in the **v22.19.0**-pinned Node `fs.cpSync`
docs) pin an immutable coordinate: the expected value is written down and the live command is a
**tripwire** — if it disagrees, that is a grader error, not a wrong answer.

r5 replaces the earlier arXiv-date task, which the review flagged as memorizable and a single
lookup: *the earliest published version of `pi-web-access` that declares `undici` as a dependency*
(0.20.0). The package first shipped 2026-01-27, after most training cutoffs, and the answer
requires comparing manifests **across** versions rather than reading one field.

## Order, N, budget

The schedule is a **seeded randomized block schedule** (`seed: 20260908`), written once to
`schedule.json` and refused if the study fingerprint changes. A block is one (task, rep) holding
every eligible profile in a shuffled order; blocks are shuffled within a rep. That is what keeps a
slow period, a warm cache or a rate-limit window from landing systematically on one profile — the
previous fixed rotation gave each research task a 2:1 first-position imbalance. Cache state is
reported separately (`cold`/`warm` buckets and median `cacheRead`) rather than assumed away.

`repeats: 3` → **132 runs** (8 code × 4 profiles + 6 research × 2, × 3), plus one paid
registration probe for C. One complete replicate is 44 runs.

Budget is deliberately **not** extrapolated from the earlier single cheap navigation call — the
review was right that it estimates neither the edits nor nested web work. The plan is: run
`--rep 0` (44 runs, one full replicate), then recost. Hard stops are in `study.json`:
`maxTotalTokens: 3,500,000`, `maxWallMs: 6 h`, and an abort after 3 consecutive harness/grader
failures rather than filling the remaining cells.

## Decision rule (decidable at N=3, fixed before any data)

Definitions on **shared tasks only** (tasks every compared profile ran):
`D(t,p)` = decided runs (ok or fail); `S(t,p)` = successes; `M(t,p)` = median spend over decided
runs; `Total(p) = Σ_t M(t,p)`; `ΣS(p) = Σ_t S(t,p)`.
A task with `D < 2` for either arm is **inconclusive** and is named, not silently dropped.

**B versus A (code):**
- **Improvement measured** if `ΣS(B) > ΣS(A)`, or `Total(B) ≤ 0.85 × Total(A)` with `ΣS(B) ≥ ΣS(A)`.
- **Non-regression accepted** (weaker, and explicitly not a win) if `ΣS(B) ≥ ΣS(A)`, no shared task
  loses more than one success, `Total(B) ≤ 1.15 × Total(A)`, and `M(B,t) ≤ 1.15 × M(A,t)` on ≥ 6 of
  8 tasks.
- **Regression** if `ΣS(B) < ΣS(A)`, or `Total(B) > 1.15 × Total(A)`, or any task has
  `M(B,t) > 1.5 × M(A,t)`.
- Otherwise **inconclusive**.

`Total` is the sum of per-task medians precisely so that two expensive edits cannot hide behind six
cheap navigation wins.

**B′ versus B:** prefer B′ only if `ΣS(B′) > ΣS(B)`, or `Total(B′) ≤ 0.90 × Total(B)` with
`ΣS(B′) ≥ ΣS(B)`. Otherwise keep B — fewer moving parts wins ties.

**C:** adopt for research if `ΣS(C) ≥ ΣS(B) + 2`, **or** `ΣS(C) ≥ ΣS(B)` with
`Total(C) ≤ 0.85 × Total(B)` — equal quality at materially lower cost is a legitimate win, and the
earlier success-only threshold wrongly excluded it. Adopt C as the *default* profile only if it
also does not regress on code: `ΣS(C) ≥ ΣS(B) − 1` and `Total(C) ≤ 1.15 × Total(B)` there. **Any C
cell with `nestedUnknown > 0` makes C's cost comparison inconclusive** — we do not adopt on
unmeasured spend.

**Extending to N=5** is decided *before* looking at any comparative outcome, on one criterion: if
≥ 3 shared tasks are inconclusive for lack of decided runs. Never to rescue a winner.

**Falsification.** Materially worse correctness or cost for B on these tasks contradicts the
brief's operational recommendation *for this workload*. **Equal results show nothing positive**:
they do not demonstrate the modest win the brief expects, and they do not rule out benefits on
work this study does not contain. IQR overlap is reported for shape; it is not an equivalence test
and is not evidence that a change is worthless.

## Threats to validity

1. **N=3 is a pilot.** Success moves in thirds within a task; one anomalous run moves a median.
   Read per-task counts and IQR, never a single run.
2. **Prompt caching.** Recorded per run and bucketed cold/warm; randomized blocks keep it from
   favouring one profile systematically, but a shared fixture across 132 runs still warms caches.
3. **Rate limits / time of day** — same mitigation.
4. **Fixture leakage.** Nil for the code family (private repo). Real for r6, whose answer is
   memorizable; r3 and r5 are the un-memorizable load-bearing research tasks.
5. **Format compliance ≠ capability.** "Reply with ONLY…" plus whole-answer matching conflates
   instruction-following with search skill. Prompts are identical across profiles, so it is a
   level shift, not a bias — but a profile that follows formats worse is scored unfairly.
6. **Nested-usage attribution** is exact per run, approximate per tool under parallelism.
7. **One machine, one provider, one model.** Nothing here generalises to other models or to Windows.
8. **`code-guard`** verifies the added test detects the missing guard; it does not verify the test
   is well written.
