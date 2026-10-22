# Change declaration — pin the dependency tree CI installs with pi

*Lane `ci-pi-pin` · branch `feat/ci-pi-pin` · worktree `~/nana-pi-wt/ci-pi-pin`, based on `main` at `3f5151f`
(the cc-hooks-windows land tip, pushed 2026-10-13) · 2026-10-13. Feature: FEAT-019 "Release usable templates and report support" (new
R-1090, R-1091, R-1092; no reworded rows). URGENT and SMALL: the owner's ruling is that urgent fixes ship alone and
are hardened later, and a small lane gets one plan-review round. Order: why → plan → one plan review →
tests and rows first (red) → `ci.yml` → seat checks → draft-PR CI runs (red-first push, then the fix) → build
review by a different lineage → the owner accepts → `nana-land`. The owner ruled on 2026-10-11 that pushing a non-main
branch and opening a draft PR need no approval. Evidence: `research-{npm,ci,repo}.md` and the two fact-checks `factcheck-{external,repo}.md` in this folder.*

## 1. Why

The macOS suite leg is the only blocking CI leg, and it is red on code that did not change.
`@earendil-works/pi-coding-agent@1.0.2` declares `^1.0.2` on its six `@earendil-works` siblings.
`pi-codemode` 1.2.0, published 2026-10-12T23:00:01.855Z, removed the exports `MCP_TYPESCRIPT_PREAMBLE`
and `mcpStructuredContentSchema` in a minor release. pi 1.0.2's `dist/extensions/codemode/tool.js:24` imports both. A global install
(`npm i -g`) never reads or writes a lockfile, so CI's install line now resolves codemode 1.2.0.

- **Timeline.** Run 38313718241 (5143063, started 21:56Z on 10-12) passed macOS: 0 failing files, 6955
  checks pass, 0 fail. Runs 38333416292 (6abc2e8), 38339959569 (e5095f9) and 38347800159 (79888d5), all
  after the publish, fail macOS with 18 of 137 files and 6 failing checks. The lane diff 5143063..79888d5
  touches none of the 18 files, nor `apps/`, `scripts/`, `package.json` or `.github/`.
- **Attribution.** Class c (new for another reason) is 0 on every leg. macOS 0 → 18; Ubuntu 1 → 19 (the
  1 is the pre-existing lane-write-guard symlink check); Windows 67 → 69 (config-trust and
  config-project-gate-fallback). The 18 are 13 desk tests and 5 pack tests. 13 print the
  `MCP_TYPESCRIPT_PREAMBLE` SyntaxError in the CI log; 4 print only "nana code: cannot start", which
  `apps/desk/server.mjs` emits only when `loadPiSession` fails, and `origin-rule.test.mjs` prints only "desk
  server never came up" (`:36`). Main's own post-land run 38393632339 (`3f5151f`) shows the identical 18
  macOS failures and "added 119 packages"; it is the baseline for §5.
- **Local A/B on this Mac** (scratch prefix, the suite runner): codemode 1.2.0 → 18/18 FAIL with CI's
  statuses; only codemode swapped to 1.1.0 → 18/18 PASS, 1932 checks. CI's install log said "added 121
  packages" before the drift and 119 after; a no-cutoff scratch resolution today also gives 119.
- **Why the version gate missed it.** The `pi` bin is `dist/bundle/cli.js`, which inlines codemode, so
  `pi --version` (the CI gate) and RPC still work. The package main `dist/index.js` imports the external
  codemode module; our tests import it through `npm root -g` (`pi-install.mjs:21-44`); the desk walks up from
  the real path of the `pi` executable and tries `npm root -g` only as a last fallback
  (`pi-session.mjs:293-297`). pi-ai, pi-agent-core, pi-tui, pi-mcp, pi-telemetry and chord also published
  1.2.0 at that moment; only codemode breaks the import.
- **CI never tested the seat's tree after 2026-10-05 (INFERRED** from publish times and npm's rules; the
  log prints no versions). From 10-07 it likely ran the 1.1.0 siblings; the seat runs all eight at 1.0.2.

