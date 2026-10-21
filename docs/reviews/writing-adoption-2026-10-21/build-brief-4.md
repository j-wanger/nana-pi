Feature: FEAT-005 · Communicate decisions clearly (PATH rows in FEAT-013). Lane writing-adoption, rows R-2498 to R-2503. Class: install, hook or gate. Builder: pi-worker (larger lane). Build session 4: two fixes from the lane's independent check at 0671f92e.

Work in ~/nana-pi-wt/writing-adoption on feat/writing-adoption (tip 95e78556). The plan of record is `docs/reviews/writing-adoption-2026-10-21/must-meet.md`. Follow packages/nana-pack/prompts/builder-preamble.md. Never edit HANDOFF.md, docs/sessions/, docs/reviews/ or packages/nana-pack/rules/. No push.

The seat checked build 3 at 0671f92e: writing-rule 4 pass, the rule's Check section equals the sealed text, the seat check prints `0 missing` for all sessions, and your full suite was green. The seat's ten wrong-code pairs are 10 of 10 red. The independent check found no material problem and two things to fix:

1. The key must apply live, as the pack README says every non-gate block does. Today `packages/nana-pack/extensions/nana-writing.ts` reads `writing.enabled` only at `session_start`, so turning it off mid-session keeps the section until `/reload` (probed: nana-objective dropped its section on the next turn, nana-writing did not). Do what `extensions/nana-objective.ts` does (:83-89): build the block at `session_start` whatever the key says (journal `writing_rule_unavailable` only when the key is on), and at `before_agent_start` read `loadConfig(ctx).writing.enabled` each turn and leave the section unset when it is false. Keep both handlers from throwing (wrap the per-turn read). Extend R-2500's check, keeping its title: in one process, with the key flipped between two `before_agent_start` events of one session (off then on, and on then off), each turn follows the key.

2. R-2503's slicer must not read a fenced line as a heading. In `packages/nana-pack/tests/writing-check.test.mjs`, skip lines inside a fenced code block (an opening ```` ``` ```` or `~~~` line to its matching close) when finding headings, as `packages/nana-pack/bin/nana-frontier.mjs` does. Match a live heading the way nana-frontier matches a section name (read its matching and mirror it, with a comment naming it): case-insensitive, the name followed by its end, a space, `—` or `(`. Add to the control fixture: a fenced block holding `# install on this machine` inside `## Next`, followed by a 27-word sentence that must still be found; and a fenced `## Next` sample that must not count as a second Next.

3. Run `node packages/nana-pack/tests/writing-injection.test.mjs`, `node packages/nana-pack/tests/writing-check.test.mjs`, then `npm run map`, `npm run map:check`, `npm run req:tree`, `npm run readme:check`, `node scripts/requirements-trace.mjs`, then `npm run test:locked` before your commit. Break each fix once (read the key only at session_start again; let the slicer see fenced headings) and see its check go red; restore. Commit with explicit paths.

Seat check: `node docs/reviews/writing-adoption-2026-10-21/seat-titles.mjs all` must print `0 missing`.

Done:
- The key applies on the next turn in both directions; R-2503 ignores fenced headings and matches live names as nana-frontier does.
- The two test files, map:check, req:tree, readme:check, the trace and the full suite are green; the seat check prints `0 missing`; the work is committed.

Report (at most 10 lines after the VERDICT line): the commit sha; the check results; the wrong versions tried; the full suite's summary line; map, readme, trace and seat-check status.
