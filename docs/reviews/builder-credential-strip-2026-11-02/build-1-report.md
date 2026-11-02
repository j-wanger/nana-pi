# Build 1 — credential dispatch controls

## Result

M1–M7 pass on native Windows. M8's temporary installed-launcher fixtures, install check and code-breaking pairs pass. No push, GitHub API request or stored-credential lookup was made. The full suite stays with CI after the seat pushes.

Branch: `feat/builder-credential-strip`. The builder's final message reports the committed full SHA.

## Requirement diff and evidence

R-3436 now requires no builder pushes and branch/full-tip/seat-check reporting. R-3437 replaces the dated CI ruling while retaining CI substitution and the Windows/install-check rulings. Their existing feature placement and shares stay unchanged. R-3660–R-3667 were added to FEAT-006; no feature or existing row moved. All ten rows are implemented with backticked test evidence.

| Row | Check |
|---|---|
| R-3436 | Existing worker-lane preamble pins; two push/report titles updated |
| R-3437 | Existing rulings CI/shared-marker parity check |
| R-3660 | `credential-strip.test.mjs::M1: builder children suppress fixture credential dispatch` |
| R-3661 | `credential-strip.test.mjs::M2: reviewer entry points suppress fixture credential dispatch` |
| R-3662 | `credential-strip.test.mjs::M3: unrelated inherited git configuration keeps its effect` |
| R-3663 | `credential-gate.test.mjs::M4: credential commands form a role-scoped non-exemptible floor` |
| R-3664 | `credential-strip.test.mjs::M5: shipped builder guidance assigns pushes to the seat` |
| R-3665 | `credential-strip.test.mjs::M6: dated CI ruling and shared working pattern agree` |
| R-3666 | `credential-strip.test.mjs::M7: credential strip configuration seal` |
| R-3667 | `credential-gate.test.mjs::M7: credential gate pattern seal` |

## Files and implementation

- `packages/nana-pack/lib/credential-strip.mjs`: shared `credentialStripEnv(baseEnv)` returns additions; appends resets to both git config forms, preserves unrelated parameters and counted entries, disables askpass/prompt routes, and refuses invalid inherited counts.
- `packages/nana-pack/lib/credential-strip-config.mjs`: sealed reset names/values and environment vocabulary.
- `packages/nana-pack/bin/pi-worker.mjs`: plain and lane pi child environments, Claude child environment and flag-settings environment use the helper.
- `packages/nana-pack/bin/pi-review.mjs`: watchdog child environment uses the helper.
- `packages/nana-pack/bin/claude-review.mjs`: ledger spawn and Claude flag settings use the helper.
- `packages/nana-pack/bin/review-ledger.mjs`: direct model spawn uses the helper too.
- `packages/nana-pack/extensions/nana-gate.ts` and `lib/credential-gate-config.mjs`: role-scoped credential floor before allowPatterns; reuse exported shell token, command-index and basename functions.
- `packages/nana-pack/prompts/builder-preamble.md`: replaced **the existing line 34**, not builder-credentials' urgent-fix line, which was absent in this checkout. Replaced the report-shape line too.
- `packages/nana-pack/rules/nana-rulings.md`, `templates/_shared/working-under-nana-pi.md`, `AGENTS.md`: seat-owned pushes; shared source edited before matching the marker region; project-local suite wording updated separately.
- `packages/nana-pack/README.md`: compatibility, preparation and all five accepted residuals.
- `docs/known-bugs/FEAT-006.md`: only the five residual additions explicitly requested by the brief.
- `docs/sessions/2026-10.md`: only the explicitly requested newest-first entry.
- `REQUIREMENTS.md`, `code-map.config.json`, generated `docs/code-map.md` and `docs/requirements-tree.md`: trace, dynamic-launch reach declaration and generated artifacts.
- Two new test files above; three amended existing test files below; this folder's red, green, M8, install, mutation and check records.

No change to `pi-watchdog.mjs`'s existing spawn/childEnv merge or to `claude-settings-carry.mjs` was needed. Supplying the already-sealed environment to its existing API preserves its ordering. Other subprocesses remain unchanged: land inherits the caller environment, mutation runs preserve counted git config while scrubbing roles, and README rehearsal overwrites the count.

## Constants

Each production constant is pinned once by its row's seal.

- `CREDENTIAL_CONFIG_RESETS`: `[['credential.helper', ''], ['core.askPass', '']]`.
- `CREDENTIAL_ENV`: `GIT_ASKPASS=''`, `SSH_ASKPASS=''`, `GIT_TERMINAL_PROMPT='0'`, `GCM_INTERACTIVE='never'`.
- `GIT_CONFIG_ENV`: `GIT_CONFIG_PARAMETERS`, `GIT_CONFIG_COUNT`, `GIT_CONFIG_KEY_`, `GIT_CONFIG_VALUE_`.
- `CREDENTIAL_PATTERNS`: seven regex sources covering git dispatch, git credential-manager, manager/osxkeychain binaries, gh token output, macOS password commands, Windows credential commands, and GitHub API HTTP clients. The exact list is pinned in the gate seal.
- Test-only `CASE_MS=30000`, `PROBE_MS=3000` in the credential matrix; `CASE_MS=10000` in the gate corpus. Their respective M7 checks pin them. Provenance is beside each definition.
- Evidence-only `PAIR_MS=180000` bounds the disposable mutation runner. It is not a product setting.

Empty askpass values work with the laptop's git: all six parent routes return only the fixture password, and child probes neither return a password nor invoke either fixture program. No alternate askpass program was needed.

