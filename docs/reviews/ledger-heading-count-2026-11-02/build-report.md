# Build 1 technical record

## Scope and rows

- Feature: FEAT-031. Rows R-3680 and R-3681 were added as planned before changing the checks, then marked implemented after the named assertions passed.
- `REQUIREMENTS.md`: adds those two rows, with backticked `file::title` evidence.
- `packages/nana-pack/tests/requirements-tree.test.mjs`: changes only the two named checks, appends their row IDs to existing req lines, and adds test-local oracle/comparison helpers and the Node assert import. No other check changed; both titles remain unchanged.
- `docs/code-map.md` and `docs/requirements-tree.md`: regenerated through `npm run map` and `node scripts/requirements-tree.mjs --write`, both exit 0.
- This folder: hand-run proof driver and Windows evidence. No new suite check, production code, tunable, or exported helper.

## Oracle and comparison

`ledgerHeadingLines` scans raw lines with `/^(#{1,3}) ((?:CAP|FEAT|SUB)-\d+)/`, strips an initial BOM, and reports ID, 1-based line and level. R-288 compares the complete ordered ID/line lists with `deepStrictEqual`, requires levels 1, 2 and 3, and retains every parsed heading's non-empty purpose check. No heading count is sealed.

The oracle is deliberately broader than the parser's exact ID-width, middle-dot and non-empty-label regex. It includes every parser-recognized structural heading form. It does not support indentation, a fourth heading level, or other ID prefixes, as specified by A2. It scans heading-looking lines even in fences; no such lines occur in this ledger. All-level presence guards emptiness, not override authenticity.

R-1158 explicitly normalizes LF first and derives CRLF from LF. `deeplyEqual` invokes `deepStrictEqual` and returns a boolean for the existing non-throwing `check` harness. It compares the entire parsed object, including Maps, Sets, raw normalized lines, every heading field and references, plus the problem lists. The synthetic two-feature fixture half remains byte-identical.

## Mutation pairs and runs

`node docs/reviews/ledger-heading-count-2026-11-02/prove.mjs`: final exit 0, native win32. Each child has a 120-second synchronous limit. Parser mutants ran before the first green touched-file suite run and were restored in `finally`. No assertion was inverted.

- M1, `m1-win32.txt`: dropping exactly one FEAT produces `FAIL R-288: all real headings have non-empty purposes`, with all levels still present.
- M1: shifting the first heading line by one, count unchanged, produces that same named FAIL.
- M1: blanking CAP-01's purpose produces that FAIL and `FAIL R-288: real ledger has no structural problems`.
- M1: adding unused FEAT-899 and R-9998 under the first capability produces `PASS R-288: all real headings have non-empty purposes` and `PASS R-288: real ledger has no structural problems` without editing the test. The committed-outline checks fail as expected; their exact lines are separate in the record. The whole-file exit is not used as assertion evidence.
- M1: LF, CRLF, heading trailing space/tab and no-final-newline inputs each produce both named R-288 PASS lines.
- M2, `m2-win32.txt`: retaining a CR in the first heading label only produces `FAIL R-1158: a CRLF ledger gives the same problems and line numbers as its LF copy`, despite equal synthetic problem lists.
- M2: LF, CRLF, heading trailing space/tab and no-final-newline inputs each produce that named R-1158 PASS line.
- M3, `m3-win32.txt`: heading-count comparison grep exits 1, no matches.
- Initial proof-driver attempts exited 1 because they selected the introductory prose purpose and inserted before the first capability. The driver now targets CAP-01's purpose and the second anchored capability. No failed attempt was treated as evidence.

The exact replacements and named assertion lines are in the two mutation records. Fixtures remain outside the repository. The hand-run driver temporarily changes only the parser and restores its original source. `git status --short` and `git diff -- scripts/` confirmed no scripts change before commit.

## Commands and checks

`build-1-green.txt`: `node scripts/test.mjs packages/nana-pack/tests/requirements-tree.test.mjs`, exit 0; 1 file PASS, 98 checks pass, 0 fail, 0 skip.

`checks.txt` records these commands, each exit 0:

- `npm run map:check`: 590 modules, 0 problems.
- `npm run readme:check`: 1064 claims, 0 problems.
- `node scripts/requirements-trace.mjs`: 2435 rows, 2179 implemented and traced; 0 off form.
- `node scripts/requirements-tree.mjs --check`: 0 problems.
- `node scripts/known-bugs.mjs --root .`: names=0, sizes=1; existing unrelated size note, exit 0.
- `node scripts/identity-scan.mjs --root .`: 0 findings.
- `node scripts/lane-class.mjs --root . --base origin/main`: ordinary.

The record suppresses Node's module-format warning to keep local filesystem paths out of committed text. The same checks must also run on the final commit before push.

## Precedent and remaining work

All three Precedent files were read. The movement test uses fixture ledgers and pins no real-ledger heading count. The existing synchronous `check`, `crlf`, temporary fixture and ledger override patterns were retained. No Precedent departures and no authorized exports were needed.

The complete FEAT-031 known-bug file was read. This change touches none of its listed bugs; it closes only the heading-count coupling named in this brief.

CI covers the full suite under `AGENTS.md`. No local full suite, seat script, model session, GitHub API call or issue operation ran. Push the final branch and stop without reading CI.
