# Lane L5 — an unadopted repository is a signal that reaches the seat
(2026-09-29 · repo `~/nana-pi` · worktree `~/nana-pi-wt/l5` · branch `lane/l5-directory-adoption`, off `main` `eca3de4`)

Design: `docs/directory-adoption-design-2026-09-28.md`. Jake's ruling: *"A directory with no handoff
should be reported to seat, and have seat assign an objective and start accumulating directory-level
knowledge."* He then ruled the three open questions: **repository roots only · dismissal is a marker
file in the repo · an `OBJECTIVE.md` ends the reporting.**

## Goal

When a session runs in a git repository that nobody has adopted, that fact reaches the seat at its
next session start, and stops reaching it the moment the repo is adopted or dismissed. Nothing is
added to any session's prompt, nothing is created in anyone's directory, and no filesystem is
scanned looking for candidates.

## The trace (§1b — done by the seat; verify it, do not take it on faith)

- `packages/nana-pack/extensions/nana-handoff.ts:290-390` is the pickup path. At `:312` it computes
  `canonicalCwd(ctx.cwd)`; at `:314` the store entry `storePathFor(canon)`; at `:340` it already
  journals `handoff_missing` when nothing is stored, and distinguishes that from `handoff_pickup_failed`
  (`read.kind === "error"`, a store that exists but could not be read). At `:373-388` an unreadable
  OR missing entry walks ancestors and may add the "an ancestor has one" line. That in-session
  behaviour does not change.
- `appendJournal(cfg, …)` (`lib/config.ts`) is best-effort append to `journalFile(cfg)`, which since
  U2 is `<pi's active agent dir>/nana-journal.jsonl` unless configured. It is append-only and is
  never rotated.
- The seat's session start prints `[nana:objective]` from the thin launcher
  `packages/nana-setup/claude/hooks/nana-objective.sh` → `packages/nana-pack/bin/nana-objective.mjs`.
  `HOOKS` in `packages/nana-setup/lib/steps.mjs:13` lists the installed hooks; each is a symlink into
  this repo, fail-open, always exit 0.
- `nana-setup project [dir]` seeds OBJECTIVE / HANDOFF / sessions / AGENTS; its flags are parsed in
  `packages/nana-setup/bin/nana-setup.mjs:45-56`.
- Failure modes to hold in mind: no `.git` anywhere above the cwd · a linked worktree, whose `.git`
  is a FILE · a repo root that is a symlink · a store entry that exists but is unreadable · a journal
  that is huge, absent, or unwritable · `NANA_HANDOFF=off` · a session in a subdirectory of an
  adopted repo.

## The contract

### 1. Producer — one journal line, never a prompt line
In the pickup path, after the existing `handoff_missing` journal line, emit
`{"event":"directory_unadopted","cwd":"<canonical repo root>","has":{…},"ts":"…"}` **only when every
one of these holds**:

- `read.kind === "missing"` — specifically missing, never `"error"`. astra's binding constraint is
  that a missing handoff is not proof of an unadopted directory; an unreadable store is evidence of
  the opposite, so it must never report.
- no configured `handoff.path` (a configured path is a deliberate adoption already).
- walking up from the canonical cwd finds a `.git` entry, **file or directory** (a linked worktree
  counts, and is adoptable in its own right). No `.git` anywhere up to the filesystem root means no
  report at all. The reported path is that repository root, never the subdirectory.
- the REPOSITORY ROOT, not the cwd, has: no handoff store entry (`storePathFor(root)` absent), no
  `OBJECTIVE.md`, and no dismissal marker. A session in `repo/src` of an adopted repo reports nothing.
- no `directory_unadopted` for that root already in the journal within the last 24 hours. Read a
  bounded tail of the journal (256 KiB is enough; the file is append-only and never rotated) and scan
  backwards. A duplicate line after a truncated read is acceptable; a missed line is not a defect
  either. Never read the whole file.

`has` is what the producer can see **in the repository root itself**, and nothing else:
`{"handoff":false,"objective":false,"agents":<AGENTS.md exists>,"sessions":<docs/sessions/ exists>}`.
The design sketch said `memory`; that would mean reaching into the Claude home from a pi extension,
which this producer must not do — `sessions` replaces it. Note the substitution in the design doc.

The producer never throws out of the handler, never adds to `lines[]`, and never changes what the
session sees. `NANA_HANDOFF=off` returns before it, as today.

### 2. Reader — a new session-start producer for the seat
`packages/nana-pack/bin/nana-adoption.mjs`, printing the tag `[nana:adoption]` and nothing at all
when there is nothing to say (an empty stdout, so the hook prints nothing).

- Reads only the journal (bounded tail, same cap). Never walks a filesystem looking for candidates.
- Collects distinct repo roots with a `directory_unadopted` line in the last **7 days**, newest first.
- **Re-checks each root at print time** and drops any that is now adopted or dismissed: store entry
  present, `OBJECTIVE.md` present, dismissal marker present, or the directory gone. This is what
  replaces a cursor file — there is no "since last session" state to keep, and a repo fixed an hour
  ago never appears again.
