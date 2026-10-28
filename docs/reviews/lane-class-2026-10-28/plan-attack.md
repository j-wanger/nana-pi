# lane-class · plan attack (one adversary, 2026-10-28)

One MUST, five SHOULD, five NOTE. I checked every precedent path and line, and each one opens where the plan says. B3's counts reproduce on 877b123d (139 non-class modules, 21 reached in one hop) when the gate policy files are taken to be packages/nana-pack/lib/gate-*.ts. The lane class of ordinary holds under the wording of AGENTS.md:94.

The MUST: the one-hop rule starts only at pi extensions and Claude Code hooks. It does not start at the CLIs those hooks launch. So the hooks' own logic prints ordinary when a change touches it alone, for example nana-knowledge lib/hook.ts or the adoption window tunable. A build could pass all seven must-meet tests and still miss the lane's purpose. B2's 9-of-10 sample cannot show this, because every hook lane in it also changed a class file directly.

The SHOULDs:
- The four review and land tools get zero hops with no stated reason.
- Must-meet 2 does not test raw paths: non-module and deleted files under class folders.
- Must-meet 5 does not test Windows backslash paths.
- Must-meet 7 sets no time limit on the class run.
- The pack README's claim that the build-record line is "the final stderr line" goes false.

No must-meet adds a report line, a lane step or a record someone must keep. Question 7 is about the planner-prompt plan, so it is out of scope for this plan. This review answers the workflow's task, not the relayed question about faster code search.

## 1. MUST · Must-meet 4 / B1 third test

**Problem.** The one hop starts only at pi extensions and Claude Code hooks. It never starts at the CLIs a hook or extension launches as a process, and those CLIs hold the hooks' real logic. On 877b123d, using the plan's own class set, 8 non-class modules are imported only by hook-launched CLIs. Each of them prints 'ordinary': packages/nana-pack/lib/adoption-config.mjs and seven nana-knowledge libs. The seven include lib/hook.ts, whose header says 'One prompt-time knowledge pull', the body of the UserPromptSubmit hook. The nana-knowledge extension imports only tokenize.ts and runs the CLI with execFile. So a lane that changes only lib/hook.ts, or only retunes ADOPTION_WINDOW_MS, prints ordinary, and every must-meet still passes. The seat has called this kind of change a hook change before: objective-path-shapes classed objective.ts as hook 'which the Claude Code objective hook ... run[s]'. B2's 9-of-10 sample cannot catch the gap. knowledge-freeze-notice also changed bin/nana-knowledge.ts and doctor.mjs, and adoption-window also changed bin/nana-adoption.mjs, so test 3 or a path classed both lanes. No lane in the sample was decided by test 4 alone.

**Fix.** In B1 and must-meet 4, start the hop at extensions, hooks AND the CLIs a hook or extension launches as a process (the test 3 list). Add one case to must-meet 4: a change to packages/nana-knowledge/lib/hook.ts alone prints install, hook or gate and names packages/nana-knowledge/bin/nana-knowledge.ts. Measured cost on 877b123d: one hop grows from 21 to 29 of 135 non-class modules.

**Evidence.** packages/nana-knowledge/extensions/nana-knowledge.ts:57,91,106; packages/nana-knowledge/bin/nana-knowledge.ts:15-21; packages/nana-setup/lib/settings.mjs:215-219; packages/nana-setup/lib/hook-producer.mjs:30-47; packages/nana-pack/lib/adoption-config.mjs:12; docs/reviews/objective-path-shapes-2026-10-20/must-meet.md:4

## 2. SHOULD · Must-meet 4 second bullet (land and review tools get zero hops)

**Problem.** Extensions and hooks get one hop, but the four land and review tools get none, and the plan gives no reason. As a result, changes to the tools' own guardrails print ordinary. Examples: claude-review-config.mjs (REVIEWER_ALLOWED_TOOLS / REVIEWER_DENIED_TOOLS), verdict-config.mjs (which verdict lines review-round accepts), review-standard.mjs (loads the review bar) and land-ci.mjs judgeRuns (nana-land's CI refusal). One prior seat call supports zero hops: ci-timing-records changed the suite-records lib that nana-land imports and was classed ordinary. But the plan leaves the choice implicit, so neither the reviewer nor the owner sees it.

**Fix.** Choose one and write it in B1 with its reason. Either name the tools' guardrail modules in the sealed list as part of 'the land and review tools' (verdict-config.mjs, claude-review-config.mjs, review-standard.mjs, land-ci.mjs), or state zero hops for tools as a deliberate trade that cuts ceremony and record it as a residual.

**Evidence.** packages/nana-pack/bin/claude-review.mjs:15,19-30; packages/nana-pack/bin/review-round.mjs:69; packages/nana-pack/bin/pi-review.mjs:37; packages/nana-pack/bin/nana-land.mjs:19; docs/reviews/ci-timing-records-2026-10-22/must-meet.md (Class: ordinary)

## 3. SHOULD · Must-meet 2 / threat model (deleted and non-module files)

**Problem.** The plan points to precedent that keeps only files the code map holds: blastModel's changedMapped keeps a path only when graph.modules.has(p). A builder who reuses it drops two kinds of change. One is a deleted file, which is gone from the working-tree graph. The other is a file in a class folder that is not a module: packages/nana-setup/claude/hooks/context-size-check.sh, or packages/nana-setup/lib/retired-fingerprints.json and skill-copy-history.json, which uninstall and install import as JSON. The threat model names deleted files, but no must-meet tests them.

