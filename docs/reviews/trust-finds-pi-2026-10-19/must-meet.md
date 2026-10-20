# trust-finds-pi — must-meet

Feature: FEAT-009 · Decide which project content is trusted
Class: ordinary. Only the trust command, its test file and one setup README paragraph change. Install, uninstall, doctor, hooks, pi extensions, the gate and the land and review tools are untouched.
Threat model: honest variation is in scope. That covers:
- no pi under npm's global folder: not installed yet, installed by another package manager, npm's prefix changed since, or a pi release that moved its trust module
- a pi trust module without the `ProjectTrustStore` export
- an ambient npm prefix variable in any letter case
- macOS, Linux and Windows
Deliberate forgery of pi's package is out.

## Feature (one falsifiable sentence)
When `nana-setup trust <dir>` cannot load pi's trust store from npm's global folder, it exits 2 with one stderr line naming the module path it tried and the pi install command, not a Node stack trace.

## Design
- Fail cleanly. Do not search PATH, for three reasons:
  1. Under the README's npm route, the `pi` on PATH sits in the prefix `npm root -g` reports (inferred for nvm and fnm, not probed).
  2. A PATH lookup needs a branch per installer and platform: POSIX symlinks, Windows `.cmd` shims, pnpm, bun and volta.
  3. R-670 already reads pi through npm's global folder.
- `runTrust` binds the module path to one const.
- A failed dynamic import throws `SetupError` with:
  - the path
  - `err.code ?? err.name`, never the stack or a multi-line message
  - `PI_INSTALL_HINT`, imported from `lib/steps.mjs`, so no new literal
- After the import, `typeof ProjectTrustStore !== "function"` throws the same kind of `SetupError`.
- The existing handler prints a blank line, then one `nana-setup: …` line, and exits 2. Trust's sibling refusals do the same. Today's crash exits 1.
- The CLI header's `@errors` names the new refusal.
- Setup README, paragraph "Trust is yours to decide", gets two or three sentences:
  - Trust loads pi's store from the pi package in npm's global folder (`npm root -g`).
  - When it is missing or has no `ProjectTrustStore`, trust exits 2 with one line naming the path and the pi install command.
  - A pi from another package manager is not found there.
  - Name no pi-internal file path.

## Must-meet

| Row | Requirement (EARS) | Test (file::title) | Red today (probe, main 22ccd849, temp clone, temp HOME) |
|---|---|---|---|
| R-1800 | IF npm's global folder holds no pi trust module THEN `nana-setup trust <dir>` shall exit 2, write no trust store, and print exactly one non-empty stderr line naming the module path it tried and the shared pi install command. | `packages/nana-setup/tests/trust.test.mjs::no pi under npm's global folder exits 2 with one line naming the module path and the install command` | Empty prefix: exit 1, `Error [ERR_MODULE_NOT_FOUND]` plus 10 stack lines. The prototype check FAILS on main's CLI and PASSES with the fix. |
| R-1801 | IF pi's trust module under npm's global folder loads but exports no `ProjectTrustStore` THEN `nana-setup trust <dir>` shall exit 2 and print exactly one non-empty stderr line naming that module path and the shared pi install command. | `packages/nana-setup/tests/trust.test.mjs::a pi trust module without ProjectTrustStore exits 2 with one line naming the module path and the install command` | A planted CommonJS `module.exports = {};` gives exit 1, `TypeError: trustModule.ProjectTrustStore is not a constructor` plus 2 stack lines. The prototype check FAILS on main's CLI and PASSES with the fix. |

Test mechanics (one small helper shared by both checks):
- Env:
  - Copy `process.env`.
  - Set HOME to the test's temp home.
  - Set `PI_CODING_AGENT_DIR` to a fresh absolute dir under the test root.
  - Delete every key whose lowercase is `npm_config_prefix`, then set `npm_config_prefix` to a fresh folder under the test root.
  - Why delete: npm's own `npm run` sets a prefix key, and a machine may export the uppercase one. Probe: with both set, which one wins depends on key order.
- Run the CLI as `trust <dir> --yes` with cwd at the test root. Do not pass `--home`.
- Expected path: `spawnNpmRoot({ env })` on that env with HOME and USERPROFILE deleted, as the product does, then the same `path.join`. Windows' `<prefix>\node_modules` and macOS `/private` spellings need no special case.
- R-1801 plants `module.exports = {};` at that path.
- Assert:
  - status === 2
  - stderr split on `/\r?\n/` has exactly one non-empty line
  - that line includes the module path and the imported `PI_INSTALL_HINT`
  - R-1800 only: no `trust.json` in the fresh agent dir
- Cross-platform, no skip. The root is computed, not assumed.
- The existing R-670/671/672/313 checks guard the found-pi path. In the prototype all 11 passed with the fix, under an ambient uppercase prefix variable.

Checks on the prototype:
- `readme:check`: 0 problems, the `npm root -g` mention included.
- `map:check`: green after `npm run map`.
- `scripts/requirements-trace.mjs`: green, with 0 rows off EARS form.

## Seat steps (not the builder)
- Before the final review round, in the lane's change:
  - Delete the readme-install HANDOFF residual: "the trust command crashes with a stack trace when npm's global folder holds no pi".
  - Record the known limits below as residuals.
  - Add the session note.
- Before the final review and the land: run `node "$HOME/nana-pi/scripts/requirements-moved.mjs" --root . --base main` and carry its output in both.
- Before nana-land: run `node packages/nana-setup/bin/install-check.mjs` on macOS. The lane touches packages/nana-setup.

## Known limits (residuals)
- A pi installed by pnpm, bun, volta or yarn's global install is not found. The line names where trust looked. Under volta, `npm i -g` may land in volta's own store (inferred, not probed).
- A mixed setup, such as Homebrew Node plus nvm, can show a working pi on PATH. That user is told to install a second pi into the active npm prefix.
- A trust module whose own dependency is missing also reports ERR_MODULE_NOT_FOUND against the trust module path. The install hint still repairs it.
- When npm itself is missing or fails, the existing "cannot locate the globally installed pi package" line stays. It names no install command.
- The lane name says "finds pi". The design deliberately does not search PATH.