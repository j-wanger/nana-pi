# fresh-install lane — research: every pi install command and hint (2026-10-13)

Repo: `/Users/example/nana-pi` main `9974218` (read only). Local npm 10.9.7, node v22.22.2.
Status legend: VERIFIED = run here today; DOC = quoted from docs or source; INFERRED = reasoning, not run.
Probes went to scratch prefixes under `plan-fresh-install/probe/` with an isolated cache (`probe/cache`); nothing global was touched.

---

## 0. Headline facts (VERIFIED today, 2026-10-13 ~14:40Z)

Dry-run resolutions (`npm i -g --ignore-scripts … --dry-run --prefix probe/…`):

| Command form | pi | pi-codemode | pi-ai | packages |
|---|---|---|---|---|
| `…pi-coding-agent@1.0.2 --before=2026-10-04T06:57:57Z` | 1.0.2 | 1.0.2 | 1.0.2 | 146 |
| `…pi-coding-agent@1.0.2` (README step 2, desk/bench READMEs today) | 1.0.2 | **1.2.0** | 1.2.0 | 119 |
| `…pi-coding-agent` (unversioned: bench README:26, every code hint) | **1.2.0** | 1.2.0 | 1.2.0 | 118 |
| `…pi-coding-agent --before=2026-10-04T06:57:57Z` (unversioned + cutoff) | 1.0.2 | 1.0.2 | 1.0.2 | 146 |

