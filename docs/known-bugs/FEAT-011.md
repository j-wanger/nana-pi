# FEAT-011 — known bugs

*One line per known bug in this feature, moved from HANDOFF.md on 2026-10-21 and kept word for word. A review finding that does not block a land goes here as one line.*

- Gate stop (gate-stop-names-config, independent check and plan): pi's gate keeps its old stop for three kinds of config file. They are one pi cannot read, one over the size cap, and one whose top level is not an object. That stop still calls the gate block malformed.
- Agent folder config on Windows (pack-config-agent-dir-pins plan): nobody has run the left-behind file note through another spelling of the default agent folder on Windows. The plan reasons that it cannot misfire. The adversary probed letter case on macOS only. The plan infers the short-name case.
- Malformed config (pack-config-agent-dir-pins): no check reads the output of notify, handoff, the writing check or the roster notice under a malformed config. Another check pins only that their handlers do not throw. The requirement states this limit.
- Gate parse stop checks (gate-stop-names-config, final review): the two parse-stop checks assert the advice and the place. They do not assert the stop's opening words or the file name. An older check covers both for one kind of error only.
- Gate parse stop (gate-stop-names-config, final review): the stop's problem text is still built when the parse branch does not use it. That is harmless.
