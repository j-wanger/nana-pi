# machine-lane-limits — plan (revision 2)

Revision 2 takes the adversary's attack in `plan-attack.md` under the seat's dispositions. The
disposition list is at the end.

Lane class (`node scripts/lane-class.mjs --root . --files <planned files below>`):

```
hook: packages/nana-pack/bin/nana-roster.mjs — directly imported by packages/nana-pack/extensions/nana-roster-notice.ts
also reaches: packages/nana-pack/bin/nana-roster.mjs — also reaches packages/nana-pack/bin/claude-review.mjs
also reaches: packages/nana-pack/bin/worker-config.mjs — also reaches packages/nana-pack/bin/claude-review.mjs
```

This is a hook lane, so it gets the land reviewer (or `seat-land.md` when the roster prints `land: seat`), the
seat's wrong-code pairs, one independent check, the mutation runner, and the local macOS install
check (the lane edits `packages/nana-setup/claude/rules/nana-seat.md`).

Planned files: `packages/nana-pack/bin/worker-config.mjs`, `packages/nana-pack/bin/nana-roster.mjs`,
`packages/nana-pack/lib/roster-set.mjs`, `packages/nana-pack/lib/roster-notice.mjs`,
`packages/nana-pack/lib/roster-notice-config.mjs`, `packages/nana-pack/rules/nana-rulings.md`,
`packages/nana-setup/claude/rules/nana-seat.md`, `packages/nana-pack/README.md`, `REQUIREMENTS.md`,
`docs/code-map.md` (regenerated), `docs/known-bugs/FEAT-006.md`, `docs/known-bugs/FEAT-040.md`, and the tests
`packages/nana-pack/tests/nana-roster.test.mjs`, `packages/nana-pack/tests/nana-roster-set.test.mjs`,
`packages/nana-pack/tests/roster-notice.test.mjs`, `packages/nana-pack/tests/rulings.test.mjs`,
`packages/nana-setup/tests/seat-rule.test.mjs`. The class line above was computed on this list.

## Purpose

Agreed reading, the owner's words (2026-11-02): "the lane limit should be 4 on mac, and 2 or however
many thats appropriate for the windows machine specs, essentially calculated per machine"; "fan
noise when building is ok". The owner then picked **Roster field**: each machine's roster file
(`<agent dir>/nana-pack.json`, the file `nana-roster` reads and prints) sets that machine's own
build-lane limit — Mac 4, the laptop from its specs, about 2. The session-start roster line shows
it, and the ruling points to it.

This replaces the 2026-10-31 ruling "At most four lanes build and two more are planned", which
counted lanes across both machines. The new limit is per machine and read from each machine's
roster file. Each machine's seat counts only its own lanes. The planned-lane count stays two by
ruling, because the owner asked only for the build limit.

## Assumptions

- A1. The field is a top-level member of the roster file, `"lanes": <integer>`, beside `roster`, not
  inside it. It is the machine's build-lane limit. Why top level: an older checkout's resolver reads
  only `raw.roster` (`packages/nana-pack/bin/nana-roster.mjs`, `resolveRoster`). pi's config reader
  ignores unknown top-level members (`packages/nana-pack/lib/config.ts`, `normalizeRaw`). So a laptop
  whose checkout lags keeps its builds, reviews and notice, and simply ignores the number. Inside
  `roster`, the same lag refuses the whole roster ("unexpected field"). `writePackConfigMember` keeps
  every other member, so `nana-roster set` keeps `lanes` with no new code. The owner's "Roster field"
  pick still holds: the field is in the roster file, and the roster command and notice print it.
  `ownerProfile` is the precedent for a separate top-level member with its own reader.
- A2. Absent or `null` means the sealed default, 4 (the 2026-10-31 value). The Mac needs no file
  change, because the owner's Mac value equals the default.
- A3. A valid value is a safe integer of at least 1. Any other value (string, boolean, array,
  object, 0, negative, fraction, a huge exponent that parses to Infinity) falls back to the default
  with one warning naming `lanes`. It never refuses the roster: the number is advisory, and no code
  enforces it. The roster itself is validated exactly as today.
