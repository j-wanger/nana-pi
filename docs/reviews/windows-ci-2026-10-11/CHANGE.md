# Change declaration — Windows in CI

*Lane `windows-ci` · branch `feat/windows-ci` · worktree `~/nana-pi-wt/windows-ci`, based on `main` at
`0818b72` · 2026-10-11. Feature: **FEAT-019 · Release usable templates and report support** (home of
the CI rows R-597, R-686, R-996 and the support line R-684). Order: why → plan → sol plan review (item
`windows-ci-plan`) → build → a CI run on a draft pull request → seat verification → sol build review →
astra land review → Jake accepts. Runs in parallel with the product-report lane (Jake, 2026-10-11:
"Yes start windows ci in parallel").*

## 1. Why

The current priority (since 2026-10-10) is nana working consistently in terminal mode for both seats
on macOS AND Windows, installation and every hook included. Jake on 2026-10-10: "Windows has always
been used on my corporate machine, and there are definitely inconsistencies", then "do CI route
first, note VM as the next thing to test". Yet CI has never run on Windows: the suite matrix is
`[macos-latest, ubuntu-latest]` (`.github/workflows/ci.yml:19`), and the support line, identical in
three front doors (R-684), says "the pack runs on native Windows but is untested".

**Observable outcome.**
1. Every push to main and every pull request runs the full suite on `windows-latest` too, as a leg
   whose failure does not block the release (like Linux today); macOS stays the blocking leg.
2. The first Windows run's failures are recorded, one line each, as the work list for the fix lanes
   that follow — this lane does not fix them.
3. The support line says what is true: Windows runs in hosted CI with a non-blocking suite leg.

## 2. Requirement delta (FEAT-019)

| ID | Change | Text (draft) |
|---|---|---|
| R-1032 | added | The root CI suite job shall run on `windows-latest` as a leg whose failure does not block the release job. |
| R-684 | reworded ("the native Windows pack untested" → Windows in hosted CI with a non-blocking suite leg) | The root README, root AGENTS.md and nana-setup README shall each carry exactly one `Support:` line, identical across the three, stating: macOS tested; Linux and Windows in hosted CI with non-blocking suite legs, and no recorded machine install on Linux; on Windows no Claude Code hook except the knowledge pull, no PATH command, and the review and builder launchers unavailable; launchd macOS-only — and no competing broad Windows parity language. |

(The rows' numbers follow the product-report lane's R-1012–R-1031; whichever lane lands second
renumbers if needed.)

## 3. Scope

**In.** `.github/workflows/ci.yml`: `os: [macos-latest, ubuntu-latest, windows-latest]`;
`continue-on-error: ${{ matrix.os != 'macos-latest' }}`; bash as the default shell for the suite job
(`defaults: run: shell: bash`, so the pinned `test "$(pi --version)" = ...` step runs on Windows);
nothing else in the workflow. `packages/nana-pack/tests/ci-workflow.test.mjs` (R-597's pinned matrix
and continue-on-error lines; R-1032's test). The support line in `README.md`, `AGENTS.md` (outside the
shared marker region) and `packages/nana-setup/README.md`, identical, and R-684's pinning test
(`templates-render.test.mjs`). `REQUIREMENTS.md` (the two rows), regenerated outline. `HANDOFF.md` and
the session entry (seat, before the final review): the Windows failure list.

**NOT.** Fixing any Windows failure; the tree checker's CRLF gap; the install-and-hooks check; a
Windows virtual machine; making Windows or Linux blocking.

## 4. Design

- A pull-request run is the only way to see the Windows leg before merging (CI runs on pushes to main
  and on pull requests). The lane branch is pushed and a DRAFT pull request opened once the build
  passes locally — with Jake's approval, since both are outward-facing. The run's result becomes
  evidence in the lane.
- The failure list names each failing test file and check with the first error line; where the cause
  is evident (path separators, CRLF, symlinks, a POSIX-only command), say so, else "cause not yet
  known".

## 5. Verification

`npm run test:locked` (macOS, local); the CI workflow test pins the new matrix and non-blocking
expression (mutation: drop `windows-latest` → red; make it blocking → red); the support-line test
pins the reworded line in all three files; the draft pull request's CI run shows the macOS leg green
and a completed Windows leg (pass or fail), and its failures land in the lane's records.
