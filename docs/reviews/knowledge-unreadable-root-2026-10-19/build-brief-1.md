# knowledge-unreadable-root: build brief 1

Feature: FEAT-003 · Index and connect existing knowledge sources
Class: hook (the CLI is the Claude Code hook command). Threat model: honest filesystem variation (modes, privacy denial, Windows deny ACLs) on macOS, Linux and Windows; hostile filesystem out.
Builder: pi gpt-5.6-sol via `pi-worker --lane knowledge-unreadable-root --lane-size larger`, following packages/nana-pack/prompts/builder-preamble.md, in the lane worktree on feat/knowledge-unreadable-root from current main. Read the must-meet first. Single test files only, with HOME and USERPROFILE set to a fresh temp folder. Never edit HANDOFF.md or docs/sessions/. Run `npm run map:impact` on build.ts, sources.ts and the CLI first.

## Change
1. packages/nana-knowledge/lib/build.ts: walk() takes an `unreadable: string[]` and pushes every directory it cannot stat or list (root or folder, any error code). It returns false when the root itself fails; the caller then skips the root (not in `roots`, not scanned). Add `BuildStats.unreadable`. Purge loop: keep (preserved++, files++, rows += prev.rows) a configured root's row when its root was not scanned or `unreadable.some((u) => contains(u, path))`. Update the header @outputs/@errors and the `preserved` comment.
2. packages/nana-knowledge/lib/sources.ts: export `contains`; header @outputs names it. No behaviour change.
3. packages/nana-knowledge/bin/nana-knowledge.ts: build prints `  <path>  UNREADABLE (skipped, rows kept)` per entry right after the MISSING lines, before the summary. status prints MISS when stat fails, UNREADABLE when `fs.opendirSync(p).closeSync()` throws on a directory, else ok. Header @outputs updated. Hook path untouched.
4. packages/nana-knowledge/tests/unreadable-root.test.mjs (new, six-tag header, tmpDir helper, NANA_KNOWLEDGE_HOME set before imports, no discover block). Roots: a (one.md), b (keep/two.md, locked/three.md, gone.md), and a missing root. Build once in-process. Delete b/gone.md, deny a and b/locked (chmod 000; win32 `icacls <d> /deny *S-1-1-0:(RD)`). Precondition per folder: statSync succeeds and readdirSync throws. Spawn CLI build and status (process.execPath, fileURLToPath of the CLI, NODE_NO_WARNINGS=1). Check by search tokens and by output lines. Restore in finally (chmod 755; `icacls <d> /remove:d *S-1-1-0`). If the precondition fails, print `SKIP <full title> — <reason>` for R-1910 to R-1913. R-883's check always runs.
5. packages/nana-knowledge/tests/incremental-build.test.mjs: markers only (R-883 x3, R-207 x3, titles as the must-meet names). No other edit.
6. packages/nana-knowledge/README.md: the missing-root paragraph covers a root or folder that cannot be listed (UNREADABLE in build, marked by status, rows kept). No machine paths or owner names.
7. REQUIREMENTS.md: add R-1910 to R-1913 after R-883 in FEAT-003; flip R-883 and R-207 to implemented with evidence; their text unchanged. Run `npm run req:tree` and `npm run map`; commit docs/requirements-tree.md and docs/code-map.md.

## Tests (exact titles; `check("…"` on the line under its `// req:` marker)
unreadable-root.test.mjs: R-1910: a root that exists but cannot be listed keeps its rows searchable · R-1911: a folder that cannot be listed keeps its rows while a file deleted elsewhere under the root is purged · R-1912: build names an unlistable root and an unlistable folder UNREADABLE and exits 0 · R-1913: status marks a root that cannot be listed UNREADABLE, not ok · R-883: build names a missing root MISSING and status marks it MISS, both exiting 0

## Wrong code to try (restore after each)
W1 `if (dir === root) return true` without recording: R-1910, R-1912. W2 drop the folder record: R-1911, R-1912. W3 keep a whole root when any folder under it is unreadable: R-1911. W5 drop the UNREADABLE line: R-1912. W6 status by existence only: R-1913. W12 drop the MISSING line, W13 status ok for a missing root: R-883. W15 purge every unseen row, W16 never purge, W17 keep an unconfigured root's rows: the R-207 incremental-build checks.

## Done
- The four new checks fail on main's lib and bin and pass after the change; R-883 passes both. unreadable-root, incremental-build, discovery, hook and extension test files pass alone.
- `node scripts/requirements-trace.mjs` exits 0 with ears 0; map:check and readme:check green; req:tree leaves no diff after commit.
- The seat pushes a draft PR and reads the Windows leg for PASS, not SKIP, on R-1910 to R-1913.

## Report (≤ 10 lines)
Tip; PASS/SKIP counts per file before and after; wrong-code table (variant to checks red); trace, tree, map and readme results; anything that surprised you.