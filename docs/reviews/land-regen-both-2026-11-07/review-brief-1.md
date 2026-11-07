Feature: FEAT-008 · Integrate and clean up reviewed changes

# Review brief 1: land-regen-both

Review the whole lane: `git diff 860785c2..HEAD` on branch feat/land-regen-both. Plan: `docs/plan/land-regen-both.md` (M1–M7). Builder report: `docs/reviews/land-regen-both/build-report.md`.

A fix that restores agreed behaviour: the 2026-11-02 ruling says a conflict only in generated files, rebuilt by their own generators, counts as no conflict. nana-land refused when both sides changed a generated file in separate hunks without a textual conflict, which forced every waiting lane through another merge, review and CI run on 2026-11-07. This lane rebuilds those files with their generators and lands without new CI or review, and rewords the ruling.

Threat model: honest variation in generator output and git merge results; forgery out. One reviewer plus CI. This changes the land tool.

Question: does nana-land now land the both-sides case with exactly the generator's output, and does it still refuse everything it refused before outside the generator contract (non-generated conflicts, generator failure, a generator touching another file)?
