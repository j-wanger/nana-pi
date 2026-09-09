# apps/bench — a reusable benchmark for the pi coding agent

Runs the same tasks through different pi configurations and writes down what each one cost.
Zero dependencies, cross-platform, `node <file>` tests. Every pi flag it emits is verified against
the installed docs (`$(npm root -g)/@earendil-works/pi-coding-agent/docs/`), never from memory.

```bash
node apps/bench/run.mjs <study-dir>            # DRY RUN (default) — the schedule + the exact argv
node apps/bench/run.mjs <study-dir> --smoke    # exactly ONE real model call
node apps/bench/run.mjs <study-dir> --go       # the whole study, resumable
node apps/bench/run.mjs <study-dir> --go --task code-bugfix --profile lean-code --rep 0
node apps/bench/aggregate.mjs <study-dir>      # results.jsonl → summary.md + summary.json
node apps/bench/test/plan.test.mjs             # each test: exit 0 = all PASS
```

`--go` is mandatory for real spend: with no flag the runner only prints. `--keep` leaves each run's
temp workspace in place (evidence is saved either way).

**Interrupting:** Ctrl-C kills the current child (and its process group) and exits 130. Every run
already appended to `results.jsonl` is kept and will be skipped on the next `--go`; the run that
was in flight is simply not recorded, and will be re-run. That is the whole guarantee — there is no
graceful drain and no partial-run salvage.

## What it measures

Per run, one JSON line in `<study-dir>/results.jsonl`:

| field | meaning |
|---|---|
| `state` | `ok` · `fail` · `run-error` · `grader-error` · `blocked` |
| `ok` | `true`/`false` for a decided run, **`null` when the grader or the harness failed** — those never count as model failures |
| `tokens` / `totalTokens` | the run's own `{in, out, cacheRead, cacheWrite}` (disjoint buckets) and their sum |
| `nestedTokens` / `nestedCalls` / `nestedUnknown` | LLM calls an extension made on the run's behalf; `nestedUnknown` means *measured as unknown*, never 0 |
| `retries` / `retryEvents` / `compactions` | counted from the stream even though both are pinned off |
| `cacheBucket` | `cold` (`cacheRead == 0`) or `warm` — reported separately, never averaged away |
| `wallMs`, `turns`, `toolCalls` | wall clock, `turn_start` count, `{toolName: count}` |
| `exit`, `signal`, `error` | process outcome and a classified error (`timeout…`, `needs-key…`, `needs-entry…`, `grader:…`, `harness:…`) |
| `check` | `{pass, graderError, detail}` — the detail records *why* |
| `fingerprint` | the study-content hash this run belongs to; resume refuses to mix two |
| `evidence` | where the raw stream, stderr and workspace diff for this run were written |
| `finalText`, `finalTextSha256` | first 300 chars of the model's last message, plus the hash of all of it |
| `diagnostics` | parser health: `badLines`, `usageMessages`, `settled`, `agentEnded`, `dangling` |

**Where the numbers come from** (pi 0.84.4, cited so you can re-check them):

- `--mode json` prints one event per line (`docs/json.md`; `docs/usage.md:175`). It is
  `--mode json`, **not** `--json`.
- Tokens: sum `usage` over every `message_end` that carries one — `Usage` is
  `{input, output, cacheRead, cacheWrite, totalTokens, cost}` (`docs/session-format.md:104-117`),
  and the provider adapter *assigns* it per API call rather than accumulating
  (`pi-ai/dist/api/openai-responses-shared.js:443-453`), with `input` excluding cached tokens
  (line 445). `message_update.usage` is ignored — it "may remain zero when a provider only reports
  usage at completion" (`docs/json.md:88-90`).
