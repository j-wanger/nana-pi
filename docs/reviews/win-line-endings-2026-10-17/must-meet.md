# win-line-endings — nana-pi and new TypeScript projects work under Windows' default line endings (W2 of the Windows fixes, 2026-10-17)

**The feature.** Git for Windows' installer default is `core.autocrlf=true`, and nana-pi's `.gitattributes` has no
line-ending rule, so a Windows checkout of nana-pi, and copier's clone of it when scaffolding or adopting a project, gets
CRLF text files. The TypeScript template's code-map, readme-check and trace scripts split on `"\n"` only, so a TS
project made on a default Windows machine fails `map:check` from its first commit; seven nana-pi test files fail on the
Windows CI leg for the same reason, two of them by crashing (hiding about 160 checks); and the mutation runner's scratch
worktrees inherit the machine's autocrlf, so a pair's anchor misses. After this lane, nana-pi checks out LF everywhere,
the template scripts read CRLF files as they read LF files, and the mutation runner's worktrees hold the committed bytes.

**Design.** `.gitattributes` gains `* text=auto eol=lf` and keeps its fixtures line (the index already holds every text
file as LF: `git ls-files --eol` shows 0 `i/crlf`, so nothing renormalises). The TypeScript template's
`scripts/code-map.mjs`, `scripts/readme-check.mjs` and `tests/requirements-trace.ts` split on `/\r?\n/` wherever they
split lines (the triage names `code-map.mjs:374`, `readme-check.mjs:285-422`, `requirements-trace.ts:72`); the Python
template's scripts are checked by the same test. `packages/nana-pack/lib/mutation-runner.mjs` passes
`-c core.autocrlf=false` to its `git worktree add` and its reset. The mutation runner test's fake-npm sub-case is gated to
POSIX with a printed reason (the pack README already declares npm's values unread on Windows). Sources:
`docs/reviews/windows-fixes-2026-10-17/rows.json` and `plan.md` §2 L2.

**Lane class: ordinary.** One final reviewer. A template change ships to new projects through CI's template tag after
the land. Threat model: honest variation in git's line-ending settings and in editors' saves in scope; deliberate forgery
out. The adversary's point on this lane (`attack.md` 1.3: an existing checkout keeps its CRLF files) is taken as a step
for the owner, not a test.

## Rows

| ID | Text |
|---|---|
| R-1320 | The repository's `.gitattributes` shall check out every text file with LF line endings, whatever the machine's `core.autocrlf`. |
| R-1321 | Each project template's code-map, readme-check and trace scripts shall pass on a rendered project whose text files have CRLF line endings. |
| R-1322 | The mutation runner shall create and reset its scratch worktrees with `core.autocrlf` off, so each holds the committed bytes. |

## Must-meet tests

- **LE1 (R-1320).** `git clone -c core.autocrlf=true` of this checkout into a temp folder gives `AGENTS.md`,
  `.github/workflows/ci.yml` and `docs/requirements-tree.md` with no CR byte, and `.gitattributes` still holds the
  fixtures line.
- **LE2 (R-1321).** For each template (TypeScript and Python), a rendered project with every text file rewritten to CRLF
  passes its code-map check, readme-check and trace script, as the LF render does.
- **LE3 (R-1322).** A fixture repository whose own git config sets `core.autocrlf=true` (Git for Windows' default,
  reproducible on any platform) gives the mutation runner a scratch worktree whose files are byte-identical to the
  committed LF files, and a pair whose anchor spans a line break applies.
- **LE4 (evidence).** On the Windows CI leg, `ci-workflow`, `code-map`, `requirements-tree`, `templates-render`,
  `product-report` and `mutation-runner` (all under `packages/nana-pack/tests/`) and
  `packages/nana-setup/tests/entry-guidance.test.mjs` each pass with their macOS count minus declared win32 skips.

## For the owner after the land (a HANDOFF ask, not a test)

An existing Windows clone keeps the CRLF files it already has: git rewrites only files that change. After pulling,
commit or stash any work, then run `git rm -r --cached -q . && git reset --hard` once in that clone.

## Known limits

A CRLF file an editor saves inside nana-pi on Windows is normalised to LF at commit (that is the rule's purpose). Files
under `packages/nana-setup/tests/fixtures/retired/` keep their whitespace rule.
