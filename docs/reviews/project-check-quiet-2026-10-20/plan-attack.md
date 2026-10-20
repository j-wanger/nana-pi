# project-check-quiet — plan attack (one adversary)

Verdict: AMEND

AMEND, with one real gap and three small fixes. The core is sound: it is a one-line fix that reuses doctor's sealed mute, R-2050 is red today and R-2051 guards against over-muting. All probes ran in a temp clone of main 6f07daee with a temp home on Node 22.22.2. The real repository was not touched.

What the probes confirmed:
- `project --check` prints the MODULE_TYPELESS_PACKAGE_JSON warning for the pack's config.ts. It does so in a folder with project config, in a folder without it, and in a bare folder.
- The seeding run is quiet. The trust command is quiet.
- With the plan's two checks added, R-2050 FAILs and R-2051 PASSes today. Both pass with the fix.
- M2 to M5 each turn red only the named checks. Mute-after-await stays quiet, as the plan said.
- I overlaid win-config-json-path's config.ts, json-text.mjs and objective.ts on the unfixed CLI. R-2050 stays red without the fix and green with it, so that inference is now probed.
- The main CI Windows suite leg (run 39378673567, Node 22.23.3) prints the same coded warning for pack .ts modules.
- The full change passes everything checked: requirements trace (0 rows off form), requirements-tree test, map:check (0 problems) and readme:check (0 problems). doctor-quiet, project (123 pass), entry-guidance and relative-agent-dir all pass.
- Running project.test.mjs under a temp HOME needs the real npm prefix, because HOME moves npm's global root on this machine. That is a probe artifact, not a defect.

Amendment 1, the gap: a without-config row, R-2052.
- checkProject imports config.ts on every run, so the warning does not depend on project config. The plan's Problem text implies it does.
- Node delivers the warning only after the check's async chain finishes. A mute installed anywhere before the event loop yields still silences it.
- I probed two wrong placements, and the plan's with-config check stayed green under both:
  - M6: the mute runs only when `.pi/nana-pack.json` exists.
  - M7: a MODULE_TYPELESS-only listener on the trust branch in lib/project.mjs, installed after config.ts had already loaded.
- Only a without-config check turns red under them.
- This is a real user path. A folder whose config was omitted on purpose has no `.pi/nana-pack.json`, and neither does a folder checked before seeding. It also mirrors doctor's R-1750 and R-1751 pair.

Amendment 2: the brief left the CLI's module header false. Its @outputs says "doctor's stderr carries no muted warning" and its @effects says "replaces the warning listeners for doctor". Both must name project --check, which changes the code-map entry too (probed).

Amendment 3: the M5 text had the typo "ExperentialWarning". It is fixed.

Amendment 4: the brief now names the builder. This is a simple lane, so a Claude Sonnet subagent builds it.

Class: ordinary is right. The lane calls doctor's mute but does not change it. It edits only a comment and the header in the CLI, and touches no hook, extension, gate or land or review tool. The AGENTS rule still applies: the seat runs install-check on macOS before nana-land.

Conflicts: none of the in-flight worktrees touches bin/nana-setup.mjs or doctor-quiet.test.mjs; I checked their diffs. In REQUIREMENTS.md the new rows go in after R-1670, several unchanged lines away from every other lane's hunk. The requirements tree and code map need regenerating after merges. The README Tests-table edit is a different line from the other lanes' inserts. I could not read the five slate lanes' plans. I infer they share only the ledger and generated files.

The claim most likely wrong: that R-2050 and R-2052 behave the same on Windows. In particular, that `--check` emits no other Node warning there, since the rows assert zero warning lines. The CI evidence is indirect, and the lane tip's Windows leg is the first real run.
