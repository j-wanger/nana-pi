# Response to sol plan review r1 (SEND-BACK, 6/10) — seat, 2026-10-11

Every finding was checked and taken. `CHANGE.md` now reads:

| Finding | Change |
|---|---|
| MUST forged stamps | New R-1027: the suite rebuilds each stamp from the ledger at its stamped commit with `git show` (row set, own-or-shared marks, statuses, fingerprints, purpose, feature status). New R-1028: a closed schema with the rating enum `solid`, `mostly solid`, `partial`, `weak` (the prototype's four values) and the declared prose fields. New R-1029: a feature with no assessment shows as unassessed (FEAT-039 included) and gets a packet; a missing assessment is not a suite failure, so a new feature never forces a store edit. CI already checks out with `fetch-depth: 0`. |
| MUST row moving home stays current | R-1021 treats a change in any stamped row's own-or-shared mark as stale and names the row; mutation pair added. |
| MUST ask body dropped | R-1018 lists each entry's full body; the shared parser returns it. |
| MUST malformed asks vanish; parsing duplicated | The shared lib holds ONE entry parser returning every entry or a named parse error; `nana-frontier` consumes it and keeps its wall-clock check; new R-1031: the report refuses a malformed entry, naming the line. |
| MUST refresh has no row | New R-1030: `--packets <dir>` writes one packet per out-of-date or unassessed feature with the named contents, byte-identical across runs. |
| MUST ID clause cannot fail alone | R-1024 checks ASCII digits only; the ID clause and its mutation are gone. |
| MUST R-1013 hardcodable | Temporary git repositories (clean, tracked change, untracked file) checked against values the test reads itself, and an injected failing git runner that must make the command refuse; the module takes an injectable repo root and git runner. |
| SHOULD closed schema | Declared in §3, with the prose fields named; R-1028 pins it. |
| SHOULD template path | `scripts/product-report/template.html`, read from disk by the module. |
| SHOULD two halves of HTML safety | Pinned separately (§4): one parseable data script under hostile text; the renderer, against an injected document stub, uses text nodes only. |
| SHOULD "status" vs ratings | Outcome 2 says "ledger status"; ratings are stored. |
| SHOULD checkpoint 1b | the owner, 2026-10-11: "Yes" — recorded; the builder adds the share line. |

Rows now R-1012–R-1031 (20); the real-ledger literal becomes 1,044 rows.
