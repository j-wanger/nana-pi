# linux-path-spelling — must-meet (2026-10-19, the seat)

**Feature.** The path-spelling test's two case-divergence checks (GP1, R-1350; GP2, R-1351) run only where a folder can have two spellings, and skip with a printed reason on a case-sensitive volume. Tests only; no product file changes.

**What is wrong.** Main's CI Ubuntu leg fails both checks on every run since win-review-paths landed (run 39251730146 on 73f39d5: `path-spelling.test.mjs 9 pass, 2 fail, 11 skip`). Each check builds `Docs/`, renames it to `docs/` through git, then resets the index to the old commit. On a case-insensitive volume that leaves one folder whose disk case differs from git's. On a case-sensitive volume (Linux ext4) it leaves `Docs/` deleted in git's view and `docs/` untracked — two different folders. The `--out` file is then honestly untracked, so the tools admit it, and the check's expectation is wrong for that volume. The guard `diskName === "docs"` passes on both kinds of volume, so it never skips.

**Must-meet tests (no new row; both checks keep their rows).**
1. On a case-sensitive volume, GP1 and GP2 each print a `SKIP GP1 (case-divergence): …` / `SKIP GP2 (case-divergence): …` line naming the case-sensitive volume, and run no check. Evidence: CI's Ubuntu leg reads path-spelling with 0 failures and those two SKIP lines.
2. On a case-insensitive volume (macOS here, Windows on CI), GP1 and GP2 still run and pass, unchanged. Evidence: the local run on macOS and CI's Windows leg print both PASS lines.
3. The guard detects the volume, not the platform: it asks whether the old spelling `Docs` still reaches the same folder on disk (for example `fs.existsSync(path.join(repo, "Docs", "review.md"))` after the reset), not `process.platform`.

**Threat model.** Honest variation in CI file systems in scope; deliberate forgery out. **Lane class:** ordinary — one test file.

**Known limits.** A case-insensitive volume mounted on Linux (rare) runs the checks, as it should.
