Feature: FEAT-040 · Make and keep memory

Lane memory-curation. Class: ordinary. Threat model: honest variation in our tools' output is in scope (malformed or partial store, shared quotes, a model that returns junk or nothing, an owner who rejects everything, records from both machines); deliberate forgery is out.

Review `git diff origin/main...HEAD` on `feat/memory-curation`. The plan of record is `plan.md` in this folder (revision 2, after `plan-attack.md`); `build-brief-1.md` and `build-record.md` record the build. Pull request #318.

The owner asked: "we need memory curation lane, otherwise the memory is not usable" and picked "B: model + your review queue": a model proposes merges and retirements, the owner accepts or rejects each, and nothing applies without his accept. He also answered "yes profile records get sent as well". The change: `nana-curate` (propose, queue, accept, reject) with its library and config under SUB-027, curation files under `projects/curation/`, `writeStateEvent` in `memory-store.mjs`, a review-turn skip in `memory-making.mjs`, R-3560 to R-3577, artifact A-100.

Question: does the feature work for its user, the owner, who must be able to curate the current store through the seat into something usable; check especially that proposing never changes a live record or blocks a later save, that an accept applies only through retract and supersede events with the owner's words, that a rejection blocks any smaller set and a single-record retirement, that a stale proposal never applies, that a failing model yields no proposals with a stated reason and never a silent success, that reviewing makes no new memory, and that no record text reaches a log, test output, CI or the repository; and does the change cause a harm the review standard lists?

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
