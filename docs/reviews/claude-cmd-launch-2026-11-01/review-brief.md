Feature: FEAT-040 · Make and keep memory

Lane claude-cmd-launch. Class: ordinary. Threat model: honest variation in our tools' output is in scope (npm shims in either layout, native `claude.exe` first on PATH, spaces in paths, the `Path` key, arguments with quotes, percent signs, exclamation marks and backslashes); deliberate forgery, such as a planted shim or package, is out.

This lane was planned and built on the owner's Windows laptop by the sub-seat with the roster's pi builder; the seat merged main on the Mac (c0195c90). Review `git diff origin/main...HEAD` on `feat/claude-cmd-launch`. The plan of record is `plan.md` in this folder, revision 2 after `plan-attack.md`; `build-brief-1.md` and `build-brief-2.md` record the builds; `probe-npm-claude.txt` and `real-npm-claude-win32.txt` hold the laptop evidence (a real call through an npm install, before and after). The 2026-11-01 entry "memory making starts an npm-installed Claude Code on Windows" in `docs/sessions/2026-10.md` summarises the lane.

Question: does memory making now start an npm-installed Claude Code on Windows with exactly the same arguments, stdin, environment, timeout and `windowsHide`, no shell touching argv, and a native `claude.exe` still preferred when it is first on PATH; is behaviour off Windows, and with an injected spawn, unchanged; are the shared Windows launcher and the review and builder launchers untouched? Does the change cause a harm the review standard lists? The builder exported `claudeCommand` where the plan named `resolveClaudeLaunch`; judge only whether it matters.

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
