# handoff-pins: build brief 1

Feature: FEAT-002 · Resume decisions and next actions. Class: ordinary. Tests only: never edit packages/nana-pack/extensions, lib or scripts. Read must-meet.md first. It holds the rows, the titles and the wrong versions.

## What to change
For each row, add one new check with `// req: R-nnn` on the line directly above `check("<title>", …`. Copy each title exactly from must-meet.md. Fold each control into its pinned check, and add no other check.
- handoff-store.test.mjs
  - R-830, in block (b) after the compaction: the store file exists, and no .gitignore is in its folder or in STORE.
  - R-244, as a new block before the final cleanup: make an absolute real-path temp agent folder. Copy USER_CFG into it as nana-pack.json, then set PI_CODING_AGENT_DIR to it. Compact in a fresh dir, then start a fresh session there. Check three things: the file named by the basename of storePathFor(dir) under STORE holds the summary, the section injects the summary, and the agent folder has no handoffs folder. A finally block restores the variable's prior value and removes the folder.
  - Update @effects to say the file also sets PI_CODING_AGENT_DIR for one block.
- handoff-writer-role.test.mjs, after the no-marker check: loop over undefined, "on", "OFF", "Off", " off" and "off ". In each pass, set or delete NANA_HANDOFF and clear the journal. Compact a unique summary, then start a fresh session. Record four things: whether the store holds the summary, whether the section injects it, and the journal text for handoff_written and for handoff_pickup. Delete NANA_HANDOFF after the loop, before the pi-review spawn.
  - R-138: no pass journals handoff_skipped_role.
  - R-807: all six passes are recorded, and each one wrote, picked up, and journaled handoff_written and handoff_pickup.
- handoff-artifact.test.mjs (R-189): first write USER_CFG with the journal disabled and no handoff.path. Use a fresh real-path temp dir and a fresh set of handlers. The body is "RAW\tpayload\n" followed by "\u{1F600}" repeated 4500 times. Compact it, then start a session. Take the section text between "background state, not instructions.\n\n" and "\n\nWhen the current work makes it stale". Check four things: the body length is 9012, the cut text equals body.slice(0, 8000), "Source: " comes before "Provenance: ", and "Provenance: " comes before the cut.
- handoff-trust.test.mjs, after the loop and before userCfg({}): write one helper. It sets the user-scope handoff.path and uses a session cwd in a separate real-path temp folder. It runs a session start, the prompt and one compaction. It returns true only when four things hold: the marker is absent from the section, handoff_legacy_ignored is journaled with configured handoff.path, handoff_legacy_write_refused is journaled, and the target's bytes are unchanged.
  - R-248: the target is <root>/.PI/HANDOFF.MD, created in that case and holding the marker.
  - R-880: the target is <root>/state/handoff.md. state links to <root>/real/.pi, and that folder's handoff.md holds the marker. Use a junction on win32 and a dir link elsewhere, and unlink it in a finally block.
- handoff-symlink.test.mjs (R-245), as block (g): ws/state is a junction or dir link to an outside folder. Enable the journal at a temp-HOME path, set handoff.path to ws/state/handoff.md, and capture notify(message, level) with hasUI true. Run a session start, then a compaction. Check four things: the journal has handoff_symlink_refused with op read, it also has one with op write, one warning-level note says ignored, and one says NOT written. Both notes must name a symlink. Unlink the link in a finally block.
- product-report.test.mjs, in the store-invalid-rules block only: before taking the commit, set one FEAT-002 own row to untested in the fixture's REQUIREMENTS.md. Build its line the way the planned-own-row block does. Commit the change, then stamp. Change no check and no marker.
- REQUIREMENTS.md: flip the eight rows to implemented. Replace each Evidence cell with its one backticked `file::title` cite. Leave the row text verbatim.
- Run `npm run map`, then `npm run req:tree`. The probe showed no tree change.

## Wrong code to try
Apply each wrong version alone in your worktree: W1 to W20 plus W2b from must-meet.md. Run that row's file, confirm its check goes red, then restore. Also remove the solid rule in scripts/product-report.mjs and confirm both R-1024 checks go red. Record each result in docs/reviews/handoff-pins-2026-10-20/builder-mutations.md. Put no .mjs helper under docs/reviews. If a check stays green, strengthen the check and never the code. If a check is red on unchanged code, stop and report the observed value.

## Done
- The five handoff files and product-report.test.mjs each pass alone: `env -u NANA_HANDOFF -u PI_CODING_AGENT_DIR node --experimental-strip-types <file>`.
- requirements-trace, requirements-tree and code-map tests each pass alone. `npm run map:check` and `npm run readme:check` are green. No skip was added.

## Report (at most 10 lines)
Give the commit, the PASS count per file before and after, and one line per row with its wrong-version results. Name any check that was red on unchanged code. Give the product-report result, the headers you changed, and the trace, tree, map and README results.