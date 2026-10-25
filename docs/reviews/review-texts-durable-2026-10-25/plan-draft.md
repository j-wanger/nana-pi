# review-texts-durable · plan draft (planner, 2026-10-25)

Feature: FEAT-017 · Inspect durable state and follow restoration steps

Source of the decision: the owner's pick on 2026-10-25, "Build the four", after the artifact consumer assessment. This lane is the assessment's candidate lane 6 and closes its A-008 gap (`<scratch>/assess/out/report.md`, section 3b; `assessed.json`, batch CAP-02, entry A-008).

Spend line: the current priority (since 2026-10-23): every artifact made by an existing run and read by code. Every review makes the kept review texts, and nana-land reads them. This lane keeps that tie alive across the documented restore.

Stakes: low blast, reversible. One inventory row and three tests change. A wrong row could let uninstall delete the texts; R-2870 pins the owner and kind that prevent it.

## What was measured (read-only, 2026-10-25, main d3cf9a0d)

- The store is `~/.pi/agent/review-ledger.texts/`. It holds 72 files, 166,447 bytes (304 KiB on disk), all `<sha256>.md` at mode 0600, dated 2026-10-22 to 2026-10-25. No temporary file was present.
- At about 66 KB a day, it grows about 2 MB a month (inferred from three days).
- Beside it: the tally (553,649 bytes) and the audit log (751,698 bytes). No rotated file exists yet.
- Beside it also sits `review-ledger.legacy-2026-10-22/`, a seat's one-off hand copy. No code reads it and `ledgerPaths` does not name it.
- `ledgerPaths` (`packages/nana-pack/bin/review-round.mjs:102-114`) returns `dir`, `tally`, `audit`, `rotated`, `lock`, `resDir` and `texts`. The manifest (`packages/nana-setup/lib/state-manifest.mjs:45-48`, `:72-73`) has rows for all but `dir` and `texts`.
- The manifest test (`packages/nana-setup/tests/state-manifest.test.mjs:40-42`) compares against five hand-typed keys, so it passes without `texts`.
- R-955 already claims the ledger rows "exactly equal `ledgerPaths(home)`". Its test is narrower than its claim, so the row reads `implemented` while false.
- nana-land checks each LAND row's kept text through `reviewTextEvidence` (`packages/nana-pack/bin/nana-land.mjs:130`). It refuses when none is intact (`:138`). The assessment's `:125` and `:133` have moved to these lines.
- Callers of the manifest (`npm run -s map:impact`): `nana-setup.mjs` (the `state` command), `uninstall.mjs` and three tests. Doctor and the install check list no durable state; a grep of both for ledger and state lists found none.

## Threat model

In scope, honest variation in our tools' output, files and environment:
- the store absent (no review yet on this machine), empty, or holding many texts;
- pi home moved by `--pi-home` or `PI_CODING_AGENT_DIR`, or Claude home moved, while the ledger stays at `<home>/.pi/agent` by design (`review-round.mjs:103`);
- a future path added to `ledgerPaths`;
- a Windows runner, where the restore test runs under GNU tar with 8.3 temp paths;
- an in-flight temporary text (`.<sha>.<pid>.<hex>.tmp`) inside the store during a backup;
- the R-957 refusals for custom roots, which must name the same pair with one more durable folder.

Out: deliberate forgery, such as a hand-edited text or tally row, or a store swapped for a symlink to defeat the walk. A finding outside this model is a residual.

## Seat decisions

