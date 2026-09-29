# Review brief — lane U2, role: ADVERSARIAL (executed probes, not reasoning)

Lane U2 makes nana-pack's user-scope resources follow pi's ACTIVE agent directory
(`PI_CODING_AGENT_DIR`). It is a **permission surface**: the file it relocates is the gate's own
deny policy. The lane brief is `docs/reviews/u2-2026-09-28/u2-brief.md`; the worker's report is
`u2-worker-r1.md`. Worktree `~/nana-pi-wt/u2`, branch `lane/u2-agent-dir`, base `main` `ab01f1a`.

Your job is to break it with commands you actually run, and to paste their output. Reasoning about
what the code probably does is not a finding here.

## The defect being fixed (for context, do not re-litigate)
`lib/config.ts:276` read `~/.pi/agent/nana-pack.json` unconditionally while pi reads every user
resource from `getAgentDir()` (pi `dist/config.js:421-446`). With a custom agent dir the user's
`extraPatterns` and `protectedPaths` were silently empty — astra's T2c land ruling filed it urgent.
The seat also found that the gate's POLICY FLOOR matched the config only by path shape, so a
relocated config was editable by the agent the gate constrains.

## Probes to run (add your own; these are the floor)
1. **Denies enforced from the active dir.** Set `PI_CODING_AGENT_DIR` to a temp dir holding a
   `nana-pack.json` with a distinctive `extraPatterns` entry. Drive the real gate handler and show
   the matching tool call blocked. Then unset and show the default-dir behaviour unchanged.
2. **Policy floor, both surfaces.** With a custom agent dir, attempt (a) an edit/write to
   `<dir>/nana-pack.json` and (b) a shell command that writes it by redirection, `tee`, `cp` and
   `sed -i`, including `$HOME`-style and tilde spellings. All must be refused. Repeat through a
   SYMLINKED agent dir so the realpath is a different path from the one named.
3. **Relative and tilde values.** `PI_CODING_AGENT_DIR=agent` resolves against each process's own
   cwd (pi `expandTildePath` does not resolve relatives). Start from two different cwds and show
   which config each run reads. If the code claims parity with pi here, verify it against pi's
   installed source, not the README.
4. **Hostile values.** A dir that does not exist; a value naming a FILE; an empty string; a value
   with a newline; a value pointing at a directory with a `nana-pack.json` that is a dangling
   symlink, a directory, or unreadable. The gate must never throw and must never silently widen.
5. **The mismatch note.** Active dir empty, default dir holding a config: exactly one journal line
   and one UI note, naming both paths, and the default file NOT read. Check it fires once per
   session, not per event.
6. **The malformed-gate rules still hold** at the new path: last-valid-policy fallback in-process,
   conservative stop with none, and the user stop winning over the project stop.
7. **The round-cap ledger did not move.** With a custom agent dir, `bin/review-round.mjs` must still
   use `~/.pi/agent`. Show it. A cap that a shell variable resets is a cap bypass.
8. **Gate-survives-after.** The standing invariant for mutating surfaces: after the change the gate
   still blocks what it blocked before on a normal session with no env var set.

## Also judge
- Whether any function in `lib/gate-paths.ts` can now throw (the file's contract is that every
  function is total), and whether the gate handler can throw (a throw there BLOCKS the tool).
- Whether the new tests assert invariants or merely re-run the implementation.

## Output
Findings with severity at `file:line`, each marked **executed** (with the command and its output) or
**source-read**. End with `SCORE: n/10`, `MUST:`, `CARRY:` and `VERDICT: LAND|BLOCK`.
