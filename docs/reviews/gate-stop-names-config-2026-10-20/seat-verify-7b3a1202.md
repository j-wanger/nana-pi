# Seat checks — gate-stop-names-config build 1, tip 7b3a1202 (2026-10-20)

- Build: one, by a pi gpt-5.6-sol builder through pi-worker (the roster's larger-lane builder), 255846f0 on main
  9552afb1. The plan is 06b110af (`must-meet.md`; `plan-attack.md`: one adversary, AMEND; `build-brief-1.md` with the
  seat's amendments at its end). `must-meet.md` still names a Claude Sonnet builder; the brief's seat section moved the
  build to pi sol.
  - `lib/config.ts` gains one module-local `gateParseStopReason(file, failure, scope)`: `configFailureDetail(displayPath(file),
    failure)` from `lib/json-text.mjs`, minus `CONFIG_FAILURE_PREFIX` and its final period, after `<scope> nana-pack.json
    does not parse: `. `loadConfig`'s user and project stop branches use it when that file's `jsonFailure` is set and
    keep `gateStopReason` otherwise. `json-text.mjs`, `nana-gate.ts` and the objective path are unchanged.
  - Rows R-2360 to R-2364 sit in FEAT-011, with four checks in `config-gate-fallback.test.mjs` section (f) and one in
    `config-project-gate-fallback.test.mjs`. The seventeen existing checks in four files that went red on text alone
    now read a parse-form regex, and so does R-067's mid-session not-stopped clause; their block assertions and rowed
    titles are unchanged, and the valid-JSON leaf checks keep the old regex.
  - The pack README's Malformed config bullet names the parse form for both scopes. The code map and the tree are
    regenerated. 7b3a1202 adds the seat's pairs record.
- CI runs on draft pull request #144 at 255846f0. CI-PENDING.
  - Main's own known failures: Ubuntu's path-spelling GP1 and GP2 until linux-path-spelling landed (main ca27d86); a
    pull-request run's R-291 leaf-total failure, a merge artifact of GitHub's merge commit. Windows main reads 0 FAIL
    since 4be0b79 (desk files are declared skips). A failure in that set is main's, not the lane's.
- The seat's wrong-code pairs on macOS (`seat-mutate.mjs`, the shared mutation runner, Node 22.22.2, one shard, merge
  base 9552afb1; record `seat-mutate-output-255846f0.txt`, commit 7b3a1202): 14 of 14 red, 0 survived, each exactly its
  named titles. Every pair edits `lib/config.ts` only. Baseline: config-gate-fallback 42 PASS, config-project-gate-fallback
  28, config-normalize 23, gate-survives-mutation 38, config-display-text 38, each 0 FAIL.
  - U1 to U3 (the user parse stop): main's malformed form with the parser text; the parse form for every stop, a
    valid-JSON bad leaf too; the parser text appended.
  - P1 to P5 (the project parse stop): main's form; built from the user file's failure; labelled user; names the user
    file; the parse form for every stop, a bad leaf and a dangling link too.
  - B1 to B6 (the builder's wrong forms): repair advice flipped; place dropped; the advice's final period kept, so two
    periods before Recovery; the config-failure prefix kept; the raw path instead of `displayPath`; a made-up line 1,
    column 1 when the parser reports no place.
  - Declared without a pair: the `json-text` import line (a dropped name fails at load), the `@outputs` header line
    (map:check's job) and the README bullet (prose).
- Independent check (`independent-check-7b3a1202.md`, filed under this tip's name): it ran on 255846f0 in a private
  clone, with a temp HOME and TMPDIR for every probe, Node 22.22.2 and pi 1.0.2 on macOS. HOLDS over ten probes (P1 to
  P10, some with sub-cases), no MUST.
  - Held: a single backslash gives the place, the forward-slash advice and one period before Recovery; a UTF-16LE file
    with a byte-order mark and a trailing comma, an empty file under PowerShell, an unquoted token and a file cut off
    mid-write each give the manual advice, with a place only where the parser reports one and no file text; a hostile
    HOME name stays one line with its controls escaped; a valid-JSON bad leaf and a top-level array keep the old text;
    a mid-session break keeps the last valid policy, and a repair lifts the stop in the same process; a trusted project
    file gets the project stop, an untrusted one is still allowed, and with both broken the user stop wins; a
    Windows-shaped path and an agent folder named with backslashes stay readable; the objective's config-failure line
    and the gate stop give the same place and advice.
  - Harm check: every stop branch still sets a reason and blocks; no code outside the pack tests matches the old text;
    the new tests write only under the temp folder; no nana-setup or hook file changes, and objective-golden stays
    green.
  - Its findings and how each was settled:
    1. Known bug (declared; the plan's known limit 4): pi's config warning and the `config_invalid` journal line still
       quote up to 120 characters of the parser message, which can include file text (P4). Not fixed. It is now the
       whole of win-config-json-path's out-of-scope HANDOFF residual, which names this lane too.
    2. Known bug (declared; the plan's known limits 1 and 2): an unreadable file, a file over the size cap, or a top
       level that is not an object keeps the "gate block is malformed" text (P7b). Not fixed; a new HANDOFF residual.
    3. HANDOFF: the out-of-scope win-config-json-path line became untrue for a file that does not parse. Settled in this
       commit: that line now keeps only finding 1.
  - One count in the check is wrong. It says that with `config.ts` put back to 9552afb1 the five new checks fail "along
    with the 14 churned checks". The seat re-ran that in a scratch clone of 255846f0 with `config.ts` at 9552afb1:
    config-gate-fallback 10 FAIL, config-project-gate-fallback 9, config-normalize 2, gate-survives-mutation 1. That is
    22, the five new checks plus the plan's 17 churned ones; pairs U1 and P1 name the same 17. The verdict does not rest
    on that count.
- The plan's other known limits: limit 3 (no place for some parser errors) joins win-config-json-path's no-place
  residual, which now names the gate stop and this lane. Limit 5 (a mid-session parse failure keeps the last valid
  policy and shows no stop) is R-067's design, unchanged, and is not carried. Limit 6 (the stop follows
  `configFailureDetail`'s shape) is not carried: a shape change fails these five checks in the suite.
- HANDOFF: one Landed line; one new residual (finding 2); the win-config-json-path out-of-scope line rewritten (finding
  1); the win-config-json-path no-place line names the gate stop (limit 3).
- Land reviewer: pi gpt-6-astra reviews the land through pi-review, so the seat writes no `seat-land.md`.
- Rows: R-2360 to R-2364 read `implemented` in REQUIREMENTS.md. The builder's row text differs from the must-meet
  table's (WHEN form, test titles of its own); each row names the check title in its test file. At the notes commit (no
  code or row changed since 255846f0): `node scripts/requirements-trace.mjs` reads `requirements: 1672 total (1435
  implemented · 1 planned · 37 retired · 193 untested · 6 violated); 1435 traced by tests` and `ears: 0 rows off form
  (allowance 0)`; `npm run map:check` reads 364 modules, 0 problems; `npm run readme:check` reads 727 claims, 0 problems.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, merge base 9552afb1, run at 7b3a1202):
  ```
  tree movement 9552afb..7b3a120: 5 rows in 1 features
  FEAT-011 · Keep policy changes safe and recoverable
    R-2360 new (implemented)
    R-2361 new (implemented)
    R-2362 new (implemented)
    R-2363 new (implemented)
    R-2364 new (implemented)
  ```
  CAP-03 moves from 166 to 171 rows and FEAT-011 from 36 to 41.
- Not in this record: a seat-run locked full suite (the land runs it on the reviewed tip). No install check: the lane
  changes no nana-setup or hook file, and the plan rules it not required.
- Main has not moved under this lane: main is 9552afb1, the merge base and the review base. If main moves before the
  land, the merge needs `npm run map` and `npm run req:tree`, and the five checks rerun on the merged tip, since a
  slate lane that changes `configFailureDetail`'s shape would change this stop.
