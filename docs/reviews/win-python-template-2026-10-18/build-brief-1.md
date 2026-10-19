# Lane win-python-template — build brief 1 (2026-10-18 · feat/win-python-template · tip after the seat's plan commit)

**Builder: Claude Sonnet 5**, a subagent in this worktree. An ordinary product lane: the must-meet is PT1 in
`must-meet.md` (row R-1360, already in `REQUIREMENTS.md` as planned) plus the evidence PT2. Flip R-1360 to
`implemented` with its check as evidence when the check passes. Read `plan-design.md`, then `plan-attack.md` (its
amended plan wins).

**Build, in order:**
1. Add the PT1 check to `packages/nana-pack/tests/templates-render.test.mjs` first, with `// req: R-1360` directly above
   the check call, in the scaffold block directly after `if (!ok) continue;` for Python and in the adopt block on its
   existing render. Probe `uvx --with pytest pytest --version` first; SKIP with a reason when it fails, FAIL under
   `NANA_TEST_REQUIRE_COPIER=1`. Then require exit 0 from the real run, printing the output's tail on failure. Run it on
   the unchanged template and confirm it FAILS (seven trace tests) before you change the template.
2. Then the template fix: the autouse `PYTHONIOENCODING=utf-8` fixture in
   `templates/python/template/tests/test_requirements_trace.py.jinja`, and both sides pinned in the two `cli()` helpers
   (`encoding="utf-8"`, and `PYTHONIOENCODING=utf-8` in the child's environment, with `import os`). Keep ruff check and
   ruff format clean on a rendered project.
3. Confirm: the check passes; a rendered scaffold and adopt project pass their full suite under the default encoding;
   `node scripts/template-acceptance.mjs` passes; `templates-update` is still 34 on macOS.

**Rules.** Work only in this worktree; in the foreground, through `npm test -- <file>` on this Mac; each call under 5
minutes (templates-render takes about a minute); never the full suite or a background command; renders and probes only
in the OS temp folder; never the real home folder, `~/.claude` or `~/.pi`; no person's, provider's or machine's name;
the PT1 check is the only new test; do not touch `HANDOFF.md`, `docs/sessions/` or the seat's files. Commit with explicit
paths, prefix `win-python-template: `, ending `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`; push to
`origin feat/win-python-template` after each commit.

## Done
templates-render and templates-update green on macOS; template acceptance passes; the row flipped; the code-map, trace
and README checks. The seat then opens a draft pull request and reads the Windows leg.

## Report
≤ 10 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: commits; templates-render's macOS line before and after;
the check's result on the unfixed and fixed template; each template edit; the one claim most likely wrong on Windows.
