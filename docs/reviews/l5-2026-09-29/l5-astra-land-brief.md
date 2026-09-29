# Land ruling — lane L5 (directory adoption), role: LAND RULER

You are ruling whether this merges and what it changes upstream. Worktree `~/nana-pi-wt/l5`, branch
`lane/l5-directory-adoption`, HEAD `0f9db33`, base `main` `eca3de4`. `git diff eca3de4..HEAD`.

Read in order: `docs/directory-adoption-design-2026-09-28.md` (the design and Jake's rulings) ·
`docs/reviews/l5-2026-09-29/l5-brief.md` (the contract) · `l5-worker-r1.md` · `l5-sol-r1.md` ·
`l5-fix-brief.md` · `l5-worker-r2.md` · `l5-sol-r2.md`. Commits `2f0b6e4` and `0f9db33` are the
SEAT's, not a worker's.

## What it is
Jake ruled: *"A directory with no handoff should be reported to seat, and have seat assign an
objective and start accumulating directory-level knowledge."* Then: repository roots only ·
dismissal is a marker file in the repo · an `OBJECTIVE.md` ends the reporting.

So: the handoff extension writes one `directory_unadopted` journal line, a new `[nana:adoption]`
SessionStart hook prints open ones to the seat, and `nana-setup project <dir> --not-a-project`
records a decision that travels with the repo. **Nothing reaches any session's prompt.**

## The invariants to test, not accept
1. **No context injection.** sol verified five scenarios byte-identical against `eca3de4`. Find a
   sixth. One byte reaching a worker's prompt is a BLOCK: keeping the signal out of the session is
   why the design was acceptable at all.
2. **The reader's output is text the seat trusts.** A repository directory name forged a heading in
   round 1. It is now reject-then-render: absolute, not `/`, no control characters, still a repo
   root, no future timestamp, escaped backticks, a bounded count line for everything refused.
   Attack it again, including the count line itself and the `has:` field. Is "quoted data, never an
   instruction" actually true for a seat reading it as its own session-start text?
3. **The producer cannot be made to lie.** A repo the owner does not control can be the cwd. What
   can a hostile repository cause to be written into the user-scope journal?
4. **Two gates, one predicate.** The printable check now runs in the producer AND the reader. Rule
   whether that duplication is right, and whether they can disagree.

## Seat rulings to test rather than accept
1. **The handoff store stays fixed at `~/.pi/agent/handoffs`** while the config follows the active
   agent dir (U2). sol wanted the store routed through `piAgentDir()`; the seat refused because U2
   ruled the store deliberately fixed. The store path implementation is now shared, in one place.
   Is the split defensible, or is a store that does not follow its agent dir a defect we keep
   re-deciding?
2. **The adoption event ignores project-scope `journal.path` and a relative user-scope path**, so
   producer and reader always compute the same file. It also follows only user-scope
   `journal.enabled`. Coherent, or a surprise?
3. **A dismissal marker of any filesystem type counts** (file, directory, symlink). The seat's
   reasoning: it is a decision record whose content is never read, and anyone who can write the
   repo root could create a regular file anyway.
4. **The seat registered the hook in `settings.mjs`** after the worker's allowlist stopped at the
   symlink list; without it the feature could never fire and `doctor` would report it healthy.
5. **The seat implemented the last three MUSTs directly** rather than buying a fourth worker round.

## Also rule
- **Does this actually do what Jake asked?** He asked that an unadopted directory be reported so the
  seat can assign an objective and start accumulating directory-level knowledge. The lane delivers
  the report and the dismissal. Say plainly whether the loop is closed or whether it stops one step
  short, and if so what the missing step is.
- The residuals: a broken installed hook symlink exits 127 (the settings entry is `bash <path>`) ·
  a small copied objective-filename validator with a 9-value agreement test · the lane is 11
  non-test files against an advisory ceiling of 10.
- Upstream-contract declaration: what must any other consumer do differently now?

## Evidence already established (do not re-run unless you doubt it)
`env -u NANA_HANDOFF npm test` → 81 files, 80 PASS, 0 FAIL, 1 SKIP, 4925 checks, exit 0 (seat-run).
sol executed the forgery probe, the edge matrix, the journal-mismatch probes and the prompt A/B.

## Output
`SCORE: n/10`, `MUST:`, `CARRY:`, `VERDICT: LAND|BLOCK`.
