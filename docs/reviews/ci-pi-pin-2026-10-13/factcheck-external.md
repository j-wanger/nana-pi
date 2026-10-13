# Fact-check: external claims in ci-pin/CHANGE.md

Checked 2026-10-13 on this Mac (node 22.22.2, npm 10.9.7). Primary sources were `npm view` (registry
times and manifests), npm 10.9.7's own `docs/content/using-npm/config.md` and source (`@npmcli/arborist`,
`@npmcli/config`, `npm-pick-manifest`, `pacote`, `nopt`), npm 11.21.0 and 12.2.0 tarballs, the pi 1.2.0
tarball CHANGELOG, codemode tarballs 1.0.2 to 1.2.0, and all 16 job logs of the five runs, fetched with
`gh api .../jobs/<id>/logs`. Every install was run in a scratch prefix under `ci-pin/fc/`. Nothing was
installed globally, and the repo was not touched.

Evidence lives in `ci-pin/fc/`:
- `job-<id>.log`: the CI logs.
- `dry1.out` and `dry2.out`: dry runs with and without the cutoff.
- `real.out` and `real-tree.txt`: a real install with the cutoff.
- `mac-full.txt`: the seat's `npm ls -g --all`.
- `w-*.set`: the resolved sets at the window bounds.
- `tb/`: the tarballs.

## WRONG

| # | CHANGE claim | Evidence |
|---|---|---|
| W1 | §5 Push 2: the install log will say "added 146 packages". §5 post-land release: the same. | A real scratch install of the exact line (`--before="2026-10-04T06:57:57Z"`) prints **"added 121 packages"** (`fc/real.out`). The dry run says 146 because it lists 26 `@esbuild/*` optional platform packages (27 esbuild entries in total). A real install skips 25 of them on darwin-arm64. 121 is also the exact pre-drift count printed on all three OSes by the 1.1.0-sibling tree (chord 1.0.2–1.1.0 depend on `esbuild`). So the install-log count cannot show that the cutoff took effect. Use the version of `pi-codemode` (for example `npm ls -g @earendil-works/pi-codemode`) as the signal instead. |
| W2 | §3 "any cutoff before 2026-10-12T23:00:01.855Z avoids the crash but gives another tree" | `pi-agent-core` 1.2.0 was published at 22:59:50.884Z, before codemode. It requires `pi-ai ^1.2.0`, which was published at 23:01:40.259Z. A dry run with `--before=2026-10-12T22:59:55Z` fails: `ETARGET No matching version found for @earendil-works/pi-ai@^1.2.0`. So every cutoff in [22:59:50.884Z, 23:00:01.855Z) fails the install instead of giving a tree. |
| W3 | §1 "the other 5 print only 'nana code: cannot start'" | Four of the five do: buffer-caps, changes-endpoint, prompt-detach and usage-line. `apps/desk/test/origin-rule.test.mjs` prints only `HARNESS ERROR Error: desk server never came up`. This holds in all three post-drift macOS logs. (The part saying "`server.mjs` emits it only when `loadPiSession` fails" is VERIFIED: `server.mjs:129` is the only place that emits it.) |

## Misleading or incomplete (true as stated, but the inference drawn from it does not hold)

