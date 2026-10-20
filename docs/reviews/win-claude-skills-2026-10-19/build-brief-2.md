# Build brief 2 · win-claude-skills (a pi gpt-5.6-sol builder)

Same worktree and branch (tip d1a4729e; build 1 is cc3457a3, merged with main d4423eff at 942127f4). Class: install, hook or gate. Rows: R-1900 to R-1909 only. Follow packages/nana-pack/prompts/builder-preamble.md. Single test files only; do not push; do not edit HANDOFF.md or docs/sessions/.

## MUST 1: the Windows leg is red on two install checks (CI run 39357366425 on 942127f4)
`packages/nana-setup/tests/install.test.mjs` on native Windows: FAIL "second install prints no retired row for a skill it linked" and FAIL "second install reports no more skipped rows than the first". The second install prints four rows like
`– retired .claude/skills/spec  skipped  unrecognized kind or provenance at …\.claude\skills\spec — left untouched`
for nana-setup's own marked copies of spec, py-lint, py-review and py-test (log: ci-windows-942127f4-build1.log in this folder). The independent check found the same on macOS with win32 forced (its K1). Cause: in lib/steps.mjs stepRetiredArtifacts, the win32 skip for those four names was removed and nothing replaced it for a copy that carries the `.nana-setup-copy` marker. Fix: the retired-artifact step leaves a marked nana-setup copy silent (no row), as it does for a link it made on POSIX; an unmarked or unrecognized folder keeps today's row and refusal. Add a check that forced-win32 runs this on every leg (so macOS and Linux catch it, not only Windows): a second forced-win32 install over a home the first install filled prints no retired row for the four. Show it red on 942127f4's code.

## MUST 2: a test crashes instead of failing (the seat's wrong-code pairs)
`packages/nana-setup/tests/retired-artifacts.test.mjs:403`: the R-1902 check reads `<home>/.claude/skills/spec/SKILL.md` with no guard. Under the wrong code W1 (stepSkills skips the four on win32) the read throws ENOENT, the whole file crashes, R-1902 is never reported and the seven checks after it never run. The build brief's rule: a missing file must make a check FAIL, never crash it. Guard the read so W1 gives a named FAIL and the later checks still run; show it with W1 applied.

## Known bugs that stay residuals (no change)
K2: each pack change to a skill leaves a SKILL.md.bak-<date> of nana-setup's own earlier copy inside that folder (requirements already did this; now all five do). K3: a CRLF or edited legacy copy of the four moves win32 install from exit 0 to exit 1 (the plan's known limit, now confirmed). K4: R-1900's check needs doctor's overall exit 0, so an unrelated ✗ row (pi-subagents missing in a bare temp home) fails it.

Done: install.test.mjs (forced win32 parts), retired-artifacts.test.mjs, skills-and-standards.test.mjs, stale-copies.test.mjs, install-check.test.mjs and win32-degrade.test.mjs green; each new or guarded check red on the wrong code it names; trace, `npm run map:check`, `npm run readme:check`, `node scripts/requirements-tree.mjs --check` green; `node packages/nana-setup/bin/install-check.mjs` exit 0.
Report (≤ 10 lines): VERDICT; commit; each MUST's change and red-before evidence; what only Windows CI can prove.
