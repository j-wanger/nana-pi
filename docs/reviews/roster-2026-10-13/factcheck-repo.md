# Repo fact-check — roster CHANGE.md (against main 9974218)

Method: read every cited file:line at 9974218; grepped REQUIREMENTS.md; read feat/process's CHANGE.md; read copier 9.19.1
source; counted the live review ledger; ran land.test.mjs on a scratch copy of packages/nana-pack with mutation 23 applied
(repo never edited).

## VERIFIED (no action)

- AGENTS.md:66 roster pointer; AGENTS.md:68-97 is the marker region (68 begin, 97 end); CLAUDE.md is a 9-byte symlink (git mode 120000).
- MEMORY.seed.md has no entries; nana-shared-memory.mjs:89 prints only `- [` lines.
- worker-config.mjs:11-17 LANE_DEFAULTS and comment; pi-worker.mjs:91 caller-arg refusal, :98 argv; preambleFile/laneLock unset at :91, so a laneFailure there leaks nothing.
- pi 1.0.2: args.js:6 seven levels; args.js:125-135 invalid --thinking warns; model-resolver.js:307-318 provider map/unknown-provider error; :441-455 custom-id fallback with warning.
- nana-land.mjs:91 counts any verified v2 LAND, never reads role/launcher; :92-93 R-1004 veto incl. null verdict; :99-103 uncovered commits; :114 ff-only. No lib/land*.mjs exists.
- review-ledger `run` records any child's LAND with launcher `review-ledger run`; ledger lives at HOME/.pi/agent (review-round.mjs:83-93), not PI_CODING_AGENT_DIR.
- Audit ledger: 532 verdicts with ts >= 2026-10-08T00Z, all launcher pi-review; 11 of them (10-08 00:11-02:13Z = 10-07 local) lack provider/model; by local date 521, all named. v2 tally: 340 rows, all pi-review, providers openai-codex, sol/astra as R-1120 says.
- Highest ID R-1092; R-1093-R-1139 unused anywhere; process holds R-1100-R-1111 with R-1100..R-1104 after R-683. Leaf total on main 1,088 (1,066 R + 22 G); 1,100 after process; 1,108 after this lane.
- Headings: R-961/R-628 in FEAT-006; R-969 in SUB-009 (FEAT-007); SUB-012 in FEAT-013; R-683 in SUB-019 (FEAT-014).
- agent-dir.mjs:67-77; config.ts:259-280 (unknown blocks ignored), :309 (dangling symlink present), :316 (strips a BOM), :565-574 (objective user-only); gate-paths.ts:117; fsops.mjs:114-126 seedFile never overwrites; bounded-read cap 1 MiB.
- doctor (steps.mjs:606 readPiPackConfig) and adoption.mjs:94 JSON.parse without BOM strip (§6 item 6 holds).
- server.mjs:2358 refuses unknown keys (NANA_PACK_KEYS at :1385 has neither `roster` nor `objective`).
- pi-watchdog.mjs:107 spawn('pi'); windows-triage.md:466-469 matches.
- looksLikePath skips `~`-prefixed tokens (template readme-check.mjs:305-312); `.mjs` is a KNOWN_EXT, so a bare name fails R-598 in render targets.
- win32 install refreshes a changed rule copy with a backup (fsops linkFile copyInstead), so "re-run install" holds.
- review-ledger.test.mjs already uses a scratch HOME and USERPROFILE (:45).
- Pack README "Lane builder" at :198/:200 carries the literal roster.

## WRONG

1. §5 "Shared-text pairs ... also red the python and typescript rendered-region titles." templates-render renders with
   `copier copy --vcs-ref HEAD` (test :57); copier 9.19.1 `_vcs.py:421-442` commits a dirty local template into the clone
   ("Dirty template changes included automatically"). An edit applied alike to the shared file and the region renders into
   both targets, so both R-859 rendered titles and the root byte-identity title stay PASS.
2. Mutation 23 does not red its named title. Simulated: requiring a land-role or seat-land LAND in nana-land kept "a reviewed SHA
   must be ancestor of the source tip and match a LAND record" PASS (it is a refusal test on a v1 NO-GO). It turned 19 other
   land.test titles FAIL, all success paths through the `runLand` wrapper that records role "test". Name one of those, e.g.
   "a legacy round without verdict does not block a version-2 LAND".
3. §3 "The verdict comes from the file's last line through the existing reader (`verdictWord`)": verdictWord is
   module-private (review-round.mjs:413, no export). It is reachable only through `complete()`. It reads the final non-blank
   line when that line carries `verdict:`, else the first line (R-969).
