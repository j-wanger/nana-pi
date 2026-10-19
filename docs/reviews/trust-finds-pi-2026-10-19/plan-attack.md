# trust-finds-pi — plan attack (one adversary)

Verdict: AMEND

AMEND, with small changes. The design (fail cleanly, no PATH lookup) and both rows stand. I tested every claim in a shared clone of main 22ccd849 in a mktemp folder with a temp HOME. The real repo stayed clean, and I removed the temp folder afterwards.

Probes:
- R-1800 is red today. An empty `npm_config_prefix` gives exit 1, ERR_MODULE_NOT_FOUND and 10 stack lines.
- R-1801 is red today. A planted CommonJS `module.exports = {}` gives exit 1 and "TypeError: trustModule.ProjectTrustStore is not a constructor".
- I added the plan's fix (about 6 lines in runTrust) and the two checks to the clone. Against main's CLI, both new checks FAIL. With the fix, all 13 checks PASS, including the 11 existing ones.
- The fixed run had an ambient uppercase NPM_CONFIG_PREFIX set.
- `readme:check` reported 0 problems with the README sentences, `npm root -g` included.
- `map:check` is green after `npm run map`. Only the steps.mjs callers line and the trust test's callees change.
- `scripts/requirements-trace.mjs` is green with the two rows: 0 rows off EARS form, and both titles trace.
- `req:tree` changes only the CAP-03 and FEAT-009 summary lines.

Amendments:
1. The test must delete every case variant of `npm_config_prefix` before setting its own. Probe: `npm run` already sets `npm_config_prefix` for the child. When NPM_CONFIG_PREFIX and npm_config_prefix were both present, the shell probe let the uppercase value win. The Node env-spread case let the lowercase value win. So the result depends on key order. npm's own docs suggest exporting NPM_CONFIG_PREFIX. On Windows, env keys are case-insensitive.
2. The plan said "Seat, at land: delete the HANDOFF residual". That breaks the working pattern, because nothing is written after a land. The residual deletion, the new known-limit residuals and the session note go in the reviewed change before the final round.
3. The seat runs `node packages/nana-setup/bin/install-check.mjs` on macOS before nana-land. The AGENTS rule requires it for any lane touching packages/nana-setup, and the plan left it out.
4. The message uses `err.code ?? err.name`, so a SyntaxError never prints "undefined".
5. The CLI header's @errors names the new refusal. Today it says an unexpected throw prints a stack, and pi-missing was one.
6. I dropped the `/^\s+at /` assertion. "Exactly one non-empty line" already covers it.

Lane class: ordinary is correct. Trust is not install, uninstall or doctor, and no hook, extension, gate or land tool changes.

Conflicts (I diffed each in-flight branch against main):
- No in-flight lane touches `packages/nana-setup/bin/nana-setup.mjs`, `packages/nana-setup/tests/trust.test.mjs` or `lib/npm-root.mjs`.
- win-path-commands edits `lib/steps.mjs` but not PI_INSTALL_HINT. This lane only imports that export.
- The setup README hunks from win-path-commands (lines 55, 103, 384–386, 415, 451) and stale-copies-hooks (73, 453) are far from the trust paragraph at 216–219.
- REQUIREMENTS.md, docs/code-map.md and docs/requirements-tree.md are shared generated or appended files in every lane. Regenerate with `npm run map` and `npm run req:tree` after merging main.
- The slate siblings (pi-settings-bom, post-edit-win-survivors) have no branch yet. Neither is expected to touch the trust command.
- waitFor: none.

Files the build touches (repo-relative):
- packages/nana-setup/bin/nana-setup.mjs
- packages/nana-setup/tests/trust.test.mjs
- packages/nana-setup/README.md
- REQUIREMENTS.md
- docs/requirements-tree.md
- docs/code-map.md
Seat-only, before the final round: HANDOFF.md and docs/sessions/2026-10.md.

Most likely wrong: overriding `npm_config_prefix`, after deleting its case variants, makes `npm.cmd root -g` report the temp prefix on the Windows CI leg. I could not probe Windows here. npm documents the env override on every platform, but if Windows CI disagrees, both new checks fail there. They would fail on the module path, not on the product behavior.

Side note, outside this lane: a context line in the setup README on main (around line 384, seen in win-path-commands' diff) holds a machine path with the owner's home folder. The repo is public.
