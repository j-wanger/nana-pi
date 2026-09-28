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
| `adopt-structure` | Add the agent-navigation layer to an EXISTING project of ANY language — a lean root `AGENTS.md`, per-folder `AGENTS.md`, a postEdit-only starter `.pi/nana-pack.json`, and the three frontier seeds (`OBJECTIVE.md`, `HANDOFF.md`, `docs/sessions/README.md`) copied from `templates/_shared` **only when absent**. Docs only: no language stack, no copier, no source/config/CI changes (that's `adopt-py` / `adopt-ts`). Safe on re-run (reconciles). |
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
`.pi/skills` in a project you did not approve stays ignored. Tested host since 2026-09-28: pi 0.87.1 (the pack's events and APIs re-checked there; lane U). The skill claim that follows was verified on pi 0.84.4 and not re-run on 0.87.1: a skill
added to a trusted project's `.pi/skills` after startup goes from absent to present across one
`/reload-runtime`.

## Review runner (`bin/pi-review.mjs`)

An independent review is run by a `pi` (Codex) call, and that endpoint intermittently **stalls** —
`pi` has no request timeout, so it hangs with 0 CPU forever. `pi-review` runs the call under a
liveness watchdog: it polls the child's CPU time and, if that stays flat for `--stall-secs`, kills
the whole process group and retries with a fresh session (`--retries N` = re-attempts after the
first; default 2). A review is "produced" only when the child exits 0 *and* the output file is
non-empty *and* review-shaped (`VERDICT`/`LAND`/`FAIL`/`finding`/`BLOCKING` — the predicate lives
in `bin/review-shape.mjs` and is passed in by `pi-review`; the watchdog itself carries none);
exit 0 means the review is in `--out`, exit 1 means every attempt failed.

It also enforces the **review round cap** (`bin/review-round.mjs`): three rounds **per item**,
counted in a user-scope ledger — never from the output file name, and the same for every launcher.

- **Item** = `{repository, slug}`. `--item <slug>` is **required**; a call without it is refused
  loudly. The slug is canonicalized — NFKC, trimmed, lowercased (JavaScript `toLowerCase`, not Unicode case folding), internal whitespace collapsed
  (`" Scope  ONE "` ≡ `"scope one"`) — and refused if it contains `/`, `\`, `..` or a control
  character, or exceeds **128 characters**. The repository is the realpath of the git **common
  dir**, so every worktree of one repository shares an item, while the same slug in an unrelated
  repository is a different item. (Chosen over the remote URL: it exists for every repository,
  needs no URL normalization, and cannot be changed by `git remote set-url`. Cost: a fresh clone
  at a new path is a new scope.) Outside git the scope is `path:<realpath of cwd>`.
- **A round is a revision.** Revision = the reviewed tree's (cwd's) git `HEAD`, as a full sha.
  Any number of reviews on one revision — sol and astra, ten reviewers, the same role twice — are
  **one** round: a round is one review pass over one state of the work, and a fix makes a new
  commit, hence a new round. Re-reviewing a revision earns no round (and is governed by budget,
  not by this cap). A **dirty tree** is its own state: when the working tree's *content* differs
  from HEAD's, its revision is `<HEAD sha>+snap:<full sha256 of a content snapshot>`. The snapshot
  covers every path in HEAD's tree, the index, and the untracked files that `.gitignore` does not
  ignore; per path present on disk, in byte order: file mode as on disk (644/755 by the owner-x
  bit, symlink, submodule), then the sha256 of the **raw bytes** (a symlink's target; a
  submodule's own revision, recursively). It never renders a diff, so diff/color/prefix config,
  EOL normalization, clean filters and `core.fileMode` cannot merge two states, and staging does
  not change it: staged and unstaged of one content are **one** revision (so `git add` alone earns
  no round), while a new untracked, non-ignored file is a new state. The review's own `--out`
  file is left out of the snapshot. Reverting to an already-reviewed state earns no round. Ledger
  lines carry both parts as `head` and `snapshot` (`snapshot: null` when clean). **Any git
  failure refuses admission** with git's error — it is never read as "clean". `--revision` is only the fallback when there is no HEAD (outside git); inside
  git it must resolve to HEAD's commit or it is refused. `--role` is audit metadata only.
- **A completed verdict earns the round — with one exception.** A stall, an infrastructure failure
  or a timeout returns the reservation. The exception is below: a completion whose tree changed
  during the review still consumes the round, as *unverified*. A completion must own a live reservation: an expired, pruned or
  replaced reservation records nothing. **Completion re-derives the revision:** if the tree changed
  during the review, the verdict is *not* recorded as valid (`verdict-unverified` in the audit,
  exit 1), yet the round **is** consumed for the admitted revision (tally line `unverified: true`,
  `completedAs: <new revision>`). A tree edited mid-review was read in no single state, so no state
  can own the verdict; counting nothing instead would make every review free for anyone editing
  during it.
- **Over the cap** → refused ("land with residuals, subtract, or instrument/implement first")
  unless `--over-cap "<what changed>"`. The reason must be non-blank and not a flag
  (`--over-cap --retries` is refused). Every override is written to the audit log with a
  timestamp at admission — also when that review then fails.
- **Ledger** (`~/.pi/agent/`):
  - `review-ledger.rounds.jsonl` — **the tally**, permanent, never rotated: one line per round
    earned, `{"v":1,"ts":…,"kind":"round","repo":…,"item":…,"revision":…,"head":…,"diff":…,"role":…,"launcher":…}`.
    The cap reads only this and the live reservations. A malformed line **refuses** admission
    with `file:line` — a corrupted record never grants a free review.
  - `review-ledger.jsonl` — the verbose audit log (every verdict and override). Before **every**
    append (a verdict, or an override at admission — including one whose review then fails), a log
    past 1 MiB is renamed to `.jsonl.1`, replacing the previous one, so the audit is bounded at about
    2 MiB. Rotation never touches the tally, so it cannot reset a cap.
  - **Storage is NOT bounded overall.** The tally grows by one line per round earned, forever
    (O(items + overridden revisions)), and is read in full at every admission. Only the audit is
    bounded. Prune an item's tally lines by hand if it matters (see Trust model).
  - Every ledger path must be a regular file: a symlink (or directory) is refused before a review
    runs, and files are opened `O_NOFOLLOW`.
- **Atomic:** an in-flight review holds a reservation (`review-ledger.reservations/<id>.json`)
  taken under an O_EXCL lock (`review-ledger.lock`), so two concurrent launchers cannot both take
  the last round. The launcher **renews** its reservation (a heartbeat every 2 min); a live,
  renewing review never expires, however long it runs. **Crash recovery:** a reservation whose
  launcher pid is dead, not renewed for 10 min, or dated in the future is pruned at the next
  admission; a lock is taken over only when its holder
  pid is dead (never from a live holder). A lock path that is not a regular file, or an
  unwritable ledger directory, fails at once with a message.

```bash
pi-review --item <slug> --role sol --out docs/reviews/<item>/sol-r1.md -- --provider openai-codex -m gpt-5.6-sol -p "$(cat brief.md)"
```

**Any other launcher** (e.g. a hand-rolled `claude -p … > out.md`) prefixes the same check —
`bin/review-ledger.mjs run` reserves the round, runs the command (cwd = the reviewed tree) with
stdout → `--out`, and records the verdict only if it exits 0 with a review-shaped output:

```bash
node ~/nana-pi/packages/nana-pack/bin/review-ledger.mjs run --item <slug> --role opus --out out.md -- claude -p --model <model> "$(cat brief.md)"
```

`review-ledger check --item <slug>` answers "would a review of this tree's revision be admitted?"
(exit 0/1): it takes the lock and writes nothing — no reservation, no pruning.

### Workers: `bin/pi-worker.mjs`

A **worker** (a build agent, not a review) runs under the same watchdog through `pi-worker`,
which never imports the ledger: it records nothing and can admit no verdict. `pi-review` has no
worker mode — `--worker` was removed, because a caller-controlled exemption on the review command
was itself the bypass (sol r1: five `VERDICT: LAND` outputs under `--worker`, zero recorded).
`pi-worker` refuses review options (`--item`, `--role`, `--revision`, `--over-cap`, `--worker`). A worker
succeeds when `pi` exits 0 with non-empty output; no review shape is required.

**A worker is not retried by default** (`--retries 0`). **Retrying a worker can repeat file
mutations**: a stalled or failed attempt may already have edited, written or run commands, and a
re-attempt does it all again on top. Opt in with `--retries N` only for an idempotent task; the
launcher prints a warning when you do.

```bash
pi-worker --out wp-a-out.md --stall-secs 300 --poll 20 -- --provider openai-codex --model gpt-5.6-sol -t read,grep,find,bash,edit,write …
```

### Trust model

**This is a self-governance device against the fix-review treadmill, not a security control.**
The ledger lives in the same user's home directory as the agents it governs. Anyone who can
write it can exhaust an item (three fabricated round lines) or extend one (delete lines); anyone
can also run `pi -p` or `pi-worker` by hand and never touch it. What the ledger buys is that every
round earned, every completed verdict and every override is **recorded** — a bypass has to be an
explicit act, never an accident of a file name or a launcher. Not every admission is: an ordinary
(non-override) admission whose review fails leaves **no durable record** once its reservation is
returned. **Budget is not enforced here:** these wrappers do not read, pass or enforce
`--max-budget-usd` (or any spend limit); budget control is external — the caller's own flags and
the provider's limits. **Repair:** to reset an item, delete its
lines from `review-ledger.rounds.jsonl` (and any stale file under `review-ledger.reservations/`);
to go past the cap, run with `--over-cap "<what changed>"`, which is recorded.

### Migration (callers outside this repo — document only)

- **`roundFromOutPath` is deprecated.** It is still exported (pure, unchanged) only so
  `~/nana-agent-loop/app/scripts/review-round.mjs`'s named re-export keeps linking; nothing in the
  cap reads file names any more. Drop the re-export there, then remove it here.
- `~/jev-research/docs/reviews/local-tool-judge-2026-09-19/launch-workers.sh:11` and
  `~/jev-research/experiments/launch-wp-h-after-primary.sh:7` launch **workers**: replace
  `pi-review` with `pi-worker` **and delete their `--retries 2`** (both pass it today). A retried
  worker repeats its file mutations, and under the new N+1 meaning `--retries 2` is **three**
  mutating attempts, not `pi-worker`'s safe single one; keep a `--retries` only for a task you
  have deliberately judged idempotent. The rest of the arguments stay as they are. A worker must
  **not** receive `--item` or `--worker` (`pi-worker` refuses both, before running anything).
- `~/jev-research/docs/reviews/local-tool-judge-2026-09-19/launch-sol-review.sh:8` launches a
  **review**: add `--item <stable slug> --role sol`, and run it from the reviewed tree.
- `~/.local/bin/pi-worker` → symlink `bin/pi-worker.mjs`, as `~/.local/bin/pi-review` does.
- `~/.claude/nana-memory/shared/reference_pi_review_procedure.md` and
  `~/nana-agent-loop/loops/system-map.components.json` describe the old basename rule; update them.

**When this lands:** `~/.local/bin/pi-worker` must be symlinked to `bin/pi-worker.mjs` (the seat
does it), beside the existing `~/.local/bin/pi-review` link.

**Release note — `--retries` changed meaning (T2b).** `--retries N` now means N **re-attempts
after the first** (N+1 attempts total); before T2b it meant N attempts total. An explicit
`--retries 2` therefore runs **3** attempts where it used to run 2. Defaults are unchanged in
effect (`pi-review` 3 attempts; `pi-worker` 1). No call site in this repository passes the flag;
an external caller that does should subtract one — and a **worker** caller should drop the flag
(see Migration above). `pi-review` and `pi-worker` print a one-line
notice whenever `--retries` is passed explicitly.

**`--out` inside the reviewed tree (sol r3).** A review's own output is excluded from its
snapshot, so `--out` on a **tracked** path (HEAD or index) is **refused** before the review runs —
the exclusion would hide the review overwriting a tracked file. The check resolves the **full**
path, a final symlink included (an `--out` link outside the tree aimed at a tracked file is
refused; a dangling link is followed to where the write would land), and tests in-tree by path
segment (a tracked `..notes.md` is in the tree). Any other in-tree, non-ignored `--out` is admitted
with a **warning**: a leftover output there changes the next revision and can spend a round slot.
Write outputs outside the reviewed tree (this repo's practice: another working tree) or to an
ignored path. `complete()` re-derives the revision **under the ledger lock**, so an edit made
while a completion waits on the lock is recorded unverified.
`~/.local/bin/pi-review` symlinks this file, so the command works from any repo — not only the one
it used to live in. `nana-agent-loop/app/scripts/pi-review.mjs` is now a forwarder onto this bin.
Tests: `tests/review-round.test.mjs` (rules), `tests/review-ledger.test.mjs` (processes).

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
read on every event). Every non-gate block applies live, without restarting. The **`gate`
block** applies live only when it *tightens* (an added extra/protected pattern, a removed
allow pattern, a stop); anything that *loosens* it (an added allow pattern, a removed deny)
takes effect at the next session start or **`/reload`**, and is journaled
`gate_policy_widened`. One exception: **`objective`
is user-scope only** — project config never contributes to it, trusted or not.

- **Project config needs a real trust decision.** *Changed:* it used to be honored whenever
  pi reported the project trusted — including pi's silent auto-trust of a folder whose `.pi/`
  holds only nana files. Now it is honored only when pi reports the project trusted **and**
  trust was actually decided: pi asked (the folder has `.pi/settings.json`, `extensions`,
  `skills`, `prompts`, `themes`, `SYSTEM.md`, `APPEND_SYSTEM.md`, or an ancestor
  `.agents/skills`), or you saved trust for the folder (or a parent) with **`/trust`** in pi
  (`~/.pi/agent/trust.json`), then restarted. An ignored project config is announced once per
  session (a warning and a `config_project_ignored` journal line), never silent.
- **Malformed config never throws and never widens the gate.** A bad leaf falls back to its
  default — or, in a trusted *project* file, to the **user** value for that leaf when the user
  file sets one (project leaves override user leaves one by one, so a dropped project leaf
  leaves the user's in place) — a bad array entry is dropped, an unparsable file contributes
  nothing; each problem
  is reported once per session (a warning and a `config_invalid` journal line — written even
  with `journal.enabled: false`, which governs event journaling, not config diagnostics). The
  **user `gate` block** is the exception — it never falls back to the defaults:
  - broken **mid-session**: the last valid gate policy this process loaded stays enforced;
  - broken when pi **starts** (or restarts): the gate **blocks every bash / powershell /
    edit / write call**, interactive sessions included, with `nana-gate: user nana-pack.json
    gate block is malformed — repair it (<file>:<problem>)`, until the file is valid again.
    The repair lifts the stop live; allow patterns in the repaired file apply from the next
    session start or `/reload`.
  The **`gate` block of a nana-trusted project file** follows the same rule: broken mid-session
  keeps the last valid project gate this process loaded; broken at start blocks every gated
  call with `nana-gate: project nana-pack.json gate block is malformed — repair it
  (<file>:<problem>)` — it never silently drops the project's denies / protected paths or
  brings back a user exception the project had cancelled. (If both files are broken the user
  stop is reported.) **Owner recovery, both scopes** (malformed or over-cap — more than 200
  `extraPatterns` / `protectedPaths` entries): the STOP has no in-pi exception, so repair the
  named file with **any editor outside pi** — `~/.pi/agent/nana-pack.json` (user) or
  `<cwd>/.pi/nana-pack.json` (trusted project) — **or delete it**: missing means defaults,
  which also discards that scope's custom denies and protected paths.
  No copy of the policy is saved to disk: a saved "last good" file could be forged by the very
  agent the gate constrains, so after a restart nothing but a valid `nana-pack.json` can open
  the gate. A missing file is not malformed — it means the defaults (no project contribution).
  "This process" is process-wide, not per session: an interactive pi that starts a new /
  resumed / forked session in the same process keeps the last valid gate it loaded.

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
  outright. Interactively, "Block" is the default choice and "Allow once" allows that one call.
  Built-in forms: `rm` recursive (`-r`/`-R`/`-rv`/`--recursive`, also `/bin/rm`, `\rm`,
  `r''m`) or `--force`, `sudo`/`doas`/`su`, force-push (`--force*`, `-f`, `+refspec`),
  `git reset --hard`, `git clean -f`/`--force`, `git checkout -- .`, `git restore .`,
  `git branch -D`, `git stash drop|clear`, `find -delete`/`-exec rm`, `rsync --delete`,
  `truncate`, `shred`, `python -c`/`node -e` deleting files, `chmod 777`, `dd of=/dev/`,
  `mkfs`, shutdown/reboot/halt (as a command, not as a word: `echo reboot` passes),
  PowerShell `Remove-Item`/`ri`/`rm`/`del` with `-Recurse`/`-Force` or fed by a pipe,
  cmd `rd /s`, `del /f|/s|/q`, `format X:`; plus protected paths (`auth.json`,
  `settings.json`, `.ssh`, `.env*`, `.aws/credentials`, `.netrc`, `.config/gh/hosts.yml`)
  checked in commands AND edit/write targets. `rm` is matched anywhere in a command
  segment, so `grep -r "rm -rf" docs/` is gated too (a position rule would miss `xargs rm`).
- **Policy files** — `nana-pack.json` (user and project), pi's `trust.json` (also under
  `PI_CODING_AGENT_DIR`), `.claude/settings.json`, `.claude/settings.local.json`,
  `.claude/hooks/**`. The `.claude` files are gated at **project scope too** (a ratified
  expansion, 2026-09-28: a project `.claude/settings.json` carries hooks that run code). What
  is caught: **edit/write** to one in every path form pi resolves (relative, `~`, `@`, `..`,
  backslash, any case, a symlinked alias), and a bash/PowerShell command whose text names
  one **literally** (`>`, `tee`, `sed -i`, `cp`, `install`, `dd of=`, `Set-Content`,
  `Out-File`, even `cat`). What is **not** caught — a path the shell computes at run time:
  `cd ~/.pi/agent && printf x > nana-pack.json` (relative after `cd`, also for `trust.json`
  and `cd .pi`), an escaped name (`nana\-pack.json`), a glob (`nana-*.json`), a directory in a
  variable, escaped `install -m` / `dd of=` targets, `Set-Location …; sc nana-pack.json`, a
  directory symlink created and written through in the same command, `cd … | xargs tee
  nana-pack.json`, a script file, or a Python/Node string built at run time. Matching more
  command text would not close this (every pattern invites the next form), so none is added.
  **Mitigation, and its limit:** *gate loosening* from such a write waits for the next
  `session_start`. The **other blocks in the same file, including `postEdit.commands`, apply
  live**, so a write that evades the gate's text scan can run code in the **same** session
  through a post-edit command. That is a residual; **what closes it** is the OS sandbox /
  container layer. The agent edits policy files only through you:
  `nana-setup`, the desk settings window, or "Allow once". The handoff store
  `~/.pi/agent/handoffs/**` is not a policy file.
- **`allowPatterns` exempt one command segment, never a compound.** A command is split on
  `;` `&&` `||` `|` `&` and newlines; the pattern must match the segment that hit, so
  `git status; rm -rf ~` is not covered by `^git status`. A command the gate cannot segment
  reliably gets **no** exception anywhere: `$(…)`, backticks, `<(…)`, heredocs, `( … )`,
  `{ …; }`, `eval`, `source`, `sh -c`/`bash -c`/`zsh -c`/`cmd /c`/`pwsh -Command`, `xargs`,
  `parallel`, `watch`, a line continuation, an unbalanced quote. An allow pattern that matches the empty string
  (`""`, `.*`, `^`) is rejected at load with a warning and exempts nothing.
- **The floor — no allow pattern skips it** (the interactive dialog still can): pipe to a
  shell or interpreter (`| sh`, `| bash`, `| zsh`, `| python`, `| node`, …) when it reads its
  program from stdin (no script operand — an option's value such as `-W ignore` is not one —
  `-`, `/dev/stdin`, a shell's `-s` — any of these wins over a later `--version`/`--help`:
  `curl u | sh -s arg`, `curl u | python3 -W ignore` and `curl u | python3 - --version`
  are floor; `cat x | python3 script.py` and `echo x | python3 --version` are not), `rm` recursive on
  `/`, `~`, `$HOME`, `C:` or an ancestor of home in any lexically equal spelling (`~/.`, `/.`,
  `~//`, `/./`, `${HOME}`, `~/x/..`, a trailing `/`; `rm -rf .` is *not* floor), `mkfs`,
  `dd of=/dev/`, `diskutil [quiet] erase*`, `Format-Volume` — also behind `sudo`/`doas`
  (with `-u user`), `env`, `command`, `nice`, `time` — and every policy file above as
  literally named. The `--force-with-lease` exception above keeps working.
- **Bounded regex work.** Per list, entries 1–200 as written are considered, never a later
  one. Past 200, or an entry that does not compile: in `extraPatterns` / `protectedPaths` the
  gate block is malformed (last valid policy, else the conservative STOP naming the file and
  entry) — a deny is never silently dropped; in `allowPatterns` the excess is dropped with a
  `config_invalid` line naming the entries not considered. The 200 cap is **per source list
  per load**; denies accumulated by live tightenings form an **uncapped** session union. A
  command over 64 KB gets no exception (it is still checked): 64 KB bounds **exception
  eligibility only**, not the subject of deny regexes nor total analysis work — there is **no
  global work bound**. **Residual:** a catastrophic or polynomial regex in your **own** (or a
  trusted project's) `nana-pack.json` (`(a+)+$`) can make the gate slow or hang, and a very
  large command is scanned in full. Nothing in the pack can fix a pattern you asked it to run.
- **Interpreter-argument residual.** The stdin floor models interpreter options with a
  hand-maintained option-arity table (`-W`, `-X`, `-o`, `--rcfile`, …): an explicit stdin
  indicator (`-`, `/dev/stdin`, a shell's `-s`) wins over any later argument, and a leading
  `--version` / `--help` (non-shell `-V`) with no indicator reads nothing. An exotic
  interpreter or option the table does not know can still be mis-modelled (an unknown
  value-taking option's value read as the script operand → not floor).
- **Loosening waits for session start.** The gate policy adopted at `session_start`
  (startup, new, resume, fork, `/reload`) is the session's floor of strictness: a config
  write mid-session — by you, the desk, or anything the gate did not see — can tighten it at
  once but cannot loosen it until the next session start or `/reload`.
- **The gate is advisory-by-load-path** — a pi run without the extension has no gate, a
  later extension can still mutate a checked input, and it reads command *text*: it cannot see
  what a variable, an alias, a script file or `python`/`node` code does at run time, nor
  follow a `cd` earlier in the command (see the policy-file residual above). The `read` tool is not gated. Unattended enforcement
  stays at the container/sandbox layer.
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
- **Handoff** (L3, 2026-09-28) writes the latest compaction summary to a **user-scope store**,
  `~/.pi/agent/handoffs/<sha256(canonical cwd)>.md` (canonical = realpath; the key is case-folded
  on win32 only; the cwd is recorded inside), atomically (temp file + rename, latest compaction
  wins), and injects it into the next fresh session (`startup`/`new`; resume, fork and reload skip)
  in **that exact directory**. The path is printed on write and on pickup; edit it by hand freely.
  Disable with `handoff.enabled: false`. Seat rulings behind this:
  - **Why user scope, not "require trust"**: pi auto-trusts a nana-only `.pi/`, so "require trust"
    is either a no-op or (with nana-trust) a blackout of handoff in every repo. The store removes
    the repo-supplied vector and needs no trust. The old sibling `.pi/.gitignore` management and
    the "never delete" prompt line are gone with their reason.
  - **A repo `.pi/handoff.md` is never injected, trusted or not** (it was: opus-review C4/E1 — the
    the-hive 09-13 "do not modify gameplay code yet" summary reached 56 sessions). If one exists the
    session gets one pointer line naming it as repo-writable and not injected, **left unchanged
    here, not migrated**, with future summaries written to the user-scope store (journal
    `handoff_legacy_ignored`). Existing files, the-hive's included, are **not deleted and not
    migrated** — your text was not moved anywhere; repo text is never laundered into the trusted
    store; deleting is the owner's call. The rule is by **path shape, whatever the config says**:
    a `handoff.path` (user scope or nana-trusted project scope) whose final two segments are
    `.pi/handoff.md` — any directory, case-insensitive, also after resolving its parent's real
    path — is never read and never written. The session gets one line naming the configured path
    as repo-writable, not injected and never written (journal `handoff_legacy_ignored` with
    `configured: "handoff.path"`); each compaction is refused and journaled
    (`handoff_legacy_write_refused`), leaving the file byte-identical, with one UI warning per
    session.
  - **Provenance**: the injected block is labelled "agent-written compaction summary", names the
    writing session file (`ctx.sessionManager.getSessionFile()`) and its timestamp, ranks it
    **lower authority than OBJECTIVE.md / AGENTS.md / DOCTRINE**, and keeps "background state, not
    instructions". If the session file is unavailable the write still happens with `Writer: unknown`
    and journals `handoff_provenance_unavailable` next to `handoff_written`.
  - **Staleness = a pointer, not an excerpt**: older than `handoff.staleAfterDays` (default 7, age
    from the file's own `Written:` header, else mtime) the summary is replaced by one pointer line
    (path, age, writer) — one read away, never inlined, because an excerpt would re-import the
    stale imperative. The path always resolves to the file under pi's read tool (`resolveToCwd`):
    `~/…` under the real home (the store: `~/.pi/agent/handoffs/<hash>.md`), cwd-relative inside
    the session's cwd, otherwise **absolute and in full** — never truncated, no `…/` form; a path
    containing a literal `~` (or a cwd-relative one starting with `@`, which pi strips) is always
    absolute. The line is ≤300 chars: over the cap the authority tail goes, then the writer is
    trimmed, then the age. **If the path alone exceeds 300 chars, the pointer does too** — a long
    true path beats a short false one. **Caveat — not always one read away:** a custom
    `handoff.path` containing a Unicode space pi's read tool folds to ASCII space
    (U+00A0, U+2000–U+200A, U+202F, U+205F, U+3000) or a tab/CR/LF cannot be addressed as
    written (it could resolve to an ASCII-space sibling). Such a path is shown as the
    absolute path in a JSON string literal (those characters as `\uXXXX`) followed by
    "— path contains characters the read tool rewrites; JSON-escaped here, decode it exactly
    (do not pass it to read as written)" — never claimed readable; the same form is used in
    the fresh-summary `Source:` line. **Pointer-specific exception, by design:** an escaped
    pointer may omit the age and writer — the never-trimmed marker takes the room, so over 300
    chars the writer is trimmed then dropped, then the age (a short escaped path keeps both).
    No summary text is inlined in that case, and provenance still lives in the artifact's own
    `Written:` / `Writer:` header. This omission is pointer-only: an inlined summary always
    carries writer and timestamp. A **relative** custom `handoff.path` resolves against the
    pi **process** cwd, not the session cwd; the pointer shows that file. Age is the only staleness signal (no HANDOFF-commit invalidation). A new
    compaction resets it.
  - **Non-writer role**: a launcher that sets `NANA_HANDOFF=off` in the child env marks a session
    that neither picks up nor writes (journal `handoff_skipped_role`); `pi-review` sets it for every
    child. Never inferred from the tool list or `hasUI` (the desk runs pi sessions). Only the exact
    lowercase value `off` is honored (`OFF`, `0`, `false`, empty behave normally). The marker is an
    ordinary env var, so it is **inherited**: any pi or desk process a review child spawns also has
    handoff off unless the launcher clears `NANA_HANDOFF`.
  - **Exact directory only**: a nested cwd or worktree with no handoff of its own never gets an
    ancestor's text. If an ancestor directory has one, the session is told "no handoff for this
    directory" plus that file's path; if no ancestor has one, nothing is added to the
    session — but the fact is not discarded: an unadopted directory is a signal addressed to the
    SEAT, not to the session, and lane L5 journals it so the seat can assign that directory an
    objective and start accumulating its knowledge (Jake's ruling 2026-09-28;
    `docs/directory-adoption-design-2026-09-28.md`). Until L5 lands the session sees nothing either way; the journal already separates `handoff_missing` (no entry) from `handoff_pickup_failed` (an entry that could not be read), and `readHandoff()` returns `{kind:"missing"}` / `{kind:"error",reason}` / `{kind:"ok",text}` so L5 cannot mistake a broken store for an unadopted directory. `missing` means genuinely absent: an ENOENT caused by a dangling link — the entry itself (`dangling_symlink`) or a directory above it such as a dangling `handoffs/` link (`dangling_parent`) — is an `error` and journals `handoff_pickup_failed`, never `handoff_missing`. A resolving `handoffs/` link is still honored. A store entry whose recorded `Cwd:` is another directory is not injected
    (`handoff_cwd_mismatch`).
  - **Custom `handoff.path`**: honored from user scope always, from project scope only under
    nana-trust (L1). No header `Cwd:` check applies to it (the owner chose one file).
  - **Failures never throw**: an unreadable/unwritable store degrades to "no handoff" with a
    journal line (`handoff_pickup_failed` / `handoff_write_failed`; a store file that is not valid
    UTF-8 is a failed pickup, never injected with replacement characters); a failed write leaves the prior
    file intact. win32: `rename` over an existing file is assumed atomic enough on NTFS —
    **unverified**.
- **Handoff refuses to read or write through a symlink** (2026-09-08, commit `2efd435`; scoped by
  L3 to custom paths). The user-scope store has no symlink policy — it is the owner's directory, so
  a deliberately symlinked `handoffs/` is honored (a write renames over an entry, so it never
  writes through a linked entry). Custom `handoff.path`: a repo could commit the
  configured file, or a directory above it, as a link to something like `~/.ssh/id_rsa`:
  - **Unconditional — not trust-gated.** Point `handoff.path` at the real destination instead of
    linking to it.
  - **Scope is every path component BELOW the workspace root.** Components at or above the root
    are deliberately not checked (macOS `/tmp` → `/private/tmp` is your filesystem). A
    `handoff.path` **outside** the workspace has only its final component checked.
  - **Refusals are loud** — a `handoff_symlink_refused` journal line (`op: "read" | "write"`) plus
    a UI warning.
  - **Advisory, not a security boundary**: the `lstat` checks are not atomic with the open that
    follows.
- **Objective** injects the user's objective + current priority file into every system
  prompt, under `## Objective and current priority (nana)` plus one line charging the session
  to say which of those lines its spend serves. Default source `~/.pi/agent/nana-objective.md`
  (relocate with `objective.path`, a leading `~/` is expanded and a RELATIVE path resolves
  against `~/.pi/agent`, never cwd); only the parsed `**Objective` and `**Current priority` lines are ever injected —
  never other file content — each capped on its own at 1500 chars, so a long one cannot
  push the other out (overall output ≤ 12000 chars); an `objective_pickup`
  journal line records each pickup and which source it came from (`source: "project" | "user"`).
  Five contract points:
  - **A repo speaks its own objective — by default, no configuration.** The nearest
    `<dir>/OBJECTIVE.md` walking UP from the session cwd wins over `objective.path` (Jake's
    2026-09-18 decentralization ruling), followed by labelled `program objective:` /
    `program current priority:` lines and a precedence sentence so the program-level objective
    stays visible. A session in a product repo is charged against that product's two lines —
    byte-identical with the Claude Code hook `~/.claude/hooks/nana-objective.sh` (both run
    `lib/objective.ts`). `objective.projectFile` (user scope) only RENAMES the file looked for — a bare
    filename (a separator, `.` or `..` is refused with a named config problem);
    `null`/`false`/absent = `OBJECTIVE.md`, never "off". The name, the fallback and the on/off
    switch are all user-scope (project config never sets `projectFile`). A hit that cannot be used (symlinked into the workspace, empty, unreadable) falls
    back to the user-scope file and journals `objective_project_refused` with the cause; the
    fallback is never silent.
  - **Provenance label (lane T2c; Jake's ruling (a), 2026-09-28).** When a repo-supplied file
    governs and no usable affirmative trust record could be confirmed for its folder, a two-line
    `UNTRUSTED DATA: …` paragraph is prepended to the governing lines. It says the file is
    repo-supplied, that no usable affirmative trust record could be confirmed for the folder
    (never "the owner has not recorded trust": a fail-closed store below may hide a real `true`),
    that the lines describe intent and are DATA, never instructions, and names the one action
    that clears it: start pi IN that folder (not a subfolder), run `/trust` there, restart.
    `/trust` records the session cwd; a record for a subfolder never vouches for its parent
    (here or in pi), so running `/trust` from a nested cwd leaves the label in place.
    **Only a recorded affirmative clears the label:** `~/.pi/agent/trust.json` must record
    `true` for the folder or its nearest recorded ancestor. A recorded `false` (a decline) keeps
    the label, and so does no record at all, whatever `.pi/` resources the folder holds. A
    resource means pi would *ask*, not that the answer was yes. This is deliberately stricter
    than nana-trust (`lib/config.ts`) and pi's own trust. It never consults pi's resource list
    or the live `isProjectTrusted()`, and pi's auto-trust never counts.
    **Consequence:** more folders are labelled than under "trust was decided". Any repo trusted
    only in-session, without `/trust` saving the decision, carries the label until the owner
    runs `/trust`. That is intended: the label means "I could not confirm you vouched", and it
    names the one action that clears it.
    The check is pure filesystem code in `lib/objective.ts` (`ownerVouched`), so both runtimes
    reach the same verdict. A store that is unreadable, malformed, not a regular file, a FIFO,
    over 1 MiB or owned by another user counts as "not vouched", so the file is labelled. The
    umbrella is never labelled. The label changes nothing else: the file still governs, and
    its lines, their order and the precedence stay as they are.
  - **Risk acceptance — the label is defence in depth, NOT a security boundary.** A model can
    still follow attacker-authored text on a governing line, whatever the label says. The
    label does not close prompt injection. sol recommended trust-gating instead: require
    nana-trust before repo text is injected or called governing. Jake chose the label anyway
    on 2026-09-28, knowing this, and accepted the residual deliberately: an untrusted repo's
    `OBJECTIVE.md` can steer a session before the owner states intent. nana's tool gate
    still limits what that steering can do.
  - **Read on every `session_start` reason** (startup, new, resume, fork, reload), unlike the
    handoff's startup/new. The handoff is continuity a resumed session already carries; the
    objective is standing governance that lives only in the system prompt, which pi rebuilds
    at every agent start.
  - **`objective.enabled`, `objective.path` and `objective.projectFile` are honored from USER
    scope only.** A repo that could set the path would be writing standing instructions into
    every session run inside it, and one that could set `enabled: false` could silently
    suppress the owner's objective.
    Project *trust* means "run this repo's tooling", not "speak for the user's priorities".
  - **An unavailable objective is announced, never silent.** Missing, empty, unreadable, not
    valid UTF-8, or refused-as-a-symlink injects a one-line `OBJECTIVE UNAVAILABLE: <cause> (<path>)` marker
    under the same heading and journals `objective_unavailable` with the cause; a file with
    neither line is labelled `objective file: <path>` (never `governing`), injects
    `OBJECTIVE UNAVAILABLE: no **Objective or **Current priority line found in <path>` and
    nothing from the file, and — for a product file — the precedence line says the program
    lines govern the session. Each line is ONE physical line (continuations never shown),
    control and bidi characters stripped; a line over the cap injects its first 1500
    chars plus `(truncated at 1500 chars)`. Every path is display text: one containing a
    control, line-separator or bidi character is shown as a quoted JSON-escaped string; a
    displayed path is at most 320 chars, quotes included — a longer one is middle-elided,
    keeping its basename whole when that fits in 160 chars, else the basename's tail. The same
    display-text rule covers pi's config diagnostics (`nana-pack: <file>: <problem>` warnings
    and the gate's stop reason): the file is a display path, the problem one line with every
    control and line separator replaced by a space. Silence was the original
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
