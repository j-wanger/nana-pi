# FEAT-011 — known bugs

*One line per known bug in this feature, moved from HANDOFF.md on 2026-10-21 and kept word for word. A review finding that does not block a land goes here as one line.*

- Gate stop (gate-stop-names-config, independent check and plan): pi's gate keeps its old stop for three kinds of config file. They are one pi cannot read, one over the size cap, and one whose top level is not an object. That stop still calls the gate block malformed.
- Agent folder config (pack-config-agent-dir-pins): the no-read check watches only reads through Node's file functions in the test's own process. It does not see a child process's read or a file copy. A copy of the left-behind file into the active folder still fails this check and the gate settings check.
- Agent folder config (pack-config-agent-dir-pins): the no-read check runs only the pack's own readers. It does not run nana-setup install or doctor, which belong to the install feature.
- Agent folder config on Windows (pack-config-agent-dir-pins plan): nobody has run the left-behind file note through another spelling of the default agent folder on Windows. The plan reasons that it cannot misfire. The adversary probed letter case on macOS only. The plan infers the short-name case.
- Malformed config (pack-config-agent-dir-pins): no check reads the output of notify, handoff, the writing check or the roster notice under a malformed config. Another check pins only that their handlers do not throw. The requirement states this limit.
- Malformed config (pack-config-agent-dir-pins): the builder's wrong-code tries ran on macOS with Node 22 only. The plan found no post-edit fault that only the new malformed-block check catches.
- Seat probes (pack-config-agent-dir-pins build): the builder ran one wrong-code try in the lane worktree, not a temp clone. The roster lookup's fallback then read the real home's nana config file once. It only read, and the builder reverted the code. Wrong-code tries belong in a temp clone with a temp home.
- Agent folder config (pack-config-agent-dir-pins, review): the left-behind file note counts only when its text names the agent folder. A rewording would make that half count none, quietly. The journal half matches the event name.
- Agent folder config (pack-config-agent-dir-pins, review): the no-read check records paths as text, so a file URL or a byte path would slip past it. No pack reader passes either today.
- Agent folder config (pack-config-agent-dir-pins, review): the no-read check does not run the worker config command or the roster setter.
- Gate parse stop checks (gate-stop-names-config, final review): the two parse-stop checks assert the advice and the place. They do not assert the stop's opening words or the file name. An older check covers both for one kind of error only.
- Gate parse stop (gate-stop-names-config, final review): the stop's problem text is still built when the parse branch does not use it. That is harmless.
