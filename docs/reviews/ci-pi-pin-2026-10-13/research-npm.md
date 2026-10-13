# CI pi pin: npm `before` research (2026-10-13)

Scope: external facts for pinning the CI pi install after the pi-codemode 1.2.0 drift. Read-only for the repo;
all installs below went to scratch prefixes (`ci-pin/pA`, `ci-pin/pB`) with an isolated cache (`ci-pin/cache*`).
Local tooling: npm 10.9.7, node v22.22.2. CI runner: node 22.23.2 from hostedtoolcache (job log), which bundles
npm 10.9.x (nodejs.org/dist/index.json: latest v22.23.3 ships npm 10.9.9). So **npm v10 semantics are what CI runs**;
`min-release-age` (v11+) is not available there.

Status legend: VERIFIED = run here; DOC = quoted from npm docs/source; INFERRED = reasoning, not run.

---

## 0. The drift, confirmed

| Evidence | Result |
|---|---|
| `npm view @earendil-works/pi-coding-agent@1.0.2 dependencies` | `@earendil-works/{chord,pi-ai,pi-mcp,pi-tui,pi-codemode,pi-agent-core}: "^1.0.2"`; third-party deps exact-pinned (diff 8.0.4, undici 8.10.2, ...) |
| pi-codemode tarballs 1.0.2, 1.0.3, 1.0.4, 1.1.0 (`dist/declarations.js`) | all `export const MCP_TYPESCRIPT_PREAMBLE` |
| pi-codemode 1.2.0 | export gone (also `mcpStructuredContentSchema`); new `schemaToType` |
| pi 1.0.2 `dist/extensions/codemode/tool.js:24` | `import { MCP_TYPESCRIPT_PREAMBLE, mcpStructuredContentSchema, ... } from "@earendil-works/pi-codemode/declarations"` |
| pi 1.2.0 `tool.js:24` | `import { renderToolOutputType, renderToolSample, toCodemodeIdentifier } ...` (no removed symbol) |
| Scratch install, no `--before` (pA) | codemode 1.2.0; `import(dist/index.js)` -> `SyntaxError ... MCP_TYPESCRIPT_PREAMBLE`; `pi --version` still prints `1.0.2` (VERIFIED) |
| Scratch install, `--before=2026-10-04T06:57:57Z` (pB) | codemode 1.0.2; `import(dist/index.js)` OK; `pi --version` 1.0.2 (VERIFIED) |
| CI run 38339959569 macOS job log | `added 119 packages`; 23 lines with the `MCP_TYPESCRIPT_PREAMBLE` SyntaxError. 119 = exactly my fresh no-`before` resolution count |
| CI run 38262900510 (main, 2026-10-12T14:26Z, pre-drift) | `added 121 packages`, no SyntaxError |

Root cause (DOC + VERIFIED): upstream ships all siblings at once but pi declares caret ranges on them, and
pi-codemode 1.2.0 removed an export in a minor release. The `pi --version` gate in ci.yml passes on a broken tree,
because the CLI runs from `dist/bundle/` while tests import the unbundled module graph.

**Side finding (INFERRED from resolution rules, consistent with the log):** CI was already not running the
Mac's tree before the drift. From 2026-10-05T08:30Z the fresh install picked 1.0.3/1.0.4, and from 2026-10-07 it
picked 1.1.0 siblings (a `--before=2026-10-12T22:59:00Z` resolution gives all-1.1.0 siblings). So CI's last
green runs tested pi 1.0.2 + 1.1.0 siblings. Pinning to the Mac cutoff changes what CI tests to the seat's tree.

---

## 1. `--before <date>` semantics

### Doc text (npm v10, local `npm/docs/content/using-npm/config.md` and docs.npmjs.com/cli/v10/using-npm/config)

> **before** — Default: null — Type: null or Date
> "If passed to `npm install`, will rebuild the npm tree such that only versions that were available **on or
> before** the `--before` time get installed. If there's no versions available for the current set of direct
> dependencies, the command will error.
> If the requested version is a `dist-tag` and the given tag does not pass the `--before` filter, the most recent
> version less than or equal to that tag will be used. For example, `foo@latest` might install `foo@1.2` even
> though `latest` is `2.0`."

npm v11 (docs.npmjs.com/cli/v11/using-npm/config) adds:

