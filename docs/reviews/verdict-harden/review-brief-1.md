Feature: FEAT-007 · Review a specific revision independently

# Review brief 1: verdict-harden

Review `git diff main...HEAD` on feat/verdict-harden (one commit, 2daaed41).

Card: the review-fix review (LAND) found the new prose-opener rule accepted honest send-back spellings outside its label list, so a review opening "Verdict: send back" and ending `VERDICT: LAND` recorded LAND. This lane:
1. Normalises U+2010–U+2015 and the space in "send back" / "fix first" to `-`, keeps a soft hyphen from joining words, and matches the stems `block`, `reject` and `request changes`; such a first line against a different final label refuses again.
2. Fixes the README's contradictory empty-verdict text.
3. Keeps the selected-line diagnostic on the re-ask path and writes a failed confirmation beside the first text at `--out`.
4. Commits the `large.md` fixture so the tracked `--out` refusal is exercised again.

Builder's validation: the stored texts (444 in the home store, 3,639 under docs/reviews) read the same before and after — 0 changed readings. 32 related test files pass alone. One file it flagged, agent-dir-config, passes on main and on this tip when the seat runs it; its failure came from the builder's environment.

Questions:
- Does any honest negative opener still record the opposite final label (other dashes, spacing, case, "changes requested", "not ready", "needs work")?
- Does the hardening turn any agreeing opener (for example "Verdict: ready to land; no MUST stands.") from a label into unread? That is acceptable only if the re-ask then recovers it.

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.

Put exactly one verdict line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, as the last line, and no other line starting with "Verdict".
