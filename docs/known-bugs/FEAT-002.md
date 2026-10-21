# FEAT-002 — known bugs

*One line per known bug in this feature, moved from HANDOFF.md on 2026-10-21 and kept word for word. A review finding that does not block a land goes here as one line.*

- Handoff tests (handoff-pins, review): the writer-role test sets and clears its marker variable inside its loop, with no finally. At the end it deletes the variable instead of restoring its old value. The file's older checks do the same.
- Handoff tests (handoff-pins, review): the check that near-miss spellings of off do not skip the writer would also pass with journaling off. The paired check in the same pass needs the journal events, so the pair still fails then.
- Handoff tests (handoff-pins, review): the trust test's legacy refusal helper removes its temporary folder outside a finally. An error inside the helper leaves that folder behind.
- Handoff tests (handoff-pins, review): the near-miss marker check's title names only spellings of off. Its loop also runs with the marker unset and set to on.
- Handoff summary cut (handoff-cap-surrogate, independent check): the cut keeps a two-unit character whole, but not a joined emoji sequence. A family emoji can lose its end and close on the joiner. The text stays valid.
- Handoff stale pointer (handoff-cap-surrogate plan): the pointer's writer name is still cut raw, so it can split a two-unit character. The name comes from pi's session file name, so honest use does not reach it. A whole-character cut could leave an empty writer label. That needs a decision on the pointer's form.
- Knowledge pull cuts (handoff-cap-surrogate plan): the knowledge index cuts titles and claims raw, so a cut can split a two-unit character. Every field it shows passes the prompt cleaner first, so the worst case is a replacement mark. The general rule against such cuts stays untested.
- Review findings cut (handoff-cap-surrogate plan): a review finding is cut raw at its length cap. That text goes to the review ledger, not a prompt.
- Handoff values (handoff-cap-surrogate plan): the stale pointer's length cap and the one-day constant carry no note of their source, as the coding standards ask.
- Handoff cut checks (handoff-cap-surrogate): the independent check ran on the first build only. It held over 11 probes, including pi's own loader and a real session's cut. The second build changed only one test, so nobody re-ran the check. The seat's pairs and that check ran on macOS only.
- Frontier checks (frontier-first, plan): the live sections hold about 1,900 words, most of them in the Open asks. The word budget stays over until the owner answers or parks asks.
- Frontier checks (frontier-first, plan): nothing runs the checker at a land or in CI. The suite's R-2473 check is the one automatic pin, and only for this repo's file; other projects' files are checked by no suite.
- Frontier checks (frontier-first, plan): only the three live names count. The shared seed's Open heading is not Open for Jake, which predates this lane and also applies to the open-tag check.
- Frontier checks (frontier-first, plan): no test covers the byte count on a file with Windows line endings. The design counts each earlier line's carriage return.
- Frontier checks (frontier-first, plan): the read window copies pi 1.0.2's defaults; pi 1.3.0 keeps them. A pi upgrade that changes them needs the values retuned, and the two seals then fail naming R-2471 and R-2472.
- Frontier checks (frontier-first, plan): a single Landed line hundreds of words long is still not flagged; the landed-entry check covers only entries that span lines.
- Frontier checks (frontier-first, plan): a lane cut before this one lands meets a conflict in this file when it merges main. The seat places its lines in the new sections and compares the counts of known-bug lines and Open asks before and after.
- Provenance label (frontier-first final review): the dropped ask held three known limits. A broken trust.json link gets no diagnosis; writability and staleness are only pre-checks; the Claude hook resolves a relative override against its own folder. The label itself no longer fires in the owner's five repos.
- Frontier checks (frontier-first final review): the read window's exact edge is not pinned. Three wrong versions keep the 51 checks green: >= for >, the end line's newline counted, and the trailing empty element counted as a line.
- Frontier checks (frontier-first final review): pi splits lines on the newline only. On a file with Windows line endings, pi's line includes its carriage return. The checker stops before it and can read one byte under pi at the exact edge.