Real scratch installs:
- Unpinned 1.0.2 → `import(dist/index.js)` FAILS: `'@earendil-works/pi-codemode/declarations' does not provide an export named 'MCP_TYPESCRIPT_PREAMBLE'`.
- Re-running the pinned command over that broken prefix: `added 2, changed 119`; codemode → 1.0.2; import OK. **The fixed README command repairs an already-broken machine.**
- Unversioned → pi 1.2.0 (siblings `^1.2.0`); import OK; the desk's and bench's root exports (`parseSessionEntries`, `migrateSessionEntries`, `CURRENT_SESSION_VERSION`, `ModelRuntime`) are present. **Unversioned hints are not broken today; they install an untested pi** (CHANGE ci-pi-pin §6.2 lists 1.2.0's extension-API changes) and stay exposed to the same caret drift.
- `--ignore-scripts` + cutoff: the import is clean (the repair prefix used both).
- Registry: `latest` = 1.2.0 (published 2026-10-12T23:03:25Z); pi-codemode 1.2.0 published 2026-10-12T23:00:01.855Z.

npm's handling of a bad cutoff (VERIFIED, `npm config get before …`):
- `--before=2026-10-04T06:57:57Z`, `--before="…"` and `--before 2026-…` all parse to the same Date.
- `--before=notadate`, `--before=` and `--before=""` print `npm warn invalid config …` and fall back to **null with exit 0**. A mangled or empty cutoff therefore installs the unpinned tree silently, apart from a warning. Source: nopt `type-defs.js:41-48` (`Date.parse` NaN → invalid) and `@npmcli/config/lib/index.js:487-494` (`invalidHandler` only warns).

---

## 1. Inventory — every place that tells a user to install pi or prints a hint to do so

Grep: `git grep -n -I -E "pi-coding-agent|npm i -g|npm install -g|PI_INSTALL_HINT|pi install"` over the repo, minus `research/`, `docs/reviews/`, `docs/sessions/` (history) and `import … from` lines.

| # | file:line | exact install text | version | cutoff | `--ignore-scripts` | pinned by test | desk freeze |
|---|---|---|---|---|---|---|---|
| 1 | `README.md:121` (Fresh machine step 2) | `npm i -g --ignore-scripts @earendil-works/pi-coding-agent@1.0.2` | 1.0.2 | no | yes | `packages/nana-setup/tests/fresh-machine.test.mjs:27` (R-950, anchor `@earendil-works/pi-coding-agent@`) and `:31` (R-951, `entries[1].includes(\`${PI_INSTALL_HINT}@${ciVersion}\`)`, ciVersion read from ci.yml `:28`) | no |
| 2 | `apps/desk/README.md:25` (Dependencies table) | `npm i -g @earendil-works/pi-coding-agent@1.0.2` | 1.0.2 | no | **no** | none | **yes** (desk folder) |
| 3 | `apps/bench/README.md:11` (Dependencies table) | `npm i -g @earendil-works/pi-coding-agent@1.0.2` | 1.0.2 | no | **no** | none | no |
| 4 | `apps/bench/README.md:26` (Install, run and test) | `npm i -g @earendil-works/pi-coding-agent` | **none** (contradicts :11) | no | no | none | no |
| 5 | `packages/nana-setup/README.md:70` (Update nana-pi) | `npm i -g --ignore-scripts @earendil-works/pi-coding-agent@<version>` (upgrade template) | placeholder | no | yes | none | no |
| 6 | `packages/nana-setup/lib/steps.mjs:810` `PI_INSTALL_HINT` | `"npm i -g --ignore-scripts @earendil-works/pi-coding-agent"`; provenance `:809` "chosen: use the setup README's global pi installation command; its tested version lives in CI." | **none** | no | yes | `doctor-runtime.test.mjs:54,56` (R-1037: doctor and install share the hint), `pi-registration.test.mjs:271,294` (`.includes(PI_INSTALL_HINT)`), `fresh-machine.test.mjs:31` (R-951 composes `${PI_INSTALL_HINT}@${ciVersion}`) | no |
| 6a | ↳ printed by `steps.mjs:982` and `:991` (install: "pi is not on PATH — \`<hint>\`, then re-run") and `doctor.mjs:330` (four "install: <hint>" branches of the `pi executable` row) | — | — | — | — | as 6 | no |
| 7 | `apps/desk/pi-session.mjs:347` | `` `Fix: install a released ${PI_PACKAGE} (npm i -g ${PI_PACKAGE}), or set DESK_PI_ROOT to one.` `` — fires only when pi's version is not semver | none | no | no | none (no desk test matches `Fix:`/`npm i`) | **yes** (desk code) |
| 8 | `apps/desk/pi-session.mjs:353` | `` `Fix: npm i -g ${PI_PACKAGE}` `` — fires only below the 0.84.4 floor (`:68`) | none | no | no | none | **yes** (desk code) |
| 9 | `apps/bench/lib/pi-exports.mjs:148` | `` `Fix: npm i -g ${PI_PACKAGE}   (or set BENCH_PI_ROOT …)` `` — fires when no pi package dir is found | none | no | no | `apps/bench/test/usage.test.mjs:300` regex `/npm i -g @earendil-works\/pi-coding-agent/` ("…and tells the maintainer how to fix it"); **no `// req:` marker directly above it** (the R-508 marker at :298 sits above :299 only) | no |
| 10 | `.github/workflows/ci.yml:35,67,92` | `npm i -g [--ignore-scripts] @earendil-works/pi-coding-agent@${PI_VERSION} --before="${PI_BEFORE}"` | `${PI_VERSION}` | **yes** | install-check only | `ci-workflow.test.mjs` R-597, R-1031, R-1078, R-1090, R-1091, R-1092 | no |

Where the codemode break actually lands, no install hint is printed at all:
- `apps/desk/pi-session.mjs:358-360` — "… was found at <root> but its entry point … would not import: <SyntaxError>". No fix line. Frozen.
- `apps/bench/lib/pi-exports.mjs:162` — same shape, no fix line.

### Checked and out of scope (no change needed)
- `templates/**`, `copier.yml`: no pi install text (only `pnpm install` for generated projects). VERIFIED by grep.
- `packages/nana-pack/skills/**`, `packages/nana-setup/claude/**`, `bin/install-check.mjs`, `lib/install-check*.mjs`: no pi install text. `install-check` relies on CI's install line.
- `README.md:77`, `:83` (component table) and `packages/nana-setup/README.md:19`, `packages/nana-pack/README.md:6`: name the package and the tested version, but give no command. Optional: none needed.
- `README.md:14,89,125,168,190`: `pi install …` installs pi *packages* (nana-pack, pi-subagents), not pi. pi suppresses automatic peer installation for managed npm packages (DOC, pi `docs/packages.md:88`), so `pi install npm:pi-subagents@0.75.0`, whose peers are `"*"` on pi and its siblings (VERIFIED `npm view`), does not pull a 1.2.x pi.
- `apps/bench/studies/tool-profiles-2026-09-08/fixture/README.md:29`: unversioned `npm i -g @earendil-works/pi-coding-agent`. A recorded study's task fixture (an old copy of the root README). It is not in `readme-check.config.json`, and the test runner skips `studies/**`. Leave it: it is evidence, not instructions.
- `AGENTS.md:58` / `CLAUDE.md`: a docs path, not an install.
- `packages/nana-setup/bin/nana-setup.mjs:428` (`nana-setup trust`) imports pi's deep `dist/core/trust-manager.js`. Its static import graph is 5 modules with no codemode import (VERIFIED by trace over the seat's 1.0.2 dist), so `trust` survives the break.
- `packages/nana-pack/lib/config.ts:369` (`import("@earendil-works/pi-coding-agent")`, used by the Claude Code objective hook) catches failure and fails closed. Outside pi, ESM never resolves a global package anyway, so the cutoff does not change it (INFERRED).

