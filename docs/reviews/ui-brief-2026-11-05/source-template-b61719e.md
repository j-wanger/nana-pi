# UI build brief: template (draft; evidence: FINDINGS #27–30)

Not yet promoted to nana-pi. It goes there through a lane once u7 shows that it transfers to a different board and a fresh picker.

## Steps at brief time (seat)

1. **Audience and use:** who uses the page and what they do with it, in 2–3 sentences. No style words. The builder doesn't need this text (#30); the reference picker does.
2. **References**, in one of two modes:
   - **Seat picks (default):** a seat picks 1–2 by looking at captured pages, not from names or descriptions.
   - **Owner picks (when the owner wants a say):** the owner stars 1–2 in the reference library (a private artifact; picks are read from its db `picks` collection). Seats capture any URLs the owner adds (`suggested`) at the next round and add them to docs/ui/references.jsonl. Images stay local; only metadata goes in git.
   For either mode:
   - Mix one in-domain page (the same job, for the same audience) with one award-level page from outside the domain that fits the audience's character. The award must be for the captured page itself, not another entry by the same maker (u7 picker weakness).
   - Capture each at 1440, scrolled to its densest relevant view, with cookie dialogs dismissed. Reject photo-led pages, cookie walls, and minimal-SaaS looks when the audience isn't SaaS.
   - Expect the builder to copy the reference palette almost literally (#29). Pick knowing that.
3. **Kit (recommended):** local fonts and icons, so nothing falls back to Arial (#28, #30: preferred, not required).

## The brief the builder gets

- The functional spec: content, fields, interactions, widths, contrast.
- "Design references: `ref-1.jpg`, `ref-2.jpg`. Open both and look carefully before you design. Match their character and energy for this audience. Don't copy their content, brand or photos. Carry the energy with type, colour and layout."
- The kit paths, offered rather than required.
- Effort: low is enough to reach "acceptable". High with the kit was preferred (#30).

## Gates before any human sees it

- Defect gate: no horizontal scroll at 390, zero axe contrast violations, the interactions work, no network, no missing local files.
- Show a human only builds that pass. Rate against an absolute anchor (one known-cheap build, one known-acceptable build).
