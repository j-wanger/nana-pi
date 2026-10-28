# posting-rule · plan attack (adversary, 2026-10-28)

## MUST

**M1. Must-meet 2 keeps the ambiguous sentence.** "Every phrase R-682 pins today stays" includes `templates-render.test.mjs:535-536`, the two sentences behind the "do both" reading. A literal builder keeps them and adds new ones; the check (`:548`, `includes(sentences.join(" "))`) passes on old-plus-new text.
Fix: must-meet 2 names what stays: sentences `:537-546`, the soul anchors (`:532`), the preamble ban (`:550`). Must-meet 1 adds a negative: no copy contains "Record each unresolved item and each open question on one HANDOFF line" or "Only the seat posts one issue each where". That makes the check fail on old and on old-plus-new wording.

**M2. The wording is the deliverable, yet O1 leaves it to the builder.** planner.md wants "what exact sentence or result it pins". The must-meet 1 sketch, as one sentence, is 35 words; R-682 fails 25 or more (`:548`).
Fix: pin the sentences below.

## SHOULD

**S1. No install check.** AGENTS.md "Install check before a land" covers any lane touching `packages/nana-setup/`, where `nana-soul.md` sits. lane-class still prints `ordinary` (checked).
Fix: name the local install check.

**S2. "Otherwise" can read as "if posting fails".** A seat without gh, or with a failing scan, falls back to a line, and one Open line turns the read off (`handoff-issues.mjs:18`; scratch run: "Next: none found." and no issues). "No unrecorded carry" forbids leaving it only in the report.
Fix: "never a HANDOFF line" (below, no extra words). Optional, seat's choice: "If posting fails, the report lists the item and the reason."

## NOTE

**N1. Known-bug line 1 is accurate but vague.** Scratch run: an empty Open section with a PR link printed "Open issues: issues pointer unreadable.", dropped both none-found lines and claimed a pointer in the header. A single-issue link (`…/issues/12`) does the same (`:21`). Suggest: "a list-free Open section with any other github.com link, even one issue's, prints the unreadable-pointer line and drops the none-found lines." Distinct from `FEAT-002.md:54`.

**N2. Known-bug line 2 half-duplicates `FEAT-002.md:55`.** The claim holds: `packages/nana-pack/README.md:446` gives 1,500 ms and no Windows limit; `frontier-summary-config.mjs:31` names 6.39 s cold Windows. Append "the pack README does not name it" to line 55, or add one README sentence instead.

**N3. Purpose overstates.** Only an Open line turns the read off (`handoff-issues.mjs:17-18`). A Next line merges with `next` issues and shows twice (`frontier-summary.mjs:98-109`, read from code). R-2977 fails on either. A project pointing only Next to issues gets no read.

**N4. Old copies outlive the land.** Live sessions keep their loaded rule; this session still holds the pre-issues-home text. Windows copies refresh on `nana-setup install` (`packages/nana-setup/README.md:47`); other projects on `nana-setup project`. Say so at land.

**N5. Fewer words is not reachable** without dropping a pinned behaviour: 164 to 174 words, each sentence under 25.

## Proposed wording

Replace `:535-536` in all three copies with the first three sentences; leads and the rest stay:

> Where the HANDOFF points to its issues, the seat posts each unresolved item and open question as one issue, never a HANDOFF line. Otherwise the seat writes each on one HANDOFF line under Next or Open for the owner. Only the seat posts, from the owner's gh account. Builders and reviewers put open questions in their report. Issues and the replies on them are public. …

Covered: issues project, sentence 1; list project, 2; Claude Code seat, soul; pi seat, AGENTS.md; builder or reviewer, 4 plus `builder-preamble.md:7-8`. Counts: 23, 16, 9, 9.