---

## 2. Single source of truth — where should PI_VERSION and PI_BEFORE live?

Facts that constrain the choice:
- ci.yml env already declares both values once. Each carries a provenance comment (`ci.yml:11-17`). R-1091 seals PI_BEFORE and R-597 checks PI_VERSION. Both rows landed today.
- Precedent: `fresh-machine.test.mjs:28` already reads PI_VERSION from ci.yml (R-951: "equal its declared source floor or CI version"). The other precedent, `PI_SUBAGENTS_FLOOR` (`doctor.mjs:164`), has code as the source and the README as a checked mirror.
- YAML `env:` cannot import a JS module or JSON.
- Code may read repo-root files: `steps.mjs` already reads the root `package.json` manifest (`manifestRoot = repoRoot`). nana-setup always runs from a clone (root README: "Anyone using nana-setup or the desk installs from a local clone").
- Code map: apps may import packages, but packages may not import apps (`code-map.config.json`). The desk already imports `packages/nana-pack/lib/agent-dir.mjs`.
- House rule: a tuning value is defined once in a declared configuration surface and read by name. Retuning must change no code.

Options:

| Option | Declarations | Retune touches | Cost / risk |
|---|---|---|---|
| **A. ci.yml env stays the source; nana-setup reads it by name through one small helper; READMEs mirror the literal, checked by test** | 1 (ci.yml) | ci.yml + README literals (docs must show a copyable literal anyway); **no code** | One new module (~30 lines, six-tag header, map entry). Product code reads a CI file, which is the first time. Mitigation: R-1091 already pins the env shape the parser relies on. |
| B. A nana-setup config module is the source; ci.yml env mirrors it, checked by test | 2 (module + ci.yml) | module + ci.yml + READMEs | Reopens R-1091 ("declared once … in ci.yml" would become a mirror) on the day it landed. CI still needs a literal. |
| C. A nana-setup module or JSON is the source; each CI job exports it to `$GITHUB_ENV` in a step | 1 | module + READMEs | Adds a step to three jobs and rewrites R-1090/R-1091. **Fail-open:** a failed derivation leaves `--before=` empty, and npm then installs unpinned with exit 0 (VERIFIED §0). Rejected. |
| D. A mirrored literal in `steps.mjs` (`PI_INSTALL_HINT` = full command), drift test | 2 | ci.yml + steps.mjs + READMEs | A one-line change, but **retuning changes code**, which the house rule calls a violation. Acceptable only if declared as one. |
| E. The hint points at the README with no values ("install pi as the root README's step 2 says") | 1 | READMEs only | Passes the subtraction test, but loses the copyable command. A user who skipped step 2 sees no command. |

