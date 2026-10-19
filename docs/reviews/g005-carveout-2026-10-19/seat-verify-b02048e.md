# Seat checks — g005-carveout build 1, tip b02048e (2026-10-19)

- CI on draft pull request #41 (run 39268120561; GitHub merged b02048e onto main `4be0b79` as `c1b42a2` at push time,
  so the run carried win-leg-blocking's skip list):
  - Windows `153 files: 132 PASS, 0 FAIL, 21 SKIP` (6,205 checks pass, 0 fail, 78 skip) — the first Windows run with 0
    failing files (`ci-windows-run-1.log`). The 21 skips are the 20 declared desk and bench files, each with its reason,
    plus bench's study-tasks, which needs an extension the runner lacks. R-1480, R-291 (leaf total 1,243) and the
    Part G mirror check (R-756) pass there; skills-and-standards reads 56 pass, 3 skip.
  - macOS `153 files: 151 PASS, 0 FAIL, 2 SKIP`.
  - Ubuntu 150 PASS, 1 FAIL: path-spelling GP1/GP2, main's Linux regression, not this lane's; the linux-path-spelling
    lane fixes it.
  - install-check passes on macOS and Windows. The local macOS install-check run before `nana-land` is still owed (the
    lane touches `packages/nana-setup/`; AGENTS, 2026-10-12).
- The builder's wrong-code tries (its report; the text broken, never the assertion): dropping the carve-out from
  `nana-standards.md`, from the requirements `SKILL.md`, or from the shared `requirements-general.md` each turns R-1480
  red naming that file (3 of 3); changing G-005 in `REQUIREMENTS.md` alone turns R-756 red.
- Requirements skill copies on Windows: this lane changes `packages/nana-pack/skills/requirements/SKILL.md`. The landed
  win-skill-occupied lane's shipped-version list (`packages/nana-setup/lib/skill-copy-history.json`) has to hold only
  the versions shipped before its `.nana-setup-copy` marker. Every copy installed since win-skill-occupied carries the
  marker, so no list update is needed. The base's and main's `SKILL.md` (`19f44f1`, sha256 `7b2563a5…`) is already the
  list's newest entry; the lane's version (`33c0338b…`) is not listed and need not be.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base 4be0b79`): FEAT-033 · Adopt explicit engineering
  standards — G-005 text changed; R-1480 new (implemented).
- No wrong-code pairs and no independent check: an ordinary lane (rule, skill and ledger text plus one check).
- Independent check findings: none (none ran). Residuals the lane leaves open are the plan's known limits, recorded in
  HANDOFF's carried residuals.
