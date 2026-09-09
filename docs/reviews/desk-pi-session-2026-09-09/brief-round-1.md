# Review brief — nana-pi desk adopts pi's public session parser (option b of the lineup ruling), sol land review

Independent reviewer (non-Anthropic lens). Jake ruled: adopt pi's PUBLIC data-type exports instead of hand-rolled parsers, and list dependencies clearly in READMEs. An Opus worker changed the desk ("nana code", apps/desk/server.mjs, a loopback control plane that already SPAWNS the globally installed pi) to also IMPORT pi for session-file parsing. Be concrete; do not restate the diff.

## Claims (verify)
1. New apps/desk/pi-session.mjs resolves the installed pi (DESK_PI_ROOT → realpath(PI_BIN) walk-up → global prefixes under os.homedir() and os.userInfo().homedir → homebrew/usr-local) and imports ROOT exports parseSessionEntries, migrateSessionEntries, CURRENT_SESSION_VERSION (dist/index.d.ts:19); fails loudly at startup listing paths tried / missing exports; PI_MIN_VERSION 0.84.4 warns if lower.
2. parseTranscript uses pi's parser + migration IN MEMORY only (file byte-identical after read); v1/v2 files become readable; readSessionMeta/hasSessionHeader use pi's line→entry step and pi's header rule. Response gains version + parserVersion.
3. Kept hand-rolled with reasons: byte-window meta scan, growing-window sessionTail + rename append, cycle-guarded branch walk (pi's getBranch has no cycle guard); SessionManager deliberately unused because open() rewrites the file on migration.
4. Three behaviour changes: session_info entries now in the branch index (post-rename branch no longer dimmed); v1/v2 readable; a file whose first parsed entry isn't a header is no longer listed.
5. READMEs: desk "Dependencies" table (Node ≥ 22.19 from pi's engines; global pi ≥ 0.84.4 spawned AND imported, exports named; Playwright 1.61.1 e2e only); root README per-component table; pack/stage one-liners; "zero-dependency" replaced with "no npm dependencies of its own; requires the installed pi".
6. Tests: 17 files 452 PASS incl. new pi-session-parity.test.mjs (33) that builds a real session with pi's SessionManager and compares old parser vs new vs SessionManager.getBranch().

## Read
- Diff: /private/tmp/claude-501/-Users-jwang-nana-agent-loop/bench-work/diff-desk-pi.patch
- New files (copies): /private/tmp/claude-501/-Users-jwang-nana-agent-loop/bench-work/new-pi-session.mjs, new-pi-session-parity.test.mjs
- Post-change: ~/nana-pi/apps/desk/server.mjs, apps/desk/pi-session.mjs, apps/desk/README.md, ~/nana-pi/README.md
- pi 0.84.4: $(npm root -g)/@earendil-works/pi-coding-agent/dist/index.d.ts (exports), docs/session-format.md, docs/sdk.md; the JSDoc on parseSessionEntries/migrateSessionEntries in dist (worker says "Exported for testing").

## Dimensions
A. Dependency contract: is importing root exports that pi's own JSDoc marks "Exported for testing" an acceptable bet given the loud startup check + parity test? Does the resolution chain have a failure mode on a normal machine (nvm/volta/fnm prefixes; Windows %APPDATA%/npm; pi installed via bun)? Is the startup failure message actionable? Does the import happen once (not per request)? Memory/startup cost acceptable and stated?
B. Semantics: migration in memory — any path where the migrated entries are written back (rename append, title append, export)? Are ids/parentIds from migrateSessionEntries stable across reads (so the desk's leaf/branch logic doesn't drift between refreshes)? Behaviour change 3 (unlisted headerless files) — could it hide a real session pi itself would still open? Behaviour change 1 — does including session_info in the branch index change the transcript render (an entry the UI doesn't know how to draw)?
C. Kept hand-rolled parts still consistent with pi's parser (header rule vs the byte-window scan — can the meta scan and the full parse disagree on title/name/cwd for the same file)? Cycle guard preserved on every walk?
D. Safety regressions in server.mjs: nothing in today's hardening weakened (Host/Origin guards, sessionTail 409s, teardown, symlink guards). New signal-exit listener from pi's import — any interaction with the desk's SIGINT/SIGTERM shutdown escalation?
E. READMEs: are the dependency statements accurate vs code (versions, exports named, Playwright scope), and is the "zero-dependency" replacement wording honest everywhere it appeared?
F. Tests: parity test compares against a verbatim copy of the OLD parser — is that copy load-bearing or drift-prone; does the suite now silently pass if pi is missing (it must fail loudly)? Deterministic, ephemeral ports.

## Output
Per dimension: PASS or FINDING (BLOCK/SHOULD/NIT, file:line, what, minimal fix). End with exactly one line: `VERDICT: LAND` or `VERDICT: BLOCK`.
