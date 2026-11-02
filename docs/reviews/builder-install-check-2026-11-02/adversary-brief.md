# Adversary brief — builder-install-check plan

You are the one adversary for a nana-pi lane plan. You attack the plan; you do not rewrite it, build anything, or edit any repository file. You are read-only: read, grep, find, and bash for read-only commands and small probes only.
- Probes write only under the system temp folder, and remove what they create. You may import the gate in-process, as the plan's probe did.
- Do not run `install-check.mjs` itself: it installs into a sandbox and starts pi sessions, and this laptop is memory-limited to one heavy run, which a build is using.
- Never read, print or use a stored credential. No GitHub API calls.
- Never run the full suite.

Working directory: the lane worktree, branch `feat/builder-install-check`, based on main 99fd0d18. The machine is Windows 11 with Node 22. In PowerShell, set the path first: `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')`. Set `NODE_NO_WARNINGS=1` when importing `.ts` files.

## Read

- The plan: `docs/reviews/builder-install-check-2026-11-02/plan.md`.
- `packages/nana-setup/lib/install-check.mjs` (`buildEnvironment`, the pi turn setup around 330-420, `judgePiPostEdit`), `packages/nana-setup/lib/install-check-config.mjs`.
- `packages/nana-pack/extensions/nana-gate.ts` (`laneWriteHit`, and every other `process.env` read), `packages/nana-pack/lib/gate-temp-roots.ts`.
- `packages/nana-pack/bin/pi-worker.mjs` (every child env it builds), `packages/nana-pack/bin/worker-config.mjs`, `packages/nana-pack/bin/pi-review.mjs`, `packages/nana-pack/lib/credential-strip.mjs`.
- `packages/nana-setup/tests/install-check.test.mjs` (R-1071 checks); `packages/nana-pack/prompts/planner.md`; `scripts/lane-class.mjs`.

## Hunt for

- Is `NANA_WORKTREE_ROOT` the whole cause? Find every other builder-child variable that changes what install-check's pi turns or hook checks see, for example `NANA_HANDOFF` (already overridden), the credential strip's `GIT_CONFIG_*` (does any install-check step use git credentials or git config that `credential.helper=` breaks?), `PI_*` variables, `CLAUDE_*`. Probe the gate and the post-edit extension in-process with the full builder env if you can.
- Which other install-check items could fail under a builder for the same reason (other writes outside `<home>/project`, the pi-worker build item at line 591 that itself sets env, the README rehearsal)? Is the "pi post-edit" item just the first to be hit?
- M3's audit: is reading pi-worker's child-env names feasible without starting pi-worker? Is the plan's export a sound way, or does it couple install-check tests to pi-worker internals the wrong way (layer direction: nana-setup importing nana-pack)?
- Are M1 to M3 falsifiable? Does M2 test the real interaction or a stand-in?
- Rows: behaviour, not implementation; the lane class (install); anything missed.

## Output

Your final reply is the whole attack, in Markdown:
- numbered findings, each labelled MUST (the plan would produce a wrong or unprovable lane) or SHOULD;
- for each, evidence (file:line, or a probe and its result) and a concrete fix;
- at the end, the counts of MUST and SHOULD.

Keep it tight.
