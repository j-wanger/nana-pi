# Why the hardening lanes bounced — every review finding by cause (2026-10-07)

*Seat analysis for Jake's question "are we slow because luna as worker is not capable enough?". Six Claude classifiers read every sol/astra review, builder report, lane brief and the seat ledger for the 17 lanes of tranches 1-3; one adversarial checker re-read a 12-finding sample of builder-attributed findings (12/12 held). Raw entries: `findings.json` beside this file.*

## Totals

- Findings: 221 (150 MUST-FIX). Lanes: 17. Builder rounds: 92 (~100 builder-hours). Reviews: 89 (~12 h). Land suites ~3 h.
- Builder-attributable (bug, judgment, process, weak evidence, fix regression): 140/221 (63%); MUST-FIX 98/150 (65%).
- Seat-attributable (brief, plan text, ruling, merge interaction): 26 (24 MUST), plus costs not counted as findings (the whole t3-carry2 lane; the t2-trial ruling flip-flop; a no-touch rule that blocked a fix).
- Uncommon edge cases the brief did not name: 30 (25 MUST). Doc-only: 25 (3 MUST).
- MUST-FIX likely avoidable on a careful first pass: 74/150; unlikely 33; unclear 43.
- Builder rounds that ended PARTIAL/BLOCKED: 16; per the classifiers about half were environmental or seat-caused (suite lock, leaked temp dirs, a seat gate), the rest genuine early stops.

## By category

| category | all | MUST |
|---|---|---|
| BUILDER_BUG | 53 | 45 |
| BUILDER_JUDGMENT | 11 | 8 |
| BUILDER_PROCESS | 18 | 6 |
| WEAK_EVIDENCE | 46 | 33 |
| FIX_REGRESSION | 12 | 6 |
| EDGE_DEPTH | 30 | 25 |
| SPEC_SEAT | 26 | 24 |
| DOC | 25 | 3 |

## Patterns the classifiers reported

- luna fixes the named example rather than the class (t1-gate: alias scan covered rm only; walk-cap check only for slash-bearing words).
- luna marks rows implemented with tests that pass under the obvious wrong implementation (WEAK_EVIDENCE is the second-largest category).
- luna stops after one item on multi-item briefs (t3-review r1-r2) and slips on rail/ID/evidence process.
- The seat caused real rounds: plan relaxations on the gate floor, a wrong baseline, reviewer-only notes that never reached the builder, rulings later reversed, a brief that shipped a live doctor regression.

## Classifier notes (verbatim)

---

29 entries total: 2 for t1-docs, 12 for t1-flake and 15 for t1-ledger. Three t1-ledger astra-r3 entries repeat sol-r3, so there are 26 unique findings. Counts by category: WEAK_EVIDENCE 11, DOC 5, BUILDER_PROCESS 4, BUILDER_BUG 2, EDGE_DEPTH 2, SPEC_SEAT 2, FIX_REGRESSION 2, BUILDER_JUDGMENT 1. Reviews with no findings: t1-docs sol-r2, astra-r2; t1-flake astra-r5; t1-ledger astra-r4.

PARTIAL rounds (2): t1-docs worker-r2 and t1-ledger worker-r1. Both went PARTIAL only because the cross-lane stage-key flake kept the full suite red, not because work was left undone. PROGRAM.md lists t1-docs r2 as DONE, but its report's first line is PARTIAL.

t1-flake round 3 was stopped by the seat after 54 min with no report. Its pi-worker log says FAILED. It is not counted above; include it if stopped rounds count, which makes 3. The seat caused that lost round: brief-r3 said the file 'uses DESK_PORT=0', which invited looping outside the lock, but the file bound fixed app ports 4452/4453.

The seat also shaped other t1-flake rounds. Brief-r3b prescribed reserve-then-close ports, which sol r3 flagged and the seat later replaced with port-0 listeners. Brief-r4 steered the narrowing of R-948/R-949. Sol r1's own suggested fix (marker-absence check) became astra r4's scheduling-race SHOULD.

The standing brief rule 'invert the condition' plausibly invited the inverted-assertion mutations behind several WEAK_EVIDENCE findings. The seat added 'inverting the assertion does not count' only from brief r4/r5 onward. All files read are under /private/tmp/claude-501/-Users-jwang-nana-pi/22c1a4e3-0e2c-4238-8e73-91597ba9630f/scratchpad/prog/.

