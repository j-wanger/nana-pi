# Independent check — gate-rm-gitbash-tmp at 731f5a22 (2026-10-21)

One independent agent (Claude, general-purpose, not the builder's lineage) probed the reader in a scratch export of 731f5a22 and of main bc529014. A module-resolve hook mapped `node:path` to `path.win32` for both copies, so the reader ran on macOS as it would on win32. Verdicts were compared against a Git Bash model built from msys2-runtime source (msys2-3.5.4 `mount.cc`, `path.cc`).

Verdict: NO MATERIAL FINDING. The translation adds no under-ask on any honest Git Bash spelling tried (52 spellings with TMP = TEMP = a user temp folder).

What held:
- Every listed honest spelling runs unasked or asks correctly; mixed-target lines name the outside target. Four under-asks the model flags are identical on main (a relative target after an unreadable `popd`, and three `/Users/...` spellings Git Bash reads under its own install root, which normally does not exist).
- PowerShell `/tmp`, darwin and linux are not translated; `//c/x`, backslash spellings, `/cygdrive/c`, `/mnt/c`, `/TMP` and `C:/` come back unchanged.
- TMP or TEMP at a drive root, the home folder or above it, and neither set, all still ask. The translation never touches the temp roots.
- Floor: `commandHit` returns on a policy or floor danger before `markOutside`, which only adds non-floor asks. The translation cannot weaken a floor ask.
- Linux `/tmp` fixture trap: no win32-injected check behaves differently on a Linux runner.

Findings (none MUST):
- SHOULD — `..` after a link inside the temp folder runs unasked: `rm -f /tmp/linkout/../x`, with `linkout` a link to an outside folder, collapses to `TMP\x` before any disk read. Git Bash resolves the link before dropping a component (path.cc normalize_posix_path), so it deletes `x` beside the link's target. The same gap holds for the working folder on every system. Seat: a known limit; build 5 corrects the row and README wording that said the gate collapses `..` "as Git Bash collapses it".
- NOTE — the policy-file floor does not read the Git Bash `/tmp` spelling: with the agent dir under TMP, `rm -f /tmp/<agentdir>/nana-pack.json` gets no floor ask. Main asked only through the rm-outside reader, which misread it as `C:\tmp\...`. No floor ever covered this spelling. Seat: a residual beside the `/c/` floor one.
- NOTE — two known-limit claims are not always true: `/usr`, `/etc`, `/home` spellings can land inside the working folder (same on main), and `cd /tmp && rm -f ../Temp/x` runs unasked, while Git Bash reads it under its install root. Seat: build 5 corrects the README; the HANDOFF lines say "usually".
- NOTE — `normalizeWindowsShellPath` in `lib/agent-dir.mjs` also reads `/c/...` with pi's rules; a cross-reference comment would stop a merge. Seat: build 5 adds it.

Scripts: the seat's scratch folder (`indep-gate/`: probe-win, probe-win-main, probe-env, probe-link, probe-posix and a path shim); not committed.
