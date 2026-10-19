# Review — roster-set (one command changes one roster slot in place), 2026-10-19 (Opus, the lane's one final reviewer)

Feature: FEAT-006 · Launch builders with execution limits — the machine roster's one-command slot change (R-1400 to
R-1407)

Review `git diff b3f6ec2..HEAD` on `feat/roster-set` (the plan was written on main `b3f6ec2`; `git merge-base HEAD
main` is `b3f6ec2`; main has since moved to `73f39d5`, and this branch has not merged it). The plan of record is
`docs/reviews/roster-set-2026-10-19/must-meet.md` (rows R-1400 to R-1407), with the adversary's amendments in
`plan-attack.md` and the build in `build-brief-1.md`. The seat's record `seat-verify-c0afa61.md` holds CI, the macOS log
beside it.

Tree movement: FEAT-006 gains R-1400 to R-1407, all `implemented` (35 rows, from 27; CAP-02 131, from 123; leaf total
1,223, from 1,215). R-1123 and R-1192 gain "and its first argument is not `set`" in their WHEN, with no test change.

Judge whether `nana-roster set <slot>[:] <tokens>` changes exactly one slot of the user-scope `nana-pack.json` in pi's
active agent dir, keeps every other top-level member, leaves the replaced bytes in `nana-pack.json.bak`, and writes by
renaming a temp file from the real target's folder, through a symlink. Judge whether each refusal (malformed input, a
file the resolver refuses, a pi model shell) exits 1 and changes no byte. Judge whether the plain and `--json` prints,
the roster-notice hook, the pi extension and pi-worker behave as on main.

Threat model: honest variation in our tools' output and the OS in scope: the file absent; holding `objective`, `gate`,
`postEdit` or unknown keys; saved with a BOM and CRLF; symlinked into a dotfiles folder; malformed, a directory or over
the cap; the command run from a terminal, pi's `!`, a pi model shell or a Claude Code shell; darwin, linux and win32.
Deliberate forgery out: a model that unsets `PI_SESSION_ID`, edits the file another way, or races a writer. The plan's
known limits 1 to 11 are declared; the README states 1 to 4, 6 and 11.

Lane class: ordinary — the nana-roster command. No installer, hook, extension, gate-policy or land and review tool file
changes; `set` loads only through a dynamic import in the CLI's `main`. A static import added to `nana-roster.mjs`, or a
change to `resolveRoster`, would make it a hook lane.

Check: (1) each must-meet check fails with the feature removed (build brief 1 names thirteen wrong-code tries; the
lane's commits record no result for them); (2) no failure path changes a byte of the file or leaves a temp file behind;
(3) the plain and `--json` prints are byte-identical to main's for every roster; (4) the hook, the extension and
pi-worker load nothing new at start, and `worker-config.mjs` gains exports only; (5) no test writes outside the temp
folders it owns; (6) the pack README's Machine roster text matches the command; (7) HANDOFF and the session entry are
true; (8) any MUST.
