# Review brief — req-tree increment B build, 2026-10-10 (reviewer: gpt-5.6-sol; roles: scope + adversarial)

**Round 3 — the last allowed for this item.** Your reviews: `sol-build-b-r1.md` (SEND-BACK 6.5),
`sol-build-b-r2.md` (SEND-BACK 8; one MUST: the proof accepted reordered governed rows). The fix run
used `build-brief-b3.md` (report `builder-report-b3.md`): at each expected position a new row must
carry the expected ID and Requirement. The seat added your swap attack to `seat-verify-b.sh` and
re-ran it (`seat-verify-b-output.txt`): every line as wanted. astra is reviewing the same revision in
parallel for the land ruling. Verify r2's finding is closed, then review the whole build; rank
honestly — after this round the seat lands with declared residuals, subtracts, or takes it to Jake.
INPUTS is `8c2ec5274662850a6e8173b5ef048aaf5b191548`.

You reviewed this increment's plan (`sol-plan-b-r1.md`, LAND-WITH-FIXES; fixes in
`sol-plan-b-r1-response.md`). A pi luna builder built it from `build-brief-b1.md` (and any later
`build-brief-b*.md`). Review `git diff 9e415db..HEAD` in full (the ledger diff is a re-render: judge
it through the proof and sampling). Inputs: BASE `6b9202a501a7fe03dfc834ab34cdfc212f6d92ce` (original
ledger), INPUTS `8c2ec5274662850a6e8173b5ef048aaf5b191548` (`tree-b.json`, `fixed-text-b.md`).

## Attack
1. **Bytes.** Run `node docs/reviews/req-tree-2026-10-09/prove.mjs --approved <BASE> --inputs <INPUTS> REQUIREMENTS.md docs/requirements-sections-2026-10-09.md`.
   Try to defeat it on scratch copies (OS temp dir or a scratch clone; never the worktree): a lost or
   altered row byte, a moved row left in its old home, a wrong `Status:` or `Also applies:` line, an
   extra prose line, a changed `tree-b.json` label or row list (needs a scratch clone commit).
   Independently: every base row line byte-identical; added rows exactly R-292–R-294; R-291's
   Requirement cell equals `tree-b.json`.
2. **The checker.** Do `scripts/requirements-tree.mjs` and its test pin R-291–R-294 as worded? For
   R-292 one failing case per clause (exists, once, not retired, homed elsewhere); R-293 grammar
   (missing, `done`, `frozen ()`, `retired ()`, whitespace reason) and all four legal forms accepted;
   R-294 for proposed and retired. Break each check in the code: does a test go red? Does the R-291
   field check verify status, also-applies and the shared index independently of the renderer?
3. **The outline.** Read `docs/requirements-tree.md` as Jake will: statuses, also-applies lists and
   the shared index (sorted by count, then ID) — correct against the ledger? Expand it with your own
   parser.
4. **The seat's acceptance script.** Run `bash docs/reviews/req-tree-2026-10-09/seat-verify-b.sh`;
   does every line read as wanted? Is the script itself sound (does any check pass vacuously)?
5. **Consumers and scope.** Rail, `req:rows`, R-756, README check, map; `git diff --stat 9e415db..HEAD`
   within the exact allowlist; no frozen input edited; no main row's cells changed.
6. **Governance text in the ledger.** Does it match the plan and the checks (what the suite checks
   vs review alone)? Anything false or contradictory with the intro?

## Output
Answer with the full review as your final message; do not write it to a file. MUST / SHOULD / NOTE
with file:line, evidence (what you executed) and the smallest fix. Score out of 10, then the last
line exactly one of `VERDICT: LAND`, `VERDICT: LAND-WITH-FIXES`, `VERDICT: SEND-BACK`.

## Seat notes before this round
- The seat re-ran `seat-verify-b.sh` itself (`seat-verify-b-output.txt`): every line as wanted,
  identical to the builder's pasted output.
- The seat's own independent pass: all 1,004 base row lines byte-identical; added exactly
  R-287–R-294; every row at its `tree-b.json` home; the 17 moves applied; statuses and
  `Also applies:` lines equal `tree-b.json`; R-291's cell equals `new_rows`; the outline's shared
  index has 95 rows sorted by count descending; no `See also:` lines remain.
