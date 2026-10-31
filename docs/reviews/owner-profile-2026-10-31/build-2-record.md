# Owner profile · build 2

## Change

Merge main `a6dcc99a` into `feat/owner-profile`. The shared shape module is byte-identical to main.

- `packages/nana-pack/lib/profile-config.mjs` imports `SOURCE_WORDS`, `USER_KIND_WORDS`, `ROLES` and `STARTING_STATE`. The profile selects the shared saved source, shared user kinds, user roles and starting trust.
- `packages/nana-pack/lib/profile-store.mjs` imports the shared decision kind for its routed-kind refusal. Decision and open-thread still refuse. `effectiveState` remains the only effective trust/liveness reader.
- `REQUIREMENTS.md` combines the two auto-merged FEAT-040 headings into one feature. A-088 and A-090 retain their owners and readers. SUB-022 retains all profile rows. R-3230 now states the shared-shape/source/kind/seat-evidence contract; R-3249 states shared vocabulary ownership. No new IDs or tunables.
- `packages/nana-pack/README.md` retains both the profile and offline-maker sections from the conflicting merge.
- `docs/code-map.md` and `docs/requirements-tree.md` are regenerated.

## Existing test edits

No tests were added or deleted.

- `packages/nana-pack/tests/profile-store.test.mjs`: import the shared shape words rather than assert local copies; the existing shape-record case checks its seat evidence through main's exported `resolveEvidence`. Its sealed PROFILE_WORDS expectation now uses shared user kinds, including the routed decision kind. All CLI kind inputs use imported words; evidence examples use the profile's named prefix/runtime.
- `packages/nana-pack/tests/profile-fixture.mjs`: default save uses the shared preference kind.
- `packages/nana-pack/tests/profile-sync.test.mjs`: concurrent saves use the shared fact kind.
- `packages/nana-pack/tests/requirements-tree.test.mjs`: resolve both heading-count conflicts to 70, the combined tree's count. This preserves this lane's existing assertions rather than deleting either feature's rows.

The shape save retains its CRLF, trailing-space/tab and no-final-newline strings. Every profile case remains awaited under its per-case limit and uses OS-temp fixtures.

## Wrong-code pair

The requirement diff preceded the test edits, which preceded code changes.

The obvious wrong implementation was the existing profile-local kind list, which omitted the shared routed decision kind. Against the edited existing test, `node scripts/test.mjs profile-store` exited 1: 17 passing checks and `FAIL seal: PROFILE_WORDS`. See `build-2-wrong-local-words.txt`.

Importing main's list made the same check green. The touched run exited 0: 142 passing checks in four files. See `build-2-touched-tests.txt`. Assertions were not inverted. No new test required a separate mutation campaign.

## Commands and exit codes

| Command | Exit | Record |
|---|---:|---|
| `git merge --no-commit main` | 1 | Expected conflicts; also README conflict and silently duplicated feature heading, both resolved |
| `npm run map:impact -- packages/nana-pack/lib/profile-config.mjs packages/nana-pack/lib/profile-store.mjs` | 0 | build-2-impact.txt |
| `node scripts/test.mjs profile-store` before code changes | 1 | build-2-wrong-local-words.txt |
| `npm run map` | 0 | build-2-map-generate.txt |
| `npm run req:tree` | 0 | build-2-tree-generate.txt |
| `node scripts/test.mjs profile-store profile-sync memory-making requirements-tree` | 0 | build-2-touched-tests.txt |
| `npm run map:check` | 0 | build-2-map-check.txt |
| `npm run readme:check` | 0 | build-2-readme-check.txt |
| `node --experimental-strip-types scripts/requirements-trace.mjs` | 0 | build-2-trace.txt |
| `node scripts/requirements-tree.mjs` | 0 | build-2-tree-check.txt |
| `node scripts/known-bugs.mjs` without required root | 2 | Usage error; corrected command follows |
| `node scripts/known-bugs.mjs --root .` | 0 | build-2-known-bugs.txt |
| `node scripts/identity-scan.mjs` | 0 | build-2-identity.txt |
| `node scripts/lane-class.mjs --root . --files <changed profile modules/tests>` | 0 | build-2-class.txt; ordinary |
| `npm run test:locked` (foreground, one machine lock) | 0 | build-2-full-suite.txt |

```text
245 files: 243 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8809 pass, 0 fail, 44 skip · 630.6s
```

Trace: 2262 total rows, 2008 implemented and traced, 0 off-form rows.
Last-commit checks, push and the finished hosted CI result are reported in the final worker report.

## Precedent and carry for the seat

Read main's entire `packages/nana-pack/lib/memory-making-config.mjs` before designing. Imported its exports, copied no helper, and made no departure from this build's precedent. Main's `resolveEvidence` is imported, never reimplemented. No maker code or maker test changed relative to main.

The protected HANDOFF, session archive and known-bug paths enter only through the requested merge. They match main exactly; this build does not edit them.

The four main known bugs remain unchanged: correction cue recall, fragmentary review-title precision, transcript expiry, and same-index review title replacement without expectedTitle. No known bug was fixed.

Seat-only carry: main's seat-evidence resolver currently requires a colon-free session key. The profile reader deliberately permits colons, and a Windows PI_SESSION_FILE fallback can contain one. The requested maker freeze leaves that mismatch unchanged; the seat should decide its follow-up. The ordinary session-ID save tested here resolves to its own quote.

Build 1's residual notes also remain for the seat: quote authorship cannot be proved; deliberate poisoning and hostile pointer edits remain outside the threat model. Do not change the maker to address these notes in this build.

## Not done

No private repo creation, startup delivery or sync, migration, doctor row, PATH shim, search cache or pushback probe. No issue action, model session, subagent or independent review. The seat handles notes and review. Hosted CI is awaited after pushing the new tip.
