Feature: FEAT-041 · Shape each agent's context by role

## Purpose
The seat's reading (2026-11-06, with the adversary's O3 answer): absolute home and temp paths reached the public remote twice (the 10-29 scan lessons, then the r2 logs). The root cause was a seat process miss: lane branches were pushed with plain `git push`, with no identity scan chained in front, even though the 11-05 lesson "feedback-scan-gates-push" says to chain one. The builder's log was only the source.

This lane restores the 2026-10-16 ruling (nothing that names the owner goes public) at the push. It has three parts:
- (c) a CLI the seat chains before every lane push. This is the gate.
- (b) a pi-worker build-end scan of the build's own commits. This is an early warning.
- (a) one builder-preamble line.

## Assumptions
- A1. The words are identity-scan.config.json in the nana-pi checkout the tool runs from (`../../../`, as lib/main-ci.mjs resolves it). Lanes in other projects use nana-pi's config. May be wrong if a project has its own config.
- A2. The word scan alone misses one-letter home folders (the word lengths are 4, 5, 4 and 3) and Mac `/var/folders` temp paths. So a literal os.homedir() / realpath(os.tmpdir()) check runs beside it. On the Mac's home both checks fire, and that's expected.
- A3. (b) is a warning only: outcome and exit are unchanged, because (c) blocks.
- A4. (b) covers buildStart.tip..HEAD, which is this build only. (c) covers the range the seat passes, by the seat-guide line main..HEAD.
- A5. (b) runs in lane mode only.

## Open choices
- O1. The lib imports countIdentityWords from scripts/identity-scan.mjs, never scanTree (T1, T2). The CLI is a thin wrapper over the same lib.

## Questions for the owner
None.

## Feature
- **Lib.** `packages/nana-pack/lib/leak-scan.mjs` exports scanCommitRange({cwd, base, tip, config, home, tmp, platform}). It returns {hits:[{path, kind:'identity'|'home'|'temp', wordIndex?, count}], skipped:[{path, reason}]}, or throws.
  - Files come from `git diff --name-only -z --diff-filter=d <base> <tip>`: deletions out, renames in under the new path.
  - Content is read from `<tip>:<path>` blobs, never the worktree. The path itself is counted too.
  - Machine-path forms: native, forward-slash, and the msys form on win32. Case-insensitive on win32. A match must be followed by a separator, a quote, whitespace or the end of the text.
  - One sealed cap: bytes per file. An over-cap file is skipped with a reason.
  - Results never carry the matched word or path, only counts.
- **(c) CLI.** `node packages/nana-pack/bin/leak-scan.mjs --base <ref> --tip <ref>` prints one line per hit and per skip (`leak: <path>: identity word <i> ×<n> | home path ×<n> | temp path ×<n>`, `leak scan skipped: <path>: <reason>`), then a summary.
  - Exit codes: 1 on any hit or skip, 0 on a clean range, 2 on a usage or scan error.
  - A skip blocks, because content that wasn't read can't be called clean. The seat can inspect the file and push by hand.
- **(c) Seat guide.** Add one bullet to packages/nana-setup/claude/rules/nana-seat.md: `- Before pushing a lane branch, run \`node "$HOME/nana-pi/packages/nana-pack/bin/leak-scan.mjs" --base main --tip HEAD\` chained with \`&&\` to the push; on a hit, fix the commit before any push.`
- **(b) Build end.** keepBuildEnd calls the lib in lane mode before writing the record.
  - The record gains `leaks:{hits, skipped}`, or `leaks:{unavailable:'<reason>'}` if the scan throws.
  - Stderr gets the same lines as the CLI, prefixed `pi-worker: `, after the build-end line.
- **(a) Preamble.** builder-preamble.md, under "Before you report": `Committed logs and evidence use repo-relative paths, ~ or $TMPDIR, never an absolute home or temp path.`

## Threat model
- **The leak.** A log, report, fixture or snapshot holds a home or temp path or an identity word. Once pushed, undoing it means rewriting history, and the SHA stays reachable. (c) blocks at the push and covers seat-made commits too.
- **The seat skips (c).** It's a guide line, the same form of rule as the lesson that was missed. (b) puts a named line in front of the seat at build end, so a skipped gate still meets a visible warning. A hook-enforced push gate is out of scope for a context lane, and is a known-bug line.
- **A false all-clear or false alarm.**
  - T1: scanTree({files}) reports every allowlist entry outside the list as count-mismatch actual=0.
  - T2: scanTree reads the worktree.
  - T3: a throw must print `unavailable` in (b), and exit 2 in (c), never nothing.
- **The guard leaks.** Lines or the record echo the matched text.
- **Known misses** (known-bug lines): the FEAT-032 tokenizer gaps; file:// URLs and JSON-escaped Windows paths (the builder may add the JSON form if cheap); the seat rule copy staying stale on a machine until the next `nana-setup install`; no hook enforcing (c).

