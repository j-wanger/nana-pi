# nana-pi-pack

Extensions + skills making pi shippable the nana way: hook coverage, opinionated
project scaffolding, and dev-workflow skills.

**Dependencies:** none at runtime beyond pi itself — `@earendil-works/pi-coding-agent`
is an *optional* `peerDependency` (the extensions run inside pi, which is the host, not
something they install), and `package.json` declares no `dependencies` or
`devDependencies`. Tests are zero-dep `node packages/nana-pack/tests/*.test.mjs`; the
ones that load a real extension skip themselves when pi is not installed globally.

## Skills

| Skill | What it does |
|---|---|
| `scaffold-py` / `scaffold-ts` | Generate a project via copier from <https://github.com/j-wanger/nana-pi> (`--data language=python\|typescript`; the repo root is the versioned template src, cloned at the latest v* tag) — uv/ruff/mypy-strict/pytest or pnpm/strict-tsconfig/Biome/Vitest, folder-by-feature, lean nested AGENTS.md, and a `.pi/nana-pack.json` post-edit preset (format+lint each edit, file-size caps 500py/300ts, typecheck). Generated projects record the template tag, re-sync via `uvx copier update`, and carry a CI `template-drift` job that goes red when a newer template tag exists. |
| `adopt-py` / `adopt-ts` | Retrofit the same stack onto an EXISTING project (template adopt mode: configs only, source tree untouched). Clean-tree overlay, reconcile from `git diff`, staged strictness with recorded ratchets (py: measured coverage floor + mypy per-module overrides; ts: `@ts-expect-error` ratchets), ends git-tracked on the same `copier update` relationship. |
| `adopt-structure` | Add the agent-navigation layer to an EXISTING project of ANY language — a lean root `AGENTS.md`, per-folder `AGENTS.md`, a postEdit-only starter `.pi/nana-pack.json`, and the three frontier seeds (`OBJECTIVE.md`, `HANDOFF.md`, `docs/sessions/README.md`) copied from `templates/_shared` **only when absent**. Docs only: no language stack, no copier, no source/config/CI changes (that's `adopt-py` / `adopt-ts`). Safe on re-run (reconciles). |
| `py-lint` / `py-test` | Run the ruff/mypy and pytest gates and report concisely (ported from nana-dev-kit) |
| `py-review` | 8-point AI-PR review checklist on the current diff (ported from nana-dev-kit) |
| `spec` | 9-section contract before non-trivial work, with adversarial pass + machine-checkable exit criteria (ported lean from nana-dev-kit) |
| `requirements` | Work the standing requirement set: REQUIREMENTS.md rows and the `req:` trace rail, sealed tunables, module contract headers, the code map and the README contract — plus an audit mode that extracts rows from a project that has none. `nana-setup` symlinks this same directory into `~/.claude/skills/requirements`, so pi and Claude Code read ONE source |

Seven extensions giving pi the hook coverage we require (Claude Code parity classes):

| Extension | Hook class | Events used |
|---|---|---|
| `nana-gate` | Pre-tool permission gating | `tool_call` (blocking) |
| `nana-post-edit` | Post-edit format/lint/test | `tool_result` (modifying) |
| `nana-lifecycle` | Session lifecycle observability + `/reload-runtime` | `session_start/…compact…/shutdown`, `registerCommand` |
| `nana-notify` | Outward notifications | `agent_settled`, `ui_prompt_start` |
| `nana-handoff` | Session continuity across compaction | `session_compact` (write) / `session_start` + `before_agent_start` (inject) |
| `nana-objective` | The owner's objective + current priority in every system prompt | `session_start` (all reasons) + `before_agent_start` (inject) |
| `nana-writing` | The writing-for-Jake rule (trial) in every system prompt | `session_start` (all reasons) + `before_agent_start` (inject) |

**Verifier-pipe guard (user-scope):** every session will prompt before running a bash or PowerShell command that pipelines output before `git commit` without earlier active `pipefail`. Claude Code's hook abstains with empty stdout on non-matches and errors, leaving its normal permission flow in place; errors are diagnosed on stderr. Claude Code's Bash hook is unavailable on win32. This is an additive best-effort text check: a pipeline or commit not present in the literal command text and reached through a later call is not matched; the sandbox is the boundary. Existing gate checks keep precedence; this floor cannot be exempted by `allowPatterns`.

## Install

```bash
pi install git:github.com/j-wanger/nana-pi       # canonical — the repo-root package.json manifests this subdir
pi install /path/to/nana-pi/packages/nana-pack   # local dev
pi remove ...                                     # uninstall
```

## Tests

```bash
npm test -- nana-pack     # from the repo root: every packages/nana-pack/tests/*.test.mjs
```

Zero-dep `node <file>` runs, one process each with a fresh temp `HOME`; the files that load a real
extension skip themselves when pi is not installed globally.

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
`.pi/skills` in a project you did not approve stays ignored. Tested host since 2026-10-05: pi 1.0.2 (the pack's events and APIs re-checked there; lane U). The skill claim that follows was verified on pi 0.84.4 and not re-run on 0.87.1 or 1.0.2: a skill
added to a trusted project's `.pi/skills` after startup goes from absent to present across one
`/reload-runtime`.

## Review runner (`bin/pi-review.mjs`)

An independent review is run by a `pi` (Codex) call, and that endpoint intermittently **stalls** —
`pi` has no request timeout, so it hangs with 0 CPU forever. `pi-review` runs the call under a
liveness watchdog: it polls the child's CPU time and, if that stays flat for `--stall-secs`, kills
the whole process group and retries with a fresh session (`--retries N` = re-attempts after the
first; default 2). SIGINT, SIGTERM and SIGHUP kill and reap the child tree and release a review reservation (exit 130, 143 and 129 respectively). A review is "produced" only when the child exits 0 *and* the output file is
non-empty *and* contains a case-sensitive line-start `VERDICT` word (the predicate lives
in `bin/review-shape.mjs` and is passed in by `pi-review`; the watchdog itself carries none);
exit 0 means the review is in `--out`, exit 1 means every attempt failed.

It also enforces the **review round cap** (`bin/review-round.mjs`): three rounds **per item**,
counted in a user-scope ledger — never from the output file name, and the same for every launcher.

- **Item** = `{repository, slug}`. `--item <slug>` is **required**; a call without it is refused
  loudly. The slug is canonicalized — NFKC, trimmed, lowercased (JavaScript `toLowerCase`, not Unicode case folding), internal whitespace collapsed
  (`" Scope  ONE "` ≡ `"scope one"`) — and refused if it contains `/`, `\`, `..` or a control
  character, or exceeds **128 characters**. The repository is the realpath of the git **common
  dir** of the reviewed tree, so every worktree of one repository shares an item, while the same slug in an unrelated
  repository is a different item. (Chosen over the remote URL: it exists for every repository,
  needs no URL normalization, and cannot be changed by `git remote set-url`. Cost: a fresh clone
  at a new path is a new scope.) `--tree <path>` selects the reviewed tree and defaults to the launcher cwd; outside git admission is refused. A scratch launcher must pass `--tree <path inside the reviewed repository>`.
- **A round is a revision.** Revision = the reviewed tree's git `HEAD`, as a full sha.
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
  no round), while a new untracked, non-ignored file is a new state. Reverting to an already-reviewed state earns no round. Ledger
  lines carry both parts as `head` and `snapshot` (`snapshot: null` when clean). **Any git
  failure refuses admission** with git's error — it is never read as "clean". `--revision` is only a fallback when the reviewed git tree has no HEAD; otherwise it must resolve to HEAD's commit or it is refused. `--role` is audit metadata only.
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
- **Ledger** (`~/.pi/agent/` — always; `PI_CODING_AGENT_DIR` does not move it, so a shell variable cannot reset the tally):
  - `review-ledger.rounds.jsonl` — **the tally**, permanent, never rotated: one line per round
    earned, `{"v":1,"ts":…,"kind":"round","repo":…,"item":…,"revision":…,"head":…,"snapshot":…,"role":…,"launcher":…}`.
    Optional fields include `override` (the admission reason), `unverified` (tree drift at completion), `completedAs` (the observed later revision), and `completedError` (why that revision could not be derived). Legacy `path:` repository keys remain readable but new admissions require a git tree. The cap reads only this and the live reservations. A malformed line **refuses** admission
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
scratch=$(mktemp -d)
pi-review --item <slug> --role sol --out "$scratch/sol-r1.md" -- --provider openai-codex -m gpt-5.6-sol -p "$(cat brief.md)"
```

**Any other launcher** (e.g. a hand-rolled `claude -p … > "$scratch/out.md"`) prefixes the same check —
`bin/review-ledger.mjs run` reserves the round, runs the command with stdout → `--out`, and records the verdict only if it exits 0 with a review-shaped output. The reviewed tree defaults to the launcher cwd; pass `--tree <path>` when launching from scratch:

```bash
scratch=$(mktemp -d)
node ~/nana-pi/packages/nana-pack/bin/review-ledger.mjs run --item <slug> --role opus --out "$scratch/out.md" -- claude -p --model <model> "$(cat brief.md)"
```

`review-ledger check --item <slug> [--tree <path>]` answers "would a review of this tree's revision be admitted?"
(exit 0/1): it takes the lock and writes nothing — no reservation, no pruning.

`review-ledger report [--item <slug>] [--repo <path>]` prints one read-only line per recorded round:
item, short revision, role, model, duration, attempts, verdict and over-cap reason. Provider/model and
launch/end timestamps are recorded in the tally; old rows show `-` where fields are unavailable.

### Land helper: `bin/nana-land.mjs`

`nana-land merge --tree <integration-worktree> --main <main-checkout> --suite "<command>" --reviewed <sha>=<item> [--reviewed <sha>=<item> ...]` requires a verified `LAND` review-ledger round for each named item and revision; drifted, unverified rounds do not authorize a merge. `--exempt "<reason>"` requires a nonblank reason, replaces reviews, and appears in the success record. The helper requires a clean source tree and clean tracked state in the checkout on `main`, checks fast-forward ancestry, and runs the suite in the source tree. Immediately before merging it rechecks both clean states, that the checkout is still on `main` at its captured HEAD, and that the source tip is unchanged. It then runs one `git merge --ff-only <tip>`; afterwards it requires the checkout still on `main`, main ref equal to the tip, and clean tracked state before it verifies containment and prints push, archive, and HANDOFF stubs. It never pushes or edits those records. Do not operate the main checkout during a land: a branch switch in the instant between the final check and merge is not defended, though the helper refuses afterwards without success records. Git refuses an untracked collision with a landed path. Integration commits outside reviewed ancestry are reported exactly, not blocked. After a successful merge it prints the shared local `releaseStatus` result, which exports `selectReleaseTag` and `countTemplateCommits`, reports main against origin/main as of the last fetch, never fetches, and never runs `git tag` because its named form creates a tag.

`nana-land cleanup <lane> --main <main-checkout>` is a separate operation: it requires the checkout on `main`, then removes only a clean worktree whose `feat/<lane>` branch is contained in `main`, without force. Run through `nana-setup install` to link `nana-land` on PATH; `nana-setup doctor` reports whether the link is valid. The main checkout may have untracked files, but git can still refuse a colliding fast-forward.

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
scratch=$(mktemp -d)
pi-worker --out "$scratch/wp-a-out.md" --stall-secs 300 --poll 20 -- --provider openai-codex --model gpt-5.6-sol -t read,grep,find,bash,edit,write …
```

#### Lane builder

Use `pi-worker --lane <name> --brief <file> --out <file> [--max-secs N] [--stall-secs N] [--poll N]` with no `--` or pi arguments. Lane mode requires cwd to be the real repository root of a linked worktree on exactly `feat/<name>`; the brief must be a readable regular file. It refuses the main checkout, a nested cwd, detached or switched branches, invalid inputs, and every caller pi argument before acquiring the lock or starting pi. It builds the complete pi argv itself: provider `openai-codex`, model `gpt-6-luna`, `--thinking high`, tools `read,grep,find,bash,edit,write`, the rendered `prompts/builder-preamble.md` path, the validated brief path, and a fixed instruction naming the lane. The preamble precedes the brief. The sealed roster is one value in `bin/worker-config.mjs`, following Jake's roster ruling (2026-10-06); changing it is a roster edit requiring a requirements diff. Caller overrides are not supported. The usual non-lane worker invocation is unchanged.

Lane launches set `NANA_WORKTREE_ROOT` and `NANA_ROLE=worker`. The gate refuses edit/write targets outside that root, the real `os.tmpdir()` and `/tmp`; it resolves symlinks and missing nested paths through the nearest existing ancestor. This does not cover writes performed by bash or another process. The gate is advisory; the sandbox/container is the boundary.

Lane mode holds an exclusive-create pid lock file for the worker lifetime. Any existing lock refuses the launch, naming its path and recorded pid when readable; automatic reclamation is deliberately disabled because a dead watchdog may leave its pi process group running. Before removing a lock by hand, confirm that no builder and no pi process group for that worktree is running. The lane wall-clock ceiling is **28,800 seconds (8 hours)**; `--max-secs N` overrides it for one launch. The ceiling kills the entire pi process group and reports FAILED. If no affirmative trust record covers the worktree, the launcher prints `trust: none for <worktree> — project post-edit checks are inert (nana-setup trust <dir>)` and continues; project post-edit commands are inert until pi trusts the directory.

### Trust model

**This is a self-governance device against the fix-review treadmill, not a security control.**
Formal review rounds are admitted only through `pi-review` or `review-ledger run`. Agent-tool and
hand-run reviews are supplemental and earn no round; do not describe them as formal counted reviews.
Each `pi-review` review runs from a detached checkout under the OS temporary directory; ignored files such as
`node_modules` are not copied, so a reviewer that needs them must install dependencies or review read-only.
The checkout path is available as `NANA_REVIEW_ROOT`; initialized submodules are refused before admission,
and stale checkouts from dead reviews are reclaimed at startup.
Any number of reviews, by any roles, on one revision is one round. A land ruling on the revision the
last round reviewed consumes nothing; a land review of a new revision is a round like any other.
The ledger lives in the same user's home directory as the agents it governs. Anyone who can
write it can exhaust an item (three fabricated round lines) or extend one (delete lines); anyone
can also run a launcher by hand and never touch it. `NANA_ROLE=reviewer` is a context-isolation
convenience, not a security boundary: a worker or user can spoof or clear it. What the ledger buys
is that every counted round, completed verdict and override is recorded — a bypass must be explicit. Not every admission is: an ordinary
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

**When this lands:** `nana-setup install` links `pi-worker` to `bin/pi-worker.mjs`; doctor checks it alongside the existing `pi-review` link.

**Release note — `--retries` changed meaning (T2b).** `--retries N` now means N **re-attempts
after the first** (N+1 attempts total); before T2b it meant N attempts total. An explicit
`--retries 2` therefore runs **3** attempts where it used to run 2. Defaults are unchanged in
effect (`pi-review` 3 attempts; `pi-worker` 1). No call site in this repository passes the flag;
an external caller that does should subtract one — and a **worker** caller should drop the flag
(see Migration above). `pi-review` and `pi-worker` print a one-line
notice whenever `--retries` is passed explicitly.

**Keep review logs outside the reviewed tree.** At admission, `pi-review` and `review-ledger`
inspect stdout and stderr file identities. If either regular file is the same device and inode as
a non-ignored path in the reviewed tree, admission refuses with the path named. This covers tracked
and untracked files; closed descriptors and platforms without device/inode identities degrade to
no check. Save `--out` and shell redirects under a scratch directory outside the reviewed tree, as
in the examples above. `complete()` still re-derives the revision **under the ledger lock**, so a
concurrent edit remains loud and is recorded unverified. Redirect checks do not traverse initialized
submodule contents, so logs redirected inside a submodule are not detected.
`~/.local/bin/pi-review` symlinks this file, so the command works from any repo — not only the one
it used to live in. `~/nana-agent-loop/app/scripts/pi-review.mjs` is now a forwarder onto this bin.
Tests: `tests/review-round.test.mjs` (rules), `tests/review-ledger.test.mjs` (processes).

## HANDOFF frontier checker (`bin/nana-frontier.mjs`)

This report-only CLI checks a HANDOFF document's 1,200-word budget and frontier structure: multi-line entries beneath Landed headings, landed markers in Next or Open for Jake, unresolved numbered references, overdue explicit dates, and missing Open for Jake tags.

```bash
node packages/nana-pack/bin/nana-frontier.mjs HANDOFF.md
node packages/nana-pack/bin/nana-frontier.mjs --today 2026-10-06 HANDOFF.md
node packages/nana-pack/bin/nana-frontier.mjs --strict HANDOFF.md
```

It prints `file:line: kind: detail` findings and a summary. The default clock uses the current UTC date; `--today` injects a deterministic `YYYY-MM-DD` date. Findings do not change the default exit status; `--strict` exits nonzero when findings exist. A blank line ends a list entry, so a later indented paragraph is not joined to it. Tests: `packages/nana-pack/tests/frontier.test.mjs`.

## Writing checker (`bin/nana-writing.mjs`) — report-only, trial only

Zero-dep, Node only, cross-platform; the pure checks live in
`lib/writing-check.mjs`, every tunable in `lib/writing-config.mjs` (spec:
`docs/reviews/writing-trial-2026-10-04/design-ruling.md` and its Amendment 1). The rule it is
named by, `rules/nana-writing.md`, reaches pi through the `nana-writing` extension above (an
append, not a context-file link — Amendment 1 §A1, after astra r1 found a link could both hide
a user's own `AGENTS.md`/`CLAUDE.md` and be hidden by one); the CHECKER stays manual and
report-only during the trial — run it by hand, once per report, before you send it.

```bash
node packages/nana-pack/bin/nana-writing.mjs file.md            # check one or more files
node packages/nana-pack/bin/nana-writing.mjs --report < draft.txt   # stdin, + verdict + identifier checks
```

With no path it reads stdin (named `-` in the output). Four checks run always — sentence
length, passive-voice CANDIDATES (a heuristic, not a parser — see Known limit), a banned word
outside a code span, and the closing summary — and two more run only with `--report`: a
listed uppercase verdict as the first token of the first prose sentence (optional emphasis markers may precede it), and identifiers (a backtick span, or a
slash-path token — including the banned word's own code span, since a quoted word is a
mention, not a use). Each finding is one line, `<file>:<line>: <check>: <detail>`; the output
always ends with one summary line:

```
summary sentences=N words=N over=N passive=N banned=N verdict=<k>/<n>|n/a identifiers=N
```

`verdict` is the cross-file SHARE in `--report` mode — `<k>` inputs whose first prose sentence
carried a listed uppercase verdict as its first token, out of `<n>` checked — and "n/a" otherwise.

It exits 0 whatever it finds — this CLI reports, it never blocks.

**Trial tally.** The seat runs one invocation per report sent (`--report`) and a SEPARATE one
per `HANDOFF.md` edit (no `--report` — verdict and identifiers do not apply there), recording
the day's counts in `docs/reviews/writing-trial-2026-10-04/tally.md` in two columns, never
mixed (astra r2 SHOULD 3): reports checked, verdict passes, report sentences/over-cap, HANDOFF
sentences/over-cap, and any lost-detail complaint. Stop at day 14 or 20 REPORTS (HANDOFF does
not count toward this), whichever is first, or after two lost-detail complaints.

**Markdown-aware splitting (Amendment 1 §A2).** A fence (3+ backticks/tildes) toggles fenced
state; every check skips a fenced line, banned included. A heading or a table row (`|`-led)
never becomes a sentence, though the banned scan still reads it. A blank line or a list-item
line (`-`, `*`, `+`, or `1.`/`1)`) ends the current paragraph; a list item starts a new one with
its marker stripped. Any other line joins the current paragraph with one space (a soft wrap),
so the same prose wrapped across two lines or written on one gives the identical summary.
Within a paragraph, a sentence ends at `.`, `!` or `?`, optionally followed by a closing quote
or bracket, then whitespace or the end; code spans and URLs are masked first so a period inside
one never splits early.

**Known limit.** No abbreviation engine: "e.g." and "vs." still split a sentence early —
recorded here, not fixed. The passive check is a regex heuristic, not a parser: the labelled
24-sentence diagnostic fixture in `tests/writing-check.test.mjs` currently measures 100.0%
precision / 66.7% recall (astra r1 SHOULD 1 labelled the set, 2026-10-04; astra r2 SHOULD 1,
2026-10-04, after the whole-word exception fix — the pre-fix measurement on the same labelled
sentences was 77.8%/58.3%). These are diagnostic results on 24 sentences, not a general
performance estimate, and the fixture pins no number — a floor would be a tunable with no
provenance, and the check is report-only.

## What you will see

In TUI and RPC sessions (the desk included) the pack is quiet by design but not invisible.
Print/JSON mode (`-p`) has no UI to draw on, so none of this appears there:

- **Chips** (TUI footer / desk header): `nana-pack ✓` at session start · `post-edit ✓ 2 checks · foo.ts`
  after each checked edit (`✗ 1/2` on failure, `⏱ timeout`, `– skipped (lock|aborted)` when a check
  could not run) · `gate ✓ 12 checked · 1 gated` — tool calls the gate inspected, and the ones it stopped on.
- **Toasts**: post-edit check failures, compaction summary written/picked up/refused, context compacted.
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

User `<agent dir>/nana-pack.json`, project `<cwd>/.pi/nana-pack.json` (project wins,
read on every event). `<agent dir>` is **pi's active agent dir**, the one pi reads
`settings.json` / `auth.json` / `models.json` from: `PI_CODING_AGENT_DIR` when set (`~`
expanded; a relative value resolves against the process's cwd), else `~/.pi/agent`. The
journal defaults live there too. If the active dir has no `nana-pack.json` but
`~/.pi/agent` does, that file is **not read**: a warning and a `config_agent_dir_mismatch`
journal line name both paths once per session, and the gate runs without a user config.
Both files — the active one (and its realpath) and `~/.pi/agent/nana-pack.json` — are on the
gate's policy floor. **Exception:** the review round-cap ledger stays in `~/.pi/agent`
regardless of `PI_CODING_AGENT_DIR`, so a shell variable cannot reset the tally. Every non-gate block applies live, without restarting. The **`gate`
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
  (pi's active trust store: `~/.pi/agent/trust.json`, or under `PI_CODING_AGENT_DIR` when set), then restarted. An ignored project config is announced once per
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
  named file with **any editor outside pi** — `<agent dir>/nana-pack.json` (user) or
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

- Writing block: the character cap slices UTF-16 units. A rule over 4,000 chars with an astral character at the cut leaves a lone surrogate in the block. The shipped rule is far shorter; one `toWellFormed()` is due at the adopt verdict.
- Writing block: it has no switch of its own. pi's filter (`-extensions/nana-writing.ts` on the pack's `packages` entry in object form, or `pi config`) removes it, and nana-setup then reads the pack as unregistered until the plain entry is restored.
- Writing block: reviewer and worker sessions carry it too. The first `pi-review` corpus after landing is the check. A dropped path or a shortened finding moves delivery behind `hasUI`.
- Writing checker: it reads any argument except `--report` as a file path, so `--help` prints one error line and an empty summary.

- **One renderer per surface** (`lib/display.mjs`, lane S1). **What it guarantees:** structural
  protection for INTERPOLATED DISPLAY FIELDS in this package — a repo-controlled value placed into
  a prompt line, notification, status, gate approval dialog, seat Markdown or a header field of a
  file we write cannot add a line, a heading, a fence, a field or a closed code span to what the
  consumer receives. **What it does not:** it is not "sanitized model context", and a renderer
  cannot stop text that is semantically hostile. Intentional exceptions: the compaction summary BODY
  is payload, injected raw behind its `Source:` / provenance / authority framing, capped at 8000
  UTF-16 code units; structured serialization (journal JSON) is escaped by `JSON.stringify`, not
  by these renderers. **Out of scope:** `apps/**` (the desk shortens and places paths itself);
  `packages/nana-knowledge` (its own `clean()` in `packages/nana-knowledge/lib/query.ts`, direct interpolation in
  `packages/nana-knowledge/lib/hook.ts:93` — a separate follow-up); the failure marker in the shell fallback of
  `packages/nana-setup/claude/hooks/nana-objective.sh`; and any external consumer that copied a renderer,
  builds its strings itself, or runs an older installed checkout (importers of `lib/objective.ts`
  get the shared renderers through its re-export; nothing else is certified). Every field is
  chosen by where it LANDS —
  prompt / model-visible text: `promptPath` (one line; a path holding a control, line-separator
  or bidi character is a quoted JSON-escaped string; ≤320 chars, middle-elided) and `promptText`
  (one line, every control/separator/bidi char → space, capped); UI notification and status:
  `uiPath` / `uiText`, the SAME rule (U+001B and C1 are in its class, so no ANSI sequence reaches
  the TUI); Markdown read by the seat: `codeSpan`, which REFUSES (never escapes) a string holding
  a backtick or any of those characters; a field of a file we write: `fileField` (one line,
  bounded); an exact prompt locator: `locator` (never elided, JSON-escaped when unsafe, decodes
  to the exact path). No other module carries its own escaping rule. The two pre-import
  allow-lists in `bin/nana-adoption.mjs` / `bin/nana-objective.mjs` are deliberate exceptions:
  they run where that import may have failed.
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
  checked in commands AND edit/write targets. rm-text checks scan every command segment,
  including quoted arguments and text-only mentions. Interpreter deletion scans inspect the
  complete interpreter command string.
- **Policy files** — `nana-pack.json` (user and project), pi `auth.json`, `settings.json`,
  `mcp.json`, `trust.json` and `extensions/**` in the active and default agent dirs, project
  `.pi/settings.json`, `.pi/mcp.json`, `.pi/extensions/**`, plus `.claude/settings.json`,
  `.claude/settings.local.json`, and `.claude/hooks/**`. These are files whose content runs
  or shapes the next session's code; prompt-only resources such as SYSTEM, APPEND_SYSTEM,
  skills and prompts are not on this floor. The `.claude` files are gated at **project scope too** (a ratified
  expansion, 2026-09-28: a project `.claude/settings.json` carries hooks that run code). What
  is caught: **edit/write** to one in every path form pi resolves (relative, `~`, `@`, `..`,
  backslash, any case, a symlinked alias), and a bash/PowerShell command whose text names
  one **literally**, including quote-preserved shell words with spaces or delimiters and
  `name=value` operands such as `dd of=...` (`>`, `tee`, `sed -i`, `cp`, `install`, `Set-Content`,
  `Out-File`, even `cat`) — except for a literal path inside interpreter code operands such as
  `python3 -c "open('/private/tmp/agent/settings.json','w').write('{}')"`: paths inside these
  operands are not extracted for the newly floored pi settings/auth/mcp/extensions files. This is
  a declared gap, not a promise that the command is safe. The legacy nana-pack/trust floor still
  covers its own files. Also accepted is exactly one variable spelling: `$PI_CODING_AGENT_DIR`,
  `${PI_CODING_AGENT_DIR}`, `%PI_CODING_AGENT_DIR%` or `$env:PI_CODING_AGENT_DIR` directly
  followed by `/nana-pack.json` or `/trust.json` (either slash), balanced forms only, matched
  case-insensitively on purpose (cmd/pwsh names are). When `nana-pack.json` or
  `trust.json` in the active or default agent dir is a symlink, its target is a policy file
  too. What is **not** caught — a path the shell computes at run time, general variable
  expansion included:
  `cd ~/.pi/agent && printf x > nana-pack.json` (relative after shell `cd`, also for `trust.json`
  and `cd .pi`; basename tokens resolve against the supplied session cwd, so starting inside a floored
  directory correctly blocks), a glob (`nana-*.json`) or brace-expanded path, a directory in a
  variable other than the one spelling above, `Set-Location …; sc nana-pack.json`, a directory
  symlink created and written through in the same command, `cd … | xargs tee nana-pack.json`, a
  script file, or a Python/Node string built at run time. The scanner handles literal quote and
  assignment syntax; paths produced by shell expansion or execution remain outside its guarantee.
  Matching more command text would not close that class (each form invites another), so none is added.
  **Mitigation, and its limit:** *gate loosening* from such a write waits for the next
  `session_start`. The **other blocks in the same file, including `postEdit.commands`, apply
  live**, so a write that evades the gate's text scan can run code in the **same** session
  through a post-edit command. That is a residual; **what closes it** is the OS sandbox /
  container layer. The agent edits policy files only through you:
  `nana-setup`, the desk settings window, or "Allow once". The compaction summary store
  `~/.pi/agent/handoffs/**` is not a policy file. Script files are not inspected, so sandboxing
  remains the enforcement boundary.
- **Headless blocks name the category and a recovery step:** inspect the named command or path,
  edit it outside the gated call, then retry.
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
  what a variable (other than the `$PI_CODING_AGENT_DIR` spelling above) does, an alias, a script file or `python`/`node` code does at run time, nor
  follow a `cd` earlier in the command (see the policy-file residual above). The `read` tool is not gated. Unattended enforcement
  stays at the container/sandbox layer.
- **Subagent children and nana-gate (architecture-ruling.md, 2026-10-04).** `nana-setup`'s
  subagent config seed (`extensions/subagent/config.json` in the pi agent dir) sets
  `forceTopLevelAsync: true`, which keeps an ORDINARY, model-driven top-level `subagent` tool
  launch backgrounded — and therefore inside the detached runner process that loads this pack,
  gate included, with default extension inheritance — no matter what the model asks for. A
  hand-edited copy of that file that flips the key back reopens a foreground, ungated top-level
  child: same posture as every other residual above, advisory, not a security boundary. A NESTED
  child (depth ≥ 1) the model launches with an explicit `async:false` is not reached by
  `forceTopLevelAsync` either — pi-subagents' own docs say nested calls keep their own inherited
  settings — and runs foreground, ungated, at any depth `maxSubagentDepth` still permits.
- **The structured delegation bridge bypasses `forceTopLevelAsync` too** (astra review r1/r2,
  2026-10-04, pi-subagents 0.75.0): `src/slash/delegation-adapters.js:170-189` builds its launch
  params with `foregroundOnly: true` for a structured delegation request handled by
  `src/slash/prompt-template-bridge.js:144-176`, which `forceTopLevelAsync`'s own depth-0 check
  skips outright — and a foreground child never loads ambient extensions (nana-gate included)
  regardless of how it was launched. Traced no further than that bridge: the package's command
  registrations name no `/delegate`, and its `/run` slash command builds a different launch
  request (`src/slash/slash-commands.js:598-643`) — so no slash command is named here without
  being traced to the `foregroundOnly` path first.
- **An explicit `extensions` override, or a capability ceiling that denies extensions, disables
  ambient extensions on a child outright** (same review, pi-subagents 0.75.0
  `src/runs/shared/child-tool-plan.js:271-273`) — background or not. Background alone is never
  proof nana-gate loaded; both exceptions above are real gaps this lane's config does not close.
- **A background subagent child shares its parent's cwd-derived state.** pi-subagents' detached
  runner process is a second nana-pack session in the SAME working directory as its parent, so the
  compaction summary store key (`sha256(cwd)`) and desktop notify are shared between parent and child.
  Short-lived review children do not compact, so this is safe in practice today; a
  `NANA_HANDOFF=off` switch for subagent children is a follow-up if that observation ever changes.
- **post-edit failures are appended to the tool result** so the model sees and fixes them;
  successes stay out of its context and are reported by the status chip instead. Each failure
  is ONE line (`- check <command> exited N: <output>`, output line breaks shown as ` ⏎ `, the
  last 2000 chars kept and a truncation stated); the edited path is `promptPath`-rendered. `{file}` is
  shell-quoted; exotic path characters on Windows cmd.exe are quoted best-effort.
- **post-edit checks run inside pi's own file-mutation queue** (2026-09-08, commit `2efd435`).
  pi runs sibling tool calls in parallel and releases the edit tool's lock *before* the
  `tool_result` handler, so two edits to one file in a single assistant message could race a
  formatter's read-modify-write. Two outcomes you can see:
  - **The queue exists but the lock cannot be taken** → the checker does **NOT** run, and
    the model is told ``  `<command>` did not run — could
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
- **Journal** is best-effort JSONL at `<agent dir>/nana-journal.jsonl` (override via
  `journal.path`); one line per session event.
- **Notify** writes OSC 777 only in TUI mode, so RPC stdout stays clean even when it has a UI.
  Headless notifications are opt-in (`notify.headless`). `ui_prompt_start` sends the fixed body
  "Approval needed in pi"; notification titles never expose dialog text. A failing OS
  notifier (execFile error, non-zero exit, or a PowerShell exception on stderr) falls back to the
  in-app notification and journals `notify_fallback` with the reason. The notifier also runs under
  an 8 s deadline, so a hung one fails over instead of holding the pipe open.
- **Adoption signal** (L5, 2026-09-29). When a fresh session's store entry is *missing* (never
  merely unreadable), no `handoff.path` is configured, and the session runs inside a git
  repository (`.git` directory or file — a linked worktree is its own root) whose **root** is not
  adopted, the handoff extension journals
  `{"event":"directory_unadopted","cwd":"<repo root>","has":{"handoff","objective","agents","sessions"}}`
  — at most once per root per 24 h (a 256 KiB journal tail is checked). **Journal only**: nothing
  is added to any prompt. This line is **user-scope state**: it goes to the user-scope
  `journal.path` when that is ABSOLUTE, else `<pi's active agent dir>/nana-journal.jsonl` — a
  project-scope `journal.path` never captures it, and a relative user-scope one is not honoured
  for it (every other journal event is unchanged). The seat's Claude Code SessionStart hook
  `packages/nana-setup/claude/hooks/nana-adoption.sh` runs `bin/nana-adoption.mjs` (plain `.mjs`, no Node floor of its own), which
  computes the same file: the last 7 days of those lines, re-checked at print time (adopted,
  dismissed, gone or no-longer-a-repo roots drop), newest first, at most 5 then `…and N more`,
  under `[nana:adoption]` — and nothing at all when there is nothing. Each root prints as data, in
  a code span (`lib/display.mjs` `codeSpan`: nothing escaped); a claim that is relative, the filesystem root, over 512
  characters, holds a control, line-separator or bidi character or a backtick, or carries a future/unparseable `ts` is never printed —
  only counted (`N entries were not printable`). Counting is the READER's, not end-to-end: the
  producer (`extensions/nana-handoff.ts`) checks the same `printable(root)` before journaling, so a root it
  refuses is never written and never reaches that count. A journal that exists but cannot be read prints
  `ADOPTION UNAVAILABLE: <why>`; only an absent one is silent. A dismissal marker of any type
  (file, directory, symlink) counts: it is a decision record whose content is never read. A root is
  adopted by a project objective file (including the configured filename), a saved compaction summary, a dismissal
  marker, or the complete Nana structure: a regular root `HANDOFF.md`, root `AGENTS.md`, and a
  `docs/sessions/` directory; `HANDOFF.md` alone does not count. Repository roots under the real
  operating-system temporary directory are excluded; on POSIX, the canonical `/tmp` root is excluded too.
  `NANA_TEST_TEMP_ROOTS` is a test seam, not configuration: when set, the reader prints a warning; on a STARTUP session, the producer journals the override once per process. Resume, fork and reload sessions do not journal it. Adopt with `nana-setup project <dir>`; dismiss once with `nana-setup project <dir> --not-a-project`.
  The reader says listed repositories lack the complete Nana structure: a regular root `HANDOFF.md`, root `AGENTS.md`, and `docs/sessions/`. A `HANDOFF.md`-only repository remains listed, and the text does not claim it lacks that file.
- **Compaction summary store** (L3, 2026-09-28), unless `handoff.enabled` is false (see below), writes the latest
  compaction summary to a store — **by default the user-scope store fixed at**
  `~/.pi/agent/handoffs/<sha256(canonical cwd)>.md` **regardless of
  `PI_CODING_AGENT_DIR`**; a configured `handoff.path` replaces it (Custom `handoff.path` below)
  (canonical = realpath; the key is case-folded on win32 only; the cwd is
  recorded inside) — one of four deliberate U2 exceptions to the agent-dir override, beside the
  round-cap ledger, the stage-key store and the knowledge index, none of whose runtime reads the
  override (`lib/adoption.mjs` `storeDir()`; HANDOFF.md's U2 entry) — atomically (temp file +
  rename, latest compaction wins), and injects it into the next fresh session (`startup`/`new`;
  resume, fork and reload skip) in **that exact directory**. The path is printed when written and
  picked up; edit it by hand freely. Disable with `handoff.enabled: false`. Seat rulings behind this:
  - **Why user scope, not "require trust"**: pi auto-trusts a nana-only `.pi/`, so "require trust"
    is either a no-op or (with nana-trust) a blackout of compaction summaries in every repo. The store removes
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
    **lower authority than OBJECTIVE.md / AGENTS.md / HANDOFF.md**, and keeps "background state, not
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
    written (it could resolve to an ASCII-space sibling); since S1 the same holds for any other
    control, line-separator, bidi character or lone surrogate (`lib/display.mjs` `locator`). Such a path is shown as the
    absolute path in a JSON string literal (those characters as `\uXXXX`) followed by
    "— path contains characters that are unsafe or rewritten in transit; JSON-escaped here,
    decode it exactly (do not pass it to read as written)" — never claimed readable; the same form is used in
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
  - **Exact directory only**: a nested cwd or worktree with no compaction summary of its own never gets an
    ancestor's text. If an ancestor directory has one, the session is told "no compaction summary for this
    directory" plus that file's path; if no ancestor has one, nothing is added to the
    session — but the fact is not discarded: an unadopted directory is a signal addressed to the
    SEAT, not to the session, and lane L5 journals it so the seat can assign that directory an
    objective and start accumulating its knowledge (Jake's ruling 2026-09-28;
    `docs/directory-adoption-design-2026-09-28.md`). L5 landed on 2026-09-29 (**Adoption signal** above) and it is journal-only, so the session still sees nothing either way; the journal already separates `handoff_missing` (no entry) from `handoff_pickup_failed` (an entry that could not be read), and `readHandoff()` returns `{kind:"missing"}` / `{kind:"error",reason}` / `{kind:"ok",text}` so L5 cannot mistake a broken store for an unadopted directory. `missing` means genuinely absent: an ENOENT caused by a dangling link — the entry itself (`dangling_symlink`) or a directory above it such as a dangling `handoffs/` link (`dangling_parent`) — is an `error` and journals `handoff_pickup_failed`, never `handoff_missing`. A resolving `handoffs/` link is still honored. A store entry whose recorded `Cwd:` is another directory is not injected
    (`handoff_cwd_mismatch`).
  - **Compatibility change (S1) — some directories lose automatic pickup.** `Cwd:` is written
    through `fileField` so a directory name cannot forge a header field; pickup from the default
    store requires the recorded value to equal the canonical cwd exactly. A canonical cwd holding
    a control character (tab, newline, ESC, C1), U+2028/U+2029 or a bidi control, a lone
    surrogate, leading/trailing whitespace, or over 4096 UTF-16 code units cannot be recorded
    losslessly, so its compaction summary is written but never picked up automatically. The write says so at
    that moment: a warning notification ("compaction summary written to `<path>`, but this directory's name
    contains characters that cannot be recorded losslessly — a future session here will not pick
    it up automatically") and journal `handoff_cwd_unrecordable` (`path`, rendered `recorded`).
    The artifact is retained at `<path>` and can be read by hand. A custom `handoff.path` is not
    affected (no `Cwd:` check). A versioned lossless encoding is deferred.
  - **Custom `handoff.path`**: honored from user scope always, from project scope only under
    nana-trust (L1). No header `Cwd:` check applies to it (the owner chose one file).
  - **Failures never throw**: an unreadable/unwritable store degrades to "no compaction summary" with a
    journal line (`handoff_pickup_failed` / `handoff_write_failed`; a store file that is not valid
    UTF-8 is a failed pickup, never injected with replacement characters); a failed write leaves the prior
    file intact. win32: `rename` over an existing file is assumed atomic enough on NTFS —
    **unverified**.
- **The compaction summary store refuses to read or write through a symlink** (2026-09-08, commit `2efd435`; scoped by
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
  to say which of those lines its spend serves. Default source `nana-objective.md` in pi's active
  agent dir (`PI_CODING_AGENT_DIR`, else `~/.pi/agent`; relocate with `objective.path`, a leading
  `~/` is expanded and a RELATIVE path resolves against that same agent dir, never cwd); only the parsed `**Objective` and `**Current priority` lines are ever injected —
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
    that the lines describe intent and are DATA, never instructions. Its second line depends on
    WHY. Store usable (no affirmative record): start pi IN that folder (not a subfolder), run
    `/trust` there, restart. Otherwise it names the object that is actually wrong, and the
    fix to do first, then `/trust` from the folder: the store itself when it is malformed,
    unreadable, not a regular file, too large, owned by another user or not writable (repair
    or remove it; for another owner's file, or a non-writable one, this may need rights you do
    not have); a FOLDER on the store's path when that is not a folder (move it aside) or is
    not writable — another owner, its permissions, a read-only volume (make it writable; this
    may need rights you do not have); a DANGLING symbolic link on that path (pi's recursive
    `mkdir` fails through it — fix or remove the link); or an occupied lock path. pi locks
    its store with `mkdir <store>.lock` (proper-lockfile) and takes over an existing lock only
    when it is **stale by proper-lockfile's own rule** — an empty folder whose mtime is more
    than 10 s in the past (`lockfile.js` `isLockStale`); otherwise it retries for ~0.2 s and
    throws — and pi's own reclaim only ever `stat`s and conditionally `rmdir`s the lock, never
    reads its contents. So an empty lock folder is NOT evidence the store is usable: a fresh one
    (a running pi's lock) or one dated in the future is "store locked" — even a recorded `true`
    is labelled, and the remedy says another pi holds the lock, that it clears on its own once
    that pi finishes, to wait and restart the session, and never to remove it (it may belong to
    a running pi). An UNREADABLE lock folder is held exactly the same way when it is fresh or
    future-dated: proper-lockfile's own `mkdir`, under a restrictive umask, can leave a
    genuinely acquired, empty lock with no read bit, so a failed directory listing is not by
    itself evidence of a non-empty folder. The remedy for that case says so directly — this
    check cannot read the folder to confirm it is really empty — and never ends with the
    `/trust` steps, because waiting and re-checking is the honest next step, not a diagnosis
    this check could not establish. Only a STALE, READABLE, empty folder counts as usable here
    (pi reclaims it; nana's check confirms it is empty and reads the path as usable). A
    STALE folder nana cannot read is always "lock path obstructed" — nana has no way to confirm
    it is the empty folder pi's own rule would reclaim, so it never claims usability it cannot
    see. pi itself may still reclaim that exact folder if it genuinely is empty (pi's `rmdir`
    needs no read permission on the target, only write/execute on its parent) — nana's label can
    therefore be more conservative than pi's actual outcome, and the remedy for this case says
    so too: check what the folder holds first, move it aside only if it holds something, and
    skip straight to the `/trust` steps if it turns out empty, because pi removes an empty one
    itself. It never claims pi's own trust check and `/trust` both fail here, since whether they
    do depends on contents this check could not read. A file, a link or a non-empty READABLE
    folder there is "lock path obstructed" at any age — pi never clears it, every pi trust
    lookup and `/trust` throw, and the label names the lock path and what occupies it. It
    never names a store that does not exist. `/trust` alone cannot be relied on then: pi's own
    `/trust` reads the store (under that lock) before showing its selector and throws on a
    malformed file, and its write needs the folder and the file writable. Its rewrite *can*
    shrink a valid oversized store below the cap, but a store over the cap is not read here, so
    "too large" still says to repair it first.
    **Every remedy names the store that must receive the decision**, because the advice changes
    the folder pi starts in: with a RELATIVE `PI_CODING_AGENT_DIR`, each pi resolves it against
    its own start folder, so the remedy also gives the absolute agent dir to start pi with
    (`PI_CODING_AGENT_DIR=<absolute dir>`); starting pi in the folder with the relative value
    would record into a different store and leave the original session labelled.
    **`/trust` is not just dismissing this label**: saving trust also makes pi load that
    folder's project resources (`.pi` settings, extensions, skills, prompts, themes). Decide on
    the repo, not on the label.
    **The advice is computed once per session and can go stale.** Before removing a store,
    re-check it and back it up: if it was repaired after this session read it, removal
    discards every saved trust decision, declines included — the emitted removal advice says so.
    `/trust` records the session cwd; a record for a subfolder never vouches for its parent
    (here or in pi), so running `/trust` from a nested cwd leaves the label in place.
    **Only a recorded affirmative clears the label**, and only while pi itself can read it:
    pi's ACTIVE trust store must record `true` for the folder or its nearest recorded ancestor,
    AND pi's own lookup must succeed (folder searchable and writable enough to lock, no
    dangling link, lock path free or an empty folder stale by pi's 10 s rule — a fresh or
    future-dated lock means a lookup that throws) — otherwise pi treats the project as
    untrusted and so does the label. A recorded `false` (a decline) keeps
    the label, and so does no record at all, whatever `.pi/` resources the folder holds. The
    active store is `trust.json` in pi's agent dir, resolved exactly as pi resolves it:
    `PI_CODING_AGENT_DIR` when set (with pi's `~` expansion; a relative value resolves against
    the process cwd), else `~/.pi/agent` — one resolution (`piAgentDir()` in
    `lib/gate-paths.ts`) shared with the gate's policy floor. With the override set, the
    default store is never consulted: a stale `true` there cannot suppress the label. A
    resource means pi would *ask*, not that the answer was yes. This is deliberately stricter
    than nana-trust (`lib/config.ts`) and pi's own trust. It never consults pi's resource list
    or the live `isProjectTrusted()`, and pi's auto-trust never counts.
    **Consequence:** more folders are labelled than under "trust was decided". Any repo trusted
    only in-session, without `/trust` saving the decision, carries the label until a usable
    affirmative record exists for it — `/trust` when the store is usable, the named fix first
    when it is not. That is intended: the label means "I could not confirm you vouched", and it
    names the action for the case at hand as seen when the session started.
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
    compaction summary's startup/new. The summary is continuity a resumed session already carries; the
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
- **Receipt settings compatibility:** `receipts.enabled` and `receipts.dir` remain accepted
  but ignored for one release; post-edit checks no longer write or read receipts.
- **Writing trial residuals, recorded at landing rather than fixed further (astra r3, 2026-10-04):**
  - The read ceiling is a BYTE budget; the injected block's cap is a CHARACTER budget. A
    multi-byte-heavy rule (e.g. 2,000 Chinese characters) can be cut well short of
    `WRITING_INJECT_CAP` characters while the truncation notice still names the character cap —
    the notice is imprecise in that direction (REQUIREMENTS.md Open questions).
  - `statSync` then `openSync` is two syscalls, not one: a stable FIFO is refused correctly, but
    a regular file swapped for a FIFO between those two calls is not caught. The guarantee is
    "never hangs on a stable, trusted shipped resource", not an unconditional one.
  - The production composition probe (a real objective, the installed pi 1.0.2 runner) already
    passed before this trial's own regression test caught up to it; no injector redesign
    followed from closing that gap.
  - The FIFO subprocess fixture needs `mkfifo` on `PATH`; absent (including on native Windows,
    not exercised), it reports a skip, not a failure.
  - The verdict check has no line of its own: a heading followed by a failing first prose
    sentence on line 3 still reports that finding at line 1 (REQUIREMENTS.md Open questions,
    R-743). Report-only; low consequence.
  - Unchanged from earlier rounds: the abbreviation splitter still breaks on "e.g."/"vs.", the
    passive check is a measured heuristic (not a parser), a child session's extension set can
    exclude this one depending on how it was launched, and behavioral compliance with the
    rule's own technical-record exclusion has not been tested against a real model.
  - The readme-check test stays red for pre-existing worktree-only dependency gaps (the bench
    extension sandbox, nana-knowledge's node_modules) — unrelated to this trial.
