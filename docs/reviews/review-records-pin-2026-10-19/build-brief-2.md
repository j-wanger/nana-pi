# Brief 2: review-records-pin

Feature: FEAT-007 (review and land tools). Same worktree and branch (tip d023b052). Class: ordinary.

## Finding (CI run on d023b052, Windows leg)
macOS and Ubuntu green. Windows: `review-ledger.test.mjs` 163 pass, 1 fail, 1 skip. The failing check:
`FAIL an unwritable ledger directory is refused at once before the review, saying it must be writable, no stack — the folder stayed writable; review-ledger: item "ro" … admitted as round 1/3 …`
So the Windows arm's icacls deny did not make the folder unwritable on the hosted runner (it runs as an administrator account), the probe write succeeded, the review was admitted, and the check failed on its own fixture, not on product code.

## Change (test only)
1. Find a way to make the ledger directory unwritable for the test process on hosted Windows that actually holds (for example: deny the specific rights `(OI)(CI)(W,AD,WD)` or `(DE,DC)` to the current user SID read from `whoami /user`, remove inheritance with `/inheritance:r` and grant only read; or a read-only attribute on a file the ledger must replace — check what review-ledger writes). Probe it on the CI leg: the check must confirm its own fixture first (a write attempt fails) and only then assert the refusal.
2. If no construct holds on the hosted runner, the Windows arm prints one `SKIP` line naming why (for example "the hosted runner's account bypasses the ACL deny") ONLY after the fixture's own probe write succeeded — never a silent pass, never an unconditional skip; macOS and Linux keep their arm unchanged. Say in the report which of the two you chose.
3. Keep the check's title and `// req:` marker. No product change.

## Done
- `node packages/nana-pack/tests/review-ledger.test.mjs` green on macOS. You cannot run Windows; the seat pushes and reads the Windows leg. Do NOT run the full suite; do NOT push; do not edit HANDOFF.md or docs/sessions/.
- Commit with explicit paths and the two trailer lines the earlier commits carry.

## Report (≤6 lines)
VERDICT; commit; the Windows construct (or the conditional skip) and why it should hold on the hosted runner.
