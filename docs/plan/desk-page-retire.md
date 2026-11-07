# Plan: desk-page-retire (reduction batch 2)

Feature: FEAT-016 · Start the local development desk

## Purpose

The owner, 2026-11-07, batch-2 pick "Desk page (keep app host)": cut the desk page; keep the app host. Evidence (seat inventory, 2026-11-07): the desk page logged 1 open and no views or prompts in desk.log since usage logging began on 2026-10-09, and it has been frozen since 2026-10-10. The app host (per-app loopback listeners from `~/.pi/agent/apps` manifests, the stage page, md.js) had the only use after the freeze: the basketball app opened on 2026-11-05.

## Assumptions

- A1. Cut: the desk page and its backend: `apps/desk/public/app.js`, `public/changes.js`, `changes.mjs`, the desk page's HTML and styles, and the server's desk-page routes (rail, transcripts, spawn, fork, rename, the settings editor, the changes bar), with their tests and e2e files.
- A2. Keep: `apps/desk/apps.mjs`, `public/stage/stage.js`, `public/md.js`, the shared client helpers stage.js imports from `desk-client.mjs`, `stage-keys.mjs`, `pi-session.mjs`'s `resolvePiBin`, and the server functions the app listeners use (spawnChild, promptChild, killTree, caps, origin and host rules).
- A3. The desk process and its launchd service (`nana-setup install --desk`, doctor's desk row, uninstall) stay and run the app host. The desk's own port answers a short page saying the desk page was retired and listing the app links, rather than a 404.
- A4. nana-stage (signed blocks) stays; stage-keys is not simplified in this lane.
- A5. The rows describing the desk page are retired; app-host rows stay. The desk README's Contract notes and Known limits are rewritten for what remains.
- A6. One reviewer plus CI.

## Open choices

- O1. Builder decides whether the trimmed server stays one module or splits the app-host deps into their own module, following `apps/desk/apps.mjs`.

## Questions for the owner

None.

## Threat model

Honest variation in local requests, manifests and Windows paths is in scope; the origin and host rules on every listener must still hold. Deliberate attack beyond those rules is out.

## Precedent

- `apps/desk/apps.mjs` and `apps/desk/server.mjs` (the deps passed at about line 2474): the app host and what it needs from the server.
- `apps/desk/test/app-listener.test.mjs`, `origin-rule.test.mjs`, `host-rule.test.mjs`: the tests that must keep passing.
- `docs/plan/one-reviewer.md`: the retirement shape.

## Outside precedent

none: removal of an in-house page.

## Must-meet

- M1 (page gone). The files in A1 do not exist; the desk port's `/` answers 200 with a short retired-page note that links each configured app; every removed `/api` route answers 404.
- M2 (app host works). With an app manifest present, the desk starts that app's listener; its stage page loads; a prompt reaches the app's pi child and a signed block renders. The existing app-listener tests pass.
- M3 (rules hold). Every remaining listener still refuses a foreign Origin and a foreign Host header, as the existing origin and host rule tests pin.
- M4 (service). `nana-setup install --desk`, doctor's desk row and uninstall still work against the trimmed desk (their tests pass), and the install check stays green.
- M5 (checks and docs). The desk-page rows are `retired`; map, readme, tree and component-audit checks are green; the desk README describes only the app host and the retired note.
- M6 (adversary 1: stage assets; extends M2). Loaded in a browser, the stage page gets 200 for every asset it references, non-empty computed theme tokens, and visible, usable dialog controls.
- M7 (adversary 2: signed history across restart). With an existing manifest session and persisted keys, a desk restart and then a renamed session file resume with the same issued key; old blocks stay unredacted, forged blocks stay redacted, and unrelated home files are byte-identical. Adapt the existing stage-key persistence test rather than deleting its coverage with the desk routes.
- M8 (adversary 3: Windows skip list). The test runner's R-1383 check and the native Windows CI suite pass; no Windows skip entry names a deleted test; surviving app-host tests still run.
