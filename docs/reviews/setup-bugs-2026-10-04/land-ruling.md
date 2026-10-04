# Landing ruling — `feat/setup-bugs` → `main` (2026-10-04)

Ruler: Fable (read-only; this file is the only write). Inputs: `git diff main..feat/setup-bugs`
(8fd0dca, 0bc93eb, f371934 on ae15067; main is still ae15067, so the branch fast-forwards),
`worker-report.md`, `astra-r1.md` (BLOCK 7), `astra-r2.md` (BLOCK 8), `seat-verify-after-r2.md`.
`[V]` = I read or ran it today. `[A]` = astra ran it, I read the log. `[I]` = inferred.

Stakes: medium-blast, reversible. Three installer primitives change; the only live-machine
surface touched is `launchctl` under `install --desk`, and every change narrows what runs.

## 1. Verdict: LAND, with one merge edit

One reason. All three defects are reproduced against base and pinned against the branch, and
the two rounds of astra BLOCKs closed by execution. Round 1's two MUSTs and one SHOULD closed in
`0bc93eb` `[A]`. Round 2's two MUSTs closed in `f371934`, which astra never saw; it touches tests,
one row and the README only `[V]`, and I replayed its one code-shaped claim myself (§4). No fourth
round is needed.

My runs in the worktree `[V]`:

| Check | Result |
|---|---|
| `npm test -- nana-setup` (suite runner, fresh HOME per file) | 17 files PASS, 709 checks pass, 0 fail, 3 skip |
| `fsops.test.mjs` · `paths.test.mjs` · `shared-link-state.test.mjs` · `desk-service.test.mjs` | 17 · 4 · 7 · 33 pass, each exit 0 |
| `requirements-trace` | 539 rows, 465 implemented and traced, 2 planned, 65 untested, 7 violated; exit 0 |
| `map:check` | 172 modules, 0 problems |
| `readme:check` on the branch | 544 claims, 5 problems — all the worktree's missing `apps/bench/.ext` and `node_modules` |
| `readme:check` on main (ae15067, full checkout) | 543 claims, 0 problems — the branch adds one claim and it passes |
| round-3 mutation (§4) | patch + first sync moved back outside `try` → both leak checks red in both files |

The diff is eleven files and nothing else `[V]`: three one-purpose fixes (`fsops.mjs` lstat
guard, `paths.mjs` one token, `project-key.mjs` try/catch plus the seam), one caller fix
(`steps.mjs` early return), four tests, four rows, the map, the README block. The worktree is
clean.

## 2. Claim 2 — `--home ~` no longer registers pi or loads the desk service

**Declared already. No new sentence is owed.** The contract users read says this before the fix:

- `packages/nana-setup/README.md:233` — "Never touches the live machine under `--home` — no
  `pi install`, no `launchctl`. That is what makes the tests safe." `[V]`
- `--help` (`bin/nana-setup.mjs:45`, mirrored at `README.md:306`) — `--home <dir>  put every
  user-scope location under <dir> (tests, dry machines)` `[V]`
- `paths.mjs:82-83`, the `isRealHome` doc comment — false "whenever a --home/--claude-home/--pi-home
  override is in play" `[V]`
- The run output names the skip and its cause per step: `pi packages — not registered (--home
  override in play)`, `desk launchctl — not loaded (--home override in play)` `[V, steps.mjs:581,723]`

