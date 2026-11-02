## Review: builder-credentials (`origin/main...3eefdd5c`, PR #322)

**What changed.** The lane adds one Scope line to `packages/nana-pack/prompts/builder-preamble.md:9` and requirement row R-3650. It adds one `RULE_LINE.storedCredential` entry and a tagged `preambleOnce` check in `packages/nana-pack/tests/worker-lane.test.mjs:403,426`. It also regenerates the tree and adds one authorized session entry.

**What I ran on the tip.** These checks all exited 0, and the worktree stayed clean:
- `worker-lane.test.mjs` (the R-3650 check passed), `worker-claude.test.mjs` and `templates-render.test.mjs`
- `requirements-trace.mjs`, the tree check (`requirements-tree.mjs --root .`, 0 problems) and `known-bugs.mjs`
- `identity-scan.mjs --root .` (0 findings)

PR #322's CI is green on exactly `3eefdd5c`: all three suite legs and all four install-check legs.

### Your three questions

**1. Does the line say clearly what not to do and what to do instead?**

Yes. It forbids the exact move from the incident (`git credential fill`/`get`), plus keychain, file and environment-variable tokens, and direct GitHub API calls. It names the allowed path (`git push`) and the fallback when a step needs a credential or `gh` is missing: report and stop. An over-helpful builder in the 2026-11-03 situation (no `gh`, told to open a PR) now has an explicit instruction to stop instead of improvising.

**2. Does the check pin the line without weakening other preamble checks?**

Yes.
- The check matches the whole line exactly once in the prompt pi-worker actually delivers (`prompt-1`, after `{{WORKTREE}}`/`{{BRANCH}}` are substituted), not just the source file.
- Removing or rewording any clause makes it fail, and `wrong-code-first.log` records the failure against main's preamble.
- `RULE_LINE` is only read by key, never looped over, so the new entry changes no other check.
- R-682's check in `templates-render.test.mjs` (the Scope slice before `\nTests\n` still contains the issue line) still passes.
- No line count or file hash pins the preamble.
- The install-check build fixture reads the preamble at run time.

**3. Does the change cause a harm the review standard lists?**

No. It writes no data and adds no test writes. Install and hooks are untouched; the preamble is prompt text, and the install-check legs are green. Nothing main does today breaks, though see SHOULD 1 for a wording risk.

### Findings

**SHOULD 1 — the line doesn't explicitly allow `gh`.** The line says "never … use a stored credential", but both allowed paths use one: `git push` goes through the credential helper, and `gh pr create` uses gh's own stored token. Push is explicitly allowed. `gh` is only implied ("if `gh` is missing"). A very literal builder told to "open a draft PR with `gh`" could read "a step needs a credential" as covering it and stop. The cost is that the seat opens the PR by hand; nothing is lost. Suggested fix for the hardening lane: add "open a pull request with `gh` when your brief asks". Record as a known bug.

**NOTE 2 — "plain `git push`" can be read too literally.** On a fresh lane branch with no upstream, a bare `git push` fails. "Plain" means "without credential tricks", but a literal reader could hesitate before adding `-u origin <branch>`. This is wording only.

**NOTE 3 — R-3650 sits out of numeric order.** The row is placed between R-2509 and R-2510, as the brief asked ("same table as R-2510"). The trace and tree checks accept it.

**Known bugs.** None of the 74 lines in `docs/known-bugs/FEAT-002.md` concern the preamble, credentials or builder push, so none are touched.

This line is advice to the builder only. Actually blocking the commands is left to the later gate lane, as the brief says.

No MUST stands.

VERDICT: LAND