**Observable outcome.** Every pi install in root CI resolves pi 1.0.2 with all eight `@earendil-works`
packages at 1.0.2, the seat's tree, and the macOS leg is green again. A scratch install with the cutoff
below reproduced this Mac's 287-line `npm ls -g --all` exactly (VERIFIED, `research-npm.md` §3).

**Threat model.** In: honest variation in our tools and registries — an upstream minor release that breaks
a declared range; a cutoff typed without `Z` or malformed; a later edit that drops the flag from one install
line, adds an install line without it, or moves the cutoff into a job-wide npm variable. Out: deliberate
forgery — a registry that lies about publish times, a compromised or republished package.

## 2. Requirement delta

All three rows go in FEAT-019 after R-1032. Main's highest ID is R-1064 (cc-hooks-windows);
feat/install-check reserves R-1070–R-1089 and uses up to R-1084; no branch uses R-1090 or above.

| ID | Change | Text (draft) |
|---|---|---|
| R-1090 | added (FEAT-019) | Every root CI workflow step that installs pi shall pass npm's `--before` flag set to the declared pi resolution cutoff `PI_BEFORE`. |
| R-1091 | added (FEAT-019) | The root CI workflow shall declare the pi resolution cutoff exactly once, as the double-quoted `PI_BEFORE` value `2026-10-04T06:57:57Z` (a valid UTC instant in the form `YYYY-MM-DDTHH:MM:SSZ`), in its workflow-level `env:` beside `PI_VERSION`. |
| R-1092 | added (FEAT-019) | The repository shall not set npm's `before` configuration through an `npm_config_before` environment variable in its CI workflow, in any letter case, or through a `before` line in the repository-root `.npmrc`. |

R-597, R-686, R-996, R-1031 and R-1032 keep their text and tests. R-950 and R-951 (fresh-machine checklist)
are unchanged; see §6 item 1. The requirements-tree leaf total moves from 1,070 to 1,073.

## 3. Design

**The fix: `--before` on each install line, with the value declared once.** `ci.yml`'s workflow-level
`env:` (lines 10-12, the only declared surface for CI values) gains one key beside `PI_VERSION`:

```yaml
  # measured 2026-10-13 (R-1091): the seat's pi 1.0.2 install moment (pi-coding-agent package.json mtime
  # 2026-10-04T02:57:57-04:00); npm --before at this time reproduced the seat's `npm ls -g --all` exactly.
  # Valid for PI_VERSION 1.0.2 from 2026-10-04T00:56:19.486Z (pi 1.0.2 published) to before
  # 2026-10-05T08:30:34.061Z (first 1.0.3 sibling, pi-codemode). Move it with PI_VERSION.
  PI_BEFORE: "2026-10-04T06:57:57Z"
```

The suite install (`:38`) and the release install (`:63`) become
`- run: npm i -g @earendil-works/pi-coding-agent@${PI_VERSION} --before="${PI_BEFORE}"`.

- **Why `--before`.** npm's documented filter covers every pick in the tree, direct and transitive, with an
  inclusive cutoff ("only versions that were available on or before the `--before` time get installed").
  It is the only time-based pin for transitive picks on npm 10.9 (Node 22's npm), and its metadata cost is negligible (cold dry run 3 s
  either way). A real install of the exact proposed line, expanded by bash, in a scratch prefix on 2026-10-13
  resolves codemode 1.0.2; without the flag, codemode 1.2.0 (VERIFIED, `factcheck-external.md` W1). The
  install log's package count cannot tell the trees apart (121 with the cutoff, the same count as the pre-drift
  1.1.0 siblings), so the evidence is the resolved codemode version and the 18 drift files passing.
- **The flag goes at the end of the line.** That keeps R-597's substring pin (`ci-workflow.test.mjs:42`),
  R-1031's (`:69`) and install-check's R-1078 regex matching. Inserted before the package spec, it would
  break the first two.
