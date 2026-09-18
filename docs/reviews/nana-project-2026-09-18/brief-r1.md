# Review brief — project seeds + `nana-setup project` (round 1)

Independent reviewer, read-only tools. Under review: the single commit on this branch over main (`git show HEAD --stat`; `git diff HEAD~1`).

## What was built
The last manual step in making a blank folder a nana project. ONE seed source in `templates/_shared/` (OBJECTIVE.md, HANDOFF.md, docs/sessions/README.md) consumed three ways: (1) the copier template renders them for both languages via one-line `.jinja` include wrappers + `_skip_if_exists` in `copier.yml` for adopt mode; (2) the `adopt-structure` pi skill copies them when absent (new step 6); (3) a new `nana-setup project [dir] [--name] [--dry-run] [--check]` (packages/nana-setup/lib/project.mjs + bin wiring) that git-inits, seeds the three files + this month's sessions file, writes a stub AGENTS.md with the canonical section + CLAUDE.md symlink when neither exists, `.pi/nana-pack.json` when absent (and no user-scope postEdit commands), then refreshes the knowledge index. Tests in packages/nana-setup/tests/project.test.mjs render the copier template for real.

## Check, ranked by blast radius
1. Never-overwrite guarantees in `project.mjs`: every write path when the target exists (regular file, symlink, directory named like the file), the `--name`/`<date>` substitution never touching an existing file, dry-run writing nothing, `git init` never nesting a repo, `.pi/nana-pack.json` skipped correctly when the user-scope config has postEdit commands (read packages/nana-pack/lib/config.ts for the per-key-group replacement rule the skip is based on).
2. Copier: does `_skip_if_exists` protect the three paths in BOTH modes or only adopt; does the jinja include break when `project_name` contains Jinja-significant or `<name>`-like text; does `{% filter replace %}` change whitespace/trailing newline vs `_shared` (the test asserts byte-equality — confirm the assertion is real, not normalized away).
3. Placeholder handling: `<date>` literal in copier renders (documented) vs filled by `nana-setup project` and the skill — is there any path that leaves `<name>` unfilled, and can a folder basename with regex-special characters break the replace.
4. The knowledge refresh step: it spawns the sibling package's bin — what happens when the index home is missing, when a build lock is held, or when the spawn hangs (is there a deadline; the hook has one, does this).
5. The stub AGENTS.md: is the canonical section byte-identical to `templates/_shared/working-under-nana-pi.md`, and does the stub say the right thing about the symlinked CLAUDE.md on win32 (copy).
6. Tests: assert invariants or mirror the implementation; are temp dirs isolated from the real home and from the real `~/.pi/agent/nana-knowledge` index (a test that triggers a real build against the user's index is a defect).

## Output
Findings ranked BLOCK / HIGH / MEDIUM / LOW with file:line and a concrete failing input each. Then one line: `VERDICT: LAND` or `VERDICT: BLOCK` (BLOCK only for a real BLOCK/HIGH). Be adversarial; do not pad.