## Precedent
- `scripts/identity-scan.mjs`: countIdentityWords and validateConfig through the export. Never scanTree.
- `packages/nana-pack/lib/main-ci.mjs`: resolves scanner and root from nana-pack's location, and refuses on a non-zero scan.
- `packages/nana-pack/bin/pi-worker.mjs`: keepBuildEnd and buildEndLine. buildStart.tip is the base.
- `packages/nana-pack/lib/build-records.mjs`: buildEndRecord gains `leaks`. build-report.mjs and scripts/product-report.mjs read A-006.
- `packages/nana-pack/lib/context-load-log.mjs`: the visible-skip wording, once load-log lands.
- `packages/nana-pack/tests/identity-scan.test.mjs`: injected-config fixtures with stand-in digests.
- `packages/nana-setup/claude/rules/nana-seat.md` and `packages/nana-setup/tests/seat-rule.test.mjs`: the test pins the exact bullet list (`bullets.length === RULES.length`), so the new bullet is an expected edit to that test's RULES.
- `packages/nana-pack/tests/credential-strip.test.mjs` (~164) and templates-render.test.mjs (~556): both read builder-preamble.md.
- `docs/known-bugs/FEAT-032.md`: the scan's blind spots. `docs/known-bugs/FEAT-028.md`: 139 older committed logs, out of scope.
- none: the 11-05 seat lesson "feedback-scan-gates-push": the chained-scan pattern (seat memory, not tracked).
- none: map:search and map:impact were run as in draft 1. pi-worker, the preamble and identity-scan each reach the 202/277 always-run set. build-records writes A-006.

## Outside precedent
- gitleaks (MIT), borrow: commit-range scanning over blobs, not the worktree. Skip the tool itself (regex secrets, Go binary).
- Also looked at: git-secrets (Apache-2.0), skip. It's a bypassable pre-commit hook.

## Must-meet
- **M1, preamble and guide.** One test finds the exact (a) sentence under "Before you report", and the exact (c) bullet once in nana-seat.md.
- **M2, identity hit, no allowlist bleed.** A temp repo, an injected stand-in word, and an allowlisted file with expected counts outside the range. A commit after base adds r2-a.log holding the word twice. The result is exactly [{path:'r2-a.log', kind:'identity', wordIndex:0, count:2}]. Wrong code: scanTree({files}), or a scan from root.
- **M3, commit and range.** In base..tip:
  - a committed leak plus an uncommitted fix is flagged;
  - an uncommitted leak on a clean commit isn't;
  - a leak before base isn't flagged;
  - a file deleted in the range isn't read;
  - a renamed file is reported under its new path.
- **M4, path forms.** With injected home `/home/ab`, and `C:\Users\ab` under an injected win32 platform: native, forward-slash, msys and other-case forms are one home hit each. `/home/abc/x`, `~/x` and `$HOME/x` aren't hits. An injected tmp is one temp hit. Injected values only, so it runs the same on both machines.
- **M5, no echo.** For M2 and M4, CLI stdout and stderr, pi-worker stderr and the serialized record contain neither the stand-in word nor the injected home.
- **M6, CLI gate.** Exit 1 with a `leak:` line on a seeded leak in base..tip. Exit 0 on a clean range. Exit 1 with a skipped line on an over-cap file, with no read past the cap; the cap is pinned once as a sealed tunable. Exit 2 on an unknown ref.
- **M7, build end.** In a pi-worker lane build in a temp repo, the fake builder commits a log holding the test's HOME (USERPROFILE on win32):
  - the record has leaks.hits[0].kind 'home';
  - stderr has `pi-worker: leak: <path>: home path ×1` after the build-end line;
  - outcome and exit equal the no-leak run;
  - with an injected scan failure, the record has `leaks:{unavailable}` and one `pi-worker: leak scan unavailable:` line, outcome and exit unchanged.
- **M8, readers.** build-report.mjs prints the same lines for a record with and without `leaks`.

Expected test edits (a forecast, not a limit): seat-rule.test.mjs's RULES list, and any preamble test that pins the full text. Starts after builder-context and load-log land.

## Build notes
- Lane: `leak-guard`, worktree `~/nana-pi-wt/leak-guard`, branch `feat/leak-guard` from main `14eb4c34`. Lane class: ordinary.
- Requirements first: take new rows from R-3748 upward, under FEAT-041.
- Use the shared `tmpDir` helper in tests, never a direct mkdtemp, and the repo runner's PASS/FAIL style (see brief-check.test.mjs). Regenerate the code map and requirements tree before your final commit.
- Committed evidence uses repo-relative paths, ~ and $TMPDIR, never absolute home or temp paths.
