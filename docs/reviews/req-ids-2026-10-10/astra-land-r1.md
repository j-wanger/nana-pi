## Land review

**Score: 7/10. One blocking compatibility regression.**

Reviewed `eeeca20..4111aa9`, including the previous tree-review record, implementation, release plan, and HANDOFF changes.

### MUST — Preserve valid row endings

**Locations:**
- `templates/typescript/template/tests/requirements-trace.ts:50–61`
- `templates/python/template/tests/conftest.py:58–65`, plus the changed row readers

The new near-miss validator rejects valid rows whose closing pipe is followed by whitespace.

TypeScript also rejects **every requirement row in a CRLF ledger**: splitting on `"\n"` leaves `"\r"`, so `line.endsWith("|")` fails.

Independent reproduction used this otherwise valid row:

```text
| R-001 | The tool shall work. | untested | — |
```

| Ending | Previous TypeScript | Current TypeScript | Current Python |
|---|---|---|---|
| LF | Accepted | Accepted | Accepted |
| CRLF | Accepted | **Rejected** | Accepted |
| Spaces then LF | Accepted | **Rejected** | **Rejected** |
| Tab then LF | Accepted | **Rejected** | **Rejected** |

Current failures report `REQUIREMENTS.md:1: malformed requirement row`.

This is not the declared missing-closing-pipe break: these rows **have** their closing pipe. It adds an unnecessary compatibility break and directly undermines the Windows priority.

**Required fix:** tolerate line terminators and trailing whitespace consistently in validation and parsing. Preserve the column-zero rule; do not remove leading indentation.

Add regression tests for both ledger files and both rails, covering three- and four-digit IDs. Keep genuinely missing closing pipes rejected. Submit the fix for independent review before merging.

### SHOULD — Make HANDOFF distinguish decisions from completed evidence

In `HANDOFF.md`:

- Replace “Windows is tested now” with an explicit instruction, such as “the owner requires Windows testing now.” Native Windows execution remains an acknowledged residual.
- Update “Both passed review” after the actual build and land verdicts. It cannot describe the current revision after this finding.

The surrounding queue correctly treats Windows CI, installation checks, and land-helper enforcement as unfinished work.

### NOTE — Requested scope and identity preservation

The core ID change matches the owner's request:

- All **1,012 existing requirement rows remain byte-for-byte unchanged**.
- Exactly two rows were added: `R-1000` and `R-1001`.
- New allocation starts at `R-1000`.
- Existing three-digit IDs remain valid.
- Four-digit R/G IDs work in rows, markers, tree counts, ranges, and sharing references.
- Leading-zero four-digit IDs, five-digit IDs, and non-ASCII digits are rejected.

The malformed-row detection is additional behavior, but it is explicitly declared and addresses the previously recorded silent-skipping problem.

### NOTE — Declared compatibility breaks

Requiring a closing pipe and reserving the column-zero requirement prefix are acceptable.

Both template ledgers explain the rules where project authors encounter them. They also show indentation as the escape for examples. The change declaration explicitly includes fenced examples and unrelated tables.

That acceptance **does not extend** to rejecting CRLF or whitespace after an existing closing pipe.

### NOTE — Release and downstream projects

The release plan matches the implementation:

- Main-push CI runs the suite before the release job.
- The release helper requires containment in `origin/main`.
- Template acceptance precedes the next patch tag.

No release is claimed complete.

The downstream follow-ups are appropriately separate: work-project needs its hand-maintained rail updated; basketball-geek needs a marker migration and Part G adoption, not a routine update alone.

### NOTE — Objective, governance, and prior record

I compared HANDOFF with `~/nana-agent-loop/OBJECTIVE.md`. Its objective, terminal-first priority, two seats, platforms, installation/hooks scope, and October 24 review date agree.

HANDOFF preserves the owner's acceptance checkpoint and outstanding sharing decisions. The previous tree-review record adds no production behavior and retains its narrow scope and limitations.

### Evidence

Independently executed:

- Seat verification: **zero mismatches**, Python exercised.
- Trace and tree test files: **both passed**, exit 0.
- Existing-row preservation comparison: **zero changed or missing rows**.
- Additional row-ending probes: reproduced the blocking regression.

I did not rerun the full suite or template acceptance. Their successful runs remain builder-reported evidence.

### Accepted residuals

- Lexical sorting of diagnostic ID lists.
- Indented rows remain outside the rail’s recognition.
- Context-free handling of reserved prefixes.
- Separate downstream migrations.
- Previously accepted tree limitations and pending owner decisions.

The row-ending regression is **not** an accepted residual.

VERDICT: SEND-BACK
