# UI brief build record

## Changes

- `docs/ui-brief-template.md`: adapted the supplied source; retained the exact library URL, capture guidance and builder image handoff.
- `packages/nana-setup/claude/rules/nana-seat.md`: added the UI brief bullet immediately after visual-reader.
- `packages/nana-setup/tests/seat-rule.test.mjs`: added RULE_17 and three tagged checks, R-3161–R-3163.
- `REQUIREMENTS.md`: updated R-1140's count, behavior and evidence; added R-3161–R-3163 under FEAT-039 as implemented after their tests passed.
- `checks.txt` beside this record: complete local check output, including mutation failures and restored passes. Home paths are normalized.

## Test changes and wrong-code pairs

The existing closed-list test now includes RULE_17 because the old list would reject the required bullet.
The existing sixteen-bullet comment now says seventeen; ROLE_RULE remains additional.
No existing assertion was otherwise changed. No test was deleted. No tunable was added.

Before implementation, all three new checks failed against the unchanged guide and missing template (exit 1).
After implementation, each mutation ran in an OS temporary fixture, with a 30-second child limit:

| Row | Wrong implementation | Wrong / restored exit |
| --- | --- | --- |
| R-3161 | Omit the new guide bullet | 1 / 0 |
| R-3162 | Replace the image-opening instruction with reading descriptions | 1 / 0 |
| R-3163 | Restore the source's unbounded gates | 1 / 0 |

Manual format probes passed with CRLF, trailing space/tab on the ending blank line, and no final newline (each exit 0).
These probes added no suite test and wrote fixtures only outside the repository.

The first trace run caught a missing stacked R-1140 marker on its new cited check.
The marker was added; the complete trace test then passed.

## Commands

All commands below passed with exit 0 before committing; full output is in `checks.txt`.

- `node packages/nana-setup/tests/seat-rule.test.mjs`
- `node packages/nana-pack/tests/rulings.test.mjs`
- `node packages/nana-pack/tests/planner-prompt.test.mjs`
- `npm run -s map:check`
- `npm run -s readme:check`
- `node --experimental-strip-types packages/nana-pack/tests/requirements-trace.test.mjs`
- `nana-writing docs/ui-brief-template.md`
- `node packages/nana-setup/bin/install-check.mjs`

Writing summary: `sentences=42 words=458 over=0 passive=0 banned=0 verdict=n/a identifiers=0`.
Map: 613 modules, zero problems. README: 1090 claims, zero problems.
Trace: 2534 total rows, 2277 implemented and traced; zero EARS rows off form.

## Precedent and scope

Read all four plan precedents, the source template and the complete adversarial attack.
Followed the bullet-constant, exact-once and closed-list pattern, absolute path form, and Markdown template headings/lists.
No helper was copied; none was needed from a precedent file.
No precedent departure was needed.

The plan lists HANDOFF.md, but the builder brief expressly forbids changing it; it remains untouched.
Read the complete FEAT-039 known-bug file. This change touches none of its listed bugs and closes none.
No images, credentials, issues or session archives were read or changed as part of implementation.
No full suite was run: AGENTS.md delegates it to CI. No push or CI read was performed.
The seat still owns independent review, pushing, and CI verification.
