## Review: BLOCK

The main repair works: 101 additional edges restore links from 54 test modules. However, the new parser invents edges from non-code text and misses valid spellings of the promised forms.

### MUST 1 — Non-import text creates new edges

**Location:** `templates/typescript/template/scripts/code-map.mjs:395–403`

I ran `buildGraph` on these crafted sources:

```js
// import(new URL("./a.mjs", import.meta.url).href)
const text = 'import(new URL("./a.mjs", import.meta.url).href)';
```

Both create an edge to `a.mjs`. The old parser returns no edge for either source.

This can invent test callers, suppress the untraced-test count, or fail `--check` on a nonexistent dependency. Python’s AST reader correctly ignores equivalent comments and strings.

**Smallest fix:** exclude comments and string contents from recognition of the new import expression. Add graph-level negative tests for both examples. Preserve executable expressions inside template interpolations.

### MUST 2 — Valid `.href` forms silently disappear

**Location:** `templates/typescript/template/scripts/code-map.mjs:396`; `REQUIREMENTS.md:515` (R-860)

Executed results:

```js
import(new URL("./a.mjs", import.meta.url).href)   // edge
import(new URL("./a.mjs", import.meta.url) .href)  // no edge
import(new URL("./a.mjs", import . meta . url).href) // no edge
```

Whitespace does not change JavaScript semantics. These remain the literal-relative-URL forms R-860 promises to map.

**Smallest fix:** recognize whitespace between member-access tokens, including before `.href` and `.pathname`, and test those spellings. Token-aware recognition would address this alongside MUST 1.

### SHOULD 1 — R-860’s evidence does not pin every promised combination

**Location:** `packages/nana-pack/tests/code-map.test.mjs:129–150`; `templates/typescript/template/tests/code-map.test.ts.jinja:261–282`

Both fixtures exercise four combinations, not all six:

- Bare, `.href`, `.pathname` without options.
- Only `.href` with options.

In a scratch copy, I mutated the pattern to reject **bare URL plus a second argument**. The repository code-map suite still passed. The rendered TypeScript suite also passed **54/54**, while the mutated parser returned no edge for that promised form.

**Smallest fix:** parameterize the three forms against presence/absence of the second argument, using distinct targets. Include graph-level assertions that each specifier becomes an edge.

### SHOULD 2 — Shared instructions overstate what the count establishes

**Location:** `templates/_shared/working-under-nana-pi.md:140–142`; `AGENTS.md:249–251`

“Counts the ones it cannot link” suggests a census of tests missing from a requested module’s impact. The implementation counts only test-root modules with **zero mapped callees anywhere**.

I constructed two test-root modules importing each other, with one also containing an unsupported dynamic import. Impact for the production module showed no callers but reported:

```text
untraced tests: 0 of 2 test modules import no mapped module …
```

The CLI line itself accurately describes its measurement; the shared instructions should be equally precise.

**Smallest fix:** say:

> It lists mapped transitive callers, including tests, and reports the global count of test-root modules with no detected mapped import. Tests with some detected imports may still have missing links.

## Verified findings and gates

- **Independent recount:** 172 modules; edges **144 → 245**; zero-callee test modules **67 → 13 of 95**; production modules without direct test callers **56 → 27 of 77**.
- **Accepted forms:** all six straightforward combinations currently parse. Tested variables, concatenated arguments, template literals, absolute URLs, and absolute paths produced no spurious relative edge.
- **Count parity:** both implementations use test-root membership and empty mapped-callee lists. Both print identical wording. Fresh scaffolds report **1/5 TypeScript**, **4/5 Python**.
- **Declared asymmetries:** Python rejects detected nonliteral dynamic imports; TypeScript silently drops them. This is honestly recorded. Python’s bare script-import resolution gap is also recorded, so it is explicitly **not the only asymmetry**. Comment/string recognition is another difference.
- **Status:** R-861 and R-862 have executable evidence for the printed counts. R-860 needs the coverage correction above.
- **Template markers:** new tests correctly render `req: G-011` for scaffolds and `req-candidate: G-011` for adoption.
- **Shared copies:** identical-copies test passed; `CLAUDE.md` points to `AGENTS.md`.
- **Layer/package checks:** no new configuration exemptions or suppressed generator problems. Excluding already-layer-exempt tests from the repository’s production-layer assertion is justified.
- **Passed:** repository code-map suite, requirements suite, template-render suite, `npm run map:check`, rendered TypeScript **54/54**, rendered Python **59/59**.
- **README gate:** five missing-path failures, matching the reported absent dependency directories.
- I did not rerun the full repository suite. All mutations stayed in scratch copies; the worktree was not edited.

**VERDICT: BLOCK — 7/10**
