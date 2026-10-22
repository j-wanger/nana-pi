# Fact-check (external) — plan-tree/CHANGE.md draft 1

Checker: outside read, 2026-10-14. "Ran" = run on this Mac (node 22.22.2, git 2.50.1, copier 9.19.1 via uvx). Probes: `fc-ext/`.
Line cites are at main `484329c` unless marked `@5b53ebc`. INFERRED = not read or run.

## 0. Base moved under the plan
- Roster LANDED: main went `5b53ebc` → `484329c` at 12:18:25 (`git reflog main`), two minutes after the draft. §4's roster overlap is moot.
- Stale cites: the queue line is now `HANDOFF.md:74` and reads "Now:", not `:72`; the CRLF residual is `:46`, not `:45`;
  `REQUIREMENTS.md:1503`/`:1706` are now `:1512`/`:1715`. Highest ID is R-1128; R-291's literal is 1,113 (`requirements-tree.test.mjs:38,52,53`).
- New overlap: lane seat-guide is also "Now" (`HANDOFF.md:73`). Its scope edits `REQUIREMENTS.md`, `templates-render.test.mjs`,
  R-291's literal (→ 1,116), the outline, code map, HANDOFF, session file, the shared working section and `AGENTS.md`
  (`~/nana-pi-wt/seat-guide/docs/reviews/seat-guide-2026-10-14/CHANGE.md:99-111,181-186`). T12's "1,124" is wrong if seat-guide lands first (1,127).
  The tree lane still leaves the working section and `AGENTS.md` alone, so only the ledger, two tests, outline, map and HANDOFF collide.

## 1. Fail-open exits in the any-project commands (ran)
- **UTF-16 ledger passes.** Windows PowerShell 5.1 `>` and `Out-File` write UTF-16LE with a BOM; PowerShell 7 writes UTF-8 [1].
  `parseLedger` reads UTF-8 and strips only U+FEFF (`requirements-tree.mjs:61`). Ran (`fc-ext/utf16.mjs`): a UTF-16LE copy of the
  tree render AND of a 1,000-row flat ledger both give 0 headings, 0 tables, 0 problems. R-1157 as written then prints
  "0 problems; rows 0; features 0" and exits 0. The report would also build (INFERRED: `buildReport` only throws on problems, `product-report.mjs:205-206`).
  Fix: refuse a ledger with a NUL byte or with zero rows/features in `--root` mode. The threat model names "a BOM" but not UTF-16.
- **Symlinked or junctioned checkout exits 0 silently.** Both main guards compare `argv[1]` to the realpath of `import.meta.url`
  (`requirements-tree.mjs:407`, `product-report.mjs:318`). Ran: through a symlink to the checkout, `--bogus` exits 0 with no output
  for both CLIs (direct: exit 2). R-1156's `"$HOME/nana-pi/…"` form makes any linked `~/nana-pi` a silent pass. Fix: compare realpaths. T8/T13 never run through a link.

## 2. Transition gap: the skills stop fitting every existing ledger
- Every scanned project ledger is flat or a hand-built tree with problems (`research-adopt.md:30-36`); the triggering Windows project is flat.
  The lift is deferred to lane 2 (§1 Split). Yet T5/T6 pin the ABSENCE of "numbered section" in the skills (CHANGE §5).
  In a flat project, a numbered section is the only valid home. The new text says the owner decides every tree change. So a seat must either break the skill or stop.
  §3.4's carve-out covers only adopt-py/ts. The requirements skill gets none. Fix: one interim sentence ("a flat ledger: add to the matching section until it is lifted").
