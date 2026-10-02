# Round 3 review

## Findings

### HIGH — The clause-level audit remains wrong-green

**Paths:** `REQUIREMENTS.md:141,174,274,405,538,632,646,661,681`

Fresh random sample seed **745343261**, population 427 implemented rows across Parts A–C:

- **PINS (16/25):** R-133, R-738, R-340, R-176, R-036, R-164, R-088, R-257, R-039, R-183, R-722, R-300, R-136, R-009, R-076, R-025.
- **PARTIAL (9/25):** R-104, R-131, R-231, R-400, R-447, R-456, R-461, R-507, R-701.
- **PINS rate: 64% (16/25).**

Representative failures:

- `REQUIREMENTS.md:538` leaves R-400 implemented with its default-port clause even though R-462 immediately records that exact clause as untested. Its evidence only exercises `DESK_PORT=0`; it does not pin default port 7317 or the ordinary override clause.
- `REQUIREMENTS.md:681` claims R-507’s four-way success conjunction. The evidence cell itself notes that no run-level nonzero-exit case is asserted; removing the clean-exit branch can remain green.
- `REQUIREMENTS.md:405` claims each pull-log row carries `ms`, but `packages/nana-knowledge/tests/hook.test.mjs:166-169` checks ts/cwd/session/tokens/hits and never checks `ms`.
- `REQUIREMENTS.md:141` includes undefined-signal handling, but the relevant assertions at `packages/nana-pack/tests/receipt-binding.test.mjs:173-175` are neither marked nor cited.
- `REQUIREMENTS.md:174` claims case-insensitive and real-parent handling, while the cited `handoff-trust` cases use lowercase canonical paths only.
- `REQUIREMENTS.md:274` has no cited exit-zero/empty-output case for R-701.
- R-447 does not prove the listeners bind **only** loopback; fetching via loopback remains green if the server binds all interfaces.
- R-456 and R-461 have useful adjacent assertions, but the clauses concerning untouched targets/non-object child events are not the checks marked and cited by those rows.

This is not merely missing coverage: the rail reports **432 implemented / 0 problems** while multiple implemented sentences are only partly evidenced. That is the review brief’s blocking class: a wrong-green rail hiding false ledger claims.

**Minimal fix:** split the unpinned clauses into new `untested` rows or add direct mutation-sensitive assertions and cite/mark those exact calls. At minimum, reduce R-400 to the ephemeral-port clause, retain R-462 for the default, separately classify the normal override clause, and correct the other eight sampled rows above.

## Marker binding and tautology audit

Fresh marker sample seed **4032185891**, population 1,471 marker blocks: **10/10 bound to the intended first call on the next line**. Sampled IDs were R-070, R-437, R-512, R-069, R-316, R-342, R-422, R-102, R-335 and R-716.

No sampled evidence call was tautological. A global scan found one marked `check(..., true)` at `packages/nana-knowledge/tests/hook.test.mjs:181`; it is not cited in R-225’s evidence, and the cited `execFileSync` checks independently require exit zero.

## Claimed-fix verification

### Round 1

- **Critical win32 directory-link traversal:** reproduced through `packages/nana-setup/tests/skills-and-standards.test.mjs`. All **73 checks passed**, including forced-win32 refusal, exit 1, byte-identical victim tree, no backup outside `~/.claude`, unchanged link, dry-run and doctor behavior. The pre-write `lstat` walk in `packages/nana-setup/lib/steps.mjs` is real.
- **Adopt mode:** both TypeScript and Python rendered from this checkout. No product rows or implemented rows appeared; all G rows were untested; markers rendered as `req-candidate:`. Initial map check failed naming regeneration, one regeneration made it green.
- Src/scripts/tests roots, recursive requirement walks, citation validation and Python literal dynamic-import handling are present with their template self-tests. Rendered test-header deletion failed as required.

### Round 2

1. **Inline README commands:** verified. `readme-check` reports **506 claims / 0 problems**. Scratch mutation from inline `npm test` to `npm nope` failed naming the README line.
2. **Clause audit:** **not fixed**, as detailed above; fresh PINS rate was 64%.
3. **Ambient handoff environment:** verified with the requested command:

   `NANA_HANDOFF=off npm test -- handoff test-runner`

   Result: **7 files passed, 232 checks passed**, including the external runner tests.
4. **Mapped test roots:** verified. Map contains **162 modules**, all six collected test roots are layer-exempt, and a scratch deletion of a test module header failed `--check` naming that module.

## Mutation and integration checks

- Dropped test header in scratch copy: detected.
- Flipped R-001 from implemented to untested in scratch copy: rail exited 1 with `R-001 is 'untested' but 3 test(s) trace it`.
- Broken inline README command in scratch copy: detected.
- Shims import the template implementations directly; they are not copied generators.
- Full suite under a fresh outer HOME: **89 files, 88 PASS, 1 declared SKIP, 0 FAIL, 0 WARN; 5,442 checks passed**.
- Runtime diff review found only the intended installer skill/rule installation and test-runner environment scrub as substantive runtime changes; other pack, desk, bench and stage module changes are contract headers. The new nana-stage README matches its exported modules, extension behavior and tests.

VERDICT: BLOCK
