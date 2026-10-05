# Review brief — map-test-links, 2026-10-05 (reviewer: gpt-6-astra)

Jake's call: "Fix the map." nana-pi's code map could not see most of its tests: the TypeScript
generator's dynamic-import pattern missed `import(new URL("../x", import.meta.url).href)`, the
form 54 of 95 test modules use. A Sonnet worker fixed it on this branch. The seat's brief is
`docs/reviews/map-test-links-2026-10-05/build-brief.md`; the worker's report is
`worker-report.md` beside it. Review `git diff main..HEAD` in full.

This is a TEMPLATE change: both copier templates' generators and the shared agent instructions
ship to every new nana project at the next tag. A wrong edge, a false count, or a false sentence
in the shared doc reaches every project's agents.

## Attack

1. **The parser.** Does the new pattern accept exactly the forms the row names (bare, `.href`,
   `.pathname`, with or without a second `import()` argument) and nothing else? Try to make it
   (a) create an edge for a non-literal or non-relative URL, (b) create an edge from text inside
   a comment or a string that is not an import, in a way the old `DYNAMIC` pattern would not,
   (c) miss a form that occurs in this repo's tests. Run the generator on crafted sources.
2. **The untraced-test count.** Is it the number of test modules (under a `layerExempt` /
   `testRoots` root) with no mapped callee — in BOTH languages, with the same wording? Recount it
   yourself on this repo's graph. Does the line claim more than it measures?
3. **Parity.** Do the TypeScript and Python generators now state the same guarantees in
   `--impact`? Is the declared asymmetry (TS drops a non-literal dynamic import silently; Python
   fails `--check` on it) recorded honestly, and is it the only one this lane leaves?
4. **Status honesty.** For each new row: does the cited test pin the row's clause, or only part
   of it? Would the test fail if the behaviour regressed (mutate the pattern and run it)? Do the
   template test files carry the right markers for rendered projects?
5. **The shared doc and its copies.** Is the amended sentence true for both languages? Are all
   copies identical, and does the identical-copies test pass?
6. **The regenerated map.** Is `docs/code-map.md` current (`npm run map:check`)? Did any new edge
   raise a layer or package problem that was hidden or exempted rather than fixed?

## Output

Answer with the full review as your final message; do not write it to a file. Give ranked findings
(MUST / SHOULD / NOTE) with file:line, evidence (what you executed or read) and the smallest fix.
End with `VERDICT: LAND` or `VERDICT: BLOCK` and a score out of 10.