The fix makes the code match the declaration; it is not a contract change under the CLAUDE.md
rule, so the README and `--help` stand as written. R-378 records the equal-path edge in the
ledger. Blast radius `[V]`: three production readers of `isRealHome` (`stepDesk`, `stepPiRegister`,
doctor's registration and launchctl probe); no script, hook, plist or doc in the repo invokes
`nana-setup` with `--home` outside tests. Astra's one caution stands and is already implied by
`--help`: `--home ~` still writes under the real home while skipping registration — a half
install, reported as such on every line. Not worth a README line.

## 3. Residuals, one line each

| # | Residual | Recorded |
|---|---|---|
| 1 | The symlink guard is a pre-check, not race-proof enforcement (TOCTOU, symlinked ancestors). | README "Known residuals" bullet 1 `[V]` |
| 2 | `doctor` still reads the plist through a symlink (`doctor.mjs:410`). | README bullet 2 `[V]` |
| 3 | The no-read spy covers `fs.readFileSync` only. | README bullet 3 `[V]` |
| 4 | Native win32 and real launchd are unexercised; `launchctl` is a PATH stub. | README bullet 4 `[V]` |
| 5 | `readme:check` 5 problems in the worktree. **Misplaced** — a worktree-environment fact, false on main (0 problems). | README bullet 5 → **drop at merge** (§5); the fact lives in `astra-r2.md` and `worker-report.md` |
| 6 | R-358 (pi-packages step reports skipped under `--home`) stays `untested`; R-378 pins the predicate, R-314 pins launchctl under a throwaway home, nothing pins `stepPiRegister`'s branch. Pre-existing, not this lane's. | `REQUIREMENTS.md:498`, status `untested` `[V]` |
| 7 | The setup-failure regression asserts a Node internal: `syncBuiltinESMExports()` reads every `fs` export, so a throwing getter propagates (Node 22.22.2, no `engines` pin). A Node that stops doing that fails the `threw` check loudly; delete that one check then — the two leak checks still pin the restore. | This ruling |
| 8 | `desk-service.test.mjs`'s "regular file" control is the only check that reaches `launchctl`, through the PATH-first stub. If the stub were ever not first, the real `gui/<uid>/com.nana.pi-desk` would be booted out and a temp plist bootstrapped. Node resolves `spawnSync` through `process.env.PATH` at call time, so the stub holds, and the control's `>= 2` logged calls prove it live. Optional hardening: one probe call must land in the log before the control runs, else skip it. | This ruling |
| 9 | If `syncBuiltinESMExports()` throws again inside `finally`, the helper fails loudly instead of leaking. Acceptable for a test helper. | `seat-verify-after-r2.md` |

## 4. What astra did not name — nothing I block on

Round 3 (`f371934`) had no astra pass. I checked it as new code `[V]`:

- `recordingReads` and `withLinkDeletedRightAfterLstat` now install the patch and run the first
  sync inside `try`; `finally` restores and re-syncs. I replayed the pre-round-3 ordering on a
  scratch copy of the package: `setup-failure: the CJS … did not leak` and `… the ESM … did not
  leak` go red in both files; the committed ordering passes 17 and 7. The regression discriminates.
- R-380 now reads "outside a dry run". `stepDesk` returns on `o.dryRun` before the SKIPPED check
  `[V, steps.mjs:572-579]`; the two dry-run checks pin exactly that single-entry output and zero
  calls. The row is as wide as its evidence, no wider.
- `writeIfChanged` returns SKIPPED only from the two new guards `[V, fsops.mjs:146-162]`, so the
  early return in `stepDesk` cannot fire on an idempotent re-run; UNCHANGED still reaches
  `launchctl print` as before. A directory in the way used to propagate EISDIR from `writeFileSync`;
  it is now SKIPPED, inside the module's declared contract.
- Rows R-377 to R-380: one `shall` each, EARS lead-ins, every cited check exists and carries its
  `req:` marker (the rail would exit 1 otherwise) `[V]`. R-373 to R-375 stay unused by the
  writing-trial ruling; R-376 is taken. No ID reused `[V]`.
- Items 7 and 8 above are the two hazards astra did not name. Neither reaches production code;
  both are recorded here.

## 5. Merge-commit edits for the seat

1. **Drop README "Known residuals" bullet 5** (`packages/nana-setup/README.md:247-248`, the
   `readme:check` line). It describes the worktree, not the package, and is false on main.
2. Commit the review corpus `docs/reviews/setup-bugs-2026-10-04/` with the land; it is untracked
   on main `[V]`.
3. Fast-forward is possible; use `--no-ff` if the lane wants a merge commit to carry edit 1.

Nothing else. The code lands as written.