- A4. No upper bound. A typo such as 40 shows in the session-start line and the `lanes:` line,
  and the seat sees it. An upper cap would add a sealed tunable this lane does not need.
- A5. The resolver reads the file once. `resolveRoster`'s ok result gains one property,
  `lanes: {limit, warning}`, where `warning` is `null` or one problem string naming `lanes`. The
  `roster` object, `--json` and every slot reader stay byte-for-byte as today. A refused roster has
  no `lanes` property, and no lane line prints.
- A6. No `nana-roster set lanes` subcommand. The laptop sets the value by hand edit (see Carry).
  A typo inside the value only falls back. A JSON syntax error still refuses the whole file, as it
  does today for any hand edit; the Carry steps start from a backup copy and end with a check run.
- A7. `--json` stays one `roster` key holding the slots only. The seat and the owner read the limit
  from the plain command's `lanes:` line and the notice.
- A8. The notice grows by about 8 characters (`, lanes 4`), or about 30 with the ignored mark. The
  adversary measured today's default notice at 144 characters, so it is already past 80 columns. A
  pi seat model never receives the notice, because the pi extension shows a widget only. The
  ruling and seat guide therefore point to the roster command, which both runtimes can run.

## Open choices

- O1. Where the lane resolution sits inside `nana-roster.mjs`: one helper called from
  `resolveRoster` on the already-parsed object. The builder names it; it must not read the file a
  second time.
- O2. How `formatRosterLines` receives the limit (a third argument, or the result object). The
  builder decides, as long as the plain run and the `set` run print the same `lanes:` line
  (R-1400's stdout equality).
- O3. The name of the sealed default in `worker-config.mjs` (for example `LANE_LIMIT_DEFAULT`), with
  provenance `the owner's 2026-10-31 answer, carried as the default by the owner's 2026-11-02 pick`.

## Questions for the owner

None.

## Feature

Feature: FEAT-006 · Launch builders with execution limits

The notice row goes to FEAT-023 (Inspect changes and receive useful notices), where R-1194 lives.

## Threat model

In scope is honest variation in our tools' input and output. That covers a machine with no roster file; a file
with no `roster` key but a `lanes` member; a file with no `lanes`; `lanes: null`; `lanes` as a string,
boolean, array or object; 0; negative; a fraction; a huge exponent that parses to Infinity; a roster
written by `nana-roster set` on a file with or without `lanes`; and an older checkout reading a file
that holds `lanes`. Out of scope is deliberate forgery of the roster file. A seat that ignores its
own limit is also out of scope: a rule line cannot force a seat to obey it (FEAT-006 known bug,
"Seat guide").

## Precedent

- `packages/nana-pack/bin/nana-profile.mjs` — `resolveProfile` reads one top-level member of the same file beside `roster`; the model for a separate top-level member. This lane reads it inside `resolveRoster`'s one parse instead of a second read.
- `packages/nana-pack/bin/worker-config.mjs` — `ROSTER_DEFAULTS` and its dated provenance comments; the model for the sealed default.
- `packages/nana-pack/bin/nana-roster.mjs` — `resolveRoster` (one bounded read, BOM strip, `raw.roster === undefined` default) and `formatRosterLines` (one `name: tokens` line per item, then `source:`); the `lanes:` line follows the same form.
- `packages/nana-pack/lib/roster-set.mjs` — `setRosterSlot` prints `formatRosterLines` after writing; it must pass the lane limit so its stdout equals a plain run's (R-1400).
- `packages/nana-pack/lib/pack-config-write.mjs` — keeps every other member; this is why `set` keeps `lanes` with no new code.
- `packages/nana-pack/lib/roster-notice.mjs` — `rosterSegment` joins parts with `, `; the lane part is one more part after `land`.
- `packages/nana-pack/lib/roster-notice-config.mjs` — sealed notice literals with contract provenance; the lane label and the ignored mark go here.
- `packages/nana-setup/claude/hooks/nana-roster-notice.mjs` and `packages/nana-pack/extensions/nana-roster-notice.ts` — both call `rosterNotice` with the resolver result and need no edit. Only the hook puts the line in a model's context.
- `packages/nana-pack/rules/nana-rulings.md` — the 2026-10-31 bullet to replace, per the 2026-10-16 ruling.
- `packages/nana-setup/claude/rules/nana-seat.md` — the "Keep at most four lanes building" bullet to reword.
- `packages/nana-setup/tests/seat-rule.test.mjs` — `RULE_7` exact-line pin and its check title.
- `packages/nana-pack/tests/rulings.test.mjs` — the R-2956 and R-2663 one-exact-dated-bullet checks; the model for the new ruling test.
- `packages/nana-pack/tests/nana-roster.test.mjs` — the R-1123 exact-stdout test and the largerBuilder case table; models for must-meets 1 to 3.
- `packages/nana-pack/tests/nana-roster-set.test.mjs` — the keep-every-other-member test (`mysteryKey`); the model for must-meet 5.
- `packages/nana-pack/tests/roster-notice.test.mjs` — `includes` checks on one line; the model for must-meet 4.
- map:search results ("roster resolver validate optional field", "roster notice session start line", "roster set preserve member", "seat guide lane limit rule") named the same roster files, plus `packages/nana-pack/lib/rulings-config.mjs` and `packages/nana-pack/extensions/nana-rulings.ts`. Those two inject the rulings and seat guide under an 8192-byte cap each. Today the files are 3900 and 4563 bytes, so the rewording fits without a code change.
- No private helper moves.

## Outside precedent

- Jenkins (MIT): each agent node carries its own "number of executors" in that node's configuration; an unset value takes the global default. **borrow**: the shape (a per-machine concurrency count, set on the machine, with a default), not any code.
- GNU make `-j` (GPL-3.0): concurrency is chosen per run, not per machine. **skip**: our limit guides a seat; nothing launches builders against it automatically.

## Must-meet

Each must-meet gets one new or reworded row, with IDs from the range the seat's brief gives (the
highest ID today is R-3474). Rows: six new (must-meets 1 to 6), plus R-1123 reworded for its printed lines and
R-1140 reworded for the seat guide (must-meet 7). That makes eight rows touched. R-1122, R-1192 and R-1400 keep their
text (see the forecast).

