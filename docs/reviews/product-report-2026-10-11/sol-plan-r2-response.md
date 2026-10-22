# Response to sol plan review r2 (SEND-BACK, 7/10) — seat, 2026-10-11

| Finding | Change |
|---|---|
| MUST R-1027 passes without history | Now R-1026, pinned in a temporary repository with two ledger commits: stamp against the first while the second is checked out; a spy on the injected git runner must see `git show <full-hash>:REQUIREMENTS.md`; an unknown commit fails the suite naming the commit and saying "fetch full history". |
| MUST schema leaves identity open | R-1027 (renumbered) and §3 define the schema recursively: exact keys and types, a `version`, FEAT IDs, 40-hex commits, the rail's ID grammar, status, mark and rating enums, 64-hex SHA-256, ISO dates, one assessment per feature, each row once per stamp; duplicate-feature and duplicate-row mutations. |
| MUST R-1023 checks data the schema lacks | Dropped; the remaining rows renumber to R-1012–R-1030. R-1026 already verifies the whole stamped set. |
| MUST shared parser changes frontier | The lib returns every raw entry plus two independent results (frontier's existing tag rule; the report's title grammar); frontier applies only its tag and date rules, so its output is unchanged by construction; golden before-and-after fixtures pin it, including a valid tag with no parseable title and a tag on a continuation line. |
| MUST share line omits consumed contracts | Proposed line grows to R-287, R-288, R-289, R-290, R-292, R-293, R-294, R-878, R-1000; the owner re-decides it before the build. |
| MUST solid with planned rows | R-1024 includes `planned`. |
| SHOULD packet directory | R-1029 refuses a non-empty directory and writes exactly the current set; default in the gitignored output folder. |
| SHOULD history dependency | Declared in the README; the missing-commit failure names the commit and says to fetch full history. |
| SHOULD packet structure | Versioned JSON; its `assessment` field has the store's schema, checked by the same test. |

Rows now R-1012–R-1030 (19); the real-ledger literal becomes 1,043 rows.
