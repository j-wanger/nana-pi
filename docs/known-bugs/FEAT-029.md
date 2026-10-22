# FEAT-029 — known bugs

*One line per known bug in this feature, moved from HANDOFF.md on 2026-10-21 and kept word for word. A review finding that does not block a land goes here as one line.*

- Runtime map: on Windows nothing tests a stop, the stop does not end the suite's tree, and short, linked and native forms of the repository path are not mapped; Linux's process listing is untested. A coverage folder set by hand to an empty or relative path, an unreadable coverage file and hand-damaged data get no special handling. Copies run from a temporary folder and children stopped by a signal are not counted, and the impact view says so in its closing line.
- Blast-radius page (blast-radius): the code map links imports only. A module that tests only start as a process shows as having no linked test. At the lane's tip, 12 of 168 test modules import no mapped module. The label says so.
- Blast-radius page (blast-radius): the page reads no runtime data. That data differs per machine, so the same checkout would no longer give the same page.
- Blast-radius page (blast-radius): the templates do not ship the command. It reads only the TypeScript generator's map.
- Blast-radius page (blast-radius): the page names the merge base, not the tip. A merge of main changes it, and only a rerun shows a committed page is stale.
- Blast-radius page (blast-radius): a large change gives a tall page with crossing lines. It uses no layout library and routes no line. Nobody has yet looked at a large page in a browser.
- Blast-radius page (blast-radius): no check pins the refusals. A usage error exits 2, and a bad revision exits 1 and writes nothing. A map with header problems still draws.
- Blast-radius page (blast-radius): the code map's reader can find an import in a string or a comment, and the page draws that line too. The three open code-map questions cover it.
- Runtime map (runtime-map-live, plan): a land refused after its suite passed leaves the map at a tip main never reached. Impact says the tip is not on main until the next land.
- Runtime map (runtime-map-live, plan): the plain rerun can pass a file that failed once under coverage. Each rerun file is printed as a land note, and the map keeps its FAIL label.
- Runtime map (runtime-map-live, plan): Windows lands never measure, Linux lands are untested by hand, and CI never measures.
- Runtime map (runtime-map-live, plan): old data without a tip prints no freshness line.
- Runtime map (runtime-map-live, plan): a land needs about 1 GB of temp space. A full disk crashes the coverage run with no completion record, so the land fails with no rerun (read from the code by the independent check).
- Runtime map (runtime-map-live, plan): only the locked suite measures. A land run with `--suite "npm test"` leaves the map as it was.
- Runtime map (runtime-map-live, plan): a file added since the measure marks no test stale, because no measured test ran it. The freshness line still counts it.
- Runtime map (runtime-map-live, plan): every land now measures under coverage, which adds about 27% to a CPU-heavy file's seconds. So the map's seconds read high next to a plain run.
- Runtime map (runtime-map-live, independent check): impact never shows the `dirty` count, so a hand measure in a dirty worktree reads as a clean tip. Staleness still works, because it compares file hashes.
- Runtime map (runtime-map-live, independent check): the hand measure counts a staged rename twice, and takes the dirty count before it waits for the lock, not inside it.
- Runtime map (runtime-map-live, independent check): impact prints "main is 1 commits past".
- Runtime map (runtime-map-live, independent check): the README's product report paragraph still says the labels come from the last `map:measure`; every land now writes them too.
- Runtime map (runtime-map-live, final review): the coverage rerun returns its own exit code without checking for a stop signal that arrived during it. The result is still non-zero, because the runner exits 130 or 143 on a stop.
- Runtime map (runtime-map-live, final review): an error from the dead-folder sweep or from making the coverage folder reaches the outer catch, so the land exits 1 before its suite runs. Another user's dead coverage folder in a shared Linux temp folder would do it.
