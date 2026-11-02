# Adversary brief — credential-gate-variants plan

You are the one adversary for a nana-pi lane plan. You attack the plan; you do not rewrite it, build anything, or edit any repository file. You are read-only: read, grep, find, and bash for read-only commands and small probes only.
- Probes write only under the system temp folder, and remove what they create.
- Never read, print or use a stored credential. Never run any credential command for real: no `git credential*`, no `git-credential-*`, no `gh auth`. Test regexes and the gate in-process only, with `NANA_ROLE` set in the probe's own environment.
- Never run the full suite.

Working directory: the lane worktree, branch `feat/credential-gate-variants`, based on `origin/feat/builder-credential-strip` 7d5f8ea4. The machine is Windows 11 with Node 22. In PowerShell, set the path first: `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')`.

## Read

- The plan: `docs/reviews/credential-gate-variants-2026-11-02/plan.md`.
- `packages/nana-pack/lib/credential-gate-config.mjs`; `packages/nana-pack/extensions/nana-gate.ts`, the credential floor (around line 147) and the `tokens`, `commandIndex`, `base` and segmenting helpers it uses.
- `packages/nana-pack/tests/credential-gate.test.mjs`; `packages/nana-pack/tests/gate-survives-mutation.test.mjs`.
- `docs/reviews/builder-credential-strip-2026-11-02/r3-reviewer-5c2162a3.md` (the four variants) and `seat-mutate.mjs` in that folder.
- Rows R-3663 and R-3667; `docs/known-bugs/FEAT-006.md`; `packages/nana-pack/prompts/planner.md`.

## Hunt for

- Does the merged design actually refuse all four reviewer variants once the words pass through `tokens`/`commandIndex`/`base`? Probe each through the real gate in-process. Watch `=` forms, `.exe`, quoted paths, PowerShell `&`.
- Does `(?:\S+\s+)*get(?:\s|$)` after the helper over-match a legitimate command a builder runs (`git credential-cache exit`, `git config --get credential.helper`, `git credential-store --file=x erase`)? Any near miss the plan's M2 corpus lacks?
- Is the wide helper name (`credential-[\w.-]+`) sound, or does it catch something non-credential under `git credential-<x>`? Is there a git subcommand starting `credential-` that is not a helper?
- Catastrophic regex backtracking on long inputs with the nested `(?:\S+\s+)*` (the gate caps subject length; check where).
- Are M1 to M3 falsifiable against the obvious wrong code (the current narrow patterns; a helper rule without the global-option prefix; `get` as a substring)? Name a gap.
- Rows: behaviour, not implementation; the lane class; anything missed.

## Output

Your final reply is the whole attack, in Markdown:
- numbered findings, each labelled MUST (the plan would produce a wrong or unprovable lane) or SHOULD;
- for each, evidence (file:line, or a probe and its result) and a concrete fix;
- at the end, the counts of MUST and SHOULD.

Keep it tight.
