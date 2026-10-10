## Score: 8/10

The plan is sound, but two narrow test gaps must be fixed before building.

### MUST 1 — Pin the `G-` branch of the near-miss rule

R-1001 covers malformed candidates beginning with either `R-` or `G-` at `docs/reviews/req-ids-2026-10-10/CHANGE.md:37`.

Every near-miss fixture uses `R-` at `docs/reviews/req-ids-2026-10-10/seat-verify-ids.mjs:79-85`. The accepted `G-1000` tests exercise the ID grammar, not the independent near-miss candidate pattern.

A mutation changing the candidate pattern from `[RG]` to `R` would survive the proposed matrix. That leaves one stated R-1001 branch unpinned.

**Smallest fix:** add one malformed `G-` candidate, such as `| G-squared | 0.9 |`, in both ledger files and both rails. Add a mutation that disables only the near-miss pattern’s `G` branch.

### MUST 2 — The malformed-marker oracle does not prove grammar rejection

The malformed-marker checks assert only `!r.ok` at `docs/reviews/req-ids-2026-10-10/seat-verify-ids.mjs:96-104`.

If a rail accidentally accepts `R-10000` as an ID, the fixture can still fail because that accepted marker names no row. The assertion remains green for the wrong reason.

The intended diagnostic already exists in the current rails:

- `templates/typescript/template/tests/requirements-trace.ts:264-270`
- `templates/python/template/tests/conftest.py:243-244`

**Smallest fix:** require each malformed-marker result to contain `bad requirement id` and its source location. Apply the same oracle in both rendered self-test suites.

### SHOULD — Correct the self-test description

The plan says the self-tests ship unmarked at `docs/reviews/req-ids-2026-10-10/CHANGE.md:76`.

They are unmarked only in adoption mode. Scaffold renders use real `req:` markers:

- `templates/typescript/template/tests/requirements-trace.test.ts.jinja:1`
- `templates/python/template/tests/test_requirements_trace.py.jinja:1`

**Smallest fix:** say “unmarked in adoption mode; marked in scaffold mode.”

### NOTE — Round-one and round-two fixes are otherwise verified

- The grammar is now ASCII-safe and correctly permits three digits or non-zero-leading four digits at `docs/reviews/req-ids-2026-10-10/CHANGE.md:114-117`.
- The previously missed render, update, shared-index, and share-validator consumers are now in scope at `docs/reviews/req-ids-2026-10-10/CHANGE.md:86-98`.
- No additional live three-digit parser was found. The narrow objective-row test remains intentionally three-digit.
- Historical executable parsers are accurately listed as frozen exceptions at `docs/reviews/req-ids-2026-10-10/CHANGE.md:105-107`.
- Numeric tree ordering already exists in `scripts/requirements-tree.mjs:217-218,267-272,303-304`. Lexical rail diagnostics are honestly declared residual behavior.
- The near-miss definition is precise and context-free at `docs/reviews/req-ids-2026-10-10/CHANGE.md:39-52,119-122`.
- The Python missing-closing-pipe compatibility break is explicit. Current Python parsing accepts that shape through edge-pipe stripping at `templates/python/template/tests/conftest.py:137-145`.
- The checkout’s 1,012 ledger candidates and 22 shared Part G candidates all satisfy the proposed row grammar.
- R-1000 and R-1001 are atomic, testable, and correctly homed in FEAT-028. No R-1002 is needed.
- `template:accept` renders scaffold and adoption modes for both languages, then runs each native suite at `scripts/template-acceptance.mjs:82-118`.
- The sibling-project consequences are honestly deferred at `docs/reviews/req-ids-2026-10-10/CHANGE.md:170-176`.

### NOTE — Seat verifier now fails correctly

The mismatch counter and final exit are implemented at `docs/reviews/req-ids-2026-10-10/seat-verify-ids.mjs:49-55,130-133`.

I ran it against today’s code. It reported 31 mismatches and exited 1, as required.

### NOTE — The declined stacking finding is resolved

The stated landing rule is internally consistent at `docs/reviews/req-ids-2026-10-10/CHANGE.md:132-141`.

The tree product tip is `eeeca20`. Commit `c4332ec` contains only its independent review record. Reviewing this lane from `eeeca20` includes that record before it reaches main.

VERDICT: LAND-WITH-FIXES