4. §5 fixture "this Mac's real `{"objective":{"projectFile":"OBJECTIVE.md"}}`": the real file also holds
   `"path": "/Users/example/nana-agent-loop/OBJECTIVE.md"`. Keep the trimmed fixture, but drop the word "real".
5. §6 item 5 "a Known-limits line, as for `objective`": the desk README has no objective Known-limits line. The editor note at
   apps/desk/README.md:272-273 already says unknown top-level keys are refused by name, which covers `roster`.
6. Acceptance "an empty diff from `9974218` on `pi-review.mjs`": process edits pi-review.mjs (review-standard append). After
   the planned rebase this check fails. Diff from the rebased merge-base instead.
7. Mutation red lists are not "exactly":
   - Pair 2 (resolver always returns the default) also reds the R-1122 shapes, file-refusal, print, refusal-exit,
     lane-refusal and omit-thinking titles.
   - Pair 15 depends on wording. If caller args are accepted always, it also reds the tool-control, resource-disabling and
     caller-tools titles. If they are accepted only "beside a roster", the named title has no roster file and stays PASS.

## UNVERIFIED

8. "worker-lane.test.mjs (stub pi; win32 SKIP ...)": main has no win32 skip there, and scripts/test.mjs SKIPS lacks it.
   review-ledger.test.mjs crashes at load on win32 (triage :456-461). So seat-land and the new lane titles have no Windows
   evidence, although seat-land is built for the Windows seat. State it, or add the SKIP the triage asks for.
9. Pair 6 (`os.homedir()` for the injected dir): resolveRoster takes the dir as an argument. The PI_CODING_AGENT_DIR title
   reds only if it spawns the CLI. The print title also reds if its file case injects through the variable.
10. Setting PI_CODING_AGENT_DIR in worker-lane `run()` is redundant under `npm test`. scripts/test.mjs:279 already scrubs the
    variable, and `run()` sets HOME to a temp dir. It matters only when someone runs the file directly.

## GAP

11. Sealed tool list loses its only literal pin. The refit reads LANE_DEFAULTS, and the R-1120 literal title covers provider,
    model and thinking only. Retuning LANE_DEFAULTS.tools (for example dropping `write`) would pass every test while R-961
    still names the list. Add tools to the one literal pin under R-961, plus a mutation pair.
12. Null-verdict veto: seat-land accepts any review-shaped file (`reviewShaped` only needs `VERDICT` at the start of a line).
    A seat line `VERDICT: Land` fails the [A-Z]+ grammar, so verdictWord gives null and complete() records `verdict: null`.
    nana-land:92 then refuses that revision for good (R-1004 "an empty value included"). The only way out is a new commit
    plus a new reviewer round. This is honest variation in scope. seat-land should refuse unless the verdict is LAND or
    SEND-BACK, but verdictWord is private and review-round.mjs is off-limits. Pick one: export it (scope change) or use a
    narrower local check.
13. Review-file location is unspecified. seat-land passes `--out` to admit:
    - A tracked file in the reviewed tree (the docs/reviews corpus) is refused by outInTree with an "overwrite" message.
    - An untracked in-tree file is excluded, but it later makes `nana-land cleanup` refuse (status --porcelain, :150-151).
    - Any other untracked file turns the revision into `sha+snap:` and the guard refuses with a misleading reason.
    Direct the file to scratch, as pi-review's --out is, and note that the text never reaches the committed corpus.
14. Test-to-row misfits:
    - "non-lane worker runs with a malformed machine roster" carries R-732, whose text says nothing about the roster. No row
      states "non-lane mode reads no roster", and R-961 is lane-only.
    - "seat-land on the revision the reviewer accepted consumes no new round" pins R-972, not any R-1124 clause.
    - R-1126/R-1127's clause "on the revision the reviewer accepted" has no mutation pair.
15. No inline tunables: the plan never says where the `seat-land` role and `review-ledger seat-land` launcher strings are
    defined. The R-1125 guard compares on the launcher string, and the tests need it too. Define it once with R-1124 as
    provenance; tests import it. ROSTER_DEFAULTS provenance should also name R-1120, beside the owner's ruling.
16. Placement notes:
    - R-1126 goes to SUB-012 (installer delivery), while the existing nana-soul content row R-682 is homed in SUB-005.
      Moving a row's home is the owner's call; name it.
    - R-291's 1,088 literal sits at requirements-tree.test.mjs:38 (title), :52 (assertion) and :53 (message). The plan lists
      only the title, and under the templates-render bullet.
    - review-ledger.mjs's @purpose (round cap hook) gains a second job; update its header @inputs and @errors.
    - pi-worker must not contain the words admit or complete (review-ledger.test :128 regex).
