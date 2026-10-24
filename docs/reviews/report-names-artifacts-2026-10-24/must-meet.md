# report-names-artifacts · must-meet of record (seat, 2026-10-24)

Feature: FEAT-039 · See the product and its decisions in one report

Written by the seat from the artifact-model plan (`docs/reviews/artifact-registry-2026-10-24/plan-draft.md`, section 4 and the L2 rows of section 6) and its three adversary passes (same folder), plus one adversary pass on this file (`plan-attack.md`, this folder; 4 MUST, 8 SHOULD, 10 NOTE, all taken except where a ruling below says otherwise). Plans get no review round. Where this file and the plan differ, this file holds.

The owner's decision, 2026-10-24: "Page names artifacts (Recommended)", the second of the four artifact lanes. Lane 1 (artifact-registry, FEAT-028) gave every artifact an A-number, a class and a location, and made each deliverable claim name an entry or what it is built from. This lane makes the page show them.

Spend line: the current priority (since 2026-10-23), appetite clause 2: the product report showing each deliverable's age and real reader.

Stakes: low to medium blast, reversible. The page is advisory; the suite's exit code never depends on it (R-2742). A wrong age binding lets a claim show an age it never earned (report-at-land's M2).

Threat model: honest variation in our tools' output and in other projects' ledgers is in scope; deliberate forgery is out.

## What the page shows (seat decisions)

- **One artifact block per deliverable (attack 1).** After a deliverable's claim lines, the page shows:
  - one `artifact A-nnn · <name> · <age>` line for each distinct entry its `Made by:` claims name, in claim order, then ID order within a claim;
  - one `built from A-nnn · <name> · <age>[, …]` line naming each distinct built-from entry not already shown, starting `output only, ` when no claim names an entry (attack 11: a built-from source shows its age);
  - `artifact not written down` when neither exists;
  - an ID with no live entry (unknown or retired) shows `artifact A-nnn · no live entry` and never stops the page (attack 8);
  - a plain-path third part shows `artifact <path> · <age>`, in claim order.