- **First adopt run on 1,000 flat rows (ran, `fc-ext/flat1000.mjs`, 40 sections in 4 Parts):** copier skips REQUIREMENTS.md (`copier.yml:16`) but renders the
  tree-shaped REQUIREMENTS-general.md (not skip-listed; R-581). adopt-py step 7 sends the seat to audit mode, which is for "an existing project with no rows yet"
  (`requirements/SKILL.md:128`). The checker finds 1,000 problems, all "not in a feature or subgroup table": 54,102 bytes in 18 ms.
  The report exits 1 with 1,005 lines and 54,597 bytes on stderr. That exceeds Claude Code's 30,000-character inline window [2] and pi's
  2,000-line/50 KB cap (`pi-coding-agent/dist/core/tools/truncate.js:10-11`; pi 1.0.2). The seat sees a truncated wall of one message with no next step.
  5,000 rows: 278 KB, 67 ms. Speed is fine; output is not. Fix: summary first (count by kind, first N lines) in `--root` mode.
- **Claude Code seat parity.** That seat gets only `requirements` among pack skills (`packages/nana-setup/lib/steps.mjs:58-59`).
  Scaffold and adopt skills are pi-only (`packages/nana-setup/README.md:178-179`), so R-1155 reaches pi only.
  `nana-setup project` seeds no REQUIREMENTS.md (`packages/nana-setup/README.md:198-203`); adopt-structure writes none (`adopt-structure/SKILL.md:170-172`).
  So §3.4's "a project with no seed starts from the adopt render's tree" has no route from the Claude Code seat. It has none for a non-Python/TS project either.
  Option: one language-neutral seed in `templates/_shared/`, like OBJECTIVE/HANDOFF. That needs a nana-setup change, which §3.5 excludes; the owner's call.
- On Windows the requirements skill is a byte copy, not a link (`steps.mjs:218-226`). It stays stale until `nana-setup install` re-runs; doctor flags the drift
  (`doctor.mjs:101-104`). §4 "Release" does not say this.

## 3. "Heading IDs cannot collide" is false for a real project (ran)
- REQUIREMENTS-general.md is not skip-listed (`copier.yml:13-20`). Every copier-tracked project's next `copier update` gets §3.1's
  `CAP-02`/`FEAT-002`/`SUB-001…005` in that file. The hand-built tree project on this Mac (copier v0.6.7 TS) already uses
  `# CAP-02` (its line 164) and `## FEAT-002` (line 79) for product features (ran: grep). When its seat follows §3.4 and copies the general shape
  to fix its 22 G-row problems, `checkUniqueHeadingIds` fails (`requirements-tree.mjs:150-153`). Lane 2's sketch has the same clash: it numbers Parts `CAP-nn` in
  file order but writes Part G as §3.1's fixed `CAP-02` (§3.6).
- G-last (J2) repeats the one drift seen in the field: that project has four features appended after Part G (`research-adopt.md:46-49`).
  The plan admits a feature inserted above `# Open questions…` nests silently under CAP-02. No project-side check exists (J3).
  Cheap guard: the checker flags a capability whose features mix G rows and R rows.

## 4. Copier facts (ran or sourced)
- `copier update` excludes skip-listed files from the re-applied patch. In copier 9.19.1 `_main.py`, the update code passes `--exclude=<file>` for each
  `skip_if_exists` match. A missing skip-listed file is recreated [3]. So the ledger never conflicts and is never reshaped by update. Plan §4 "Release" holds.
- Jinja turns CRLF template source into LF (ran: jinja2 3.1.6, `keep_trailing_newline=True` as copier sets it [3]). Fresh renders are LF even from a CRLF clone.
  CRLF comes from a Windows clone of a project: the Git for Windows installer's default is `core.autocrlf=true`, set at system level [4]. R-1158 is needed for that case.
- `.gitattributes` has no `eol` rule (read), so a Windows clone of nana-pi itself is CRLF too (residual 6 stands).
- Copier refuses a dirty destination ("Destination repository is dirty; cannot continue", `_main.py` ~1358). Conflicts default to inline markers [3].
  A locally edited REQUIREMENTS-general.md gets `<<<<<<<` markers when its headings change. The rails skip non-`|` lines, so the markers can be committed unnoticed (INFERRED).

