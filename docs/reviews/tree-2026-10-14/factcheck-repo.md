# Repo fact-check — `tree` CHANGE.md, seat draft 1

I checked each claim against `5b53ebc`, the plan's base, using a `git archive` export. "Now" means `main` at `484329c`.
Roster fast-forwarded onto main at 2026-10-14 12:18:25 (reflog), two minutes after this draft was written.
"Ran" means I re-ran it here; the probes are in `fc/*.mjs` and take a tree root as their argument. **15 WRONG.** Five of them are wrong only because roster landed at `484329c`, and two more because the seat-guide lane is in flight.

## §1 Why
- VERIFIED HANDOFF.md:72 holds the queue line at base. WRONG now: the line is :74, it reads "Now:", and "Now: the seat guide" sits at :73.
- UNVERIFIABLE Jake's quoted question: it is in neither HANDOFF.md nor docs/sessions/2026-10.md. HANDOFF records only the summary.
- UNVERIFIABLE the Windows work-project trigger: it is outside the repo.
- VERIFIED docs/reviews/req-tree-2026-10-09/CHANGE.md:292 holds item 6. Nothing queued it before HANDOFF:72.
- VERIFIED product-report.mjs:205-206 throws on any tree problem (R-1025, REQUIREMENTS.md:1570).
- VERIFIED seeds: py REQUIREMENTS.md.jinja:75,:83 `## 1. The product`, include :89; ts :73,:81, include :87; requirements-general.md:13,23,33,46,54,62.
- VERIFIED (ran) the checker on the four renders: 23, 22, 23 and 22 problems, all "not in a feature or subgroup table" (requirements-tree.mjs:130).
- VERIFIED (ran) tree-py and tree-ts: 0 problems, 9 headings. TS rail `check()` on tree-ts: 0 problems. UNVERIFIABLE: I did not re-run the Python rail.
- VERIFIED requirements/SKILL.md:135 "numbered sections"; :126 "In this ledger…" and "Jake decides".
- VERIFIED :163-166 "at the end as its own Part", but the text wraps: "as its own" ends :165 and "Part," starts :166.
- VERIFIED scaffold-py and scaffold-ts SKILL.md:45-49 (phrase at :47); adopt-py:143-144; adopt-ts:165-166; adopt-structure:167-170 (phrase at :169).
- VERIFIED copier.yml:16 skip-lists REQUIREMENTS.md. Installed copier 9.18.2 also keeps skip-if-exists files out of the update patch (copier/_main.py:1552-1586). Older 9.x, which copier.yml:7 allows: INFERRED.
- VERIFIED REQUIREMENTS.md:5 (EARS form, G-013) and :17-30 (the tree text).
- VERIFIED requirements-tree.mjs:15 and :390 read only nana-pi's root. :61 splits on LF after the BOM strip.
- VERIFIED (ran) a CRLF copy of the ledger: 0 headings, 1,104 problems. The LF file: 68 headings, 0 problems. At 484329c: 1,113 rows, same result.
- VERIFIED product-report.mjs:310 takes `--root`; :23 and :204 normalise CRLF.
- VERIFIED (ran) the report on a committed copy of tree-py exits 0 twice, with `"clean":true` then `"clean":false` (:22 DEFAULT_OUT, :218 status call).
- VERIFIED the h1 literal at :76, template.html:6 `<title>`, and .gitignore:2.
- VERIFIED req-tree CHANGE.md:3-6 records sol r1–r3 and two checkpoints; build-1.log to build-7.log exist. The folder also holds build-b1 to b4 from increment B.

## §2 Requirement delta
- WRONG now "Main's highest ID is R-1111". Roster landed, so main's highest is R-1128. The leaf total is 1,113 (requirements-tree.test.mjs:38,52,53 at 484329c).
- VERIFIED R-1140–R-1149 are reserved. The feat/seat-guide CHANGE.md:4 takes R-1140–R-1142, and the plan never names that lane.
- VERIFIED R-1150–R-1169 are unused on main, roster and seat-guide (grep count 0).
- VERIFIED homes at base: R-737 and R-738 in SUB-019 under FEAT-014 (:865-866), R-657 in FEAT-032 (:1500), R-294 in FEAT-028 (:1320), R-1013 in FEAT-039 (:1557).
- VERIFIED no proposed row repeats or contradicts R-287–R-294, R-578–R-583, R-737, R-738 or R-1012–R-1030.
- Tension: R-1013 (:1557) says the report states "whether the working tree was clean". R-1160 narrows that, and R-1013's text stays unchanged.
- WRONG, conditional and now likely: the leaf literal 1,124. Seat-guide (commit 7306142, "Now" at HANDOFF:73) moves R-291's literal from 1,113 to 1,116 (its CHANGE.md:40,184). If seat-guide lands first, this lane's literal is 1,127.
- VERIFIED headings stay at 68 (68 at 484329c).