- **Why this cutoff.** CI then tests exactly the tree the seat runs. Any cutoff inside the window below gives
  the same tree. A later cutoff gives another tree, and cutoffs in [22:59:50.884Z, 23:00:01.855Z) on
  2026-10-12 fail with ETARGET (pi-agent-core 1.2.0 needs pi-ai ^1.2.0, published 23:01:40.259Z).
- **Quoted, ISO, with `Z`.** Without `Z` the time is local, and the Mac (EDT) and the runner (UTC) disagree.
  A malformed value only warns, drops the filter and resolves 1.2.0 (VERIFIED: fails open), so R-1091's
  shape check is the guard. It bites on macOS (blocking) and Ubuntu; on Windows `ci-workflow.test.mjs` already
  fails on the CRLF checkout (test portability), and release needs the macOS suite. A deleted key would leave
  `--before=""`, which npm also ignores with a warning (VERIFIED); R-1091's exactly-once check fails on it. Quoting
  stops YAML 1.1 from reading an unquoted date-time as a timestamp. INFERRED risk: I have not checked
  whether the GitHub Actions parser would keep an unquoted value as a string.
- **Coupling to `PI_VERSION`.** Raising `PI_VERSION` without moving `PI_BEFORE` fails the install loudly
  with ETARGET, since every newer pi was published after the cutoff (VERIFIED for a cutoff before the
  pinned version). Moving `PI_BEFORE` alone past 2026-10-05T08:30:34.061Z would quietly move the siblings
  within `^1.0.2`; the sealed-value check (§5) fails on any edit.
- **Tunable rule.** One definition with provenance and row beside it, read by name in every install line;
  one check pins the literal (naming R-1091), every other check reads the value from the file.
- **The install-check lane after merge (decided order: this urgent lane lands first).** Merging main into
  feat/install-check then turns R-1090's check red there: its `--ignore-scripts` job line (`ci.yml:30` on that
  branch) lacks the flag. That lane appends the same ` --before="${PI_BEFORE}"`; R-1078's regex is unanchored
  and still matches. Its tree literal becomes 1,088 (its 1,085 at `ca3fed2` plus these 3).

**What NOT to do.** No `npm_config_before` or `NPM_CONFIG_BEFORE` at workflow, job or step level (R-1092):
a CLI `--before` is not passed to child processes (VERIFIED: `npm test` saw `undefined`), but an
environment variable is, and it would freeze `npm test`, every test child, pi's own `pi install npm:`
calls and possibly the pnpm setup (not checked) at the cutoff; hence a key outside the `npm_config_`
space. No `overrides`: they apply only in a root project's `package.json`, so not to `npm i -g`. No CI-only
project with a lockfile: tests and the desk find pi through `npm root -g`. No post-install codemode
reinstall: it leaves a mixed tree that matches no upstream release. No `PI_VERSION` bump (§6 item 2). No
npm v11 `min-release-age`: Node 22 ships npm 10.9.x, and a relative window drifts daily. No flag before
the package spec, and no unquoted value.

## 4. Scope

**In.** `.github/workflows/ci.yml` (the `PI_BEFORE` key with its comment; the two install lines);
`packages/nana-pack/tests/ci-workflow.test.mjs` (four new checks, §5; header unchanged, so the code map is
unchanged); `REQUIREMENTS.md` (three FEAT-019 rows); `packages/nana-pack/tests/requirements-tree.test.mjs`
(`:38`, `:52` and `:53`, 1,070 → 1,073); `docs/requirements-tree.md` regenerated with `npm run req:tree`;
`HANDOFF.md` and `docs/sessions/2026-10.md` (seat, before the final review round); the review corpus
`docs/reviews/ci-pi-pin-2026-10-13/` (this file and the reviews).

