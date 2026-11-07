# desk-page-retire — builder record

VERDICT: PARTIAL

Branch: `feat/desk-page-retire`. One implementation/evidence commit; the final chat report supplies its full SHA.
Objective served: preserve the toolkit's focused app experience while removing the retired session dashboard.

## Delivered files and rows

- `apps/desk/server.mjs`: retain the app dependency boundary in one module (O1), child transport, caps, dialogs, signing and request rules. Remove general session/config/transcript/control routes and their implementation. Serve the retired note and app registry.
- Delete `apps/desk/changes.mjs`, `apps/desk/public/app.js`, `apps/desk/public/changes.js`, and `apps/desk/public/index.html`.
- `apps/desk/public/styles.css`: retain only stage theme, markdown, tool-card, image, dialog and toast foundations; remove dashboard layout/settings/changes rules.
- `apps/desk/public/md.js`: expose its existing escaping function as `escapeHtml`; update its inline/fenced-code callers and import that function in the server. No copied production helper or new shared production module.
- `apps/desk/apps.mjs`, `apps/desk/stage-keys.mjs`, `apps/desk/public/stage/`, `apps/desk/public/desk-client.mjs` and `apps/desk/pi-session.mjs` remain in place. The first two are unchanged.
- `REQUIREMENTS.md`: add R-3791–R-3798 in M-order; retire 67 rows without deletion or renumbering; retire artifact A-024; remove retired CAP-05 deliverables/maker/reader/park lines and obsolete config-reader claims. Keep app-host rows and CAP-06 parked deliverables.
- Correct the surviving shared transport rows R-419, R-420, R-429, R-430, R-431, R-460 and R-461 to `untested`: their former general-spawn/RPC/delete harnesses depended on removed routes. The implementations remain. This is a coverage reduction, not a claim those behaviors retired.
- Narrow R-944 to surviving manifest spawns and R-699 to app opens/prompts. Update persistence/data-cap evidence to the adapted test titles.
- `apps/desk/README.md`, `README.md`, and only the dashboard-specific lines outside `AGENTS.md`'s shared marker: describe the app host and retired note. No shared lane-process text changed.
- `packages/nana-pack/lib/windows-skips-config.mjs`: remove deleted-test entries and app-host resolver skips. Retain three existing non-host skips: pi-resolution, installed-pi RPC contract, and the knowledge source inventory.
- `docs/components/nana-pi.json`: describe the retained app host; keep the unbounded-bookkeeping gap. Regenerate `docs/code-map.md` and `docs/requirements-tree.md`.

Retired rows:
R-401, R-468, R-402, R-403, R-469, R-405, R-406, R-407, R-408, R-470, R-409, R-471, R-410, R-472, R-411, R-473, R-412, R-463, R-413, R-198, R-414, R-415, R-475, R-476, R-416, R-477, R-478, R-417, R-418, R-685, R-480, R-481, R-427, R-485, R-486, R-487, R-434, R-489, R-490, R-435, R-436, R-484, R-474, R-421, R-422, R-482, R-423, R-424, R-425, R-483, R-426, R-428, R-488, R-867, R-869, R-455, R-941, R-456, R-466, R-457, R-441, R-492, R-442, R-945, R-946, R-947, R-949.

## Must-meet evidence and mutation pairs

All mutations changed implementation/configuration, never the assertion. Every mutation was restored before green runs.
Rows preceded tests, which preceded the server/style/documentation rewrite. The original persistence harness also failed the fresh-key mutation before its adaptation; the adapted case repeated that proof.

| Must-meet | Test/evidence | Wrong implementation → result | Restored result |
|---|---|---|---|
| M1 / R-3791 | page-retire: removed files, short escaped note, both bound links, removed route methods | original page files still present → exit 1 | PASS |
| M2 / R-3792 | page-retire: actual Chromium stage, prompt marker and signed rendered card | empty manifest map/no listeners → exit 1, repeated against final harness | PASS, not skipped in direct browser run |
| M3 / R-3793 | page-retire plus retained Host/Origin suites, desk and both app ports | bypass Host rule → exit 1; separately bypass Origin rule → exit 1 | PASS |
| M4 / R-3794 | existing desk-service, doctor-detail, uninstall and install-check unit suites | wrong DESK_SERVER target → exit 1 | service/doctor/uninstall fixtures green; full install rehearsal NOT RUN |
| M5 / R-3795 | page-retire plus map, README, tree and component checks | original dashboard README lacks app-host contract → exit 1 | PASS |
| M6 / R-3796 | page-retire: browser asset responses, light/dark computed tokens, visible enabled Yes control and child answer | map stage stylesheet to missing file → exit 1 (empty computed tokens) | PASS, not skipped in direct browser run |
| M7 / R-3797 | adapted stage-key-persistence: preexisting manifest session, three host starts, renamed file, reused issuance, mixed recorded keys, tampering/unknown-key redaction, foreign live-key refusal, unrelated-byte checks | always mint fresh key → exit 1 | PASS |
| M8 / R-3798 | page-retire skip registry checks and root runner R-1383 test | re-add surviving app-listener to Windows skips → exit 1 | local registry/runner PASS; native Windows NOT RUN |

