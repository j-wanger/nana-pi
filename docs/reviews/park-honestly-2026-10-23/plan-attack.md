# park-honestly: plan attack (adversary, 2026-10-23, main c273b4de)

## Summary

The mechanics hold (measured). I archived main into scratch, applied the twelve park lines and the R-1272 swap with my own script, and ran the tree checker. It prints exactly `deliverables: 16 of 21 made and read by code, 20 parked`, 0 problems, no note, and the outline is unchanged. With the three new rows the checker prints `rows 1948`, and main's movement script prints `16 rows in 12 features`. The trimmed HANDOFF gives `words=1157 findings=0` and `over=0 banned=0`, and the session-start producer lists 27 asks (25 optional, 2 parked). Nine affected test files pass on the changed tree. I wrote the three must-meet tests into scratch and ran them. R-2731 and R-2732 are red on main, and R-2730 is green on main, as the plan says. All nine pairs turn their named test red.

One material problem. Two of the twelve parks, R-301 and R-1150, have an honest maker in a run that already happens. CI's install-check job installs into a temp home, and doctor reads the links there. That same job is how R-341 counts as live today. CI's release job renders both templates, and the rendered projects' own code reads the rendered REQUIREMENTS.md. That job is how R-596 counts as live. The owner's rule was to park rows with no honest maker. These two rows have one, so parking them breaks the ledger's own convention, and the Landed line's "no existing run makes" would be false.

The should-change items:
- Two park reasons carry a false clause (R-327, R-749).
- The plan does not quote the owner's decision.
- R-2730 turns red on any new path that is not yet committed, which clashes with the builder preamble.
- R-2730 also reaches more lanes than the one the plan warns.
- R-2731's stated reason also condemns the reader the plan picks.
- R-2732 leaves 43 words of headroom on a file that has been over budget in 142 of its last 152 main versions.
- Pair 6 is ambiguous.
- R-2730's control breaks when the last park line goes.

## Material

### M1. R-301 and R-1150 have honest makers in existing CI runs. Do not park them.

What I did:
- Read packages/nana-setup/lib/install-check.mjs:375 and :529-543, and packages/nana-setup/lib/doctor.mjs:382-385.
- Read .github/workflows/ci.yml:73 and :110-135, scripts/template-release.mjs:30-50 and scripts/template-acceptance.mjs:20-21 and :93-104.
- Compared against R-341's and R-596's lines in REQUIREMENTS.md.

