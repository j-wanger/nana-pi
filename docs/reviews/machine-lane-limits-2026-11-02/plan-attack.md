# machine-lane-limits — plan attack

Adversary for `plan.md` (branch from origin/main 0bd1df89). Threat model as the plan states it:
honest variation in our tools' input and output, no forgery. Marks: MUST blocks the plan as
written; SHOULD is a change I'd make before the build; NOTE is for the seat's judgement.

## MUST

1. **MUST — a pi seat never sees the lane line, so must-meet 4's "Proves" is false and the new
   seat-guide bullet points a pi seat at a line it cannot read.**
   Evidence: `packages/nana-pack/extensions/nana-roster-notice.ts:31-43` returns early without a UI
   (`if (!ctx.hasUI) return;`) and only calls `ctx.ui.setWidget(...)`: the line goes to the
   person, not into the model's context. The Claude Code hook does put it in the context
   (`packages/nana-setup/claude/hooks/nana-roster-notice.mjs:58-61`, `additionalContext`). The
   seat guide is injected into pi seats (AGENTS.md "Seat guide"; `nana-rulings` extension), so the
   suggested must-meet 7 text, "the roster line at session start shows both", tells a pi seat to
   read something it never receives. Must-meet 4 says "Proves: each seat sees its own machine's
   limit at session start in Claude Code and pi alike". That holds for the owner's eyes, but not
   for the pi seat model that does the counting.
   Change: word the seat-guide bullet and the ruling so they point the seat to the roster command,
   whose plain output carries the `lanes:` line (must-meet 2). For example: "Keep no more lanes
   building and in planning than the `lanes:` line of the roster command allows". The command
   works in both runtimes and on Windows through `node`. Narrow must-meet 4's "Proves" to "the
   owner sees it in both apps, and a Claude Code seat gets it in its context". Do not add a pi
   context injection in this lane. That would be new surface on a hook lane the owner did not ask
   for.

2. **MUST — the Windows outcome the owner asked for is not delivered or recorded. After the land,
   the laptop will show "lanes 4 build + 2 plan".**
   Evidence: plan A5 ("set on the laptop after the land, by its seat or the owner") and A2 (absent
   means 4 and 2). The owner's words: "2 or however many thats appropriate for the windows machine
   specs". No must-meet, Docs item or carry step names the laptop's edit. The plan sets no
   `next` issue and records no spec reading. Until someone edits the laptop's file, the new notice
   on the laptop states the old limit from a source that now looks per-machine. That is worse than
   today's ruling, which at least reads as a shared cap.
   Change: add a Carry section. At land, the seat posts one `next` issue for the laptop, labelled
   `next`. It carries (a) the step order: pull, then `nana-setup install`, because win32 gets
   byte-equal copies of the rulings and seat guide (`packages/nana-setup/tests/rulings-install.test.mjs:87-132`)
   and an un-reinstalled laptop keeps the old "four" ruling; (b) how to read the specs, e.g.
   `node -e "const o=require('os');console.log(o.availableParallelism(),Math.round(o.totalmem()/2**30))"`;
   (c) the exact JSON to add, `"lanes": {"building": 2, "planning": 1}`, or whatever the specs
   support; (d) the check, `node <checkout>/packages/nana-pack/bin/nana-roster.mjs` printing the `lanes:` line.
   If finding 4 is taken, (c) becomes a `set` command instead of a hand edit.