Persistence fixtures cover CRLF, trailing spaces/tabs and no final newline. They use temporary homes and retain direct store checks for the key cap, POSIX modes, atomic interrupted writes, failed-save retry, other-writer visibility, seeding, corrupt isolation, operator permissions and root-scoped pruning.

The test wrapper in `apps/desk/test/test-case.mjs` awaits each Node test body under its per-case timeout and emits the PASS/SKIP lines the repository runner counts. It is imported by all three adapted/new test modules, not copied. This departs from seat-pull-off's local promise-race harness because Node supplies the deadline and the repository runner does not count TAP `ok` lines. No new product tunable was introduced.

## Existing tests edited

- `apps/desk/test/app-listener.test.mjs`: replace the removed desk live-list assertion with its 404 contract; use file URLs and a Windows RPC stub; isolate the home and signing store. The existing manifest, prompt, provenance, readiness and dialog assertions remain.
- `apps/desk/test/host-rule.test.mjs`: successful desk reads now use the retained app registry instead of the removed live list; inspect the app session to establish no child started; use fileURLToPath.
- `apps/desk/test/origin-rule.test.mjs`: enumerate the retained registry instead of live sessions; use an isolated home and portable server path. Rejected requests to removed paths still exercise the boundary before routing.
- `apps/desk/test/buffer-caps.test.mjs`: retain the app data-output cap/reaping/usability case. Remove cases that used general spawn, RPC passthrough and delete; the affected surviving transport rows are explicitly untested.
- `apps/desk/test/stage-key-persistence.test.mjs`: replace desk RPC/fork/clone/queue/confirmation fixtures with manifest-only restart/rename coverage. Preserve the signing and store negatives listed above. The obsolete lifecycle and concurrent-self-fixture rows retire with that harness.
- `apps/desk/test/usage-line.test.mjs`: remove dashboard spawn/prompt and expect only two app usage records; retain privacy fields, timestamps, stdout and negative-trigger assertions; add the Windows stub spelling.
- `packages/nana-pack/tests/agent-dir-parity.test.mjs`: start the child through a manifest and compare its recorded agent directory instead of querying the removed settings route. Retain relative-dir pin checks. Its existing Windows-only desk leg skip remains, since that harness still uses a POSIX stub.
- `packages/nana-pack/tests/templates-render.test.mjs`: replace the retired default/narrowed desk spawn matrix pin with the manifest-only matrix pin.
- `packages/nana-setup/tests/desk-service.test.mjs`, `doctor-detail.test.mjs`, `uninstall.test.mjs`: add R-3794 markers to existing assertions only; no assertion or setup behavior changed.

New tests: `apps/desk/test/page-retire.test.mjs`, only the M1/M2/M3/M5/M6/M8 cases. M4 uses the existing named service coverage; M7 adapts the named persistence file. No unrelated new test.

Delete the 17 dashboard/backend test files: changes-endpoint.test.mjs, changes-ui.e2e.mjs, crash-paths.test.mjs, double-msg.e2e.mjs, live-feel.e2e.mjs, live-feel.test.mjs, pi-087-entries.test.mjs, pi-session-parity.test.mjs, prompt-detach.test.mjs, rail-collapse.e2e.mjs, reload.e2e.mjs, session-races.e2e.mjs, spawn-and-persist.test.mjs, spawn-tools.e2e.mjs, subagent-render.e2e.mjs, teardown-invariants.test.mjs and title-live.e2e.mjs, all under `apps/desk/test/`.

## Cut inventory and retained readers

