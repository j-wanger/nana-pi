# Roster roles — merge continuation evidence

## Scope and rows

Continues the pending merge of `origin/main` at `4eda88e274084960e578bb21491ab42afebddad3` into lane tip `bb4053f09d3a91827615a7fc8a012393e4e5da3e`.

- `REQUIREMENTS.md`: lane R-3530 becomes R-3536; lane R-3531 becomes R-3537; R-1140's cross-reference follows R-3536.
- `packages/nana-setup/tests/seat-rule.test.mjs`: only the MM9 requirement marker changes to R-3536.
- `packages/nana-pack/tests/nana-roster.test.mjs`: only the fallback seal's requirement marker changes to R-3537.
- `packages/nana-pack/bin/worker-config.mjs`: only the fallback map's provenance reference changes to R-3537.
- `docs/code-map.md` and `docs/requirements-tree.md`: regenerated using their generators.
- This folder retains the continuation brief, previous blocked attempt and current command logs.

Main's R-3530 and R-3531 rows and tests remain byte-identical to main. No assertion, behavior, sealed value, test title or evidence citation changes. No new test or mutation pair is needed for this ID-only repair and behavior-preserving merge. Earlier wrong-code pairs remain in the existing build and seat records; none was rerun here.

Historical briefs, reports, review movement and failed trace logs retain the IDs used at their recorded revisions. They are historical evidence, not live contract references. The plan has no colliding ID references to update.

## Preservation and known bugs

`merge-2b-preservation.log` proves zero unrelated differences from main, unchanged main rows and tests, and main's complete session archive plus exactly one whole lane entry. This continuation does not edit the archive.

The pending merge already contains exactly the four authorized FEAT-041 review-round-1 known-bug lines: checker lineage, missing output usage, dash-prefixed brief handling and older-checkout compatibility. They remain present without further edits. No known bug is fixed. Other supplied known bugs remain unchanged.

Precedent: the standing requirements format and evidence markers remain intact. Whole session entries remain newest-first. Departure: the brief explicitly authorizes renumbering two lane IDs despite the usual stable-ID rule, to resolve collisions with main. No helper is added, copied or moved.

## Commands and exits

All command logs use the `merge-2b-` prefix in this folder.

| Command | Exit | Result/log suffix |
| --- | --- | --- |
| `npm run map:impact -- packages/nana-pack/bin/worker-config.mjs` | 0 | `impact.log` |
| `npm run map` | 0 | `map-generate.log` |
| `npm run req:tree` | 0 | `tree-generate.log` |
| `node scripts/test.mjs nana-roster.test.mjs nana-roster-set.test.mjs roster-notice.test.mjs worker-claude.test.mjs seat-rule.test.mjs` | 0 | `touched-tests.log`: 5 PASS files; 101 pass, 0 fail, 3 skip |
| `npm run map:check` | 0 | `map-check.log` |
| `npm run readme:check` | 0 | `readme-check.log` |
| `node scripts/requirements-trace.mjs` | 0 | `trace.log`: 2443 rows, 2186 implemented and traced; 0 off-form |
| `node scripts/requirements-tree.mjs --check` | 0 | `tree-check.log` |
| `node scripts/known-bugs.mjs --root .` | 0 | `known-bugs-check.log` |
| Read-only preservation comparison | 0 | `preservation.log` |
| Imported trace title validation | 1, then 0 | First invocation exposed the CLI shim's stdin argv guard; clearing argv before dynamic import succeeds. `title-check-attempt.log`, `title-check.log`: 0 missing or invalid; no duplicate IDs |
| `git diff --cached --check`, `git diff --check origin/main` | 2, 2 | Existing whitespace in inherited main logs and prior lane logs; preserved, not repaired |
| `git diff --check` | 0 | No new unstaged whitespace; `new-whitespace.log` |

The first identity scan after staging exited 1 on six new log files containing absolute local paths. Those paths were replaced with `<worktree>` without changing diagnostics or results, including two logs from the blocked attempt. The clean scan output is retained in `merge-2b-identity-scan.log`. The known-bugs check exits 0 with no name findings and one pre-existing FEAT-013 size notice; that file remains identical to main. All required checks run again on the merge commit before push; final command exits and pushed SHA are reported in the final response.

## Not done

CI covers the full suite; no local full suite was run. The three Windows-only touched checks skip on macOS and remain for CI. No model sessions, subagents, issue operations, real roster edits or writes to the prohibited folders. No install or land operation is performed in this behavior-preserving merge continuation. No additional review is launched by the builder.