## 5. Windows and Node facts
- CI Windows legs run `shell: bash` (`.github/workflows/ci.yml:27-29,51-53`), and T8/T9/T13 spawn node with no shell. So no test runs the R-1156 command under PowerShell 5.1 or 7.
  The claim "PowerShell 5.1 expands `$HOME`" is right per docs (`$HOME` = USERPROFILE), but no test pins it.
- Git Bash takes `HOME` from the environment when it is set. On managed machines that can be a network share, while PowerShell's `$HOME` stays USERPROFILE [5].
  So one `"$HOME/nana-pi"` can name two places on one machine (INFERRED for the work machine).
- PowerShell 5.1 turns redirected native stderr into NativeCommandError, and `$ErrorActionPreference='Stop'` makes it terminating. 7.2 stopped applying ErrorAction to it [6].
  The report prints `MODULE_TYPELESS_PACKAGE_JSON` on stderr on every run (ran). Under 5.1 with `2>&1` and Stop, a passing report run aborts (INFERRED: the seats' PowerShell wrapping is unread).
- Correction to residual 4: the checker prints no such warning today. Ran: `--check` exits 0 with 0 warning lines, because `process.exit` runs before the warning flushes.
  Only the report, which sets `process.exitCode`, shows it. If the builder moves the checker to `exitCode`, the warning appears.
- Node 22.18.0 turned type stripping on by default [7]. There is no `engines` field (root `package.json`), so older Node fails loudly on the `.ts` import, not silently (INFERRED).
- Machine path frozen in a contract file: T4 puts `node "$HOME/nana-pi/scripts/requirements-tree.mjs" --root .` into every rendered REQUIREMENTS.md.
  That file is skip-listed, so no later fix reaches it, e.g. a PATH link from the maintainer-tools lane. The pi `git:` install route has no `~/nana-pi` checkout (`README.md:163-170`).
  Keep the command in the skill (live) and leave it out of the seed.

## 6. Scope against the owner's words ("templates seed the tree, the adopt step sorts a flat ledger into it, the product report runs in any project")
Traces: R-1150–R-1153 (seed), R-1154–R-1155 (default behaviour the question names), R-1156 (report reachable), R-1158 (Windows trigger).
Scope creep, one line each:
- **R-1159 report title from the ledger H1, plus a sealed fallback, a `<title>` placeholder and nana-pi's heading change (S7):** the report already runs elsewhere (`research-tree.md` §4, exit 0); this is cosmetic.
- **R-1160 clean-check exclusion through git pathspec magic:** the report already runs; only the "dirty" label is wrong. `--out` outside the root, or one ignore line, avoids it.
  Untested on Git for Windows; a case-mismatched `--out` would miss the case-sensitive literal pathspec (INFERRED).
- **R-1157 standalone `--root` checker with a new stdout contract:** borderline. The report already prints every checker problem. It is justified only as a check that needs no HANDOFF or git.
- **R-1153 "The project owner decides every change to the tree" in every project:** this extends the owner's nana-pi rule (`REQUIREMENTS.md:34`) to all projects without his words.
Not creep: the `How this file is organized` section, the closing H1, and J3/J4 deferrals.
Frame note: the split DEFERS one of the three agreed parts, and the trigger stays broken (J1). Lane 2's lift renames Parts and sections into CAP and FEAT headings
with "Not yet sorted" purposes. That gives tree form, not tree design. Whether that is the "sort" the owner meant is unasked.

Sources: [1] https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_character_encoding ·
[2] https://github.com/anthropics/claude-code/issues/19901 · [3] https://copier.readthedocs.io/en/stable/configuring/ and /updating/ ·
[4] https://bornsql.ca/blog/the-hell-of-git-line-endings-and-the-not-so-simple-fix/ · [5] https://github.com/git-for-windows/git/issues/1878 ·
[6] https://github.com/PowerShell/PowerShell/issues/15862 , https://github.com/PowerShell/PowerShell/issues/14273 · [7] https://github.com/nodejs/node/releases/tag/v22.18.0
