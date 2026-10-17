# Windows fix plan (feature-first, 2026-10-17)

**Stakes:** this is mostly low-blast work. Of the 48 failing in-scope files, 41 fail because of test portability. Five of the lanes below change product code, and three of those (install skills, land, uninstall) are install or land class. The suite's Windows leg is non-blocking, so nothing reaches users until it lands. Making the leg blocking (L13) is the only change that alters the gate.

**What I checked in the repo:**
- `.gitattributes` holds only `packages/nana-setup/tests/fixtures/retired/** -whitespace`.
- `git ls-files --eol` shows 2061 `i/lf`, 0 `i/crlf` and 29 `i/none` (binary).
- `ci.yml:51` reads `continue-on-error: ${{ matrix.os != 'macos-latest' }}`. The install-check job is already blocking on Windows.
- `project.mjs:227` renames over a file whose descriptor is still open; it is closed only at `:236`.
- `nana-land.mjs:71` and `:148` compare with plain `realpathSync`.
- `steps.mjs:336` skips the spec and py-* skills on win32, matching rows R-665 and R-666.
- `uninstall.mjs:41` throws "uninstall is POSIX-only".
- `project.mjs:543-547` accepts any regular file as the CLAUDE.md copy, and `project.mjs:258-260` copies CLAUDE.md only when the project is created.
- The TS template splits on `"\n"` at `code-map.mjs:374`, `readme-check.mjs:285/325/351/388/401/413/422` and `requirements-trace.ts:72`. Neither template ships a `.gitattributes`.
- `scripts/test.mjs:292` (scratch, and so HOME) and `:359` (per-file TEMP) build from `os.tmpdir()`. `:392` prints `slice(0, 20)` of the FAIL lines, or of the whole output when there are none.

## 1. Fix classes

