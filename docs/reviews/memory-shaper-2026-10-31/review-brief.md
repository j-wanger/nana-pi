Feature: FEAT-040 · Make and keep memory

Lane memory-shaper. Class: ordinary. Threat model: honest variation in our tools' output is in scope (transcripts in every runtime shape, model replies that are malformed, partial or name another model, runs that hit the spend cap, inputs that change between labelling and scoring); deliberate forgery is out.

Review `git diff origin/main...HEAD` on `feat/memory-shaper`. Main is a6dcc99a. The plan of record is `docs/reviews/memory-shaper-2026-10-31/plan.md`, revised after its adversary pass (`plan-attack.md`). Build briefs 1 and 2 and `build-notes.md` record the builds. `sealed.txt` and `scored-runs.md` record the seat's canary and two scored runs, counts only. The 2026-10-31 entry "a model shaper tested against the rule maker on frozen labels" in `docs/sessions/2026-10.md` summarises the lane.

The change: `npm run memory:shape` classifies owner turns and review titles with an isolated Claude call (pi by one sealed value), writes records in the shared shape for the unchanged scorer, caps and counts spend, and prints counts only. The rule maker's unit walk and record builder became exported, with the rule maker's behaviour unchanged. R-3251 to R-3269; artifact A-091.

The seat's record:
- Builds 1 and 2; locked full suite at e1eddf69: 244 files, 242 pass, 2 skip. CI run 41244630072 for that tip.
- Canary: build 1 failed every real call on an array-rooted schema; build 2 passed.
- Scored runs on frozen inputs matched the labelled counts; both miss the bar; the rules stay the maker. The lane lands either way, as its plan says.
- Known bugs added: three lines in `docs/known-bugs/FEAT-040.md`.

Question: does the feature work for its user, the seat comparing a model shaper with the rule maker on the same labels, and does the change cause a harm the review standard lists? Check especially that no owner text reaches stdout, stderr, CI logs, test fixtures or any file in a checkout; that the Claude runner is isolated (no tools, MCP, settings, session or discovered rules) and refuses a reply from another model; that spend is never shown as known when it is not; and that the rule maker's behaviour is unchanged.

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
