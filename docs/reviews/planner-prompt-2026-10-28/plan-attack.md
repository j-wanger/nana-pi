# planner-prompt · plan attack (one adversary, 2026-10-28)

The plan is sound in shape, but it has one blocking problem. Must-meet 5 tells planners to put public precedent and the words "None known" in the Precedent section. pi-worker's brief parser refuses both. I ran it on this plan and on the lane-class plan, and both were refused. The fix is small: a separate "Outside precedent" heading, the exact `none: <reason>` form, and a test that runs the parser.

Checks against the task:
(3) Assumptions. A1's FORMAT claim holds: six seat planner scripts carry a `const FORMAT` that points at earlier must-meet files. Its lane counts do not match the folders. A2 holds. A3 is contradicted: the working pattern already limited pairs to install, hook or gate lanes, and 46 of 48 lane folders after 10-21 still carry pairs. A4 holds (the 'rule' reader kind exists at deliverables.mjs:31), but it sits against the 10-22 rule-only-reader ruling. A5 holds: the rulings file is 3,469 bytes against a cap of 8,192 bytes (rulings-config.mjs:22).
(4) Every precedent path exists and does what the plan says, and the line numbers are right. Two closer precedents are missing: brief-precedent.mjs and review-standard.test.mjs.
(5) The ordinary class is correct under AGENTS.md:94.
(6) The forecast holds only if the Plans bullet is added to, not rewritten. Four more checks (R-1100, R-1300, R-1102, R-1103) pin phrases in that bullet.
(7) The readings rule fires on a pre-written plan or a slate 'go'. The ban on giving planners an earlier plan blocks grounding that follow-on lanes need. Restated sources in the prompt can go stale with no failing test. No must-meet adds a line to every report, a step to every lane, or a record to keep.

On the user's code-search question: the code map's impact command (`npm run map:impact`) already lists callers, tests, artifact readers and measured test times for code files. The planner prompt is the right place to tell pi planners to use it. The map is blind to text files: it reports 0 tests for this lane's two prose files, while 15 test files read them. So the prompt should pair the map with a text search for literals. A separate lane under the code-map feature (FEAT-029) could close that gap by listing which files name an unmapped path.

All work was read-only. The impact command only prints, and the worktree status was unchanged.

## 1. MUST · Must-meet 5 (and the plan's own Precedent section)

**Problem.** Must-meet 5 lets the Precedent section name a public project and accept "None known". pi-worker's brief parser (R-2578) reads the first word of each Precedent list entry as a repo path that must be tracked at HEAD, or as the exact form `none: <reason>`. I ran the parser on this plan and it refused: `pi-worker: lane refused: Precedent entries at HEAD 877b123d: "Outside" is not tracked at HEAD`. The lane-class plan is refused the same way on "Outside", "Nx" and "GitHub". A `- None known` entry is read as the path "None" and is also refused. Any brief that copies a Precedent section written to this prompt cannot start a build.

**Fix.** Have the prompt put public precedent under its own heading, such as `## Outside precedent`. readBrief does not match that heading; I checked. Have the prompt spell the no-precedent form exactly as `none: <reason>` and the feature line as `Feature: FEAT-nnn · <label>` at the start of a line. Add brief-precedent.mjs and brief-config.mjs to Precedent. Must-meet 5's test should run readBrief and checkPrecedent on a sample plan written to the prompt's form and assert no refusal. Fix this plan's line 62 before any brief copies it.

**Evidence.** docs/reviews/planner-prompt-2026-10-28/plan.md:62, :81; packages/nana-pack/lib/brief-precedent.mjs:30-41, :45-62, :91-104; packages/nana-pack/lib/brief-config.mjs:11,13; lane-class plan.md:66-68

## 2. SHOULD · Must-meet 1 against the threat model (another project)

**Problem.** "Each heading names a repo file that exists" will push the builder toward paths relative to nana-pi, such as packages/nana-pack/rules/nana-rulings.md or templates/_shared/working-under-nana-pi.md. In another project, which the threat model includes, those paths do not resolve, so the planner cannot find the rulings. The precedence line also leaves out the project's own AGENTS.md section after the markers. The shared pattern says project overrides live there, for example nana-pi's 'The tree in briefs' section and lane-class's planned class sentence.