## §3 Design
- VERIFIED REQUIREMENTS.md:17 is an ordinary heading. :40-56 holds the lifecycle text. :1503 FEAT-033 is one table (22 G rows plus R-920). :1706 is the closing H1, now at :1715.
- VERIFIED the R-001 table at py :85-87 and ts :83-85.
- VERIFIED R-294 allows a proposed feature with no rows (requirements-tree.mjs:189-191).
- VERIFIED (ran) a FEAT appended after the new closing H1 fails R-290 (checkNesting :160-165). Under today's closing headings it passes silently.
- VERIFIED REQUIREMENTS-general.md.jinja:1 is only the include, in both languages.
- VERIFIED both rails ignore headings. requirements-trace.ts and conftest.py parse no heading; "Part G" appears there only in G-ID handling (ts :157,:545; py :130,:439).
- VERIFIED the checker never reads the general file; :390 reads only REQUIREMENTS.md.
- VERIFIED `parsed.allHeadings` keeps ordinary headings with level and label (:49, :64, :103, :118).
- VERIFIED the renderer writes text nodes only (:58, :76); R-1019 at REQUIREMENTS.md:1564.
- VERIFIED (ran, git 2.50.1) an exclude-only pathspec drops just the output file. It also works when the untracked folder collapses to `?? docs/` or `?? docs/product-report/`.
- VERIFIED a missing HANDOFF.md raises ENOENT naming the path (:208); main's catch prints it (:316).
- VERIFIED roster CHANGE.md:166-167, now on main: `$HOME` expands in PowerShell 5.1 and 7.x, and `~/` stays literal before 7.6.
- VERIFIED the pack bin list at packages/nana-pack/package.json:7-13; roster left it unchanged.
- VERIFIED requirements/SKILL.md:148-151 holds the ID-block advice.
- UNVERIFIABLE the §3.6 fit numbers (the 365-row, 171-row and 29-problem ledgers). They live in other projects, and I did not read them.

## §4 Scope
- VERIFIED README.md:64 and :243, unchanged at 484329c. README:80 states Node ≥ 22.18.
- VERIFIED HANDOFF.md:45 holds the LF residual at base. WRONG now: it is :46.
- WRONG "roster at 484329c, not on main". Main is 484329c, and `git worktree list` no longer shows the roster worktree.
- VERIFIED roster put R-1126 and R-1127 after R-1104 in SUB-019 (REQUIREMENTS.md:885-886 at 484329c).
- VERIFIED R-291's literal sits at requirements-tree.test.mjs:38,52,53 (now 1,113).
- WRONG that roster is the only overlap. feat/seat-guide (worktree ~/nana-pi-wt/seat-guide) adds R-1142 after R-1127 in SUB-019 (its CHANGE.md:4,:100-110).
- Seat-guide also edits templates-render.test.mjs, R-291's literal, the outline, the code map, HANDOFF, working-under-nana-pi.md and AGENTS.md.
- WRONG "v0.6.12". Roster's ffb1bbb touches templates/ after v0.6.11 (rev-list count 1). CI's release job (ci.yml:72-97; template-release.mjs:41-50) therefore cuts v0.6.12 for roster.
- This lane gets v0.6.13 at the earliest, or v0.6.14 if seat-guide lands first.
- VERIFIED REQUIREMENTS-general.md is not skip-listed (copier.yml:13-20; R-581), so `copier update` refreshes it.