**Fix.** Have must-meet 2's check include one deleted file and one non-module file under a class folder, for example a deleted extension and an edited nana-setup/lib/*.json. Each must print install, hook or gate. Matching is by raw path prefix, not by code-map membership.

**Evidence.** scripts/blast-radius.mjs:108; packages/nana-setup/lib/retired.mjs:12; packages/nana-setup/lib/steps.mjs:55; plan.md:48

## 4. SHOULD · Must-meet 5 / threat model (Windows paths)

**Problem.** The threat model lists 'a path given with backslashes on Windows', but must-meet 5 only promises the same class as a diff. A planned list typed on Windows, such as packages\nana-setup\lib\x.mjs or ./packages/..., matches no posix prefix and prints ordinary. Windows testing is required in nana-pi.

**Fix.** Add to must-meet 5: backslash-separated and ./-prefixed forms of a class path give the same class and the same named file as the posix form.

**Evidence.** plan.md:49,87

## 5. SHOULD · Must-meet 7 (risk to a builder run)

**Problem.** pi-worker would run the class script after the build and before process.exit. Must-meet 7 says a failed run leaves the exit unchanged, but it sets no time limit. A hung git call or child process would keep pi-worker open after its build ends. The seat's background task would then never complete, because the seat acts only on that completion notification. The precedent has a sealed timeout, but nothing pins it here.

**Fix.** Add to must-meet 7: a class run that passes a sealed time limit is stopped, prints one reason line, and pi-worker exits with the build's own code. Reuse the shape of review-movement's timeout.

**Evidence.** packages/nana-pack/bin/pi-worker.mjs:385-386; packages/nana-pack/lib/review-movement.mjs:17

## 6. SHOULD · Forecast / README contract

**Problem.** The pack README says 'Its final stderr line gives this build's outcome, elapsed minutes and recorded cost, followed by the lane summary.' In every nana-pi lane after this change, the class line follows that line, so the README claim becomes false. R-2602's check (titled 'the last stderr line ...') asserts lastLine and stays green only because its fixture repo has no class script. The covered claim and the real behaviour drift apart silently. The row text at REQUIREMENTS.md:517 ('after its SUCCESS ... line') still holds.

**Fix.** Under 'Also in this change', name packages/nana-pack/README.md:314. Reword it to say that in a tree carrying the class script, the class line follows the build-record line. Put the R-2602 check title in the forecast as a wording change.

**Evidence.** packages/nana-pack/README.md:314; packages/nana-pack/tests/build-records.test.mjs:307,313; REQUIREMENTS.md:517

## 7. NOTE · B3 (comparison basis)

**Problem.** The '52 of 139' figure is a transitive walk from every class module, nana-setup lib and the four tools included. A walk from the entry points B1 actually names (extensions, hooks, hook-launched CLIs) reaches 41. The one-hop choice still stands, but the 'too wide' number overstates the gap.

**Fix.** Restate B3 with the like-for-like count (41 transitive vs 29 one-hop once the CLIs are entry points), measured on 877b123d.

**Evidence.** plan.md:29; measured with scripts/code-map.mjs repoGraph on 877b123d

## 8. NOTE · Must-meet 2 (undefined folders and files)

**Problem.** 'The gate policy files' is undefined. The seat's 139 count reproduces only if it means packages/nana-pack/lib/gate-*.ts (5 files). nana-gate.ts imports every gate lib directly, config.ts and pipe-guard.mjs included, so the hop already covers them. C2 points to the code-map roots for the 'pi extension folder' list, but those roots do not say which folders pi loads. The pi manifests do, and they name three folders, including nana-stage/extensions.

**Fix.** Name the five gate-*.ts files in the sealed list, or drop that bullet and rely on the hop. Read the extension folders from the pi manifests: packages/nana-pack/extensions, packages/nana-knowledge/extensions and packages/nana-stage/extensions.

**Evidence.** packages/nana-pack/extensions/nana-gate.ts:51-58; package.json:22-25; packages/nana-stage/package.json:9

## 9. NOTE · Must-meet 7 (which copy runs)

**Problem.** The plan does not say whether pi-worker runs the pack's own copy of the script or the lane tree's copy. The precedent runs the pack's copy and only checks that the tree carries the file. With the pack's copy, a lane that adds a CLI to the list (the plan.md:53 residual) does not see its own entry at build end.

**Fix.** State which copy runs. The tree's copy matches the plan.md:53 residual. The pack's copy matches the precedent and runs only the reviewed list.

**Evidence.** packages/nana-pack/lib/review-movement.mjs:19,24; plan.md:53,91

## 10. NOTE · B2 (review-ledger split not sampled)

**Problem.** keep-movement's seat call was 'review-ledger keep is a review tool path'. Under the four-name list, a lane that changes only review-ledger.mjs prints ordinary. Agreement in the sample came from keep-movement also changing review-round.mjs.

**Fix.** Record this as a known split next to review-texts-durable. AGENTS.md:94's four names govern unless the owner widens them.

**Evidence.** docs/reviews/keep-movement-2026-10-25/must-meet.md:29; AGENTS.md:94

## 11. NOTE · Lane class and install check

**Problem.** Ordinary holds under AGENTS.md:94's words. The definition already lives in AGENTS.md prose that is edited under ordinary review, so moving it into a list keeps the same review level. The install check's pi-worker leg launches pi-worker in a fixture repo without the script, so CI's install-check legs exercise the 'prints nothing' path at no extra cost. No nana-setup file changes, so no local install check is due.

**Fix.** None needed. Optionally, add to the forecast that install-check's pi-worker leg is the live test of the script-absent path.

**Evidence.** packages/nana-setup/lib/install-check.mjs:447,581-585; AGENTS.md:94,148
