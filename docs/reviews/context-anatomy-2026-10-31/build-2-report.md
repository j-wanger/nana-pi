VERDICT: DONE

# Build 2 technical record

Feature: FEAT-041 · Shape each agent's context by role

## Changes and rows

- `packages/nana-pack/lib/claude-settings-carry.mjs` builds `claudeMdExcludes` from the reviewed tree's parent through the filesystem root. Each ancestor gets CLAUDE.md, CLAUDE.local.md, .claude/CLAUDE.md and .claude/rules/** exclusions. Path separators are normalized and glob metacharacters in ancestor names are literalized. The user cannot supply this generated list through settings carry.
- `packages/nana-pack/bin/claude-review.mjs` and `packages/nana-pack/bin/pi-worker.mjs` pass their actual target tree to that existing shared helper. Neither changes cwd, argv order, tool permissions, auth, model effort or connection carry. The tree's own instructions are not excluded. Managed/policy memory cannot be excluded by this setting; explicit imports from tree-local instructions still follow Claude Code's own rules.
- `packages/nana-pack/bin/worker-config.mjs` declares the four ancestor-memory suffixes, with installed-version provenance. The new requirement test also pins their literal values.
- `packages/nana-pack/lib/known-bug-digest.mjs` always preserves the header. Only text after it consumes the feature's budget, including the omitted-lines notice. Reviewer pass-on shares use the same accounting. A header-only file passes unchanged, even without a final newline. As before, a share smaller than its notice still delivers the header and notice as the minimum.
- `packages/nana-pack/README.md` documents the supported exclusion, why settings-source selection alone fails, preserved tree-local context, managed-policy limits and the post-header budget. `docs/code-map.md` and `docs/requirements-tree.md` are regenerated.
- `REQUIREMENTS.md`: new R-3219 is implemented with backticked evidence. R-2560 and R-2646 reference it and cite its test alongside their existing launch evidence. R-3212 and R-3214 declare the seat's post-header accounting decision in place. FEAT-041 adds its R-2646 share; no row moves, new feature, artifact or other ID is introduced.

## Supported mechanism and confirmation

`exclusion-provenance.log` records the installed Claude Code 2.1.310 schema documentation and loader code, plus the public memory documentation. `claude --help` was checked again; `claude-help.log` already records that installed help surface.

The loader tags ancestor rules as Project memory and ancestor CLAUDE.local.md as Local memory. Omitting the user settings source therefore cannot stop this walk. The supported `claudeMdExcludes` matcher filters User, Project and Local memory, including rules. The public documentation explicitly demonstrates excluding a parent's rules folder and supports this setting at every settings layer. Since 2.1.239 either a rule's discovered path or its symlink target can match.

The chosen setting uses the existing external, private flag-settings file. `--bare` would also remove tree-local instruction discovery and OAuth/keychain reads; `--safe-mode` would remove the tree's instructions. Neither is used. No model session was started for this investigation.

## Tests and edits to existing tests

Only one new suite test was added: `packages/nana-pack/tests/context-anatomy.test.mjs::R-3219: both Claude launchers exclude ancestor memory while keeping tree instructions eligible`. It uses temp homes containing marker rules, ancestor CLAUDE.md and tree-local AGENTS.md/CLAUDE.md. Fake children record the actual settings, argv and cwd for both launchers. It asserts the exact ancestor-only exclusion list and pins the suffix seal. Both children are bounded; the existing harness awaits every case under its per-case limit. No suite test runs, imports or copies the seat pair runner.

Existing test changes, each made because the new contract made the old oracle false:

- `context-anatomy.test.mjs`, R-3211: the exact settings-object expectation allows the generated exclusion field; R-3219 independently pins its value.
- `context-anatomy.test.mjs`, R-3212: length and maximal-fill checks charge only post-header text. The existing case now checks an over-budget unchanged header, a fitting bug line after it, an overlong omitted line, the exact notice and an unchanged header-only file. Fixtures retain LF/CRLF, trailing spaces/tabs, non-ASCII text and no-final-newline shapes.
- `context-anatomy.test.mjs`, R-3214: the shared-budget oracle deducts the two unchanged headers.
- `worker-claude.test.mjs`, R-2655 and R-2665: exact top-level key inventories include `claudeMdExcludes`, including missing/malformed user-settings cases. Existing env and diagnostic assertions are unchanged.

