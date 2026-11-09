Feature: FEAT-031 · Run checks reliably and without contaminating work

# Review brief 1: agents-trim

Review the whole lane: `git diff main...HEAD` on branch feat/agents-trim (plan `docs/plan/agents-trim.md`).

The lane cuts the shared working section that every builder, reviewer and seat loads from AGENTS.md (10,623 → 3,195 characters; AGENTS.md 19,977 → 12,602). Rules it removed either moved to the seat guide (worktree, launchers, larger-lane builder) or were deleted because a tool or a standing ruling already speaks them; build 2 deliberately deleted the copy it had first moved into the soul rule. The builder's M3 table lists each removed rule and its home.

Questions:
- Did any removed rule lose its only home, so a builder, reviewer or seat would now act differently on main? Check the M3 homes exist and say what was claimed.
- Does the regenerated AGENTS.md match the generator's output from the shared section (no hand edits)?
- Do the repointed tests still check the same behaviour, and does the seat guide still load in full for a pi seat under its 8,192-byte cap?

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.
