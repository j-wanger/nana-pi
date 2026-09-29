# Review brief — lane L5 (directory adoption), roles: SCOPE + ADVERSARIAL

Worktree `~/nana-pi-wt/l5`, branch `lane/l5-directory-adoption`, HEAD `2f0b6e4`, base `main`
`eca3de4`. Read `docs/reviews/l5-2026-09-29/l5-brief.md` (the contract), then `l5-worker-r1.md`,
then `git diff eca3de4..HEAD` in full. Commit `2f0b6e4` is the SEAT's, not the worker's: it
registers the hook in `settings.json`, because the worker's allowlist reached the symlink list only
and the feature could never have fired.

## What this lane is
Jake's ruling: a git repository nobody has adopted should reach the SEAT, which assigns it an
objective. The producer writes one journal line; a new `[nana:adoption]` SessionStart reader prints
open ones to the seat; `nana-setup project <dir> --not-a-project` writes a marker that travels with
the repo. **Nothing is injected into any session's prompt** and no filesystem is scanned looking for
candidates.

## The invariant to attack first
**Nothing this lane added may reach a session's context.** The worker claims byte-identical prompts
against the `eca3de4` version of `nana-handoff.ts` on three scenarios. Verify that independently, and
look for a fourth scenario it does not cover. A single character reaching a worker's prompt is a
BLOCK: this was the objection the design overrode by keeping the signal out of the session entirely.

## Executed probes (these are the floor; add your own)
1. **The producer's gate.** The line must be written for a git repo root with nothing, and NOT for:
   a second session the same day, a cwd with no `.git` above it, a subdirectory of an adopted repo,
   a root with `OBJECTIVE.md`, a root with the dismissal marker, a root with a store entry, an
   unreadable store (`read.kind === "error"` — astra's constraint that a missing handoff is not
   proof), a configured `handoff.path`, and `NANA_HANDOFF=off`. Drive the real extension.
2. **Repo-root resolution.** A linked worktree (`.git` is a FILE) is its own root. A symlinked repo
   root must not produce two entries. A `.git` that is a file with junk in it. A bare repo. A repo
   root at `/`. A path with a newline in it.
3. **The dedup.** The 24-hour rule reads a bounded journal tail. Attack it: a journal larger than
   the cap, a journal whose last line is truncated, a journal with a line that is not JSON, an
   absent journal, an unwritable journal, and two sessions in the same second.
4. **The reader.** Newest first, capped at five with a count, drops roots adopted / dismissed /
   deleted after the line was written, prints NOTHING (empty stdout) when there is nothing, exits 0
   always. Feed it a hostile journal: a `cwd` that is a relative path, one with shell
   metacharacters, one that is 4 KB long, and a line claiming a directory you do not own. The
   output is read by the seat as trusted text, so judge whether a repo-controlled or journal-injected
   string can misrepresent itself there.
5. **The hook.** No node on PATH, a broken symlink, a non-zero exit from the bin, and a slow bin
   against the 5-second timeout. It must always exit 0 and never break session start.
6. **Dismissal.** `--not-a-project` writes the marker; `project` on a marked directory refuses and
   names the remedy; `--not-a-project` on a non-repo refuses. Can the marker be forged into
   something else, or written outside the target directory?

## SCOPE
- Allowlist respected? The brief permits the handoff extension, two new files under `nana-pack`,
  the hook script, `HOOKS`, the setup CLI and `project.mjs`, two READMEs, the design doc's one-line
  note, and tests. The seat added `packages/nana-setup/lib/settings.mjs` and
  `tests/settings-merge.test.mjs` in `2f0b6e4`. The worker declares one deviation: the shared
  predicate is `lib/adoption.mjs`, not `.ts`, so the bin has no Node floor. Judge both.
- NOT-list untouched? No prompt injection, no filesystem scan, no auto-adoption, no change to the
  objective producer or `lib/objective.ts`, no change to handoff pickup / store / ancestor
  behaviour, no pi-side reader, no desk surface, no new config key, no journal rewriting.
- **Smallest change.** `lib/adoption.mjs` holds a COPY of the store-key derivation, with a test
  asserting it equals `storePathFor`. Is a tested copy the right call here, or is it the second
  resolver problem U2 just spent a lane removing? Rule on it.
- Appetite: ≤ 10 files / ≤ 300 LOC excluding tests. The worker reports 10 files and ~264 lines, at
  the ceiling, with no checkpoint. Was the overrun-free claim accurate?

## Also judge
- The worker's residuals: a project-scope `journal.path` sends producer lines where the reader does
  not look; "adopted" checks the literal `OBJECTIVE.md` and not `objective.projectFile`; the
  reader's catch branch is untested. Which of these is a defect rather than a residual?
- `env -u NANA_HANDOFF npm test` (the review launcher sets `NANA_HANDOFF=off`, which fails two
  handoff tests for unrelated reasons).

## Output
Findings with severity at `file:line`, each marked **executed** (command + output) or
**source-read**. End with `SCORE: n/10`, `MUST:`, `CARRY:` and `VERDICT: LAND|BLOCK`.
