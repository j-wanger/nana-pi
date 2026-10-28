Feature: FEAT-002 · Resume decisions and next actions

Lane issues-home. Class: install, hook or gate (`lane-class` prints hook: the frontier producer is a launched CLI). Builder: pi-worker (larger lane). Build session 4.

The seat merged main at b26e9764 (lane-class landed) and checked build 3 (`seat-check-03a4475f.md` beside this brief): no MUST, three SHOULD. Fix these and the four small notes below. Everything else stands as briefs 1 to 3 say. Run the locked full suite as a plain foreground command with its output on screen, and run the local install check once with `env -u NANA_WORKTREE_ROOT` before your report.

## 1. Pointer forms (R-2970)

The URL match at `packages/nana-pack/lib/handoff-issues.mjs:22` accepts only end of line, whitespace, `?`, `#`, `<`, `>`, `)` or `.` after `/issues`. Accept a pointer wrapped in backticks, bold or quotes, or followed by a comma, colon or semicolon. Add a case for each form. A paragraph with no github.com issues URL must still keep today's block.

## 2. Next items stay under Next (R-2972)

Build 3's new order lets a wrong version that files next issues among the asks pass R-2972. Assert that the `Next (n):` block holds the remote next titles, and that no `[next]` tag appears among the asks.

## 3. The org probe's failure paths (R-2973)

Pin each one, and keep the Next and check lines, with no "none found" line, in each case:
- the probe exits non-zero: the failure line names gh failed;
- the probe answers a type other than `User` or `Organization`: unreadable output;
- the budget is spent before the probe: the timeout line.

## 4. Small notes

- The open-question rule (nana-soul.md:37, the template, AGENTS.md; R-682's pin moves with it) dropped where the HANDOFF line goes. Put "under Next or Open for the owner" back.
- A-084's maker line in REQUIREMENTS.md names `identity-scan --stdin`; name the runnable form the rule uses.
- `scripts/identity-scan.mjs --root <missing folder>` exits 1, the code for a hit; make it exit 2, bad use, and pin it under R-2976.
- One blank line, not two, between the failure line and the check line.

No new rows. Report each item with its test title or file:line.

## Precedent

- `packages/nana-pack/lib/handoff-issues.mjs`: the pointer parser and the org probe.
- `packages/nana-pack/lib/frontier-summary.mjs`: the block's Next and ask sections.
- `packages/nana-pack/tests/handoff-issues.test.mjs`: the R-2970 to R-2973 checks.
- `scripts/identity-scan.mjs`: `--root` handling and exit codes.
- `packages/nana-pack/tests/identity-scan.test.mjs`: the R-2976 checks.
- `packages/nana-setup/claude/rules/nana-soul.md`: the rule, with `templates/_shared/working-under-nana-pi.md` and AGENTS.md.