- Tool calls: `tool_execution_start` carries `toolName` (`docs/json.md:49`).
- **Completion**: `agent_end` is *not* terminal — "may still be followed by retry, compaction, or
  queued continuations" (`docs/rpc.md:864`). The terminal marker is `agent_settled`
  (`docs/rpc.md:866`). A run is `ok` only with a clean exit **and** `agent_settled` **and** no tool
  call left without a result **and** a passing checker. Exit code alone is not enough: in
  `--mode json` pi exits 0 even when the assistant errored (`dist/modes/print-mode.js:110-127`) —
  but a *nonzero* exit is always a run error.
- Retries: `auto_retry_start`/`auto_retry_end` (`docs/rpc.md:1109`), compaction
  `compaction_start`/`compaction_end` (`docs/json.md:31`), `extension_error` (`docs/rpc.md:1171`).

### Nested LLM spend

An extension can call a model itself. pi-web-access, for example, issues its own Responses request
inside `web_search` and returns only its answer — that spend would never appear in pi's accounting,
and the profile using it would look cheaper for exactly the reason you are measuring it.

`ext/bench-nested-usage.ts` is a bench-owned sidecar that rides along on any profile declaring an
extension. It instruments `globalThis.fetch`, extracts `usage` and `model` from LLM responses, and
attaches them to the tool result, which pi persists (`docs/extensions.md:851, 2013`). It registers
no tools and adds no prompt text, so it cannot shift a comparison, and it modifies nothing in the
third-party package, so that package's content hash still matches the upstream tarball.

Limits, recorded in the data rather than papered over: per-tool attribution is approximate under
parallel tool calls (the run total is exact), and anything it cannot parse sets `nestedUnknown`.

## Ordering, identity and resume

- **Seeded randomized block schedule.** A block is one `(task, rep)` holding every eligible
  profile in a shuffled order; blocks are shuffled within a rep. Written once to `schedule.json`
  and reused verbatim, so a resumed study cannot re-randomize itself. Set `seed` in `study.json`.
  Keeping a comparison inside one block is also what lets a single snapshotted oracle key grade
  every arm.
- **Study fingerprint.** A sha over `study.json`, every task file, the fixture pin, the extension
  content hashes, the pi version and the pinned settings — written to `fingerprint.txt` and onto
  every record. Resume **refuses** to append to a results file carrying a different one, so an
  edited prompt cannot silently average two experiments. Machine-local paths are excluded, so the
  same study fingerprints the same on another machine.
- **Resume** skips tuples already in `results.jsonl`, **including failed and grader-error ones**,
  precisely so resuming cannot quietly become retrying. To re-measure a tuple, delete its line.
- **Torn tail.** A kill mid-append leaves half a JSON object with no newline. The reader moves
  those bytes to `results.jsonl.quarantine` and restores the newline boundary *before* anything
  appends, so the damage stays at one record.

## Before it spends

1. **Content pins** — `study.json:pinnedSha` holds sha256s of each extension entry and lockfile.
   A mismatch aborts: the reviewed extension is not the one on disk.
