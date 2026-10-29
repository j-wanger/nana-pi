# pi-seat-guide · plan attack (adversary, 2026-10-29)

## MUST

1. **The seat test must read an injected env, not `process.env`.** A builder runs the suite with `NANA_ROLE=worker` (pi-worker.mjs:90,163). A test that reads `process.env` passes for the seat and fails for the builder. Fix: take `env` as an option, as `projectStaleLine(dir, { env })` and nana-frontier-summary's `opts.env` do. Test by `LAUNCHER_ROLES.includes(env.NANA_ROLE)` (stale-copies.mjs), not "unset". Restate 2 and 3 as "NANA_ROLE not in LAUNCHER_ROLES" and "NANA_ROLE in LAUNCHER_ROLES", each with an injected env.

## SHOULD

1. **The guide contradicts itself for a pi seat.** Bullet 1 tells pi to run each builder as one foreground command. Bullets 7 and 11 tell the seat to start another lane's build before its turn ends and to keep two lanes building. A foreground pi seat can do neither. Fix: in this lane, give the pi clause one sentence on parallel lanes, or record the gap as a known bug.
2. **Must-meet 6 would break the R-1140 test.** The guide holds twelve bullets, and seat-rule.test.mjs pins twelve. The row says "twelve" but lists ten, because R-3012/R-3013 added two. "Corrected to the rules it lists" reads as twelve→ten. Fix: keep twelve and add the two question rules to the row's list.
3. **The precedent leaves out state-manifest and copy-record.** Uninstall removes rows from `stateRows` (state-manifest.mjs:62-63), not from steps.mjs. Windows copies go through `rememberCopy` and `copyRecord.unedited`. Fix: add both files to Precedent.
4. **The stale copy is in the threat model but no must-meet covers it.** nana-rulings sets STALE_SECTION when the installed link differs from the shipped file. Fix: extend must-meet 5 to say a POSIX copy or a stale win32 copy is FAIL (the R-1414 shape). Add the guide to the extension's stale-notice label list.
5. **Install-check does not cover the guide.** judgePiTurn checks only `rulingsHeading` (install-check.mjs:231). OVERRIDE_ENV already clears NANA_ROLE, so the faux turn runs as a seat. Fix: add the guide heading to PI_TURN and add a `missing-seat-guide` code.
6. **The new cap needs a seal test.** The guide is 2,582 bytes, about 650 tokens per seat session. Fix: add `SEAT_GUIDE_READ_CAP` with provenance in a config module, and one seal test naming its row.

## NOTE

1. Desk and owner TUI sessions get the guide. That is correct, because they are seats. Sessions from pi-subagents, the bench and the install-check turn carry no NANA_ROLE, so they get it too. Record the token cost and the bench baseline change as a residual.
2. The issue-watch paragraph reads correctly in pi. The frontier extension runs the watch, but only when `ctx.hasUI`. A headless `pi -p` seat has no watch, and the guide does not say so.
3. O1 widens nana-rulings' `@purpose` to a second job. Rewrite the header so it stays one sentence.
4. Must-meet 4 matches R-1411. It also needs its own `SEAT_GUIDE_UNAVAILABLE` prefix, so a reader can tell the two markers apart.
5. AGENTS' runtime table has no seat-guide column; decide whether it needs one.