- Changes backend: only the retired server route and deleted changes test imported it. Changes browser code belonged to the removed dashboard. The retained stage uses tool-result diffs, not the changes bar.
- Dashboard HTML and app.js: the old server static route and deleted dashboard browser suites were their runtime readers. The stage's separate HTML/JS remain.
- Keep `public/styles.css` at the same URL: stage/index.html and app listener static maps read it. Deleting it wholesale broke M6. Only its shared foundations remain; keeping the path is intentional, not a missed cut.
- Keep `GET /api/apps`: retained app-listener, Host, persistence and usage harnesses discover OS-assigned ports through it. It is not a session-dashboard control route.
- Keep the whole public `desk-client.mjs` export surface, not merely today's stage import list: app-owned manifest pages may import this published kit URL. Removing public exports without inventorying those external pages would be speculative. The dashboard consumer is gone.
- Keep pi-session's resolver/parser exports: pi-resolution, installed-pi RPC contract and surviving stage browser harnesses still import them. The host itself now imports only resolvePiBin. Its bounded header-id reader no longer imports the transcript parser or scans names/transcript branches.
- Keep stage-keys unchanged, including seed support, as A4 requires. Its lifecycleRpc comment is now historical; no host RPC passthrough remains.
- Keep benchmark snapshots and their self-contained test sources: they reproduce a recorded historical checkout rather than read this host. Keep the code-map test's deleted browser path as an intentional unknown-module negative input, not a file-existence pin.

`reference-audit.txt` records the final deleted-path/removed-sentence scan across test sources and fixtures. No surviving assertion pins the retired README spawn sentences. Historical records remain unchanged.

## Known-bug closures only

Delete only six lines that concern the removed page:
- FEAT-005: writing/objective config-save refusal.
- FEAT-015: the desk's three BOM/UTF-16 config/settings reader limits.
- FEAT-023: the retired changes endpoint's event-loop test flake.
- FEAT-024: standard-install nana-pack settings save refusal.

Every other line in those files is unchanged. Mixed-context known-bug lines elsewhere remain unchanged. The surviving signing-store and unbounded-bookkeeping limits remain declared in the desk README.

## Commands and results

All commands ran in this lane worktree. `evidence.txt` holds sanitized output and meaningful red/green pairs.

| Command | Exit / result |
|---|---|
| `npm run map` then `npm run map:check` | 0 / 0; 0 module problems |
| `npm run req:tree` | 0; 2573 rows, 43 features, 0 problems; 21 of 23 deliverables made/read by code, 18 parked |
| `npm run readme:check` | 0; 1042 claims, 0 problems |
| `node scripts/component-audit.mjs` | 0; existing stale/unclaimed notes are report-only |
| `node scripts/requirements-trace.mjs` | 0; 0 off-form rows |
| `node scripts/test.mjs apps/desk agent-dir-parity templates-render packages/nana-setup/tests/desk-service.test.mjs packages/nana-setup/tests/doctor-detail.test.mjs packages/nana-setup/tests/uninstall.test.mjs packages/nana-setup/tests/install-check.test.mjs` | 0; 16 files PASS; 692 checks pass, 2 browser prerequisite skips |
| `PW_ROOT=<existing Playwright project> node apps/desk/test/page-retire.test.mjs` | 0; all six cases pass, including both actual browser cases |
| `node scripts/test.mjs test-runner` | 0; 2 files PASS; 64 checks, including R-1383 |
| path-filtered code-map/component/known-bugs/readme/requirements tests | all green; the initial combined run found the test runner's exact-double-quote temporary-helper import pin; fixing imports made its rerun green |
| `node scripts/test.mjs apps/desk/test/stage-key-persistence.test.mjs` after adding unknown-key coverage | 0; 2 checks pass |
| `git diff --check` | 0 |

No suite test was added that launches a seat script. No model, reviewer or worker session was launched for this implementation. Existing RPC contract tests run installed pi offline without a model call.

## Not done / seat carry

- The full macOS `node packages/nana-setup/bin/install-check.mjs` was not run: it launches pi-review and pi-worker test-model sessions, which conflicts with this builder's explicit no-model-session/no-subagent constraint. Its deterministic unit suite passed 142 checks; service, doctor and uninstall fixtures passed separately. This remains the M4 gate.
- Native Windows execution and CI results are not available to this macOS builder. M8's registry/R-1383 portion passed locally; the seat must push and verify native Windows CI. No CI was read.
- The full repository suite was not run: AGENTS.md explicitly assigns it to CI and requires builders to run path-filtered tests.
- No push, issue operation, HANDOFF edit, session archive edit, live service restart or real-home install was performed.
- The seven shared-transport coverage reductions are explicit above. No claim is made that the removed desk-route tests still cover those retained functions.

Open questions: none about the intended retirement; the remaining items are validation carry, not new product choices.