| # | CHANGE claim | Problem |
|---|---|---|
| M1 | §3 "codemode 1.0.2, 'added 146 packages'; without the flag, codemode 1.2.0, 'added 119 packages' (VERIFIED)" | The dry-run output is reproduced exactly (cold cache, 3.19 s against 3.09 s). But 146 against 119 is not a like-for-like tree size. chord 1.2.0 dropped `esbuild`, and a dry run counts platform packages that a real install skips. The real counts are 121 against 119. The same is true of §3 "Any cutoff inside the window gives the same 146 packages": the add-sets are identical (same md5 at 00:56:19.486Z, 06:57:57Z and 08:30:34Z), but the 1.0.3, 1.0.4 and 1.1.0 trees also give 146. |
| M2 | §6.5 "`--before` does not freeze `deprecated` flags or engines" | The deprecation part is VERIFIED: `npm-pick-manifest` sorts non-deprecated versions first, and deprecation can change after publish. "Engines" is imprecise. A manifest's `engines` cannot change; what changes is the runner's Node version (`engineOk` compares against `process.version`, and `node-version: 22` floats). The list also misses two limits. (a) The `latest` dist-tag is preferred whenever it is on or before the cutoff (`npm-pick-manifest` lines 120–135). Otherwise the highest version on or before the cutoff wins. So a dependency whose `latest` tag moves can resolve to a different pre-cutoff version than the seat has. (b) A version with no publish time passes the filter (`isBefore`: `!verTimes[ver]`). |
| M3 | §1 "removed the export `MCP_TYPESCRIPT_PREAMBLE`" | VERIFIED, but codemode 1.2.0 also removed `mcpStructuredContentSchema`, which `tool.js:24` also imports. An upstream fix (§6.4) needs both exports. |
| M4 | §1 "pi-ai, pi-agent-core, pi-tui, pi-mcp and chord also published 1.2.0 at that moment" | `pi-telemetry` 1.2.0 (23:00:34.367Z) is missing from the list. The full burst ran from 22:59:50.884Z (pi-agent-core) to 23:03:25.459Z (pi-coding-agent). |
| M5 | §1 "13 print the `MCP_TYPESCRIPT_PREAMBLE` SyntaxError" | 13 files print the missing-export message, but only 4 pack files print the word `SyntaxError`. The desk files print "entry point … would not import: …". |
| M6 | §5 the Windows desk files and agent-dir-parity stay red because of "cannot tie" and a doubled drive path | That they fail before the drift is VERIFIED from the 5143063 Windows log. The list of reasons is incomplete: 11 files (agent-dir-parity among them) print "cannot tie"; host-rule shows the doubled `D:\D:\` path; changes-endpoint fails on a `RUNNER~1` against `runneradmin` temp-path mismatch; origin-rule prints "never came up". |
| M7 | §6.2 "`sendUserMessage` needs `deliverAs`" | Per the 1.2.0 CHANGELOG, this is required only while the session is busy, which now includes the run start. pi 1.2.0 declares `^1.2.0` on five siblings, not six: chord is no longer a direct dependency. |

## UNVERIFIED

| # | CHANGE claim | Why |
|---|---|---|
| U1 | §3 "It is the only resolution control `npm i -g` has" | This is too broad. `overrides` do not apply to a global install and no lockfile is used (both VERIFIED below). But the registry and `--tag` are also resolution inputs, and npm ≥ 11 has `min-release-age`. It is plausible only in the narrower form "the only time or version-pinning control for transitive picks on npm 10.9". |
| U2 | §3 GitHub Actions keeps an unquoted date-time as a string | The CHANGE already flags this as INFERRED. Only the YAML 1.1 half could be checked here. |
| U3 | §1 "CI never tested the seat's tree after 2026-10-05; from 10-07 likely 1.1.0" | The CHANGE marks this INFERRED. It is consistent with publish times: the 1.0.3 siblings appeared from 10-05T08:30:34Z and 1.1.0 from 10-07T22:09:51Z. The logs print no versions, and the install count cannot tell the trees apart (W1). |
| U4 | §1 suite-level local A/B: "18/18 FAIL … 18/18 PASS, 1932 checks" | Not re-run. The import-level A/B was reproduced: in a scratch prefix, `dist/index.js` fails to import with codemode 1.2.0 and imports cleanly after swapping only codemode to 1.1.0, while `pi --version` prints 1.0.2 on the broken tree. |
| U5 | Premise: an RPC `get_commands` session works on the 1.2.0 tree | Not re-run here; it was seat-verified earlier. The inlining it relies on is VERIFIED (V12). |
| U6 | §3 a job-wide `npm_config_before` would freeze `pi install npm:` calls and the pnpm setup | Not run. The pnpm part is self-declared as not checked. That the variable reaches every process is VERIFIED (V20). |
| U7 | §5 every Push 1, Push 2 and post-land outcome | These are predictions, marked INFERRED by design. The baselines are VERIFIED (V6–V9), except for the 146 count (W1). |

## VERIFIED

| # | Claim | Evidence |
|---|---|---|
| V1 | pi 1.0.2 declares `^1.0.2` on six siblings; there are eight `@earendil-works` packages | `npm view …@1.0.2 dependencies`: chord, pi-ai, pi-mcp, pi-tui, pi-codemode and pi-agent-core. `pi-telemetry` arrives through pi-ai `^1.0.2`. The seat has all eight at 1.0.2. |
| V2 | codemode 1.2.0 was published at 2026-10-12T23:00:01.855Z | `npm view @earendil-works/pi-codemode time` |
| V3 | pi 1.0.2 was published at 2026-10-04T00:56:19.486Z; the first 1.0.3 sibling was codemode at 2026-10-05T08:30:34.061Z | `npm view time`. The next one was pi-ai at 08:30:59.376Z. |
| V4 | `tool.js:24` imports `MCP_TYPESCRIPT_PREAMBLE`; 1.2.0 lacks it while 1.0.2 and 1.1.0 have it | Seat file line 24 and the CI stack trace. A direct `import()` of each tarball's `dist/declarations.js` confirms it. |
| V5 | `npm i -g` never reads or writes a lockfile, and `overrides` cannot apply | Arborist `#globalRootNode()` builds the root from `{dependencies:{}}` and calls `meta.reset()`. Reify sets `saveIdealTree=false` when `options.global` is set. |
| V6 | Run 38313718241 (5143063) was created at 21:56:23Z, installed at 21:56:42Z, and macOS printed `137 files: 135 PASS, 0 FAIL … 6955 pass, 0 fail, 8 skip` | Job 115025254377 |
| V7 | The three post-drift macOS legs printed `18 FAIL … 6 fail`; the 18 are 13 desk files and 5 pack files | Jobs 115088052180, 115108489809 and 115133128976 |
| V8 | Ubuntu went from 1 to 19 failing files (the 1 is lane-write-guard "symlink escape outside lane is blocked"). Windows went from 67 to 69: config-trust and config-project-gate-fallback, both printing the missing-export message. | The post-drift minus pre-drift diffs of the failed lists |
| V9 | Windows before the drift: objective-golden 94 pass / 17 fail, post-edit-file-queue 2 pass / 1 fail, and ci-workflow 0 pass / 5 fail on every Windows run | Jobs 115025254912 and 114857675317 |
| V10 | The install log said "added 121 packages" before the drift and 119 after; a resolution today without the cutoff gives 119 | All 16 logs, plus a real scratch install today |
| V11 | Git: 5143063..79888d5 touches none of the 18 files, `apps/`, `scripts/`, `package.json` or `.github/`; 79888d5..3f5151f touches only `HANDOFF.md`, `REQUIREMENTS.md`, the session notes and the review corpus | `git diff --stat` |
| V12 | The `pi` bin is `dist/bundle/cli.js` and inlines codemode; `dist/index.js` imports the external package; `pi --version` works on the broken tree | The bin field. A bundle chunk contains `MCP_TYPESCRIPT_PREAMBLE`, and the bundle has zero bare `@earendil-works` imports. The scratch pi printed `1.0.2`. |
| V13 | The cutoff's provenance: `package.json` mtime 2026-10-04T02:57:57-0400 = 06:57:57Z | `stat` on the seat file. pacote extracts with `noMtime: true` (`fetcher.js:426`), so the mtime is the extraction moment. The siblings show 02:57:56. |
| V14 | A scratch install with the cutoff reproduces the seat's 287-line `npm ls -g --all` exactly | `diff` gives identical output (`fc/real-tree.txt` against `fc/mac-full.txt`) |
| V15 | The npm docs quote "only versions that were available **on or before** the `--before` time get installed" | npm 10.9.7 `config.md`, verbatim. The npm 11 wording differs slightly. |
| V16 | The filter is inclusive and covers transitive picks | `isBefore`: `Date.parse(t) <= time`. pacote sets `fullMetadata` when `before` is set. At exactly .486Z pi 1.0.2 resolves; at :19Z it fails with ETARGET. At 08:30:34.061Z codemode 1.0.3 enters. The transitive pi-telemetry is filtered. |
| V17 | A cutoff with no `Z` is read as local time; a malformed value only warns and fails open; a rollover date is accepted; raising `PI_VERSION` alone gives ETARGET; moving the cutoff past 08:30:34.061Z quietly moves the siblings | nopt calls `new Date(val)`, and under TZ=America/New_York the value becomes 10:57:57Z. `not-a-date` gives a warning and codemode 1.2.0. **An empty value (`PI_BEFORE` unset) fails open the same way.** 02-30 becomes 03-02 and fails with ETARGET. pi 1.0.3 with the cutoff fails with ETARGET. |
| V18 | YAML 1.1 reads an unquoted date-time as a timestamp; quoting keeps it a string | yaml 2.9.0: `version:'1.1'` gives a Date, `'1.2'` gives a string, and the quoted value gives a string |
| V19 | Metadata cost: a cold dry run takes about 3 s either way | 3.19 s against 3.09 s on this Mac |
| V20 | A CLI `--before` is not exported to child processes; an environment variable is, in any letter case | `set-envs` `envVal()` returns null for a Date. A probe printed `undefined` against the value. `@npmcli/config` matches `/^npm_config_/i`. |
| V21 | Node 22 ships npm 10.9.x; npm 11 has `min-release-age` | CI used node 22.23.2 with npm 10.9.8 on macOS, and 22.23.3 with 10.9.9 elsewhere. npm 11.21.0 `config.md` documents `min-release-age`. npm `latest` is now 12.2.0. |
| V22 | `npm ci` with a lockfile ignores `--before` | A probe project locked `ms` 2.1.3 (2020-12-08). `npm ci --before=2019-01-01` still installed 2.1.3. |
| V23 | pi 1.2.0 declares `^1.2.0` on its siblings; the CHANGELOG items in §6.2 are real | `npm view`. The 1.2.0 CHANGELOG covers `before_agent_start` messageType "custom" with no prompt, busy-while-starting, `deliverAs` and the `pi mcp list --json` change. The 1.0.3 entry covers Azure becoming `azure`. |
| V24 | ID space: main tops out at R-1064 and feat/install-check at R-1084; no branch uses R-1090 or above | A grep of `REQUIREMENTS.md` on every local and remote branch |
| V25 | Only the macOS leg blocks, and release needs the suite; `env` is at lines 10–12 and the install lines are at :38 and :63 | `ci.yml:21` `continue-on-error: ${{ matrix.os != 'macos-latest' }}`, and `:44` `needs: suite` |