## §5 Verification
- VERIFIED the R-737 title form at templates-render.test.mjs:172. partG is defined at :165-177 and called at :465 and :649 (now :488 and :672). New checks go beside the calls.
- VERIFIED the cited existing titles: K1 at product-report.test.mjs:78, K2 at templates-render.test.mjs:172, K3 at :653.
- WRONG K4 "reds the R-599 titles". Bare path tokens are judged under R-598, and their flags under R-629 (skill-claims.mjs:112-120; REQUIREMENTS.md:1497-1499).
- Ran `claims()`: the quoted `$HOME` form yields only an unjudged `node` command. R-1156's text trips no skill-claim row.
- WRONG mutation 1 "reds T1 in both modes". Ran: an adopt seed that keeps `## 1. The product` with its empty table still gets the new CAP-02 and FEAT-002.
- That seed gives 0 problems, 1 capability and 1 feature, so T1 adopt stays green. Only T3 reds in adopt mode.
- WRONG that T5 guards against "as its own Part". The live text wraps the phrase (:165-:166), so the absence check already passes today.
- T5's presence phrase "the table of the feature it serves" is also already at :126.
- VERIFIED but empty: no T6 absence phrase appears in the five skills today, except "`Part G` engineering block" at adopt-structure:169.
- WRONG "R-1156's strings appear once, in T7". T4 also asserts the checker command in the seed.
- WRONG the suite step `npm run req:tree`. package.json:15 runs `--write`, which rewrites the outline. The check form is `node scripts/requirements-tree.mjs --check`.
- VERIFIED requirements-trace.mjs:21 imports the `.ts` rail. Gap: requirements-tree.mjs:13 imports it too, so the checker command also needs Node ≥ 22.18.
- VERIFIED product-report.mjs:203 needs git. The main guard at :318 resolves only its left side; requirements-tree.mjs:407 resolves both.
- NOTE: CI's Windows suite leg runs under Git Bash (ci.yml:51-53), so no CI leg runs the PowerShell `$HOME` form.
- NOTE (INFERRED): no .gitattributes rule sets line endings, so the Windows checkout is likely CRLF already.
- T9 must normalise before it builds its CRLF copy, or it builds `\r\r\n`.

## §6 Residuals and decisions
- VERIFIED handoff-asks.mjs:11 and templates/_shared/HANDOFF.md:11.
- WRONG J4 "the Decisions view stays empty". An "Open for Jake" item without the `[kind, since date]` tag makes the report refuse (product-report.mjs:210-213; R-1030 at REQUIREMENTS.md:1575).
- Ran `splitOpenForJake` on two untagged items: both tag and title come back null.
- VERIFIED residual 2's calls at :263 and :271.
- WRONG residual 2 "touches R-1020's recorded call (:293)". That call is validateStore's `show <sha>:REQUIREMENTS.md` at :177. validateStore has the same subfolder bug, and the plan does not name it.
- VERIFIED residuals 3 (:22), 5 (:16) and 6 (:397-398; test :34).
- WRONG residual 4 for the checker. `process.exit(main())` at :407 exits before the warning prints; a `--check` run wrote 0 bytes to stderr. The report does print the warning (ran).
- VERIFIED the residual 9 font links at template.html:7-9. The offline fallback is INFERRED.
- VERIFIED no nana-setup code reads REQUIREMENTS.md or the general file, so `nana-setup project` is not a consumer.
- VERIFIED template-acceptance.mjs reads no ledger heading; :69 only strips the R-001 marker.
- NOTE: these places still say "Part G": py jinja :45 and :62, ts :43 and :60, adopt-py :52-53, :141, :148, and adopt-ts :69, :163, :170.
- No test pins those mentions, but they will no longer match any heading.
- NOTE: the checker's CRLF fix does not strip trailing whitespace, and the report's `normalise` does (:23). The two can still disagree on one ledger.

## WRONGs that change the plan
1. **The base is stale, and a second lane is in flight.** Roster is on main (484329c), so §2's ID line, §4's overlap section and the HANDOFF line numbers need a rebase.
   feat/seat-guide (R-1140–R-1142; R-1142 in SUB-019 after R-1127) shares SUB-019, templates-render.test.mjs, R-291's literal, the outline and HANDOFF. Name it in §4.
   Fix the literal by land order (1,124, or 1,127 after seat-guide) and the tag (v0.6.13 or v0.6.14).
2. **T1 cannot catch an adopt seed that keeps `## 1. The product`.** The G feature alone satisfies "≥ 1 capability and 1 feature".
   Either require a capability and feature apart from the G feature (or no plain numbered section), or fix mutation 1's red set. Otherwise the seat mutation runner misses N/N.
3. **"The report runs in any project" is false for an untagged "Open for Jake".** R-1030 makes the report refuse.
   Name R-1030 and decide: scope it out, carry it, or fold it into J4. J4 is about the heading literal alone.
4. **T5's "as its own Part" guard is vacuous** because of the wrapped line, and its presence phrase is already present.
   T5 reds only through "numbered sections" and "Jake decides". Match on whitespace-collapsed text, or name the G-block sentence directly.
5. Fix the smaller ones: K4 names R-598/R-629, not R-599. Residual 2 should name validateStore (:177) and drop the :293 claim. Residual 4 does not apply to the checker. The suite step should be `--check`, not `npm run req:tree`. R-1156's string appears in T4 and T7.