1. **No field means 4.** The resolver result carries `lanes: {limit: 4, warning: null}` in four cases:
   no roster file, a file with no `lanes`, `"lanes": null`, and a file with `lanes` but no `roster`. In the last case the roster
   source stays `default` and the lane limit is read from the file. The plain roster command prints
   the line `lanes: 4` and nothing on stderr. One separate seal test pins the default to the row.
   Proves: existing machines see no change.
2. **A written value is read and printed exactly.** With `"lanes": 2` beside a valid roster, the
   result carries `{limit: 2, warning: null}`. The plain command's stdout is exactly the slot lines,
   then `lanes: 2`, then `source: <file>`. `nana-roster set builder …` on that file prints the same
   stdout as the plain run that follows it. `--json` prints one `roster` key whose keys are
   `SLOT_PRINT_ORDER` only. Proves: the laptop can set 2, and the printed line is the one a seat
   reads. Pins: exact default and file stdout (R-1123 reworded to name the `lanes:` line between
   `land` and `source`).
3. **A malformed value falls back with one warning.** For each of `"2"`, `true`, `[2]`, `{}`, `0`,
   `-1`, `2.5` and `1e400`, the roster resolves `ok` with its slots unchanged. `lanes` is
   `{limit: 4, warning: <text naming lanes>}`. The plain command exits 0, prints `lanes: 4`, and
   prints exactly one stderr line starting `nana-roster: lanes ignored:`. Proves: a typo in an
   advisory number never stops builds or reviews on that machine. Pins: per case, `ok === true`,
   limit 4, one warning, and stdout equal to the default-lanes stdout.
