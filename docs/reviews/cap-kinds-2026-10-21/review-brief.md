# Review — cap-kinds (capabilities get an optional kind, deliverables, needs, binds and retirement line, checked by the tree checker, kept by the lift, shown in the outline and named by the tree movement report), 2026-10-21 (the final reviewer)

Feature: FEAT-028 · Maintain requirement identity and trace links

Class: ordinary (no hook, extension, install or gate code changes). Threat model: honest variation in owners' ledgers
and in our tools' output is in scope; deliberate forgery, such as a ledger crafted to crash the checker, is out.

Review `git diff 5548d4c2..HEAD` on `feat/cap-kinds` (main is 5548d4c2; `git merge-base HEAD main` is 5548d4c2). The
plan of record is `docs/reviews/cap-kinds-2026-10-21/must-meet.md`: eight must-meet checks, rows R-2440 to R-2447, with
the field grammar, the threat model, a "Written, not pinned" list and known limits. `plan-attack.md` holds adversary
A's evidence and its wrong-code list. `build-brief-1.md` and `build-brief-2.md` are builds 1 (c97ddc66) and 2
(e8132c2f); the seat's record is `seat-verify-e8132c2f.md`, with the wrong-code pairs in `seat-mutate.mjs` and its two
output files (37 of 41 red on build 1, 41 of 41 on build 2). CI-PENDING. The land runs the locked suite on the reviewed
tip.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, run at e8132c2f, before the seat's notes
commit):

```
tree movement 5548d4c..e8132c2: 8 rows in 1 features
FEAT-028 · Maintain requirement identity and trace links
  R-2440 new (implemented)
  R-2441 new (implemented)
  R-2442 new (implemented)
  R-2443 new (implemented)
  R-2444 new (implemented)
  R-2445 new (implemented)
  R-2446 new (implemented)
  R-2447 new (implemented)
```

The code under review: `scripts/requirements-tree.mjs` (the span read in `parseLedger`, `checkCapabilityFields`, the
outline lines in `renderOutline` and their check in `checkOutlineFields`) and `scripts/requirements-moved.mjs` (the
capability section). Tests: `packages/nana-pack/tests/requirements-cap-kinds.test.mjs` (new) and R-2447 in
`requirements-moved.test.mjs`. Text: the requirements skill, `templates/_shared/requirements-organization.md`, and
REQUIREMENTS.md's organization notes. The rest is the plan, the seat's records, the generated code map and outline,
HANDOFF, the session entry and one ruling line.

Judge whether the feature works for an owner annotating an existing tree:
- the checker reports exactly the problems R-2441 to R-2445 list, naming the capability, line and value, and nothing
  on an honest ledger: a tree with no field lines (this repo's, the seed's), a kindless capability whose prose starts
  with Needs, Binds or Deliverables, field labels in a feature or subgroup span, an untested or planned deliverable;
- a deliverable homed in a subgroup rolls up to its capability, and document order alone settles needs (no cycle);
- the lift (dry run and write), its proof and the regroup still accept every ledger they accepted before, and keep
  field lines under their capability;
- the outline gains the field lines after Parent only where a capability has read fields, and the committed outlines
  at c4332ecb, 4b3846ec and 5548d4c2 still render byte for byte;
- the tree movement report's output is byte-identical when no capability changed, and names moves, field changes
  (as parsed lists) and added or removed capabilities otherwise;
- the skill, seed and ledger text describe the behaviour truthfully (they are written, not pinned), and the HANDOFF
  lines, the folded late review notes from three earlier lanes and the session entry are accurate.

Known limits already carried (do not send back for them): a regroup over kinded capabilities needs the fields
stripped first; lower-case labels are prose; one tested row per bound stage and unchecked deliverables are left to the
product report; the historical outline check needs full history; duplicate needs, binds or retired tokens and
space-separated lists are reported but unpinned.

Probe in a temporary folder with a temporary HOME. Do not edit the worktree.
