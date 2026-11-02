The owner of nana-pi is away until 07:00 EST and asked: "make your best judgment and then consult with pi Astra when you need me". You are that consult.

Context: the plan is docs/reviews/seat-anatomy-2026-11-02/plan.md in this worktree (revision 2). It is a descriptive study of what the Claude Code seat's context holds. Relevant owner precedent: for memory curation he answered "yes profile records get sent as well" (his saved profile records may go to the curation model). Earlier sessions already sent those same owner turns to the same provider, because the seat itself runs on it.

Answer each question below: your pick, one line why, and what would change your mind.

## Questions for the owner

The owner is away. The seat decides these with an astra consult; each default is the one this plan defends.

Question: In a later labelling run over seat units, may the model labeller receive the owner's own turns and the memory files?
Default: no. Label only the system-supplied kinds (system prompt, rules, project instructions, hook output, knowledge pulls, compaction summaries). Owner turns and memory files stay deterministic counts until the owner says yes.
What the default gains and misses: gains no new copy of the owner's words or memory at a model provider without his say; misses a function split of the seat's largest variable input, the owner's turns.
Cost of a wrong guess: hard to undo. Text sent to a model cannot be recalled. This lane sends nothing either way, so the default only shapes a later run.
If answered otherwise: the later run adds owner and memory kinds to its label input. The owner's yes is recorded with the date in that run's notes.

Question: In that later run, should the labeller reuse the sealed prompt that says "a builder's context", or a role-neutral prompt?
Default: a role-neutral prompt with a new sealed hash, checked by a fresh seat agreement sheet before any share is read.
What the default gains and misses: gains labels not pushed toward builder readings of seat text; misses direct reuse of the builder κ 0.86 check, so it costs one more sheet (about USD 2).
Cost of a wrong guess: easy to undo. Labelling happens outside this lane, and a new prompt needs only a new private folder.
If answered otherwise: the seat labels with the sealed prompt and marks the shares as builder-framed.

## Feature

Feature: FEAT-042 · Measure what each role's context is for

These are in-place text edits, with no regroup and no new feature:
- The label widens from "a builder's context" to "each role's context".
- The Purpose line adds "and seat".
- Artifact A-092 becomes "segmented role contexts", with the seat command added to its `Made by` line.

The owner's direction for B ("eventually every role") makes one feature the stable home. Rows R-3640 to R-3648,
one per must-meet.

The deliverable is the seat store, a run of A-092, made by `node apps/bench/anatomy.mjs segment --role seat ...` by
hand outside git. It is read by `apps/bench/anatomy.mjs` (report, label, sample, assemble). The committed counts file
is `docs/reviews/seat-anatomy-2026-11-02/seat-counts.md`, counts only, written before the final round.