4. **The session-start line shows the limit.** `rosterNotice` includes `, lanes 4` after the land part
   for a default roster, and `, lanes 2` for a file holding 2. For a malformed value it includes
   `, lanes 4 (file value ignored)`. The notice stays one line. A refused notice and a relative-dir
   notice include no `lanes ` text. A result object with no `lanes` property, as older tests build,
   reads as the default with no mark. Proves: the owner sees the limit in both apps, and a Claude
   Code seat gets it in its context. The label and mark are sealed in `roster-notice-config.mjs`.
   This row goes in FEAT-023.
5. **The field stays outside the roster, and `set` keeps it.** For a file holding a valid roster and
   `"lanes": 2`, `resolveRoster(dir).roster` has no `lanes` key and equals the roster as written.
   `nana-roster set builder …` on that file leaves top-level `lanes` equal to 2. The same command on
   an absent file, on a file with no `roster`, and on a file with a roster but no `lanes` writes a
   file with no `lanes` member. Proves: an older checkout reading this file still sees only the
   roster it knows, and changing a model never loses or adds the limit.
6. **The ruling points to the roster command.** The rulings file holds no bullet starting
   `- 2026-10-31: At most four lanes build`. Its last bullet is exactly:
   `- 2026-11-01: Each machine sets how many lanes build there in its roster file; the roster command's lanes line prints the limit, default included. At most two more lanes are planned.`
   Pins: one exact bullet, and it is the last bullet (date order restored). It states no build
   default, so a retune changes only the sealed value.
7. **The seat guide points to the roster command.** The lane bullet is replaced by exactly one bullet.
   The guide still holds sixteen rules (R-1140 reworded):
   `- Keep no more lanes building than the lanes line of this machine's roster command allows, \`node "$HOME/nana-pi/packages/nana-pack/bin/nana-roster.mjs"\`, and at most two more in planning. A lane in planning has no build yet and no builder working in it. A lane counts as building from its first build until it lands or closes.`
   Pins: `RULE_7` set to the new exact line, found once. The check title is renamed to
   `seat guide carries: no more lanes building than the roster command's lanes line, two in planning, each slot defined`,
   and R-1140's evidence column changes with it.

## Forecast of existing tests and rows

These are expected changes, not a limit on the builder's edits.

- `packages/nana-pack/tests/nana-roster.test.mjs`, R-1123 test ("roster command prints largerBuilder…", the exact `rDefault` and `rFile` stdout near line 212): both strings gain `lanes: 4\n` before `source:`. Other R-1123 tests use `includes` and are expected to pass.
- `packages/nana-pack/tests/nana-roster.test.mjs`, R-1192 test (near lines 334 to 340): `Object.keys(parsed.roster).join(",") === SLOT_PRINT_ORDER.join(",")` at 335 and 339, the `orderedRoster` equality at 336 and the `JSON.stringify(resolved.roster) === JSON.stringify(ROSTER_DEFAULTS)` at 337 all stay green by design. Under A1 and A5 the roster object, `ROSTER_DEFAULTS` and `orderedRoster` gain no key, and `--json` prints only the roster. R-1192's text stays as is. A build that adds `lanes` to the roster object breaks these four assertions; that is a wrong build, not a forecast change.
- `packages/nana-pack/tests/nana-roster-set.test.mjs`, R-1400 test (near lines 75 to 88): `setRun.stdout === plainRun.stdout` stays green only if `set` prints the same `lanes:` line as the plain run (O2). `previousRoster` and the `orderedRoster` equality need no change, because the roster object gains no key. R-1400's text stays as is.
- `packages/nana-setup/tests/seat-rule.test.mjs`: `RULE_7`, the comment above it (the 2026-10-31 answer) and the check title at line 84. R-1140's rule text and its evidence column change together, or the trace check fails.
- `packages/nana-pack/tests/rulings.test.mjs`: none of its current checks pins the 2026-10-31 bullet; the new check is added.
- `packages/nana-pack/tests/roster-notice.test.mjs`: none expected; it uses `includes`, and result objects without `lanes` read as the default.
- `packages/nana-setup/lib/install-check-config.mjs` writes a roster fixture with no `lanes`; it stays valid, and the install check's notice check reads the prefix only.
- `apps/desk` does not read the roster; nothing there changes.

## Docs and records in the reviewed change