**Fix.** Name pack files as `$HOME/nana-pi/...` and the working pattern as 'this project's AGENTS.md'. Make the precedence: the owner's words for this lane, then the rulings, then the project's own AGENTS.md section, then the shared working pattern, then this prompt. Have the test resolve `$HOME/nana-pi/` against the checkout root.

**Evidence.** plan.md:68 and threat model line 'a project other than nana-pi'; templates/_shared/working-under-nana-pi.md:34; AGENTS.md project sections after line 103

## 3. SHOULD · Must-meet 3 and O3: the readings rule fires where the owner would find it silly

**Problem.** The only exemption is a fix. A pre-written plan from the owner, or his 'go' on a slate line that already described the lane, still counts as new capability with no stated reading. The seat would then bring two or three readings he has already answered. His own rule says to follow a pre-written plan and not re-derive his decisions. Today's lane-class plan already treats a slate line as the agreed reading, which this prompt does not allow.

**Fix.** Define 'agreed reading' in must-meet 3 and in O3's required meaning: the owner's own words that already choose one meaning, such as a pre-written plan, a pick, or a 'go' on a slate line that described the lane. The planner quotes those words in Purpose and plans. O3 paraphrases the owner, so the seat should show him the added clause with the default 'yes'.

**Evidence.** plan.md:39, :73; lane-class plan.md:7; ~/.claude/rules/nana-personal.md ('When he provides a pre-written plan, follow it')

## 4. SHOULD · Must-meet 6: 'never a format or an earlier plan' stops honest work

**Problem.** This pinned wording spreads into every project's AGENTS.md. It also bars an earlier plan used as grounding. Some lanes need that: hardening an urgent fix that shipped alone, lane two of a split lane, and sibling lanes that avoid colliding (lane-class names this lane twice). Planners would re-derive recorded decisions, against 'a documented past decision beats a fresh derivation'. The drift came from using plans as formats, not from plans as sources of decisions.

**Fix.** Use this wording: 'never a format to copy; an earlier plan only as grounding for a decision it records'. Pin that wording instead.