- **One durable row.** Add `review ledger texts` after the three durable ledger rows (`state-manifest.mjs:46-48`). It is built from `ledger.texts`, owner `nana-pack`, kind `dir`, source `modules.pack`, with the default restore text. Why: nana-land needs these texts; a restored tally without them names LAND rows nana-land then refuses.
- **Split R-955; the ledger check reads `ledgerPaths`.** R-955 keeps its layout clause and its first test. Its ledger clause and its second test move to new row R-2871. R-2871's test reads every `ledgerPaths(home)` key except a declared `dir` container, as the layout check at `:36-39` reads `resolveLayout`. Why: the old test hid the gap; a future ledger path now fails until someone classifies it.
- **R-955's new wording:** "Every path-valued layout key except declared containers shall map to a manifest row." Its evidence keeps only `every resolved layout path except declared containers is inventoried`.
- **One list.** The manifest stays the one code list of durable state. `state`, `state --paths` and uninstall already derive from it; the restore test's absence check does too. Doctor and the install check need no change.
- **README, no row** (precedent: land-records' README sentence). The state table's ledger row in `packages/nana-setup/README.md:106` becomes "Review-ledger tally, audit and rotated files, and kept review texts". It names the store in words, not by path, so the readme check needs no exemption.
- **The restore test stays independent.** R-958's fixture lists stay as they are. R-2872 writes its own text through `reviewTextPath`, never through the manifest row, so a wrongly placed row cannot pass by finding its own fixture.
- **No uninstall row (subtraction).** Uninstall removes only nana-setup-owned link, seed, generated, plist and settings rows (`uninstall.mjs:22`). R-2870's owner and kind pin keeps the texts out of that set.
- **No temp-file filter (subtraction).** `state --paths` keeps listing every regular file in the store; a backup during a review is a known limit.
- **Known-bug line.** FEAT-017's first known-bug line loses its first sentence, which this lane fixes. Its handoff-store sentence stays, because the owner froze the handoff store until he rules.
- **Not this lane:**
  - FEAT-008's missing `Reads: A-008` line for nana-land belongs to the artifact-readers lane, which edits the registry lines.
  - No FEAT-017 `Reads: A-008` line: the listing reads file names, never the texts.
  - The handoff store's class, the desk stage-keys source label and an archive-age row (A-018) stay out.
- **Existing tests stay unchanged** except R-955's second test, which R-2871's test replaces. The builder confirms R-956's row parity, R-957's refusals and R-958's restore checks pass with the new row. Reading `runState` (`packages/nana-setup/bin/nana-setup.mjs:252-317`) shows each R-957 case still names the same pair.

## Must-meet rows (FEAT-017)

- **R-2870.** WHEN `stateRows` resolves a layout, with pi home and Claude home at their defaults or elsewhere, the state manifest shall hold one `review ledger texts` row at `ledgerPaths(home).texts` whose class is `durable`, owner `nana-pack`, kind `dir`, source the review ledger module, and restoration from the private state archive.
  - Test (`packages/nana-setup/tests/state-manifest.test.mjs`): `R-2870: the manifest lists the kept review text store as one durable nana-pack folder restored from the archive, wherever pi home is`.
  - Cases: the sample layout; `resolveLayout({ home, piHome, claudeHome })` with both homes outside `<home>/.pi/agent`.
  - Red: no row; class `disposable`, `rebuildable`, `re-ratified` or `secret`; kind `file`; owner `nana-setup` with an installer kind, which uninstall would delete; a path joined from pi home; a source or restore text that differs from the other durable ledger rows; two texts rows.
- **R-2871.** WHEN `stateRows` resolves a layout, with pi home and Claude home at their defaults or elsewhere, the state manifest shall hold exactly one row for each path `ledgerPaths(home)` returns other than its `dir` container, and no row named `review ledger …` at any other path.
  - Test (`packages/nana-setup/tests/state-manifest.test.mjs`): `R-2871: the manifest holds exactly one row for each path the review ledger names, read from ledgerPaths, wherever pi home is`.
  - Cases: the same two layouts as R-2870.
  - Red: the expected keys typed by hand (the seat's pair adds a path to `ledgerPaths` and the test must fail); `dir` required as a row; one ledger path with two rows; a `review ledger` row at `dir` or any path `ledgerPaths` does not return; ledger rows keyed to pi home.
- **R-2872.** WHEN the documented backup and restore run on a home whose kept review text store holds a text, `state --paths` shall list that text and the restored home shall hold it byte-equal, so `reviewTextEvidence` there reports it `intact`.
  - Test (`packages/nana-setup/tests/restore.test.mjs`): `R-2872: a kept review text survives the documented backup and restore and reads as intact to nana-land's evidence check`.
  - Fixture: text bytes with no `secret:` marker and no home path. The test hashes them with the imported `REVIEW_TEXT_HASH`. It writes them at `reviewTextPath(home, { sha256 })`, mode 0600, before the listing. It first confirms the source evidence is `intact`.
  - Red: no texts row; the row in any class other than `durable`; a row whose path does not hold the store, such as one under Claude home; a `state --paths` filter that drops the store.

Three rows, R-2870 to R-2872, each `untested` then `implemented`; R-2873 to R-2877 stay free. R-955 changes wording and loses one test, as the seat decisions say.

Seal: none. The lane adds no tunable. The store name stays `REVIEW_TEXT_STORE_NAME`, already pinned by R-2568's test (`packages/nana-pack/tests/review-ledger.test.mjs:484-486`). The row reads `ledger.texts`, never a literal.

## Precedent

- The row: `packages/nana-setup/lib/state-manifest.mjs:45-48`, where `ledger = ledgerPaths(layout.base)` feeds three `durable(..., modules.pack)` rows.
- R-2870's tuple check: `state-manifest.test.mjs:28` (the `tuple` helper) and the exact tuple pins at `:30` and `:34` under R-954.
- R-2871's derivation: `state-manifest.test.mjs:36-39`, which reads `Object.entries(layout)` minus a declared container list. It replaces `:40-42`.
- The custom-roots layout: `resolveLayout` options `home`, `piHome`, `claudeHome` (`packages/nana-setup/lib/paths.mjs:47-60`); the CLI form at `state-manifest.test.mjs:112`.
- R-2872's flow: `packages/nana-setup/tests/restore.test.mjs:78-82` (ledger fixtures before the listing), `:114-119` (listing and archive), `:152` (extraction), `:172-178` (byte-equal loop).
- R-2872's evidence: `reviewTextEvidence` and `reviewTextPath` (`review-round.mjs:407-427`), the same call nana-land makes at `nana-land.mjs:130`; `REVIEW_TEXT_HASH` (`review-round.mjs:83`). Import style: `packages/nana-pack/tests/land.test.mjs:20`.
- The README row: `packages/nana-setup/README.md:106`.

No private helper moves. Every name the tests need is already exported from `review-round.mjs`, and `state-manifest.mjs` already imports `ledgerPaths` from there.

## Class and builder

- **Class: install lane.** `uninstall.mjs` reads the manifest to choose what it removes, and the lane touches `packages/nana-setup/`.
- **Ladder:** the final reviewer, the land reviewer, the seat's wrong-code pairs, one independent check, and the local macOS install check before the land (2026-10-12 ruling). The mutation runner re-runs after any seat change.
- **Size: small.** The roster's builder runs it through `pi-worker --lane-size small`, in one session.
- **Windows:** the restore test runs on the Windows leg. Push the draft pull request at build 1 and read that leg before the review briefs.
- **Wrong-code pairs for the seat:**
  1. add a path to `ledgerPaths` (R-2871 red);
  2. make the texts row `disposable` (R-2870 and R-2872 red);
  3. join the row from `layout.piHome` (R-2870 and R-2871 red);
  4. make it owner `nana-setup`, kind `generated` (R-2870 red);
  5. delete the row (all three red).
- **Independent check:**
  - In a scratch home, make one kept text through the real writer, with `admit` and `complete` as `land.test.mjs` does.
  - Follow the README backup and restore into a second clean scratch home, then call `reviewTextEvidence` there.
  - Run the worktree's `nana-setup state --paths` on the real home, which writes nothing (R-956). Count the listed texts against the store.

## Known limits

- A backup taken while a review completes may list a temporary text that is gone by the time tar reads it (inferred, not run).
- tar does not copy the tally and the texts at one instant. A review that completes in between leaves one LAND row without its text after a restore (inferred).
- The `ledgerPaths` check sees only paths that function returns; the seat's one-off legacy copy beside the ledger stays unlisted.
- The README's state table is hand-kept prose; no test ties it to the manifest.
- The store has no cap, so the archive grows with it, about 2 MB a month at today's pace (inferred).
- Build and land records live in each clone's git folder, outside the archive, like unpushed commits.
- Review texts can quote whatever a reviewed change held; the archive is unencrypted private data, as the README already says.
- `state --paths` skips a symlinked store, as it skips every symlinked durable store; the review ledger already refuses one.