- `packages/nana-pack/README.md`, Machine roster: document top-level `lanes`, its default, its fallback warning, the `lanes:` line, the notice part, and that `set` keeps it. The README check stays green.
- `docs/known-bugs/FEAT-040.md`: delete the line about the 2026-10-31 ruling being out of date order, because that ruling goes and the new one is last.
- `docs/known-bugs/FEAT-006.md`: add residuals as found. Expected ones: a rule line cannot prove a seat obeys its limit; a pi seat model reads the limit only by running the roster command; the laptop states 4 until its Carry issue is done.
- `docs/code-map.md` regenerated; `map:check` green.

## Carry

At the land, the seat posts one issue labelled `next`, after the identity scan exits 0. Title:
"Set the laptop's build-lane limit in its roster file". Body, in order:

1. Pull main on the laptop, then run `nana-setup install`. Windows gets byte-equal copies of the
   rulings and seat guide, so a laptop that skips the install keeps the old "four" ruling.
2. Read the specs:
   `node -e "const o=require('os');console.log(o.availableParallelism(),Math.round(o.totalmem()/2**30))"`
   (logical cores, then memory in GiB). The laptop seat picks the value from them, about 2 by the
   owner's words, and records the two numbers and the value in the issue.
3. Copy `nana-pack.json` in pi's active agent dir to a backup beside it.
4. Add the top-level member `"lanes": 2`, or the value step 2 chose, beside `roster`.
5. Run `node <checkout>/packages/nana-pack/bin/nana-roster.mjs`. It must exit 0 and print
   `lanes: 2` with nothing on stderr. On a refusal, copy the backup back and redo step 4.
6. Start a new session and confirm the notice shows `lanes 2`.

## Disposition of the attack

- MUST 1 (a pi seat never sees the notice): taken. The ruling and seat guide point to the roster command's `lanes:` line. Must-meet 4's "Proves" now says the owner sees it in both apps and a Claude Code seat gets it in context. No pi context injection is added.
- MUST 2 (the laptop's value is not delivered): taken. The Carry section has the `next` issue with pull, install, spec reading, backup, edit, check and session confirm.
- MUST 3 (the forecast misses `--json` pins): taken. The forecast names the key-list checks at 335 and 339, the equality checks at 336 and 337, and R-1400's stdout equality. Under the top-level choice they stay green by design, and the forecast says what would break them.
- SHOULD 4 (refusal makes a typo stop builds): taken as option (a). A malformed value falls back to 4 with one warning line naming `lanes` (A3, must-meet 3). No `set lanes` subcommand.
- SHOULD 5 (A1 rejects the safer shape): taken. `lanes` is a top-level member, because older checkouts ignore it instead of refusing the roster (A1). Must-meet 5 is now a keep-and-never-add check plus an outside-the-roster check.
- SHOULD 6 (`--json` hands out `lanes: null`): resolved by SHOULD 5. `--json` prints only the roster, which never holds `lanes`.
- SHOULD 7 (`set` from an absent file or no `roster`): taken. Must-meet 5 covers an absent file, no `roster`, and a roster without `lanes`.
- SHOULD 8 (the prose restates the default): taken. The ruling and seat guide name no build default; the planning count of two stays in prose by ruling, as the seat directed.
- SHOULD 9 (R-1140 trace link): taken. Must-meet 7 and the forecast name the check-title rename and the evidence-column edit.
- NOTE 10 (drop the planning number): taken, as the seat directed. `lanes` is a bare integer for the build limit; planning stays two by ruling. Question 1 is gone.
- NOTE 11 (ruling date and place): taken. The ruling is dated 2026-11-01 and pinned as the last bullet.
- NOTE 12 (the desk claim): taken. The claim is struck; the forecast says the desk does not read the roster.
- NOTE 13 (notice length): taken. The lane part is short (`, lanes 4`).
- NOTE 14 (`set` stdout): taken. Must-meet 2 pins that `set` and the plain run print the same `lanes:` line.
- Revision 1's Question 2 (refuse or fall back) is decided by the seat as fall back. "Questions for the owner" now reads None.
