# planner-prompt · plan (seat, 2026-10-28; revised after one adversary pass)

Feature: FEAT-006 · Launch builders with execution limits

The seat wrote this plan, and one adversary attacked it (`plan-attack.md` beside it: 1 MUST, 7 SHOULD, 4 NOTE). The seat took every finding; the revision notes at the end say where each one went. Plans get no review round.

## Purpose

The owner agreed his intent on 2026-10-27: think better together; stop building on a wrong premise; keep understanding and steering what gets built. The current priority's first clause applies: remove the ceremony the seat added beyond the owner's lane rulings.

On 2026-10-28 the owner said "go" to this lane. The seat's slate had described it in these words: "One reviewed prompt replaces 27 scratch copies. It asks every plan for purpose, assumptions and open choices. It keeps wrong-code checks for hook, install and gate lanes only."

In the same message he ruled: "Yes, bring me readings". So before the seat plans new capability, it brings two or three readings of the intent, once per request. A fix that restores agreed behaviour plans straight away.

What he gets:

- Plans start from an intent he agreed.
- Planners stop copying an earlier plan's form. That copying is the source of the extra wrong-code campaign and the lists of allowed edits.
- A fresh seat, Claude Code or pi, can read what planners are told, where each instruction came from and which one wins.

## Assumptions (any may be wrong)

- A1. The drift came from the seat's planner instructions, not from a wrong class call.
  - After 2026-10-21, 46 of 48 lane folders hold seat pairs or seat mutation files.
  - Six of the seat's own planner workflow scripts carry a `const FORMAT` that says to follow an earlier lane's must-meet file.
  - The working pattern already limits pairs to install, hook or gate lanes, and the R-1300 check pins that limit. Even so, naming the limit did not change what the seat did.
- A2. A planner, whether a Claude Code workflow agent or a pi session, reads a file it is pointed at. No print command is needed, and the seat cut the proposed one.
- A3. Pointing at the prompt is not enforcement. What changes behaviour is removing the format pointer at its source.
  - After the land, the seat searches its session workflow scripts once for `const FORMAT` or a pointer to an earlier lane's must-meet file, and reports the count. That is a one-time search, not a record.
- A4. The prompt is a manual tracked artifact, like the builder preamble (A-079). Its only reader is a rule: the working pattern's Plans bullet points to it.
  - The 2026-10-22 ruling says that closing a hand-made maker or a rule-only reader comes first. Here, no code reader is wanted by design (see A2), and the artifact line says so.
- A5. One more ruling keeps the rulings file under the extension's read cap: about 3,500 of 8,192 bytes today.

## Open choices

The builder decides each one and reports it, unless it is marked for the owner.

- O1. The prompt's section order and wording, within the pinned sentences below.
- O2. The rows sit in FEAT-006, beside the builder preamble and the seat rule. FEAT-014 holds the working-pattern rows. The seat's pick is FEAT-006; the builder says if a row clearly belongs elsewhere.
- O3. The ruling's wording. It must carry this meaning: before the seat plans new capability, it brings the owner two or three readings of the intent, once per request; a fix that restores agreed behaviour plans straight away.
  - An agreed reading is the owner's own words that already choose one meaning. Examples are a plan he wrote, a pick he made, or a "go" on a slate line that described the lane.
  - The seat tells the owner about this definition in its next report.

## Threat model

In scope is honest variation in our tools' output, files and environment:

- a planner run as a Claude Code workflow agent or as a pi session;
- a request with or without an agreed reading;
- a fix or new capability;
- a project other than nana-pi, where pack files exist only under `$HOME/nana-pi/`;
- CRLF in the prompt or the rulings file;
- a plan written to the prompt's form being copied into a pi-worker brief.

Deliberate forgery is out. A finding outside this model is a residual.

## Precedent