No other existing test was edited or deleted. The shared fixture gains an optional home-nested worktree and records child cwd.

## Wrong-code proof

- `exclusion-before.log`: the new exclusion test fails against the previous implementation, exit 1, because flag settings lack the exclusion.
- `header-before.log`: the amended digest case fails against the previous implementation, exit 1, because charging the huge header rejects the fitting bug line.
- `pairs.mjs` remains a manual seat runner outside the suite. Its OS-temp copy breaks code, never assertions. Existing mutation targets were updated for changed source expressions. `pairs-build-2.log` records 34 pairs, each RED exit 1 and restored GREEN exit 0; zero failed pairs.
- New pairs omit exclusions, stop at the immediate parent, exclude the tree itself, retune the suffix seal, and charge the huge header against its share. The remaining 29 pairs from build 1 still pass.

## Commands and exit codes

- `npm test -- context-anatomy.test worker-claude.test claude-review.test`: exit 0; `touched-build-2-green.log` records 41 passing checks and three platform skips.
- `env -u NANA_WORKTREE_ROOT node packages/nana-setup/bin/install-check.mjs`: exit 0; `install-build-2.log` records every macOS install probe passing, including hook shared memory.
- `node docs/reviews/context-anatomy-2026-10-31/pairs.mjs`: exit 0; 34 pairs, zero failed pairs.
- Map and outline generation: exit 0 each; `generate-build-2.log`.
- `npm run map:check`, `npm run readme:check`, `node scripts/requirements-trace.mjs`, `node scripts/requirements-tree.mjs --root .`, `node scripts/known-bugs.mjs --root .`, and `node scripts/identity-scan.mjs`: exit 0 each; `validation-build-2.log`.
- Shared-parser evidence-title audit: exit 0; `titles-build-2.log` records five amended/new rows, seven evidence titles, zero missing.

`npm run test:locked` finished in the foreground with exit 0 under the declared machine lock. `full-suite-build-2-pass.log` records **243 files: 241 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8775 pass, 0 fail, 44 skip**. The suite record reports no test that passed only without coverage. The commit and finished CI result are reported at completion. Earlier runs remain recorded: the first full suite failed two README path-formatting claims, which were fixed in prose, not in the checker; a second invocation timed out at the harness while awaiting the shared machine lock and never started tests; the next full suite failed only the unchanged deleted-cwd timing check at 10017 ms. That check passed unchanged in `hostile-recheck-build-2.log` (exit 0). The first focused runner also noticed concurrent map/outline generation; the serialized rerun passed. No timing assertion or timeout was changed.

## Precedent

All four files named by the brief were read before design. Both launchers still import the existing shared settings helper; no helper was copied or moved. Sealed suffixes live in the existing launch configuration module. The helper gains an explicit reviewed-tree argument rather than deriving reviewer context from the launcher's cwd. No departure from the named precedent was needed. Post-header digest accounting implements the seat's explicit build-2 decision, not a new policy choice.

## Closures

- Closed the missing ancestor-rule exclusion in launcher-generated settings for both Claude roles; fake-child tests and code-breaking pairs pin it. Real transcript verification remains the seat's next round, not a claim of this build.
- Closed build 1's header-budget ambiguity in code, contract prose and the existing digest case, following the seat's decision.

## Known-bug context touched

FEAT-007's line that `claude -p` loads user rules, hooks and memory is the named bug being fixed; build 2 supplies the missing ancestor exclusion after build 1's real measurement failed. Its read-only-advisory clause remains unchanged. The same exposure in the FEAT-006 Claude builder now uses the shared exclusion. FEAT-006's known-bug attachment size-guard line is touched only through the decided header accounting. Settings migration, managed policy precedence, signal forwarding, builder write boundaries and all other recorded limits remain unchanged. No known-bug file was edited.

## Not done

The seat must repeat the real `ca-measure` round on the new tip and inspect instructions, MCP absence, first-turn tokens and account-email retention. This builder did not start reviewers, subagents or paid model sessions. The real over-cap builder measurement, independent review and land review remain seat work. The measurement round's non-string effort fallback and case-insensitive-env/exact-name override notes were deliberately left unchanged. No issue was created or changed. HANDOFF, known-bug files and session archives were not edited. The final builder message reports the pushed tip's finished CI run; it is not committed afterward, which would create another tip needing CI.