| Class | Files (count: names) | Crashes, hiding later checks | User-facing | Fix location | Size |
|---|---|---|---|---|---|
| pathname-import (`.pathname` or a raw `C:\` path passed to `import()` or a spawn) | 10: discovery, hook (knowledge), immutable-review, review-ledger, templates-update, gate-policy-paths, state-manifest, template-acceptance, restore, trust | 6: hook (32 hidden), immutable-review, review-ledger (about 146), state-manifest, restore, trust | test-only | tests: `fileURLToPath` / `pathToFileURL(...).href` | S (mechanical) |
| crlf-eol (no eol rule; autocrlf=true checkout) | 7: ci-workflow, code-map, requirements-tree, entry-guidance, templates-render, product-report, mutation-runner(a). Also secondary in retired-artifacts (5 checks), trust and project-working-region | 2: templates-render (about 158 hidden), product-report | **both seats**: a TS scaffold or adopt fails `map:check` on CRLF. The rest is maintainer-only | `.gitattributes` `* text=auto eol=lf`; TS template splitters `\r?\n`; `lib/mutation-runner.mjs:370,:196` `-c core.autocrlf=false` | S |
| rename-open-file | 1: project-working-region | no | **both seats**: `nana-setup project` never refreshes AGENTS.md on Windows | `packages/nana-setup/lib/project.mjs:223-236` | S |
| symlink (CLAUDE.md copy) | 1: project | yes (about 88 hidden) | **Claude Code seat**: a stale CLAUDE.md copy is never compared (`project.mjs:543-547`) or refreshed | `project.mjs:258-260,:543-547`; `project.test.mjs:79` | S |
| install-shape-copies | 5: install, skills-and-standards, retired-artifacts, uninstall, verifier-pipe | 4: install, skills-and-standards (49 hidden), uninstall (29 hidden), verifier-pipe (29 hidden) | **Claude Code seat**: no spec or py-* skills (`steps.mjs:336`). **Both seats**: no uninstall (`uninstall.mjs:41`) | `steps.mjs:216-224,:263,:336`; `uninstall.mjs`; the tests | M (skills), M–L (uninstall) |
| 8.3-short-path | 3: land, handoff-artifact, handoff-staleness | 1: handoff-staleness | **both seats, low**: false fail-closed land refusal (`nana-land.mjs:71,:148`) | `nana-land.mjs` `realpathSync.native`; runner `scripts/test.mjs:292` | S |
| home-without-userprofile | 3: gate-corpus, adoption-reader, objective-golden | via the NTFS-names class | test-only | tests: set and restore `USERPROFILE` beside `HOME` | S |
| ntfs-illegal-name | 3: render, config-display-text, display-surfaces. Also secondary in adoption-producer, adoption-reader, objective-golden (about 110 hidden) and state-manifest | 2 primary, plus 4 secondary crash points | test-only | tests: win32 SKIP, or NTFS-legal hostile names (U+2028, U+202E) | M (many sites) |
| posix-stub-or-mode | 5: lane-write-guard, worker-lane, doctor-detail, template-release, settings-merge | 4: lane-write-guard, worker-lane (about 40), doctor-detail, settings-merge (20) | test-only. Known bug: the `/tmp` lane root at `nana-gate.ts:197` | tests: npm-layout pi stub, `path.delimiter`, mode-bit gates | M |
| posix-separator / JSON-escaped path | 5: handoff-store, handoff-trust, frontier, post-edit-file-queue, install-check | no | test-only | tests | S |
| process-kill (SIGKILL on win32 is exit 1) | 1: test-runner | no | test-only | `test-runner.test.mjs:218,:227,:229` | S |
| cmd-shim-spawn (frozen desk resolver called at import) | 1: agent-dir-parity | yes (the pack and setup legs) | test-only here; the desk is frozen | `agent-dir-parity.test.mjs:37,:131` | S |
| live-cwd removal / timeout | 2: shared-memory-hook, agent-dir-hostile | 1: agent-dir-hostile (10) | test-only. The scenario cannot happen on Windows | win32 SKIP | S |
| cross-drive `path.relative` | 1: adoption-producer | yes (19 hidden) | test-only | `adoption-producer.test.mjs:305`; latent at `trust.test.mjs:82` | S |

Totals: 48 files, 25 of them crashing. Runner instrument fault: `scripts/test.mjs:392` hides a crash stack whenever FAIL lines exist. It also prints the head of the output, not the tail, when no FAIL line exists. Every crashing file costs an extra CI round until that is fixed.

## 2. Lanes, in order

Rules that hold in every lane:
- The macOS pass count of every touched file must not drop (harm list: regression of main).
- Every win32 SKIP prints a line naming its reason.
- A masked layer that turns out to need product code goes to a new lane as a known bug, not into this one.

### L1 project-refresh-win32 — product, both seats (ordinary)
- **Feature:** on Windows, `nana-setup project` refreshes a stale AGENTS.md working region, and `--check` flags a CLAUDE.md copy that differs from AGENTS.md.
- **Classes:** rename-open-file, symlink.
- **Must-meet on the Windows leg:**
  - `packages/nana-setup/tests/project-working-region.test.mjs`
  - `packages/nana-setup/tests/project.test.mjs`
  - New test 1: on win32, refresh rewrites the CLAUDE.md copy to equal the refreshed AGENTS.md.
  - New test 2: `--check` reports ✗ for a CLAUDE.md copy whose bytes differ (forced `NANA_SETUP_PLATFORM=win32`, so it runs on every leg).
- **Files:**
  - `project.mjs:223-227`: close the descriptor after the identity and byte re-check, before `renameSync`; drop the close in `finally` at `:236`; retry briefly on EPERM or EBUSY.
  - `project.mjs:543-547`: compare bytes. Refresh also rewrites the win32 copy.
  - `project-working-region.test.mjs:16` normalizes `shared` to LF; `:183` accepts either refusal detail on win32.
  - `project.test.mjs:79` branches by platform (and `:306`).
  - Requirement diff: R-329 and a new row for the copy compare and refresh.
- **Size:** S–M. Expect 2 CI rounds, because the EPERM cause is inferred.

### L2 crlf-eol — product, both seats (ordinary)
- **Feature:** a TS project scaffolded or adopted on a default-git Windows machine passes `map:check`, `readme-check` and the trace, and the nana-pi checkout is LF on every runner.
- **Class:** crlf-eol.
- **Must-meet:**
  - ci-workflow, code-map, requirements-tree, entry-guidance (nana-setup), templates-render, product-report and mutation-runner (both halves).
  - New test 1: a CRLF copy of each rendered template (TS and Python) passes its code-map, readme-check and trace scripts. It runs on macOS too. The Python side is inferred safe through universal-newline `open()`, and this test pins it.
- **Files:**
  - `.gitattributes` gets `* text=auto eol=lf` and keeps line 1. No renormalisation is needed, since the index has 0 `i/crlf`.
  - `templates/typescript/template/scripts/code-map.mjs:374`, `readme-check.mjs:285-422` and `tests/requirements-trace.ts:72` split on `/\r?\n/`.
  - `packages/nana-pack/lib/mutation-runner.mjs:370,:196` take `-c core.autocrlf=false`.
  - `mutation-runner.test.mjs:447-462` gets a posix gate naming the README's npm limit (README:416-417).
  - Optional: `product-report.test.mjs:159` gets `/<script>\r?\n/`.
- **Size:** S. Expect 1–2 rounds.
- **Dependency:** this lane also cures 5 retired-artifacts checks, so it lands before L4 closes.

### L3 runner-readout — test harness (ordinary)
- **Feature:** a Windows CI log shows a crashed file's stack, and HOME roots are long-form the way a real profile is.
- **Classes:** the 8.3 runner side, process-kill.
- **Must-meet:**
  - `packages/nana-pack/tests/test-runner.test.mjs`, on the Windows leg and on macOS.
  - New test 1: a file that prints FAIL lines and then throws shows both its FAIL lines and its last stack lines.
- **Files:**
  - `scripts/test.mjs:292`: wrap scratch, which feeds HOME and USERPROFILE, in `fs.realpathSync.native`.
  - Keep `:359` (TEMP) in 8.3 form on purpose. A real Windows TEMP is often 8.3, and the 8.3 TEMP found the real bug fixed for R-1164.
  - `:390-392`: after the FAIL lines, print the last 15 lines when the final output line is not a check line.
  - `test-runner.test.mjs:218,:227,:229` branch on `posix`. On win32, g-signal reads `exit 1`, and the trap fixture adds one file.
- **Size:** S. Expect 1–2 rounds.

### L4 win32-install-skills — product, Claude Code seat (install class: 2 reviewers plus wrong-code pairs)
- **Feature:** on Windows, `nana-setup install` gives the Claude Code seat the spec, py-lint, py-review and py-test skills as checked byte-equal mirrors, and the install tests assert the Windows shape.
- **Classes:** install-shape-copies (skills part), and pathname at `state-manifest.test.mjs:50,:67`.
- **Must-meet:**
  - `packages/nana-setup/tests/install.test.mjs`, `skills-and-standards.test.mjs`, `retired-artifacts.test.mjs` and `state-manifest.test.mjs` pass on the Windows leg.
  - The install-check job stays green on both operating systems.
  - New test 1: with `NANA_SETUP_PLATFORM=win32`, the four skills mirror byte-equal, an owner-added file survives (R-359), and a stale copy reads ✗ (R-938). This pins the untested rows R-351, R-938, R-388 and R-359.
- **Wrong-code pairs:**
  - A mirror without the byte check, so drift goes unflagged.
  - A mirror that deletes an owner-added file.
  - The skip left in at `:336`.
- **Files:**
  - `steps.mjs:216-224`: generalise the requirements mirror to `CLAUDE_SKILLS`.
  - `steps.mjs:263` and `:336`: drop the win32 skip, so the retired-copy handling also applies on win32.
  - `doctor.mjs:110` is reused as is.
  - Requirement diff: R-665 and R-666 drop "skip those names on win32".
  - Tests:
    - `install.test.mjs:99-121,:143,:169,:173-194`: win32 shape, separator normalisation, `\r` strip at `:32-34`, and a guard at `:194-240`.
    - `skills-and-standards.test.mjs` sections 1–3: branch like section 7, with `rmSync` at `:99`.
    - `retired-artifacts.test.mjs` `:172`: exec-form expectation.
    - `state-manifest.test.mjs:52-59`: platform-aware targets; skip the `:133` control-character fixture.
- **Size:** M. Expect 3 rounds, because 49 hidden skills-and-standards checks are unmeasured.

### L5 land-win32 — product, both seats, low impact (land class: 2 reviewers plus wrong-code pairs)
- **Feature:** a Windows seat runs `node packages/nana-pack/bin/nana-land.mjs` from an 8.3 or differently-cased path without a false "must share one git repository" refusal.
- **Class:** 8.3-short-path (the product part).
- **Must-meet:**
  - `packages/nana-pack/tests/land.test.mjs` passes on the Windows leg.
  - New test 1: an injected 8.3-form `--main` against a long-form `--tree` is accepted (win32 only).
- **Wrong-code pairs:**
  - Applying `.native` to the repo key at `:78` too breaks ledger-key parity with `review-round.mjs:163`.
  - Dropping the comparison at `:71`.
- **Files:**
  - `nana-land.mjs:71,:148`: `process.platform === "win32" ? realpathSync.native : realpathSync`, the same pattern as `pi-worker.mjs:154`. `:78` stays unchanged.
  - `land.test.mjs:499` uses `fileURLToPath`.
  - Suite strings at `:59-:563` switch to cmd-safe double quotes.
- **Size:** M (42 checks; the cmd quoting is fiddly). Expect 2 rounds.

### L6 knowledge-suite — test-only, measures the Claude Code seat's knowledge hook (ordinary)
- **Feature:** the nana-knowledge suite runs to the end on Windows, so the 32 hidden hook checks are measured.
- **Classes:** pathname-import, posix-separator, ntfs-illegal-name.
- **Must-meet:** `packages/nana-knowledge/tests/hook.test.mjs`, `discovery.test.mjs` and `render.test.mjs`.
- **Files:**
  - `hook.test.mjs:286,:288,:293`.
  - `discovery.test.mjs:201,:224`, plus separator normalisation at `:228,:231,:262`.
  - `render.test.mjs:59-77`: SKIP when `nameOk` or `tickOk` is false; add one NTFS-legal hostile name.
- **Size:** S on paper.
- **Escape hatch:** if the 16-process build-lock race reds on Windows, stop. Open a hook-class product lane.

### L7 setup-tests — test-only (ordinary)
- **Feature:** the remaining nana-setup tests assert the win32 hook wiring and skip what cannot exist there.
- **Classes:** posix-stub-or-mode, the install-shape tail (verifier-pipe), live-cwd, pathname, posix-separator.
- **Must-meet:** settings-merge, verifier-pipe, shared-memory-hook, doctor-detail, restore, trust and install-check, all under `packages/nana-setup/tests/`.
- **Files:**
  - `settings-merge.test.mjs:481,:600,:753` (mode gates) and `:773-800` (exec-form assertions on win32).
  - `verifier-pipe.test.mjs:32-37`: take `args[0]` of the installed entry; pass the win32 `desiredHooks` at `:59,:103`.
  - `shared-memory-hook.test.mjs:138-147`: SKIP.
  - `doctor-detail.test.mjs:78`: SKIP.
  - `restore.test.mjs:36,:38`, then the tar layer at `:111-112,:146` (`--force-local`, or SKIP).
  - `trust.test.mjs:25,:82`.
  - `install-check.test.mjs:77-78`.
- **Out of scope:** `doctor.mjs:650` `getuid?.()` is a known bug. It is unreachable on real win32 and would make this an install-class lane.
- **Size:** M. Expect 2–3 rounds (restore's tar layer is unknown).

### L8a gate-and-agent-dir-tests — test-only (ordinary)
- **Feature:** the gate and agent-dir tests run on Windows.
- **Classes:** home-without-userprofile, pathname, posix stub, live-cwd timeout, cmd-shim.
- **Must-meet:** gate-corpus, gate-policy-paths, agent-dir-hostile, agent-dir-parity and lane-write-guard, all under `packages/nana-pack/tests/`.
- **Files:**
  - `gate-corpus.test.mjs:248,:260`.
  - `gate-policy-paths.test.mjs:195,:202`. The latent `/tmp/relocated` at `:188,:203` may need win32 paths.
  - `agent-dir-hostile.test.mjs:120`: SKIP.
  - `agent-dir-parity.test.mjs:37`: lazy `PI_ROOT`; `:131` desk leg gets a win32 SKIP.
  - `lane-write-guard.test.mjs:17`.
- **Known bug, not this lane:** the `/tmp` root at `nana-gate.ts:197`, which is gate class.
- **Size:** S–M.

### L8b objective-and-adoption-tests — test-only (ordinary)
- **Feature:** the objective and adoption producer tests run to the end on Windows, about 150 checks now hidden.
- **Classes:** home-without-userprofile, ntfs-illegal-name, cross-drive.
- **Must-meet:** objective-golden, adoption-producer, adoption-reader and config-display-text.
- **Files:**
  - `objective-golden.test.mjs:39-40,:106,:976` (USERPROFILE).
  - `objective-golden.test.mjs:215-233` and `:368-385`: SKIPs.
  - `objective-golden.test.mjs:906-923`: a likely next layer (inferred).
  - `adoption-producer.test.mjs:305` and `:318-324`.
  - `adoption-reader.test.mjs:169` and `:220-261`.
  - `config-display-text.test.mjs:22-34,:50`.
- **Size:** M. Expect 3 rounds.

### L9 handoff-and-display-tests — test-only (ordinary)
- **Feature:** the handoff, display and post-edit tests pass on Windows.
- **Classes:** posix-separator, 8.3 (test side), ntfs-illegal-name.
- **Must-meet:** handoff-artifact, handoff-staleness, handoff-store, handoff-trust, display-surfaces, post-edit-file-queue and frontier.
- **Files:**
  - `handoff-artifact.test.mjs:60`: `realpathSync.native` on td2.
  - `handoff-staleness.test.mjs:87,:111,:139,:159`: `~${path.sep}`. The long-HOME crash at `:140-153` is unknown until L3's readout.
  - `handoff-store.test.mjs:193` and `handoff-trust.test.mjs:108,:115`: parse the JSON lines.
  - `display-surfaces.test.mjs:161,:219,:273,:291`.
  - `post-edit-file-queue.test.mjs:67`.
  - `frontier.test.mjs:44`.
- **Size:** M.

### L10 launcher-tests — test-only; the product is already R-1125 (ordinary)
- **Feature:** the pi-review and pi-worker tests run on Windows against an npm-layout fake pi, never a real one.
- **Classes:** pathname, posix-stub.
- **Must-meet:** immutable-review, review-ledger and worker-lane.
- **Files:**
  - `immutable-review.test.mjs:18,:26,:35,:51`.
  - `review-ledger.test.mjs:25,:886,:32-45`: SKIP the POSIX-signal cases at `:499,:514` and the `run -- pi` cases, which the README marks uncovered on Windows.
  - `worker-lane.test.mjs:29-31`: use the npm stub layout that `win32-launch.test.mjs` already builds.
  - Share one stub helper across the three files.
- **Size:** M–L. review-ledger's 146 checks are unmeasured. Split review-ledger out if round 2 shows more than 10 reds.

### L11 template-maintainer-tests — test-only (ordinary)
- **Feature:** the template update, acceptance and release tests run on Windows.
- **Classes:** pathname, posix-stub.
- **Must-meet:** templates-update, template-acceptance and template-release.
- **Files:**
  - `templates-update.test.mjs:128,:195,:209,:215,:229`.
  - `template-acceptance.test.mjs:109,:121,:51-57`, plus a shared `where git` helper.
  - `template-release.test.mjs:35-47`, which uses that helper or SKIPs. Release runs only on ubuntu, per `ci.yml:80`.
- **Size:** S–M.

### L12 win32-uninstall — product, both seats (install class). This is your call.
- **Option A (port):**
  - Feature: on Windows, `nana-setup uninstall` removes byte-identical copies and exec-form settings entries, and keeps modified copies.
  - Must-meet: `uninstall.test.mjs` on the Windows leg, plus new test 1, a forced-win32 install → uninstall round trip.
  - Wrong-code pairs: removing a modified copy; leaving exec-form entries behind (see HANDOFF line 63).
  - Files: `uninstall.mjs:41` onward, using `doctor.mjs:77` identity; requirement diff on the uninstall row.
  - Size: M–L.
- **Option B (declare):** add a win32 SKIP in `uninstall.test.mjs` from `:40`, keeping `:400-410`. Size S.
- **Recommendation:** B now, A later. The priority names install and hooks, not uninstall.

### L13 windows-leg-blocking — gate change (2 reviewers). This is your call; see section 3.
- **Files:**
  - `scripts/test.mjs` SKIPS: `apps/desk/**` (frozen) and `apps/bench/**` (maintainer-only) on win32.
  - `ci.yml:51`: `continue-on-error: ${{ matrix.os == 'ubuntu-latest' }}`.
  - `ci-workflow.test.mjs`.
  - R-684, the Support line in three front doors plus CLAUDE.md ("non-blocking suite legs").
  - Land checklist: a lane touching `packages/` or `scripts/` needs a green Windows leg on the reviewed tip.

### What stays failing after all lanes
- None of the 48 in-scope files fail if all lanes land, but these files carry declared in-file win32 SKIPs:
  - shared-memory-hook: deleted cwd.
  - agent-dir-hostile: section C.
  - config-display-text, display-surfaces, render, adoption-* and objective-golden 13d: LF, ESC and colon names.
  - objective-golden and settings-merge: chmod and mode bits.
  - doctor-detail: the launchd desk block.
  - review-ledger: POSIX signals and `run -- pi`.
  - mutation-runner: fake npm (README limit).
  - agent-dir-parity: the desk leg.
  - uninstall: if Option B is taken.
- Desk (16 files) and bench (5 files) stay red until L13 declares them as win32 SKIPs.
- **Known bugs that get no lane:**
  - `nana-gate.ts:197`: the `/tmp` extra lane root on win32.
  - `doctor.mjs:650`: unguarded `getuid`.
  - The desk resolver (frozen).
  - Copied rules drift until reinstall. Doctor flags it.

## 3. Verification loop (Mac seat, Windows proof)

**Mac rehearsal before any push.** These are deterministic and free:
1. The full suite with `npm run test:locked`. Per-file macOS pass counts must not drop, compared against a baseline captured before the build.
2. CRLF reproduces on a Mac. `git clone -c core.autocrlf=true <worktree> <scratch>/crlf && cd <scratch>/crlf && npm test -- <files>` reproduces the whole crlf-eol class (L2), because autocrlf converts on checkout on any OS.
3. The install shape is partly reproducible. `NANA_SETUP_PLATFORM=win32` drives the copy and mirror paths in `steps.mjs` and `doctor.mjs` (L1, L4, L12).
4. A pattern grep over the touched test files should find nothing: `grep -nE '\.pathname|import\(path\.|"/tmp"|process\.env\.HOME = ' <files>`.

What a Mac cannot show: USERPROFILE, NTFS names, open-file renames, 8.3 forms and cmd.exe quoting. Those are proven only on CI.

**CI round:**
1. The seat opens a draft PR once: `gh pr create --draft --base main --head feat/<lane>`. Each push re-runs `ci` on `pull_request`, about 11 minutes. Push once per round, not once per commit.
2. Get the run id: `gh run list --branch feat/<lane> --workflow ci -L 1 --json databaseId,status,headSha`. Check that `headSha` is the tip under test.
3. Get the job id: `gh run view <id> --json jobs --jq '.jobs[]|select(.name|test("suite.*windows"))|.databaseId'`.
4. Read the log: `gh run view --job <jobId> --log | grep -E '(PASS|FAIL|SKIP)  (packages|scripts)/|^\S*\s+\| '`. That gives each file line, its detail lines and the totals line.
5. Diff per-file pass and fail counts against the classification JSON.
6. Read install-check from the same run. It must stay green, because it is blocking already.

**Who runs it (inferred):** a pi-worker builder probably cannot push or reach `gh`; I did not check the gate's push rules. So the seat pushes and reads CI at the end of each build, then sends the Windows log excerpt in the next brief. That matches the seat guide's rule to verify once when the build ends.

**Rounds:**
- 1–2 for mechanical lanes: L2, L3, L6, L9, L11.
- 3 for crash-heavy lanes, because each crash hides a layer: L4, L7, L8b, L10.
- Total CI wall time is about 30 rounds × 11 minutes, roughly 5.5 hours, halved by running two lanes at once.
- Record each lane's final green Windows run id in its review corpus. The final review covers that exact tip.

**Blocking the leg (L13).** Recommendation: yes, after two consecutive green Windows runs on main.
- **For:**
  - With the leg non-blocking, Windows reds piled up unseen from 10-11 to today (68 files).
  - `nana-land` reads no CI result, so a red Windows leg today changes nothing.
  - Blocking plus the checklist line is the only thing that stops regression of the class.
- **Against:**
  - A Windows flake or a runner-image change blocks the template release job (`needs: [suite, install-check]`).
  - Every land waits about 11 more minutes for the draft-PR run.
  - The timing-sensitive files are the flake risk: hook.test's 16-process lock race, mutation-runner (65 s), land (43 s) and agent-dir-hostile.
- **Why it is your call:** it changes the gate and adds a CI dependency to every land.
- Ubuntu stays non-blocking, since Linux is outside the priority.

## 4. Parallel order (at most two building)

| Pair | Lanes | Why together |
|---|---|---|
| 1 | L1 project-refresh ∥ L2 crlf-eol | Both are user-facing and touch disjoint files. L2 first helps L1's CRLF latent layer, but L1 normalises at `:16` anyway. |
| 2 | L3 runner-readout ∥ L4 install-skills | L4 rebases on L3 once it lands, to read the crash stacks. L4 closes only after L2 has landed. |
| 3 | L5 land ∥ L6 knowledge-suite | L6 measures the Claude Code seat's hook early. |
| 4 | L7 setup-tests ∥ L8a gate/agent-dir tests | Disjoint packages. |
| 5 | L8b objective/adoption ∥ L9 handoff/display | Disjoint files in the pack. |
| 6 | L10 launcher-tests ∥ L11 template tests | Then L12 (your call), then L13 (your call). |

**Claim I most expect to be wrong:** that what the 25 crashing files hide is only test-portability work. The likeliest exception is the 32 unmeasured checks in `packages/nana-knowledge/tests/hook.test.mjs`, which include the 16-process build-lock race. NTFS lock and rename rules (the same family as `project.mjs:227`) could make the Claude Code seat's one shared hook fail or time out on Windows. If so, L6 becomes a hook-class product lane with two reviewers. The next most likely surprises are objective-golden's 110 hidden checks (L8b) and review-ledger's 146 (L10).

**HANDOFF lines:**
- Open for the owner: uninstall on Windows. Port it (L12 Option A), or declare it POSIX-only with a win32 SKIP (Option B, recommended now).
- Open for the owner: make the suite's Windows leg blocking after two green runs on main, with desk and bench skipped (L13, recommended).