- Prints at most **5**, then `…and N more` when there are more.
- Each line names the path and what it has, and the block ends with the one sentence saying what the
  seat does with it: adopt with `nana-setup project <dir>`, or dismiss it once with
  `nana-setup project <dir> --not-a-project`.
- Always exits 0. Any failure prints a named one-line marker, never a stack, never a non-zero exit.

Wire it in as `packages/nana-setup/claude/hooks/nana-adoption.sh`, the same thin-launcher shape as
`nana-objective.sh` (follow the symlink, no node → a named marker, `--cwd "${CLAUDE_PROJECT_DIR:-$PWD}"`,
always exit 0), added to `HOOKS` in `packages/nana-setup/lib/steps.mjs:13`. **Claude Code only** — the
seat is the only actor this is for; pi sessions get nothing new.

### 3. Dismissal — a marker committed with the repo
`nana-setup project <dir> --not-a-project` writes `.nana-not-a-project` at the repository root: one
small file whose contents say in one line what it means and when it was written. It travels with the
repo, so a fresh clone or a second machine inherits the decision.

`nana-setup project <dir>` on a directory that already holds the marker **refuses** and names the
marker and the remedy (delete it to adopt). It must not silently overwrite a recorded decision.
`--not-a-project` on a dir that is not a git repository root refuses with the reason.

## NOT
- **No prompt injection.** Nothing this lane adds may reach any session's system prompt or context.
  The in-session surface stays exactly as L3 left it, ancestor line included.
- No filesystem scan for candidate directories, ever. Only a directory where a session actually ran.
- No automatic adoption, no file created in a directory because someone opened a shell there.
- Do not change the objective producer, its output, or `lib/objective.ts`.
- Do not change handoff pickup, the store, its paths, or the ancestor behaviour.
- Do not add a pi-side reader, a desk surface, or a new config key.
- Do not rotate, trim or rewrite the journal.

## Allowlist
May edit: `packages/nana-pack/extensions/nana-handoff.ts`, `packages/nana-pack/bin/nana-adoption.mjs`
(new), `packages/nana-pack/lib/adoption.ts` (new, if the shared predicate earns a file),
`packages/nana-setup/claude/hooks/nana-adoption.sh` (new), `packages/nana-setup/lib/steps.mjs`
(the `HOOKS` list), `packages/nana-setup/bin/nana-setup.mjs` and `packages/nana-setup/lib/project.mjs`
(the `--not-a-project` flag and the refusal), `packages/nana-pack/README.md`,
`packages/nana-setup/README.md`, `docs/directory-adoption-design-2026-09-28.md` (the `sessions`
substitution note only), and tests under `packages/nana-pack/tests/**` and
`packages/nana-setup/tests/**`.
Must not touch: `lib/objective.ts`, `lib/config.ts`, `lib/gate-paths.ts`, `lib/agent-dir.mjs`,
`apps/**`, anything under `docs/reviews/**`.
(The seat checked the NOT-list against the allowlist: no overlap.)

## Constraints
The producer runs inside a pi extension handler: it must never throw and must never block. Node >=
22.18 for the new bin (built-in type stripping) if it imports any `.ts`; prefer plain `.mjs` and no
`.ts` import so the hook has no Node floor beyond what `nana-objective.sh` already states. Paths are
compared canonically; a symlinked repo root must not produce two entries.

## Appetite
`--max-budget-usd 12` · advisory ceiling ≤ 10 files / ≤ 300 LOC changed excluding tests.
If the contract needs more: write a CHECKPOINT paragraph in your report naming what remains and what
it would cost, then continue only if the remainder is mechanical. A checkpoint is a success.

## Roles
builder: Opus 5.5 headless · reviewers: scope + adversarial (executed probes) · land: astra.

## Rules
Foreground only; kill only your own PIDs; commit on the branch, no push; smallest change that passes
doneWhen.

## doneWhen
From `~/nana-pi-wt/l5`: `env -u NANA_HANDOFF npm test` exits 0 with no test removed or weakened, and
new tests cover:
(a) the line is written once for a repo root with nothing, and NOT written for: a second session the
    same day, a cwd with no `.git` above it, a subdirectory of an adopted repo, a root with
    `OBJECTIVE.md`, a root with the dismissal marker, a root with a store entry, an unreadable store
    (`read.kind === "error"`), a configured `handoff.path`, and `NANA_HANDOFF=off`;
(b) a linked worktree (a `.git` FILE) is reported as its own root;
(c) the reader prints newest-first, caps at 5 with a count, drops a root adopted after the line was
    written, and prints nothing when there is nothing;
(d) `--not-a-project` writes the marker, the reader then ignores that root, and `project` on a marked
    directory refuses;
(e) the session prompt is unchanged: a golden or equivalent assertion that the pickup block for an
    unadopted directory is byte-identical to today's.

## Report (≤40 lines)
Commits · `env -u NANA_HANDOFF npm test` output · the journal line as actually emitted · the reader's
output on a seeded journal · the proof that nothing reaches the prompt · residuals · scope check
("nothing outside the allowlist", `git diff --stat` attached) · the one claim most likely wrong ·
`VERDICT: DONE`.
