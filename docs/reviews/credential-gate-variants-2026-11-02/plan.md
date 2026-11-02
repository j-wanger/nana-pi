# Plan — credential-gate-variants

## Purpose

A fix that restores agreed behaviour. R-3663 says that under `NANA_ROLE` worker or reviewer the gate refuses the plan's direct credential command forms despite allowPatterns. The builder-credential-strip round 3 final review (`r3-reviewer-5c2162a3.md`, SHOULD) found four close variants of its newest forms still allowed as worker:

- `git credential-store --file=x get`
- `git -c a=b credential-cache get`
- `git-credential-cache get` (the dashed form; pattern 3's helper list has no `cache`)
- `git credential-cache --timeout 5 get`

Cause: build 3 added `credential-store --file x get` and `credential-cache get` as two narrow patterns without the global-option prefix of patterns 1 and 2, and without options between the helper and its action. Pattern 3's dashed list omits `cache`.

## Assumptions

- A1: A git credential helper's read action is the word `get`, after any options. Every helper (`store`, `cache`, `osxkeychain`, `wincred`, `manager`, `manager-core`, `libsecret`, `gnome-keyring`, others) follows git's helper protocol: `get`, `store`, `erase`, and for cache `exit`. Refusing `get` with any options before it refuses the read and nothing else.
- A2: Widening the helper list from five names to any `credential-<name>` is in the threat model: a builder honestly runs whichever helper its machine has. `git credential-<name> ... get` has no non-credential use.
- A3: The word `get` appearing as an option value (`git credential-store --file get erase`) is refused too. It is a false refusal, rare and harmless; recorded as a residual, not tested.

## Open choices

- O1: Helper names: the five known plus `cache` (narrow), or any `[\w.-]+` (wide). Default: wide, per A2.
- O2: Whether to merge patterns 2, 3, 6 and 7 into two (spaced and dashed) or keep the old ones and add. Default: merge; the seal test (R-3667) is rewritten to the new list, which is the expected edit.

## Questions for the owner

None.

## Feature

Feature: FEAT-006 · Launch builders with execution limits

Lane class: `node scripts/lane-class.mjs --root . --files packages/nana-pack/lib/credential-gate-config.mjs,packages/nana-pack/tests/credential-gate.test.mjs,REQUIREMENTS.md,docs/known-bugs/FEAT-006.md` prints `hook: packages/nana-pack/lib/credential-gate-config.mjs — directly imported by packages/nana-pack/extensions/nana-gate.ts`. The seat calls it a gate lane; both take the same ladder (land reviewer, seat wrong-code pairs, one independent check).

Base: `origin/feat/builder-credential-strip` at 7d5f8ea4 (the seat's call; it lands right after credential-strip, and the seat merges main then).

## Threat model

In scope: honest variation in how a builder or reviewer spells a credential-helper read: global options, helper options, `=` forms, the dashed binary, paths and `.exe`, quoting the gate already normalizes, other helper names. Out: deliberate evasion (base64, `sh -c` strings the segmenter cannot see, a renamed binary, a script file that runs the command). The gate is advisory (AGENTS.md rule); the environment strip from builder-credential-strip is the real control, so a gap here is a residual, not a breach.

## Precedent

- `packages/nana-pack/lib/credential-gate-config.mjs` — `CREDENTIAL_PATTERNS`; patterns 1 and 2 carry the global-option prefix `(?:\s+(?:-c|-C|--git-dir|--work-tree|--namespace)\s+\S+|\s+-\S+)*` to reuse.
- `packages/nana-pack/extensions/nana-gate.ts` — the floor loop (lines 147-155): segments, `tokens`, `commandIndex`, `base`, then the patterns. No change expected.
- `packages/nana-pack/tests/credential-gate.test.mjs` — M4 `blocked`/`allowed` lists and the M7 seal.
- `docs/reviews/builder-credential-strip-2026-11-02/seat-mutate.mjs` — the seat's wrong-code pairs on the shared runner; this lane's pairs follow it.

## Outside precedent

git's own credential helper protocol (git-credential(1), GPL-2.0): borrow — it defines `get`/`store`/`erase` as the helper actions and lets options precede the action, which sets A1.

## Must-meet

Rows R-3685 to R-3687 (FEAT-006). R-3663's and R-3667's evidence text names the new forms.

- M1 (R-3685): helper reads with options anywhere are refused for worker and reviewer, on bash and PowerShell, with the credential-rule reason. Corpus: the four reviewer forms; `git -c a=b credential-store --file=x get`; `git --no-pager credential-cache --socket /s get`; `git credential-libsecret get`; `git-credential-store --file=x get`; `"C:\tools\git-credential-cache.exe" --timeout 5 get`; `/usr/lib/git-core/git-credential-libsecret get`.
- M2 (R-3686): near misses stay allowed for worker and reviewer, and every form stays allowed with no role. Corpus: `git credential-cache --timeout 5 exit`; `git credential-store --file=x erase`; `git credential-store --file=x store`; `git-credential-cache exit`; `git config credential.helper cache`; `git config --get credential.helper`; `echo "git credential-cache get"`; plus the existing allowed list.
- M3 (R-3687): the sealed list pins the merged patterns (R-3667's seal test updated to the new list; this row names the new spaced and dashed helper patterns).

Seat wrong-code pairs (gate lane): the old narrow patterns (main's list) fail M1; a helper rule without the global-option prefix fails M1; a rule that matches `get` anywhere (not just as a word) fails M2 on a `--get` near miss; a rule without `(?:\s|$)` fails on `getx`.

Seat checks: the touched tests, `test-runner.test.mjs`, `gate-survives-mutation.test.mjs`, map, readme, trace, tree, known-bugs checks, identity scan, the lane's seat pairs, and the tip's CI.

If the seat recorded the round 3 SHOULD as a FEAT-006 known-bug line before the land, this lane removes that line.

## Revision 2 (after `plan-attack.md`: 2 MUST, 3 SHOULD, all taken)

These changes override the sections above wherever they differ.

- **Token boundaries (attack 1 and 3).** The floor in `nana-gate.ts` (lines 150-153) joins the preserved words with spaces. That lets a quoted value with a space (`git -C "C:/work tree" credential-cache get`, `git -c "http.extraHeader=X Y" credential-cache get`) break the `\S+` option prefix. It also lets `--file "get secrets"` invent a `get` word. Fix: before joining, replace whitespace inside each word with one sealed placeholder character that is not whitespace. Define it in `credential-gate-config.mjs` with provenance and pin it under R-3667's seal. The patterns then see exactly one space between words. A3's residual shrinks: only a word that is exactly `get` and is used as an option value is still refused.
- **Corpus (attack 2).**
  - M1 adds `git -C "C:/work tree" credential-cache get` and `git -c "http.extraHeader=X Y" credential-cache get`.
  - M2 adds `git credential-cache --get`, `git credential-cache getx`, `git-credential-cache --get`, `git-credential-cache getx` and `git credential-store --file "get secrets" erase`.
  - The seat's wrong-code pairs must fail M1 or M2 itself, not only the seal.
- **Rows (attack 5).** M3 and R-3687 are dropped. The merged literal list stays under R-3667, whose seal test is updated and whose evidence names the new forms. New rows: R-3685 (M1) and R-3686 (M2).
- **Cost (attack 4).** Out of scope. The new helper tail matched an 80,025-char input in about 1 ms. A whole-gate long-input probe took more than 30 s, cause not found. The brief records it as one FEAT-006 known-bug line ("credential-gate-variants, plan attack"). The plan claims no bound.
- **Lane class.** Precedent gains `packages/nana-pack/extensions/nana-gate.ts` (the floor, lines 147-155) and `packages/nana-pack/lib/gate-shell.ts` (`tokens`), both now changed or read.