What happened (measured from the code):
- **R-301** (hooks and rules installed as symlinks, not win32). CI's install-check job runs `nana-setup install` into a temp home (install-check.mjs:375), then runs doctor there (:529). Doctor checks every hook link and every rule link (doctor.mjs:382-385, through `hookLinkRows` and `linkOk`). install-check fails on any unexpected doctor row (:530-543). So the artifact is made by CI on every run, the macOS leg making symlinks, and code reads it. R-301's existing reader line already names hook-health.mjs and stale-copies.mjs, which hold those two checks. R-341 (doctor's lines) counts as live on exactly this run: `Made by: R-341 · CI: .github/workflows/ci.yml, packages/nana-setup/bin/install-check.mjs, …` beside a manual real-home maker.
- **R-1150** (both templates render a REQUIREMENTS.md the tree checker accepts). CI's release job (ci.yml:110-135) runs template-release.mjs. Whenever the template surface changed since the last tag, that runs template acceptance (template-release.mjs:43-46). Acceptance renders both templates in scaffold and adopt modes with copier. It then runs `uv run pytest` and `pnpm check`, which loads conftest.py and `pnpm test` → requirements-trace.test.ts. Those are R-1150's two named code readers, run inside the rendered projects. R-596 counts as live on this same job. Also, the CI suite legs set `NANA_TEST_REQUIRE_COPIER: "1"` (ci.yml:73), so templates-render.test.mjs renders both modes on every run and passes each REQUIREMENTS.md to `checkTree`.
- R-1150's planned reason admits that "the suite renders the templates only into temporary folders". R-301's reason names only the owner's real home. R-341 is counted live on a temp-home run, so "temporary" is not the bar the ledger uses.
- Scratch probe (measured): drop the two park lines and add the two CI maker lines below. The checker then prints `deliverables: 18 of 23 made and read by code, 18 parked`, with 0 problems and no note.

Why it is material: the owner's decision, as the plan states it, parks "every open deliverable that has no honest maker". These two rows have one by the ledger's own precedent. Parking them understates what is live. It also puts a wrong reason on the Product view, and the drafted Landed line ("twelve deliverables that no existing run makes") becomes false.

Concrete change:
- Replace the R-301 park line with `Made by: R-301 · CI: .github/workflows/ci.yml, packages/nana-setup/bin/install-check.mjs`, directly above its manual maker line.
- Replace the R-1150 park line with `Made by: R-1150 · CI: .github/workflows/ci.yml, scripts/template-release.mjs, scripts/template-acceptance.mjs`, directly above its manual maker line.
- Measurement 3, the seat's expected line, the spend line ("12 of the 17"), the Landed line, the session entry and the movement expectation all change to match: 18 of 23, 18 parked, ten park lines plus two maker-line changes.
- If the seat holds that a temp-home or temp-render run must not count, then R-341 is over-counted by the same rule. That makes it the owner's call, with one-word default "count". Put it to the owner with these two facts. Do not park the rows with a reason that leaves out the CI run.

## Should change

### S1. Two park reasons state something the code contradicts

- **R-327** reads "…the session-start frontier block and project-stale line carry their upkeep". The project-stale line checks only the AGENTS.md working section. `PROJECT_STALE_LABEL = "AGENTS.md working section"` (packages/nana-setup/lib/stale-copies-config.mjs:22), and `projectStaleLine` compares the AGENTS.md region against the shared working file (stale-copies.mjs:60-86). It never looks at OBJECTIVE.md, HANDOFF.md or the session files that R-327 seeds (measured). Change: "…the session-start objective and frontier blocks read OBJECTIVE.md and HANDOFF.md; nothing reads the session files; a run that reseeds projects deletes this line".
- **R-749** reads "no existing run can tell a report to the owner from a technical record the rule exempts". The suite already picks out one owner-facing text by its path and checks it on every run: HANDOFF.md's live sections, through the library (R-2503, writing-check.test.mjs:98-111). It does that without the CLI summary line (measured). Change: "…the suite checks HANDOFF's live sections through the library, not the summary line, and no run checks a report sent in a session; a lane that runs the check on reports and reads its summary line deletes this line".
- NOTE-level, same pass. R-536's artifact `rows.jsonl` comes from the `extract` step, which is "structural" and calls no model (apps/bench/catch-ledger.mjs:6-24). Only its readers, the label and match steps, call judge models. Say "extraction is free, but its only code readers call judge models". For R-1239, the precedent lane ran seat pairs in an ordinary lane too, so say "required in install, hook and gate lanes".

### S2. Quote the owner's 2026-10-23 decision verbatim

- The precedent's must-meet quoted the owner's question and answer word for word. This plan paraphrases. The Why paragraph gives a rule ("every open deliverable that has no honest maker"). The Stakes paragraph says "the owner named all twelve rows". Those two cannot both describe the same decision without a quote.
- The threat model leans on the owner having named the rows, and M1 turns on which reading is right.
- Change: carry the owner's words in the Why paragraph, the brief and the session entry. Mark which rows the owner named and which ones the seat derived from the rule. Do the same for "for now" on R-749, the R-1272 reader, "power mode continues", and "the Windows run and checklist passed".

### S3. R-2730 is red on any new path that is not yet committed, and the builder preamble demands a green run before each commit

- What I did: in scratch, I added an untracked `scripts/new-reader.mjs` and named it in R-1272's reader line without committing.
- What happened (measured): R-2730 went red with `not tracked at HEAD`.
- The builder preamble says "Each commit follows a green run of the tests your change touches; your last commit follows a green full suite" (packages/nana-pack/prompts/builder-preamble.md:29). A lane that adds a script and its maker or reader line in one change can never get that green run. The same holds for a `git mv` rename. A small builder may weaken the ledger line to get green.
- The planned artifact lanes add exactly these lines.
- Change, either one:
  - (a) R-2730 injects a runner that lists the index plus untracked files that are not ignored (`git ls-files -z --cached --others --exclude-standard`). The suite then checks what the commit will hold. CI sees the same tree as HEAD, and the tree checker's own HEAD contract stays.
  - (b) Keep HEAD, and add one line to every later brief: commit a new code file before the ledger line that names it. Also widen the plan's known limit to say the preamble conflicts.

### S4. R-2730 reaches more lanes than report-at-land, and R-2732 reaches every lane that edits HANDOFF

- What I did: added ` · ci-records` to R-2632's maker line in scratch.
- What happened (measured): `deliverable note: R-2632 artifact "ci-records" on line 2016 is not tracked at HEAD`. Under R-2730 that note fails the suite.
- The planned lane in which nana-land prints and keeps the CI timing records will want to name its kept records. Those live outside git, like the runtime map. Only `runtime-map` is exempt (deliverables.mjs:31, :130).
- The hard-kill-watcher plan (in planning, R-2720 to R-2725) edits HANDOFF's Next 4 and Landed line, so R-2732 reaches it as well.
- Change: the seat step's notice goes to every slate planner and the watcher planner. Any `· <artifact>` that is not a tracked path, other than runtime-map, now fails the suite until that lane widens the exemption. HANDOFF must stay at 1,200 words or fewer after their notes.

### S5. R-2731's stated reason also condemns the reader the plan picks

- D5 bans the product report because "a person reads its page, and it runs by hand". `code-map.mjs --impact` also runs only by hand. No script, hook or CI step calls it (measured: `git grep` finds no caller). It prints for a builder to read.
- Open question 4's default ("yes") keeps build-report.mjs and pi-worker as code readers, though they only print for a person.
- The product report does more than date the runtime map. It reads the map's per-test labels and hashes for the R-1513 changed marks (product-report.mjs:546-561, measured).
- The lane in flight that makes the report at each land would turn product-report.mjs into land-run code that reads these artifacts. R-2731 would then forbid an honest claim.
- Change: state the real criterion. A code reader is one that uses the artifact's content for the row's purpose. One that shows the artifact's age or lists it does not count. Scope R-2731 to the owner's R-1272 decision with a reopen condition, for example "until the report is made by a run". Or drop R-2731 and keep the one-line swap, as D8 already accepts trust-based reader names.

### S6. Open question 1 should default to "no": a 43-word budget gate will bind on the owner's asks

- Measured:
  - Of 152 first-parent main versions of HANDOFF.md since 2026-10-06, 10 were at or under 1,200 words.
  - The draft leaves 43 words of headroom.
  - The median Open ask is 29 words (27 asks, 770 words).
- The soul rule makes every unresolved item a HANDOFF line before a final report. One or two new asks then turn the suite red.
- The seat can only clear that by shortening or merging the owner's asks to land. That is the harm a word budget is meant to prevent.
- The owner asked for the file back inside its budget, not for a gate.
- The session-start frontier block already prints the word count to every seat ("Frontier check: summary words=…").
- Change: default open question 1 to **no**. Keep the trim as the seat's check, and R-2732 drops, as D6 allows. If the owner says yes, the plan names what a seat cuts first: the intro, the archive pointer and Landed text, before any ask.

### S7. Pair 6 must be the comma-joined form

- What I did: wrote R-2731 without trimming the split paths, then ran two forms of pair 6.
- What happened (measured):
  - Pair 6 written as its own line (`Read by: R-1272 · code: scripts/product-report.mjs`) turns R-2731 red.
  - Pair 6 written as `Read by: R-1272 · code: scripts/code-map.mjs, scripts/product-report.mjs` stays green.
- Change: pair 6 becomes the comma-joined form with the report in second place, and the test text says each split path is trimmed, as `addPath` does (deliverables.mjs:128).

### S8. R-2730's control needs a park line in the real ledger

- What I did: removed every `Parked:` line from the scratch ledger.
- What happened (measured): R-2730 went red, though the ledger has no note. The control "rewrite one park line to use `-`" found nothing to rewrite.
- Each park reason ends with what deletes it, so the program's end state turns R-2730 red.
- Change: build the control from a fixture. One choice is R-2640's `tree()` helper with `Parked: R-001 - since 2026-10-22: held`, or one malformed park line appended to a known capability span. Either way it does not depend on the repository's own park lines.

## Notes

- **N1. The lane's own outcome has no test.**
  - R-2730 is green on main by design (measured).
  - With every test in place, omitting R-536's park line, fencing it, or adding an unnamed park for R-1560 all leave the three tests green (measured, probes P10 to P12).
  - The seat's exact count line is the only guard. Keep it, re-run it after every merge of main as planned, and have the builder show R-2730 red by applying pair 1 to main's ledger.
- **N2. Windows form of R-2731's derived path.** `path.win32.relative` gives `scripts\product-report.mjs` (measured), while the ledger writes `/`. The control would then fail on the Windows leg, so the error is caught, but it costs a round. Say "repo-relative with `/`" in the brief.
- **N3. Folder reader.** `trackedAtHead` accepts a folder (brief-precedent.mjs:65-69), so `Read by: R-1272 · code: scripts/` passes R-2730 and R-2731 and counts R-1272 (measured, probe P13). This is not honest variation, so it is a residual only.
- **N4. One line per row.** The park table's combined row `R-509, R-532, R-507, R-535` invites one line for four rows. That line gets `cannot read Parked:`, which R-2730 catches. Spell out four lines in the brief.
- **N5. Small HANDOFF drops.** All are inferred safe, but confirm them:
  - "in a reviewed change" leaves Next 4's product-report seat work.
  - "from your usual seat" leaves the proxy ask.
  - The blocking ask's "check `claude --version` is 2.1.139 or later, and watch one pi-worker lane" leaves with the ask. The owner's run should have covered both.
  - The 2026-10-24 review pack leaves Next 1. Confirm the owner cancelled the review and did not only switch the priority.
  - No open ask leaves except the two the owner answered (measured diff of the ask list).
- **N6. Stakes wording.** "Every deliverable output stays report-only (R-2538)" is true only for the checker's exit status. After R-2730, a deliverable note blocks this repository's suite and so its land.
- **N7. D3 is now measured.** In the scratch product report's model, R-1272's age sits on its `land … · runtime-map` maker claim, its reader shows `code: scripts/code-map.mjs`, and it keeps both code marks. The CAP-01, 02, 04, 07 and 08 cards show their park claims, and the count line is `16 of 21 …, 20 parked`.
- **N8. Consistency if M1 is rejected.** R-1150's reason mentions the temp renders, while R-301's and R-327's do not. Each should say why a temp run does not count for it while it counts for R-341.
- **N9. Confirmed claims (measured).**
  - Measurement 1 holds: `16 of 33 …, 8 parked`.
  - At main, 17 rows are open, matching the plan's list, and 5 stay open after: R-1560, R-291, R-1460, R-1014, R-2632.
  - Measurements 3, 4 and 5 hold: `16 of 21 …, 20 parked`, `rows 1948`, `16 rows in 12 features`, with FEAT-002, 005, 006, 013, 014, 028, 029, 031, 034, 035, 037 and 038.
  - Measurements 8 and 9 hold.
  - R-2730 to R-2739 appear in no tracked file and no remote `feat/*` ledger. The watcher plan uses R-2718 and R-2720 to R-2725.
  - On the changed tree these files pass: frontier (53), writing-check (47), known-bugs (4), requirements-deliverables (6), requirements-tree (96), requirements-moved (7), runtime-map (10), frontier-summary (6) and frontier-golden (1).
  - product-report fails only "validateStore accepts the real repository without a store". It fails the same way on unchanged main in scratch, so it comes from the scratch environment, not this change.
  - The writing and frontier checks already need git in the real checkout (identity-scan.test.mjs:178), so R-2730 adds no new dependency on git.
  - The `cleanEnv` stripping of `GIT_*` in the deliverables test does not reach R-2730's default runner. That matters only under a git hook, which nothing here uses (inferred).

## Measured count

On `<scratch>/park-honestly/attack/repo` (`git archive c273b4de`, committed as one scratch commit; changes in the working tree, then on a scratch `lane` branch for the movement report):

```
main:                    deliverables: 16 of 33 made and read by code, 8 parked
plan (12 parks + R-1272): deliverables: 16 of 21 made and read by code, 20 parked
plan + 3 rows:           requirements tree: 0 problems; rows 1948; features 39
movement (main script):  tree movement …: 16 rows in 12 features
M1 (10 parks + 2 CI makers): deliverables: 18 of 23 made and read by code, 18 parked
```

Scripts: `<scratch>/park-honestly/attack/apply.mjs` (the plan's twelve lines and the reader swap), `pairs.mjs` (nine pairs and the probes), `open.mjs` (open, parked and live rows). Test outputs are in `t-*.out` and `t2-*.out` beside them.

Pairs (with the three tests written as the plan describes, paths trimmed): 1 to 5 → R-2730 red; 6 (both forms), 7 → R-2731 red; 8, 9 → R-2732 red. The probes:
- P10 (omitted park), P11 (fenced park) and P12 (unnamed park) leave R-2730 green.
- P13 (folder reader) leaves R-2731 green.
- P15 (every park removed) turns R-2730 red with no note.
- P16 (uncommitted new reader) turns R-2730 red.
- A non-trimming R-2731 implementation survives pair 6's comma-joined form.

## Plan sections I would change

- Why and Stakes: quote the owner (S2). The Stakes report-only sentence (N6).
- Measurements 3 and 5, the spend line, the Seat steps' expected lines and the Landed line follow M1.
- D1 and the park table: R-301 and R-1150 get CI maker lines instead of park lines (M1). The R-327 and R-749 reasons are reworded, and R-536 and R-1239 tightened (S1). Four separate bench lines (N4).
- D5 and R-2731: the stated criterion and scope (S5).
- D6 and open question 1: default no (S6).
- R-2730's test description: the runner choice (S3) and a fixture control (S8).
- Wrong-code pairs: pair 6 in the comma-joined form (S7).
- Known limits: the preamble conflict (S3) and the non-path artifacts (S4).
- Seat steps: the cross-lane notice goes to every slate planner and the watcher planner (S4).
