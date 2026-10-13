# Fact-check (repo claims) — ci-pin/CHANGE.md

Refs read 2026-10-13: main `3f5151f` (= origin/main, CI push run 38393632339 at 11:55Z), feat/install-check `ca3fed2`
(= origin, worktree clean), origin/feat/cc-hooks-windows `b3f6d7c`, origin/feat/pi-cmd-launch `c22bab5`; the
remote tips match `gh api .../branches`. Read-only. Scratch prototype of the four §5 checks plus every §5 mutation:
`scratchpad/ci-pin/fc/` (`build.mjs` writes the variants, `checks.mjs` runs the new checks and the EXISTING
`ci-workflow.test.mjs` from main or install-check against each one).

## WRONG

1. **`PI_INSTALL_HINT` line (§4 line 124).** It is `packages/nana-setup/lib/steps.mjs:810` on main `3f5151f` and on
   install-check. `:815` was its line at `7e6ce39`; `research-repo.md` was written against that older commit.
2. **requirements-tree literal sites (§4 line 119).** `requirements-tree.test.mjs` carries `1,070` at three lines:
   `:38` (title), `:52` (`leafTotal === 1070`) and `:53` (failure message). The scope names only `:38` and `:52`.
   install-check's merge updated all three, to 1,085.
3. **The log text of the 5 non-PREAMBLE files (§1 lines 27-28).** The 13/5 split is right: 13 files print
   `MCP_TYPESCRIPT_PREAMBLE`. Of the other 5, only 4 print "nana code: cannot start" (buffer-caps,
   changes-endpoint, prompt-detach, usage-line). `origin-rule.test.mjs` prints only its own "desk server never came
   up" (`origin-rule.test.mjs:36`). This holds in all three post-drift macOS logs and in main's 3f5151f run.
   `research-ci.md:64` had it right.
4. **"our tests and the desk import it through `npm root -g`" (§1 lines 33-34; §3 line 109).** The tests do:
   `findPiRoot` tries DESK_PI_ROOT, then `npm root -g`, then the PATH realpath (`tests/pi-install.mjs:21-44`). The
   desk does not. `resolvePiPackage` tries DESK_PI_ROOT, then walks up from realpath(`pi` bin)
   (`apps/desk/pi-session.mjs:44-52, :293-297`). It reaches `npm root -g` only in the shim fallback. The
   conclusion still holds: both load the global package, so a project lockfile would not help.
5. **The scope contradicts itself on the install-check job line (§3 line 102 vs §4 line 125).** §3 says "If it
   [install-check] lands first, R-1090 covers it". §4 NOT lists "feat/install-check's job line (that lane, at
   merge)". If install-check lands first, this lane's own R-1090 check goes red after it merges main
   (simulated: `ic-merged-nofix` → R-1090 RED). This lane must then append the flag to the `--ignore-scripts`
   line itself. The NOT list needs that exception.

## GAPS in the design or verification (the claims are true, but coverage is short)

6. **An unversioned install line escapes R-1090.** The check keys on `@earendil-works/pi-coding-agent@`. An added
   step `npm i -g @earendil-works/pi-coding-agent` (with no `@version`) passes all four new checks and every
   existing one (simulated `m2b`). This is the spelling at `apps/bench/README.md:26` and in the desk's fix hint
   (`pi-session.mjs:351`). The row says "Every ... step that installs pi", and the threat model names "adds an
   install line without it", so the test does not cover the whole clause. Fix: match
   `@earendil-works/pi-coding-agent` without the trailing `@`, on non-comment lines only.
7. **The R-1091 test asserts more than the row says.** The row says "in the form `YYYY-MM-DDTHH:MM:SSZ`".
   `2026-02-30T06:57:57Z` has that form, yet the round-trip assertion rejects it. The row should say "a valid UTC
   instant in the form ...". The sealed-value check also cites R-1091, whose text does not name the value. That
   matches the precedent (R-597 pins `PI_VERSION: 1.0.2`), so it is acceptable.
8. **"R-1091's shape check ... runs inside `npm test` on every leg" (§3 line 90) overstates the guard.**
   `ci-workflow.test.mjs` fails 0/5 on Windows in every run (main, r1-r4). The CRLF checkout breaks its `\n`
   regexes. So the guard bites only on macOS (blocking) and Ubuntu (non-blocking).
9. **R-1092 covers environment variables only (low, INFERRED, not run).** A repo-root `.npmrc` with `before=`
   would reach `npm test` children the same way, because npm 7+ exports non-default config to scripts. That is
   not in the threat model's list.

## UNVERIFIED or mislabelled

10. **"touches none of the 18 files" (§1 line 22) is literally true, but not for their imports.** The lane diff
    5143063..79888d5 changes `packages/nana-pack/lib/pipe-guard.mjs`. `extensions/nana-gate.ts` imports it, and
    `config-project-gate-fallback.test.mjs` loads that extension. Attribution still holds: the crash is at that
    test's `:36` (the pi import, before the gate loads), and the local A/B covers all 18.
