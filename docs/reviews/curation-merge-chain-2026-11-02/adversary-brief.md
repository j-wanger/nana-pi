# Adversary brief — curation-merge-chain plan

You are the one adversary for a nana-pi lane plan. You attack the plan; you do not rewrite it, build anything, or edit any repository file. You are read-only: read, grep, find, and bash for read-only commands and small probes only.
- Probes write only under the system temp folder, and remove what they create. Use synthetic records and events only.
- Never read any real owner profile or memory store (the folder named by `ownerProfile.dir` in any `nana-pack.json`, or `~/.claude`). Never run `nana-profile`, `nana-curate` or `nana-memory` against a real store.
- Never read, print or use a stored credential.
- Never run the full suite.

Working directory: the lane worktree, branch `feat/curation-merge-chain`, based on main 497c5891. The machine is Windows 11 with Node 22. In PowerShell, set the path first: `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')`.

## Read

- The plan: `docs/reviews/curation-merge-chain-2026-11-02/plan.md`.
- `packages/nana-pack/lib/profile-store.mjs`: `effectiveState` and `show` (the conflict marker).
- `packages/nana-pack/bin/nana-curate.mjs`: the accept path.
- `packages/nana-pack/lib/memory-curation.mjs`: `staleProposal`, `pendingQueue`, `sizeLine`, `renderQueue`.
- `packages/nana-pack/tests/memory-curation.test.mjs`, `packages/nana-pack/tests/profile-store-guards.test.mjs`.
- Rows R-3233, R-3563 and the R-356x/R-357x curation rows; `docs/known-bugs/FEAT-040.md`; `packages/nana-pack/prompts/planner.md`.

## Hunt for

- Confirm or refute the mechanism with a synthetic `effectiveState` probe: A→B, B→C. Does A come back on main's code? Does retiring C free A?
- Is the Design's liveness rule sound? "Hidden when the target is not retracted and is live or itself hidden by a supersede": does it break the cycle rule, the concurrent-replacement conflict, or R-3233's "retract newer restores older"? What about a chain whose middle record is retracted, or whose end was retracted before the merge was accepted (staleProposal should refuse; check)?
- Can a proposal written before a later accept still be accepted and create the chain in a bad direction (for example, merge B into A after A was dropped into B)? Does `staleProposal` stop every such case?
- Design 2 / O1: does a transitive `supersedes` change the profile `show` conflict output, the "absorbed N" count, `sizeLine`, or any other reader of `supersedes` (grep every one)?
- Are M1 to M4 falsifiable against main's code and the obvious wrong fixes (direct-only supersedes; a rule that never restores on retract)? Name a gap, including event-loss checks that could pass vacuously.
- Rows: behaviour, not implementation; the lane class; anything missed.

## Output

Your final reply is the whole attack, in Markdown:
- numbered findings, each labelled MUST (the plan would produce a wrong or unprovable lane) or SHOULD;
- for each, evidence (file:line, or a probe and its result) and a concrete fix;
- at the end, the counts of MUST and SHOULD.

Keep it tight.