**Evidence.** plan.md:82; lane-class plan.md:17, :88; <seat-home>/.claude/projects/<project-id>/workflows/scripts/plan-page-detail-wf.js:9 (lane one's plan used as precedent for decisions, not only form)

## 5. SHOULD · Missing instruction: how the planner searches code for Precedent and the test forecast (the user's code-map question)

**Problem.** The prompt does not say how to find precedent or forecast test changes. For code files, `npm run map:impact <files>` already gives callers, tests, artifact readers and measured test times. Pi planners are not told to use it, because nana-standards is a Claude-only rule. The map is blind to text files. On this lane's two prose files it prints 'NOT A MAPPED MODULE' and 0 measured tests. Yet 9 test files read the shared template and 6 name the rulings file. The seat's own recorded lesson is that briefs failed when nobody searched the tests for literals they broke.

**Fix.** Add one sentence to the prompt. Run the project's map impact command on each planned code file to get Precedent and the test forecast. For any file the map does not cover, search the tests and checkers for its path and for each literal the change breaks. This fills the existing forecast section and adds no step or record.

**Evidence.** scripts/code-map.mjs:158 (--impact prints only); packages/nana-pack/skills/requirements/SKILL.md:102-111; packages/nana-setup/claude/rules/nana-standards.md:48; templates/_shared/working-under-nana-pi.md:8 (pi: 'Neither rule'); map:impact run on templates/_shared/working-under-nana-pi.md and packages/nana-pack/rules/nana-rulings.md showed 0 callers and 0 tests

## 6. SHOULD · A3 is contradicted by the repo

**Problem.** The working pattern already limits seat pairs to install, hook or gate lanes, and the R-1300 test pins that. Even so, 46 of the 48 lane folders dated after 10-21 hold seat-mutate or pairs files. Naming a rule in the working pattern did not change seat behavior, and the purpose 'Ordinary lanes stop getting the extra wrong-code campaign' rests on A3.

**Fix.** Restate A3 with this evidence. Name one free check after the land: search the seat's session workflow scripts for `const FORMAT` or a `docs/reviews/.../must-meet.md` format pointer. Six such scripts exist today. This is a one-time search with no record to keep.

**Evidence.** AGENTS.md:94; packages/nana-pack/tests/templates-render.test.mjs:610-615; docs/reviews/*-2026-10-2[2-8]/ (48 folders, 46 with seat-mutate or pairs files); <seat-home>/.claude/projects/<project-id>/workflows/scripts/plan-*.js (FORMAT at :8-13)

## 7. SHOULD · Must-meets 2 to 5: test width and precedent

**Problem.** With a heading or keyword check, a prompt that only lists the words 'Purpose', 'Assumptions' and 'Precedent' in order would pass and still instruct nothing. Must-meet 4's negative claims (no format, no allowed edits) cannot be tested by phrase absence, because the instruction itself contains the phrase. The cited precedent, the rulings form pins, checks only the shape of a bullet. A closer precedent exists in the same prompts folder: the review-standard test pins exact sentences.

**Fix.** For each must-meet, name the exact sentences its test pins, following review-standard.test.mjs:22-40. Test must-meet 4 with pinned positive sentences, plus an assertion that the prompt names no `docs/reviews/` path and no `must-meet.md`.

**Evidence.** plan.md:69-81; packages/nana-pack/tests/review-standard.test.mjs:22-40; packages/nana-pack/tests/rulings.test.mjs:220-226

## 8. SHOULD · Must-meet 1: the prompt duplicates its sources

**Problem.** Headings per source invite restating Plans-bullet and ruling sentences inside planner.md. No test ties that second copy to its source. When the Plans bullet or a ruling changes later, the prompt goes stale and the suite stays green. That is the kind of drift this lane exists to remove.

**Fix.** Have the prompt point to each source by path and hold only planner-only instructions. Otherwise, the must-meet 1 test should check that every line quoted under a source heading appears word for word in that source file.

**Evidence.** plan.md:68; templates-render.test.mjs:597-621 pins only the template; packages/nana-setup/claude/rules/nana-seat.md ('restate neither in a brief')

## 9. NOTE · Test forecast

**Problem.** Besides R-2584, four checks pin phrases in the same Plans bullet. R-1100 pins the threat model phrases. R-1300 pins 'Plans get no review round' and also bans the words 'plan-review round'. R-1102 pins 'Once every reviewer says LAND...' and R-1103 pins 'Urgent fixes ship alone...'. The AGENTS.md region must stay byte-identical to the template. The forecast holds only if the builder adds to the bullet rather than rewriting it.

**Fix.** Name those four checks in the forecast as phrases the bullet keeps.

**Evidence.** packages/nana-pack/tests/templates-render.test.mjs:432-436, :597-621

## 10. NOTE · A4 and the 2026-10-22 ruling

**Problem.** The prompt is made by hand and read only through a rule. The standing ruling says closing a hand-made maker or a rule-only reader comes first. A reviewer may read the new artifact line as going against that ruling.

**Fix.** In A4, name the ruling and give the reason: there is no code reader by design, because the print command was cut (A2).

**Evidence.** packages/nana-pack/rules/nana-rulings.md (2026-10-22 artifact ruling); scripts/deliverables.mjs:31; REQUIREMENTS.md:489

## 11. NOTE · A1 count, and the readings ruling has no pin

**Problem.** The FORMAT half of A1 holds: I found six scripts. The '34 lanes, 31 ordinary' figure does not match the folders, which number 48 after 10-21, with 46 holding seat pairs. Separately, the readings ruling gets no row, while the 10-22 helper ruling is pinned word for word.

**Fix.** Say how 34 was counted, or use the folder count. Consider a one-line pin for the readings ruling, following R-2663.

**Evidence.** docs/reviews/*-2026-10-2[2-8]/; packages/nana-pack/tests/rulings.test.mjs:229-234

## 12. NOTE · Overlap with the lane-class lane

**Problem.** The lane-class plan has the same pi-worker Precedent refusal (checked). Both lanes edit AGENTS.md and REQUIREMENTS.md. This lane's files, a linked rule and a prompt, are the live example of lane-class's open owner question on widening the class (C3). Under AGENTS.md:94 and lane-class's three tests, this lane is ordinary today.

**Fix.** Whichever lane lands second should add one prompt sentence telling planners to take the class from `lane-class --files`. The seat can use this lane's file list as the concrete example when it puts C3 to the owner.

**Evidence.** lane-class plan.md:44-47, :66-68; AGENTS.md:94
