# review-texts-durable · must-meet of record (seat, 2026-10-25)

Feature: FEAT-017 · Inspect durable state and follow restoration steps

Written by the seat from the planner's draft (`plan-draft.md`, this folder) and one adversary pass (`plan-attack.md`, this folder; 0 MUST, 4 SHOULD, 8 NOTE). The seat took all four SHOULDs: S1 as the ordinary class with the local install check kept, and S4's home and count-only rules applied to the seat's own verify step and to the brief's demo, since an ordinary lane has no independent check. It took every NOTE: N5 narrows R-2870 to its tuple, N6 and N7 become known limits, N8 and N9 go into the build brief, N10 is the page effect line below, N11 is the seat's known-bug edit at notes time, and N12 keeps the R-955 split. Plans get no review round. Where this file and the draft or the attack differ, this file holds.

The owner's decision, 2026-10-25: "Build the four (Recommended)". The owner lifted the 2026-10-24 pause for four page-free lanes from the artifact assessment: artifact-readers, adoption-window, knowledge-freeze-notice and review-texts-durable. The page stays frozen until the owner's readability discussion. This lane is the assessment's A-008 gap: the kept review texts that every land reads are missing from the durable-state list.

Spend line: the current priority (since 2026-10-23): every artifact made by an existing run and read by code. Every review makes a kept review text, and nana-land reads it before it lands. This lane keeps that tie alive across the documented backup and restore.

Stakes: low blast, reversible. One manifest row, one README cell, two test files and four requirement rows change. Uninstall cannot remove a folder under any row tuple (`packages/nana-setup/lib/uninstall.mjs:112-147`). The real risk is a backup that silently leaves the texts out, which R-2872 pins.

Main is 61671be0 (impact-artifacts landed). Every file:line below was re-opened there; none of the cited code moved since the draft's d3cf9a0d.

## What was measured (read-only, from the draft and the attack, main d3cf9a0d)

- The store is `~/.pi/agent/review-ledger.texts/`: 72 texts, 166,447 bytes, all `<sha256>.md` at mode 0600, no temporary file. The tally has 72 rows that carry a `text` reference, 66 of them LAND, and all 72 texts are present.
- The real-home `state --paths` exits 0 today; its listing holds the tally and the audit and no kept text.
- `ledgerPaths` (`packages/nana-pack/bin/review-round.mjs:102-114`) returns `dir`, `tally`, `audit`, `rotated`, `lock`, `resDir` and `texts`. The manifest (`packages/nana-setup/lib/state-manifest.mjs:45-48`, `:72-73`) has rows for all but `dir` and `texts`.
- R-955 claims the ledger rows "exactly equal `ledgerPaths(home)`", but its second test (`packages/nana-setup/tests/state-manifest.test.mjs:40-42`) compares against five hand-typed keys, so it passes without `texts`. The row reads `implemented` while false.
- nana-land checks each LAND row's kept text through `reviewTextEvidence` (`packages/nana-pack/bin/nana-land.mjs:130`) and refuses when none is intact (`:138`).
- Callers of the manifest: `nana-setup.mjs` (the `state` command), `uninstall.mjs`, and three tests (`state-manifest`, `restore`, `uninstall`). Doctor and the install check list no durable state.

## Threat model

In scope, honest variation in our tools' output, files and environment:
- the store absent (no review yet on this machine), empty, or holding many texts;
- pi home moved by `--pi-home` or `PI_CODING_AGENT_DIR`, or Claude home moved, while the ledger stays at `<home>/.pi/agent` by design (`review-round.mjs:103`);
- a future path added to `ledgerPaths`;
- a Windows runner, where the restore test runs under GNU tar with 8.3 temp paths;
- the R-957 refusals for custom roots, which must name the same pair with one more durable folder.

Out: deliberate forgery, such as a hand-edited text or tally row, or a store swapped for a symlink to defeat the walk. A finding outside this model is a residual. An in-flight temporary text during a backup is a known limit, not an in-scope case.

## Seat decisions

