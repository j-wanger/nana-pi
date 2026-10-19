# Build brief — adopt-closes-check
Feature: FEAT-014 · Create or adopt a project workspace · ordinary lane
Builder: a Claude Sonnet subagent in ~/nana-pi-wt/adopt-closes-check on feat/adopt-closes-check. Follow packages/nana-pack/prompts/builder-preamble.md.
Use rows R-1670 to R-1679 only; this lane uses R-1670. Run single test files only. Never edit HANDOFF.md or docs/sessions/.

Order: the row, then the test, then the text.
1. REQUIREMENTS.md: add R-1670 (text in the must-meet) to the SUB-021 table, right after R-676, as `untested`. Once its test is green, flip it to `implemented` and cite the test.
2. Test: in packages/nana-setup/tests/entry-guidance.test.mjs, add it just before the temp-folder block (`const root = tmpDir(`).
   - Write `lastStep(raw)`:
     - Turn CRLF into LF.
     - Take the text after "\n## Steps\n", up to the next line that starts with "## ".
     - Return everything from the last line matching /^\d+\. \*\*/ to the end, with whitespace collapsed.
   - Check adopt-py, adopt-ts and adopt-structure. Each skill's last step must contain all five parts:
     - "`nana-setup project <dir> --check`"
     - "`node \"$HOME/nana-pi/packages/nana-setup/bin/nana-setup.mjs\" project <dir> --check`"
     - "ready only when it exits 0"
     - "every ✗ and ! line"
     - "only with the owner's yes"
   - Also require packages/nana-setup/bin/nana-setup.mjs to exist. The failure detail names each skill and the parts it lacks.
   - Put `// req: R-1670` directly above `check("R-1670: adopt-py, adopt-ts and adopt-structure each end on the project check, ready only on exit 0, repairs only with the owner's yes", …`, with the check call on one line.
   - Widen @purpose to: "Pins the completion guidance each scaffold, adopt, copier and project path gives: ratification before trust, and the adopt skills' closing project check."
3. Skill text. Let S be this text:
   Run `nana-setup project <dir> --check`; where `nana-setup` is not on PATH, as on Windows, run `node "$HOME/nana-pi/packages/nana-setup/bin/nana-setup.mjs" project <dir> --check`. It writes nothing. Call the adoption ready only when it exits 0. Otherwise report every ✗ and ! line with the repair the check names: a fresh adoption reads ✗ for the month log until `nana-setup project <dir>` runs, and ! for trust until the owner runs `nana-setup trust <dir>`. Run a repair only with the owner's yes
   - adopt-py and adopt-ts: after step 9, add `10. **Close on the project check.** S, and commit any file it writes by its own path.`
   - adopt-structure: step 8 becomes `8. **Close on the project check, then report.** S. Then list the ...`, keeping the rest of the old report text word for word.
   - Do not change any "First two steps" list.
4. packages/nana-pack/README.md:
   - The adopt-py / adopt-ts row ends "…ends git-tracked on the same `copier update` relationship, then closes on `nana-setup project <dir> --check`."
   - The adopt-structure row gains "Closes on `nana-setup project <dir> --check`."
5. R-291 total: packages/nana-pack/tests/requirements-tree.test.mjs may still carry the leaf total. If so, set its three occurrences to the total that `node scripts/requirements-trace.mjs` prints. If leaf-total-drop has landed, the file holds no total; leave it alone.
6. Regenerate: run `npm run req:tree`, then `npm run map`.

Wrong code to try (each must turn R-1670 red):
- the closing step placed before the commit step;
- adopt-structure left as a plain "Report" step;
- the owner's-yes sentence dropped;
- the node form dropped;
- the step put under "## Notes".

Seat checks (run each one alone on your last commit):
- node packages/nana-setup/tests/entry-guidance.test.mjs
- node packages/nana-pack/tests/skill-claims.test.mjs
- node packages/nana-setup/tests/project.test.mjs
- node packages/nana-pack/tests/templates-render.test.mjs (needs uvx; takes about 75 s)
- node packages/nana-pack/tests/requirements-tree.test.mjs
- node scripts/requirements-trace.mjs (expect 0 rows off form)
- node scripts/requirements-tree.mjs --check
- npm run map:check
- npm run readme:check

Done when:
- R-1670 passes.
- Each wrong code above turned it red.
- The row is `implemented` with its cite.
- Every seat check exits 0.

Report (10 lines or fewer): the commit SHA; R-1670 PASS, and each wrong code with its FAIL; the existing tests you edited (expect only the R-291 total, or none); each seat check's exit code; the trace total; anything left open.