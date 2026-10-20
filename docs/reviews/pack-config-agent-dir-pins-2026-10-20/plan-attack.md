# pack-config-agent-dir-pins — plan attack (one adversary)

Verdict: AMEND

AMEND (two changes and one simplification; class, rows, files and conflicts unchanged). All findings come from a temp clone of main 385c633f with a temp HOME, on macOS and Node 22.22.2.

Confirmed as planned:
- The three new checks pass on main. Each of W1 to W7 turned its named check red. W5 also turned the three existing (a) checks red. W7 also turned config-normalize and post-edit-status red.
- With the rows flipped, requirements-trace exits 0, req:tree leaves docs/requirements-tree.md unchanged, and map:check and readme:check report 0 problems.
- syncBuiltinESMExports makes the wrapped node:fs functions reach the fs namespace that config.ts, bounded-read.mjs, adoption.mjs and nana-roster.mjs import.

Change 1: R-193's check was narrower than its row.
- The row says the default dir's file shall not be read. That covers the whole pack, not only loadConfig.
- Two more pack readers of nana-pack.json exist. One is lib/adoption.mjs adoptionSettings, used by the Claude Code adoption producer and by handoff. The other is bin/nana-roster.mjs resolveRoster, used by the roster-notice extension and the nana-roster command.
- W8: resolveRoster falls back to the default dir when the active file is absent. W9: adoptionSettings does the same.
- Each stays green in nana-roster, roster-notice, nana-roster-set, adoption-producer, adoption-reader and agent-dir-parity. I probed both on main's code with exit codes 0.
- Each turns red only once the spy also runs adoptionSettings() and the roster-notice extension's session_start. The widened check stays green on main.
- The cost is two imports and three lines.

Change 2: R-781 still reads wider than its pin ("every other extension").
- The pin asserts post-edit, lifecycle and the objective. It does not assert notify, handoff, writing or roster-notice. nana-rulings reads no config.
- The repo precedent for this is R-923, an implemented row whose Evidence starts with "Declared limitation:". The trace accepts that form.
- So R-781's Evidence now names the unasserted extensions. The flipped row then does not claim more than its check covers.

Simplification: R-825 reads the journal at the dir it expects.
- It counts lines in <dir>/nana-journal.jsonl directly. It no longer calls loadConfig a second time to find the journal, because that call can itself write mismatch lines.

Checked and kept:
- The gate = 7 exclusion for post-edit is a choice, not a necessity. The harness's post-edit still feeds back under a gate stop. The exclusion stays because, in pi, a stopped gate blocks the edit first, so the case does not reach the user.
- Post-edit on win32 classifies exit 1 from `node -e` as checks_failed. Both outcomes print the same failure header, so the check is robust.

Class: ordinary (tests and rows only). No in-flight lane touches either test file. docs/code-map.md is regenerated on merge. No step writes outside the worktree or os.tmpdir().

Claim most likely wrong:
- syncBuiltinESMExports behaving the same on the Linux and Windows CI legs. It was probed only on macOS with Node 22.22.2. The guard (the active file's open must be recorded) turns that failure loud rather than silent.
- Second: the roster-notice handler runs cleanly under the test's UI ctx on Windows. Its errors are swallowed inside its own try, so a failure there would only shrink coverage. The active-path guard still holds through loadConfig.