- **Ages move off the claim lines (attack 2).** A claim line shows only `<label>: <text>`. Each age appears once, on its artifact or built-from line.
- **Ages by class.**
  - `tracked`: the last commit that changed a file the location matches: the file itself, any file under the folder, or any file a glob matches with `*` inside one segment (lane 1's glob matcher, imported from `apps/bench/lib/checkers.mjs`). A plain-path third part is never read as a glob. The existing single `git log` walk stays; only the matcher changes (attack 18).
  - `clone store`: the newest record at the tip, through the age table, only when the entry's class is `clone store`, its location is a table key, its run equals that key's run, and its writer list is exactly that key's one writer. Otherwise `age not measured: clone store`.
  - `user-home store`, `other project`, `git ref`, `CI record`: `age not measured: <class>`.
  - No file modification time and no ref date is read anywhere (R-1012: the same commit gives the same page).
- **The age table replaces `MACHINE_LOCAL_ARTIFACTS`, `RUNTIME_MAP_ARTIFACT` and the lane-1 shim (attacks 5, 6, 16).** `scripts/deliverables.mjs` exports the table and one function that returns an entry's table key only when the class, run and writer list match. The table is exactly:
  - `<git common dir>/` + `DATA_SUBPATH` → run `land`, writer `scripts/runtime-measure.mjs`;
  - `<git common dir>/` + `STORE_SUBPATH` → run `suite`, writer `packages/nana-pack/lib/suite-records.mjs`;
  - `<git common dir>/` + `BUILD_RECORDS_SUBPATH` → run `build`, writer `packages/nana-pack/lib/build-records.mjs`.

  `scripts/product-report.mjs` keys its record readers by the table's keys and ages a clone store only through that function. The land page entry (A-045, `LAND_REPORT_SUBPATH`) is not a key, so it never borrows an age. The shim's claim-side writer check (the suite claim's `scripts/test-locked.mjs`) goes; R-2783 is the only claim binding left. A claim with an R-2783 note still shows its entry's age, because the age belongs to the entry (attack 15; a contract note says so).
- **Old store names (attack 3).** In a ledger with no `Artifact:` line, `runtime-map`, `suite-runs` and `build-records` are plain paths like any other: the checker notes them as not tracked at HEAD, and the page shows `artifact <name> · age unknown: not tracked at HEAD`. No template names them.
- **Features with no deliverable (attack 10).** Each live product card lists under `Features with no deliverable:` each active or frozen feature beneath it whose own rows hold none of that card's deliverables, with its live entries' IDs and names or `makes no registered artifact`. Each live constraint card lists each active or frozen feature with its live entries under `Artifacts of this constraint's features:`. Kindless and retired cards show neither list. A ledger with no `Artifact:` line says `no artifact registry` in place of the entries. Neither list is ever a deliverable note.
- **The model carries the text (attack 14).** `buildReport` builds every new line into the model, the way `artifactNote` is built today; `renderInto` reads no module constant, because it ships through `String()`.
- **Registry parsed once (round 1 note on lane 1).** The page and `checkDeliverables` parse the registry once per ledger, not once per capability.
- **Two kinds of missing age (attack 19).** The pack README's Product view paragraph says in one sentence that `age not measured` is by design and `age unknown` is a failure.

## Must-meet rows (FEAT-039; test file product-report.test.mjs unless noted)

- **R-2790.** WHEN a product card lists a deliverable, the report shall show, after its claims, one `artifact A-nnn · <name> · <age>` line for each distinct entry its `Made by:` claims name, in claim order and then ID order; one `built from A-nnn · <name> · <age>[, …]` line naming each distinct built-from entry not already shown, starting `output only, ` when no claim names an entry; `artifact not written down` when neither exists; `artifact A-nnn · no live entry` for an ID with no live entry; and `artifact <path> · <age>` for a plain-path third part. Test: `R-2790: each deliverable shows its named artifacts with their ages, what its output is built from, or that no artifact is written down`. Red cases:
  - `no artifact named` stays;
  - a built-from claim shows as an artifact;
  - a two-entry claim shows one line;
  - a claim naming the same built-from ID as another claim lists it twice;
  - a deliverable that names an entry and is also built from others shows no built-from line;
  - a claim naming a tracked entry and a home entry shows the tracked age on both lines;
  - a claim naming A-999 stops the page.
- **R-2791.** WHEN a named entry's class is user-home store, other project, git ref or CI record, or it is a clone store at no table key or under another run or writer, the report shall show `age not measured: <class>`; and its page shall be byte for byte the same whatever the home stores, the clone stores outside the tip, the land page and the refs hold. Test: `R-2791: an unageable entry shows age not measured with its class, and the page is the same whatever the stores and refs hold`. The fixture registers:
  - one entry of each unageable class;
  - the land page entry;
  - an entry at the suite location with run `land` and writer `scripts/product-report.mjs`, beside a readable suite record.

  HOME, USERPROFILE, PI_CODING_AGENT_DIR and CLAUDE_CONFIG_DIR point inside a temporary folder, and the store files there have their times set to 2001-01-01. Before the second run:
  - the store files are rewritten with times set to 2020-01-01;
  - the land page is rewritten;
  - a tag is added on an older commit.

  The two pages are byte for byte equal. The land page entry and the mismatched entry show `age not measured: clone store` and no `newest record at tip`. The test restores the environment in a finally block. Red cases:
  - a home entry shows a file time;
  - the mismatched suite entry shows the suite age;
  - the land page entry shows an age;
  - a reader of tag dates changes the page.
- **R-2792.** WHEN a named entry is tracked, the report shall age it by the last commit that changed a file its location matches: the file itself, any file under the folder, or any file the glob matches with `*` inside one segment; and it shall never read a plain-path third part as a glob. Test: `R-2792: a tracked entry shows the age of the last commit that changed a file it matches`. Red cases:
  - a single-file tracked entry shows `age not measured`;
  - a glob entry shows `age unknown: not tracked at HEAD`;
  - `docs/reviews/*/x.txt` ages from `docs/reviews/a/b/x.txt`;
  - a plain `docs/*.md` in a ledger with no registry shows an age.
- **R-2793.** The checker shall note a clone-store entry at an age-table location unless its run equals that table entry's run and its writer list is exactly that entry's one writer; each table key shall equal `<git common dir>/` plus its imported subpath constant; the page's reader keys shall equal the table's keys; and in this repository's ledger, A-006, A-032 and A-033 shall each sit at a table key under that key's run and writer. Test (requirements-deliverables.test.mjs): `R-2793: a clone-store entry is bound to the age table's run and writer, and the table keys come from the store constants`. Red cases:
  - an entry at the suite-records location with run `land` and writer `scripts/product-report.mjs` gets no note;
  - a key typed by hand survives the seat's pair that changes `STORE_SUBPATH`;
  - A-033 moved to `<git common dir>/nana/suite-run` fails nothing;
  - a reader keyed at a location the table lacks passes.
- **R-2794.** Each live product card shall list under `Features with no deliverable:` each active or frozen feature beneath it whose own rows hold none of that card's deliverables, with its live entries' IDs and names or `makes no registered artifact`; each live constraint card shall list each active or frozen feature with its live entries under `Artifacts of this constraint's features:`; kindless and retired cards show neither list; a ledger with no `Artifact:` line says `no artifact registry` in place of the entries; neither list is ever a deliverable note. Test: `R-2794: each capability card lists its features with no deliverable and their artifacts, never as a deliverable note`. Red cases:
  - a frozen feature is missing;
  - the list prints a `deliverable note:` line;
  - a feature that is home to a deliverable is listed;
  - a retired entry is listed.

## Rows, tests and docs that change

- **Rows.**
  - R-2743 retires, superseded by R-2793; its Evidence says so.
  - R-2544, R-2545, R-2744 and R-2745 say "on its artifact line" in place of "beside it", and name the registered store at its location in place of the old store names. R-2544 keeps its plain-path meaning; R-2792 covers tracked entries.
  - R-2542's text names `artifact not written down` in place of `no artifact named`.
- **Existing tests (attack 2, attack 3, checker S10).**
  - The four age tests (R-2544, R-2545, R-2744, R-2745) read artifact lines through one helper that replaces `renderedClaims` for ages; their fixtures stop using the old names.
  - R-2542's `NO_ARTIFACT_NAMED` pin follows its new text.
  - The R-2537 test's `RUNTIME_MAP_ARTIFACT` import and pin go.
  - The R-2743 test retires.
  - R-2536's test moves `runtime-map` from its passing paths to its missing paths. R-2783's test drops or rewrites its shim cases and its `claim.artifact` check. Both are FEAT-028 tests; their row text stays.
  - R-2538's copied-CLI file list grows if a new import of `deliverables.mjs` appears.
- **Docs (attack 12).** The requirements skill (the sentence starting "Until the artifact page lane", and the one after it), the pack README's Product view paragraph, the root README's deliverable sentence and `docs/known-bugs/FEAT-039.md`'s suite-runs line stop naming the three store names. Both modules' `@inputs` and `@outputs` headers change, so `map:check` applies (attack 21).
- **IDs.** R-2788 and R-2789 stay unused. Lanes 3 and 4 renumber from R-2795 (attack 13).

## Precedent

- `scripts/product-report.mjs` — `artifactAges`, `STORE_READERS_BY_WRITER`, `recordStoreEntries`, the deliverable card rendering, `artifactNote` in `buildReport` and `NO_ARTIFACT_NAMED`.
- `scripts/deliverables.mjs` — `deliverableClaims`, `resolvedArtifact` and `REGISTRY_STORE_NAMES` (the lane-1 shim to remove), `MACHINE_LOCAL_ARTIFACTS` (to replace), `artifactRegistry` and `registryReference`.
- `apps/bench/lib/checkers.mjs` — `globMatch`, imported, never copied.
- `packages/nana-pack/tests/product-report.test.mjs` — `productLedger`, `renderedClaims`, the R-2542, R-2544, R-2545, R-2744 and R-2745 checks, and the byte-identical page test (R-1012).
- `packages/nana-pack/tests/requirements-deliverables.test.mjs` — the R-2743 check, the R-2536 and R-2783 tests and their temporary repository fixture.

No private helper moves to a shared module; the table and its predicate are new exports of `scripts/deliverables.mjs`.

## Class and builder

Ordinary: the page and the checker; no install, hook, gate or land-tool change. Report-at-land, which changed the land-time page write, was ordinary. The larger builder, one session. The seat runs wrong-code pairs before the final review and reads the land-written page after the land.

## Known limits (the seat writes them before the final round)

- Home, other-project, git-ref and CI artifacts never show an age, so one that stops being written shows nothing new. The handoff store has had no write since 2026-09-28.
- The land page entry shows `age not measured: clone store`.
- The runtime map age follows `NANA_RUNTIME_MAP_FILE` when it is set, not A-032's location (attack 17; existing behaviour).
- The CI-records store (`CI_STORE_SUBPATH`) is a fourth clone store; when lane 3 registers it, it shows `age not measured: clone store` (attack 20).
- FEAT-028, from lane 1's round 1: a plain-path third part beside a registry passes the checker's old path check with no note in another project's ledger; this repository is covered by R-2784's own test.