**Recommendation: A.** ci.yml is what CI actually installs and proves on macOS and Windows (the install-check job), so the docs and hints should say "install exactly what CI proves". It keeps one declaration and leaves the just-landed rows R-1090 to R-1092 untouched. It also reuses the R-951 precedent, and retuning changes no code. Fall back to E for code only if the plan reviewer rejects product code reading the workflow file.

Helper shape (A):

```
packages/nana-setup/lib/pi-pin.mjs
  @purpose Derives the pinned pi install command from the pi version and resolution cutoff the root CI workflow declares.
  @effects disk (readPiPin reads <root>/.github/workflows/ci.yml); parsePiPin and piInstallCommand none
  @errors none thrown: unreadable or incomplete → null
  export function parsePiPin(workflowText)   // top-level env block only; split /\r?\n/ (CRLF on Windows checkouts);
                                             // PI_VERSION: (\S+); PI_BEFORE: "(...)"; both non-empty and Date-parseable, else null
  export function piInstallCommand(pin)      // pin → `npm i -g --ignore-scripts @earendil-works/pi-coding-agent@${v} --before=${b}`
                                             // null → `npm i -g --ignore-scripts @earendil-works/pi-coding-agent@<version> --before=<cutoff>`
                                             //        + " (see the root README, Fresh machine step 2)" — never an empty cutoff
  export function readPiPin(root)            // fs read + parsePiPin; null on any error
steps.mjs:810  export const PI_INSTALL_HINT = piInstallCommand(readPiPin(repoRoot));   // provenance: contract value, CI's PI_VERSION/PI_BEFORE (R-1091), read by name
```

Why the placeholder fails safe: a copied `<version>` makes bash and cmd fail on redirection, and PowerShell gives a parse error ("The '<' operator is reserved"). None of them installs unpinned. Inference from shell grammar; not run.

`PI_INSTALL_HINT` stays an exported constant, so R-1037 and the `.includes(PI_INSTALL_HINT)` checks in `doctor-runtime.test.mjs` and `pi-registration.test.mjs` keep passing unchanged. **`fresh-machine.test.mjs:31` must change:** `${PI_INSTALL_HINT}@${ciVersion}` would become `…--before=…Z@1.0.2`. Use `entries[1]?.includes(PI_INSTALL_HINT)` plus the README-command check below.

---

## 3. The drift check (proposed rows and tests; IDs from R-1093 to R-1099 are free, VERIFIED by grep)

Canonical command, derived in the test from CI itself: take the install-check job's pi line (`ci.yml:35`, `npm i -g --ignore-scripts @earendil-works/pi-coding-agent@${PI_VERSION} --before="${PI_BEFORE}"`), substitute both env values, and remove the double quotes. Result today: `npm i -g --ignore-scripts @earendil-works/pi-coding-agent@1.0.2 --before=2026-10-04T06:57:57Z`. Deriving it from the CI line ties the docs to the job that proves the install on both platforms, so a flag change in CI forces the docs to follow. The test reads values from ci.yml with its own regex (an independent oracle). It never imports `pi-pin.mjs` to compute expectations, and it never writes the literal.

Draft rows (one "shall" each):
- **R-1093** — Every pi install command in a README the readme check covers shall equal the CI install-check job's pi install line with the workflow's PI_VERSION and PI_BEFORE values written in and its quotes removed.
- **R-1094** — The root README's fresh-machine checklist, the desk README and the bench README shall each name that pinned pi install command. (Non-vacuity: deleting a command must not pass R-1093.)
- **R-1095** — Install's and doctor's missing-pi hint shall be the pinned pi install command built from the PI_VERSION and PI_BEFORE values the root CI workflow declares.
- **R-1096** — IF the root CI workflow cannot be read, or either value is missing, empty or not a valid date, THEN the missing-pi hint shall name the version and cutoff as placeholders and point to the README's fresh-machine step, never an empty cutoff.
- **R-1097** (if the bench hint is in scope) — IF the bench finds no installed pi package, THEN its fix line shall name the pinned pi install command.

