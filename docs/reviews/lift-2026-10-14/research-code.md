# Research A — what the lift can reuse, the mapping, and the proof

nana-pi main `d9cf0bc`, 2026-10-14. Read only; written only under `plan-lift/`. Stakes: high-blast. The lift rewrites another project's contract file, and a lost or changed row is silent without a proof.
"Ran" = run here by `plan-lift/research-code/probe.mjs` (output `probe-output.txt`, numbered items) or the git probe in `research-code/gitprobe/`. INFERRED = not read or run. Cites without a file name are `scripts/requirements-tree.mjs`.

## 1. Answer in brief

- Import seven functions and one constant from the tree module, plus `requirementRowId` and `ID` from the trace shim. Export three private names from the tree module (`export` keyword only). Copy nothing. The req-tree `move.mjs` and `prove.mjs` are one-off scripts with fixed SHAs and a 3-digit row regex. Reuse their ideas, not their code (§2).
- One mapping format serves both callers. The mechanical default is a generated mapping file. The regroup agent edits or writes that same file. One apply step reads it (§4–§5).
- Rows are keyed by ID. Non-row text is keyed by the old heading line that opens its section. Every old heading is named exactly once.
- The proof is a separate module. It never calls the apply step and checks invariants on the output. It checks each old line's fate, row bytes with their terminators, the ID multiset, that no line is new except declared ones, homes and order, and that `checkTree` finds no problem (§7).
- Reserved general-engineering nodes take their text and G-row homes from the shared seed via `parseLedger` (Ran 14). The mapping marks them `general` and does not retype their text.

## 2. Import, never copy

| Symbol | Where | Lift use |
|---|---|---|
| `parseLedger` | `:60-119` | `lines` (BOM stripped, split on `/\r?\n/`, `:61`); `allHeadings`, including non-tree headings with `level`, `label` and `line` (`:49,:54,:64`; Ran 12); `opaque` (fences, `:30-58`); `tables` and `rowLines`; `rowsInTables` |
| `checkTree` | `:428-446` | the final gate on the output. Flat test: `problems` deep-equals `[noTreeProblem(n)]` (Ran 7). This is exactly R-1159's condition (`:434,:442-443`), so a near-miss heading (R-1161) is never taken for flat |
| `noTreeProblem` | `:416-418` | the flat test above |
| `ledgerReadProblem` | `:423-427` | refuse the input on a NUL byte (UTF-16) or no rows, in R-1160's words |
| `readRequirementRows`, `descendants` | `:231-249`, `:250-256` | the proof's home check: each output row's table heading, and SUB under FEAT |
| `expandRowIds` | `:296-315` | mapping row lists may use en-dash ranges. Order is kept; a hyphen range is refused (Ran 11) |
| `renderOutline` | `:267-295` | optional plan preview of the output tree (about 5 lines per node) |
| `REPO_ROOT` | `:15` | locate `templates/_shared/requirements-general.md` for the reserved nodes |
| `requirementRowId`, `ID` | `requirements-trace.mjs:21,25` → `templates/typescript/template/tests/requirements-trace.ts:63-69,:45` | the rail's own row recognizer. It ignores a trailing CR (Ran 8). Map it over every line, fenced lines included, for the ID multiset, as `:407-413` and the rail do |

- **Do not use:** `compressRowIds` (`:209-230`): it sorts and dedups (`:218`; Ran 11), so it loses file order. Write ranges only for runs that are consecutive in mapping order.
- **Do not use:** the report's `normalise` (`product-report.mjs:23`): it strips trailing whitespace, which would hide a one-byte change.
- **Do not use:** the report's HEAD comparison (`:265-267`): it is lax and fails in a subfolder (§8).
- **Export, surgically:** `TABLE_HEADER` (`:20`), `TABLE_DELIMITER` (`:21`) and `markdownTableCells` (`:23-27`). The apply step emits the canonical header without retyping the literal. It also recognizes an old padded header as a table-structure line.
- **Keep private:** `countRequirementRowLines` (`:407`). The lift needs IDs, not a count.
- The lift needs Node 22.18 or later, because the `.ts` import comes through the shim (`requirements-trace.mjs:21`; tree `CHANGE.md` §5).

