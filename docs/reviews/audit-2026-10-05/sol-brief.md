# Review brief — nana-pi audit fixes, 2026-10-05 (reviewer: gpt-5.6-sol)

A four-agent audit of nana-pi found two defects and about twenty documentation drifts. A Claude
worker fixed them on this branch. The seat's brief is `brief.md` in this folder. The worker's
claims, tagged [V]/[S]/[I], are in `worker-report.md`. Review `git diff main..HEAD` in full.
pi 1.0.2 is installed: its docs are at `$(npm root -g)/@earendil-works/pi-coding-agent/docs/`.

## Attack

1. **Template lint fix (R-858).** Are the ruff and biome ignores scoped to exactly the files that
   need them, so a user's own code stays under the full rule set? Render both templates fresh
   from this branch (`uvx copier copy --vcs-ref HEAD <this worktree> <scratch> --defaults --data
   language=python|typescript --data project_name=X`) and run their gates yourself:
   - Python: `uv sync`, `uv run ruff check .`, `uv run ruff format --check .`, `uv run pre-commit run --all-files`;
   - TypeScript: `pnpm install`, `pnpm check`.
   The new `templates-render.test.mjs` checks are "availability-gated". Do they run on this
   machine, or skip? Does a skip still let the rail call R-858 implemented? Would the checks
   catch a regression, not just confirm today?
2. **The shared section (R-859).** `templates/_shared/working-under-nana-pi.md` is now the union
   of two drifted texts, and `AGENTS.md` (`CLAUDE.md` links to it) holds a byte copy. Check
   every sentence of the shared file against the code it describes:
   - the gate (`packages/nana-pack/extensions/nana-gate.ts`, `lib/gate-paths.ts`);
   - post-edit and receipts;
   - handoff (`extensions/nana-handoff.ts`, `lib/adoption.mjs` store path, staleness default);
   - the journal and the objective (`lib/objective.ts`);
   - the requirements-first subsection.
   This text ships to every new project as instructions to agents, so a false sentence there is
   the worst outcome of this lane. Does the R-859 test fail on real drift?
3. **Documentation edits.** For each, is the new text true? In particular:
   - the pi 1.0.2 version claims;
   - the new pi-landscape addendum (check every fact against pi's installed docs and source);
   - the desk Known-limits bullet and the citation fix;
   - the pack README handoff-store sentence;
   - REQUIREMENTS Part G intro;
   - the README section move (content unchanged?).
4. **Anything the edits made false or inconsistent** elsewhere: other READMEs, `HANDOFF.md`
   (the seat edits it after you, so just report), and the code map.

## Output

Answer with the full review as your final message; do not write it to a file. Give ranked findings
(MUST / SHOULD / NOTE) with file:line, evidence (what you executed or read) and the smallest fix.
End with `VERDICT: LAND` or `VERDICT: BLOCK` and a score out of 10.