Proposed test titles (luna needs exact titles; the seat should check them against the rows):
- `packages/nana-setup/tests/pi-install-pin.test.mjs` (one purpose: pins every user-facing pi install command to CI's version and cutoff)
  - `every README pi install command is CI's install-check line with its values written in` — req R-1093. It scans each README listed in `readme-check.config.json` (read the list; don't hard-code it). It takes every backtick span or fenced line matching `npm (i|install)\b` together with `@earendil-works/pi-coding-agent`. The readme check's own `--list` shows the current spans.
  - `the root, desk and bench READMEs each name the pinned pi install` — req R-1094
  - `pi pin reads PI_VERSION and PI_BEFORE from the workflow env with LF or CRLF line ends` — req R-1095
  - `the missing-pi hint is the pinned command with CI's version and cutoff` — req R-1095
  - `an unreadable or incomplete workflow gives a placeholder hint, never an empty cutoff` — req R-1096. Cases: no file; PI_BEFORE absent; `PI_BEFORE: ""`; `PI_BEFORE: "not-a-date"`; PI_VERSION absent.
- `packages/nana-setup/tests/fresh-machine.test.mjs:31` — the existing R-951 check, with the composition adjusted (title unchanged).
- `apps/bench/test/usage.test.mjs:300` — if R-1097 is in scope: add its own `// req: R-1097` marker, and change the regex to the pinned command (via import, not literal). Today it would go red: `--ignore-scripts` sits between `-g` and the package.

Doc edits that make the check green:
- `README.md:121` → `` `npm i -g --ignore-scripts @earendil-works/pi-coding-agent@1.0.2 --before=2026-10-04T06:57:57Z` ``. Also fix the stale cross-reference on the same line (§6 item 1).
- `apps/desk/README.md:25` → the same command (it gains `--ignore-scripts`).
- `apps/bench/README.md:11` → the same command. `:26` → drop the parenthetical span ("Nothing to install beyond the Dependencies above;"), which leaves one fewer mirror.
- `packages/nana-setup/README.md:70` → "Install or upgrade pi itself only with `npm i -g --ignore-scripts @earendil-works/pi-coding-agent@1.0.2 --before=2026-10-04T06:57:57Z`, the version and dependency cutoff CI tests; a new pi version moves both values in CI first." This replaces the `<version>` template, which would install a new version with no cutoff.
- The readme check is unaffected: flag claims attach only to lines naming a `scripts/…` path (`templates/typescript/template/scripts/readme-check.mjs:399-408`).

Seat code breaks to plan (each must turn a named check red):
1. Drop `--before=…` from README step 2 → R-1093.
2. Desk README left at `@1.0.2` without the cutoff → R-1093.
3. Bench README :26 keeps the unversioned span → R-1093.
4. Delete the bench README :11 command → R-1094.
5. Setup README :70 keeps `@<version>` → R-1093.
6. Change PI_BEFORE in ci.yml only (simulated retune) → README checks red. The hint check stays green, which proves the hint reads by name. (Note: R-1091's seal test also goes red, as intended.)
7. `parsePiPin` splits on `\n` only → CRLF case red.
8. `piInstallCommand(null)` emits `--before=` → R-1096 red.
9. `parsePiPin` accepts a non-date → R-1096 red.
10. `PI_INSTALL_HINT` reverted to the old literal → R-1095 red.
11. (If R-1097 is in scope) bench hint reverted → R-1097 red.

Threat model for the plan: honest variation in scope means new sibling releases on the registry, user shells (bash, zsh, PowerShell, cmd), CRLF checkouts, and a maintainer editing ci.yml or a README. Deliberate forgery is out (e.g. a hostile registry or a hand-forged ci.yml shape).

---

## 4. The desk freeze — what the lane may touch

Ruling text: "Status: frozen (Owner 2026-10-10: the desk stays frozen until he reopens it)" (`REQUIREMENTS.md:950` and six more feature headers). HANDOFF `:12`, `:55`. No commit has touched `apps/desk` since 2026-10-09 (VERIFIED `git log`).

- **`apps/desk/README.md:25` (doc only) — recommend ALLOWED, seat's call.** The README contract (G-012) says every command must run as written. Today the command installs a tree whose root import fails (VERIFIED in scratch), and that import is what the desk does at start (`pi-session.mjs:358`). CI's 13 failing desk test files on 2026-10-13 show the same break. Correcting a false README line changes no desk behaviour, row or test, so it is not a desk feature change. Name it in the land report. One process cost: the land runbook (`packages/nana-setup/README.md:66`) requires quiescing the desk service before `nana-land` whenever the lane's diff touches `apps/desk`. A README-only change still trips that rule.
- **`apps/desk/pi-session.mjs:347,353` (code hints) — recommend LEAVE, record a residual.** They fire only for a non-semver pi or a pi below 0.84.4. Today the unversioned command they print gives pi 1.2.0, which imports cleanly with the desk's exports (VERIFIED), so it is not broken, just untested. The break path (`:358-360`) prints no fix line at all. Changing either string would be the first desk code change since the freeze, so it waits for the owner to reopen the desk. Cost of waiting: low (a rare path, not broken today).

---

## 5. Windows PowerShell and cmd: does `npm i -g pkg@1.0.2 --before=<date>` behave the same?

Short answer: yes for the cutoff token, with or without quotes. Recommend the **unquoted** form `--before=2026-10-04T06:57:57Z` in docs and hints. The value holds only `[0-9TZ:-]`, which no shell in scope treats as special. Nothing here was run on Windows; it rests on DOC sources plus the local shim text.

- **npm side (DOC + VERIFIED on macOS).** `before` has type "null or Date" (npm v10 config docs). `--before=X` and `--before X` both parse. An invalid or empty value warns, falls back to null and exits 0 (VERIFIED §0). That is the real risk: any mangling fails open and stays quiet.
- **cmd.exe (VERIFIED shim text, INFERRED behaviour).** npm 10.9.7's `npm.cmd` runs `"%NODE_EXE%" "%NPM_CLI_JS%" %*`. `%*` forwards the raw tail, so `=` and `:` survive, even though `=` would split `%1`-style batch parameters. cmd's metacharacters (`& | < > ^ ( ) %`, and `!` under delayed expansion) are absent from the token. In the quoted form, the quotes reach node.exe, whose Windows argv parser strips them.
- **PowerShell (DOC + VERIFIED shim text, INFERRED behaviour).** about_Parsing (PowerShell 7.6, ms.date 2026-06-29) says that in argument mode "all input is treated as an expandable string" unless it uses `$`, quotes, braces, commas, parentheses, `$()`, or an initial `@ < > #`. `--before=2026-10-04T06:57:57Z` uses none of these. It is also not a PowerShell parameter token, because a parameter needs a letter after the dash. In the quoted form, PowerShell joins `--before=` and `"…"` into one argument and drops the quotes. npm 10.9.7's `npm.ps1` -Command branch re-parses the original statement text with `[Parser]::ParseInput` and runs it via `Invoke-Expression "& node npm-cli.js <args>"`, so the token is parsed twice. With no metacharacters, both parses give the same result. The known npm.ps1 breakage (nodejs/node#54390) concerns a bare `--` token, which this command does not use. `$PSNativeCommandArgumentPassing` (7.3+) changes only arguments with embedded quotes or empty strings.
- **The one claim I'd most expect to be wrong:** that an unquoted `@earendil-works/pi-coding-agent@1.0.2` is never read as splatting in PowerShell. about_Parsing lists an initial `@` as special ("begins … splatting (`@args`)"). Scoped installs such as `npm i -g @angular/cli` are standard in PowerShell docs and tutorials, and README step 2 already uses this token today, so the lane adds no new risk (INFERRED, not run).
- **npm 11 (Node 24 users).** `before` remains, and `min-release-age` is added. If both are set in the same source, "`before` wins" (DOC, v11 config docs, quoted in `docs/reviews/ci-pi-pin-2026-10-13/research-npm.md`).
- **Cheapest verification, if wanted:** add one step to the owner's Windows check page (this lane already edits it). In PowerShell, run the README's literal command with `--dry-run`, then confirm the output lists `add @earendil-works/pi-codemode 1.0.2`. A CI `shell: pwsh` step would also work, but it touches R-1078 and its test, which is too much for this lane.

---

## 6. Side findings (adjacent; each one is fixed in this lane or becomes a residual)

1. **Stale cross-reference.** `README.md:121` says "see the setup README's “Upgrading pi itself” section". No such heading exists: the text is a sentence under "### Update nana-pi" (`packages/nana-setup/README.md:63,70`). The readme check does not check prose section names. Fix it with the step 2 edit.
2. **No user-side check detects a wrong tree.** README step 2's `pi --version` and doctor's `pi executable` row (`doctor.mjs:329-331`, which accepts any `^v?\d+\.\d+\.\d+`) both pass on the broken tree (ci-pi-pin session notes; codemode is inlined in the bundled CLI). Re-running the pinned command repairs a broken machine (VERIFIED §0). Candidate, not for this lane: a doctor row that imports pi's main entry, the user-side twin of HANDOFF `:45`'s CI hardening step. Doctor also does not compare pi's version with CI's.
3. **`--ignore-scripts` is inconsistent today.** README step 2, the setup README and the install-check job use it; the desk/bench READMEs and the suite/release jobs do not. The canonical command takes the install-check form; the import with it is clean (VERIFIED). The skipped scripts are esbuild, protobufjs and @google/genai (DOC, research-npm.md).
4. **An untraced bench check.** `apps/bench/test/usage.test.mjs:300` has no `// req:` marker directly above it.
5. **The import-failure messages give no fix line**, in the desk (`pi-session.mjs:360`, frozen) and the bench (`pi-exports.mjs:162`). The bench one could name the pinned command under R-1097. This is optional.

## 7. Residual candidates (one HANDOFF line each, if not fixed)

- The desk's fix hints install an unversioned pi, and its import-failure message names no fix. Both wait for the owner to reopen the desk.
- PowerShell and cmd handling of the pinned command is inferred from docs and npm's shims, not run on Windows.
- Neither doctor nor README step 2 detects a pi tree with mismatched siblings. A doctor import check is the candidate.
- The bench study fixture README keeps an unversioned install line on purpose: it is a recorded study fixture.

## Sources

- npm v10 config docs, `before`: https://docs.npmjs.com/cli/v10/using-npm/config
- PowerShell about_Parsing (7.6): https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_parsing
- npm.ps1 `--` breakage: https://github.com/nodejs/node/issues/54390
- Local: npm 10.9.7 `bin/npm.cmd`, `bin/npm.ps1`, `node_modules/nopt/lib/type-defs.js:41-48`, `node_modules/@npmcli/config/lib/index.js:487-494`, `…/definitions/definitions.js:231-238`; pi 1.0.2 `docs/packages.md:88`; pi 1.2.0 tarball `dist/index.d.ts:15,21`.
- Scratch prefixes kept for reuse: `plan-fresh-install/probe/repair` (pinned tree, after the repair), `probe/latest` (pi 1.2.0), `probe/t120` (unpacked 1.2.0 tarball).
