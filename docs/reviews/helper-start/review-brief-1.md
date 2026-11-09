Feature: FEAT-006 · Launch builders with execution limits

# Review brief 1: helper-start

Review only this lane's own commits: `git diff feat/desk-cut...HEAD` on branch feat/helper-start (it starts from the approved desk-cut lane, which has its own review). Plan: `docs/plan/helper-start.md`.

Roadmap step 3: trim each helper's starting context and log what it loads. The lane passes `--no-skills` plus five kept skills to pi children, drops the objective block for launcher-role children, gives lane builders a mandatory read pointer to their feature's known-bug file instead of the inlined digest (reviewers keep the digest), gives each pi attempt an explicit session file, and logs each child's real section sizes from that file after the attempt; the measurement child modules are deleted. 19 files, +284 / −539.

Seat validation on real launches with this lane's launcher (2026-11-09):
- A probe builder and a probe adversary each started with `skills` 2,538 characters (was 20,373), and the builder saw exactly requirements, spec, py-lint, py-review, py-test.
- The builder read `docs/known-bugs/FEAT-006.md` from the addendum's pointer.
- The load log recorded the real sections, including skills and tool schemas.
- `nana-objective` still showed 3,4xx characters, because the running pi loads the pack extensions from the main checkout, not from this lane; the objective change takes effect after the land and is checked then.

Questions:
- Can a builder, adversary or reviewer now miss something its task needs (a skill on another machine, a known bug, the priority a brief does not carry)?
- Does every launch path still log, and does a child that dies before its first turn log `unavailable`, never zero?
- Is anything deleted that other code still imports?

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.