- `packages/nana-pack/prompts/builder-preamble.md`, loaded at `packages/nana-pack/bin/pi-worker.mjs:155-156`: a tracked prompt in the pack.
- `packages/nana-pack/prompts/review-standard.md` with `packages/nana-pack/tests/review-standard.test.mjs:22-40`: a tracked prompt whose required sentences are pinned exactly. The new prompt's pins follow this, not phrase-absence checks.
- `templates/_shared/working-under-nana-pi.md:33`, the Seat guide bullet: a pack file named from the shared pattern by its `$HOME/nana-pi/...` path.
- `templates/_shared/working-under-nana-pi.md:27` and its AGENTS.md copy at `AGENTS.md:95`: the Plans bullet this lane extends. `packages/nana-pack/tests/templates-render.test.mjs:597-621` pins it. R-2584, R-1100, R-1300, R-1102 and R-1103 each pin a phrase the bullet keeps.
- `packages/nana-pack/lib/brief-precedent.mjs:30-62` and `packages/nana-pack/lib/brief-config.mjs`: pi-worker's brief parser. A Precedent entry must open with a tracked path or `none: <reason>`, and the Feature line must open a line.
- `packages/nana-pack/rules/nana-rulings.md` with `packages/nana-pack/tests/rulings.test.mjs:225-234`: the R-2663 pin of one ruling's exact line is the form for pinning the new ruling.
- `REQUIREMENTS.md:489`: A-079, a manual tracked prompt artifact.
- `packages/nana-pack/skills/spec/SKILL.md:22-24`: questions before drafting, and an Assumptions section.
- `scripts/code-map.mjs:158`: `--impact` prints callers, tests and artifact readers for a code file. The prompt points planners to it.
- `packages/nana-pack/tests/rulings.test.mjs:215` and `:238-240`: the rulings file is checked for owner words, work projects and model ids. The new prompt is public too and gets the same check.
- `packages/nana-setup/tests/project-stale.test.mjs`: a change to the shared working pattern makes every adopted project print a stale line until `nana-setup project` runs there.

## Outside precedent

- GitHub Spec Kit's clarify step ranks clarifying questions before a plan. We borrow the idea and import no code.

## Must-meet

Rows R-2950 to R-2959 are free for this lane. Each check carries its `// req:` marker directly above it. Each check pins exact sentences, as `review-standard.test.mjs` does. A check that only finds section names is not enough.

1. A planner prompt exists at `packages/nana-pack/prompts/planner.md`.
   - It opens with a Sources section that lists each source by path, in the order that wins a conflict:
     1. the owner's words for this lane;
     2. the rulings, at `$HOME/nana-pi/packages/nana-pack/rules/nana-rulings.md`;
     3. this project's own AGENTS.md section after the shared markers;
     4. the shared working pattern, this project's AGENTS.md between the markers;
     5. the prompt itself.
   - It restates no ruling or working-pattern sentence. It holds only planner-only instructions.
   - The check resolves each `$HOME/nana-pi/` path against the checkout root and finds the file.
2. The planner prompt asks, in this order, for:
   - a Purpose that quotes the agreed intent reading, or for a fix the row, ruling or contract it restores;
   - marked Assumptions and Open choices;
   - the Feature line, the threat model, the Precedent, any Outside precedent and the must-meet tests.
3. For new capability with no agreed reading, the planner prompt tells the planner to return two or three intent readings, each with its consequences, and a recommended pick, and no plan.
   - It defines an agreed reading as in O3.
4. The planner prompt pins four positive sentences:
   - expected changes to existing tests are a forecast, never a limit on what the builder may edit;
   - the seat's wrong-code pairs belong to install, hook or gate lanes;
   - an earlier plan is grounding for a decision it records, never a format to copy;
   - the planner forecasts test changes with the project's map impact command for code files, and by searching tests and checkers for the path and every literal the change breaks for files the map does not cover.
   - The check also asserts that the prompt names no `docs/reviews/` path and no `must-meet.md`.
