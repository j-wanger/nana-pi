# knowledge-pull-fail-open-pin: must-meet

Feature: FEAT-004 · Retrieve relevant context with provenance

The feature in one sentence: in pi, a pull whose child exits non-zero, prints nothing or only whitespace, is still running past the handler's deadline, or is missing injects nothing and throws nothing out of the handler; pi's pulls log source pi and dedup on pi's session id; and the hook command reads a payload of exactly 256 KB but cuts one byte more and prints nothing.

Why it matters: the pull runs on every prompt. pi has no handler timeout, so the handler's fail-open is the only guard. Checks 5, 5b and 6 call makePull directly; no test runs a failed child through the real handler, and none runs a non-zero exit or empty output. The stdin cap guards the Claude Code seat, where a large paste reaches the hook unsliced (inferred from the hook JSON; pi slices to 8 KB first).

Scope cut: the spec also named R-883, R-207, R-203 and R-235. The tree homes them in FEAT-003, and a lane is one feature. They go to a separate pin lane; the seat records the carry. No new row: R-1830 to R-1839 stay unused.

Class: ordinary, as knowledge-refresh-pin was. Tests, rows and the code map only; extensions/, lib/ and bin/ stay byte-unchanged. If a check reds because of extension or hook code, the builder stops and reports; that fix becomes a hook-class lane. No nana-setup file changes, so no install check.

Threat model: honest variation in scope: macOS, Linux and Windows on Node 22; a child that crashes after printing, prints nothing or whitespace, hangs past the deadline, or is missing; a large Claude Code paste. Deliberate forgery out (a hostile stub, a forged pull.log).

## Design
- Pin, not change. Row text stays; status flips to implemented; evidence names the checks.
- R-234 and R-895 run through the REAL handler. The default export builds its pull with no options, so the test copies extensions/nana-knowledge.ts and lib/tokenize.ts into a temp tree each run, writes `{"type":"module"}` as that tree's package.json (the real package's module type, so no syntax detection), imports the copy once and registers its handler. Each case rewrites the stub bin/nana-knowledge.ts. Wrong code in the source reaches the copy.
- Case order: missing first (no stub written yet; node exits 1), control (prints a block, exits 0; must inject, so a copy that never injects cannot pass), non-zero (prints a block, exit code 3), silent, whitespace only, late last (prints a block after STUB_LATE_MS, 10 s). No stub file is deleted after a kill.
- uncaughtException and unhandledRejection listeners count escapes during the cases; a handler rejection counts too. The block sits after check 4 and before check 5, so a callback that rethrows fails R-895 before check 5 crashes the file.
- R-234 also marks the existing 5b null check: the only proof the handler's OWN timer settles a child whose callback never fires.
- R-896: markers on four existing checks (2 session id, 2 source pi, 3 same-session dedup, 4 other session pulls). No new check.
- R-228: a seal check pins 256 KB. A behaviour check runs the CLI twice (fresh session ids, NODE_NO_WARNINGS=1) with a padded payload of exactly STDIN_MAX_BYTES (prints the block) and one byte more (exit 0, no stdout, no stderr, last pull.log reason bad-json, which proves the empty output came from the cut). It reads the cap by name.

## Must-meet
| Row | Test (file::title) | Wrong code that reds it (probed) |
|---|---|---|
| R-234 | `packages/nana-knowledge/tests/extension.test.mjs::R-234: a pi pull child that exits non-zero, prints nothing, outlives the deadline or is missing injects nothing` | W1, W2, W3, W7, W10 |
| R-234 | `packages/nana-knowledge/tests/extension.test.mjs::5b: a child whose callback never fires still yields null` (existing) | W6 |
| R-895 | `packages/nana-knowledge/tests/extension.test.mjs::R-895: a pi pull child that exits non-zero, prints nothing, outlives the deadline or is missing throws nothing out of the handler` | W4 |
| R-896 | existing extension.test.mjs checks `2: pull.log carries the pi session id`, `2: pull.log carries source "pi"`, `3: same prompt, same session → undefined`, `4: a different session id pulls again` | P1, P2 |
| R-228 | `packages/nana-knowledge/tests/hook.test.mjs::R-228: seal: STDIN_MAX_BYTES is 256 KB` | H1 |
| R-228 | `packages/nana-knowledge/tests/hook.test.mjs::R-228: the hook command reads a payload of exactly STDIN_MAX_BYTES and cuts one byte more, printing nothing` | H2, H3, H4 |

Row text (unchanged): R-228 Stdin shall be capped at 256 KB. R-234 IF the child times out on the handler's own timer, exits non-zero, is missing or prints nothing, THEN nothing shall be injected. R-895 IF the child times out on the handler's own timer, exits non-zero, is missing or prints nothing, THEN no throw shall escape. R-896 Pulls from pi shall log source pi and dedup on the pi session id.

## Red today (adversary probe: main 02f1c139, temp clone, temp HOME, macOS, Node 22.22.2)
- Nothing is red; the behaviour works. Pin lane. Drafts: extension.test.mjs 38 PASS (36 before), hook.test.mjs 98 PASS (96 before), both green through scripts/test.mjs. Trace exit 0 after the flip; the tree regenerates unchanged; map:check and readme:check green.
- Wrong code, each probed: W1 `if (err && !stdout.trim())`: R-234. W2 no trim: R-234, R-1712. W3 handler injects on null: R-234, checks 3, 8, 11. W4 callback rethrows: R-895, then the file crashes at check 5. W6 own timer drops done(null): 5b; the new block stays green. W7 TIMEOUT_MS 60000: R-234. W10 default export calls makePull({ timeoutMs: 60000 }): R-234 (only a handler-level test sees this). H1 cap 512 KB: seal only. H2 no break, H3 `>=`, H4 push before the cap test: behaviour. P1 no source, P2 constant session id: checks 2 and 4.
- Notes: missing 28 ms, control 49 ms, non-zero 50 ms, silent 43 ms, whitespace 49 ms, late 2003 ms. At cap 262144 bytes printed 324 chars; 262145 printed 0, reason bad-json; stderr empty with or without NODE_NO_WARNINGS.

## Known limits
- "Missing" at the handler means a missing CLI file (node exits 1). A missing node binary (spawn ENOENT) cannot be made here.
- W5 (stdin error listener removed) stays green: the 8 KB payload fits the pipe before the stub exits. Unpinned.
- The late case pins a deadline under STUB_LATE_MS, not the 2 s value: TIMEOUT_MS 9000 stays green. No row seals TIMEOUT_MS.
- The copy list must follow the extension's imports. A new import crashes the block (loud red).
- R-228 pins the outcome at the boundary, not memory: reading all stdin then slicing stays green.
- Windows: no new check has run there; green is inferred. The draft PR's Windows leg is required evidence before the final review.
- The late case adds about 2 s to extension.test.mjs; no new check asserts a time bound.

## Conflicts and files
- Files: packages/nana-knowledge/tests/extension.test.mjs, packages/nana-knowledge/tests/hook.test.mjs, REQUIREMENTS.md, docs/code-map.md.
- No in-flight branch touches packages/nana-knowledge or these four rows (checked against each branch's merge base; their REQUIREMENTS.md hunks sit far from these rows). docs/code-map.md moves in every lane: regenerate after merging main. docs/requirements-tree.md does not change. No wait.