---

I classified 32 findings across three lanes: t2-instructions 7, t2-pack 10, t2-retire 15. I skipped the 'No findings' reviews: t2-instructions sol-r3, t2-pack sol-r3 and astra-r4.

Category totals:
- BUILDER_BUG 9
- WEAK_EVIDENCE 7
- DOC 5
- EDGE_DEPTH 4
- BUILDER_JUDGMENT 2
- BUILDER_PROCESS 2
- SPEC_SEAT 2
- FIX_REGRESSION 1

firstPassAvoidable: likely 22, unclear 9, unlikely 1.

Two builder rounds reported PARTIAL: t2-retire r1 and t2-pack r2. Both were blocked by suite-lock contention from parallel lanes, not by builder capability. The PARTIAL in t2-pack r2 led straight to the red trace rail in sol r2. The seat's own lesson says it could have caught that rail in seconds before launching the review.

Pattern by lane:
- t2-instructions: four of its seven findings were brief-named items done shallowly or rows overclaimed. These are the static inventory test, the hardcoded repo path, the desk falsifier and R-681. The last one took two rounds because sol tightened its own suggested fix.
- t2-pack: mostly an incomplete sweep of receipts and handoff wording across docs and desk, plus weak or dropped evidence. Astra's blocking finding came from the seat. The brief listed G1c-03 without reconciling it with tranche-1 R-152.
- t2-retire: the opening finding came from the seat. Its example provenance signature (nana-dev-kit / 5-layer) matched none of the live artifacts. The middle rounds chased the symlinked-ancestor class: destination, then source, then the skills step. That is where adversarial depth cost rounds. The rest were ordinary builder bugs, for example --claude-home scoping missed in install and then in doctor, and foreign links replaced even though the brief listed that as an expected probe.

Judgment calls:
- sol-r1 #2 in t2-retire: I chose BUILDER_JUDGMENT over SPEC_SEAT. The seat's phrase-check example contributed, but the .Codex and .bak 'nana' matches were the builder's own choices.
- sol-r2 #1 in t2-pack: I chose BUILDER_PROCESS over FIX_REGRESSION. The stale titles came from round-2 test renames.

---

44 findings across 3 lanes (t1-session 13, t1-setup 13, t2-frontier 18). Skipped t1-session astra-r5 (no findings). Category totals: BUILDER_BUG 8, WEAK_EVIDENCE 8, SPEC_SEAT 7, BUILDER_PROCESS 6, EDGE_DEPTH 5, FIX_REGRESSION 4, DOC 4, BUILDER_JUDGMENT 2. Builder-attributable (BUG+JUDGMENT+PROCESS+WEAK_EVIDENCE+FIX_REGRESSION) = 28/44. Seat = 7, concentrated in t2-frontier (5 of 18): its brief asked for 'any past explicit date', two reviewer-only seat notes (frozen fixture, cue list) never reached the builder, the '20 findings' baseline was wrong, and the r3 entry definition caused the blank-line cases. t1-session's 2 seat items stem from the round-2 NANA_TEST_TEMP_ROOTS env-seam decision; t1-setup has none. WEAK_EVIDENCE dominates t1-session (5/13): luna marks rows implemented with tests that pass under the obvious wrong implementation, and its early mutation pairs only inverted assertions (seat flagged this in the t1-session land note). PARTIAL rounds: t1-session r1 (code committed with no tests, suite red, 15 files failing; a genuine builder stop), and t2-frontier r4 (caused by the seat's wrong 20-finding baseline, not builder capability). Numbering caveat: in t1-session, sol-r1 reviewed builder r2 because r1 was PARTIAL, so sol-rN is builder r(N+1) there. Judgment calls: astra-r4 t1-session (journaling after the startup filter) is BUILDER_BUG, though the seat resolved it by narrowing R-647. sol-r3 t2-frontier #3 is mixed (seat entry rule plus fence/nesting edges) and filed SPEC_SEAT. sol-r3 t2-frontier #2 was confirmed FIX_REGRESSION from git: r1 and r2 scanned every line, r3 scanned list items only. Files: /private/tmp/claude-501/-Users-jwang-nana-pi/22c1a4e3-0e2c-4238-8e73-91597ba9630f/scratchpad/prog/{t1-session,t1-setup,t2-frontier}/ and PROGRAM.md.

