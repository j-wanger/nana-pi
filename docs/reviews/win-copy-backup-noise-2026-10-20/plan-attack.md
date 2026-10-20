# win-copy-backup-noise — plan attack (one adversary)

Verdict: AMEND

AMEND: the design holds up, but four rows were wider than their tests, one save-failure path had no test, and two brief steps were ambiguous enough to build wrong.

What the probes showed. All of them ran in a temp folder with a cloned checkout and temp homes. I removed the folder afterwards, the real repo stayed clean, and no probe processes were left running.
- On today's code, a forced-win32 install with two source changes to nana-soul.md, nana-rulings.md and spec/SKILL.md left 8 dated backups across rules, skills and the pi agent folder. This confirms R-2310 is red.
- I built a 30-line prototype of the plan's design: a new copy-record module, an `unedited` predicate in fsops, the three win32 copy sites, and the layout key plus inventory row. The same scenario then left 0 backups.
- On the prototype, the dry run printed "would refresh" and left the home byte-identical. Today it prints "would back up to nana-soul.md.bak-20261020 and copy", so R-2315 is red.
- Owner edits to the rule, skill and pi rulings copies each got exactly one backup holding the owner's line, on both today's code and the prototype. R-2311 is a green guard. The prototype also stopped backing up the one copy the owner had not edited.
- An absent record, `{not json` and `["x"]` each gave one backup per changed copy. R-2312 is a green guard.
- Install, delete the record, install, change the sources, install: today this leaves 4 backups and the prototype leaves 0. R-2313 is red.
- A directory at the record path, and separately a read-only `{}` file, each gave exit 0 and one skipped copy-record row on the prototype, with the knowledge and pi rows still printed. Today neither prints a row, so R-2316 is red.
- Keying the record by file name instead of full path turned the R-2310 scenario red: the five skills all have a SKILL.md, and the two rulings copies share a name.

Checking the plan's own weakest claim. I ran 21 existing nana-setup test files one at a time against the prototype. All passed except restore.test. restore.test fails the same way on the unmodified clone (a global pi module path in my environment), so the prototype did not cause it. No existing test breaks on macOS with forced win32. The native Windows leg is still unchecked. I also found that uninstall.test's install-then-uninstall round trip (R-903/R-905) already catches "write the record on POSIX".

Amendments:
1. R-2311 and R-2312 said "managed copy", which also covers the PATH launchers. Both rows and tests now name the three wired kinds: rule copies, skill mirror files and the pi rulings copy. R-2311's test now edits all three.
2. R-2316 said "cannot save", but a directory only reaches writeIfChanged's SKIPPED branch. So a save without try/catch would still pass. I added a read-only file case, which reaches the catch on both POSIX and Windows, and narrowed the row to exactly those two cases. Under root on POSIX the read-only case cannot exist, so it prints SKIP and counts no PASS.
3. I dropped R-2314 (subtraction test). R-955 already fails if the layout key has no inventory row. R-954's install-coverage check, extended with the record as a win32-only target of kind "file", pins owner and kind. The class makes no difference on POSIX, where no record exists. R-954 also sits in FEAT-017, not FEAT-018. The ID stays unused.
4. The brief said to open the record inside withSettingsLock. The dry run never takes that lock, so it would see no record and R-2315 would fail. The record now opens at the start of fileSteps and saves at its end.
5. The plan allowed "a sha or a predicate". It is now a predicate, because copy-record imports fsops and fsops must not import copy-record back.
6. R-2310's test now also checks that each copy equals its new source. Without that, code that skipped the refresh entirely would pass.
7. The README install table gets a row for the new Windows file.

Lane class is right: it changes nana-setup install code. In-flight check: review-ledger-run-win-launch has already landed (main is at 72abe19a), so nothing in flight blocks this build.

Slate notes. I read no other plan; these overlaps are inferred from lane names.
- steps.mjs: install()'s fileSteps tail near stepPath (doctor-path-row-remedy); the stepPiConfig rulings line (objective-path-shapes); linkSkill and stepSkills (linked-claude-folder-remedy).
- If linked-claude-folder-remedy adds an ancestor check before writing into a linked Claude folder, the record save must follow the same rule at merge.
- The user's request says six lanes and this slate has seven. This is the lowest-value lane to defer if the seat holds to six.

The claim most likely to be wrong is that the native Windows leg passes unchanged. Two things there are untested: the read-only case (chmod 0o444 should give EPERM), and every existing native-Windows test whose home now gains the record file. On macOS this held only with forced win32. A second untested inference: Claude Code ignores a JSON file at the Claude folder root.
