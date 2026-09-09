# Study: pi tool profiles — a navigation/metadata pilot

Pre-registered 2026-09-08. **Amended twice** after independent pre-registration reviews
(2026-09-09, FIX-FIRST, then STOP). Registered and not yet run under the current fingerprint.

`results.pilot-2026-09-09-partial.jsonl` + `raw.pilot-2026-09-09-partial/` hold **13 pilot records**
from a rep-0 run stopped by Ctrl-C, under the earlier fingerprint `387cd4a5…`. They are kept and
never deleted, but they are **not data**: the harness that produced them double-counted nested
tokens, could be defeated by an early exit inside the file a task allows the model to edit, and
attributed pi's own model calls as nested spend. Read them as a smoke test of the pipeline. The
fingerprint check refuses to mix them with the amended study.

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

**Credentials are SHARED, not isolated — say it plainly.** The bench dir's `auth.json` is a
*symlink* to `~/.pi/agent/auth.json`. Bench runs therefore use the operator's login, consume the
operator's subscription, and can rotate the operator's OAuth token.

That is deliberate. The earlier design copied the file and claimed isolation because nothing was
copied back — which is wrong: an OAuth refresh rotates the refresh token *server-side*, so two
diverging copies are not two isolated credentials. A benchmark refresh could invalidate the token
still sitting in the operator's untouched file, and re-copying the stale source afterwards would
compound it. One shared file means pi refreshes one credential under its own locking, exactly as
in ordinary use. Settings isolation is unaffected; only the credential is shared.

If a benchmark must not be able to touch the operator's login, point `agentDir.sourceDir` at a
directory holding an independently authorised credential. On a platform without symlinks the
runner falls back to a copy and *reports which mode it used*, so a study never has to guess.

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
- **Nested tokens are kept SEPARATE from own tokens.** `tokens` counts assistant messages only;
  `nested` counts LLM work a tool reported. Spend = own + nested, added once. (The first amendment
  put tool usage in both and reported 11,150 for a stream that cost 6,340.)
- **Nested measurement.** pi-web-access issues its own OpenAI Responses request inside `web_search`
  and returns only `{answer, results}` — spend that would never reach pi's accounting, making C
  look cheaper for exactly the reason we are running the study. A bench-owned sidecar
  (`apps/bench/ext/bench-nested-usage.ts`, logic in `lib/nested.mjs`, both content-pinned) rides
  along on extension-bearing profiles, instruments `globalThis.fetch` and reports nested usage on
  the tool result, which pi persists (extensions.md:851, 2013). It registers no tools and adds no
  prompt text, and it edits nothing in pi-web-access, so that package's hash still matches upstream.
  - **Scope.** pi's own Codex transport uses `globalThis.fetch` too, so an unscoped interceptor
    would re-count the run's own model calls as nested. A request is counted **only while a watched
    tool is executing** — the window opened by `tool_call` and closed by `tool_result`. pi issues
    its model requests from the agent loop, never inside a tool's `execute()`. Requests seen
    outside a window are counted in `skippedOwnCalls`, so the scoping is auditable per run.
  - **Completion and dedupe.** Every intercepted request is tracked until its body is read, and
    only the terminal SSE frame's usage counts, once. An unfinished, failed, unparseable or
    timed-out harvest sets `nestedUnknown` — **never 0**. Spend that lands after the final tool
    result is announced on stderr and also sets the flag.
  - **`nestedUnknown` is independent of measured usage**: a window holding one measured call and
    one unmeasurable one reports both.
  - **Silence is not zero.** A watched tool that ran while *no* request reached the interceptor is
    `unknown: "no-network-observed"`, not free — a cache hit and a transport we cannot observe look
    identical from here.
  - **The coverage hole, now named.** pi's Codex API speaks over a **WebSocket**
    (`pi-ai/dist/api/openai-codex-responses.js`: 95 WebSocket references, zero `fetch(` calls), so
    anything routed through pi-ai's `complete`/`completeSimple` never reaches a fetch wrapper.
    pi-web-access's *search* step does its own hand-rolled HTTP POST and IS visible; its *summary*
    step goes through pi-ai and is NOT. In the diagnostic run both tool results reported a
    `summary-model` phase on `openai-codex/gpt-5.6-luna` whose tokens were never counted — and the
    window was not silent, so the silence rule could not catch it. Two mechanisms now do: the
    sidecar wraps `globalThis.WebSocket` and marks a window unknown when a model connection opens
    inside it, and it reads the tool's own `{phase, model}` report and marks unknown any phase whose
    model was never measured.
  - **Therefore: 16,289 tokens in that trace is OBSERVED spend, not proven total spend**, and every
    number this study reports for C is labelled the same way. A C cell carrying `nestedUnknown`
    makes C's cost clauses unevaluable — see step 0 of the decision procedure. That is a diagnostic
    limitation, not evidence against C.
  - *Limits:* per-tool attribution is approximate under parallel tool calls (the run total is
    exact). Any C cell with `nestedUnknown` vetoes C's cost comparison — see the decision rule.
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

