# FEAT-004 — known bugs

*One line per known bug in this feature, moved from HANDOFF.md on 2026-10-21 and kept word for word. A review finding that does not block a land goes here as one line.*

- knowledge-refresh-pin: nobody knows how Claude Code ends a hook's processes. The tests stand in with a process-group kill on macOS and Linux, and the hook's own exit on Windows.
- knowledge-refresh-pin: the check for a build still tied to the hook works only while the build outlives the hook. That margin is about 100 ms on macOS.
- knowledge-refresh-pin: a wrong version of the code that builds inside the pull leaves a second build after the pi test's cleanup. That build indexes the home folder's stores. So wrong-code tries run only under a temp home.
- knowledge-refresh-pin: on Windows the background build starts without the hide-window flag. Its detached start gives it no console, so no window should show (inferred). Nobody has watched a Windows desktop for one.
- Knowledge pull in pi (knowledge-pull-fail-open-pin): no test covers a missing node program at pi's handler. The test runs its own node, so it can only remove the pull command's file.
- Knowledge pull in pi (knowledge-pull-fail-open-pin): the late case proves only a deadline under 10 seconds, not the 2-second value. A 9-second deadline would stay green. No requirement seals that value.
- Knowledge pull in pi (knowledge-pull-fail-open-pin): removing pi's error listener on the pull command's input stays green. The test's prompt fits the pipe before the stand-in command exits, so no broken-pipe error occurs.
- Knowledge hook input (knowledge-pull-fail-open-pin): the tests pin the input cap at its edge, not by memory use. A hook that read all its input and then cut it would stay green.
- Knowledge pull in pi (knowledge-pull-fail-open-pin): a broken handler that never settles makes the test file exit with code 13. It does not fail the no-throw check by name. The handler's own timer does not keep the test running. A guard timer in each case would fix that.
