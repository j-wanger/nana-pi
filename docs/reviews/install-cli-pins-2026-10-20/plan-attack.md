# install-cli-pins — plan attack (one adversary)

Verdict: AMEND

AMEND. The pins are sound. Every row stays green on main 1c539a0e and turns red on its named wrong code. I probed each one in a temp clone with a temp HOME on macOS, Node 22. Eight fixes follow.

1. Base moved. win-config-json-path landed during the attack, so main is now 1c539a0e, not 6f07daee. It touched doctor.mjs (the nana-pack.json row only), doctor-detail and fresh-machine. None of the target rows or test files changed. I re-ran every probe on 1c539a0e.

2. Class should be ordinary, not install.
   - AGENTS.md defines an install lane as one that changes install, uninstall or doctor code. This lane changes tests and the ledger only.
   - Direct precedent: install-pins (10-19) was the same feature with the same test files, and it was classed ordinary.
   - The install-check before the land still applies, because the tests sit under packages/nana-setup/ (the owner's 10-12 rule).
   - The wrong-code pairs stay as the pin's evidence. Nothing else in the install ladder buys anything here.

3. R-317's table missed two mutations:
   - M8 accepts the expected argument anywhere after the target.
   - M9 matches the interpreter by substring.
   Two added must-not-match cases fix this: `nodemon /x/<script>` and `node …/nana-knowledge.ts build hook`. The pairs are now 9/9 red.

4. R-349's literal desk row would fail on green code. Install pads labels, so the check needs `/desk service\s+skipped\s+skipped \(win32/`. With that pattern, all four wrong codes turn it red.

5. R-927 must compare with `trimEnd().endsWith("registered as " + rel)`. A RegExp built from a Windows path breaks on backslashes, and a cross-drive temp gives an absolute rel. The check reuses the block's existing install and doctor results, so it adds no new runs.

6. R-384's "settings.json bytes unchanged" proves nothing: under --home, install never runs pi. The `registered as` row is the evidence.
   - Direction A reuses the existing worktree-CLI run `r`. Only direction B adds a run.
   - Both directions are read before the block rewrites settings.json.
   - Dropping the common-dir fallback is red on B uncommitted, and on A once committed in the scratch clone.

7. R-320's accept side must use entryInvokes(…, platform()), so native Windows exec-form entries count.
   - Probed: all 5 rungs are red, the parse-as-{} change is red, and the blank-refused change is red.
   - The stricter rung-5 variant (a group without hooks refused) is red too.
   - With rung 1 dropped, install writes over a `[]` file and exits 0. That is real harm, and this pin catches it.

8. R-383 details:
   - The seed path is the same for both runs. Give freshHome an optional path, and use rmSync with maxRetries for Windows.
   - project needs `--home H`.
   - Project seeds carry today's date, so a pair that crosses local midnight differs. This is a known limit.
   - Probed: install, dry run and project all match byte for byte, with and without --yes.
   - --yes setting desk is red. An install prompt is red on both R-383 and R-315.
   - On EOF, a prompting install exits 0 having seeded nothing. So R-315's seeded-file assertion is load-bearing.

Also checked:
- R-932 trialled in place, after the existing explicit runs. The file went from 30 to 31 PASS with no other check moved. Both wrong codes are red.
- Retirements are kept. R-739 and R-939 both sit in FEAT-013. HANDOFF already records R-939 as a duplicate the win-claude-skills build kept. Open question 14 names the seat. No test marker cites either row. The product report's stored stamps compare at their own commit, so a status change only marks the assessment stale.
- Runtime: Windows CI runs these five files in 2.8 to 11.7 s each. The roughly 20 added runs (about 0.4 s each there) leave every file far under the per-file limit.

Files the build touches:
- packages/nana-setup/tests/ relative-agent-dir, install, settings-merge, win32-degrade and pi-registration (.test.mjs)
- REQUIREMENTS.md
- docs/requirements-tree.md
- docs/code-map.md, only if map:check reports drift (expected none: no new imports)

Conflicts:
- REQUIREMENTS.md and the tree: text-only conflicts with every in-flight and slate lane. Merge main and regenerate the tree.
- pi-probe-timeout: it edits steps.mjs and doctor.mjs, but the `registered as` text is untouched and the --home path never launches pi. No shared test file.
- hook-deadlines and install-check-turn-edit-powershell: no overlap.
- project-check-quiet: only if it rewrites FEAT-014's Also applies line, a one-line conflict. R-383 runs plain `project`, not --check.
- ci-suite-timeout, knowledge-index-pins, install-check-review-launch: no overlap.

Writes outside the lane: none new. The existing pi-registration block already adds and prunes a throwaway worktree in the repo's shared git directory. All wrong-code commits go in a temp clone, never on feat/install-cli-pins.

Most likely wrong: R-383's exact comparison on native Windows. A file-handle lag on wiping the re-seeded home (a git folder from project, or a slow knowledge refresh child) could fail the wipe. Byte-equality also has never been seen on a Windows home; I probed only macOS. The plan's own worry (R-384 direction B on Windows) looks low risk to me. It runs the same two gitCommonDir lookups as the forward case, which already passes on Windows CI, with the roles swapped.