**Nothing the model can print or exit with is evidence.** These tasks let the model edit a source
file, and a reviewer used exactly that to forge a pass from entirely inside the permitted lines: 112
fabricated `PASS` lines via `process.stdout['write']`, a forced status via `process['exit']`, and a
fake trusted stack frame via `Error.prepareStackTrace`, all while keeping the bug. Counting output
and blocking exits are same-process trust claims, and no denylist closes that class.

So correctness is decided by **behaviour, in a trusted process the module cannot reach** — the
`eval-module` checker (see Measurement in `apps/bench/README.md` for the mechanism and threat model).
The probe values were derived from the pristine fixture at design time and are recorded in the task.

- `code-bugfix`: a declared one-line mutation makes `fmtNum` round to one decimal. The verdict is
  eight behaviour probes on `fmtNum` — `0.5761 → "0.58"` and `-2.345 → "-2.35"` discriminate, the
  rest guard against a fix that breaks integers, `Infinity`, float noise or exponentials — plus
  `withinLines` (the change must live in lines 150-153, `fmtNum`'s span) and the protected test tree.
  The existing suite's `PASS` count is kept as a **non-authoritative** "did you break anything else"
  signal, explicitly not a verdict.
- `code-guard`: the verdict is eight behaviour probes on `clampText` — five invalid inputs must throw
  `TypeError`, short text must be returned unchanged, long text must be clamped to the byte cap and
  announce the cut — plus `withinLines` for the guard site, a new test file that exists and
  references `clampText` outside a comment, and `revert-and-fail` as **best-effort evidence** that
  the model's own test detects the missing guard: with the guard reverted it must run and end badly
  by **any ordinary failure mode**, a bare `node:assert` throw included. (Requiring a `FAIL` line or
  a trusted nonzero exit rejected perfectly good `assert.throws` tests; the prompt never asked for a
  reporting convention.) The trusted evaluator, not the model's test, is the correctness verdict.

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
(**0.20.0**, pinned). The package first shipped 2026-01-27, after most training cutoffs, and the
answer requires comparing manifests **across** versions rather than reading one field. Ordinary new
releases cannot change it; historical deletion or metadata edits could, so the oracle validates
publication timestamps (every candidate must have a `time` entry, and none may predate the answer)
and disagreement with the pin is a grader error.

**One oracle fetch per comparison block.** The key is fetched at most once per (task, rep), written
to `keys.jsonl` — successes *and* failures — and reloaded on resume, so two arms of a comparison can
never be graded against two different fetches, and a failed oracle cannot be quietly refetched.

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

## Decision rule — ONE procedure, evaluated in order, exactly one verdict

**Quantities.** Per comparison, on **shared tasks** (tasks both arms ran):
`D(t,p)` = decided runs (state `ok` or `fail`; grader, run and blocked errors are excluded);
`S(t,p)` = successes; **`R(t,p) = S/D` is the success RATE** — rates, never raw counts, because
3/3 against 2/2 is not an observed correctness difference.
`M(t,p)` = median **observed spend** (own + nested tokens; "observed" because nested coverage is
not proven complete — see Measurement) over decided runs;
`Total(p) = Σ_{t∈T} M(t,p)`; `MR(p)` = mean of `R(t,p)` over `T`.
A task is **sufficient** only when `D ≥ 2` for *both* arms. `T` = the sufficient shared tasks.
`Wins(X)` = #{t∈T : R(t,X) > R(t,Y)}, `Losses(X)` = #{t∈T : R(t,X) < R(t,Y)}.

Run the steps in order. **The first step that yields a verdict is the verdict**; no later step can
also apply, and no comparison may be reported under two labels.

**Step 0 — unknown spend.** If any run in either arm has `nestedUnknown`, every **cost** clause
below is unevaluable for this comparison. Do not treat unknown as zero, and do not fall through to
a cost clause "counterfactually". What survives is exactly this: the **correctness-only** verdicts
of steps 2 and 3 — a regression or an improvement established *purely* by success rates. If the
comparison would otherwise have turned on cost, its verdict is **INSUFFICIENT DATA (cost
unmeasured)** and it stops there.

**Step 1 — sufficiency.** If `|T| < 6` of the 8 code tasks (`< 4` of the 6 research tasks), the
verdict is **INSUFFICIENT DATA**. Name every insufficient task and why (all runs undecided, oracle
failures, timeouts).

**Step 2 — REGRESSION.** Any one of:
- rate: `MR(X) < MR(Y) − 0.05`, or `Losses(X) > Wins(X)`;
- cost (skipped under step 0): `Total(X) > 1.15 × Total(Y)`, or `∃t∈T : M(t,X) > 1.5 × M(t,Y)`.

Cost regression is checked **regardless of wins**: two task wins bought with doubled spend is a
regression, not an improvement.

**Step 3 — IMPROVEMENT MEASURED.** `MR(X) > MR(Y)` (correctness-only, survives step 0), or
`Total(X) ≤ 0.85 × Total(Y)` with `MR(X) ≥ MR(Y)`.

**Step 4 — NON-REGRESSION ACCEPTED** — explicitly *not* a win, and an **affirmative** finding that
requires all of: `MR(X) ≥ MR(Y) − 0.05`, `Total(X) ≤ 1.15 × Total(Y)`, and
`M(t,X) ≤ 1.15 × M(t,Y)` on at least 75% of `T`.

**Step 5 — INCONCLUSIVE.**

`Total` is a sum of per-task medians so two expensive edit tasks cannot hide behind six cheap
navigation wins; the 1.5× per-task clause stops the reverse.

### The three comparisons

1. **B vs A, code family.** The procedure above, X = B, Y = A.
2. **B′ vs B, code family.** The procedure above, then: prefer B′ **only** on IMPROVEMENT, and only
   with the tighter threshold `Total(B′) ≤ 0.90 × Total(B)` when the improvement is cost-based.
   Otherwise keep B — fewer moving parts wins ties.
3. **C, both families.** Run the procedure twice: C vs B on research, and C vs B on code.
   - **C for research work** requires the research verdict to be IMPROVEMENT, **and** additionally
     either `Wins(C) − Losses(C) ≥ 2` or `Total(C) ≤ 0.85 × Total(B)`. A research **cost
     regression** disqualifies C even when it wins tasks.
   - **C as the default profile** additionally requires the code verdict to be an affirmative
     **NON-REGRESSION ACCEPTED or IMPROVEMENT**. INSUFFICIENT DATA and INCONCLUSIVE do **not**
     qualify: absence of evidence of harm is not evidence of safety.
   - Under step 0 (any `nestedUnknown` in a C arm) C's cost clauses are unevaluable, so C can be
     adopted only on a correctness-only IMPROVEMENT, and never as the default profile.

### Extending to N=5

Evaluated **once, after rep 2 completes**, and **before** any verdict above is computed. Trigger:
count the **distinct task IDs** that are insufficient in *any* of the three comparisons — a code
task insufficient in both B-vs-A and B′-vs-B counts **once**. If that count is **≥ 3**, extend.

Procedure: set `repeats: 5` in `study.json`. `repeats` is not part of the fingerprint, so this
extends rather than invalidates: `schedule.json` is rewritten with the same seed, the runner asserts
the first 132 runs keep their positions, and resume executes only the 88 added.

**A systemic-failure stop or a budget stop never authorizes more repetitions.** Those mean the
harness or the budget failed, not that the data is thin; resuming or extending after one requires an
explicit human clearance recorded in the session log. Never extend selectively, never per task,
never after inspecting comparative outcomes.

### Falsification

Materially worse correctness or observed cost for B on these tasks contradicts the brief's
operational recommendation *for this workload*. **Equal results show nothing positive**: they do not
demonstrate the modest win the brief expects, and they do not rule out benefits on work this study
does not contain. IQR is reported for shape; it is not an equivalence test.

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
6. **Nested-usage attribution** is exact per run, approximate per tool under parallelism. The
   scoping assumes pi never issues a model request while a tool is executing; `skippedOwnCalls` is
   recorded per run so that assumption is checkable against the evidence rather than trusted.
7. **One machine, one provider, one model.** Nothing here generalises to other models or to Windows.
7b. **Nested-usage coverage is proven for one path, and explicitly NOT for another.** One real
   nested Responses request was measured exactly and reconciled against the raw stream (own 7,780 +
   nested 8,509 = **observed** spend 16,289; nested model `gpt-5.6-terra` ≠ own model
   `gpt-5.6-sol`). The summary calls on `gpt-5.6-luna` in the same run were NOT measured, because
   pi's Codex transport is a WebSocket. Both detectors added since are unit-tested but have not yet
   been seen firing on a live run. Every C spend figure is a **lower bound with an explicit flag**,
   never a total.
8. **`code-guard`** verifies the added test detects the missing guard — it exits 0 with the guard
   and nonzero without it — but it does not verify the test is well written, and a silent nonzero
   exit is accepted because the prompt never asked for a particular output format.
9. **The bench shares the operator's login** (see Isolation). A study can rotate the operator's
   OAuth token; that is a real operational cost of running it, not a hypothetical.