**NOT.** README step 2 (`README.md:121`), `apps/desk/README.md:25`, `apps/bench/README.md:11`,
`PI_INSTALL_HINT` (`steps.mjs:810`) and `fresh-machine.test.mjs` (Owner's call, §6 item 1); `PI_VERSION`
(stays 1.0.2); feat/install-check's job line (that lane, at merge); lockfile, overrides, a CI-only project,
a codemode reinstall, a job-wide npm variable; a post-install import probe (§6 item 3); node 22, pnpm 11,
setup-uv and action-major pins; an upstream issue; pre-existing Ubuntu and Windows failures.

## 5. Verification

**New checks in `ci-workflow.test.mjs`**, each with its `req:` marker, committed before `ci.yml` changes.
- `// req: R-1090` "every pi install in CI resolves at the declared cutoff": every non-comment line naming
  `@earendil-works/pi-coding-agent` (with or without `@version`; at least two) ends with ` --before="${PI_BEFORE}"`, and the suite
  and release bodies hold one each.
- `// req: R-1091` "the pi resolution cutoff is declared once, quoted, in UTC ISO form beside PI_VERSION":
  exactly one `PI_BEFORE:` key line in the file; the workflow `env:` block matches `PI_VERSION: …`, then
  comment lines, then `PI_BEFORE: "<v>"`; `<v>` matches `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$`; and
  `new Date(v).toISOString() === v.replace("Z", ".000Z")`, which rejects rollover dates.
- `// req: R-1091` "the pi resolution cutoff is sealed at the seat's install moment": the only copy of the
  literal, `PI_BEFORE: "2026-10-04T06:57:57Z"`.
- `// req: R-1092` "npm's before is never set through the environment or a repository-root .npmrc": no
  non-comment line of `ci.yml` matches `/npm_config_before/i`, and no `.npmrc` at the repository root holds a
  `before` line.

**Wrong code first.** On unmodified `ci.yml`, the R-1090 and R-1091 checks fail and R-1092 passes as a
guard. Each mutation changes only `ci.yml`, never an assertion, and must turn the named check red: flag
dropped from the release line → R-1090; a third pi install line without the flag → R-1090; an unversioned
`npm i -g @earendil-works/pi-coding-agent` step → R-1090; a root `.npmrc` with `before=2026-10-04` → R-1092; no `Z` →
R-1091 shape; value unquoted → R-1091 shape; `2026-02-30T06:57:57Z` (V8 rolls it to 03-02) → R-1091
round-trip; a second `PI_BEFORE` in the suite `env:` → R-1091 once; `npm_config_before:
${{ env.PI_BEFORE }}` in the suite `env:` → R-1092; retuned to `2026-10-05T00:00:00Z` → only the sealed
check, naming R-1091.

**Seat, before the build review.** Install the built line, expanded with its env values, into a scratch
prefix and read `npm ls --prefix <p> -g --all`: all eight `@earendil-works` packages at 1.0.2 (sol plan r1 SHOULD 2); import pi's main entry
from that prefix (expect no SyntaxError); `test:locked`, `map:check`, `readme:check` green; `req:tree` run.

**CI on the draft PR, red first.** The baseline is the three post-drift runs in §1.
- Push 1, tests and rows only: macOS 19 failing files (the 18 plus `ci-workflow.test.mjs`); Ubuntu 20; Windows 69 (`ci-workflow.test.mjs` already fails there).
- Push 2, the `ci.yml` fix: macOS 0 failing files, so the blocking leg passes; the 18 drift files pass
  (the evidence the cutoff took effect); about 6955 or more checks pass, 0 fail, 8 skip (INFERRED). Ubuntu 1, the pre-existing lane-write-guard check. Windows
  67: config-trust and config-project-gate-fallback pass again; objective-golden returns to 94 pass /
  17 fail and post-edit-file-queue to 2 pass / 1 fail, pre-existing failures the import crash had hidden;
  the 13 desk files and agent-dir-parity stay red for pre-existing reasons ("cannot tie" a pi install, a
  doubled drive path). INFERRED: `3f5151f`'s commits after `79888d5` touch only docs, `HANDOFF.md` and
  REQUIREMENTS citations (checked with `git diff --stat`).
- After the land, the first main push runs release with the same line; the macOS suite it needs is green.

**The claim most likely to be wrong:** that macOS turns fully green. CI has not run the 1.0.2-sibling tree
since 2026-10-05 (INFERRED); the seat's locked suite on that same tree is the counter-evidence.

## 6. Residuals (each becomes one HANDOFF line)

1. **Decided by the seat — fresh local installs still break; a follow-up lane fixes them.** README step 2, `apps/desk/README.md:25` and
   `apps/bench/README.md:11` install pi 1.0.2 with no cutoff, so today they resolve codemode 1.2.0. On
   that install the desk will not start and the bench's in-process load fails (INFERRED from CI and the
   import chain; not run locally). This conflicts with the rule that every README claim is true; this Mac
   is unaffected. Trade: fixing it here changes the command users type and grows an urgent lane; leaving
   it breaks a fresh macOS seat until the follow-up. Decision: a follow-up lane after the install-check lane (Owner's queue names install-check next; sol plan r1 MUST 2)
   that appends the same cutoff to those three commands and extends R-951's check to read `PI_BEFORE` from
   `ci.yml`, so README and CI cannot drift and install-check's line mirrors README step 2 exactly. It is not the owner's call: it
   restores a README promise without changing what a user installs. `apps/bench/README.md:26` and the desk's fix
   hint (`pi-session.mjs:351`) install pi with no version, so they get pi 1.2.0 with matching siblings —
   probably not this break (INFERRED); the follow-up lane checks them.
2. **Decided by the seat — stay on pi 1.0.2.** Upgrading removes this import, not the problem: pi 1.2.0 declares `^1.2.0` on
   its siblings, so the cutoff is needed either way. Costs: `before_agent_start` now also fires for
   extension-started runs, whose events carry no prompt (nana-knowledge guards for it; nana-objective,
   nana-writing and nana-handoff need review, INFERRED); busy-session semantics change; `sendUserMessage`
   needs `deliverAs`; the `pi mcp list --json` shape changes; Azure is renamed (1.0.3); the seat must be
   upgraded and re-verified. Decision: stay on 1.0.2 with the cutoff; upgrade in its own lane when a 1.2.x
   feature is wanted (Owner may overrule).
3. **Harden later — the gate checks text, not the tree.** No CI step asserts the resolved tree, and
   `pi --version` passes on a broken one; the macOS suite's 18 drift-sensitive files are the import check
   in practice. Candidate: a post-install probe that imports pi's main entry in every job that installs pi.
4. **Open for the owner — upstream.** codemode 1.2.0 removed an export in a minor release, breaking pi 1.0.2's
   declared range for every user. An upstream issue, or a published `npm-shrinkwrap.json`, fixes it at the
   source. Filing is a public action.
5. **Known limits of `--before`.** It does not freeze `deprecated` flags, a moving `latest` tag, or the
   runner's Node version, so a later deprecation or retag could change a third-party pick (minor). A future lockfile with `npm ci` would ignore it (VERIFIED); the
   repo has neither. Node, pnpm, setup-uv and action majors still float in CI.
6. **Research side effect.** Two probes appended 8 lines (handoff_missing, session_start, objective_pickup,
   session_shutdown, twice each) to `~/.pi/agent/nana-journal.jsonl` at 2026-10-13T11:43:23–24Z; left in
   place for the owner to keep or delete.

## Plan review

- 2026-10-13, sol plan r1 LAND-WITH-FIXES 92/100 (`sol-plan-r1.md`), the one round a small lane gets. Applied: R-1091 states the sealed value; the README follow-up runs after install-check, per the owner's queue; R-1092 names the repository-root `.npmrc`; the seat's scratch check asserts all eight package versions.
- 2026-10-13, seat amendment before the build: ONE push instead of two. The red-first evidence is local — the seat's acceptance script fails 23 of 33 at launch (`acceptance-launch.txt`) and passes 33 of 33 on a prototype of §3's fix, including all 18 drift files against a scratch install of the pinned line — so a tests-only CI push would add a 25-minute cycle and no information.
