# checkout-spelling-converge — build brief 1

Feature: FEAT-013 · Install and connect harness runtimes (R-2203 and R-2204 under FEAT-018). Class: install, hook or gate. Rows: R-2200 to R-2204 (block R-2200 to R-2209).
Work in ~/nana-pi-wt/checkout-spelling-converge on `feat/checkout-spelling-converge`. Follow `packages/nana-pack/prompts/builder-preamble.md`. Run single test files only, and never edit HANDOFF.md or docs/sessions/. First run the impact command on steps.mjs, settings.mjs and uninstall.mjs.

## Change
1. `packages/nana-setup/lib/steps.mjs` `linkSkill`: enter the `preserveForeignLink` branch only when `current` (the link text resolved against its folder) differs from `path.resolve(source)`. In it, compare `realPath(target, { mustExist: true })` with `realPath(source, { mustExist: true })`. If they differ, or the link dangles, return today's PROBLEM "foreign link at …" unchanged. If they match, fall through to the ordinary relink ("would relink (was …)" on a dry run).
2. `packages/nana-setup/lib/settings.mjs`:
   - Add one private predicate for a respelled knowledge entry. Its tests: the wanted row's marker is the knowledge marker, and the entry has no `args`. `installerKnowledgeTarget` is non-null for both the entry's command and the wanted command, and the two commands differ. `canonical({ ...entry, command: wanted.entry.command })` equals `canonical(wanted.entry)`. The two targets are one file under `realPath(…, { mustExist: true })`, and a throw means false. No separate platform test is needed: the win32 wanted entry has `args`, so the predicate is false there.
   - `removeInstallerHooks`: remove an entry that is exact or respelled.
   - `mergeRepoHooks`: also replace a found "posix"-form entry whose command differs from `w.entry.command` and whose target is the same file as the wanted CLI. The win32 branch and the replaced object's shape do not change.
   - Keep `fs.realpathSync` at the healthy check (~515-516). Add this comment: the JS lookup keeps a typed letter case, drive letter and 8.3 name, so a win32 exec entry written through another spelling reads unhealthy and gets its one-time rewrite; on POSIX the same-file rule does that, a linked spelling included.
3. `packages/nana-setup/lib/uninstall.mjs`: `settingsVariants` reads `previewSettings` (after removal), not `initial.settings`.
4. `scripts/test.mjs` SKIPS: add `"packages/nana-setup/tests/checkout-converge.test.mjs": () => process.platform === "win32" ? "POSIX-only: skill links are copies on win32 and uninstall refuses there" : null`. Without it, the file's all-SKIP run is a runner FAIL on the Windows leg.
5. New `packages/nana-setup/tests/checkout-converge.test.mjs`, with the six-tag header.
   - Fixture: copy the checkout as checkout-spelling.test.mjs does. Spellings: "link" (`fs.symlinkSync(canonical, <fresh temp path>, "dir")`) on every POSIX host, plus "case" when the swapped-case path exists.
   - Child env: fresh temp homes and projects, HOME and USERPROFILE set, PI_CODING_AGENT_DIR and NANA_SETUP_PLATFORM deleted, and `--home`. The per-case timeout is a named constant with a `chosen` comment.
   - Earlier home: install through the on-disk spelling, then rewrite every link text and hook command to the other spelling. FAIL when no skill link or no knowledge entry changed.
   - R-2200: install exits 0 with no ✗ row, and every rewritten link's text names the on-disk spelling again.
   - R-2201: point the four managed skill links at `<other copy>/packages/nana-pack/skills/<name>`, each holding a SKILL.md. Install exits 1, each text is byte-identical, and each name gets a "foreign link" row.
   - R-2202: after install, the knowledge entry's command is exactly the installer's command for the on-disk spelling.
   - R-2203: after `uninstall --yes`, no UserPromptSubmit entry invokes nana-knowledge.ts, and no "settings hook variant" row prints.
   - R-2204: entry A names `<other copy>/packages/nana-knowledge/bin/nana-knowledge.ts`, which exists. Entry B is respelled with `timeout: 7`. After `uninstall --yes` both stay, each with one variant row naming its command.
   - Form: `process.platform !== "win32" ? check("R-22nn: …", () => {…}) : skip("R-22nn — <reason>")`, with `// req: R-22nn` on the line directly above.
6. Setup README:
   - Rewrite the earlier-spelling Known-limits bullet: on macOS and Linux, install converges every link and the knowledge hook, a linked spelling included. Uninstall removes a knowledge entry that differs from install's only in that spelling. On Windows, hook entries written through a junction to the checkout stay.
   - Update the "`uninstall` removes only exact desired hook objects" sentence to match.
   - Add a test-table row that says the runner skips the file on Windows.
   - Name no machine path or owner.
7. REQUIREMENTS.md: add the five rows exactly as given, status `implemented`, with file::title evidence. Put R-2200 and R-2201 under SUB-012 by R-665, R-2202 under SUB-013 by R-1984, and R-2203 and R-2204 under FEAT-018 by R-1985. Then run `npm run req:tree` and `npm run map`.

## Wrong code (each must turn the named check red; revert after)
W1 linkSkill unchanged → R-2200. W2 relink whenever the text differs, with no real-path compare → R-2201. W3 own a link when its text ends in `/packages/nana-pack/skills/<name>` → R-2201. W4 mergeRepoHooks unchanged → R-2202. W5 removeInstallerHooks unchanged → R-2203. W6 remove on same file alone, ignoring other keys → R-2204. W7 remove any installer-form knowledge entry whose target exists → R-2204. W8 settingsVariants reads `initial.settings` → R-2203.

## Done
- R-2200 to R-2204 pass on this Mac, and W1 to W8 each fail as listed.
- These files pass alone: checkout-converge, checkout-spelling, settings-merge, uninstall, retired-artifacts, skills-and-standards, install, stale-copies, win32-hook-repair, and the pack's test-runner.
- `npm run map:check`, `npm run readme:check` and `node scripts/requirements-trace.mjs` are green.

## Report (at most 10 lines)
Verdict, commit sha, diff stat. One PASS/FAIL/SKIP line per test file run. W1 to W8 outcomes. Map, readme and trace checks. Anything changed outside this list, with the reason. Open questions.