2. **Load probe, zero tokens** — each profile is started under `--mode rpc` and asked `get_state`
   (`docs/rpc.md:185`). That loads settings, resolves the model and runs every `-e` extension
   without calling the model. It asserts the model resolved, no extension errored, and
   `autoCompactionEnabled === false` (proof the prepared agent dir's settings are the ones pi read).
3. **Registration probe, one call per extension profile** — asks the model to list its tools and
   aborts if the declared extension tools are missing. A file that exists proves it loaded; only
   this proves the tools registered.
4. **Budget stops** — `maxTotalTokens` and `maxWallMs` in `study.json`, counted across resumes.
5. **Systemic-failure stop** — 3 consecutive grader/harness failures abort the study rather than
   filling the remaining cells with noise.

## Evidence

Every run — not just kept ones — writes `<study>/raw/<task>/<profile>/rep<N>/`:
`stream.jsonl` (the raw event stream), `stderr.txt`, `argv.txt`, and `workspace.diff` (a zero-dep
unified diff of everything the model changed in the fixture copy). Snapshotted oracle keys are
appended to `keys.jsonl` with a timestamp and the block they graded.

## Isolation, and why

`--no-session --no-skills --no-context-files --no-prompt-templates --no-extensions --no-approve`
(`docs/usage.md:205, 226-231, 249`), a fresh temp cwd, a fresh session dir, and
`PI_CODING_AGENT_DIR` (`docs/environment-variables.md:81`) pointing at a **prepared config dir**
outside the repo (default `~/.pi/bench-agent`, mode 0700), rebuilt at study start.

The `--no-*` flags stop *discovery*; they do not neutralise `~/.pi/agent/settings.json`. Left
alone, pi's defaults give every run agent-level auto-retry with 3 attempts
(`docs/settings.md:143-144`) and auto-compaction (`docs/settings.md:118`) — both of which change
what a run costs without appearing anywhere. The prepared dir pins them off, pins provider retries
to 0 (`docs/settings.md:147`), omits `defaultTools` so `--tools` is the only thing choosing tools,
and sets `defaultProjectTrust: "never"`.

**Credentials.** A fresh config dir has no `auth.json` (`docs/providers.md:111`), so the runner
copies it from the operator's dir before **every** run, keeping it at 0600 — upstream OAuth
refreshes propagate immediately. Nothing is ever copied back: a token pi refreshes inside the bench
dir is discarded, so a long study can eventually hit an auth error (recorded as `needs-key`, never
as a wrong answer). Credentials are never logged, never hashed into the fingerprint, never written
to a record. **If the source `auth.json` is missing the runner refuses to start**, loudly, before
any spend.

## Defining a study

A study directory holds `study.json`, `tasks/*.json`, an optional `fixture/` + `FIXTURE.sha256`,
and optional `assets/`. Outputs land beside them: `results.jsonl`, `schedule.json`,
`fingerprint.txt`, `keys.jsonl`, `raw/`, `summary.md`, `summary.json`.

```jsonc
{
  "id": "my-study",
  "repeats": 3,
  "seed": 20260908,               // the randomized block schedule is reproducible from this
  "timeoutMs": 300000,            // per run; a task may override
  "baselineProfile": "pi-defaults",
  "smokeTask": "…", "smokeProfile": "…",
  "model": { "provider": "openai-codex", "id": "gpt-5.6-sol", "thinking": "medium" },
  "pinnedPiVersion": "0.84.4",    // a different pi aborts rather than quietly changing the study
  "env": { "PI_OFFLINE": "1" },
  "maxTotalTokens": 3500000, "maxWallMs": 21600000,
  "agentDir": { "dir": "~/.pi/bench-agent", "sourceDir": "~/.pi/agent" },
  "sidecarExtension": "../../ext/bench-nested-usage.ts",
  "pinnedSha": { "ext:research:0": "…", "lock:research:0": "…", "ext:sidecar": "…" },
  "fixture": { "dir": "fixture", "sha256": "…" },
  "profiles": [ … ]
}
```

### Adding a profile

```jsonc
{
  "name": "lean-code",
  "tools": ["read", "grep", "find", "ls", "edit", "write", "bash"],
  "appendSystemPrompt": "…",          // → --append-system-prompt
  "extensions": [{ "path": "…/index.ts", "lockfile": "…/package-lock.json", "tools": ["web_search"] }],
  "requiresEnv": ["SOME_API_KEY"],    // unset → recorded as needs-key, and NOT spent
  "families": ["code", "research"],   // which task families this profile runs
  "model": { … }, "thinking": "high", "extraArgs": []
}
```

`--tools` is a **strict allowlist over all tools, extension tools included** (`docs/usage.md:212`),
so an extension whose tool names are missing from `tools` contributes nothing; `validateProfile`
rejects that at load. (Caveat: a live check showed `--tools` does *not* suppress pi's built-in
`parallel`, so treat "strict" as "strict about the tools it controls", and read `parallel` in the
recorded mix.) Extension paths may be relative to the study dir.

### Adding a task

```jsonc
{
  "id": "code-define-small",
  "family": "code",              // decides which profiles run it
  "fixture": false,              // default true: a fresh copy of the study fixture per run
  "prompt": "…",
  "timeoutMs": 420000,
  "mutations": [{ "file": "…", "find": "…", "replace": "…", "note": "…" }],
  "assets":    [{ "from": "assets/probe.mjs", "to": "_bench/probe.mjs" }],
  "keyDerivation": { "command": "…", "output": "…" },   // how the key was derived, for reviewers
  "check": { … }
}
```

`mutations` are applied to the fresh copy (each must match **exactly once**, else the run aborts).
`assets` are copied in **after** the model exits — a grading probe it can neither read nor edit —
and are never counted as the model's own edits.

### Checkers (all deterministic — there is no LLM judge, and there never should be)

| type | passes when |
|---|---|
| `regex` | `pattern` matches the final text |
| `exact` | the whitespace-normalised final text **equals** `value` (default `mode:"whole"`; `mode:"contains"` is opt-in, because contains-matching a number accepts 1304 for 304) |
| `json-path` | the reply parses as JSON (``` fences tolerated) and `path` equals `value`; `path:"$"` is the root, `unordered:true` compares as a set |
| `command` | every `commands: [[argv…]]` exits 0, run inside the fixture copy |
| `file` | `exists` / `contains` / `containsCode` (comment-blind) / `notContains` / `sha256` |
| `changed-paths` | everything the model changed matches `allow`, and nothing matching `protect` moved |
| `revert-and-fail` | with `restore` reverted from the pinned fixture, `commands` **fail** — i.e. the added test actually detects the missing behaviour |
| `live-key` | a command run at bench time yields the key; `expect` pins an immutable value and makes the command a tripwire; `schema`/`reject` validate it |
| `all` | every child passes |

Any checker can return a **grader error** instead of a failure: an unparseable pattern, a missing
baseline, an oracle that exited nonzero or printed nothing or the wrong shape, or a pinned value
that drifted. Those are recorded as `state: "grader-error"` with `ok: null` and are excluded from
every success denominator.

Commands run with `shell:false` on every platform, so there is no quoting to get wrong — but
`.cmd` shims (`npm`, `npx`) are not invocable. Use `node`: `["node","-e","fetch(…)"]`.

## The no-retry rule

The harness never re-runs a failed tuple to make it pass, and pi's own auto-retry is pinned off in
the prepared agent dir. A timeout, a checker failure, a missing extension, a rate-limit error —
each is written down and the plan moves on. If a retry ever does happen it is counted in the record
rather than hidden.

## Fixtures

A fixture is a directory pinned by `FIXTURE.sha256` — one `<sha256>  <posix-relpath>` line per
file, sorted — whose own sha256 is the pin in `study.json`. A mismatch aborts the run and names the
files that drifted.

```bash
node apps/bench/lib/fixture.mjs build <src> <study>/fixture --exclude=apps/bench,research,docs
node apps/bench/lib/fixture.mjs hash  <study>/fixture
```

Not a tarball: extracting one needs an external `tar` binary and its hash changes with mtimes on
every rebuild, while `fs.cp` is built in and byte-identical on darwin and win32.

## Layout

```
run.mjs             plan, pre-flight, spawn, hard-kill, check, evidence, one line per run
aggregate.mjs       results.jsonl → summary.md + summary.json, per family, shared tasks only
lib/profiles.mjs    PROFILE → exact argv + isolated env; validation; sidecar wiring
lib/usage.mjs       --mode json stream → tokens, nested tokens, retries, completion, tool counts
lib/checkers.mjs    the deterministic checkers, and the grader-error boundary
lib/fixture.mjs     hash / verify / materialize / mutate a fixture, + a unified diff (also a CLI)
lib/plan.mjs        study fingerprint, seeded block schedule, resume + torn-tail quarantine
lib/agentdir.mjs    the prepared, pinned pi config dir and its credential handling
ext/                bench-owned pi extensions (the nested-usage sidecar)
test/               eight test files, no model calls
studies/            one directory per study
```
