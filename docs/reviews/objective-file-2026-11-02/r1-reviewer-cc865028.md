I found no MUST finding. Nothing listed in the review standard is harmed, and every check I could run passes.

**Do nana-pi sessions now get their own lines?** Yes. I ran `node packages/nana-pack/bin/nana-objective.mjs --cwd <worktree>/packages/nana-pack` and the block reads:
- `governing: …/objective-file/OBJECTIVE.md`, then nana-pi's own Objective and Current priority lines.
- The umbrella's lines below them as `program objective:` and `program current priority:`.
- The precedence sentence naming both files.

Neither line was cut short. No UNTRUSTED DATA label appeared, so this machine's trust store already has a trust record covering the worktree.

**Does it follow the seed's shape?** Yes, on everything the producer reads:
- Each marker line is one physical line (lines 5 and 7).
- The DRAFT suffixes are gone, which is right for ratified lines.
- The four Rules match `templates/_shared/OBJECTIVE.md` word for word.
- The opening italic paragraph is reworded, and the seed's second paragraph ("What a session actually sees…") is left out. The producer never reads either one (NOTE).

**Does the new root file break any test, check or tool?** No.
- **CI:** run 41388667367 on tip `57c4ee8d` passed. That covers the suite on ubuntu, macos and windows, plus all four install-check legs.
- **Local checks:** `scripts/readme-check.mjs --check` passed (1064 claims, 0 problems), and `scripts/code-map.mjs --check` found 0 problems.
- **Copier:** templates come from `templates/{{ language }}/template` and pull the seed in by its explicit `templates/_shared/` path, so the new root file is never copied into a project.
- **Stale-copies row:** nana-setup's check skips any checkout that has `templates/_shared`, so nana-pi gets no row.
- **Adoption hook:** nana-pi already counted as adopted through HANDOFF, AGENTS and `docs/sessions`, so nothing changes.
- **Tests:** the objective tests run their producer cases in temp folders, not inside the repo.
- **Identity scan:** the file exits 0. The umbrella's lines use the owner's name; this file says "the owner".

**Findings**

1. **SHOULD — where the objective line came from.** `OBJECTIVE.md:5` cites the owner's words "give nana-pi its own objective file". That quote approves creating the file, not this wording. The line itself is the seat's restatement of the umbrella objective, with nana-pi's parts listed. The project's ratify guidance (R-676, the copier completion steps) says objective lines are the owner's words and never invented. The appetite is marked "seat-proposed", but this line isn't. Either mark it the same way ("seat-drafted 2026-11-02; the owner can change it") or get the owner's own sentence. This is not a listed harm, so it goes on a known-bug line.

2. **NOTE — outdated reasons in `readme-check.config.json`.** The exemption reasons at lines 81–125 still say "nana-pi has no `.pi/`, no `.claude/` and no OBJECTIVE.md of its own (the umbrella objective lives in ~/nana-agent-loop)". The `OBJECTIVE.md` exemption at line 100 now names a file that exists. The check still passes, so this is only misleading text.

3. **NOTE — the priority line exists twice.** nana-pi's priority line is the umbrella's, with the owner's name replaced by "the owner". Every nana-pi session now prints it twice, once as governing and once as the program line. The two copies will drift unless both are edited at the 2026-11-16 review.

4. **NOTE — main has moved.** This branch is based on `6ad0b67c`, but main is now at `ac764bcf` (the land-test-split lane). That lane changes no file mentioning `OBJECTIVE`, so I expect no conflict. The land still needs main merged in and a confirmation round on the merged tip.

VERDICT: LAND
