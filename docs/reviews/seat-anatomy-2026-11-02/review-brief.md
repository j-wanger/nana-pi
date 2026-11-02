Feature: FEAT-042 · Measure what each role's context is for

Lane seat-anatomy. Class: ordinary. Threat model: honest variation in our tools' output is in scope (compactions, /clear, resumed and forked sessions, sidechains, hook output that changed over time, odd transcripts); deliberate forgery is out.

Review `git diff origin/main...HEAD` on `feat/seat-anatomy`. The plan of record is `plan.md` in this folder (revision 2, after `plan-attack.md`, a pi adversary's attack with 8 MUST); its last section records the owner questions the seat decided with an astra consult (both concern an optional later labelling run, outside this lane). Builds: `build-brief-1.md` (stopped BLOCKED on a private helper) and `build-brief-2.md` (authorized exporting `textOnly`). `seat-counts.md` is the seat's counts-only baseline from the real seat transcripts, made after build 2. Pull request #323.

The owner picked reading A for issue #281: a one-off study of what the seat's context holds, built so a reusable every-role check can attach later. The change: a Claude Code seat adapter for the bench anatomy (`anatomy.mjs segment --role seat --runtime claude-code`), slot-to-kind mapping with delivery classes, compaction-aware segments, session and fork accounting, event identity, the seat's own reads by class, three repeat measures, corrections per session, and privacy on every command. R-3640 to R-3648.

Question: does the feature work for its user, the owner deciding how to craft the seat's context; check especially that the numbers never claim more than the transcript shows (recorded is not delivered), that no slot is double-counted across compactions, that the builder anatomy's output is unchanged, that reuse is by import not copy, and that no transcript text, owner text or session id reaches the repository, a log or test output (including `seat-counts.md`); and does the change cause a harm the review standard lists?

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