> "If `before` and `min-release-age` are both set in the same source, `before` wins (an explicit absolute date
> overrides a relative window). Across sources, the standard precedence applies (cli > env > project > user >
> global) ... As with `min-release-age`, when this cutoff blocks a fix that `npm audit fix` would install, npm
> keeps the vulnerable version, warns, and exits with a non-zero code. Packages whose names match
> `min-release-age-exclude` are exempt from this filter."

and the new relative option (v11 only):

> **min-release-age** — Type: null or Number — "If set, npm will build the npm tree such that only versions that
> were available more than the given number of days ago will be installed. ... This value is not exported to the
> environment for child processes."

(npm/cli `latest` branch is now 12.2.0; its `before` definition text is identical to the v11 doc.)

### Which packages it constrains: the whole tree (DOC source + VERIFIED)

- Every registry manifest pick goes through `npm-pick-manifest` with `before` (pacote `registry.js:130-134`
  passes `before: this.before`). So direct and transitive dependencies are all filtered.
- pacote `fetcher.js:79`: `this.fullMetadata = this.before ? true : !!opts.fullMetadata`. `before` forces full
  packuments, because the abbreviated ("corgi") packument has no per-version `time`. Cost measured here: cold
  dry-run 3 s with or without `before`; metadata cache 61 MB vs 67 MB. Negligible.
- `npm-pick-manifest@10.0.0 lib/index.js:17-18`:
  `isBefore = (verTimes, ver, time) => !verTimes || !verTimes[ver] || Date.parse(verTimes[ver]) <= time`.
  The cutoff is inclusive ("on or before"). A version with no `time` entry passes (fail-open; npmjs always has `time`).
- VERIFIED: with the cutoff, all eight `@earendil-works/*` and every third-party transitive dependency resolved
  to the Mac's versions. The full `npm ls -g --all` output (287 lines) diffed IDENTICAL against this Mac's tree.

### Accepted date formats (DOC source + VERIFIED)

- nopt `type-defs.js:41-48` `validateDate`: `Date.parse(val)`; NaN -> invalid. Anything JS `Date.parse` accepts.
- `2026-10-05` (date-only) = UTC midnight on every machine.
- `2026-10-04T06:57:57` (date-time, **no Z**) = LOCAL time: UTC on the runner, but 10:57:57Z on this Mac (EDT).
  **Always write the trailing `Z`.**
- Invalid value (VERIFIED, `--before=garbage`): `npm warn invalid config before="garbage" set in command line options`,
  exit 0, filter dropped, resolves codemode 1.2.0. **A typo fails OPEN, with only a warning.**
  (`@npmcli/config` `invalidHandler` logs and nopt `clean` removes the key.)

### Interaction with `npm i -g` (VERIFIED)

- Works the same as a local install; `-g --prefix <scratch>` resolved and installed the Mac tree.
- Global installs never read or write a lockfile. Arborist `reify.js:109` errors with "cannot generate lockfile for
  global packages", and `reify.js:1381` says "we're going to completely skip save ideal tree in case of a global
  or dry-run install". So `--before` is the only resolution control `npm i -g` has, short of an upstream shrinkwrap.

### Interaction with `--ignore-scripts` (DOC + VERIFIED)