## Red, green and mutation evidence

The requirement diff preceded tagged tests; production code followed the recorded red run. The launchers, gate and guidance at starting HEAD matched local main `816f63db6d3de3bb819c38660e1ac90c601bbc4e` byte-for-byte.

`node scripts/test.mjs --verbose credential-strip.test credential-gate.test worker-lane.test rulings.test` exited **1** before production edits: **86 pass, 11 fail, 1 skip**. All eight new checks failed; the amended push/report/ruling pins also failed. See `build-1-red.txt`.

The first fixture expansion exposed an invalid synthetic Claude roster model; the fixture now imports a supported name. M3 then caught project settings replacing an unrelated inherited counted slot. The shared helper now includes those inherited slots in flag settings, not only newly appended resets.

`node docs/reviews/builder-credential-strip-2026-11-02/build-1-pairs.mjs` exited **0**: **8 mutation pairs, 8 RED, 0 survived**. It breaks code only in OS-temp copies; no assertion is inverted and no repository fixture is written. Individual mutant runs all exit **1**:

| Check | Code mutation |
|---|---|
| M1 | Return no credential-strip additions |
| M2 | Remove review-ledger's spawn strip |
| M3 | Drop inherited parameter-form config |
| M4 | Disable the role-scoped floor |
| M5 | Restore a builder-push instruction |
| M6 | Restore the old CI ruling date |
| M7 / R-3666 | Change GCM_INTERACTIVE to always |
| M7 / R-3667 | Remove fill from the credential pattern |

The builder ran these pairs. The seat can rerun the committed evidence driver; the suite neither imports nor copies that driver.

Final touched command:

`node scripts/test.mjs --verbose credential-strip.test credential-gate.test worker-lane.test worker-claude.test rulings.test gate-corpus.test rulings-install.test templates-render.test claude-review.test`

Exit **0**: **9 files: 9 PASS, 0 FAIL, 0 SKIP, 0 WARN · checks: 398 pass, 0 fail, 26 skip**. The skips are the existing platform/tool preconditions. Full output: `build-1-green.txt`.

## Existing test edits

Only expectations made false by the change were edited:

1. `worker-lane.test.mjs`: replace the push-and-stop and pushed-tip report literals and their two titles.
2. `rulings.test.mjs`: replace the exact old CI ruling with the new date and seat-owned wording.
3. `worker-claude.test.mjs`: include the added sealed credential environment in expected settings and the fake child's observed names. Other assertions remain intact.

Before limiting edits, the builder searched tests and scripts for old preamble push/report text and the dated ruling. The final source scan finds those literals only in negative assertions and the code-breaking mutation driver.

## M8 and checks

`m8-win32.txt` records six credential routes through each of plain pi-worker, lane pi-worker, Claude pi-worker, pi-review, claude-review and direct review-ledger. The pi-worker/pi-review routes use launchers installed by the real `stepPath` into a temporary HOME. Claude cases inspect both the spawned environment and the simulated application of conflicting project settings followed by actual emitted flag settings. No model-backed credential fixture session was started. The install check separately exercises the installed cmd and sh launchers.

`node packages/nana-setup/bin/install-check.mjs` initially exited **1** at pi post-edit with the builder's inherited lane boundary. Repeating with `NANA_WORKTREE_ROOT` unset exited **0**, all items passing. No install code was changed. Both outputs are retained; no real agent directory or git configuration was edited.

| Command | Exit / result |
|---|---|
| `npm run map` | 0; 593 modules |
| `node scripts/requirements-tree.mjs --write` | 0; 0 problems |
| `npm run map:check` | 0; 0 problems |
| `npm run readme:check` | 0; 1064 claims, 0 problems |
| `node scripts/requirements-trace.mjs` | 0; 2183 implemented rows traced |
| `node scripts/requirements-tree.mjs --check` | 0; 2439 rows, 43 features, 0 problems |
| `node scripts/known-bugs.mjs --root .` | 0; names=0, sizes=0 |
| canonical `nana-writing.mjs` on the new session entry and README note | 0; 28 sentences, over=0, passive=0, banned=0 |
| `node scripts/identity-scan.mjs --root .` | 0; findings=0 |

`build-1-checks.txt` also preserves the initial map reach-declaration and extra evidence-tag failures, then their green reruns. Evidence logs replace machine-specific paths with placeholders.

## Precedent and touched known bugs

No private function was copied or moved. The launchers retain the precedent's childEnv merge and settings-carry API. The gate imports the existing exported shell utilities instead of copying tokenization or git-option parsing. No departure from the named precedent was required.

Design clarification: flag settings must include inherited counted entries as well as appended resets; otherwise project-settings env can replace unrelated entries. M3 demonstrated that need. The code-map always-run declaration is an additional file required by the existing map checker. The session and residual additions are the brief's explicit exceptions to the generic builder archive/known-bug prohibition.

Existing FEAT-006 known bugs touched, not otherwise fixed: unsealed Claude settings env is now sealed for these git controls only; managed policy remains higher precedence; Claude builders still have no pi command gate; launch-path enforcement stays advisory; Windows real-model coverage is not claimed by these synthetic credential fixtures. The five requested residual lines preserve direct-store access, subprocess environment overrides, managed policy, absent Claude text gate and advisory-load-path limits.

## Not done

No push, CI read, locked full suite, independent reviewer or model-backed credential smoke was run. The seat still owns its review ladder, final verification/push, macOS install check and the plan's owner hold before landing. No GitHub issue was created or changed.