## 3. What the parser forces on the lift (Ran unless cited)

1. A raw split that keeps terminators (`body.split(/(?<=\n)/)` after the BOM strip) lines up 1:1 with `parsed.lines`, for LF and for CRLF+BOM (Ran 1). Work on parsed indexes; copy raw segments.
2. A title `#` above a lifted feature gives a nesting problem (Ran 2; `:155-169`). The tree needs a capability above every feature.
3. A padded header, even one trailing space, orphans every row of its table. `:68` compares the header byte-exact (Ran 3). Regenerate every table header.
4. A blank line inside a table orphans the rows after it (Ran 4; `:73-76`).
5. These orphan the rows below them: a level 4–6 heading, a setext heading (prose, then `---`), or any old non-tree heading between a leaf heading and its table (Ran 5, 13). The nearest-heading check resets at every heading (`:127`). Old headings therefore cannot be carried; they are replaced.
6. A row inside a code fence counts for the rail and `:407-413`, but the checker refuses it (`:132-135`; Ran 6). The lift cannot fix this, so it refuses and names the line.
7. The parser reads carried prose that starts with `Purpose:`, `Outcome:`, `Status:` or `Also applies:` as a field (`:87-98`). A carried `Also applies: R-010` silently creates a share. A carried `Status:` becomes a duplicate (`:186`). Refuse such carried lines and name each one.
8. The checker does not need `Outcome:` (Ran 10), but the report's product view prints it (`product-report.mjs:81,255`). The mapping requires it for a capability.
9. The shared seed parses cleanly. It gives CAP-90, FEAT-900 and SUB-900 to SUB-904 with labels, purposes, outcome and status, and each SUB's G rows (Ran 14; `requirements-general.md:13-86`).
10. Two claims are stale since `d2e010d`: "root-locked" and "LF only" (`research-adopt.md` §2). See `:61` and `:452-465`.

## 4. What the mapping must express

