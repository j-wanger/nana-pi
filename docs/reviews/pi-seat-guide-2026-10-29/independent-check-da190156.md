# pi-seat-guide · independent check at da190156

Verdict: works for a pi seat; no harm found. 0 MUST, 1 SHOULD, 5 NOTE.

Scratch runs under a temp `--home`/`--pi-home` (NANA_ROLE unset), plus `NANA_SETUP_PLATFORM=win32`.

## Evidence

- **Install (POSIX):** `pi nana-seat.md created`; `P/nana-seat.md` is a symlink to `packages/nana-setup/claude/rules/nana-seat.md`. Re-install over the link: `unchanged`. Over a byte-equal plain copy, or a hand-edited file: `updated`, backed up to `.bak-<date>`, replaced by the link. Same as rulings.
- **Doctor:** `✓ pi nana-seat.md` after install, `✗` once the file is removed, beside the rulings row.
- **Uninstall (POSIX):** `pi rule link nana-seat.md updated unlinked`; the file is gone. The `.bak` files stay, as they do for rulings.
- **Windows path:** a byte-equal copy, `copied (no symlink on this platform)`, recorded in `nana-setup-copies.json`. Doctor gives ✓, then ✗ after the copy is overwritten. Re-install backs up and re-copies it byte-equal. Uninstall refuses with "uninstall is POSIX-only"; that predates this lane.
- **Roles:** the extension runs with a real link in the agent dir. Unset, `""` and `seat` NANA_ROLE values get sections `[nana-rulings, nana-seat-guide]`. `worker` and `reviewer` get `[nana-rulings]` only. When no `env` is passed, process.env is used, and `NANA_ROLE=worker` drops the guide. The rulings section is byte-identical across all 7 role values (1 variant). The guide section equals heading + `\n\n` + the file, exactly.
- **Unusable guide:** missing, empty, over the cap, invalid UTF-8, a directory and a dangling link each give one line starting `SEAT GUIDE UNAVAILABLE:` that names the file and `nana-setup install`. None throws, and none raises a stale notice. A file at exactly 8192 bytes is accepted and raises `INSTALL STALE: pi nana-seat.md` correctly.
- **Install check:** `buildEnvironment` drops NANA_ROLE (`OVERRIDE_ENV`), so the live turn runs as a seat even when the caller is a builder. The heading assertion therefore holds.
- **Prompt size:** +2,721 bytes (about 700 tokens) per pi seat session; +0 for builders and reviewers.
- **Tests reading NANA_ROLE:** the new tests pass `env` explicitly. These files pass with NANA_ROLE unset and also with `worker`: rulings, seat-rule, rulings-install, state-manifest, install-check (142 pass), uninstall (31), templates-render (173). `map:check`: 0 problems.

## SHOULD

1. The guide's source path is spelled `path.join(pkgRoot, "claude", "rules", SEAT_GUIDE_FILE)` in three places: steps.mjs:727, doctor.mjs:512 and nana-rulings.ts:92. `ruleSource(SEAT_GUIDE_FILE)` in steps.mjs already returns this path. Doctor imports `ruleSource` and uses it on the line just above. The 10-22 ruling says a helper's second caller imports it. Doctor and steps should call `ruleSource`. The extension cannot cheaply import steps.mjs, so it may keep its join. Not blocking; it belongs in the known-bug file.

## NOTE

1. The new pi sentence says a seat "starts another lane's build from another pi session or the desk". A foreground pi seat cannot open a session on its own, so in practice it has to ask the user. "Asks the user to start…" would match what the seat can actually do. It also sits in the issue-watch paragraph, not next to the "Before you end your turn" bullet it qualifies.
2. The injected text nests the guide's own H1 (`# Nana — Running builders and reviewers`) under `## Seat guide (nana)`. The rulings injection does the same, so this follows precedent.
3. Matching is exact and case-sensitive. `WORKER` and ` worker` get the guide, the same as the existing frontier and stale-copies checks. The launchers always set lowercase, so this is in-model.
4. The test for R-3022 checks only `worker`. `reviewer` is not pinned, although it behaves correctly (checked above).
5. Residual from the plan: pi children that set no NANA_ROLE also get the guide, about 700 tokens. That includes pi-subagents agents such as the seeded reviewer agent. The guide's first sentence tells them to skip it. Bench runs use their own agent dir, so they get the one-line marker unless the guide is installed there.
