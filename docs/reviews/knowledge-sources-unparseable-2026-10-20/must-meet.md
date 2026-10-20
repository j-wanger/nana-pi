# knowledge-sources-unparseable: must-meet

Feature: FEAT-003 · Index and connect existing knowledge sources
Behaviour: a sources.json that exists but cannot be read or parsed never empties the index. A sources.json saved with a byte-order mark or as UTF-16 indexes like its plain UTF-8 copy.
Class: install, hook or gate (hook). The Claude Code UserPromptSubmit hook runs bin/nana-knowledge.ts. The pi extension spawns it. Both start lib/build.ts in the background each hour. Full ladder, and install-check on macOS before nana-land.
Threat model: honest editor, shell and platform variation is in scope. That covers a UTF-8 mark (Notepad, PowerShell 5 Set-Content -Encoding UTF8) and UTF-16LE/BE with a mark (PowerShell 5 redirection and Out-File). It also covers a single-backslash Windows path, a missing or trailing comma, a file read mid-save (empty) and a file that exists but cannot be read. A forged sources.json is out of scope.

## Today (main 72abe19a; probed in a temp copy with a temp HOME and NANA_KNOWLEDGE_HOME)
- lib/sources.ts parses with plain JSON.parse. On any error except ENOENT it returns no roots. The purge in lib/build.ts then reads every row's root as "left sources.json" and deletes the row.
- After a good build (`files 1 · rows 1`), the same JSON was re-saved six ways: with a UTF-8 mark, as UTF-16LE, with a C:\ path, with a trailing comma, as an empty file, and replaced by a folder. Each `build` printed `removed 1` and exited 0, and `query` then printed `(no hits)`.
- `build --rebuild` on the C:\ file also left `(no hits)`. `status` printed only `sources <file>`.
- A prototype of the design below, in the temp copy, turned every case green. The discovery, incremental-build and unreadable-root test files still passed.
- Under the prototype, keying the keep-rows rule on an empty root list kept the row for `{"roots":[]}`. So R-2376 catches that mistake.

## Design
- sources.ts reads the file's bytes and decodes them with nana-pack/lib/json-text.mjs parseJsonBytes. That strips one leading mark and picks UTF-16 by its mark.
- ENOENT still seeds the file. Any other read error gives problem { kind: "unreadable" }.
- A parse error gives { kind: "unparseable", ...jsonParseFailure(err) }: the place and the repair, never the parser's text.
- One exported formatter in sources.ts gives the marker text. The marker words are named constants with a provenance comment (contract values, R-2372 and R-2375):
  `UNPARSEABLE at line L, column C (no roots read, rows kept). <FORWARD_SLASH_ADVICE | MANUAL_JSON_ADVICE>`
  The " at line…" part is dropped when V8 reports no place.
  `UNREADABLE (no roots read, rows kept)`
- build.ts: with a problem, skip the --rebuild delete and send every existing row through the existing preserved branch.
  The meta rows still refresh, so the hook does not start a doomed build on every prompt. BuildStats carries the problem.
- CLI build prints `  <sources file>  <marker>` on stdout before the MISSING lines. CLI status calls loadSources and prints `sources <file>  <marker>`. Both exit 0.
- Also update:
  - the README's sources.json section, including the --rebuild exception;
  - the README's Dependencies paragraph, which now names two sibling files;
  - the three module headers;
  - REQUIREMENTS.md, with the rows inserted after R-1915;
  - req:tree and map.

## Must-meet: packages/nana-knowledge/tests/sources-file.test.mjs
No skip: every case exists on every platform.
Fixtures, written as bytes:
- F1, bad escape: `{\n  "roots": [\n    { "path": "C:\Users\x\docs", "kind": "articles" }\n  ]\n}\n`. V8 reports line 3, column 19.
- F2, a missing comma between two root objects. V8 reports line 4, column 5.
- F3, a trailing comma after the last root. V8 reports no place, and its message quotes file text.
- F4, an empty file. V8 reports no place.
- Unreadable stand-in: a folder at the sources.json path. Node's docs say reading a folder errors on macOS, Linux and Windows.

| Row | Requirement | Test title | Red today |
|---|---|---|---|
| R-2370 | WHEN sources.json starts with a UTF-8, UTF-16LE or UTF-16BE byte-order mark, the build shall index the same roots it indexes for that JSON saved as plain UTF-8. | R-2370: a sources.json with a UTF-8, UTF-16LE or UTF-16BE byte-order mark indexes its root like its plain UTF-8 twin | red: the UTF-8-mark and UTF-16LE probes read no roots. Each variant gets a fresh home, so keeping old rows cannot pass it. |
| R-2371 | IF sources.json exists but does not parse as JSON, THEN the build shall remove no indexed row. | R-2371: a sources.json that does not parse, including an empty one, removes no row and a later query still hits | red: the F1, F3 and F4 probes printed removed 1, then (no hits). F2 takes the same branch (inferred from the code). |
| R-2372 | WHEN sources.json does not parse, the build command shall print one line that marks the file UNPARSEABLE with the parser's line and column when reported and the forward-slash repair for a bad escape or the manual JSON repair for a missing or trailing comma, with no text from the file, and exit 0. | R-2372: build names an unparseable sources.json with its place and repair and exits 0 | red: today's build prints no such line |
| R-2373 | WHEN sources.json exists but does not parse, the status command shall mark the sources file UNPARSEABLE and exit 0. | R-2373: status marks a sources.json that does not parse UNPARSEABLE and exits 0 | red: status printed `sources <file>` only |
| R-2374 | IF sources.json exists but does not parse, THEN a rebuild shall keep the existing index instead of deleting it. | R-2374: a rebuild with a sources.json that does not parse keeps the index searchable | red: the rebuild probe left (no hits) |
| R-2375 | IF sources.json exists but cannot be read, THEN the build command shall keep every indexed row, print the file marked UNREADABLE, and exit 0. | R-2375: a sources.json that exists but cannot be read keeps every row and is named UNREADABLE | red: the folder probe printed removed 1 |
| R-2376 | WHEN sources.json parses and lists no roots and no discover block, the build shall purge every indexed row. | R-2376: a sources.json that parses with no roots and no discover block still purges every row | green today on purpose: it catches a keep-rows rule keyed on an empty root list (probed). The R-207 test drops one of two roots, so it cannot. |

- R-2372 builds the three expected lines for F1 to F3 itself, with FORWARD_SLASH_ADVICE and MANUAL_JSON_ADVICE imported by name. It asserts that each line appears exactly once on stdout. It does not compare the whole output.
- Missing-file seeding stays pinned by discovery.test.mjs (R-240 and the seed checks). Root-removal purge stays pinned by R-207.

## Known limits
- While sources.json stays broken, no root is scanned. New and changed files are not indexed, and deleted files keep their rows until the owner repairs it.
- A file that parses with the wrong shape still reads as no roots and purges. Examples: roots that is not an array, a misspelt key, a top-level null (probed: null removed the row, on main and under the prototype).
- The doctor knowledge row and nana-setup project's refresh summary do not show the marker. Four building lanes edit doctor.mjs, and project shows only the totals line.
- The hooks' background build discards its output. So the owner sees the marker only from a hand-run `build` or from `status`.
- status prints UNREADABLE for an unreadable sources.json, but no check pins it.
- The forward-slash repair for a control character or a bad Unicode escape (a lowercase c:\users path) comes from json-text's shared classifier. R-1971, R-1972, R-2090 and R-2091 pin it; this lane does not.
- UTF-16 with no mark, two marks or an odd byte count reads as unparseable, per json-text's R-2236 contract. Its rows are kept and the line gives the manual repair.