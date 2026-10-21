# FEAT-029 — known bugs

*One line per known bug in this feature, moved from HANDOFF.md on 2026-10-21 and kept word for word. A review finding that does not block a land goes here as one line.*

- Runtime map: on Windows nothing tests a stop, the stop does not end the suite's tree, and short, linked and native forms of the repository path are not mapped; Linux's process listing is untested. Two measurements at once are not guarded. A coverage folder set by hand to an empty or relative path, an unreadable coverage file and hand-damaged data get no special handling. Copies run from a temporary folder and children stopped by a signal are not counted, and the impact view says so in its closing line.
- Blast-radius page (blast-radius): the code map links imports only. A module that tests only start as a process shows as having no linked test. At the lane's tip, 12 of 168 test modules import no mapped module. The label says so.
- Blast-radius page (blast-radius): the page reads no runtime data. That data differs per machine, so the same checkout would no longer give the same page.
- Blast-radius page (blast-radius): the templates do not ship the command. It reads only the TypeScript generator's map.
- Blast-radius page (blast-radius): the page names the merge base, not the tip. A merge of main changes it, and only a rerun shows a committed page is stale.
- Blast-radius page (blast-radius): a large change gives a tall page with crossing lines. It uses no layout library and routes no line. Nobody has yet looked at a large page in a browser.
- Blast-radius page (blast-radius): no check pins the refusals. A usage error exits 2, and a bad revision exits 1 and writes nothing. A map with header problems still draws.
- Blast-radius page (blast-radius): the code map's reader can find an import in a string or a comment, and the page draws that line too. The three open code-map questions cover it.
