# nana-pi-pack

Extensions + skills making pi shippable the nana way: hook coverage, opinionated
project scaffolding, and dev-workflow skills.

**Dependencies:** none at runtime beyond pi itself — `@earendil-works/pi-coding-agent`
is an *optional* `peerDependency` (the extensions run inside pi, which is the host, not
something they install), and `package.json` declares no `dependencies` or
`devDependencies`. Where GitHub CI applies, `nana-land` also needs the GitHub CLI `gh`, signed in.
Tests are zero-dep `node packages/nana-pack/tests/*.test.mjs`; pi-dependent tests
FAIL naming the locations tried when pi is absent. The post-edit UTF-8 test FAILs, naming `python3`
and `python`, when neither is Python 3.7 or later. `DESK_PI_ROOT` points the suite at another install.

Residual: the update-path legs in `tests/templates-update.test.mjs` do not assert three brief-named outcomes directly (no drift line on a fresh render; a Part G status survives an update; deleting a project's REQUIREMENTS-general.md restores exactly the nine legacy problems); focused fixtures in the same file pin the behaviour.

## Skills

The skill-claim suite checks applicable paths; package-script commands, including runner spelling and pnpm separator use; flags on script paths; and flags plus the first subcommand of declared nana commands by source presence. It does not check prose claims, PATH links, `uv run <tool>`, `uvx copier --data` keys, `node -e`, or required-but-missing flags. Render-dependent checks skip when `uvx copier` is unavailable.

| Skill | What it does |
|---|---|
| `scaffold-py` / `scaffold-ts` | Generate a project via copier from <https://github.com/j-wanger/nana-pi> (`--data language=python\|typescript`; the repo root is the versioned template src, cloned at the latest v* tag) — uv/ruff/mypy-strict/pytest or pnpm/strict-tsconfig/Biome/Vitest, folder-by-feature, lean nested AGENTS.md, and a `.pi/nana-pack.json` post-edit preset (format+lint each edit, file-size caps 500py/300ts, typecheck). Generated projects record the template tag, re-sync via `uvx copier update`, and carry a CI `template-drift` job that goes red when a newer template tag exists. |
| `adopt-py` / `adopt-ts` | Retrofit the same stack onto an EXISTING project (template adopt mode: configs only, source tree untouched). Clean-tree overlay, reconcile from `git diff`, staged strictness with recorded ratchets (py: measured coverage floor + mypy per-module overrides; ts: `@ts-expect-error` ratchets), ends git-tracked on the same `copier update` relationship, then closes on `nana-setup project <dir> --check`. |
| `adopt-structure` | Add the agent-navigation layer to an EXISTING project of ANY language — a lean root `AGENTS.md`, per-folder `AGENTS.md`, a postEdit-only starter `.pi/nana-pack.json`, and the three frontier seeds (`OBJECTIVE.md`, `HANDOFF.md`, `docs/sessions/README.md`) copied from `templates/_shared` **only when absent**. Docs only: no language stack, no copier, no source/config/CI changes (that's `adopt-py` / `adopt-ts`). Safe on re-run (reconciles). Closes on `nana-setup project <dir> --check`. |
| `py-lint` / `py-test` | Run the ruff/mypy and pytest gates and report concisely (ported from nana-dev-kit) |
| `py-review` | 8-point AI-PR review checklist on the current diff (ported from nana-dev-kit) |
| `spec` | 9-section contract before non-trivial work, with adversarial pass + machine-checkable exit criteria (ported lean from nana-dev-kit) |
| `requirements` | Work the standing requirement set: REQUIREMENTS.md rows and the `req:` trace rail, sealed tunables, module contract headers, the code map and the README contract — plus an audit mode that extracts rows from a project that has none. `nana-setup` symlinks this same directory into `~/.claude/skills/requirements`, so pi and Claude Code read ONE source |

The Product view lists each deliverable's written maker and reader claims, marks whether code makes and reads it, and shows a named artifact's git age or why no age is available. The `runtime-map` artifact shows its recorded tip, UTC measurement time, uncommitted-file count, and commits and whole days to HEAD instead of the maker file's git age.

Ten extensions giving pi the hook coverage we require (Claude Code parity classes):

| Extension | Hook class | Events used |
|---|---|---|
| `nana-gate` | Pre-tool permission gating | `tool_call` (blocking) |
| `nana-post-edit` | Post-edit format/lint/test | `tool_result` (modifying) |
| `nana-lifecycle` | Session lifecycle observability + `/reload-runtime` | `session_start/…compact…/shutdown`, `registerCommand` |
| `nana-notify` | Outward notifications | `agent_settled`, `ui_prompt_start` |
| `nana-handoff` | Session continuity across compaction | `session_compact` (write) / `session_start` + `before_agent_start` (inject) |
| `nana-objective` | The owner's objective + current priority in every system prompt | `session_start` (all reasons) + `before_agent_start` (inject) |
| `nana-frontier-summary` | Bounded Next titles, open asks and the HANDOFF frontier check | `session_start` (all reasons) + `before_agent_start` (inject) |
| `nana-writing` | The adopted writing-for-the-owner rule, on by default; user-scope `writing.enabled: false` turns it off | `session_start` (all reasons) + `before_agent_start` (inject) |
| `nana-roster-notice` | The roster notice, shown above the editor | `session_start` (startup, new, resume, fork) |
| `nana-rulings` | Nana's standing rulings, installed into pi's agent dir, plus a project-stale section when the marker-owned working section differs | `session_start` (all reasons) + `before_agent_start` (inject) |

**Verifier-pipe guard (user-scope):** every session will prompt before running a bash or PowerShell command when a masked pipeline's exit status can reach the commit without earlier active `pipefail`. Earlier live Bash text also makes that pipeline prompt when it contains `errexit` anywhere, in any case and even inside a longer word, or contains a `set` word at any position followed within the same simple command—before the next `;`, `&`, `|`, newline or closing bracket—by an option word made of `-` and letters including `e`. A later `set +e` or `set +o errexit` never turns that text flag off, and `+o errexit` itself counts as enabling, even before a status-discarding `;` or newline. Without that earlier Bash errexit text, a `;` or a newline that discards the status does not prompt, and `git.exe` and path spellings count as git. Claude Code's hook abstains with empty stdout on non-matches and errors, leaving its normal permission flow in place; errors are diagnosed on stderr. The Claude Code hook is wired on native Windows too (Claude Code ≥ 2.1.139), with matcher `Bash|PowerShell`; its PowerShell judgments use the pipe guard's own PowerShell dialect, the same one the pi seat's `nana-gate` already uses for PowerShell. This is an additive best-effort text check: a pipeline or commit not present in the literal command text and reached through a later call is not matched; the sandbox is the boundary. Existing gate checks keep precedence; this floor cannot be exempted by `allowPatterns`. Wherever PowerShell is installed (on CI, always the Windows leg), a test compares the PowerShell dialect's comment and string spans with PowerShell's own tokenizer over generated commands. A comment glued to an operator, a redirection or a member access, and nested strings inside a string's `$( … )`, are known gaps.

## Install

```bash
pi install git:github.com/j-wanger/nana-pi       # canonical for pack-only use; with nana-setup or the desk, register the clone
pi install /path/to/nana-pi/packages/nana-pack   # local dev
pi remove ...                                     # uninstall
```

## Tests

```bash
npm test -- nana-pack     # from the repo root: every packages/nana-pack/tests/*.test.mjs
```

Zero-dep `node <file>` runs, one process each with a fresh temp `HOME`; pi-dependent tests FAIL
naming the locations tried when pi is absent. Set `DESK_PI_ROOT` to use another pi install (`DESK_PI_BIN`
selects the executable for desk tests).

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
`.pi/skills` in a project you did not approve stays ignored. Tested hosts on 2026-10-23: pi 1.0.3 and 1.4.0 (suite and install check). The skill claim that follows was verified on pi 0.84.4 and not re-run on 0.87.1 or 1.0.2: a skill
added to a trusted project's `.pi/skills` after startup goes from absent to present across one
`/reload-runtime`.

## Review runner (`bin/pi-review.mjs`)

An independent review is run by a `pi` (Codex) call, and that endpoint intermittently **stalls** —
`pi` has no request timeout, so it hangs with 0 CPU forever. `pi-review` runs the call under a
liveness watchdog: it polls the child's CPU time and, if that stays flat for `--stall-secs`, kills
the whole process group and retries with a fresh session (`--retries N` = re-attempts after the
first; default 2). On Windows the CPU read is a whole tick count, so a decimal-comma culture cannot zero it.
An unreadable sample prints `cpu=unreadable` and counts as flat, so a dead reader stops each attempt after `--stall-secs`; a pi that exits during a read ends by its own exit status.
The watchdog ends an attempt as soon as pi exits, rather than waiting for the
next poll tick, and treats a pi killed by a signal the watchdog did not send as a failed attempt
that is retried. SIGINT, SIGTERM and SIGHUP kill and reap the child tree and release a review reservation (exit 130, 143 and 129 respectively). A review is "produced" only when the child exits 0 *and* the output file is
non-empty *and* contains a case-sensitive line-start `VERDICT` word (the predicate lives
in `bin/review-shape.mjs` and is passed in by `pi-review`; the watchdog itself carries none);
exit 0 means the review is in `--out` with a non-empty recorded verdict; exit 1 means every attempt failed or the completed review recorded an empty verdict. `pi-review` passes the captured review string to completion, which parses and keeps those exact UTF-8 bytes even if `--out` later disappears or changes.

It also enforces the **review round cap** (`bin/review-round.mjs`): three rounds **per item**,
counted in a user-scope ledger — never from the output file name, and the same for every launcher.

- **Item** = `{repository, slug}`. `--item <slug>` is **required**; a call without it is refused
  loudly. The slug is canonicalized — NFKC, trimmed, lowercased (JavaScript `toLowerCase`, not Unicode case folding), internal whitespace collapsed
  (`" Scope  ONE "` ≡ `"scope one"`) — and refused if it contains `/`, `\`, `..` or a control
  character, or exceeds **128 characters**. The repository is the native real path (the folder's spelling on disk —
  case, long names, a resolved link) of the git **common dir** of the reviewed tree, so two spellings of one folder
  share the item, every worktree of one repository shares an item, while the same slug in an unrelated
  repository is a different item. If native lookup fails, the fallback uses typed spelling, so these spelling
  guarantees apply only where native lookup works. (Chosen over the remote URL: it exists for every repository,
  needs no URL normalization, and cannot be changed by `git remote set-url`. Cost: a fresh clone
  at a new path is a new scope.) `--tree <path>` selects the reviewed tree and defaults to the launcher cwd; outside git admission is refused. A scratch launcher must pass `--tree <path inside the reviewed repository>`.
- **A round is a revision.** Revision = the reviewed tree's git `HEAD`, as a full sha.
  Any number of reviews on one revision — sol and astra, ten reviewers, the same role twice — are
  **one** round: a round is one review pass over one state of the work, and a fix makes a new
  commit, hence a new round. Re-reviewing a revision earns no round (and is governed by budget,
  not by this cap). A **dirty tree** is its own state (W7c amend, 2026-10-18): the revision is the
  tree `git add -A` would record on top of HEAD, plus any dirty or new nested repository; when that
  differs from HEAD, the revision is `<HEAD sha>+snap:<full sha256 of the working-state snapshot>`.
  Derivation adds and removes nothing in the repository, never writes its real index, and runs
  none of its hooks — a throwaway index is seeded from HEAD (never a copy of the real one) and a
  throwaway object folder borrows the repo's objects through its own *objects/info/alternates*
  file (one absolute path per line; a git-internal path, not one of nana-pi's own files). Because
  that lookup re-hashes every file against a stat-less index, git may refresh (touch the mtime of,
  never resize) an object it would write that already exists in the real store; content, size and
  mode never change. Because the tree is what git itself would stage, git's own
  `core.fileMode`, `core.autocrlf`, `core.symlinks`, `.gitattributes`, clean filters and ignores
  apply, so a checkout **git itself calls clean reads clean** here too — whatever raw bytes or
  filesystem mode happen to be on disk (an `rsync`'d Windows checkout, a lost execute bit under
  `core.fileMode=false`, a CRLF checkout under `core.autocrlf=true`). A configured clean filter runs
  during derivation and may write outside the throwaway folder or behave non-deterministically; a
  non-reproducible dirty tree then refuses pi-review's checkout equality check (below), not this
  derivation. It never renders a diff, so diff/color/prefix config cannot merge two states, and
  staging does not change it: staged and unstaged of one content are **one** revision (so `git add`
  alone earns no round, and so does `git rm --cached` of content still checked out unchanged),
  while a new untracked, non-ignored file or directory is a new state. Reverting to an
  already-reviewed state earns no round. Ledger lines carry both parts as `head` and `snapshot`
  (`snapshot: null` when clean). **Any git failure refuses admission** with git's error — it is
  never read as "clean". `--revision` is only a fallback when the reviewed git tree has no HEAD; otherwise it must resolve to HEAD's commit or it is refused. `--role` is audit metadata only.
- **A completed review earns the round, including one whose recorded verdict is empty — with one exception.** A stall, an infrastructure failure
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
  - `review-ledger.rounds.jsonl` — **the tally**, permanent, never rotated: version-1 legacy records remain readable, and every newly completed verdict appends one version-2 record with `ts`, `kind:"round"`, `repo`, `item`, `revision`, `head`, `snapshot`, `role`, and launcher metadata. Repeated verdicts on one revision remain one round for the cap.
    Optional fields include `override` (the admission reason), `unverified` (tree drift at completion), `completedAs` (the observed later revision), and `completedError` (why that revision could not be derived). Legacy `path:` repository keys remain readable but new admissions require a git tree. The cap reads only this and the live reservations. A malformed line **refuses** admission
    with `file:line` — a corrupted record never grants a free review.
  - **review-ledger.texts/** — the captured UTF-8 review texts, named by their full sha256 with a `.md` extension. Completion hashes and stores the launcher's captured string before either ledger line, then adds `text: { sha256, bytes }` to the tally. It does not re-read `--out`; missing or changed output files cannot change the recorded verdict. The folder is permanent and unbounded, like the tally.
  - `review-ledger.jsonl` — the verbose audit log (every verdict and override). Before **every**
    append (a verdict, or an override at admission — including one whose review then fails), a log
    past 1 MiB is renamed to `.jsonl.1`, replacing the previous one, so the audit is bounded at about
    2 MiB. Rotation never touches the tally, so it cannot reset a cap.
  - **Storage is NOT bounded overall.** The tally grows by one line per completed verdict, forever, and is read in full at every admission. Only the audit is bounded. Removing tally lines removes verdict evidence used by the land check; do not prune them casually (see Trust model).
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

**The review standard.** Before admission, `pi-review` and `claude-review` read `prompts/review-standard.md` and refuse —
exit 1, no reservation and no reviewer child — when the file is missing, not a regular file, or blank
after trimming. `pi-review` appends its text once after the immutable-checkout sentence. `claude-review`
puts its text once between the brief and its reviewer sentence. A review brief therefore states only
the threat model and lane class and never repeats the bar. `review-ledger run` wraps any other launcher
command as given and does **not** inject this text; a hand-rolled review brief must paste it itself.

### Claude Code reviewer (`bin/claude-review.mjs`)

When the roster's `reviewer` slot is a Claude Code entry, run its review through the pack from any seat:

```bash
scratch=$(mktemp -d)
node "$HOME/nana-pi/packages/nana-pack/bin/claude-review.mjs" --item <slug> --tree <worktree> --brief <file-relative-to-tree> --out "$scratch/claude-r1.md" [--role R] [--over-cap WHY]
```

The launcher requires `--item`, `--tree`, `--brief` and `--out`; it resolves the brief against the
reviewed tree and passes the output path through unchanged. It reads the reviewer model from the
machine roster, sends the brief, shared review standard and read-only reviewer sentence on standard
input, then runs `claude -p --model <model> --allowedTools Read,Grep,Glob,Bash --disallowedTools Edit,Write,NotebookEdit`
through `review-ledger run`. It exits with the ledger's status. A pi reviewer entry is refused before
admission and must use `pi-review`; there is no fallback model. Set the Claude Code reviewer from a
terminal or Claude Code shell, not a pi model shell:

```bash
node "$HOME/nana-pi/packages/nana-pack/bin/nana-roster.mjs" set reviewer claude-code opus
```

Known limits: the reviewer uses the live tree, not an immutable checkout, so a reviewer or concurrent
builder edit makes the verdict unverified and consumes the round. It has no liveness watchdog, launcher
retry or retry beyond Claude Code's own request retries; a hung `claude` hangs the launcher. The ledger
records the alias such as `opus`, not the resolved model id, and records a null provider. The launcher
is not on PATH and has no doctor line, so every platform starts it through Node. Read-only is an
instruction rather than enforcement because Bash is allowed, and `claude -p` loads user rules, hooks
and memory. Only the reviewer slot is supported; a Claude land model or second-opinion slot needs a
separate launcher. On Windows the allowed tool list has no PowerShell. A logged-out `claude` exits 1
and the ledger returns the reservation. A killed launcher can leave `claude` running and a dead-pid
reservation, which the next admission prunes. Claude print mode supplies only its final assistant turn,
so a verdict written before a last tool call may be absent from the output.

**Any other launcher** (e.g. a hand-rolled `claude -p … > "$scratch/out.md"`) prefixes the same check —
`bin/review-ledger.mjs run` reserves the round, runs the command with stdout → `--out`, and records the verdict only if it exits 0 with a review-shaped output. It keeps and parses the stdout string it captured, rather than reading `--out` back. It starts the command with `NANA_ROLE=reviewer` and `NANA_HANDOFF=off`, as `pi-review` does, and starts a first word `pi` the way `pi-review` starts pi. If the command cannot start, stderr and `--out` begin `cannot start <command>: <reason>`, and no reservation or round remains. A recorded empty verdict keeps the output and consumed round, prints why `nana-land` will refuse it, and exits 1; a non-empty verdict retains the verdict-recorded line and exit 0. The reviewed tree defaults to the launcher cwd; pass `--tree <path>` when launching from scratch:

```bash
scratch=$(mktemp -d)
node ~/nana-pi/packages/nana-pack/bin/review-ledger.mjs run --item <slug> --role opus --out "$scratch/out.md" -- claude -p --model <model> "$(cat brief.md)"
```

On Windows, a `.cmd` reviewer such as npm-installed claude or codex starts through cmd.exe. Cmd.exe cannot carry `"`, `%`, `!`, a line break or a trailing backslash in an argument, and caps its line at 8191 characters. Give such a reviewer its brief on stdin from Command Prompt or Git Bash:

```bat
set "scratch=%TEMP%\nana-review-%RANDOM%"
mkdir "%scratch%"
node packages/nana-pack/bin/review-ledger.mjs run --item <slug> --out "%scratch%\out.md" -- claude -p --model <model> < brief.md
```

`review-ledger check --item <slug> [--tree <path>]` answers "would a review of this tree's revision be admitted?"
(exit 0/1): it takes the lock and writes nothing — no reservation, no pruning.

`review-ledger report [--item <slug>] [--repo <path>]` prints one read-only line per recorded verdict:
item, short revision, role, model, duration, attempts, verdict and over-cap reason. Provider/model and
launch/end timestamps are recorded in the tally; old rows show `-` where fields are unavailable.

`review-ledger keep --item <slug> --into <dir> [--repo <path>]` copies every available kept text for that item and repository into the lane folder as `r<round>-<role>-<sha8>.md`. It leaves an equal existing file unchanged. It checks every destination before writing and refuses the whole command when any same-named file differs. An item with no kept text exits 1. Run it with each fix commit and once before the final review round, never while a review of that worktree is live.

`node bin/review-timeline.mjs --item <slug> [--repo <path>]` prints one lane's review timeline as
markdown: every round the ledger recorded for that item in the selected repository (the current
folder by default), in ledger order, each review with its short revision, role, model, verdict and
duration. It reads each new round's hash-addressed kept text from the tally and store, falling back
for old rounds to the audit log plus its one rotated generation and the output path recorded there; it
writes nothing. Under a sent-back review whose recorded file's last `VERDICT:` line still reads
`SEND-BACK`, it lists that file's MUST findings by title — a heading reading `MUST — <title>`; a bare
`MUST` heading or `**MUST**` line opening a section whose findings are every sibling of the first
item form seen in it (a deeper heading, a numbered item, a bullet, or a bold-led paragraph whose bold
text is not a label ending in `:`); or a line that, after an optional list marker and emphasis marks,
starts with `MUST —`. No SHOULD or NOTE item is ever listed. A sent-back review with no recorded file,
a gone file, a disagreeing last verdict, or no readable MUST states which of those holds instead of
findings. An unverified, over-cap, no-verdict or older (version 1) review line is marked rather than
guessed. Every field collapses whitespace to one space, and every review file is named by its file
name alone — never an absolute path. Known limits: a relative recorded path, a rotated-away audit
generation, or an older tally line with no end time reads as no file recorded; a review file moved or
deleted after its run reads as gone; the timeline searches no folder but the one the ledger recorded,
so run it while that folder still exists (the seat runs it at land, from the session that ran the
reviews); a MUST layout outside the five above may read as unreadable or list a detail line; markdown
only, no diagram.

### Land helper: `bin/nana-land.mjs`

`nana-land merge --tree <integration-worktree> --main <main-checkout> --suite "<command>" --reviewed <sha>=<item> [--reviewed <sha>=<item> ...]` accepts only those four options; there are no exemptions. Keep a clean source tree and a clean tracked state in the checkout on `main`; both checkouts must share one Git repository. Every commit the merge adds must be covered by a named reviewed revision, and each named revision needs a verified `LAND` review at version 2 for its canonical item and SHA. At least one matching LAND record must predate kept texts or name a kept text that still exists with its recorded hash and byte count. Missing, altered and malformed matching texts are notes when another record holds; when none holds, the helper refuses and tells the seat to re-run that item on the same revision. Any verified non-LAND verdict for a named commit or snapshot refuses the merge, even under another item; an in-flight review also refuses. Where `origin` is on github.com and the tip tracks a workflow under `.github/workflows`, the helper refuses until the newest CI run of each workflow for the tip has passed at its latest attempt. It refuses before the suite when `gh` cannot read the runs, a run is absent or unfinished, or a newest run did not succeed. A successful land prints one `ci:` line per workflow; elsewhere one land note says why CI was not read. The helper runs the suite in the source tree with `NANA_LAND_TIP` set to the source tip's full SHA. Off Windows, the locked suite measures the runtime map; on Windows, it runs once without measuring and prints a land note. After a passing suite it also writes the product report for the tip and prints a land note naming the page. Lines the suite prints with the `[nana-land]` land-note prefix appear in success output too. Immediately before merging it rechecks both checkouts, the kept texts and main's captured HEAD under the ledger lock. It notes each earlier kept text for a reviewed item whose Git blob is absent from the tip, and its success report names every kept text used to authorize the land. It performs one `git merge --ff-only`, verifies containment, and requires the main ref equal to the tip with clean tracked state before success. Do not operate the main checkout during a land: a branch switch in the instant between the final check and merge is not defended, but a detected switch prevents success and the helper refuses afterwards without success records. Git refuses an untracked collision with a landed path. The helper never pushes or writes HANDOFF/session archive text. A legacy version-1 LAND does not authorize a land; every pre-change revision needs a fresh review. On success the helper prints the push command and release status. After a successful merge it prints the shared local `releaseStatus` result, which exports `selectReleaseTag` and `countTemplateCommits`, reports main against origin/main as of the last fetch, never fetches, and never runs `git tag` because its named form creates a tag.

`nana-land cleanup <lane> --main <main-checkout>` is a separate operation: it requires the checkout on `main`, then removes only a clean worktree whose `feat/<lane>` branch is contained in `main`, without force. Run through `nana-setup install` to link `nana-land` on PATH; `nana-setup doctor` reports whether the link is valid. The main checkout may have untracked files, but git can still refuse a colliding fast-forward.

**Limits to plan for:** an item in flight on a Windows seat whose key came from a short or wrongly cased main checkout restarts its round count once (W7c closed the key itself; a round already recorded under the old key still needs a re-review under the new one). A firmlink-typed `--out` on macOS (`/System/Volumes/Data/...`) stays as today. Deploy with no land, review, or worker process running. While a land holds the ledger lock, another review that waits past the 15-second limit is refused at admission or its completed verdict goes unrecorded; keep its output and re-run it. A new commit—including an amend, rebase result, or empty commit—starts with a clean verdict record and needs its own review. A narrow review counts as a LAND for the whole ancestry up to its revision. A direct commit to `main` bypasses this helper; the working pattern forbids direct commits to `main`. A review's verdict comes from the final non-blank line when its canonical form contains a bounded `verdict:` label; otherwise it may come from the first non-blank line, but only when that raw line is plain VERDICT: WORD with an optional whole-number score such as (9/10), — 9/10 or 9/10, and an optional final period. Before detection, the parser removes one leading byte-order mark, removes Unicode default-ignorables, folds selected visual look-alikes, applies NFKC, repeats the removal and fold, then lower-cases. A selected final line may use the familiar leading marks and trailing punctuation; its raw text must still match the final-line grammar. A plain first-line verdict is refused if any other non-blank line mentions “verdict”; when the final line is selected, only the first line is checked for a conflicting verdict; a verdict in the middle is not read, so `notes`, `VERDICT: SEND-BACK`, `VERDICT: LAND` records LAND. A first-line verdict-like label must be valid and carry the same word. Thus VERDICT: LAND 9/10 followed by notes records LAND, but a quoted or marked first line, a later correction, a disguised conflicting label, or a malformed selected line records an empty verdict. A first-line verdict followed by a correction that avoids the word “verdict” can still be read as LAND; middle-only verdicts, misspelled labels, and look-alikes outside the configured table are not detected. Unicode default-ignorable handling follows the running Node version's Unicode tables. An empty verdict stays on the revision and refuses it for good; both launchers print one escaped diagnostic line and exit 1 after consuming the round, so the fix is a new commit and a fresh review, not a re-run. The diagnostic line has no length cap.

### Workers: `bin/pi-worker.mjs`

A **worker** (a build agent, not a review) runs under the same watchdog through `pi-worker`,
which records no review round and can admit no verdict. `pi-review` has no
worker mode — `--worker` was removed, because a caller-controlled exemption on the review command
was itself the bypass (sol r1: five `VERDICT: LAND` outputs under `--worker`, zero recorded).
`pi-worker` refuses review options (`--item`, `--role`, `--revision`, `--over-cap`, `--worker`) in either mode, before it reads a brief, the roster or Claude settings, or writes a temporary file. A worker succeeds when `pi` exits 0 with non-empty output; no review shape is required. Every worker child gets `NANA_ROLE=worker`, so the knowledge pull prints and logs nothing for it; `nana-knowledge query` still answers.

**A worker is not retried by default** (`--retries 0`). **Retrying a worker can repeat file
mutations**: a stalled or failed attempt may already have edited, written or run commands, and a
re-attempt does it all again on top. Opt in with `--retries N` only for an idempotent task; the
launcher prints a warning when you do.

```bash
scratch=$(mktemp -d)
pi-worker --out "$scratch/wp-a-out.md" --stall-secs 300 --poll 20 -- --provider openai-codex --model gpt-5.6-sol -t read,grep,find,bash,edit,write …
```

#### Lane builder

Use `pi-worker --lane <name> --brief <file> --out <file> [--max-secs N] [--stall-secs N] [--poll N] [--lane-size <small|larger>]` with no `--` or pi arguments. Lane mode requires cwd to be the real repository root of a linked worktree on exactly `feat/<name>`; the brief must be a readable regular file. Its first Precedent section starts at a Precedent heading with no word after the name, or a line holding only `Precedent:`, plain or bold; a plain label's list ends at a blank line, heading, non-list line, or other marker kind at the first entry's indentation. The section must list at least one worktree-root-relative path tracked at that worktree's HEAD, or `none:` with a reason; invalid or unlisted paths refuse the launch before the lock. It refuses the main checkout, a nested cwd, detached or switched branches, invalid inputs, a roster the roster resolver refuses, a launch with no `--lane-size` once the roster sets `largerBuilder`, and every caller pi argument before acquiring the lock or starting a builder. It resolves this machine's roster (see Machine roster below): `--lane-size larger` starts the roster's larger-lane builder, pi or Claude Code, falling back to the builder when that slot is null; `--lane-size small`, or no size while `largerBuilder` is null, starts the pi builder.

For a pi entry, lane mode builds the complete pi argv itself with the entry's provider and model, `--thinking` when set, tools `read,grep,find,bash,edit,write`, the rendered `prompts/builder-preamble.md` path, the validated brief path, and a fixed instruction naming the lane. For a Claude Code entry it starts `claude -p` with `--model <model> --permission-mode default --setting-sources project,local --settings <temporary-settings-file> --strict-mcp-config --tools Read,Grep,Glob,Bash,Edit,Write --allowedTools Read,Grep,Glob,Bash,Edit,Write --append-system-prompt-file <temporary-prompt-file>` followed by that instruction. The prompt file, outside the worktree, contains the rendered preamble, the brief and then any feature-named known-bug file; the unplaced file is never a fallback. The same temporary folder and `finally` cleanup cover the preamble, prompt, settings and captured-output files. After the builder and precedent lines, lane mode performs its trust check, reads Claude settings when needed, and reads the build-start HEAD before installing its start-up signal listeners or creating the temporary folder. A refusal or handled signal after that folder exists removes it too. Immediately after creating that folder, pi-worker starts a detached watcher through a one-shot hop. When a hard stop takes pi-worker, the watcher removes the lane folder, completes the build record as `stopped`, and releases only its worker's lock after no recorded builder may still run. Off Windows it first checks that a live recorded builder started no later than the pid record, then ends that builder's process group; an unreadable or later start keeps the lock and signals nothing. On Windows it ends no process, and a builder launched through `cmd.exe` keeps the lock even after that recorded command process ends. A stop before the hop starts can still leave the newly created empty folder.

The Claude settings file carries from the user settings only `apiKeyHelper`, `awsCredentialExport`, `proxyAuthHelper` and the sealed network/login env allowlist, then writes the builder env last. Its source is `settings.json` under a non-empty `CLAUDE_CONFIG_DIR`, otherwise `~/.claude/settings.json`. Before the attempt, one `pi-worker: claude settings carry:` line names carried keys and env names, never values, or names a safe read/shape failure; the builder still starts with sealed env on such a failure. Flag settings beat global, project, local and ordinary process env, except inherited values under Claude's desktop-host entry point; managed policy still wins. The child process and settings file both hold `NANA_ROLE=worker`, `NANA_WORKTREE_ROOT`, `NANA_HANDOFF=off`, `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` and one-hour Bash default and maximum limits. Claude Code builds disable the flat-CPU stall stop, so `--stall-secs` has no effect on them; the wall-clock ceiling and signals still stop the process group.

Before starting either runtime, lane mode prints the checked entry count, HEAD sha and attached known-bug path or `none`. It also prints one builder line with the roster's source and the entry's runtime tokens: pi's provider, model and thinking, or `claude-code <model>`. The line uses `builder (larger lanes):` when the set larger slot runs and plain `builder:` for a fallback. Sealed values live in `bin/worker-config.mjs`; changing one requires a requirements diff. Caller overrides are unsupported. The usual non-lane worker invocation is unchanged and reads no roster.

To check a brief without starting a builder or taking the lane lock:

```bash
node "$HOME/nana-pi/packages/nana-pack/bin/brief-check.mjs" --brief <file> --tree <worktree>
```

`brief-check` calls the same precedent and known-bug check as `pi-worker`. A relative `--brief` resolves from `--tree`; when it cannot read that brief, its `brief-check:` line names the absolute path it tried. It prints the same `pi-worker: lane refused: …` line and exits 1 on refusal, or the same `pi-worker: precedent: …; known bugs: …` launch line and exits 0 on success. It starts no builder.

Lane launches set `NANA_WORKTREE_ROOT` and `NANA_ROLE=worker`; a Claude Code launch also sets the sealed child values described above. The gate refuses edit/write targets outside that root and the temporary roots it counts: the real `os.tmpdir()`, and on Windows a differing `TMP` too — except a temp folder that resolves to a drive or filesystem root, the home folder, or a folder above the home folder, which does not count. `/tmp` is a separate rule on every system but Windows: it counts as a temporary root regardless, even when it resolves under the home folder. Each target is judged at the path pi's own edit/write tools actually write it to — pi's `~`, `@` and `file://` forms are expanded first — and every root and target is compared by its true on-disk spelling (case, 8.3 short names, and symlinks all fold to the same real path), not by the literal string typed. This does not cover writes performed by bash or another process. The gate is advisory; the sandbox/container is the boundary.

Lane mode holds an exclusive-create pid lock file for the worker lifetime. Any existing lock refuses the launch, naming its path and recorded pid when readable; a later launch never reclaims it automatically. The hard-stop watcher releases only a lock that still names its pi-worker and only after the recorded builder group is gone; on Windows it keeps the lock for a builder launched through `cmd.exe`. A builder's tool command in its own process group can still outlive that builder group. Before removing a lock by hand, confirm that no builder process group or tool process for that worktree is running. The lane wall-clock ceiling is **28,800 seconds (8 hours)**; `--max-secs N` overrides it for one launch. The ceiling kills the entire builder process group and reports FAILED. If no affirmative trust record covers the worktree, the launcher prints `trust: none for <worktree> — project post-edit checks are inert (nana-setup trust <dir>)` and continues; project post-edit commands are inert until pi trusts the directory. After taking the lock, a lane build appends a start record before the builder starts and an end record before releasing the lock on each handled exit. Its final stderr line gives this build's outcome, elapsed minutes and recorded cost, followed by the lane summary.

#### Build records

Lane builds share `<git common folder>/nana/build-records.jsonl` across one clone. Each schema-1 JSON line is a `start` or `end` record joined by its build id. A hard stop the detached watcher observes gets a `stopped` end with exit `-`, a null signal and matched session usage. An unpaired start is reported as `no end` and now means a build still running, an exception, or a hard stop the watcher did not observe. A Claude Code start records provider `claude-code`, its model and null thinking. Tokens and cost are field-wise sums of pi-ai Usage values in matching pi sessions, not recalculations from token buckets, so a Claude Code build's cost is unknown. Missing, unreadable or over-cap sessions leave the cost unknown and name the session folder. Record-write failures are report-only and do not stop the builder or change its result.

Read the clone's builds from any checkout with `node "$HOME/nana-pi/packages/nana-pack/bin/build-report.mjs" [--repo <path>] [--lane <name>]`. The report prints each build, lane totals, clone totals, unpriced builds and skipped ledger lines. Records are per clone, have no retention, and cover lane-mode pi and Claude Code builders only. A stall is `failed`; `no end` does not distinguish a live build, an exception or an unobserved hard stop. The cost is pi's model-catalog figure rather than a subscription bill. A custom pi `sessionDir` setting is not followed unless `PI_CODING_AGENT_SESSION_DIR` selects it.

#### Machine roster

A machine's roster lives in a `roster` block in the user-scope `nana-pack.json`, in pi's active agent dir (`PI_CODING_AGENT_DIR`, else `~/.pi/agent`) — the same scope as `objective`; nothing seeds it. Print this machine's roster with `node "$HOME/nana-pi/packages/nana-pack/bin/nana-roster.mjs"`, which prints one line per slot — `scout`, `builder`, `largerBuilder` (the builder for larger or riskier lanes), `reviewer`, `land`, in that order, `<provider> <model> <thinking>` for a pi entry (`default` for a null thinking) or `claude-code <model>` for a Claude Code entry, `none` for a null scout or `largerBuilder`, and `seat` for a null land — then a `source:` line naming `default` or the file, and exits 0; a malformed roster instead prints the resolver's refusal on stderr and exits 1. With no roster set, the roster is the sealed default: no scout, no `largerBuilder`; the builder above; reviewer `openai-codex gpt-5.6-sol`; land `openai-codex gpt-6-astra`; the last two with pi's default thinking.

A roster replaces every slot, whole — there is no merge and no fallback to the default on a per-field basis. `scout` and `land` may be `null` (no pi scout; the seat writes the land review itself, printed as `seat`); `builder` is a required pi entry holding `provider`, `model` and a `thinking` that is one of pi's seven levels or `null`. `reviewer` is required and holds either a pi entry of that shape or a Claude Code entry. `largerBuilder` is optional (an absent slot reads as `null`) and holds a pi entry, a Claude Code entry or `null`. A Claude Code entry has `runtime` `claude-code` plus a `model` that is one of `sonnet`, `opus`, `haiku`, `fable` — never a full model name or a bracketed variant. `pi-worker` passes a Claude Code larger builder's model to `claude --model`; the reviewer launcher does the same for a Claude Code reviewer. Each pi entry's `provider` and `model` must be non-empty with no whitespace or control character. A roster in a project's `.pi/nana-pack.json` is never read. The file is read bounded (1 MiB) with one leading byte-order mark stripped, including marked UTF-16LE or UTF-16BE; a malformed shape, an unreadable file or one over the cap is refused, naming the file and the failing slot or field. A JSON syntax error in this file also stops pi's gate at its next start: it blocks every gated tool until the file parses again.

```json
{"roster":{"scout":{"provider":"example-gateway","model":"gpt-6-luna","thinking":"medium"},"builder":{"provider":"example-gateway","model":"gpt-6-luna","thinking":"high"},"largerBuilder":{"runtime":"claude-code","model":"sonnet"},"reviewer":{"provider":"example-gateway","model":"gpt-5.6-sol","thinking":null},"land":null}}
```

A seat passes a pi reviewer or land entry to `pi-review` itself, as `pi-review … -- --provider <provider> --model <model> [--thinking <thinking>]`; `pi-review` reads no roster and prints no builder line. For a Claude Code reviewer entry, `claude-review` reads the roster and passes its model to `claude --model`. `pi-worker`'s lane mode reads `--lane-size <small|larger>` to pick `builder` or `largerBuilder`, and passes a Claude Code larger builder's model to `claude --model` — see Lane builder above.

To change one slot without hand-editing the whole file, run `node "$HOME/nana-pi/packages/nana-pack/bin/nana-roster.mjs" set <slot>[:] <tokens>`, pasting the slot and the tokens a plain run of the command above prints for the entry you want — `set builder example-gateway gpt-6-luna high`, `set largerBuilder claude-code sonnet`, `set reviewer claude-code opus`, `set land seat`, `set scout none`; a printed line's own trailing colon on the slot is accepted. It writes only that slot, prints the resulting roster the same way a plain run does, and writes `nana-roster: <slot> was: <previous tokens>` to stderr. It keeps every other top-level member (`objective`, `gate`, `postEdit` and an unrecognised key included) and, before replacing an existing file, copies its previous bytes to `nana-pack.json.bak` in the agent dir — copy that file back over `nana-pack.json` to undo a `set`. `set` must be the first argument: `nana-roster --json set …` prints the roster and sets nothing, and only one `.bak` is kept (the next `set`, or an edit by the desk, replaces it).

`set` refuses, naming what is wrong, and changes no byte, in three cases: run inside a pi model shell (pi sets `PI_SESSION_ID` there for its own bash and powershell tool calls; a terminal, pi's `!`, and a Claude Code shell are all fine); malformed `set` input (no slot, an unknown slot, or tokens that do not form a valid entry for that slot); and a `nana-pack.json` the roster resolver itself refuses (invalid JSON, a directory, over the 1 MiB cap, and the like) — the path is left exactly as it was, never replaced with the default roster.

Known limits: no lock, so a writer racing `set` (the desk, the installer, an editor) loses its write; the file is always rewritten as UTF-8 and re-serialized (two-space JSON, LF, BOM dropped, duplicate keys collapsed to the last) with values unchanged, while `nana-pack.json.bak` keeps the original bytes; a file with no roster gets the whole sealed default written into it, so a later change to that default stops reaching this machine until the `.bak` is copied back; the pi-model-shell guard is advisory — a model that unsets `PI_SESSION_ID`, an MCP or SDK shell that never sets it, and pi older than 0.82.0 all pass it, the same scope as the gate; and a relative `PI_CODING_AGENT_DIR` writes under the current folder exactly as a plain run reads it, with a missing agent dir refused and nothing created.

#### Windows

`nana-setup install` writes `pi-worker` and `pi-review` sh and `.cmd` shims into `~/.local/bin`; that folder must be on the user Path. The node forms remain a fallback when it is not. On win32 both launchers start pi through its own npm Node entry, not by name: a `.cmd`/`.bat` npm shim runs as the Node process already running it, plus the npm package's `pi` bin entry found beside the shim (the global layout) or one level up through `node_modules\.bin` (the local layout), with the pi arguments unchanged after it; a located `.exe`/`.com` pi starts directly. A pnpm global install, Volta and the pi.dev managed installer are refused, named — only an npm-installed pi is supported. Arguments reach pi unchanged, a multi-line brief included. From PowerShell, pass a brief as a quoted `"@<full path>"` argument, which pi reads itself: PowerShell's own `"$(Get-Content …)"` joins a multi-line file's lines with spaces and Windows PowerShell 5.1 drops embedded quotes. `review-ledger run` sends any bare spelling of pi through that pi launch, finds another bare reviewer through Path and PATHEXT, starts a found `.cmd` or `.bat` through cmd.exe and a found `.exe` or `.com` directly, and takes a command containing `\`, `/` or `:` as a path. A relative path is read from the reviewed tree, and a `.cmd` or `.bat` path that names no file there is refused with the cannot-start line before cmd.exe starts.

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
write it can exhaust an item (three fabricated round lines) or extend one (delete lines); deleting
verdict records also changes what the land check reads. Pruning the kept-text store blocks a revision
when every matching LAND text is gone until those reviews re-run on that revision. Anyone can run a launcher by hand and never
touch it. `NANA_ROLE=reviewer` is a context-isolation convenience, not a security boundary: a worker
or user can spoof or clear it. What the ledger buys is that every completed verdict and override is
recorded — a bypass must be explicit. The land helper checks every recorded verdict but does not
prove reviewer independence or review scope; those remain conventions. Not every admission is: an ordinary
(non-override) admission whose review fails leaves **no durable record** once its reservation is
returned. During deployment, stop all old land and review processes: an already-loaded old completion
can append only to the audit log before the first version-2 row exists. **Budget is not enforced here:** these wrappers do not read, pass or enforce
`--max-budget-usd` (or any spend limit); budget control is external — the caller's own flags and
the provider's limits. **Repair:** to reset an item, remove its
lines from `review-ledger.rounds.jsonl` only with the understanding that this erases the verdict history
used by the land check (and clear stale files under `review-ledger.reservations/`);
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
Tests: `tests/review-round.test.mjs` (rules), `tests/review-ledger.test.mjs` (processes), `tests/review-launch.test.mjs` (command launch).

## Session-start frontier summary

The `nana-frontier-summary` extension and the existing Claude Code objective hook read
`HANDOFF.md` from the repository root at every session start. Outside a repository, they read
it from the session folder. The bounded block quotes only top-level titles from the first Next
section and Open for the owner asks with their tag or no-tag label. The report-only frontier
check summary follows those titles.
Blocking asks get selection priority, while displayed groups keep Next first and then blocking,
optional, parked and untagged asks.

The block holds at most 4,000 characters and each displayed title holds at most 160 characters.
The Claude objective and frontier producers share a 9,000-character output budget, leaving the
objective whole before fitting the frontier. A missing file is silent. Reviewer and worker
launcher roles receive no frontier block. Other unusable files produce one bounded unavailable
line. There is no user or project switch, and a symlinked `HANDOFF.md` is followed.

Run the producer directly with:

```bash
node packages/nana-pack/bin/nana-frontier-summary.mjs --cwd <dir>
```

## HANDOFF frontier checker (`bin/nana-frontier.mjs`)

This report-only CLI checks a HANDOFF document's 1,200-word budget and frontier structure: multi-line entries beneath Landed headings, landed markers in Next or Open for the owner, unresolved numbered references, overdue explicit dates, and missing Open for the owner tags. It also checks the document's size against one default read (51,200 bytes or 2,000 lines: pi 1.0.2's read tool limits, the smaller of the two seats' limits), and reports a Where things stand, Next or Open for the owner section placed after a Landed or Carried residuals heading or ending past that read.

```bash
node packages/nana-pack/bin/nana-frontier.mjs HANDOFF.md
node packages/nana-pack/bin/nana-frontier.mjs --today 2026-10-06 HANDOFF.md
node packages/nana-pack/bin/nana-frontier.mjs --strict HANDOFF.md
```

It prints `file:line: kind: detail` findings and a summary. The default clock uses the current UTC date; `--today` injects a deterministic `YYYY-MM-DD` date. Findings do not change the default exit status; `--strict` exits nonzero when findings exist. A blank line ends a list entry, so a later indented paragraph is not joined to it. Tests: `packages/nana-pack/tests/frontier.test.mjs`.

## Writing checker (`bin/nana-writing.mjs`) — adopted, report-only

Zero-dep, Node only, cross-platform; the pure checks live in
`lib/writing-check.mjs`, every tunable in `lib/writing-config.mjs` (spec:
`docs/reviews/writing-trial-2026-10-04/design-ruling.md` and its Amendment 1). The rule it is
named by, `rules/nana-writing.md`, reaches pi through the `nana-writing` extension above (an
append, not a context-file link — Amendment 1 §A1, after astra r1 found a link could both hide
a user's own `AGENTS.md`/`CLAUDE.md` and be hidden by one). After `nana-setup install`, the
checker is on PATH as `nana-writing`. The rule requires this pre-send run for every report,
but reports stay report-only. The suite fails on an over-cap sentence or banned word in
nana-pi's own `HANDOFF.md` live sections.

```bash
nana-writing file.md
nana-writing --report < draft.txt
```

Known limits: the pre-send report run remains an instruction; nothing verifies that a seat ran
it. The user-scope `writing.enabled` key reaches pi only; Claude Code keeps its linked rule.
Windows PowerShell 5.1 pipes non-ASCII input as `?`, so pass a file there. The frozen desk
refuses to save a `nana-pack.json` that contains `writing`.

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

**Completed trial tally.** During the trial, the seat ran one invocation per report sent
(`--report`) and a separate one per `HANDOFF.md` edit (no `--report` — verdict and identifiers
did not apply there). It recorded the day's counts in
`docs/reviews/writing-trial-2026-10-04/tally.md` in two columns, never mixed (astra r2 SHOULD 3):
reports checked, verdict passes, report sentences/over-cap, HANDOFF sentences/over-cap, and any
lost-detail complaint. The trial stopped at day 14 or 20 reports (HANDOFF did not count toward
this), whichever came first, or after two lost-detail complaints.

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

## Seat mutation runner (`lib/mutation-runner.mjs`)

A lane's seat acceptance runs its "wrong code first" pair table through this shared runner
instead of each lane copying its own: `lib/mutation-runner.mjs` applies the table's pairs in
scratch git worktrees of the lane's tip, splits them across shard processes, and writes one
judged record. `lib/mutation-runner-config.mjs` holds every tunable and contract value the
runner reads by name.

A lane table is a small script at `docs/reviews/<lane>-<date>/seat-mutate.mjs`: constants,
titles, a pair array, and one call.

```js
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";
process.exitCode = await runMutations({
  lane: "<lane>", self: import.meta.url, tip: "<commit>",
  pairs: [{ n: "1", name: "<what the edit breaks>", edits: [{ file: "<path>", anchor: "<text>", replacement: "<text>", times: 1 }], tests: ["<path>"], expectRed: ["<title>"] }],
});
```

```bash
SEAT_MUTATE_OUT=<file> [SEAT_MUTATE_TIP=<rev>] [SEAT_MUTATE_DRY=1] [SEAT_MUTATE_SHARDS=<n>] \
  [SEAT_MUTATE_STAGGER_SECS=<s>] [SEAT_MUTATE_LOGDIR=<dir>] [SEAT_MUTATE_KEEP=1] \
  node docs/reviews/<lane>-<date>/seat-mutate.mjs [pair-id ...]
```

Pairs deal round-robin across `SEAT_MUTATE_SHARDS` shards (five by default), each shard
staggered `SEAT_MUTATE_STAGGER_SECS` after the one before it, and the record is the landed line
words: `seat-mutate: lane …`, `DECLARED`, `[k/N]` notes, `BASELINE ok`/`FAIL`/`RETRY`/`MISSING`,
`RED`, `GREEN … SURVIVED`, `ANCHOR-MISS`, `SYNTAX`, `DRY ok`, `MISSING`, `RESULT`,
`RESULT (DRY)`, `seat-mutate: KEEP`, and `seat-mutate: git worktree entry … is still listed after … retries`. Exit 0 means the run completed; its RESULT line counts the survivors. It exits 2 when a pair is missing,
a shard fails, the run is interrupted, or an input is refused, and 3 when any pair is ANCHOR-MISS
(a bad anchor, a missing or escaping edit file) or SYNTAX (a mutated `.mjs`, `.js` or `.ts` file
that fails to parse).

With `SEAT_MUTATE_OUT` set, the runner takes an exclusive lock at `<record>.lock` before any
worktree: a second run on the same record file refuses, naming the lock's holder; a lock whose
process no longer runs is reported and replaced.

A table's `config` may name only the overridable tunables — `SHARDS_DEFAULT`,
`STAGGER_SECS_DEFAULT`, `FILE_TIMEOUT_MS`, `BASELINE_RETRIES`, `NPM_COMMAND` — merged over the
config module; every other key is refused by name before any worktree.

**Limits.** Never split a long mutation run while a full suite runs on the same machine (the
seat guide's rule). A parent killed outright writes no record, leaves its shards to end on
their own, and leaves its lock for the next run on that record to replace. On Windows a stop
ends each shard outright rather than delivering a signal it can catch, and npm's config values
are not read there. Shards share one operation lock, so a scratch-worktree add never overlaps
another shard's complete removal and its retries. Only one waiter at a time removes a dead shard's
lock. A waiter killed while removing one, plus a later dead shard, can still let two waiters in.
After a scratch-worktree removal fails, the runner
checks whether its entry is still listed, waits, deletes the scratch folder, and retries the removal by the unique
`<scratch folder base name>/wt` suffix. It never runs `git worktree prune`, because pruning can
remove entries the runner did not create. A locked scratch entry therefore stays listed after
the retries and the record names it. A table names a check's longer title when a shorter named
title begins it, since a PASS or FAIL line matching the shorter one would otherwise read as that
title too. A lane that needs a feature this runner does not have — stay-green pairs, case labels,
skip reasons, script or pattern edits — keeps its own local runner.

## What you will see

In TUI and RPC sessions (the desk included) the pack is quiet by design but not invisible.
Print/JSON mode (`-p`) has no UI to draw on, so none of this appears there:

- **Chips** (TUI footer / desk header): `nana-pack ✓` at session start · `post-edit ✓ 2 checks · foo.ts`
  after each checked edit (`✗ 1/2` on failure, `⏱ timeout`, `– skipped (lock|aborted)` when a check
  could not run) · `gate ✓ 12 checked · 1 gated` — tool calls the gate inspected, and the ones it stopped on.
- **Toasts**: post-edit check failures, compaction summary written/picked up/refused, context compacted.
- **Widget** (above the editor, TUI and RPC/desk): the roster notice at every session start —
  startup, new, resume and fork — staying until the next widget show or an extension-UI reset; the
  compaction-summary toast above still shows, because the notice is a widget, not a toast. It names
  the builder, any larger-lane builder, the reviewer and the land by model and thinking, never a
  provider or the scout (`nana-roster` prints both), and reads `roster unknown: …` while
  `PI_CODING_AGENT_DIR` is relative.
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
`gate_policy_widened`. Two exceptions, **`objective` and `writing`, are user-scope only** —
project config never contributes to either one, trusted or not.

- **Config encodings.** UTF-8 with or without one byte-order mark, or UTF-16LE or UTF-16BE with a mark, is read; other UTF-16 is unparseable.
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
  stop is reported.) When a file does not parse, the stop instead reads `nana-gate: user
  nana-pack.json does not parse: <file> at line <line>, column <column>. <repair>. Recovery:
  …` or `nana-gate: project nana-pack.json does not parse: <file> at line <line>, column
  <column>. <repair>. Recovery: …`. Its place and repair match the objective's config-failure
  line; the place is omitted when the parser reports none. **Owner recovery, both scopes**
  (malformed or over-cap — more than 200
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
	"writing": { "enabled": true },
	"receipts": { "enabled": true, "dir": null }
}
```

## Behavior notes

- Writing block: `writing.enabled` in the active agent dir's user-scope `nana-pack.json` defaults to true and controls pi only. Boolean false removes the section; project scope cannot. Claude Code keeps its linked rule. As a second way, pi's filter (`-extensions/nana-writing.ts` on the pack's `packages` entry in object form, or `pi config`) removes it, and nana-setup then reads the pack as unregistered until the plain entry is restored.
- Writing block: reviewer and worker sessions carry it too. The first `pi-review` corpus after landing is the check. A dropped path or a shortened finding moves delivery behind `hasUI`.
- Writing checker: it reads any argument except `--report` as a file path, so `--help` prints one error line and an empty summary.
- Rulings block: it has no switch of its own, shows a marker on an unusable installed file, reaches builders and reviewers, adds a separate stale-install section when the injected rulings text is not this checkout's current file, and adds `nana-project-stale` for a seat whose refreshable marker-owned working section differs.

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
  `packages/nana-setup/claude/hooks/nana-objective.mjs`; and any external consumer that copied a renderer,
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
- **One process-tree kill and one rename retry** (`lib/process-tree.mjs`, `lib/rename-retry.mjs`).
  The waiting and no-wait kill forms share the POSIX group signal, Windows `taskkill /T /F /PID`,
  pid guard and explicit fallback policy. The rename helper retries EPERM, EBUSY and EACCES three
  times on every platform, with a recheck after each delay. `lib/tree-kill-scan.mjs` rejects a new
  mapped production copy; its declared exceptions are the shared implementation, runtime-measure's
  snapshot walk, test-locked's composer and the frozen desk lifecycle. The scan does not detect
  copied rename loops.
- **Gate is fail-closed headless**: without a UI, a dangerous/protected hit is blocked
  outright. Interactively, "Block" is the default choice and "Allow once" allows that one call.
  Built-in forms: `rm` recursive (`-r`/`-R`/`-rv`/`--recursive`, also `/bin/rm`, `\rm`,
  `r''m`) or `--force` (except the plain in-directory form below), `sudo`/`doas`/`su`, force-push (`--force*`, `-f`, `+refspec`),
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
- **The plain in-directory `rm` exemption** (L2, 2026-10-19, the owner's ruling): a bash-tool command
  that is EXACTLY `rm`, flags drawn only from `-r`/`-R`/`-f`/`-v` (alone or combined) or
  `--recursive`/`--force`/`--verbose`, and one or more literal relative targets made of ASCII
  letters, digits, `.`, `_`, `@`, `-` and `/` that each lie strictly inside the session working
  directory, runs with no prompt and no headless block. Every other form still asks: an absolute
  target, the working directory itself, or a path outside it; a target with a dot-named part
  (`..`, `.git`, `.pi`), one that directly holds a `.git` entry, or one overlapping the active pi
  agent folder in either direction; a symbolic link or junction anywhere on the way; a glob,
  variable, substitution, quote, backslash, `~`, `--`, another flag, a prefix (`sudo`, `command`,
  `/bin/rm`, `VAR=value`), a second command, leading/trailing whitespace, or the powershell tool;
  a home, home-ancestor, root or dot-named working directory; and a target of such an rm, or an
  existing folder on the way to it, that holds a bare repository's shape (a `HEAD` file and
  `objects` and `refs` folders), or a session working directory, or a folder above it, that holds
  that shape with no `.git` entry from the working directory up to and including it — unless a
  worktree that `git worktree add` made inside that folder keeps the exemption. A configured
  `extraPatterns` or `protectedPaths` match and a named policy file still stop it — this exemption
  clears only the non-floor "rm recursive/forced" danger, never the floor or those later checks.
  Known limits: the outside-target rule in the next bullet covers plain `rm` and `rm -f`;
  absolute and dot-named targets and compounds
  (`rm -rf build && npm test`) still ask; the exemption assumes the command runs as typed in the
  session cwd, so a prefix that changes directory, `BASH_ENV` or an exported `rm` function voids
  it; a target that holds a git repository two or more levels down is not recognised — the `.git`
  check looks only one level under the target, so `rm -rf vendor` runs unasked when the repository
  actually sits a level deeper inside it; a bare repository below a target (`rm -rf mirrors`,
  when `mirrors` holds `app.git`) still runs unasked, as a non-bare repository nested below a
  target does — the owner's nested-repo trade stays as it is; a legacy symlinked `HEAD`, or
  `objects`/`refs` that are links, are not recognised; a plain folder inside a bare repository
  that is not a worktree over-asks, as does a path from outside through a bare repository into
  its worktree; any `.git` entry ends the walk up from the working directory, whether valid or not (git itself skips an invalid `.git` entry and keeps walking), and the walk ignores ceiling folders, filesystem boundaries and
  the `GIT_DIR`/`GIT_OBJECT_DIRECTORY` settings and always runs to the filesystem root, which can
  only over-ask; mount points and inner links keep their existing residuals; PowerShell keeps
  asking for every recursive or forced form.
- **Plain `rm` outside the working folder asks first** (pi only; Claude Code has no nana command
  gate): bash `rm x` and `rm -f x`, plus PowerShell `Remove-Item` and its `ri`/`rm`/`del`/`erase`/
  `rd`/`rmdir` aliases with positional, `-Path` or `-LiteralPath` targets, ask when a readable
  target lies outside both the session working folder and every accepted temp folder. The prompt
  and headless block name its full path. Absolute, `..`, `~`/`$HOME`, glob and brace, multiple-
  target, later-command, wrapper and linked-folder spellings are read; a preceding `cd`, `pushd`
  or PowerShell location command moves relative targets. Targets strictly inside the working
  folder or an accepted temp folder, including `/tmp` on every system but Windows, still pass, and a link as the target's last part is judged
  where that link sits. On Windows, bash targets and `cd` folders spelled the Git Bash way are read as Git for Windows mounts them: `/tmp` is the folder TMP names (else TEMP), and `/c/…` is drive C, after collapsing `.` and `..`. PowerShell spellings and other systems are not translated. Recursive and long `--force` forms keep their existing verdict. Targets
  led by another variable, a command substitution or `~user`, and relative targets after an
  unreadable location change, stay unjudged. Known limits: temp folders are shared; a session in
  home or a filesystem root has no outside child; dynamic folder parts, failed location changes,
  pipelines, subshells and groups can over- or under-approximate execution; only rm command
  position is covered; heredoc command-looking lines can be judged; other shells and a hand-edited
  fstab are not translated; Git Bash fixes `/tmp` once per user while any Git Bash runs; `/usr`,
  `/etc` and `/home` spellings are read on the working folder's drive, not where Git Bash reads
  them; `/cygdrive`, `/mnt` and `//host` are not read as drives and ask; `..` is collapsed before
  any link is read, while Git Bash follows a link first; only lowercase `/tmp` is read;
  with neither TMP nor TEMP set, `/tmp` asks; and PowerShell colon-bound parameters, pipeline input,
  filter/include scope and backtick escapes are not read. This text gate remains advisory and does not cover deliberate path hiding or races.
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
  shell-quoted; exotic path characters on Windows cmd.exe are quoted best-effort. Every check gets
  `PYTHONUTF8=1` when pi's `PYTHONUTF8` is unset or empty; non-empty `PYTHONUTF8` and every
  `PYTHONIOENCODING` from the owner pass through, with Python giving its non-empty I/O value precedence.
  `LANG` and every `LC_*` value pass through
  unchanged, set or unset. On Windows, Python before 3.15 therefore opens encoding-unspecified files
  as UTF-8 under post-edit even when the owner's terminal uses an ANSI code page, so a check can differ.
  On Windows, a failed check is reclassified as `error` only when it exits 1 and begins with a simple literal
  command name absent from the working folder, PATH and the sealed cmd.exe internal-command list.
  This check is conservative: commands later in a compound expression and names outside its internal
  vocabulary may remain ordinary `checks_failed` or be reported as `error`; neither result passes.
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
  handler pending forever. A command that sets no `timeoutMs` gets 30 seconds;
  `timeoutMs: 0` still means no deadline. CI's Windows leg runs the win32 branch: a timed-out or aborted check's process and its child are ended through `taskkill /T /F`; with `taskkill` off PATH only the shell is killed, and the check's own processes keep running.
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
  `packages/nana-setup/claude/hooks/nana-adoption.mjs` runs `bin/nana-adoption.mjs` (plain `.mjs`, no Node floor of its own), which
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
    that neither picks up nor writes (journal `handoff_skipped_role`); `pi-review` and `review-ledger run`
    set it for every child. Never inferred from the tool list or `hasUI` (the desk runs pi sessions). Only the exact
    lowercase value `off` is honored (`OFF`, `0`, `false`, empty behave normally). The marker is an
    ordinary env var, so it is **inherited**: any pi or desk process a review child spawns also has
    handoff off unless the launcher clears `NANA_HANDOFF`.
  - **Exact directory only**: a nested cwd or worktree with no compaction summary of its own never gets an
    ancestor's text. If an ancestor directory has one, the session is told "no compaction summary for this
    directory" plus that file's path; if no ancestor has one, nothing is added to the
    session — but the fact is not discarded: an unadopted directory is a signal addressed to the
    SEAT, not to the session, and lane L5 journals it so the seat can assign that directory an
    objective and start accumulating its knowledge (the owner's ruling 2026-09-28;
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
  `~/` is expanded (on Windows a leading `~\` expands too), and a RELATIVE path resolves against
  that same agent dir, never cwd; an empty or non-string `objective.path` means the default file,
  the same shared resolver `lib/objective-path.mjs` every runtime reads); only the parsed `**Objective` and `**Current priority` lines are ever injected —
  never other file content — each capped on its own at 1500 chars, so a long one cannot
  push the other out (overall output ≤ 12000 chars); an `objective_pickup`
  journal line records each pickup and which source it came from (`source: "project" | "user"`).
  Five contract points:
  - **A repo speaks its own objective — by default, no configuration.** The nearest
    `<dir>/OBJECTIVE.md` walking UP from the session cwd wins over `objective.path` (the owner's
    2026-09-18 decentralization ruling), followed by labelled `program objective:` /
    `program current priority:` lines and a precedence sentence so the program-level objective
    stays visible. A session in a product repo is charged against that product's two lines —
    byte-identical with the Claude Code hook `~/.claude/hooks/nana-objective.mjs` (both run
    `lib/objective.ts`). `objective.projectFile` (user scope) only RENAMES the file looked for — a bare
    filename (a separator, `.` or `..` is refused with a named config problem);
    `null`/`false`/absent = `OBJECTIVE.md`, never "off". The name, the fallback and the on/off
    switch are all user-scope (project config never sets `projectFile`). A hit that cannot be used (symlinked into the workspace, empty, unreadable) falls
    back to the user-scope file and journals `objective_project_refused` with the cause; the
    fallback is never silent.
  - **Provenance label (lane T2c; the owner's ruling (a), 2026-09-28).** When a repo-supplied file
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
    nana-trust before repo text is injected or called governing. The owner chose the label anyway
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
  - **An unparseable user `nana-pack.json` is announced without quoting its text.** Both runtimes keep the objective block and add one line after its heading. The line names the file and any parser-reported line and column, but shows no file text. It gives forward-slash advice for a backslash error and says "Repair the JSON by hand." for any other parse error.
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