11. **Some claims are labelled INFERRED but can now be VERIFIED.**
    - install-check's leaf literal is already 1,085 at `ca3fed2`, so 1,088 is plain arithmetic.
    - "3f5151f's commits after 79888d5 touch only docs, HANDOFF.md and REQUIREMENTS": `git diff --name-only`
      lists 7 files, all of those kinds.
    - Main's own post-land run 38393632339 (3f5151f) shows the identical 18 macOS FAILs and "added 119
      packages". That run is a better push-1/push-2 baseline than the three lane runs.
12. **Header (§4 line 117).** "header unchanged, so the code map is unchanged" is true: the map entry is
    header-only, with no callers or callees. But the `@purpose` sentence ("triggers, suite matrix, gated release
    ...") will not cover the cutoff checks. It already omits copier and fetch-depth. This is low, a strain on the
    house rule.
13. **Residual 1 lists 3 fresh-install commands.** It does not list `apps/bench/README.md:26` or the desk hint
    (`pi-session.mjs:351`). Both are unversioned, so they get the latest pi with matching siblings. That is
    probably not this break (INFERRED).

## VERIFIED

- **ci.yml quotes and line numbers.**
  - Main: `env:` is at `:10-12`, the suite install at `:38` and the release install at `:63`.
  - install-check: the `--ignore-scripts` line is at `:30`, suite at `:62` and release at `:87`. `env:` is
    identical.
- **ci-workflow.test.mjs.**
  - R-597's substring pin is at `:42` and R-1031's at `:69`. install-check's R-1078 regex at `:91` is unanchored.
  - With the flag appended, every existing check in both branches' copies passes. The flag placed before the
    package spec would break `:42` and `:69`.
  - `fresh-machine.test.mjs:28` still reads `1.0.2`.
- **Requirement IDs.**
  - Main's highest ID is R-1064. cc-hooks-windows reserves R-1065–R-1069 for splits.
  - install-check uses up to R-1084 and reserves R-1070–R-1089 (`build-brief-2a.md:44`).
  - No local or remote ref uses R-1090 or above. feat/t3-land-b is unmerged; its highest ID is R-999.
- **FEAT-019 and the leaf total.**
  - FEAT-019 is titled "Release usable templates and report support". It is a leaf of 15 rows, and R-1032 is its
    last row on both branches.
  - The rows R-597, R-686, R-996, R-1031, R-1032, R-950 and R-951 read as quoted in research. The leaf total is
    1,070 on main, so 1,073 after the three new rows is right.
- **One `shall` per row.** The rail counts whole-word `shall` outside code spans. R-1090, R-1091 and R-1092 each
  carry exactly one.
- **README line numbers.** `README.md:121`, `apps/desk/README.md:25` and `apps/bench/README.md:11` are as cited.
  No README describes CI's install line, so the change makes no README claim false.
- **The seat's pi install.**
  - `dist/extensions/codemode/tool.js:24` imports `MCP_TYPESCRIPT_PREAMBLE`.
  - The package declares six `^1.0.2` `@earendil-works` siblings. The seat has all eight packages at 1.0.2.
  - The bin is `dist/bundle/cli.js`. Codemode is inlined in `chunk-SYF2TF6W.js`, with no external codemode
    import.
  - The pi package.json mtime is `2026-10-04T02:57:57-0400`, which is `06:57:57Z`.
  - The seat's `npm ls -g --all` body matches `pB-tree.txt`: 287 lines, byte-identical.
- **CI counts.**
  - The 18 failing files are 13 desk and 5 pack files. macOS shows 137 files and 6 failing checks.
  - Before vs after the drift: Ubuntu goes 1 → 19 (lane-write-guard symlink); Windows goes 67 → 69
    (config-trust, config-project-gate-fallback). The r1 Windows counts are objective-golden 94/17 and
    post-edit-file-queue 2/1.
  - The install logs say "added 121 packages" before the drift and 119 after.
  - The lane diff 5143063..79888d5 touches nothing under `apps/`, `scripts/`, `package.json` or `.github/`.
- **The §5 mutations behave as stated** (literal reading of the four checks).
  - On unmodified ci.yml, R-1090 and R-1091 (shape and sealed) fail, and R-1092 passes.
  - Each of the 8 mutations turns the named check red: release flag dropped, 3rd versioned line, no `Z`,
    unquoted, 02-30, second `PI_BEFORE`, `npm_config_before`, and retune.
  - The retune to `2026-10-05T00:00:00Z` turns only the sealed check red.
  - V8 rolls `2026-02-30` to `03-02`.
  - The YAML parser reads the proposed line, and `PI_BEFORE` comes back as a string. A YAML 1.1 parser reads the
    unquoted value as a Date, which supports quoting it.
- **Rulings.**
  - The draft-PR no-approval ruling is in shared memory `feedback_auto_push_after_land.md:13`.
  - "Urgent fixes ship alone" and "one plan review for a small lane" are in
    `feedback_lane_process_2026_10_11.md:11-12` and `HANDOFF.md:18`.
