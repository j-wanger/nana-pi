# Land ruling — lane U2 (agent-dir consistency), role: LAND RULER

You are ruling whether this merges, and what it changes upstream. It is a **permission surface**:
the file it relocates is the gate's own deny policy, and the lane also changed where the installer
writes and what the desk shows.

Worktree `~/nana-pi-wt/u2`, branch `lane/u2-agent-dir`, HEAD `4b1d45f`, base `main` `ab01f1a`.
`git diff ab01f1a..HEAD` is the whole lane. Read, in this order:
`u2-brief.md` (the contract) · `u2-worker-r1.md` · `u2-sol-adversarial-r1.md` · `u2-sol-scope-r1.md`
· `u2-fix-brief.md` (seat rulings + the scope amendment) · `u2-worker-r2.md` · `u2-sol-r2.md` ·
`u2-fix2-brief.md` · `u2-worker-r3.md` · `u2-sol-r3.md`.

## Where this came from
Your own T2c land ruling filed `packages/nana-pack/lib/config.ts:276` as a **separate urgent item**:
the gate read its own user config from `~/.pi/agent` unconditionally while pi reads every user
resource from `getAgentDir()`, so a custom `PI_CODING_AGENT_DIR` silently emptied the user's
`extraPatterns` and `protectedPaths`. The seat also found, while tracing, that the gate's policy
FLOOR matched the config by path shape only, so a relocated config was editable by the agent the
gate constrains.

## The round record (for your judgment of process, not only code)
Three sol rounds, all BLOCK, then a seat implementation of the final MUST:
- r1 (two reviewers): symlinked policy-file target outside the floor; dangling policy symlink read
  as absence; `piAgentDir`/`loadConfig`/the tool handler throwing under a deleted cwd; and the
  cross-package finding that the desk and installer still used the old directory.
- r2: a relative `PI_CODING_AGENT_DIR` is resolved by whichever process reads it, so the desk and
  the sessions it spawns disagreed, and a normal `nana-setup` run installed into a cwd-specific dir.
- r3: the same defect remained in `nana-setup project` / `project --check`.
- The seat implemented r3's MUST directly (`4b1d45f`) because the round cap was exhausted. This
  review is **over cap** by the seat's declaration, for that reason.

## Seat rulings you should test rather than accept
1. **The allowlist was widened mid-lane, in writing**, to the desk and `nana-setup`, because a
   remediation true in one package only is the failure you blocked T2c for twice. Was that right,
   or should the desk have been a separate lane with its own feel pass?
2. **`AGENT_DIR_VAR_RE` was kept** against a reviewer's MEDIUM: it catches four variable spellings
   of the policy paths in shell commands. The docs were tightened instead. Does the gate model still
   read honestly, or is a partial variable check worse than none?
3. **A relative agent dir is pinned by the desk and refused by the installer.** Two different
   answers to one hazard. Is that coherent, and is the desk's announcement enough for a user who
   never opens settings?
4. **The deleted-cwd case STOPS every gated tool** with a named reason. sol accepted it. Do you?
5. **The round-cap ledger deliberately stays in `~/.pi/agent`** so an env var cannot reset the tally.

## What a land ruling must produce
- Whether the contract is implemented **and satisfied**, in your usual A/B/C form.
- Anything that still speaks the old contract: other consumers, other repos, win32, docs a user
  reads. The seat swept declarations in `624cf8e`; check whether any sentence it changed is now
  untrue, and whether any it missed matters.
- The upstream-contract declaration: what does this change for anything that depends on nana-pack's
  paths, and what must a consumer do differently?
- Residuals priced by cost-of-error, and which review claims the seat verified itself.

## Evidence already established (do not re-run unless you doubt it)
`env -u NANA_HANDOFF npm test` → 76 files, 75 PASS, 0 FAIL, 1 SKIP, 4728 checks, exit 0 (seat-run).
sol executed the symlink, dangling-link, deleted-cwd, desk/session split, installer refusal and
regex-matrix probes; its outputs are in the reports.

## Output
`SCORE: n/10`, `MUST:`, `CARRY:`, `VERDICT: LAND|BLOCK`.
