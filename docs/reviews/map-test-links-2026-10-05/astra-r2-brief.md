# Review brief — map-test-links round 2, 2026-10-05 (reviewer: gpt-6-astra)

Round 1 (`docs/reviews/map-test-links-2026-10-05/astra-r1.md`, BLOCK 7/10) found: MUST 1 text in
comments and strings creates edges; MUST 2 whitespace between member-access tokens drops valid
forms; SHOULD 1 R-860's evidence pinned four of six combinations; SHOULD 2 the shared doc overstated
the untraced count. The round-1 brief (`astra-brief.md`) still applies in full.

The seat confirmed MUST 1 was PRE-EXISTING for the old patterns on main (`// x from "./a.mjs"`,
`// import("./a.mjs")`, and a template-literal string holding `import("./a.mjs")` each produced an
edge), so the worker was told to fix it once, for all four patterns, with a zero-dependency lexer
that gates a match on its keyword sitting in a code region (`codeMask()`). Worker's account
(commits `cc0061b`, `5805aa2`; not in `worker-report.md`, which covers rounds before this one):
- Edge diff on nana-pi, old generator (`1dc1e69`) vs this branch: 245 → 245, 0 removed, 0 added,
  0 problems (seat re-verified).
- MUST 2: whitespace allowed around `.href`/`.pathname` and every dot of `import . meta . url`.
- SHOULD 1: six combinations, distinct targets, in nana-pi's code-map test and the TS template
  test; five scratch mutations each fail exactly their own subset.
- SHOULD 2: the shared doc now says `--impact` reports the GLOBAL count of test-root modules with
  no detected mapped import, and that a test with some detected imports may still miss links.
- New row R-863 (the comment/string gate). Open question 12 lists what `codeMask` knowingly misses.
- Seat-found after `cc0061b`: a regex literal holding a quote right after `)` was read as division,
  and the quote opened a string that swallowed a real import on the next line (a LOST edge). Fixed
  in `5805aa2`: quoted strings end at a raw line terminator. The backtick variant remains and is
  recorded in Open question 12 (c) as able to lose OR add an edge; the direction is not guaranteed.

Review `git diff main..HEAD` in full, then attack the round-2 changes hardest:

1. **The lexer.** Try to make it LOSE a real import: a regex literal containing a quote or a
   slash, division that looks like a regex start (`a / b / c`), a `//` or `/*` inside a string,
   nested template literals with `${}` holding strings holding backticks, an import on the line
   after any of these, CRLF line endings, a shebang, a JSX-free `.ts` generic (`a < b > (c)`).
   Then try to make it ACCEPT text: comments, strings, template text, HTML-like comments.
   A lost real edge is worse than a spurious one — rank it that way.
2. **The edge diff.** Recompute nana-pi's edge set on main and on this branch yourself. Is every
   removed or added edge explained by the worker's list?
3. **Round-1 items.** Is each closed by execution — whitespace spellings, all six combinations
   with mutation proof, the shared doc's new sentence true for both languages?
4. **Status honesty** for the new row and R-860–R-862, as in round 1.

## Output

Answer with the full review as your final message; do not write it to a file. Give ranked findings
(MUST / SHOULD / NOTE) with file:line, evidence (what you executed or read) and the smallest fix.
End with `VERDICT: LAND` or `VERDICT: BLOCK` and a score out of 10.
