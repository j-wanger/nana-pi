Feature: FEAT-041 · Shape each agent's context by role

# Review brief 1: leak-hook

Review `git diff main...HEAD` on feat/leak-hook (e724313d plus the seat's HANDOFF line and this brief; 14 files, about +293 / -37).

The owner adopted the reduction order on 2026-11-09 ("Defaults"); its next step is "the pre-push leak hook". The standing ruling of 2026-10-16: "The public repo carries no owner name and nothing about the owner's work." Research found that 4,089 of 4,175 public main commits carry the owner's guessed git identity as author; on the owner's default, the seat set this repository's own `user.name` and `user.email` to the owner's private GitHub address before the build.

The lane:
- adds commit metadata (author, committer, message) to the range scan, with counts-only output;
- adds a `--pre-push` mode to the leak-scan CLI that reads git's ref lines, skips deletes, scans annotated tags' tagger and message, and refuses missing bases and unknown objects;
- adds a setup step that writes one marked POSIX shim into the repository's shared hooks folder, only for an explicitly named main checkout, leaving foreign hooks and `core.hooksPath` alone and skipping linked worktrees;
- deletes the seat-guide bullet that told the seat to run the scan by hand, retires R-3748 and adds R-4016 to R-4021.

An adversary from another model family checked the plan first; its five changes (annotated tags, isolation from the real repository's hooks, repository-wide scope, `nana-land` not pushing, literal path quoting) are in the card.

Builder's validation: the touched tests pass alone, including the new scratch-remote test (6 checks); trace, tree check, `check:lane` and the macOS install check pass; the real repository's `pre-push` file stays absent after those runs. Seat re-ran trace, tree check and the new test on the tip, and confirmed the real hooks folder has no `pre-push` file.

Questions:
- Does the hook block every honest leak the threat model names (an identity word, a home or temp path, a commit or tag under a guessed identity) on every ref shape git sends, and never read an unknown object as clean?
- Can any test, install-check run or seat command write the real repository's hooks folder by accident? The CLI defaults the repository to its own checkout unless `--home`, `--claude-home` or `--pi-home` is given; check callers that isolate HOME only through the environment.
- Does the metadata scan change pi-worker's post-build scan or the manual CLI beyond adding hits?
- Is every row honest, with no reused text?

Threat model: honest mistakes are in; deliberate bypass (`--no-verify`, deleting the hook) is out.

Put exactly one verdict line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, as the last line, and no other line starting with "Verdict".