- They are independent. `before` filters resolution; `ignore-scripts` skips lifecycle scripts ("If true, npm does not
  run scripts specified in package.json files"). The pB scratch install used both together, and its module graph imports cleanly.
- The pi 1.0.2 tree has three packages with install scripts: esbuild, protobufjs and @google/genai. The suite jobs
  run them; the install-check lane's `--ignore-scripts` line skips them. That has no bearing on `before`.

### Interaction with `npm ci` / lockfiles (VERIFIED in `ci-pin/ciprobe`)

- I created a lock that holds codemode 1.2.0, then ran `npm ci --before=2026-10-04T06:57:57Z`. It installed **1.2.0**: the lockfile wins and `before` is ignored for locked nodes.
- `npm i --before=...` with no lock resolved 1.0.2 and wrote it to the lock. A later plain `npm i` kept 1.0.2
  because the lock persists the cutoff's choice.
- The repo has no `package-lock.json`, and CI runs no `npm ci`, so this matters only if someone adds one later.

### Explicit version newer than the date (DOC source + VERIFIED)

- `pick-manifest` lines 110-115: "if a specific version, then only that version will do". It returns null when the
  version is after the cutoff, and then throws ETARGET.
- VERIFIED: `--before=2026-10-04T00:00:00Z @earendil-works/pi-coding-agent@1.0.2` fails with exit 1:
  `npm error code ETARGET ... No matching version found for @earendil-works/pi-coding-agent@1.0.2 with a date before 2026-10-03, 8:00:00 p.m..`
  (The date prints in local time through `toLocaleString`.)
- pi-coding-agent 1.0.2 was published at `2026-10-04T00:56:19.486Z`, so any cutoff at or after that time passes the top-level pin.
- Consequence: if PI_VERSION is bumped without moving the cutoff, the install **fails closed and loudly**. That is good.

### Imperfections (DOC source; INFERRED impact)

- The cutoff does not freeze `deprecated` flags, engines or dist-tags. pick-manifest sorts using the *current*
  `deprecated` flag and the *running* Node's engines (lines 159-187). So a third-party version deprecated after the
  cutoff could be skipped for an older one. For the `@earendil-works/*` ranges inside the window, `^1.0.2` has
  exactly one candidate (1.0.2), so those picks are forced.
- Unpublish is possible only within 72 h of publish, so it is not a risk for an October 4 cutoff.

---

## 2. Env-var form and job-wide risk

- DOC (v10 and v11 identical): "Any environment variables that start with `npm_config_` will be interpreted as a
  configuration parameter. ... Config values are case-insensitive, so `NPM_CONFIG_FOO=bar` will work the same."
  Precedence: "Command Line Flags", then "Environment Variables", then npmrc files, then defaults.
- VERIFIED: `npm_config_before=...` and `NPM_CONFIG_BEFORE=...` both resolve codemode 1.0.2, the same as the flag.
  With both set, the CLI flag wins.
- **Export to children differs (VERIFIED):**
  - A CLI `--before` is **not** exported to lifecycle children. `@npmcli/config set-envs.js` `envVal` returns null
    for objects, and a Date is an object. `npm test --before=...` with a script printing `npm_config_before` printed `undefined`.
  - An env var set by the job is ordinary process environment. It reaches `npm test`, then `node scripts/test.mjs`,
    then every child.
- Job-wide (workflow or job `env:`) risks:
  - Every npm resolution in the job is frozen at the cutoff, and any explicit `pkg@x` published after it hits ETARGET.
    This covers future `npm install`, `npm exec` or `npx` calls in tests, and pi's own package installs (`pi install npm:...`).
  - The current tests call `npm root -g`, which does no resolution and is unaffected. They also call `pnpm dlx @biomejs/biome`
    in templates-render.test.mjs. **Not checked:** whether pnpm 11 reads `npm_config_before`.
  - pnpm/action-setup's self-installer runs in the same job. pnpm 11.28.5, the newest 11.x, was published 2026-10-06,
    after the cutoff. **Not checked** whether it honours the variable.
  - With a lockfile, `npm ci` is unaffected (see section 1). Without one, `npm ci` errors anyway.
  - Debugging gets harder. A frozen-in-time registry view leaks into unrelated steps, and nothing in the log says why.
- Recommendation: put the cutoff on the **one install command line** as `--before=...`. Keep its value in a
  workflow `env:` key that is **not** named `npm_config_*` or `NPM_CONFIG_*` (for example `PI_BEFORE`), beside
  `PI_VERSION`. The CLI flag is not exported to children (verified), so nothing else in the job sees it.

---

## 3. Publish times and the cutoff

`npm view <pkg> time --json`, 1.x only (UTC):

| package | 1.0.2 | 1.0.3 | 1.0.4 | 1.1.0 | 1.2.0 |
|---|---|---|---|---|---|
| pi-coding-agent | 2026-10-04T00:56:19.486Z | 10-05T08:37:00 | 10-05T21:51:59 | 10-07T22:16:26 | 10-12T23:03:25 |
| pi-ai | 2026-10-04T00:52:58.574Z | 10-05T08:30:59 | 10-05T21:44:42 | 10-07T22:12:08 | 10-12T23:01:40 |
| pi-agent-core | 2026-10-04T00:52:53.490Z | 10-05T08:31:54 | 10-05T21:46:28 | 10-07T22:09:51 | 10-12T22:59:50 |
| pi-tui | 2026-10-04T00:52:49.379Z | 10-05T08:35:33 | 10-05T21:46:32 | 10-07T22:12:50 | 10-12T23:00:40 |
| pi-mcp | 2026-10-04T00:52:12.798Z | 10-05T08:33:09 | 10-05T21:46:11 | 10-07T22:14:39 | 10-12T23:00:29 |
| pi-codemode | 2026-10-04T00:53:39.365Z | **10-05T08:30:34.061Z** | 10-05T21:44:56 | 10-07T22:11:47 | **10-12T23:00:01.855Z** |
| chord | 2026-10-04T00:53:33.066Z | 10-05T08:31:35 | 10-05T21:44:46 | 10-07T22:10:03 | 10-12T23:00:06 |
| pi-telemetry (via pi-ai) | 2026-10-04T00:53:36.238Z | 10-05T08:31:15 | 10-05T21:46:56 | 10-07T22:10:40 | 10-12T23:00:34 |

This Mac: `npm ls -g --all` shows all eight packages at 1.0.2. Install moment: `pi-coding-agent/package.json`
mtime is `2026-10-04T02:57:57-0400`, which is `2026-10-04T06:57:57Z`.

Cutoff windows (VERIFIED by dry-run resolution of `pi-coding-agent@1.0.2 -g`):

| `--before` | result |
|---|---|
| 2026-10-04T00:00:00Z | ETARGET (before pi 1.0.2 itself) |
| 2026-10-04T00:56:20Z | 146 entries, identical to the Mac set |
| **2026-10-04T06:57:57Z** | identical; real install gives an **identical 287-line `npm ls -g --all`** to the Mac |
| 2026-10-05 (UTC midnight) | identical |
| 2026-10-05T08:30:00Z | identical |
| 2026-10-12T22:59:00Z | all 1.1.0 siblings, 50 differing lines (also newer @aws-sdk/*); not the Mac tree but not broken |
| none / invalid | 1.2.0 siblings, 119 packages; broken import |

- **Mac-tree window:** `[2026-10-04T00:56:19.486Z, 2026-10-05T08:30:34.061Z)`. The lower bound is pi-coding-agent
  1.0.2's publish time. The upper bound is the first 1.0.3 sibling, pi-codemode.
- **Not-broken window (looser):** `< 2026-10-12T23:00:01.855Z`.

**Proposed value:** `2026-10-04T06:57:57Z`.
Provenance line: *measured 2026-10-13: this Mac's global pi 1.0.2 install moment (pi-coding-agent/package.json
mtime 2026-10-04T02:57:57-04:00). `npm i -g --before=` that value reproduced the identical 287-line
`npm ls -g --all` tree in a scratch prefix. Valid window: 2026-10-04T00:56:19.486Z (pi 1.0.2 publish) up to
2026-10-05T08:30:34.061Z (first 1.0.3 sibling).*

Alternative: `2026-10-04T23:59:59Z`, matching the "pi 1.0 adoption 2026-10-04" comment already in ci.yml. It is
inside the window but was not run here as a full install, only reasoned to resolve the same set.

Free requirement IDs: main tops out at R-1043, feat/cc-hooks-windows at R-1064, and feat/install-check at R-1084
(R-1070 to R-1089 reserved). No branch uses R-1090 or above, so the next free ID is **R-1090**.

---

## 4. Alternatives and costs

| Option | Works for `npm i -g`? | Cost / risk |
|---|---|---|
| **A. `--before=<cutoff>` on the install line** (recommended) | yes (VERIFIED) | One more tunable, which must move with PI_VERSION; moving PI_VERSION alone gives a loud ETARGET. A malformed date fails open with only a warning, so pin the ISO-Z format in the ci-workflow test, or have CI assert the codemode version after install. Deprecation and engines are not time-frozen (minor). It is inert for any future lockfile. |
| B. npm `overrides` | **no** | DOC: "Overrides are only considered in the root `package.json` file for a project. Overrides in installed dependencies ... are not considered". A global install has no root project. Using overrides would need a CI-only project (package.json, overrides, committed lock, `npm ci`), which gives the strongest pin (integrity hashes). But tests and the desk find pi through `npm root -g` (pi-install.mjs, nana-setup project.test.mjs, apps/desk pi-session.mjs), so PATH and root resolution would change. Large blast radius. |
| C. Post-install nested reinstall (`npm i --no-save --prefix "$(npm root -g)/@earendil-works/pi-coding-agent" @earendil-works/pi-codemode@1.0.2`) | INFERRED yes, not run | Patches one package and leaves pi-ai, pi-tui, pi-mcp, pi-agent-core and chord at 1.2.0. That mixed tree matches neither the seat nor any upstream release. It mutates an installed package directory, needs Windows path quoting, and still needs the cutoff knowledge. Installing codemode@1.0.2 as a separate top-level global would not help: pi resolves its own nested copy first (INFERRED from Node resolution). |
| D. Bump PI_VERSION to 1.2.0 | yes | Fixes the symbol, since pi 1.2.0 no longer imports it. **It does not fix the class:** pi 1.2.0 declares `^1.2.0` on siblings, so the next sibling minor can repeat this. Its CHANGELOG has breaking changes that touch us. **1.2.0:** `before_agent_start` now also fires for `pi.sendMessage(..., {triggerTurn:true})` runs, and `BeforeAgentStartEvent` becomes a union on `messageType` (custom runs carry no `prompt`). The session counts as busy during `before_agent_start`, `sendUserMessage` needs `deliverAs`, `pi mcp list --json` changes shape, theme `$schema` moved, and the chord dependency is removed. **1.0.3:** the Azure provider is renamed to `azure`. We have four `before_agent_start` handlers: nana-knowledge guards `typeof prompt !== "string"`; nana-objective, nana-writing and nana-handoff would now also run on extension-triggered runs and need review (INFERRED). The Mac seat runs 1.0.2, so the seat must be upgraded and re-verified. The `PI_VERSION: 1\.0\.2` assertion in ci-workflow.test.mjs and the ci.yml provenance comment change. engines stay `node >=22.19.0` (same as 1.0.2). |
| E. Upstream fix (pi 1.0.x patch, codemode re-export, or published npm-shrinkwrap) | n/a | DOC: shrinkwrap "may be included when publishing a package", and its recommended use is "command-line tools intended as global installs". Only upstream can ship one. Worth an upstream issue: removing an export in codemode 1.2.0, a minor release, broke pi 1.0.2's declared range. Out of our control for timing. |
| F. npm v11 `min-release-age` | no on CI | CI's Node 22 bundles npm 10.9.x, where the option does not exist. It is a relative window, so it drifts daily and is not a pin. |

Parallel drift surfaces noticed, not in scope: CI also floats `node-version: 22` (runner had 22.23.2),
`pnpm/action-setup` `version: 11` (11.28.5 published 2026-10-06) and setup-uv.

---

## Evidence files (all under `scratchpad/ci-pin/`)

- `mac-global-tree.txt`: this Mac's `npm ls -g --all`
- `pB-tree.txt`: scratch install with the cutoff (diff: IDENTICAL)
- `adds-*.txt`: dry-run resolution per cutoff
- `tarballs/`: codemode 1.0.2 to 1.2.0 and pi 1.0.2 / 1.2.0 tarballs, extracted
- `changelog-1.0.3-to-1.2.0.md`: pi CHANGELOG sections after 1.0.2
- `ci-38339959569-macos.log`, `ci-38262900510-macos.log`: CI job logs
- `docs-v10-config.txt`, `docs-v11-config.txt`, `npm-latest-definitions.js`: doc sources
- `ciprobe/`, `envprobe/`: lockfile and env-export probes

Sources: https://docs.npmjs.com/cli/v10/using-npm/config ; https://docs.npmjs.com/cli/v11/using-npm/config ;
npm 10.9.7 bundled docs (`commands/npm-ci.md`, `configuring-npm/package-json.md#overrides`,
`configuring-npm/npm-shrinkwrap-json.md`); npm-pick-manifest 10.0.0, pacote 19.0.2, @npmcli/config, nopt 8.1.0
and @npmcli/arborist source in npm 10.9.7; https://raw.githubusercontent.com/npm/cli/latest/workspaces/config/lib/definitions/definitions.js ;
https://nodejs.org/dist/index.json .
