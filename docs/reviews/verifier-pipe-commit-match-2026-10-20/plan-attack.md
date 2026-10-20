# verifier-pipe-commit-match — plan attack (one adversary)

Verdict: AMEND

AMEND. The lane is worth building. The red-today claims hold. I probed main 72abe19a in a temp folder: all 8 discarded shapes ask, all 12 git spellings give no reason, `my-git commit` asks, and the pi headless gate blocks both `;` shapes, bash and PowerShell. The class is right: install, hook or gate. No build waits on another lane.

I attacked the plan with a throwaway prototype of its design, in a temp folder that I have since deleted. I also ran a one-pass scan of 8 days of local transcripts: 2,820 unique Bash commands that contain a pipe and "commit". The amendments:

1. **`$?` read anywhere later is too wide.** On that scan, 402 commands ask today. The plan as written would still ask on 141, and 25 of those ask only because a `$?` reads another command's status, such as `pnpm check >/dev/null 2>&1; echo "check $?"`. The amended rule counts a `$?` only in the command right after the pipeline. That gives 118 asks, with 0 asks where today has none. A new R-2350 case pins it, and that case is red under the plan as first written.

2. **Backtick regression in the commit finder.** The plan's left-neighbour set has no backtick, so `` echo `git commit -m x` `` stops asking. Today it asks. The amendment adds the backtick and a pinned R-2352 case.

3. **The `;` path dropped true reads through a group or loop.** `{ P; } 2>&1 && git commit`, `for …; do P; done && git commit` and `if …; then P; fi && git commit` all lose their ask. The scout spec says to keep every case where the status can stop the commit. The amendment: after a separator, an unmatched `)` or `}` is passed over, and so is a bash `fi`, `done` or `esac`; the scan then goes on. `|&` is now pinned by a test.

4. **PowerShell `& "$env:ProgramFiles\Git\cmd\git.exe" commit` is missed.** The plan's quoted-word exposure refuses any string with `$` in it. The amendment refuses only `$(` and backticks.

5. **A vacuous gate check.** The R-983 check "existing gate hit keeps precedence" at pipe-guard.test.mjs line 166 uses `rm -rf /tmp/x | cat; git commit`. Under the new rule the pipe reason never fires there, so the check passes whatever the precedence. It moves to `&&`, with a wrong-code pair on nana-gate.ts.

6. **Wrong-code pair 15 was too weak** ("at least one negative asks"). It is replaced by an unmasked-liveText pair that must turn every hidden-pipe negative red, and the builder lists any that survives.

7. **A row wider than its test.** R-2356 promises path spellings, but its test checked only `git.exe`. The test now also matches /path/.

8. **New R-2357 for the pi user.** The headless pi gate lets a `;`-discarded pipeline through. It is red today: the gate blocks it. This mirrors R-2355 for Claude Code.

Also: the reader and closer vocabularies become named constants with contract provenance. Then/do and the keyword closers apply to bash only.

**Lane overlaps.** I read the slate specs; the plan had guessed from lane names. win-hook-variant-loop touches settings.mjs and hook-health.mjs. claude-config-dir touches paths.mjs and nana-setup.mjs. gate-stop-names-config touches config.ts and pack README lines 546–551. None of them touches this lane's code or test files. They overlap only on REQUIREMENTS.md, the READMEs (line 43 of the pack README and line 64 of the setup README here, versus line 257 for lane-guard-temp-root), the code map and the tree. rm-outside-asks only re-runs pipe-guard and expects 84 PASS lines, so whichever lane lands second updates that count. Land order: after lane-guard-temp-root, which is in final review, so FEAT-010 merges once; any order against the rest.

**Checked without running it.** I string-searched the Claude Code binary and the pi bundle and found no errexit setting, so a `;` really discards the status. I did not run either tool to confirm this.

**The one claim most likely wrong:** the relief figure. The prototype says about 70% fewer prompts (402 to 118 unique commands), not the scout's 194 of 200. The `| head -3 && …` chains (76) and `git archive | tar -x && …` copies (about 25) keep asking by design. The owner should hear that number before the land.