- **The pin.** A `sha256` of `parsed.lines.join("\n")` and the row count. This is the LF form: one ledger approved on macOS and applied from a Windows CRLF worktree hashes the same. Line numbers are also CRLF-blind (R-1158).
- **Nodes in output order.** Each node has `id`, `label` and `purpose`. A capability adds `outcome`; a feature adds `status` and an optional `also_applies`. Then come children (`features`, `subgroups`).
- **Leaf rows.** An ordered list of IDs, authoritative in that order. Moves are implicit. The apply step derives and prints the rows whose new home is not the node that carries their old section, so the owner sees every move without the agent declaring it. The tree-b precedent declared moves explicitly (`prove.mjs:65-85`). That checked a tree-to-tree delta, which the lift does not have.
- **`from`.** The old heading lines whose sections' non-row lines travel to this node, as `{line, heading}`. The line number distinguishes repeated labels. The heading text lets a human read the mapping and lets the apply step check the pin. Old heading lines and old table header and delimiter lines are structure lines, and the apply step replaces them.
- **`head` and `tail`.** `head` is old lines kept verbatim before the tree (title, intro); it must hold no row. `tail` is a generated closing `#` heading, then old sections kept verbatim, heading included. Today those are `## Open questions` and `## Deliberate omissions` (seed `REQUIREMENTS.md.jinja:110-124`; skill `:126`).
- **`general: true`.** It marks the reserved nodes. The apply step fills their text from the seed. Each G row's subgroup is fixed by the seed's tables. A mapping that homes a G row elsewhere, or puts an R row in a reserved node, is refused (R-1151's shape; tree `CHANGE.md:234` residual 11).
- **The mechanical default.** One node per row-holding section, with rows in file order, `from` set to that section and a placeholder purpose. One synthetic capability goes above sections that sit under no Part. The regroup agent starts from this file. Because there is one apply step, two lift paths cannot drift.
- **Layout (one choice for the plan).** In order: the heading, `Purpose:`, then `Outcome:` or `Status:`, an optional `Also applies:`, the carried prose, then one canonical table. Carried prose keeps old order and its inner blank lines, with the ends trimmed. This is the req-tree precedent: notes before the table (`move.mjs:83-105`; req-tree `CHANGE.md:199-213`). It also removes headless fragments and padded headers.
  - The trade: prose that sat between or after table fragments moves above the table.
  - A common section (prose, then the table) diffs as a heading rewrite plus inserted lines only.
  - The alternative is to keep the section body in place. That gives a minimal diff, but a regroup could not reorder rows inside a carried section.

## 5. The smallest mapping file (JSON)

```json
{
  "lift": 1,
  "source": { "sha256": "<of the LF form>", "rows": 365 },
  "head": { "through": 11 },
  "tree": [
    { "id": "CAP-01", "label": "…", "purpose": "…", "outcome": "…",
      "from": [{ "line": 12, "heading": "# Part A. …" }],
      "features": [
        { "id": "FEAT-001", "label": "…", "purpose": "…", "status": "active",
          "from": [{ "line": 14, "heading": "## 1. …" }],
          "rows": ["R-001–R-016", "R-120"],
          "subgroups": [ { "id": "SUB-001", "label": "…", "purpose": "…", "from": [], "rows": ["R-017"] } ] } ] },
    { "id": "CAP-90", "general": true, "from": [{ "line": 600, "heading": "# Part G. …" }],
      "features": [ { "id": "FEAT-900", "general": true, "subgroups": [
        { "id": "SUB-900", "general": true, "from": [{ "line": 610, "heading": "## G1. …" }], "rows": ["G-001", "G-016", "G-002", "G-003", "G-017"] } ] } ] }
  ],
  "tail": { "heading": "# Open questions and deliberate omissions",
            "keep": [{ "line": 631, "heading": "## Open questions" }, { "line": 674, "heading": "## Deliberate omissions" }] }
}
```

- A feature with no rows and `status: "proposed"` serves the regroup's planned features (tree `CHANGE.md:211`).
- A node with an empty `from` is a new heading.
- Row text never appears in the file; the ledger stays the only copy (req-tree `CHANGE.md:124-127`).

## 6. Mapping validation (before the apply step; each failure names the item)

- **Encoding.** Strip a BOM before `JSON.parse`. Refuse a NUL byte (UTF-16 from Windows PowerShell 5.1 `>` or `Out-File`, the R-1160 wording). Refuse U+FFFD, which means an ANSI file read as UTF-8 (INFERRED: Windows PowerShell 5.1 `Set-Content` writes ANSI by default). Refuse CR or LF inside any string.
- **Pin and rows.** The pin must match. Every input ID appears once: duplicate IDs refuse up front, as the rail does (`requirements-trace.ts:237`). There is no unknown ID, and each ID passes `ID`.
- **Old headings.** Every old heading, fenced lines excluded, is named once: through `head`, `from` or `tail.keep`.
- **Prose placement.** No row in `head` or in a `tail.keep` section. No carried field-prefixed prose (§3.7). No fenced row (§3.6).
- **Reserved IDs.** CAP-90, FEAT-900 and SUB-900 to SUB-904 are used only with `general` (`requirements-organization.md:8-11`).
- **Existing tree headings.** A node that carries an existing tree heading (a partial tree) keeps its ID. The report's assessment store is keyed by feature ID (`product-report.mjs:185`).
- **Heading IDs and labels.** IDs that break the heading form are left to `checkTree`'s R-1161 line, which names the form.

## 7. The proof (`prove(inputText, mapping, outputText)`, its own module)

1. **Input.** `ledgerReadProblem` is null. Without `--mapping`, the input is flat by §2's test. A hand-built tree or a near-miss ledger needs an explicit mapping.
2. **BOM.** The output starts with a BOM exactly when the input does.
3. **ID multiset.** `requirementRowId` over every output line, sorted, equals the same for the input. Print the count.
4. **Row bytes.** Each output row's raw segment equals the input's segment for that ID, terminator included. The one declared exception: an input's unterminated last line gains the file's line ending when a line follows it, and the summary reports it. Inserted lines take the line ending of the line they follow, so a mixed file stays mixed.
5. **Every old line, once.** Each non-blank input line has exactly one fate:
   - a row (items 3 and 4);
   - a heading named once (§6);
   - a table-structure line (a header recognized by `markdownTableCells` and the delimiter after it);
   - prose found once in the output, in old relative order, between its node's heading and the next tree heading, or in `head` or `tail`.
   Each non-blank output line is either a consumed input line or a generated line that equals the mapping's own text. Generated lines are a tree heading, a `Purpose:`, `Outcome:`, `Status:` or `Also applies:` line, the canonical header or delimiter, or the closing heading. So no new row line and no stray line can pass.
6. **Homes and order.** `readRequirementRows(parseLedger(out))` puts each ID under its mapping leaf, in mapping order. `parseLedger(out).headings` equals the mapping nodes, in order, with their labels and purposes.
7. **Gate.** `checkTree(out).problems` is empty. Output: one summary line, as `prove-output.txt` does ("N rows preserved once; P prose lines carried; H headings replaced; I lines inserted").
8. **Mutation pairs (wrong code first).** Each change must turn the proof red:
   - the apply step drops a row;
   - it strips one CR;
   - it carries prose to the wrong node;
   - it emits a row-shaped line;
   - it reorders a leaf;
   - it skips a header;
   - it trims trailing space on a row.

## 8. Command and boundaries

- **Command form.** `node "$HOME/nana-pi/scripts/requirements-lift.mjs" --root <dir> [--mapping <file>] [--emit-mapping <file>] [--write]`. `--root` resolves as `:454` does. Exit codes are 0, 1 and 2, as `:449-467`. `$HOME` expands in PowerShell 5.1 (tree `CHANGE.md:94`).
- **Default run.** Plan and proof only, writing nothing. stdout is bounded to one line per node plus the moves. The limits it must fit: pi's 2,000 lines or 50 KB, and Claude Code's 30,000 characters (tree `CHANGE.md:14-15`). `--emit-mapping` writes the default mapping, the regroup's starting file.
- **`--write`.** It writes only when three things hold: the proof passes; `git -C <dir> status --porcelain -- REQUIREMENTS.md` is empty; and a re-read just before the write gives the proved bytes.
  - Ran, git probe: that status command is clean for a CRLF worktree under `core.autocrlf=true`, and it works from a subfolder.
  - Ran, git probe: in a subfolder, `HEAD:REQUIREMENTS.md` fails and `HEAD:./REQUIREMENTS.md` works. That confirms tree `CHANGE.md:225` (residual 2).
  - A folder with no git repository, or an untracked ledger, refuses `--write`.
- **Main guard.** Use the realpath form (`requirements-trace.mjs:58`), not `:487`'s resolve form, which exits silently through a link (tree `CHANGE.md:229`). Exit through `process.exit`, as `:487` does. The `.ts` import prints a `MODULE_TYPELESS_PACKAGE_JSON` warning (Ran, `probe-output.txt`; tree `CHANGE.md:228`).
- **Skill text.** The skill's flat-ledger text (`SKILL.md:128`) names no command. Adding the command must keep R-1154's pinned phrases (tree `CHANGE.md:144-146`).
- **Code map.** The new export lines touch a FEAT-028 module, so `map:check` and R-291's outline rerun.

## 9. Open for the plan

- Layout: prose before the table (recommended, §4) or the section body kept in place.
- G rows outside a Part G section: move them to their seed subgroup by rule (deterministic) or refuse. An R row inside old Part G is refused either way.
- A partial tree has no default mapping (recommended), because a feature after Part G would nest silently under CAP-90 (residual 11).
- The placeholder purpose prefix: "DRAFT —" (seed `REQUIREMENTS.md.jinja:78`) or "Not yet sorted" (tree `CHANGE.md:210`). It is one named constant with provenance.
- After a write, the mapping is the only readable record of a regrouped section's old headings, besides git. Where the project keeps it is the plan's call.