- **One durable row.** Add `review ledger texts` after the three durable ledger rows (`state-manifest.mjs:46-48`): built from `ledger.texts`, owner `nana-pack`, kind `dir`, the default restore text, source `modules.pack`. Why: nana-land needs these texts; a restored tally without them names LAND rows nana-land then refuses.
- **Explicit ledger rows (adversary S2).** Each ledger row stays its own explicit `durable(...)` or `disp(...)` call naming its `ledger.<key>`. The manifest never iterates `ledgerPaths` and never defaults a class. Why: a loop with a default class meets R-2870 and R-2871, and a future ledger path then becomes durable with nobody classifying it.
- **Split R-955; the ledger check reads `ledgerPaths` (adversary N12 keeps it).** R-955 keeps its layout clause and its first test. Its ledger clause and its second test move to new row R-2871, whose test reads every `ledgerPaths(home)` key except a declared `dir` container, as the layout check at `state-manifest.test.mjs:36-39` reads `resolveLayout`. Why: the old test hid the gap; a future ledger path now fails until someone classifies it. The split records the fix as a new row going from `untested` to `implemented`, rather than an `implemented` row whose test changed under it.
- **R-955's new wording:** "Every path-valued layout key except declared containers shall map to a manifest row." Its evidence keeps only `every resolved layout path except declared containers is inventoried`.
- **One list.** The manifest stays the one code list of durable state. `state`, `state --paths` and uninstall already derive from it; the restore test's absence check (`restore.test.mjs:146`) does too. Doctor and the install check need no change.
- **README, no row** (precedent: land-records' README sentence). The state table's ledger cell in `packages/nana-setup/README.md:106` becomes "Review-ledger tally, audit and rotated files, and kept review texts". It names the store in words, not by path, so the readme check needs no exemption. Written, not pinned.
- **The restore test stays independent.** R-958's fixture lists stay as they are. R-2872 writes its own text through `reviewTextPath`, never through the manifest row, so a wrongly placed row cannot pass by finding its own fixture.
- **No uninstall row (subtraction).** Uninstall removes only nana-setup-owned link, seed, generated, plist and settings rows (`uninstall.mjs:22`), and none of its branches removes a folder (`:112-147`).
- **No temp-file filter (subtraction).** `state --paths` keeps listing every regular file in the store; a backup during a review is a known limit.
- **Known-bug line (adversary N11): the seat's, at notes time.** The seat replaces the first line of `docs/known-bugs/FEAT-017.md` with "State manifest (artifact audit, 2026-10-24): the list labels the handoff store as pi-owned and disposable." The builder does not touch it. The handoff-store sentence stays because the owner froze the handoff store until he rules.
- **HANDOFF is the seat's (adversary N10).** The seat writes this lane's HANDOFF and session lines at notes time, before the final round. That includes HANDOFF's pause lines, which the owner's 2026-10-25 pick answers. The builder does not touch HANDOFF.
- **Not this lane:**
  - FEAT-008's missing `Reads: A-008` line for nana-land belongs to the artifact-readers lane, which edits the registry lines.
  - No FEAT-017 `Reads: A-008` line: the listing reads file names, never the texts.
  - The handoff store's class, the desk stage-keys source label and an archive-age row (A-018) stay out.
- **Existing tests stay unchanged** except R-955's second test, which R-2871's test replaces. The builder confirms R-956's row parity, R-957's refusals, R-958's restore checks and the uninstall tests pass with the new row. The attack traced each R-957 case through `runState` (`packages/nana-setup/bin/nana-setup.mjs:252-317`): each still names the same pair or store.

## Must-meet rows (FEAT-017)

- **R-2870.** WHEN `stateRows` resolves a home's default layout, the state manifest row at `ledgerPaths(home).texts` shall be named `review ledger texts` and carry class `durable`, owner `nana-pack`, kind `dir`, and the review ledger tally row's source and restoration text.
  - Test (`packages/nana-setup/tests/state-manifest.test.mjs`): `R-2870: the kept review text store's manifest row is a durable nana-pack folder with the tally row's source and restore text`.
  - Case: the sample layout (`state-manifest.test.mjs:23`). The row is found by its path; the class compares with `STATE_CLASSES.DURABLE`; the source and restore text are read from the tally row, never typed.
  - Red: no row at that path; a different store name; class `disposable`, `rebuildable`, `re-ratified` or `secret`; kind `file`; owner `nana-setup` with an installer kind, which would put the store in uninstall's row set; a source or restore text that differs from the tally row's, such as the `user-created store` source a row gets when its `undefined, modules.pack` arguments are dropped.
- **R-2871.** WHEN `stateRows` resolves a layout, with pi home and Claude home at their defaults or elsewhere, the state manifest shall hold exactly one row for each path `ledgerPaths(home)` returns other than its `dir` container, and no row named `review ledger …` at any other path.
  - Test (`packages/nana-setup/tests/state-manifest.test.mjs`): `R-2871: the manifest holds exactly one row for each path the review ledger names, read from ledgerPaths, wherever pi home is`.
  - Cases: the sample layout; `resolveLayout({ home, piHome, claudeHome })` with both homes outside `<home>/.pi/agent`. The expected paths are `Object.entries(ledgerPaths(home))` minus a declared container list holding only `dir`.
  - Red: the expected keys typed by hand, so an extra key in `ledgerPaths` stays green; `dir` required as a row; one ledger path with two rows, such as two texts rows; a `review ledger` row at `dir` or at any path `ledgerPaths` does not return; ledger rows joined from pi home (red in the custom-roots case).
  - Not visible to this check: ledger rows built by iterating `ledgerPaths` with a default class. The seat decision forbids it; against such a manifest the seat's pair 1 stays green, and the seat sends the build back.
- **R-2872.** WHEN a home's kept review text store holds a text, the documented backup and restore shall carry that text to the restored home: `state --paths` lists it, the restored copy is byte-equal, and `reviewTextEvidence` there reports it `intact`.
  - Test (`packages/nana-setup/tests/restore.test.mjs`): `R-2872: a kept review text survives the documented backup and restore and reads as intact to nana-land's evidence check`.
  - Fixture: text bytes from one plain string with no escape sequence, no `secret:` marker and no home path. The test hashes them with the imported `REVIEW_TEXT_HASH` and writes them at `reviewTextPath(home, { sha256 })`, mode 0600, after the fixture loop (`restore.test.mjs:83-87`) and before the listing (`:114`). It first confirms the source evidence is `intact`. It compares the listed name in forward-slash form, as `:137` does. After extraction it compares bytes and calls `reviewTextEvidence(destination, ref)`.
  - Red: no texts row; the row in any class other than `durable`; a row whose path does not hold the store, such as one under Claude home; a `state --paths` filter that drops the store.

Three rows, R-2870 to R-2872, each `untested` then `implemented`; R-2873 to R-2877 stay free. Each row has one `shall`. R-955 changes wording and loses its second test, as the seat decisions say.

Seal: none. The lane adds no tunable. The store name stays `REVIEW_TEXT_STORE_NAME`, already pinned by R-2568's test (`packages/nana-pack/tests/review-ledger.test.mjs:484-486`). The row reads `ledger.texts`, never a literal.

## Precedent

- The row: `packages/nana-setup/lib/state-manifest.mjs:45-48`, where `ledger = ledgerPaths(layout.base)` feeds three explicit `durable(..., undefined, modules.pack)` rows; `durable()` takes the restore text fifth and the source sixth (`:35`).
- R-2870's tuple check: `packages/nana-setup/tests/state-manifest.test.mjs:28` (the `tuple` helper) and the exact tuple pins at `:30` and `:34` under R-954.
- R-2871's derivation: `state-manifest.test.mjs:36-39`, which reads `Object.entries(layout)` minus a declared container list. It replaces `:40-42`.
- The custom-roots layout: `resolveLayout` options `home`, `piHome`, `claudeHome` (`packages/nana-setup/lib/paths.mjs:47-60`); the CLI form at `state-manifest.test.mjs:112`.
- R-2872's flow: `packages/nana-setup/tests/restore.test.mjs:78-82` (ledger fixtures before the listing), `:114-119` (listing and archive), `:137` (forward-slash names), `:152` (extraction), `:172-178` (byte-equal loop).
- R-2872's evidence: `reviewTextPath` and `reviewTextEvidence` (`packages/nana-pack/bin/review-round.mjs:407-427`), the same call nana-land makes at `packages/nana-pack/bin/nana-land.mjs:130`; `REVIEW_TEXT_HASH` (`review-round.mjs:83`). Import path from a nana-setup test: `state-manifest.test.mjs:17`; named-import style: `packages/nana-pack/tests/land.test.mjs:20`.
- The README cell: `packages/nana-setup/README.md:106`.

No private helper moves. Every name the tests need is already exported from `review-round.mjs`; `reviewTextRef` stays private, and R-2872 hashes with the exported `REVIEW_TEXT_HASH`.

## Class and builder

- **Class: ordinary (adversary S1).** Uninstall cannot remove a folder under any row tuple (`uninstall.mjs:112-147`). The lane changes the state listing, not install, uninstall or doctor behaviour.
- **Ladder:** one roster reviewer, the final reviewer. No land reviewer and no independent check. The local macOS install check (`node packages/nana-setup/bin/install-check.mjs`) runs before the land under the 2026-10-12 ruling, because the lane touches `packages/nana-setup/`.
- **Size: small.** The roster's builder runs it through `pi-worker --lane-size small`, in one session.
- **Windows:** the restore test runs on the Windows leg. The seat pushes the draft pull request at build 1 and reads that leg before the review brief.
- **The seat's verify step:** wrong-code pairs 1, 6 and 7, and the real-home count. Expected results for every pair (the builder's hand checks cover 2 to 5 through the rows' red cases):
  1. add an extra key to the object at `review-round.mjs:105-113`, such as `extra: join(dir, 'review-ledger.extra')`: R-2871 red, R-2870 and R-2872 green;
  2. make the texts row `disposable`: R-2870 and R-2872 red, R-2871 green;
  3. join the row from `layout.piHome`: R-2871 red in its custom-roots case, R-2870 and R-2872 green;
  4. make it owner `nana-setup`, kind `generated`: R-2870 red, R-2871 and R-2872 green;
  5. delete the row: all three red;
  6. in `runState`'s listing loop (`nana-setup.mjs:296`), add `if (row.store === "review ledger texts") continue;`: R-2872 red, R-2870 and R-2871 green;
  7. drop the `undefined, modules.pack` arguments from the new row: R-2870 red, R-2871 and R-2872 green.
- **Home and count-only rules (adversary S4).** Any verify or demo step that writes, such as a scratch backup or restore, runs with HOME set to a scratch home and with `PI_CODING_AGENT_DIR` and `CLAUDE_CONFIG_DIR` unset or pointed inside it; the README lines then run with `~` meaning that scratch home. The real-home count runs the worktree's `nana-setup state --paths` with both variables unset; it writes nothing (R-956). It counts the listed lines under `.pi/agent/review-ledger.texts/` and the `*.md` files in the store, and the seat records only those two numbers, never the listing.
- **requirements-moved:** the review brief and the land carry the output of `node scripts/requirements-moved.mjs --root . --base main`, which will show R-955.

## Known limits (the seat writes them before the final round)

- A backup taken while a review completes can make tar exit non-zero on a vanished temporary text; re-run it (inferred, not run). `state --paths` itself survives the race (`nana-setup.mjs:245`). A temporary file stranded by a killed writer is archived and restored harmlessly.
- tar does not copy the tally and the texts at one instant. A review that completes between the listing and tar's read of the tally leaves one LAND row without its text after a restore. The tally sorts before the texts, so the window ends at that read (inferred).
- The `ledgerPaths` check sees only paths that function returns; the seat's one-off legacy copy beside the ledger stays unlisted.
- Only the seat's pair 1 catches a manifest that iterates `ledgerPaths`; R-2871's check cannot see it.
- The README's state table is hand-kept prose; no test ties it to the manifest.
- The store has no cap, so the archive grows with it, about 2 MB a month at today's pace (inferred from three days).
- Build and land records live in each clone's git folder, outside the archive, like unpushed commits.
- Review texts can quote whatever a reviewed change held; the archive is unencrypted private data, as the README already says.
- `state --paths` skips a symlinked store, or any store below a symlinked folder such as a linked `~/.pi`, with no message (`nana-setup.mjs:223-233`). This already drops the tally and the audit today; the lane widens it to the texts.

## Page effect

The lane adds no page or desk code. As data, the page shows FEAT-017 with nine rows instead of six (three more `implemented`) and R-955's narrowed wording with one evidence test. The edited known-bug line does not reach the page, which reads no known-bug file (inferred from a grep of the page code).

## Overlap

Three sibling lanes build beside this one: artifact-readers, adoption-window and knowledge-freeze-notice. artifact-readers adds an A-018 reader declaration inside FEAT-017's span, and knowledge-freeze-notice edits the setup README's knowledge row (`packages/nana-setup/README.md:58`). Whichever lands second, and each lane after it, merges main and regenerates `docs/requirements-tree.md` (`npm run req:tree`) and `docs/code-map.md` (`npm run map`) instead of hand-merging them.