3. **MUST — the forecast misses an existing `--json` pin that must-meet 2 breaks.**
   Evidence: `packages/nana-pack/tests/nana-roster.test.mjs:335` and `:339` assert
   `Object.keys(parsed.roster).join(",") === SLOT_PRINT_ORDER.join(",")`. Must-meet 2 requires
   `--json` to print `lanes`, so that key list gains `lanes` and the R-1192 test fails. That
   failure comes from must-meet 2 itself, whatever O2 picks. The forecast's line ("the `--json`
   round trips (near line 334) still compare against `orderedRoster`, which changes if O2 adds
   `lanes` there") names only line 336, not 335/339. Line 337
   (`JSON.stringify(resolved.roster) === JSON.stringify(ROSTER_DEFAULTS)`) also becomes
   key-order-sensitive once `lanes: null` is added in two places. And if O2 adds `lanes` to
   `orderedRoster`, the R-1400 set test (`nana-roster-set.test.mjs:80-88`) breaks. Its
   `previousRoster` for an absent file has no `lanes`, while the resolver's copy will carry
   `lanes: null`.
   Change: list all three in the forecast. The R-1192 row text ("holding only a `roster` key whose
   value is the resolved roster with every slot in print order") needs rewording either way. Name
   it as reworded, not "if its text no longer covers `lanes`".

## SHOULD

4. **SHOULD — refusing the whole roster on a malformed `lanes` (A4/Q2 default), together with hand
   edits only (A6), makes the riskiest path the only path, on the machine least watched.**
   Evidence: the only way to set the value is a hand edit of JSON on Windows (A6: no `set lanes`).
   A typo there stops `pi-worker` (`bin/pi-worker.mjs:139-140`) and `claude-review`
   (`bin/claude-review.mjs:79`). The session-start notice then shows only "refused", so the
   builder lineup also disappears from view (`lib/roster-notice.mjs:73-75`). The number is
   advisory, and no code enforces it (threat model, last sentence). A typo in an advisory value
   should not stop the machine's builds. The plan's own Q2 trade line says the same.
   Change, pick one: (a) flip Q2's default to fall back to the default limit with a named warning
   in the notice and the plain command; or (b) keep the refusal and add `nana-roster set lanes <b> <p>`.
   Option (b) validates before it writes, through the existing `writePackConfigMember`
   (`lib/pack-config-write.mjs:15`), so the laptop never needs a hand edit. A6's reason ("`set`
   writes a member an older checkout refuses") does not apply when the owner runs `set lanes` on
   purpose. Either option is cheaper than a stopped laptop.

5. **SHOULD — A1 rejects the shape that avoids the older-checkout breakage, for the wrong reason.**
   Evidence: A1 says a top-level member "would be ignored by an older checkout instead of
   refused". For an advisory number, being ignored is the safe outcome. Inside `roster`, an older
   checkout refuses the whole roster (`bin/nana-roster.mjs:115-117`, "unexpected field"). On that
   machine that stops builds, reviews, the notice lineup, `outside-reader` and `visual-reader`
   (`scripts/outside-reader.mjs:95`, `scripts/visual-reader.mjs:104`). The plan accepts this as a
   FEAT-006 residual. Precedent for a separate top-level member read by its own small resolver
   already exists in the same file: `ownerProfile` (`bin/nana-profile.mjs:25-37`). pi's config
   reader ignores unknown top-level members (`lib/config.ts:266-289`), and `writePackConfigMember`
   keeps them (`lib/pack-config-write.mjs:39`). So `set` keeps the field for free, and must-meet 5
   becomes one assertion.
   Change: either take a top-level `lanes` (the "Roster field" pick still holds; it is in the
   roster file, and the roster command and notice print it) and retire must-meet 5 to a single
   keep check, or keep A1 and state the older-checkout cost as an owner-visible trade in Q2.
   Today it sits only in a Docs residual.

6. **SHOULD — `--json` printing `lanes: null` for a default roster makes the paste path write the
   member A6 says must never be written.**
   Evidence: R-1192's contract is that `--json`'s `roster` value, pasted as the file's `roster`
   member, resolves back the same (`nana-roster.test.mjs:325-340`). Under A7, a default machine's
   `--json` shows `"lanes": null`. If pasted, the file then holds a `lanes` key, which an older
   checkout refuses (finding 5). A6 protects `set` from exactly this, while `--json` hands it to
   the user.
   Change: `--json` omits `lanes` when it is `null`, the same as `set` (must-meet 5). Pin that in
   must-meet 1, where the default `--json` output has no `lanes` key.

7. **SHOULD — must-meet 5 misses the two cases where `set` is most likely to add the member.**
   Evidence: `resolveRoster` returns `ROSTER_DEFAULTS` for an absent file and for a file with no
   `roster` (`bin/nana-roster.mjs:136`, `:147`). Must-meet 1 forces `roster.lanes === null` there,
   so `ROSTER_DEFAULTS` (or the resolver) gains `lanes: null`. `set` then builds
   `orderedRoster({ ...base.roster, [slot]: ... })` (`lib/roster-set.mjs:64`). Must-meet 5 tests
   only "a file whose roster has no `lanes`". It does not test an absent file (the R-1400 test's
   first case) or a file with no `roster` key. Those two are where a `lanes: null` would most
   likely leak into a new file.
   Change: extend must-meet 5 to all three no-field starts (absent file, no `roster`, roster without
   `lanes`) plus `lanes: null`. In each, the written roster has no `lanes` key.

8. **SHOULD — the prose restates the sealed default, so retuning it means editing two rule files
   and two pinned exact lines.**
   Evidence: must-meet 6's ruling text and must-meet 7's bullet both say "four and two apply when
   it sets none". The same numbers are also sealed in `worker-config.mjs` (O3) with their own seal
   test (must-meet 1). Under nana-standards "No inline tunables", a retune must change no code.
   Here it would change the ruling, the seat guide, `RULE_7` and the new ruling pin.
   Change: drop the numbers from both texts. The roster command prints the effective value,
   default included (A7), and that is the single place a seat reads it. For example:
   `- 2026-11-02: Each machine's roster sets how many lanes build there and how many more are planned; the roster command prints the limit, default included.`

9. **SHOULD — the forecast misses the R-1140 trace link.**
   Evidence: the check title `"seat guide carries: at most four lanes building and two in planning, each slot defined"`
   (`packages/nana-setup/tests/seat-rule.test.mjs:84`) is quoted word for word in R-1140's evidence
   column (`REQUIREMENTS.md:822`). The comment at `seat-rule.test.mjs:28` also cites the 10-31
   answer. Rewording the title without the evidence column breaks the trace check. Keeping the old
   title leaves a test whose name says "four".
   Change: add the title rename and the R-1140 evidence-column edit to the forecast. The row's own
   rule text ("at most four lanes building and two more in planning, …") also changes, which the
   plan does cover as "R-1140 reworded".

## NOTE

10. **NOTE — Q1 adds a planning number the owner did not ask for, and it doubles the refusal
    table.** The owner's words name only "the lane limit". A bare integer, `"lanes": 2`, read as
    the building count, with planning left at the ruling's fixed 2, cuts must-meet 3 from 13 cases
    to about 6. It also drops the `{}`, missing-key and extra-key cases. The plan already lists
    this as the alternative answer. I'd make it the default, by the subtraction test.

11. **NOTE — the ruling's date and placement are not pinned.** The environment date is
    2026-11-01, but the plan dates the ruling 2026-11-02 (the owner's message date, likely another
    time zone; confirm). Must-meet 6 does not say where the bullet goes. The FEAT-040 known-bug
    removal (`docs/known-bugs/FEAT-040.md:17`) assumes date order is restored. Removing the 10-31
    bullet does restore it (`packages/nana-pack/rules/nana-rulings.md:31-33`), but only if the new
    bullet goes after the 2026-11-01 one. Pin "last bullet" or add a date-order assertion.

12. **NOTE — must-meet 1's "and the frozen desk see no change" claims nothing.** `apps/desk` does
    not read the roster (grep for `resolveRoster`/`nana-roster` under `apps/` finds only README and
    test prose). Strike it, so no reviewer spends time looking for it.

13. **NOTE — notice length.** Today the default notice is 144 characters, and a two-Claude-Code
    larger-builder roster's is 210 (measured with `rosterNotice` against `ROSTER_DEFAULTS` on this
    tip). Both are past 80 already, so A9's "about 25 more" changes no class of behaviour. Fine as
    planned. Note only that `roster-notice-config.mjs:29-31` records an earlier lane dropping a
    pointer for length. Keep the lanes text short ("lanes 2+1" would be 9 characters).

14. **NOTE — the `set` subcommand's stdout gains the `lanes:` line too.** It prints
    `formatRosterLines(result.roster, …)` (`bin/nana-roster.mjs:179`). R-1400 requires
    `setRun.stdout === plainRun.stdout` (`nana-roster-set.test.mjs:86`), so both must print the
    same effective line. This holds only if `formatRosterLines` maps `null` to the default. Name
    that in must-meet 2 so the builder does not print `lanes: none` in one path.
