# code-search · plan (seat, 2026-10-28)

Feature: FEAT-029 · Navigate code and investigate impact

The seat wrote this plan from `$HOME/nana-pi/packages/nana-pack/prompts/planner.md`. The owner picked on issue 248, 2026-10-28: "Its reading 2, but it really should run on an improved code map (reading 3)". One adversary attacked this plan (`plan-attack.md` beside it: 2 MUST, 3 SHOULD, 4 NOTE). The seat took all of them. The trial's search script, answer key and needs are under `trial/` beside the plan, with local paths removed. Plans get no review round.

## Purpose

Planners pick the existing code a lane should follow, its precedent. On ten past plans the seat's own lists held 76% of the code those lanes really reused (judged after the fact), and blind judges found useful code the seat never named in 4 of 10. The seat's trial searched the code map four ways. A search over each module's whole header, path and artifact lines, plus the code its top hits call, found 80% of the reused code; a search over purpose text alone found 35%. These are a hypothesis on ten seat-written needs, not a finding. This lane makes that search a planner command that adds to the planner's own list, never replaces it. It also improves the code map where the trial's search failed.

## Assumptions (any may be wrong)

- A1. The trial's signal came from three map parts: the whole six-tag header with the path, the artifact lines (which deliverables a module makes or reads), and the callee walk. Purpose text alone and behaviour text were weak (trial v3, scratch `v3-result.json`).
- A2. "Improved code map" means the two map changes the trial supports. The first adds launch links: a test or module that starts a bin by path counts as that bin's caller, which the import graph misses today. The second sharpens the headers of the modules where the search failed, such as `doctor.mjs` and the session-start modules. Copying artifact lines into every entry was dropped (attack M2): the trial gave them almost no weight, and the entry format belongs to the template generator every scaffolded project runs. The search reads artifact lines from REQUIREMENTS.md when it runs, as the trial did.
- A3. Ten needs are too few to tune weights. The lane ships the trial's plain settings, sealed with provenance, not a tuned model.
- A4. The planner runs the command; briefs carry only the code the planner chose (the owner's reading 2).

## Open choices

- O1. Where the search lives: a mode of `scripts/code-map.mjs` (`--search`), or its own script. Default: a mode, beside `--impact`, since both read the same map.
- O2, decided: the suite pins a quality floor on the ten trial needs, read at each need's base commit with that commit's REQUIREMENTS.md. It pins what the command prints, the top five plus their callees, against the trial's answer key (reused plus extended code). The trial measured 0.80 for that output. A shallow clone fails the check and names the missing commit; it never skips.
- O3. Launch links live in nana-pi's wrapper (`scripts/code-map.mjs`) or in the template generator. Default: the wrapper, so scaffolded projects and the Python template do not change in this lane.

## Threat model

In scope is honest variation: a need worded loosely or in other words than the headers, a module with a vague header, shared helpers that every lane imports, tests in the map, a module missing from the map, a large map. Deliberate forgery is out. A finding outside this model is a residual.

## Precedent

- `scripts/code-map.mjs`: the map generator and its `--impact` mode, which already joins artifact readers from REQUIREMENTS.md.
- `templates/typescript/template/scripts/code-map.mjs` (or the template generator it runs): where the written map's entry format comes from.
- none: no in-memory ranker in the repo; the knowledge index ranks with SQLite full-text search over a database file. The ranking follows the trial's `trial/structure.mjs` without its facets, and may reuse the knowledge index's stopword list.
- `packages/nana-pack/prompts/planner.md`: where planners are told to fill Precedent.
- `docs/code-map.md`: the written map the search reads.

## Must-meet

Rows from R-3000. Each check carries its `// req:` marker directly above it.

1. **The map shows launch links.** When a module or test starts a repo bin or script by its path, the written map lists it among that bin's callers, and the bin's callees. `map:check` fails when the links are stale. The headers of the modules where the trial search failed say what the module does in the words a plan would use.
2. **The search command.** `npm run map:search -- "<need>"` prints the top five modules for a need with one line each: path, purpose and why it ranked. Under them it prints the code those five call. It ranks over each entry's whole header, path and artifact lines, and leaves test files out of the top five but keeps them among the callees.
3. **It finds what lanes reused.** On the ten committed trial needs, read at each need's base commit, the search's top ten plus callees hold at least the sealed share of the answer key's code (trial: 0.80 for the top five plus callees). The suite run's time for this check goes in the build report.
4. **Plain and repeatable.** The same need on the same map gives the same output. No network, no model call.
5. **Planners use it.** The planner prompt tells the planner to run the search for each part of the lane and to name, under Precedent, what it took from the results. The check pins the sentence. Whether planners use it is read off the next three plans' Precedent sections, a carry, not a check.

Sealed tunables, each pinned by one test naming its row: the shortlist size, the callee depth and the quality floor, with the trial as provenance.

## Class and size

- Class: ordinary. `node scripts/lane-class.mjs --root . --files` on the code map script, a search module, the planner prompt, the map and package.json prints `ordinary`.
- Size: larger.