---

53 findings across the three lanes: t2-tests 16, t2-trial 19, t2-trust 18. Category totals: BUILDER_BUG 15, WEAK_EVIDENCE 10, EDGE_DEPTH 8, SPEC_SEAT 7, BUILDER_PROCESS 4, DOC 4, FIX_REGRESSION 3, BUILDER_JUDGMENT 2.

There were 6 PARTIAL or BLOCKED rounds:
- t2-tests r1 PARTIAL: source cleanup was left undone.
- t2-trial r1 PARTIAL: the extractor scope was wrong and found 0 baseline messages.
- t2-trial r2 BLOCKED: the builder stopped at the seat's baseline-reproduction gate. The seat had set that gate against a hand count that turned out not to be reproducible.
- t2-trial r4 PARTIAL: the 7 vs 12 rubric gap was still open.
- t2-trust r1 PARTIAL: the suite was red, and the builder wrongly called the failure out-of-lane.
- t2-trust r3 PARTIAL: only the suite lock stopped one mutation run. The seat ran that pair itself.
So 2 of the 6 were not about the builder's capability.

Lane patterns:
- t2-trial is the most seat-driven lane. The seat flip-flopped its 6/35 ruling: 'not reproducible' in r3, 'reproducible' in r4, 'not reproduced' in r5. The first ruling rested on the builder's buggy lenient number. The attached G1a-01 finding asked for both the session unit and the audit's all-message 14/10 count. That conflict surfaced only at astra r6, and the seat itself steered toward 14/10 in rounds 2 and 4.
- In t2-tests, 3 SPEC_SEAT findings came from the brief. It listed L7-08 and L8-02 as 'findings this lane closes' but meant them as context. It also prescribed the porcelain-status snapshot that sol r1 then broke.
- t2-trust spent three successive rounds on symlink and containment edges: lexical containment, then a directory symlink, then a trust.json file symlink. The round-4 seat brief prescribed a directory-only realpath. These are classed EDGE_DEPTH, not builder bugs.
- WEAK_EVIDENCE recurs in every lane, 10 findings in all: rows flipped to implemented on tests that a wrong implementation still passes. This is the most consistent builder weakness.
- One clear first-pass builder bug (the T17 re-stamp placed between golden() calls) went unseen by sol for three rounds. astra caught it at r4.

Judgment calls:
- astra-r4 #2 (t2-tests, Windows signal test) is classed EDGE_DEPTH, not FIX_REGRESSION, even though the test came from an earlier fix round.
- sol-r3 #2 (t2-trial, no snapshot cutoff) is classed SPEC_SEAT, because the seat asked for counts '10-04 to today' with no cutoff. It could be argued as a builder miss of the recomputability goal.

Sources: /private/tmp/claude-501/-Users-jwang-nana-pi/22c1a4e3-0e2c-4238-8e73-91597ba9630f/scratchpad/prog/{t2-tests,t2-trial,t2-trust}/ and PROGRAM.md.

---

The t1-gate lane ran 12 builder rounds, 3 sol rounds and 9 over-cap astra rounds (r4-r12; r12 LAND 9). I classified 21 findings: BUILDER_BUG 6, BUILDER_JUDGMENT 1, WEAK_EVIDENCE 3, SPEC_SEAT 3, EDGE_DEPTH 4, DOC 4.

Partial rounds: only worker-r7 was PARTIAL. The cause was environmental: about 268k leaked temp dirs made agent-dir-hostile time out, and the seat traced and cleaned them. That round was not a builder capability failure.

Builder pattern: luna fixes the named example rather than the class. Examples: the alias scan covered rm only; the walk-cap check ran only for slash-bearing words; the 'conservative' pass approximated main's extraction; the 'verbatim' legacy copy reshaped main's direct-match return. Five of the six BUILDER_BUGs were avoidable on a careful first pass, and each cost a review round.

