# Independent check — scrub-contracts at 0f8de8a0 (2026-10-21)

One independent agent (Claude, general-purpose, not the builder's lineage) probed the lane in scratch exports of 0f8de8a0 and of main 906fbb56, with made-up identity words injected through the scan's config parameter, and a temporary HOME for the install. It compared main's and the tip's readers over this repo's HANDOFF, the frontier fixtures and the other HANDOFF files on this machine.

Verdict: NO MATERIAL FINDING.

What held:
- Scan: `node scripts/identity-scan.mjs --root .` prints `summary files=3653 findings=0 totals=3756,2019,52,808` from the root and from `packages/nana-pack`; c63c9da7 gives 3655 files with 0 findings. `--write-allowlist` changes nothing at the tip. Made-up words are found in upper case, both possessives, POSIX and Windows path segments, hyphen, snake and camel parts, file names, CRLF, a BOM, a symlink target and ASCII inside a binary. 0 hits in 9,578 files of the installed pi package; random sha512 strings hit about once in 40,000, and the repo tracks no lockfile. No hidden owner word in files outside the allowlist.
- Asks heading: main's and the tip's split and frontier command agree on asks and findings for main's HANDOFF, its five frontier fixtures and 67 of 68 other HANDOFF files on this machine. The product report builds 23 asks and the same assessment states on both. "Open formats", a bare "Open", fenced, setext and "Opened for" headings stay unread.
- Writing title: main's and the tip's extractor give identical counts over the real transcripts of 2026-10-14 to 2026-10-21 (after mode: 3 attached sessions, 217 reports).
- Shipped text: AGENTS.md's region equals the shared section, framed as on main; templates-render passes 170 checks. On a project made by main's `nana-setup project`, the tip's `--check` prints `✗ AGENTS.md working region differs` and exits 1, and the tip's `nana-setup project` repairs it by changing one line. A fresh tip install into a scratch HOME exits 0; its files and the four SessionStart producers' output hold no owner word once the scratch path is stripped.
- Byte pins: the hook-backup sha256 is listed in retired-fingerprints.json; the skill-copy requirements fixture's hash is in skill-copy-history.json; `verifyFixture` recomputes the tool-profiles fixture hash with zero drift.
- The lane's test files pass in the scratch copy. "validateStore accepts the real repository without a store" fails there the same way on main (a scratch-export effect).

Findings (none MUST):
- SHOULD — the tokenizer misses a word glued to digits or an escape letter: `%2F` before a word in a file URL, `%5C` in an encoded Windows path, a JSON `\n` before a lower-case word, a word followed by a year, and UTF-16 or gzip files. No current file holds such a form. Seat: a known limit in FEAT-032's file; decoding escapes before the split is a later change if one is hit.
- SHOULD — `--write-allowlist` raises an existing record's count and adds any new record file, so one documented command lets a review or session file gain the owner's name and pass, against D4's promise. Seat: a known bug in FEAT-032's file. The records lane closes it: its row R-2518 fails any entry that is not byte-pinned or frozen-desk, and its plan makes the writer stop writing record entries.
- NOTE — the plan's S1 limit occurs on this machine: one of 68 other HANDOFF files goes from 0 asks to 2 and gains 2 open-tag findings. That project has no ledger, so no product report breaks. Seat: added to the S1 known-bug line.
- NOTE — a plural or all-caps compound of the acronym (a made-up three-letter word plus `s`, `DESK` or `API`) is missed. Seat: a known limit.
- NOTE — the `git ls-files` call keeps execFileSync's 1 MiB default buffer; its output is 209,030 bytes now, so the scan throws near 18,000 tracked files (inferred: about four months at October's add rate). Seat: a known bug.
- NOTE — an R-2511 failure prints counts only, with no path and no pointer to the scan command. Seat: a known bug.
- NOTE — `display-surfaces.test.mjs:55` became a Windows path with "the owner" and its space in it, not D1's `C:\Users\example`; the file still passes 181 checks. Seat: a known bug.

Scripts: the agent's scratch folder (`indep-scrub/`: forms-probe, forms-probe2, file-kinds, random-fp, hidden-forms, asks-compare, report-compare, heading-cases, extractor-compare, tree-words, write-allowlist-probe); not committed.
