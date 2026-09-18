# nana-pi-pack

Extensions + skills making pi shippable the nana way: hook coverage, opinionated
project scaffolding, and dev-workflow skills.

**Dependencies:** none at runtime beyond pi itself — `@earendil-works/pi-coding-agent`
is an *optional* `peerDependency` (the extensions run inside pi, which is the host, not
something they install), and `package.json` declares no `dependencies` or
`devDependencies`. Tests are zero-dep `node packages/nana-pack/tests/*.test.mjs`; the
ones that load a real extension skip themselves when pi is not installed globally.

## Skills (v0.4.0)

| Skill | What it does |
|---|---|
| `scaffold-py` / `scaffold-ts` | Generate a project via copier from `github.com/j-wanger/nana-pi` (`--data language=python\|typescript`; the repo root is the versioned template src, cloned at the latest v* tag) — uv/ruff/mypy-strict/pytest or pnpm/strict-tsconfig/Biome/Vitest, folder-by-feature, lean nested AGENTS.md, and a `.pi/nana-pack.json` post-edit preset (format+lint each edit, file-size caps 500py/300ts, typecheck). Generated projects record the template tag, re-sync via `uvx copier update`, and carry a CI `template-drift` job that goes red when a newer template tag exists. |
| `adopt-py` / `adopt-ts` | Retrofit the same stack onto an EXISTING project (template adopt mode: configs only, source tree untouched). Clean-tree overlay, reconcile from `git diff`, staged strictness with recorded ratchets (py: measured coverage floor + mypy per-module overrides; ts: `@ts-expect-error` ratchets), ends git-tracked on the same `copier update` relationship. |
| `adopt-structure` | Add the agent-navigation layer to an EXISTING project of ANY language — a lean root `AGENTS.md`, per-folder `AGENTS.md`, and a postEdit-only starter `.pi/nana-pack.json`. Docs only: no language stack, no copier, no source/config/CI changes (that's `adopt-py` / `adopt-ts`). Safe on re-run (reconciles). |
| `py-lint` / `py-test` | Run the ruff/mypy and pytest gates and report concisely (ported from nana-dev-kit) |
| `py-review` | 8-point AI-PR review checklist on the current diff (ported from nana-dev-kit) |
| `spec` | 9-section contract before non-trivial work, with adversarial pass + machine-checkable exit criteria (ported lean from nana-dev-kit) |

Six extensions giving pi the hook coverage we require (Claude Code parity classes):

| Extension | Hook class | Events used |
|---|---|---|
| `nana-gate` | Pre-tool permission gating | `tool_call` (blocking) |
| `nana-post-edit` | Post-edit format/lint/test | `tool_result` (modifying) |
| `nana-lifecycle` | Session lifecycle observability + `/reload-runtime` | `session_start/…compact…/shutdown`, `registerCommand` |
| `nana-notify` | Outward notifications | `agent_settled` |
| `nana-handoff` | Session continuity across compaction | `session_compact` (write) / `session_start` + `before_agent_start` (inject) |
| `nana-objective` | The owner's objective + current priority in every system prompt | `session_start` (all reasons) + `before_agent_start` (inject) |

## Install

```bash
pi install git:github.com/j-wanger/nana-pi       # canonical — the repo-root package.json manifests this subdir
pi install /path/to/nana-pi/packages/nana-pack   # local dev
pi remove ...                                     # uninstall
```

## Commands

| Command | What it does |
|---|---|
| `/reload-runtime` | Re-read extensions, skills, prompt templates and context files in the RUNNING session — pi's `ctx.reload()`, which is the same flow as the TUI's built-in `/reload`. It re-reads `settings.json` first, so a skills folder added while the session was up counts. |

`/reload-runtime` exists because pi scans those locations at **startup only** and the TUI's
`/reload` is a TUI-only command: an RPC host (nana code, any RPC client) has no way to reach that
flow except through an extension command. The desk's own `/reload` is a thin wrapper that sends
this one. Not named `reload`: pi treats an extension command that matches a built-in interactive
command as a conflict, warns at every TUI start and skips it in the autocomplete (the built-in
would shadow it there anyway) — so the two coexist instead, `/reload` in the TUI and
`/reload-runtime` everywhere.

**What it will not do:** a session started with a narrowed resource set (`--no-skills` + explicit
`--skill`, or the desk's spawn toggles) re-applies those flags on reload and gains nothing new;
neither does an **untrusted** project — reload preserves the session's trust decision, so
`.pi/skills` in a project you did not approve stays ignored. Verified against pi 0.84.4: a skill
added to a trusted project's `.pi/skills` after startup goes from absent to present across one
`/reload-runtime`.

## Review runner (`bin/pi-review.mjs`)

An independent review is run by a `pi` (Codex) call, and that endpoint intermittently **stalls** —
`pi` has no request timeout, so it hangs with 0 CPU forever. `pi-review` runs the call under a
liveness watchdog: it polls the child's CPU time and, if that stays flat for `--stall-secs`, kills
the whole process group and retries with a fresh session. A review is "produced" only when the
child exits 0 *and* the output file is non-empty *and* review-shaped (`VERDICT`/`LAND`/`FAIL`/
`finding`); exit 0 means the review is in `--out`, exit 1 means every retry stalled.

It also enforces the **review round cap** (`bin/review-round.mjs`): three rounds per item. The
round is read from the `--out` basename (`sol-r4.md`, `brief-round-4.md`), so a fourth round is
refused with "land with residuals, subtract, or instrument/implement first" unless you state what
changed: `--over-cap "<reason>"`. A file with no round in its name is never capped.

```bash
pi-review --out docs/reviews/<item>/sol-r1.md -- --provider openai-codex -m gpt-5.6-sol -p "$(cat brief.md)"
```

`~/.local/bin/pi-review` symlinks this file, so the command works from any repo — not only the one
it used to live in. `nana-agent-loop/app/scripts/pi-review.mjs` is now a forwarder onto this bin.
Tests: `node packages/nana-pack/tests/review-round.test.mjs`.

## What you will see

In TUI and RPC sessions (the desk included) the pack is quiet by design but not invisible.
Print/JSON mode (`-p`) has no UI to draw on, so none of this appears there:

- **Chips** (TUI footer / desk header): `nana-pack ✓` at session start · `post-edit ✓ 2 checks · foo.ts`
  after each checked edit (`✗ 1/2` on failure, `⏱ timeout`, `– skipped (lock|aborted)` when a check
  could not run) · `gate ✓ 12 checked · 1 gated` — tool calls the gate inspected, and the ones it stopped on.
- **Toasts**: post-edit check failures, handoff written/picked up/refused, context compacted.
- **OS notification** when the agent settles and waits for you. If the OS notifier fails or hangs —
  the usual Windows cases: no WinRT toast registration, PowerShell locked down, an 8 s deadline hit —
  you get an in-app "Ready for input" notification instead, plus a `notify_fallback` journal line
  saying why. (A notifier that exits 0 after printing a *localized* PowerShell error record can still
  slip through; the spawn/exit-code/deadline paths do not.)

**Is it actually installed on this machine?** `pi install` writes to *user* settings
(`~/.pi/agent/settings.json`) by default, so it applies everywhere; `-l` writes project settings
instead. The runtime tell is the `nana-pack ✓` chip at session start: seeing it means the pack is
loaded. Not seeing it is not proof of the opposite — it is also absent in print/JSON mode and if
`nana-lifecycle` is not loaded. Check the settings file, or the journal, when the chip is missing.

## Config (all optional)

User `~/.pi/agent/nana-pack.json`, project `<cwd>/.pi/nana-pack.json` (project wins,
read live on every event — edits apply without restarting). One exception: **`objective`
is user-scope only** — project config never contributes to it, trusted or not.

```json
{
	"gate": {
		"extraPatterns": ["\\bterraform\\s+destroy\\b"],
		"allowPatterns": ["^git push --force-with-lease origin (?!main)"],
		"protectedPaths": ["secrets/"]
	},
	"postEdit": {
		"commands": [
			{ "match": "\\.ts$", "run": "npx prettier --write {file}" },
			{ "match": "\\.py$", "run": "ruff check {file}", "timeoutMs": 20000 }
		]
	},
	"notify": { "enabled": true, "headless": false },
	"journal": { "enabled": true, "path": null },
	"handoff": { "enabled": true, "path": null },
	"objective": { "enabled": true, "path": null, "projectFile": null },
	"receipts": { "enabled": true, "dir": null }
}
```

## Behavior notes

- **Gate is fail-closed headless**: without a UI, a dangerous/protected hit is blocked
  outright. Interactively, "Block" is the default choice. Built-in patterns cover
  `rm -rf`-family, `sudo`, force-push, `git reset --hard`/`clean -f`, `chmod 777`,
  `dd of=/dev/`, `mkfs`, shutdown/reboot, `Remove-Item -Recurse/-Force`, plus protected
  paths (`auth.json`, `settings.json`, `.ssh`, `.env*`) checked in commands AND edit/write targets.
- **The gate is advisory-by-load-path** — a pi run without the extension has no gate.
  Unattended enforcement stays at the container/sandbox layer.
- **post-edit failures are appended to the tool result** so the model sees and fixes them;
  successes stay out of its context and are reported by the status chip instead. `{file}` is
  shell-quoted; exotic path characters on Windows cmd.exe are quoted best-effort.
- **post-edit checks run inside pi's own file-mutation queue** (2026-09-08, commit `2efd435`).
  pi runs sibling tool calls in parallel and releases the edit tool's lock *before* the
  `tool_result` handler, so two edits to one file in a single assistant message could race a
  formatter's read-modify-write. Two outcomes you can see:
  - **The queue exists but the lock cannot be taken** → the checker does **NOT** run. The
    receipt records `status: "not_run"` (`exitCode: null`, empty `inputs`/`digest`,
    `inputsStableDuringCheck: false`) and the model is told ``  `<command>` did not run — could
    not lock <file> for checking: <reason> ``. A skipped check is always reported; it is never
    reported as passing.
  - **The queue module cannot be resolved** (running outside pi — another host, a bare test
    harness) → the check **does** run, unserialized, and the absence is announced once per
    process: a `postedit_file_queue_unavailable` journal line plus the warning "checks are not
    serialized against edits".
- **A checker that ignores SIGTERM no longer hangs the turn** (same commit): its process group
  gets SIGTERM (win32: `taskkill /T /F`), SIGKILL 2 s later, and the run **settles either way**
  with `status: "timeout"` (deadline) or `"not_run"` (turn aborted) rather than leaving the tool
  handler pending forever. `timeoutMs: 0` still means no deadline. The win32 tree-kill branch has
  not been exercised on real Windows.
- **Journal** is best-effort JSONL at `~/.pi/agent/nana-journal.jsonl` (override via
  `journal.path`); one line per session event.
- **Notify** never writes terminal escape codes without an attached UI, so print/RPC
  output stays clean. Headless notifications are opt-in (`notify.headless`). A failing OS
  notifier (execFile error, non-zero exit, or a PowerShell exception on stderr) falls back to the
  in-app notification and journals `notify_fallback` with the reason. The notifier also runs under
  an 8 s deadline, so a hung one fails over instead of holding the pipe open.
- **Handoff** writes the latest compaction summary to `<cwd>/.pi/handoff.md` and
  re-injects it into the next fresh session in that directory. Disable the writes with
  `handoff.enabled: false`; relocate the artifact with `handoff.path` (a custom path
  gets no sibling `.gitignore` — its git semantics are the owner's).
- **Handoff refuses to read or write through a symlink** (2026-09-08, commit `2efd435`) — at
  session-start pickup, at compaction write, and for the sibling `.pi/.gitignore`. A repo can
  commit `.pi/handoff.md`, or `.pi` itself, as a link to something like `~/.ssh/id_rsa`: pickup
  would paste the target into the next session's system prompt and the next compaction would
  overwrite it. What that means in practice:
  - **Unconditional — not trust-gated.** A *trusted* project loses symlink-based handoff too.
    If you want the artifact somewhere else, point `handoff.path` at the real destination
    instead of linking to it.
  - **Scope is every path component BELOW the workspace root.** Components at or above the root
    are deliberately not checked: a workspace legitimately lives under a symlinked parent
    (macOS `/tmp` → `/private/tmp`), and that is your filesystem, not repo-supplied. A
    `handoff.path` pointing **outside** the workspace has no repo-controlled prefix to walk, so
    only its final component is checked.
  - **Refusals are loud, never silent** — a `handoff_symlink_refused` journal line
    (`op: "read" | "write" | "gitignore"`) plus a UI warning. The `.gitignore` refusal is
    announced on its own so the "handoff written" notice cannot imply it succeeded.
  - **Advisory, not a security boundary, and not atomic.** The `lstat` checks are not atomic
    with the open that follows, so a link swapped in between them is not caught; and the write
    is a plain `writeFileSync`, not a temp-file rename, so an interrupted compaction can leave
    a partially written handoff.
- **Objective** injects the user's objective + current priority file into every system
  prompt, under `## Objective and current priority (nana)` plus one line charging the session
  to say which of those lines its spend serves. Default source `~/.pi/agent/nana-objective.md`
  (relocate with `objective.path`, a leading `~/` is expanded and a RELATIVE path resolves
  against `~/.pi/agent`, never cwd); content capped at 4000 chars; an `objective_pickup`
  journal line records each pickup and which source it came from (`source: "project" | "user"`).
  Five contract points:
  - **A repo can speak its own objective — when the OWNER opts in.** Set
    `objective.projectFile` (e.g. `"OBJECTIVE.md"`; default `null` = off) and the nearest
    `<dir>/<projectFile>` walking UP from the session cwd wins over `objective.path`, with one
    `Umbrella (nana): **Objective:** …` line appended so the program-level objective stays
    visible. A session in a product repo is then charged against that product's two lines —
    parity with the Claude Code hook `~/.claude/hooks/nana-objective.sh`. This does not weaken
    the user-scope rule: the opt-in, the fallback and the on/off switch are all user-scope
    (project config never sets `projectFile`), so the owner is saying once, for every repo,
    "repos I work in may carry their own objective" — a repo still cannot decide that for
    itself. A hit that cannot be used (symlinked into the workspace, empty, unreadable) falls
    back to the user-scope file and journals `objective_project_refused` with the cause; the
    fallback is never silent.
  - **Read on every `session_start` reason** (startup, new, resume, fork, reload), unlike the
    handoff's startup/new. The handoff is continuity a resumed session already carries; the
    objective is standing governance that lives only in the system prompt, which pi rebuilds
    at every agent start.
  - **`objective.enabled`, `objective.path` and `objective.projectFile` are honored from USER
    scope only.** A repo that could set the path would be writing standing instructions into
    every session run inside it, and one that could set `enabled: false` could silently
    suppress the owner's objective.
    Project *trust* means "run this repo's tooling", not "speak for the user's priorities".
  - **An unavailable objective is announced, never silent.** Missing, empty, unreadable, or
    refused-as-a-symlink injects a one-line `OBJECTIVE UNAVAILABLE: <cause> (<path>)` marker
    under the same heading and journals `objective_unavailable` with the cause; truncation at
    the cap injects the capped text plus `(truncated at 4000 chars)`. Silence was the original
    behaviour and it defeated the point — the one artifact every session must see went missing
    invisibly.
  - **Symlinks are refused only when the resolved path is INSIDE the workspace** (every
    component below the root is checked, as in the handoff). A path in the user's own home is
    not checked: linking `~/.pi/agent/nana-objective.md` at a repo's real `OBJECTIVE.md` is the
    intended setup, not a repo-supplied link. One addition for a `projectFile` hit *above* the
    workspace root: its own final component is checked, because nobody typed that path — the
    walk found it. Advisory, not a security boundary.
- **Receipts** are best-effort content-bound evidence a post-edit check ran (one file
  per repo+checker under `~/.pi/agent/receipts`). Turn them off with
  `receipts.enabled: false`; relocate the store with `receipts.dir`.
