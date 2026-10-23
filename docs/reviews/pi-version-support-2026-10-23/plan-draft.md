# pi-version-support · plan draft (planner, 2026-10-23, main f2b27357)

Feature: FEAT-013 · Install and connect harness runtimes

Why: on 2026-10-23 the owner asked that nana support pi up to 1.4.0. The owner's second machine (Windows, both seats) runs pi 1.0.3. Today the repo tests and documents only pi 1.0.2: CI pins `PI_VERSION: 1.0.2` at `PI_BEFORE: "2026-10-04T06:57:57Z"`, and every README pi command names that pair (R-1093). The incident behind the ask: a fresh `npm i -g @earendil-works/pi-coding-agent@1.0.3` resolves pi's own packages at 1.4.0, and code that imports pi's package entry then fails with `does not provide an export named 'MCP_TYPESCRIPT_PREAMBLE'`.

Spend line: the current priority, nana working the same for both seats on macOS and Windows, installation included. It also closes HANDOFF's "[optional, since 2026-10-21] The pi upgrade" ask. That ask's second half, filing an upstream issue, is moot: pi 1.3.0 already "Pinned internal Pi dependencies to exact release versions to prevent fresh installs from mixing incompatible packages" (#10865, pi CHANGELOG 1.3.0, measured by reading).

Stakes: medium blast, reversible. The lane changes the CI workflow, one doctor row, READMEs and the CI pin tests. A false ✗ in the new doctor row would block "all good" on every machine. It would also fail the install check's `doctor` and `readme checklist` items, and so block lands. No stored format changes. A revert restores main.

Every claim below is marked measured or inferred. Raw data: scratchpad `pi-ver/` (`time-*.json` publish times; `inst-*.log`; `probe-import.mjs`, `probe-ext/`, `rule-probe.mjs`; `runs/<label>/out.txt` suite runs; `ic/<prefix>/out.txt` install checks; `ls-fresh140.txt`, `ls-pinned140.txt`). Every run used a scratch clone of main at f2b27357 (`pi-ver/repo`, push URL disabled), `env -i` with HOME, USERPROFILE, TMPDIR and npm_config_cache inside the scratch folder, and a PATH of the prefix's `bin`, a tools folder (node, npm, npx, pnpm, uvx; no pi), then `/usr/bin:/bin:/usr/sbin:/sbin`. No run touched the real global prefix, `~/.pi` or `~/.claude`. No model was called. The checkout's `git status --ignored --porcelain` was identical before and after (see Seat steps 0 for the file).

## What I measured

**Publish times** (npm registry, measured). For every pi release, pi's own packages (codemode, ai, agent-core, tui, mcp, telemetry, chord) were published within minutes of pi-coding-agent:

| pi | pi-coding-agent published | first package of the next release | lockstep `--before` window |
|---|---|---|---|
| 1.0.2 | 10-04T00:56:19.486Z | 10-05T08:30:34.061Z (codemode 1.0.3) | CI today: 06:57:57Z |
| 1.0.3 | 10-05T08:37:00.736Z | 10-05T21:44:42.433Z (ai 1.0.4) | 08:37:00.736Z to 21:44:42.433Z |
| 1.0.4 | 10-05T21:51:59.920Z | 10-07T22:09:51.733Z (agent-core 1.1.0) | |
| 1.1.0 | 10-07T22:16:26.802Z | 10-12T22:59:50.884Z (agent-core 1.2.0) | |
| 1.2.0 | 10-12T23:03:25.459Z | 10-15T19:09:49.999Z (agent-core 1.3.0) | |
| 1.3.0 | 10-15T19:13:30.662Z | exact pins | pi-tui 1.3.0 published 19:14:02Z, after pi |
| 1.4.0 | 10-21T22:48:58.431Z | exact pins | pi-tui 1.4.0 published 22:49:25.360Z, after pi |

pi 1.0.2 to 1.2.0 depend on their own packages by caret range; 1.3.0 and 1.4.0 pin them exactly (measured, each `package.json`). A cutoff of `2026-10-21T22:49:00Z` for 1.4.0 fails with `ETARGET … pi-tui@1.4.0` (measured). A cutoff of `2026-10-23T18:35:54Z` (the seat's scratch install moment) reproduced the fresh 1.4.0 tree exactly: `npm ls -g --all` identical, 262 lines (measured).

**Per install** (macOS, Node 22.22.2, npm 10.9.7). "fresh" is `npm i -g --ignore-scripts --prefix <dir> …@<v>` today; "pinned" adds `--before` inside the lockstep window (1.0.2 at CI's cutoff; 1.0.3 at 08:40:00Z; 1.0.4 at 22:00:00Z; 1.1.0 at 22:20:00Z; 1.2.0 at 23:10:00Z; 1.4.0 at 2026-10-23T18:35:54Z).

| install | pi's packages resolved at | `pi --version` | import of pi's `dist/index.js` | extension imports under the pi CLI (`.ts` dynamic, `.mjs` static) | proposed doctor row | pi-loading subset (54 files) | full suite (218 files) | install check |
|---|---|---|---|---|---|---|---|---|
| pinned 1.0.2 (CI today) | all 1.0.2 | 1.0.2 | ok | ok, ok | ✓ | 53 pass, 1 env fail | 212 pass, 4 env fails, 2 skip (527 s at 3 jobs) | 17 pass, 1 env fail (20 s) |
| fresh 1.0.2 | all 1.4.0 | 1.0.2 | FAIL `MCP_TYPESCRIPT_PREAMBLE` | ok, ok | ✗ | not run | not run | not run |
| pinned 1.0.3 (floor) | all 1.0.3 | 1.0.3 | ok | ok, ok | ✓ | 53 pass, 1 env fail | 212 pass, 4 env fails, 2 skip (526 s at 3 jobs) | 17 pass, 1 env fail (19 s) |
| fresh 1.0.3 (the incident) | all 1.4.0 | 1.0.3 | FAIL `MCP_TYPESCRIPT_PREAMBLE` | ok, ok | ✗ | 33 pass, 20 version fails, 1 env fail | not run | 17 pass, 1 env fail (20 s) |
| pinned 1.0.4 | all 1.0.4 | 1.0.4 | ok | not run | ✓ | not run | not run | not run |
| fresh 1.0.4 | all 1.4.0 | 1.0.4 | FAIL `MCP_TYPESCRIPT_PREAMBLE` | not run | ✗ | not run | not run | not run |
| pinned 1.1.0 | all 1.1.0 | 1.1.0 | ok | not run | ✓ | not run | not run | not run |
| fresh 1.1.0 | all 1.4.0 | 1.1.0 | FAIL `MCP_TYPESCRIPT_PREAMBLE` | ok, ok | ✗ | not run | not run | not run |
| pinned 1.2.0 | all 1.2.0 | 1.2.0 | ok | not run | ✓ | not run | not run | not run |
| fresh 1.2.0 | all 1.4.0 | 1.2.0 | ok | ok, ok | ✗ | not run | not run | not run |
| fresh 1.3.0 | all 1.3.0 | 1.3.0 | ok | not run | ✓ | not run | not run | not run |
| fresh 1.4.0 (ceiling) | all 1.4.0 | 1.4.0 | ok | ok, ok | ✓ | 53 pass, 1 env fail | 212 pass, 4 env fails, 2 skip (526 s at 3 jobs) | 17 pass, 1 env fail (20 s) |
| this Mac's real pi (read only) | all 1.0.2 | 1.0.2 | not run | not run | ✓ | — | — | — |

Reading the table:
- **The pi CLI and nana's extensions survive the mix.** The `pi` bin is `dist/bundle/cli.js`, a self-contained bundle: it imports no installed `@earendil-works/*` package, and the missing export's code sits in one of its chunks (measured, grep). Extensions load through the bundle's embedded virtual modules (`dist/core/extensions/loader.js:21`, `usesEmbeddedModules` for the bundled Node build). A probe extension's `import("@earendil-works/pi-coding-agent")` from a `.ts` file, the form `lib/config.ts:379` and `nana-post-edit.ts:275` use, and a static import of `@earendil-works/pi-ai` from an `.mjs` file, the install-check fixtures' form, both resolved under the real CLI on every mixed install probed (measured). A native dynamic `import()` from an `.mjs` extension fails on every version, mixed or not (measured), so it is not a version signal.
- **What the mix breaks is code that imports pi's package entry from outside pi:** the desk (`apps/desk/pi-session.mjs:355`; its tests print `nana code: cannot start. … its entry point … failed`), the bench (`apps/bench/lib/pi-exports.mjs:120`), and nana's own tests that import `dist/index.js` (measured: 20 subset files fail on fresh 1.0.3 and pass on pinned 1.0.3). `nana-setup trust` deep-imports `dist/core/trust-manager.js`; that module imports cleanly on every install above, mixed ones included (measured).
- **Inferred:** the owner saw the error running the suite or another importer, not pi itself.
- `dist/bundle/index.js` imports cleanly on fresh 1.0.3 with the same 156 export names (measured). It is a deep path, so the plan does not use it (Design, Dropped).

The "1 env fail" in every subset is `handoff-staleness.test.mjs` "out-of-home: emitted absolute, ≤300". The 99-character scratch TMPDIR pushes a path past the 300-character cap. With a short TMPDIR it passed 78 of 78 on pinned 1.0.2 (measured; that one re-run used HOME and TMPDIR under `<tmp>/pvs`, outside the scratchpad, removed afterwards). The four full-suite failures on 1.4.0 are all environment, and the 1.0.2 baseline and the 1.0.3 run fail the same four files with byte-identical failure lines. All three runs report 8,215 checks passing, 3 failing and 67 skipped:
- `ci-records.test.mjs`: "checkout origin must name a github.com repository"; the scratch clone's origin is a local path.
- `handoff-staleness.test.mjs` and `handoff-trust.test.mjs`: the same 300-character cap.
- `template-acceptance.test.mjs`: "Could not find the `uv` binary"; the tools folder held `uvx` without `uv`.
- The two skips: `hooks-win32-exec.test.mjs` runs only on Windows; `study-tasks.test.mjs` needs `apps/bench/.ext/pi-web-access`.

The install check ran from the scratch clone with each prefix first on PATH. Its README rehearsal installed the README's current pi (1.0.2 at CI's cutoff) into its own prefix. Results (measured):
- Every install, the mixed 1.0.3 included, passed the same 17 lines: install, pi-subagents, pi list (two), pi session, pi turn, pi post-edit, pi-review, four hooks, the verifier pipe, the knowledge pull, objective, doctor, pi-worker and readme checklist. On 1.4.0 two hook lines printed in a different order; the set was identical.
- So **the install check cannot see a mixed pi install** (measured on fresh 1.0.3). Only the new doctor row would.
- The one failure on every version, the 1.0.2 baseline included, is `hook adoption — no-output`. Adoption skips projects under the OS temp roots and `/tmp` (`packages/nana-pack/lib/adoption.mjs:39-44`), and the scratch folder sits under `/private/tmp`. CI and the seat's own runs pass it.

**What nana touches in pi that changed from 1.0.2 to 1.4.0** (pi CHANGELOG 1.0.3 to 1.4.0, installed docs and `.d.ts`; every item measured by reading):
- `before_agent_start` (1.2.0) became a union on `messageType`; `"custom"` events have no `prompt`. `systemPromptOptions` stays on the shared base (1.4.0 `types.d.ts:720-742`). So the five nana handlers that write `event.systemPromptOptions.sections` stay valid. nana-knowledge reads `event.prompt` behind a `typeof prompt !== "string"` guard (`nana-knowledge.ts:162`), so it returns early on custom runs. Since 1.2.0 the section writers also run on runs that `pi.sendMessage(…, { triggerTurn })` starts, such as pi-subagents' completion wakes. 1.2.0 also fixed sections dropping after the first tool call in those runs. No code change.
- `--tools` (1.0.4) keeps MCP tools unless an entry starts with `mcp__`. But "An MCP tool that no entry names or matches is never declared directly … only `tool_search`, if listed, can load it" (1.4.0 `docs/cli.md:132`). pi-worker's `-t read,grep,find,bash,edit,write` (`worker-config.mjs:19`) names neither codemode nor `tool_search`, so builders gain no MCP reach (inferred from docs). The desk's `-t` is the same case. No code change.
- `sendUserMessage` needs `deliverAs` while a run starts (1.2.0). nana calls neither `sendMessage` nor `sendUserMessage` (grep). No change.
- `./client` and `./experimental/plugin` exports removed (1.2.0). nana imports no pi subpath (grep). No change.
- Print mode exits 1 when the final reply is cut off at the output limit (1.2.0). pi-review and pi-worker then record a failed run. Correct behaviour; a known limit.
- `agent_settled` gains `aborted` (1.1.0); nana-notify reads no event field. `generateSummary` ignores `reserveTokens` (1.4.0); nana does not call it. The Azure provider was renamed (1.0.3); nana's defaults name `openai-codex`. No change.
- Every pi CLI flag nana passes is documented in both 1.0.3 and 1.4.0 `docs/cli.md` (`--append-system-prompt`, `--name`, `--thinking`, `--offline`, `--provider`, `--model`, `--no-session`, `--session-dir`, `--mode`, `--no-tools`, `--no-extensions`, `--no-skills`, `--no-prompt-templates`, `--no-context-files`, `--exclude-tools`, `--approve`, `--no-approve`, `--skill`, `--session`).
- Every "contract: pi 1.0.2" value in nana's config still holds in 1.4.0: thinking levels (`dist/cli/args.js`), `PI_SESSION_ID` in `bash.js`, session file suffix and stamp (`session-manager.js:450,712`), `PI_CODING_AGENT_SESSION_DIR` and `PI_OFFLINE` (`environment-variables.md:82,84`), the powershell tool (`windows.md`), the read window `DEFAULT_MAX_LINES = 2000` and `DEFAULT_MAX_BYTES = 50 * 1024` (`truncate.js:10-11`), bin `dist/bundle/cli.js`.
- 1.4.0 changed Windows shell detection (PowerShell outside PATH, Store aliases; `windows.md` gains a lookup order). Only a Windows run can show its effect on the install check's bash and PowerShell turns (Not verified).

**So no code change is needed for 1.4.0 compatibility on macOS (measured). Windows is unmeasured.**

Two layout facts the doctor row depends on (measured):
- A global npm install nests pi's own packages under `<prefix>/lib/node_modules/@earendil-works/pi-coding-agent/node_modules/@earendil-works/`. That holds in every scratch prefix and on this Mac's real install (`~/.local`).
- `createRequire(<pi>/package.json).resolve("<dep>/package.json")` throws `ERR_PACKAGE_PATH_NOT_EXPORTED` for pi-codemode, pi-ai and pi-mcp. So versions must be read by walking `node_modules` folders, not by `require.resolve`.

One install-check fact the design depends on (measured, by reading):
- The install check fails on any doctor `·` row not on `DOCTOR_NOTES` (`install-check.mjs:530`, `install-check-config.mjs:38-42`).
- Its temporary home strips `npm_config_*` and changes HOME (`install-check.mjs:19-33`). So on this Mac, `npm root -g` there names node's own prefix (`<node prefix>/lib/node_modules`, which holds no pi), while the `pi` on PATH is `~/.local/bin/pi`.
- So a row that finds pi through `npm root -g` would print `·` in the seat's local install check and fail it. The row must follow the `pi` on PATH.
- The README rehearsal inside the install check really installs the README's pi into a throwaway prefix and runs install, trust and doctor with it, expecting `all good` (`readme-rehearsal.mjs:55-63`, `install-check-config.mjs:178`). So every install-check leg also proves the README's pi command gives a lockstep install, through the new row.

CI cost (measured from 68 install-check job logs, 2026-10-23 00:13 to 07:16 UTC, scratchpad `icb-plan/logs/`): an install-check job's wall time is a median 48 s on macOS (30 to 70) and 193 s on Windows (168 to 328). Two floor legs add about 4 minutes of runner time per CI run. They run in parallel, so wall time does not change unless jobs queue (inferred).

## Design

**The support contract.** nana supports pi 1.0.3 (the floor) through 1.4.0 (the ceiling). CI tests both ends with the install check on macOS and Windows, and runs the suite on the ceiling. The README installs the ceiling. Doctor reports a pi whose own packages are newer than pi. 1.0.2 leaves CI.

1. **CI workflow env** (`.github/workflows/ci.yml:10-17`). `PI_VERSION` becomes `1.4.0` and `PI_BEFORE` `"2026-10-23T18:35:54Z"`, each with its provenance comment. Directly after `PI_BEFORE`, two new keys: `PI_FLOOR_VERSION: 1.0.3` and `PI_FLOOR_BEFORE: "2026-10-05T08:40:00Z"`, each with provenance. The ceiling keeps a cutoff although its packages are pinned exactly: the cutoff also fixes pi's other dependencies' own ranges, and R-1093 keeps one install-command form.
2. **install-check job: a 2 × 2 matrix.** `matrix: { os: [macos-latest, windows-latest], pi: [ceiling, floor] }`, `fail-fast: false`. The ceiling install step and version check keep today's exact lines, gated `if: matrix.pi == 'ceiling'`, so R-1078's test stays unchanged. A floor install step `npm i -g --ignore-scripts @earendil-works/pi-coding-agent@${PI_FLOOR_VERSION} --before="${PI_FLOOR_BEFORE}"` and a floor version check `test "$(pi --version)" = "${PI_FLOOR_VERSION}"` are gated `if: matrix.pi == 'floor'`. Both come before the install-check step. The release job already needs `install-check`, so all four legs gate the release. Subtraction test: two explicit gated steps are longer than one step with an expression, but each install line stays literal and greppable. The R-1090 and R-1078 checks read lines, and one leg cannot pick the other's version by a typo in an expression.
3. **suite and release jobs stay single-version**, now at the ceiling: their lines are unchanged and read `${PI_VERSION}`. Subtraction test: a floor suite leg per system costs about 19 minutes (macOS) and 35 minutes (Windows) of runner time per run (the R-2061 provenance in `ci.yml:50-55`). It would mostly re-run the roughly 164 of 218 files that never load pi (inferred from the subset, which is every file that loads pi). The floor install-check legs prove nana's runtime on the floor with a real pi.
4. **README pins move by the existing rule.** R-1093 already makes every README pi command and the missing-pi hint carry `PI_VERSION` and `PI_BEFORE`, so they become `@1.4.0 --before=2026-10-23T18:35:54Z`. The root README gains one support sentence, `nana supports pi 1.0.3 through 1.4.0`, read from CI by the new README check (R-2716). Prose, not a command, says that a pi from 1.0.3 to 1.2.0 needs npm's `--before` set before its next release, and that doctor's `pi packages` row reports a mixed install. A floor install command in a README would fail R-1093, so there is none.
5. **Doctor's `pi packages` row**, printed directly after `pi executable` (`doctor.mjs:345-368`). One new module, `packages/nana-setup/lib/pi-packages.mjs`, with injected readers:
   - **Find the pi package the `pi` on PATH runs from.** Off win32: `firstOnPath("pi")` (`doctor.mjs:285-291`), its real path, then the nearest folder at or above it whose `package.json` `name` is pi's package name (findPiRoot's walk, `packages/nana-pack/tests/pi-install.mjs:43-47`). On win32: the direct launch `piInvocation` already resolves for the version probe (`pi-invocation.mjs:12-18` → `piLaunch`, `pi-watchdog.mjs:52-80`); its first argument is pi's bin inside the package, and the same walk starts there. Any other win32 result (a `.exe`, a refusal) means not found.
   - **Read the dependencies.** Every key of that `package.json`'s `dependencies` under pi's own scope (derived from the package name `@earendil-works/pi-coding-agent`, so no new constant). For each one, read `node_modules/<name>/package.json` in the package folder, then in each parent folder, as Node's lookup does.
   - **Judge**, in this order. ✗ when any readable dependency's version is newer than pi's own version, by `versionAtLeast` (`doctor.mjs:240-252`): the detail names each such `name version`, pi's version, and `PI_INSTALL_HINT`. `·` when no pi package was found, or a dependency is missing or has no three-number version: the detail names what could not be read. Otherwise ✓, naming pi's version and how many packages it read.
   - Subtraction test: the rule is file reads only, with no spawn and no timeout. It flags every mixed install measured (fresh 1.0.2 to 1.2.0) and passes every lockstep one, this Mac included (measured, `rule-probe.mjs`). It catches fresh 1.2.0, which imports cleanly but still mixes 1.4.0 packages under pi 1.2.0, contrary to upstream's own 1.3.0 fix statement.
6. **No compatibility code change.** Measured above. If the Windows legs on the probe branch (Seat steps 1) fail, the build waits for a revised plan.

Dropped:
- **Keeping 1.0.2 as a third CI point.** 1.0.2 to 1.0.3 changes nothing nana touches: the Azure rename, codemode image files, output file modes, Home and End keys (CHANGELOG 1.0.3, measured by reading). This Mac runs 1.0.2, so it sits below the floor until it is upgraded (Open question 1).
- **One version only (1.4.0) and no floor.** That is cheaper by two CI legs, but nana would then be untested on the owner's second machine until it moves to 1.4.0. The ask is support from 1.0.3 up to 1.4.0.
- **A floor suite leg** (part 3).
- **An import probe in doctor** (spawn node, import pi's entry). It costs a cold node start, and on Windows seconds (inferred). It misses fresh 1.2.0 (measured: imports cleanly while mixed).
- **`npm root -g` as the package source.** It names the wrong prefix in the install check's temporary home on this Mac (measured above).
- **`require.resolve` for dependency versions** (`ERR_PACKAGE_PATH_NOT_EXPORTED`, measured).
- **`dist/bundle/index.js` as a fallback import** for the desk or the tests. It is a deep path, and the desk is frozen.
- **A doctor note when pi is outside 1.0.3 to 1.4.0** (Open question 2).
- **`--exclude-tools 'mcp__*'` or `--no-mcp` for pi-worker.** The docs say undeclared MCP tools stay unreachable, and `--no-mcp` does not exist on 1.0.3.
- **Rewriting the "contract: pi 1.0.2" provenance comments.** Each still holds on 1.4.0 (measured), and each records when it was read.

## Class

Install lane: it changes doctor (`nana-setup`) and the CI install-check job. Ladder: Opus final reviewer (`claude-review`, the roster's reviewer), astra land reviewer (`pi-review`, the roster's land slot, so no `seat-land.md`), the seat's wrong-code pairs, one independent check, the local macOS install check (the owner's 2026-10-12 ruling), and CI's four install-check legs on the reviewed tip.

The claim I expect to be read differently: the README edits touch `apps/desk/README.md`, and the desk is frozen. The edit is one install command and its tested-on note, forced by R-1093's check. No desk code changes.

A needed change to pi-worker, pi-watchdog, the desk, the bench, the install check's code or any extension stops the build, which reports instead.

## Threat model

Honest variation in our tools' output and machine state is in scope:
- any pi from 1.0.3 to 1.4.0, installed fresh or with a cutoff;
- npm's resolution on the install date: caret ranges float to the newest pi packages (measured) while exact pins do not;
- npm's global layout: pi's packages nested under pi (measured), or hoisted beside it;
- Windows: the npm `pi.cmd` shim beside `node_modules` in the npm prefix, 8.3 temp paths, the new 1.4.0 shell lookup;
- a stub `pi` outside any package, as the doctor tests use, and pi installed by pnpm, Volta, bun or pi's own installer (the row then says `·`);
- this Mac's mismatch between the `pi` on PATH and `npm root -g` inside the install check's home.

Deliberate forgery is out:
- a hand-edited `package.json` version in pi's tree;
- a fake `pi` placed first on PATH;
- a registry serving different bytes under the same version.

A finding outside the model is a residual. The public repo carries no owner name and nothing about the owner's work: the plan's notes say "the owner's second machine", never where or what it is.

## Precedent

Precedent:
- `.github/workflows/ci.yml` — the env block and its provenance comments (`:10-17`), the install-check job (`:20-42`) the matrix extends, and the suite job's matrix (`:44-49`).
- `packages/nana-pack/tests/ci-workflow.test.mjs` — the R-1091 declaration and seal checks (`:61-78`), the shape of the floor declaration check; the R-1078 checks (`:273-290`) and the R-1090 check (`:50-60`), the shape of the matrix check; R-597's check (`:19-48`).
- `packages/nana-setup/lib/doctor.mjs` — the `pi executable` block (`:345-368`) with its injected `opts.pi` readers, where the new row sits; the `pi pi-subagents` row (`:560-571`), which reads an installed `package.json` version and names a fix; `versionAtLeast` (`:240-252`); `firstOnPath` (`:285-291`).
- `packages/nana-setup/lib/pi-invocation.mjs` and `packages/nana-pack/bin/pi-watchdog.mjs` `piLaunch` (`:52-80`) — read only: the win32 shim to package-folder resolution.
- `packages/nana-pack/tests/pi-install.mjs` — `findPiRoot`'s real-path walk to the pi package (`:43-47`), the off-win32 search.
- `packages/nana-setup/lib/steps.mjs` — `PI_INSTALL_HINT` (`:955-956`), reused in the ✗ detail.
- `packages/nana-setup/lib/pi-pin.mjs` — read only: how CI's pin is parsed (`:14-25`); the README check copies its shape for the floor.
- `packages/nana-setup/tests/doctor-runtime.test.mjs` — PATH stub fixtures and the `diagnose()` row lookup (`:20-50`).
- `packages/nana-setup/tests/pi-registration.test.mjs` — win32 fixtures through injected `exists` and `readText` on any OS (`:467-474`).
- `packages/nana-setup/tests/pi-install-pin.test.mjs` — the README scan against CI's pin (`:15-17`, `:88-100`), the shape of the README range check.
- `packages/nana-setup/lib/install-check-config.mjs` — read only: `DOCTOR_NOTES` (`:38-42`); the new row must never be `·` in CI or on this Mac.
- `docs/reviews/install-check-builder-2026-10-23/plan-draft.md` — the plan shape.

Departures, each named:
- The row lives in its own module, not inline in `doctor.mjs`, because finding and judging pi's package is one purpose and the doctor file is already 700+ lines. Doctor calls it the way it calls `packageSourceState`.
- The off-win32 walk copies findPiRoot's logic. That code is a test helper that production code may not import.
- The label `pi packages` stays inline like every other doctor label.

## Must-meet rows (FEAT-013, SUB-011, after R-1094)

| ID | Requirement (EARS) | Test file::title |
|---|---|---|
| R-2711 | The root CI workflow shall run the install-check job once for each pair of `macos-latest` or `windows-latest` and the ceiling or floor pi, each leg installing only its own pi version at its own cutoff and checking that `pi --version` prints that version before the install check starts. | `packages/nana-pack/tests/ci-workflow.test.mjs::install check runs on macOS and Windows at the ceiling and the floor pi, each leg installing and checking only its own version before the check` |
| R-2712 | The root CI workflow shall declare the floor pi exactly once, as `PI_FLOOR_VERSION` and a double-quoted `PI_FLOOR_BEFORE` cutoff that is a valid UTC instant in the form `YYYY-MM-DDTHH:MM:SSZ`, in its workflow-level `env:` directly after `PI_BEFORE`. | `packages/nana-pack/tests/ci-workflow.test.mjs::the floor pi and its cutoff are declared once, the cutoff quoted in UTC ISO form, directly after PI_BEFORE` |
| R-2713 | IF a dependency in pi's own package scope, listed by the pi package that the `pi` on PATH runs from, is installed for that package at a version newer than the package's own version, THEN doctor shall print a ✗ `pi packages` row naming each such dependency with its installed version, the package's version and the pi install hint. | `packages/nana-setup/tests/doctor-pi-packages.test.mjs::a pi package with one of its own packages installed newer than itself prints a ✗ pi packages row naming it, both versions and the install hint` |
| R-2714 | WHEN doctor reads every dependency in pi's own package scope of the pi package that the `pi` on PATH runs from and none is newer than that package's own version, doctor shall print a ✓ `pi packages` row naming that version and the number of packages read. | `packages/nana-setup/tests/doctor-pi-packages.test.mjs::a pi package whose own packages are at or below its version, nested or hoisted, prints a ✓ pi packages row naming its version and count` |
| R-2715 | IF doctor finds no pi package for the `pi` on PATH, or cannot read the version of one of its dependencies in pi's own package scope while none it read is newer, THEN doctor shall print a `·` `pi packages` row naming what it could not read. | `packages/nana-setup/tests/doctor-pi-packages.test.mjs::a pi outside any package, a missing dependency or an unreadable version prints a · pi packages row, never ✗` |
| R-2716 | The root README shall state the supported pi range as `supports pi <PI_FLOOR_VERSION> through <PI_VERSION>`, with both values read from the root CI workflow. | `packages/nana-setup/tests/pi-install-pin.test.mjs::the root README names CI's floor and ceiling as the supported pi range` |

Seal test (one for the new sealed values; it compares the workflow's text with literals):
- `packages/nana-pack/tests/ci-workflow.test.mjs::pin R-2711 and R-2712: CI tests the ceiling pi 1.4.0 and the floor pi 1.0.3 at cutoff 2026-10-05T08:40:00Z` names R-2711 and R-2712.

Existing rows the lane amends (requirement first, then the test):
- **R-1090**, text becomes: "Every root CI workflow step that installs pi shall pass npm's `--before` flag set to the cutoff declared with the version it installs: `PI_BEFORE` with `PI_VERSION`, `PI_FLOOR_BEFORE` with `PI_FLOOR_VERSION`." Its check accepts exactly those two pairs, and still requires a ceiling install in the suite and release jobs. The title stays.
- **R-1091**: the sealed value becomes `2026-10-23T18:35:54Z`, in the row text and in its seal check. Both titles stay.
- **R-597**: the row text stays. Its check drops the literal `PI_VERSION: 1\.0\.2`, a sealed value asserted outside its pin (a standing breach of "every other assertion imports the name"); the new seal test pins the version.
- **R-1078 and R-1093**: unchanged. R-1078's check must pass unedited (part 2). If the builder cannot keep it unedited, the build stops and reports.

R-2717 to R-2719 stay free. New rows go in SUB-011 directly after R-1094, each `untested` first, then `implemented` with backticked `file::title` evidence when its check passes. Add no heading. If the adversary pass judges the three doctor rows to belong in FEAT-015 beside R-952 (the `pi executable` row), the seat moves them there before brief 1. The Feature line then stays FEAT-013, and the brief names both.

### What each test does, and why it is red on main

- **R-2711.** Read the install-check job block.
  - Assert `os: [macos-latest, windows-latest]`, `pi: [ceiling, floor]` and `fail-fast: false`.
  - Exactly one step installs `@${PI_VERSION}` with `--before="${PI_BEFORE}"` under `if: matrix.pi == 'ceiling'`.
  - Exactly one step installs `@${PI_FLOOR_VERSION}` with `--before="${PI_FLOOR_BEFORE}"` under `if: matrix.pi == 'floor'`.
  - Each install is followed, before the `install-check.mjs` step, by a version check against its own variable under the same `if:`.
  - No step installs both, and no step has no gate.
  - Red on main: there is no `pi:` dimension and no floor step.
- **R-2712.** Exactly one `PI_FLOOR_VERSION:` key and one `PI_FLOOR_BEFORE:` key, two-space indented in the workflow-level env, after `PI_BEFORE` with only comments or blank lines between. The cutoff is double-quoted and round-trips through `Date` as `pi-pin.mjs:21-23` does. Red on main: neither key exists.
- **R-2713.** Fixture prefix in a temp folder, off win32:
  - `lib/node_modules/@earendil-works/pi-coding-agent/package.json`: version `1.0.3`; dependencies `@earendil-works/pi-codemode ^1.0.3`, `@earendil-works/pi-ai ^1.0.3`, `chalk 6.0.0`.
  - Nested codemode `1.4.0` and pi-ai `1.0.3`.
  - `dist/bundle/cli.js`, an sh stub that prints `1.0.3`; `bin/pi` links to it. PATH is `<prefix>/bin:/usr/bin:/bin`.
  - Expect the `pi packages` row with status `fail`. Its detail holds `@earendil-works/pi-codemode 1.4.0`, `1.0.3` and `PI_INSTALL_HINT`. It names neither pi-ai nor chalk.
  - Variant: pi `1.9.0` with a dependency at `1.10.0` fails, so the compare is numeric.
  - Variant: `npm_config_prefix` points at a second prefix that holds a lockstep pi; the row still fails, so it follows PATH.
  - win32 variant on any OS: injected `platform: "win32"`, PATH `C:\npm`, `C:\npm\pi.cmd`, and the package at `C:\npm\node_modules\@earendil-works\pi-coding-agent` with a newer nested dependency. It fails.
  - Red on main: doctor prints no `pi packages` row.
- **R-2714.** The same fixture, lockstep, with `@earendil-works/pi-mcp ^1.0.3` added to the dependencies:
  - codemode `1.0.3`, pi-ai `1.0.2` (older passes), chalk `6.0.0` (outside the scope);
  - one dependency hoisted to `lib/node_modules/@earendil-works/pi-mcp` instead of nested.
  - Expect status `ok`, with a detail naming `1.0.3` and `3`.
  - The win32 variant passes too.
  - Red on main: no row.
- **R-2715.**
  - (a) A stub `pi` outside any package, the `doctor-runtime` shape: status `note`, and the detail says no pi package was found.
  - (b) A declared dependency with no folder: `note`, naming it.
  - (c) A dependency whose version is `"x"`: `note`, naming it.
  - (d) A missing dependency plus a newer one: `fail`, because R-2713 wins.
  - (a) to (c) are never `fail`.
  - Red on main: no row.
- **R-2716.** Read `README.md` and `ci.yml`. Find exactly one match of `supports pi (\S+) through (\S+)` in the README, equal to CI's `PI_FLOOR_VERSION` and `PI_VERSION`. Red on main: no sentence and no floor key.
- **Seal.** `^  PI_VERSION: 1\.4\.0$`, `^  PI_FLOOR_VERSION: 1\.0\.3$` and `^  PI_FLOOR_BEFORE: "2026-10-05T08:40:00Z"$`, each once. Red on main.

Existing tests the change touches (listed edits, not new tests):
- `ci-workflow.test.mjs`: the R-597, R-1090 and R-1091 edits above.
- The doctor tests that put a bare stub `pi` on PATH (`doctor-runtime`, `doctor-package-source`, `stub-pi.mjs` users) now also get a `·` `pi packages` row. A `·` does not block `all good` (`nana-setup.mjs:358-399`). None asserts the whole row list (inferred; the builder's suite run confirms).
- The install-check unit tests stub doctor's output, so they are untouched.

## Tunables

| Name | Where | Value | Provenance |
|---|---|---|---|
| `PI_VERSION` | `ci.yml` env | `1.4.0` | chosen 2026-10-23 (R-2711, R-2716): the owner's ceiling; measured green, full suite and install check on macOS |
| `PI_BEFORE` | `ci.yml` env | `"2026-10-23T18:35:54Z"` | measured 2026-10-23 (R-1091): the seat's scratch install moment of pi 1.4.0; `--before` at it reproduced `npm ls -g --all` exactly (262 lines). Valid from 2026-10-21T22:49:25.360Z (pi-tui 1.4.0, the last of its packages; 22:49:00Z fails `ETARGET`). Move it with `PI_VERSION`. |
| `PI_FLOOR_VERSION` | `ci.yml` env | `1.0.3` | chosen 2026-10-23 (R-2711, R-2712, R-2716): the owner's second machine's pi |
| `PI_FLOOR_BEFORE` | `ci.yml` env | `"2026-10-05T08:40:00Z"` | measured 2026-10-23 (R-2712): inside the lockstep window from pi 1.0.3's publish (08:37:00.736Z) to the first 1.0.4 package, pi-ai (21:44:42.433Z); a scratch install at it resolved all six of pi's packages at 1.0.3. Move it with `PI_FLOOR_VERSION`. |

Reused unchanged: `PI_PACKAGE` (`worker-config.mjs:101`, contract), its scope for the dependency filter, `NPM_DIRS[0]` (`worker-config.mjs`, `node_modules`), `PI_INSTALL_HINT`, `versionAtLeast`, `firstOnPath`. The row adds no code tunable. Its label is inline like doctor's others.

Module headers: `pi-packages.mjs` gets the six-tag header (`@effects disk`, reads only). `doctor.mjs` `@outputs` names the `pi packages` row. `ci-workflow.test.mjs` `@purpose` adds the floor and matrix.

## Wrong-code pairs (the seat runs each; each must turn its test red every run)

CI (text checks; any system):
1. Main's `ci.yml` → R-2711, R-2712, seal.
2. The `pi` matrix dimension dropped → R-2711.
3. The floor leg installs `${PI_VERSION}` → R-2711.
4. The floor install ends `--before="${PI_BEFORE}"` → R-2711 and R-1090.
5. The floor version check compares with `${PI_VERSION}` → R-2711.
6. The floor version check placed after the install-check step → R-2711.
7. One install step with no `if:` → R-2711.
8. `PI_FLOOR_BEFORE` unquoted, or with milliseconds → R-2712.
9. `PI_FLOOR_VERSION` declared twice, or above `PI_BEFORE` → R-2712.
10. `PI_VERSION: 1.3.0`, `PI_FLOOR_VERSION: 1.0.2`, or the floor cutoff moved → seal.

Doctor (pure fixtures; win32 cases run on any system):
11. Main's doctor (no row) → R-2713, R-2714, R-2715.
12. Equality instead of "newer" → R-2714 (the older pi-ai case).
13. String compare instead of numeric → R-2713 (the 1.10.0 case).
14. The scope filter dropped → R-2714 (chalk 6.0.0 above 1.0.3).
15. Nested lookup dropped (hoisted only) → R-2713 and R-2714.
16. Hoisted lookup dropped (nested only) → R-2714 (pi-mcp).
17. The package found through `npm root -g` instead of the `pi` on PATH → R-2713 (the decoy prefix).
18. A missing dependency reported ✗ → R-2715 (b).
19. No package found reported ✗ → R-2715 (a).
20. The ✗ detail without `PI_INSTALL_HINT` → R-2713.
21. The win32 branch walks the real path instead of the shim's package → R-2713 and R-2714 win32 cases.

README:
22. The README names `1.0.2 through 1.4.0` → R-2716.
23. The README sentence removed → R-2716.

The seat's real-run checks on macOS (scratch prefixes, no repo edits; not mutation-runner pairs):
- R1. Doctor with the fresh 1.0.3 prefix first on PATH → `✗ pi packages` naming six packages at 1.4.0, `1.0.3` and the hint (the rule measured that list; `rule-probe.mjs`).
- R2. Doctor with the pinned 1.0.3 and pinned 1.4.0 prefixes → `✓`.
- R3. The install check with the pinned 1.0.3 prefix, then the pinned 1.4.0 prefix, first on PATH → every line PASS, `doctor` and `readme checklist` included.

## Windows notes

- The owner's second machine is Windows on pi 1.0.3. The floor's Windows install-check leg is the only CI proof for it.
- CI runs the install check from Git Bash. setup-node puts npm's prefix and `pi.cmd` on PATH. `piLaunch` already resolves that shim to its package for the review launch in today's Windows legs (measured by CI passing; `pi-watchdog.mjs:52-80`). The doctor row reuses that resolution.
- The Windows global layout nests pi's packages the same way: `<prefix>\node_modules\@earendil-works\pi-coding-agent\node_modules\@earendil-works\…` (inferred from npm 10's global install, not measured on Windows). The hoisted fallback covers the other layout.
- pi 1.4.0 changed Windows shell detection (CHANGELOG 1.4.0; `windows.md` lookup order). The install check's bash turn and PowerShell turn run on Windows. Whether 1.4.0 picks the same shells there is the riskiest assumption in this plan. Seat steps 1 measures it before the build.
- The Windows suite leg (about 35 minutes) moves to 1.4.0 with the ceiling. Nothing measured it there yet.
- The README rehearsal on Windows installs the README's pi into `.npm-global` and runs doctor with it (`install-check-config.mjs:169-171`). The new row reads that prefix's `pi.cmd` package.
- The doctor row's win32 cases run through injected readers on every system. Only CI's Windows legs prove the real layout.

## Known limits (the seat writes them to FEAT-013's known-bug file before the final round)

- CI runs no suite on the floor. A later nana change that uses an API newer than 1.0.3 passes the suite and fails on 1.0.3 only where the install check exercises it.
- CI tests no interior version (1.0.4, 1.1.0, 1.2.0, 1.3.0). This plan measured only their imports, once.
- The row checks npm layouts only. pnpm, Volta, bun and pi's own installer give `·`.
- The row flags a mixed install although pi's CLI and nana's extensions work on one (measured). What breaks is code importing pi's package entry: the desk, the bench and nana's suite.
- pi-subagents 0.75.0 is unproven on 1.4.0. Its completion wakes use `pi.sendMessage(…, { triggerTurn })`, which 1.2.0 reworked, and its herdr bridge calls `sendUserMessage` without `deliverAs` (`src/extension/herdr-pi-bridge.js:135`).
- From 1.2.0, a pi-review or pi-worker run whose final reply is cut off at the output limit exits 1 and is recorded as failed.
- From 1.2.0, nana's prompt sections also go into runs a subagent's completion starts, while the knowledge pull skips them.
- The floor legs' README rehearsal installs the ceiling, not the floor. No README command names the floor.
- This Mac's pi 1.0.2 is below the floor until it is upgraded.
- The desk on 1.4.0 passed its unit tests only. No desk browser test and no service restart ran. The desk stays frozen.
- Each CI run now has three macOS jobs. Two lanes pushing at once may queue against GitHub's macOS job limit (inferred, not measured).

## Not verified

- Any Windows run on 1.4.0 or 1.0.3: suite, install check, doctor row.
- pi-subagents 0.75.0's behaviour on 1.4.0.
- The desk service on 1.4.0.
- That npm lays pi's packages out the same way on Windows.
- The YAML's matrix gating and job names. The builder writes them; the CI run proves them.
- That the stub-`pi` doctor tests stay green with the new `·` row (inferred from the summary logic).
- Which code the owner ran when he saw the error (inferred: the suite or another importer of pi's entry).

## Docs that change

- `README.md`:
  - the support sentence (R-2716) and the prose cutoff advice for 1.0.3 to 1.2.0, near the runtime table (`:86-95`);
  - Fresh machine step 2 on macOS and Windows (`:135`, `:150`), by R-1093;
  - the desk and bench runtime cells "tested on 1.0.2, 2026-10-05" become "tested on 1.0.3 and 1.4.0, 2026-10-23", naming what ran.
- `packages/nana-setup/README.md`:
  - "Upgrade pi itself" (`:80`), by R-1093, plus the same cutoff prose;
  - the doctor row list (`:169`) and the doctor paragraph (`:277`) gain `pi packages`;
  - the test table (`:504`) gains `tests/doctor-pi-packages.test.mjs`.
  The readme check is the test of these claims.
- `apps/desk/README.md` (`:25`) and `apps/bench/README.md` (`:11-13`, `:26`): install commands by R-1093; tested-on notes as above. Docs lines only; the desk stays frozen.
- `packages/nana-pack/README.md` (`:84`): "Tested host since 2026-10-05: pi 1.0.2" gains "1.0.3 and 1.4.0, suite and install check, 2026-10-23".
- `REQUIREMENTS.md`: R-2711 to R-2716 in SUB-011 after R-1094; R-1090 and R-1091 amended.
- `docs/requirements-tree.md` and `docs/code-map.md` regenerated; `map:check` green.
- Seat notes, in the reviewed change before the final round:
  - FEAT-013's known-bug file gets the Known limits above;
  - HANDOFF drops "[optional, since 2026-10-21] The pi upgrade", and gains a Landed line, the session entry and the owner's action for the second machine (Open question 3).
- Unchanged: install, uninstall, every hook and extension, pi-worker, pi-watchdog, pi-review, the install check's code, the desk's code, the bench's code.

## Seat steps

0. Snapshot `git status --ignored --porcelain` of the checkout. The planner's before and after copies, `pi-ver/repo-status-before.txt` and `pi-ver/repo-status-after.txt`, are identical (6 lines).
1. **Probe before the build.** It costs no build and tests the riskiest assumption. Push two probe branches from main; pushing a branch needs no approval.
   - `probe/pi-140`: only `PI_VERSION: 1.4.0` and `PI_BEFORE: "2026-10-23T18:35:54Z"`.
   - `probe/pi-103`: only `PI_VERSION: 1.0.3` and `PI_BEFORE: "2026-10-05T08:40:00Z"`.
   - Expect three known red files on each: `ci-workflow` (R-597 and R-1091 literals), `pi-install-pin` and `fresh-machine` (README against CI). Read every other result. Above all, read the Windows install-check lines `pi turn` and `pi turn powershell`, and the Windows suite leg.
   - This also gives the Windows suite's one-time measurement at 1.0.3.
   - If a Windows leg fails beyond those files, stop and revise the plan before brief 1. Delete the probe branches after reading.
2. Cut `feat/pi-version-support` from main at `~/nana-pi-wt/pi-version-support`.
3. Run one adversary pass on this draft; it also settles the doctor rows' feature. Commit the must-meet of record and build brief 1. The brief carries `Feature: FEAT-013 · Install and connect harness runtimes` and a Precedent section from the list above. Run `node "$HOME/nana-pi/packages/nana-pack/bin/brief-check.mjs" --brief <file> --tree <worktree>`.
4. Build with the larger builder, as an install lane: `pi-worker --lane pi-version-support --brief … --out … --lane-size larger` (roster: `openai-codex gpt-5.6-sol high`).
5. Seat checks on the build tip:
   - `node packages/nana-pack/tests/ci-workflow.test.mjs`, `node packages/nana-setup/tests/doctor-pi-packages.test.mjs`, `node packages/nana-setup/tests/pi-install-pin.test.mjs`;
   - `npm run test:locked`, `map:check`, the readme check and the trace;
   - `node scripts/requirements-moved.mjs --root . --base main`, carried into the review briefs and the land.
6. Run `node packages/nana-setup/bin/install-check.mjs` locally on macOS, per the owner's ruling, on this Mac's pi. Then run real-run checks R1 to R3 against the planner's scratch prefixes (`pi-ver/fresh103`, `pinned103`, `pinned140`), each through PATH only.
7. Run pairs 1 to 23 through the mutation runner. Re-run it after any seat change to code or tests, before the review.
8. Push a draft PR. CI's four install-check legs and three suite legs must pass at the new pins. Keep the Windows logs in the lane's review folder.
9. Write the notes before the final round.
10. Run the Opus final reviewer, the astra land reviewer and the one independent check on the exact tip.

## Open questions to the owner

1. **Upgrade this Mac's pi from 1.0.2 to 1.4.0 after the land?**
   - Tested: the full suite on 1.4.0 and 1.0.2 in scratch prefixes; the install check on 1.4.0, 1.0.3 and 1.0.2.
   - Result: the full suite gave the same 212 passing files and 8,215 passing checks on 1.0.2, 1.0.3 and 1.4.0. The install check gave the same 17 passing lines on each. Every failure came from the scratch environment.
   - Trade: after the land, CI no longer tests 1.0.2, so this Mac's local suite and install check would run on a pi outside the range. Upgrading means one `npm i -g` with the README command and a desk restart. The desk passed its unit tests on 1.4.0 but no browser test.
   - Recommendation: upgrade.
   - It is your call because it changes the main machine's pi under the running desk.
   - Default: **yes**.
2. **A doctor note when pi is outside the tested range?**
   - Tested: nothing; this is a design choice.
   - Trade: a `·` row "pi 1.5.0 is newer than the tested 1.4.0" would tell you when a pi upgrade outran CI. pi shipped six releases from 1.0.2 to 1.4.0 in 17 days (measured, publish times), so it would show often. It also needs doctor to read the floor and ceiling at run time.
   - Recommendation: not now; the support sentence in the README carries the range.
   - It is your call because it is a new standing message on every machine.
   - Default: **no**.
3. **Your second machine's pi after the land.**
   - Tested: a fresh 1.0.3 install mixes in pi's 1.4.0 packages; doctor's new row flags it (measured on macOS).
   - Trade: moving to 1.4.0 with the README command gives the tested ceiling and exact pins. Staying on 1.0.3 needs the reinstall with `--before=2026-10-05T08:40:00Z` the seat already gave you.
   - Recommendation: move to 1.4.0 once the lane's Windows legs pass.
   - It is your call because it is your machine.
   - Default: **1.4.0**.
