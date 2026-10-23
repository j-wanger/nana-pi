# Review — land-reads-ci, confirmation round 2, 2026-10-22 (the land reviewer)

Feature: FEAT-008 · Integrate and clean up reviewed changes

Class: gate. Threat model as round 1 (`review-brief.md`): honest variation in our tools' output and the machine's tools, deliberate forgery out.

This is a confirmation round. Review only the change since round 1's revision, 150eefd6, which both reviewers accepted with LAND (`r1-opus-ac87b099.md`, `r1-land-07e3a671.md`). No product code changed since then; every change is in `packages/nana-pack/tests/land.test.mjs`, the lane's review folder, the FEAT-008 known-bug file, generated docs and the merge. The lane's own commits:
- 290ade02 — CI finding F3, round 1's texts kept, `build-brief-3.md`. Draft PR CI at 150eefd6 failed R-2589 on the macOS and Linux suite legs: the child no-gh case's PATH was node's folder plus git's folder, and those runners keep gh in git's folder (`/usr/local/bin` or `/opt/homebrew/bin`, `/usr/bin`), so the child found a real gh.
- 9501dcc2 — build 3: the child gets a bin folder holding only node and git, with a `ghResolves` check and a SKIP line when gh still resolves.
- 67d30891 — the seat's finding F4 on build 3 (its win32 `.cmd` shims cannot start git, because nana-land spawns git without a shell and Node resolves only `.com` and `.exe` there), round 1's three notes in FEAT-008, `build-brief-4.md`.
- 4684392b — build 4: on win32 the child's PATH is git's own folder; POSIX keeps build 3's symlink folder.
- 52f9e85e — the seat's pairs, 19 of 19 red at 4684392b (`seat-mutate-output-4684392b.txt`).
- 76424074 — a merge of current main, ca4018ed (project-drift-notice landed). Conflicts were HANDOFF's Landed lines (both kept, main's first) and the session archive (both kept); the seat regenerated the code map and tree outline and updated HANDOFF's lanes line and Windows first-try count. The rest of the merge diff is the landed lane, already reviewed there; review only its interaction with this lane.
- the final commit adds this round's two briefs.

The seat's record: draft PR CI at 52f9e85e was green on every leg (macOS, Ubuntu and Windows suites, both install checks). No removed escape lines in builds 3 and 4. Session titles 0 missing. After the merge, `land.test.mjs` passes, and map:check, readme:check and the trace are green. Build 4's locked full suite: `206 PASS, 0 FAIL, 2 SKIP`.

The land still uses this worktree's own `nana-land.mjs` (D11), so its first real CI read is this pull request's run at the reviewed tip.

As the land reviewer, ask whether the test changes still prove what R-2589 claims on every runner, and whether anything in the merge changes how this lane's CI read behaves for later lands.