Seat contribution: the brief's rm-text relaxation cost sol r2 #1. The seat's r2 walk design (entries only, overflow floors the lexical dir) cost sol r2 #3. The r7 ruling to replace extraction (mutation = old extraction) caused the astra r7 regression. The r9 candidate-union design framed the r9 miss. The r10 legacy-first ruling clashed with the plan's R-630 ALLOW, which pushed the builder into the template exception (astra r10). I classed that one BUILDER_JUDGMENT because the exception's looseness was the builder's; it could also be read as SPEC_SEAT.

Git verification (read-only): the git-alias bypass in sol r2 #2 is pre-existing on base a3afab2. The cwd drop in astra r4 #1 was introduced in r2 (commit 889830a) through a process.cwd() default parameter. The quoted-variable regression in astra r9 #1 started in r7 (commit 03f58a9), when the builder removed the quote strip before the direct regex.

EDGE_DEPTH findings: astra r5 and r6 (basename and spaced-path literal forms) are uncommon and inherited from main's extraction. The seat's r7 ruling stopped chasing that class.

Files: /private/tmp/claude-501/-Users-jwang-nana-pi/22c1a4e3-0e2c-4238-8e73-91597ba9630f/scratchpad/prog/t1-gate/ and /private/tmp/claude-501/-Users-jwang-nana-pi/22c1a4e3-0e2c-4238-8e73-91597ba9630f/scratchpad/prog/PROGRAM.md

---

I emitted 42 findings across 4 lanes, classified as follows:

| Category | Count |
|---|---|
| BUILDER_BUG | 13 |
| WEAK_EVIDENCE | 7 |
| EDGE_DEPTH | 7 |
| SPEC_SEAT | 5 |
| BUILDER_JUDGMENT | 3 |
| DOC | 3 |
| FIX_REGRESSION | 2 |
| BUILDER_PROCESS | 2 |

21 of the 42 are marked firstPassAvoidable=likely. In this run, sol-r*.md and astra-r*.md hold the reviewer outputs. The review-sol/astra-r*.md files are the review briefs, and the brief-rN.md headers carry the seat's per-round rulings.

Stopped rounds: 3, all in t3-review. Round 1 was PARTIAL, round 2 PARTIAL, round 3 BLOCKED. Round 8 was still running with no report yet. Every other builder round in these lanes reported DONE. The ledger records luna stopping after one item per round (r1 took 2401 s, r2 691 s). Five build rounds went by before t3-review's first review.

Seat-caused cost beyond the 5 SPEC_SEAT findings:
- t3-review's round-3 BLOCKED was caused by the seat's no-touch rule. The builder's own row R-969, written in round 2 without a full-suite run, broke the rail, and the rule forbade fixing it. The ledger records this lesson.
- The whole t3-carry2 lane (3 builder rounds plus a land review) exists because the t3-carry brief said to report '!' for each dangling link. That shipped a live doctor regression. It is not a review finding, so I did not count it.
- t3-carry sol r2 and sol r3 trace directly to the seat's round-2 ruling ('open O_RDWR once; truncate and write through the descriptor').
- The t3-pipe pipefail chase ran across sol r1, astra r4 and astra r5. Round 1 is classified BUILDER_BUG, astra r4 BUILDER_BUG and astra r5 SPEC_SEAT. The exemption itself came from the brief, and the seat's round-6 ruling admits that refining it was a chase.

Judgment calls with mixed causes:
- t3-pipe astra r4 'allow on non-match': I chose BUILDER_JUDGMENT, as the rubric example says. The brief's wording 'malformed input → allow' contributed.
- t3-pipe sol r3 function-body masking: also introduced by that fix round, in response to a seat 'declared gaps' ruling that listed functions. I classified the root as BUILDER_JUDGMENT, as the rubric example says.

Verified in git (read-only):
- The BOM loss (t3-carry astra r5) was introduced by round 5's switch to TextDecoder. Round 4 used readFileSync with utf8.
- The t3-pipe hook's main-module check and the 'allow' response were both present from round 1, so they are not regressions.
- The heredoc regex that matched '<<<' was present from round 1.
- In t3-review, the --out exclusion mismatch and the tracked --out validation gap were present since the round-4 build, so they are not regressions.

Reviewer-quality signal: sol ran 3 rounds on t3-pipe and missed the two most dangerous live defects. One was the installed hook being a no-op; the other was 'allow' skipping every Bash permission prompt. astra caught both by running the installed hook.