5. A plan in the prompt's form starts a build.
   - The prompt spells the brief rules: the Feature line opens a line as `Feature: FEAT-nnn · <label>`; each Precedent entry opens with a tracked path or `none: <reason>`; outside projects go under their own Outside precedent heading.
   - The check runs `readBrief` and the Precedent check on a sample plan in that form and gets no refusal.
   - The prompt also tells the planner to read the feature's known-bug file when one exists.
6. Two copies of the Plans bullet gain one sentence: the shared working pattern's copy and nana-pi's AGENTS.md copy.
   - The sentence names the planner prompt by its `$HOME/nana-pi/...` path.
   - It says the seat gives the planner the request and its grounding, and an earlier plan only as grounding for a decision it records, never as a format to copy.
   - The bullet keeps every phrase R-2584, R-1100, R-1300, R-1102 and R-1103 pin. The AGENTS.md region stays byte-identical to the rendered template.
   - The render test pins the new sentence.
7. The rulings file carries the owner's 2026-10-28 readings ruling as one dated bullet. One check pins its exact line, in R-2663's form.

Also in this change, with no new row:

- The prompt passes the same owner-word, work-project and model-id check as the rulings file, through the existing test's helper.
- The prompt gets a manual artifact line beside A-079, as A-083 or the next free ID.
  - Its `Read by:` claim is of kind rule: the Plans bullet points every planner to it.
  - It carries the A4 reason. The tree check stays green.

## Expected changes to existing tests (forecast, not a limit)

- `templates-render.test.mjs`: the R-2584 check reads the extended Plans bullet. Its pinned phrase stays, and so do the R-1100, R-1300, R-1102 and R-1103 phrases. The new sentence gets its own check.
- `rulings.test.mjs`: the form pins already cover a new bullet. The new pin follows R-2663.
- Nine test files read the shared template, and six name the rulings file. The builder searches them for each literal the change breaks, and reports any change.

## Class and size

- Class: ordinary. The lane touches:
  - a new prompt file;
  - the rulings file's text;
  - the shared template;
  - AGENTS.md;
  - REQUIREMENTS.md;
  - tests.

  It changes no install, uninstall or doctor code, no hook or extension code, no gate policy and no land or review tool. Under the lane-class rule, this lane's files are its live example of the widening question in that lane's choice C3.
- Size: small, so `pi-worker --lane-size small`.

## Notes the seat writes before the final round

- HANDOFF Next 1 to 3 become:
  - the discovery priority;
  - the overdue 10-23 readings, as an owner line with a default;
  - the two-builds-and-one-plan cap the seat now runs.
- The session entry records page 1's outcome: the agreed intent, the product page's two modes and the readings ruling.

## After the land

- The land report tells the owner that his other adopted projects show a stale working-pattern line until `nana-setup project` runs in each.

## Revision notes (seat, after the attack)

- **MUST, brief parser:**
  - Outside precedent moved to its own heading in this plan and in the prompt (must-meet 5).
  - The parser check is a must-meet.
  - The lane-class plan was fixed the same way.
- **Taken, with the must-meet each went to:**
  - Home paths and the project-section precedence went to must-meet 1.
  - The agreed-reading definition went to O3 and must-meet 3.
  - "Grounding, never a format" went to must-meets 4 and 6.
  - Map impact plus searching for literals went to must-meet 4.
  - Exact-sentence pins went to the must-meet preamble.
  - "No restating sources" went to must-meet 1.
- **Taken in the assumptions and forecast:**
  - The A3 evidence and the one-time search after land went to A1 and A3.
  - The four kept phrases went to the forecast and must-meet 6.
  - The A4 ruling reason went to A4.
  - The A1 count was corrected.
  - The readings ruling pin is must-meet 7.
- **Forward precedent search (after the attack):** it added the identity check and the stale-line note. It found little else, because Markdown files sit outside the code map.
- **Overlap with lane-class:** whichever lane lands second adds one prompt sentence: take the lane class from `lane-class --files`. The seat puts it in that lane's brief.
