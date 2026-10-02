# Nana — Coding standards

How code gets written here, in any project and any language. (Posture, voice and process
live in `nana-soul.md`; this file is only the mechanics.) Where a project carries a
`REQUIREMENTS.md`, these are its rows — follow the rows, and use the `requirements` skill.

## Requirement first

- New behaviour starts as a requirement diff: add, split or retire a row. IDs are stable —
  never renumbered, never reused; a removed requirement keeps its ID as `retired`.
- Then the tests, each carrying its `req:` marker directly above the test call. Then the code.
- Before flipping a row to `implemented`, name the clause each cited test pins. A row is the
  weakest of its clauses. Split rather than overclaim. A `violated` row carries its residual.
- No project requirement file yet? The order still holds: state the behaviour as one
  falsifiable sentence before designing it.

## No inline tunables

- A value that tunes behaviour — threshold, cap, weight, budget, timeout, port, path, model
  name, seed, distribution constant, vocabulary — is defined once in the package's declared
  configuration surface and read by name. Never an inline literal at a point of use.
- Every tunable carries its provenance beside its definition: source and date for a measured
  value, the word `chosen` plus the reason for a chosen one, the row for a contract value.
- A sealed value is pinned by one test naming its requirement row, so retuning it fails
  naming the row. Every other assertion imports the name — never the literal.
- Retuning a value must change no code. If it does, say so as a violation rather than
  editing the test.

## One purpose per module

- Every module opens with the six-tag header: `@module`, `@purpose` (one sentence — two
  sentences means two modules), `@inputs`, `@outputs`, `@effects` (none / disk / database /
  network / process), `@errors`.
- Named exports only. Never reach into another module's internals, private helpers or
  mutable module-level state.
- Inject resources that carry identity or side effects — database handles, clocks, random
  sources, fetchers, file roots — at the module boundary, so the module runs without the
  real resource.
- Imports follow the declared layer direction. A reverse or layer-skipping import is a
  failure, not a style note.

## Keep the code map current

- Run the impact command before touching a mapped module, and work from its blast radius —
  upstream and downstream both.
- `map:check` is green at every land. A stale map entry, a missing or malformed header, or an
  undeclared cross-component import blocks the land; regenerate and commit the map with the
  change.

## README is a contract

- The README is read before the code. Say what the thing is and is for in the first paragraph,
  then how to install it, how to run it, how to test it — enough that a reader needs nothing else.
- Every command, script, path, flag and file the README names must exist and run as written.
- A README claim is a requirement whose row is the README; the readme check is its test, and it
  is green at every land.
- When the README names a command that no longer exists, fix the README or the command. Never
  the check.

## Status honesty

- Say what is pinned, what is merely written, and what is unverified — in the ledger and in
  the report. Never let an unpinned claim read as covered.
- Any pass that flips rows to `implemented` gets an independent reviewer whose one question
  is: which clause does this test pin?
- A green suite after a refactor is not proof the refactored path still executes. A scan is
  complete only against the audit that produced it.
