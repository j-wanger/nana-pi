# Review — project-drift-notice (both seats name a project whose working section is stale), 2026-10-22 (the land reviewer)

Feature: FEAT-014 · Create or adopt a project workspace

Class: hook (the Claude Code SessionStart adoption hook's stale-copy producer and the nana-rulings pi extension change their output; the hook entry file and `hook-producer.mjs` stay byte-unchanged; `SHARED_DIR` moves into `paths.mjs`). Threat model: honest variation in project AGENTS.md files and session folders — a region that matches, differs by one byte, or has CRLF, a BOM, no markers, a malformed or fenced pair; a symlinked, unreadable, invalid UTF-8 (including Windows-1252 bytes inside the region) or oversized AGENTS.md; a dismissed root, a linked worktree, a submodule, this nana-pi checkout, a session in a subfolder or outside a repository; a root path holding a space, a quote, `$`, a backtick, `%`, a newline or bidi characters; launcher children; temp folders under `/tmp` or elsewhere. Deliberate forgery out (an AGENTS.md written to steer the agent: no AGENTS.md text reaches the prompt).

Review `git diff b5b5f8c2..HEAD` on `feat/project-drift-notice`. Main is b5b5f8c2; the lane is cut from it, with no merge. The lane's own commits: e03cca2b (plan), e1ac980f (build 1, the feature), ba430e4a (the seat's pairs, finding F1, the install check, build brief 2), d5378337 (build 2, R-2624's invalid UTF-8 case), 848c2bb6 (the independent check, findings F2 and F3, build brief 3), c0ab6b2d (build 3, shell-safe fix commands and R-2623's temp-folder setting), 08eafcba (pairs, install check and notes) and the final commit with this review's two briefs.

The plan of record is `docs/reviews/project-drift-notice-2026-10-22/must-meet.md`: decisions D1 to D6, rows R-2623 to R-2628, the seal test, the tunables and the known limits. `plan-draft.md` and `plan-attack.md` (M1 to M4, S1 to S11, N1 to N12) are its inputs; where they disagree, the must-meet wins (the Claude seat's line is in the stale-copy producer, so the adoption reader does not change). Build brief 3 widened R-2623's no-path rule from `"` to `"`, `$`, the backtick and `%`, with the row text changed to match.

The seat's record:
- Wrong-code pairs (`seat-mutate.mjs`): all 16 red at c0ab6b2d (`seat-mutate-output-c0ab6b2d.txt`). At e1ac980f, 13 of 15 were red: p8 (a loose UTF-8 decode) survived through a test gap that build 2 closed, and p11 was the seat's own weak wrong version, rewritten as the producer awaiting `checkProject`. p16 is the quote-only check build 3 replaced.
- The seat's per-build diff check finds no removed line holding an escaped `\\n`, `\\r` or `\\t`, at any of the three builds.
- The macOS install check passes every item at e1ac980f and at c0ab6b2d (`install-check-c0ab6b2d.txt`), the adoption hook included.
- The independent check (`independent-check-e1ac980f.md`): no material problem. 51 fixtures through the real hook; all 41 in scope agree with `project --check`, which wrote nothing; the adoption block and the stale-install notice are byte-identical to main's apart from the new line; the hook is under 2 ms slower. Its NOTEs 1 and 3 became build 3; the rest are FEAT-014 known bugs.
- Session titles: 0 missing. Build 3's locked full suite: `209 files: 207 PASS, 0 FAIL, 2 SKIP`. map:check, req:tree, readme:check and the trace are green.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement b5b5f8c..08eafcb: 6 rows in 1 features
FEAT-014 · Create or adopt a project workspace
  R-2623 new (implemented)
  R-2624 new (implemented)
  R-2625 new (implemented)
  R-2626 new (implemented)
  R-2627 new (implemented)
  R-2628 new (implemented)
```

CI runs on the draft PR at the reviewed tip, the Windows leg included. The seat lands only on green.

As the land reviewer, ask what this change does to every session start in both seats and in every project on a machine: a line where the refresh would not act, a command that runs somewhere other than the root it names, a slower or failing hook, a changed adoption block or stale-install notice, and what an older installed hook or a pi reload sees after this lands.
