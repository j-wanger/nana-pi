## Review: BLOCK — 6/10

Reviewed the full `git diff main..HEAD` at `24054aa`. The URL repair works, but the replacement guard still loses real imports.

### MUST 1 — The `*` guard drops ordinary generator-method imports

**Location:** `templates/typescript/template/scripts/code-map.mjs:431`; `REQUIREMENTS.md:1227–1230`

Executed these sources through `node --check` and both parsers:

```js
const loader = {
  *load() { yield import("./a.mjs"); }
};
```

```js
const value = 2
  * (await import("./a.mjs")).value;
```

Both are valid JavaScript. Main returns `["./a.mjs"]`; HEAD returns `[]`.

A generator method containing the new URL form also loses its edge. This is not limited to the recorded “multiplication by a promise” residual: generator methods are ordinary code, and multiplication can use an awaited numeric export.

**Smallest fix:** subtract the `*` rejection, update R-864 first, and add preservation tests. Do not replace it with another unproven lexical heuristic.

### MUST 2 — The `//` guard drops real imports after multiline strings

**Location:** `templates/typescript/template/scripts/code-map.mjs:430`

These sources also pass `node --check`:

```js
const text = `prefix
//`; import("./a.mjs");
```

```js
const text = "prefix\
//"; import("./a.mjs");
```

The import is executable code, but its physical line starts with string contents spelling `//`.

Main returns `["./a.mjs"]`; HEAD returns `[]`. A quoted string containing raw U+2028 before `//"; import(...)` produces the same regression.

**Smallest fix:** subtract the remaining guard and retire R-864. Keep raw-source matching with the explicitly accepted spurious-edge residual. Add these preservation regressions.

Together, MUST 1–2 favor removing the guard entirely, not restoring the lexer.

### MUST 3 — R-860’s “every dot and paren” evidence remains incomplete

**Location:** `packages/nana-pack/tests/code-map.test.mjs:148–151`; `templates/typescript/template/tests/code-map.test.ts.jinja:335–359`; `REQUIREMENTS.md:530`

Three independent scratch mutations removed support for:

- Whitespace after the suffix dot: `. href` / `. pathname`.
- Whitespace between `URL` and `(`.
- Whitespace between `import` and `(` in the URL pattern.

**Each mutation passed the repository code-map suite and the rendered TypeScript suite, 82/82.** HEAD currently accepts these spellings; the tests do not pin them.

The two narrower mutations—removing whitespace before `.href`, and around `import.meta.url` dots—correctly failed their respective tests.

**Smallest fix:** add distinct-target fixtures covering each promised whitespace position in both suites. Mutation-check them before retaining the unconditional `implemented` claim.

### SHOULD 1 — The guard matrix misses its actual closing-comment boundary

**Location:** `packages/nana-pack/tests/code-map.test.mjs:220–225`; corresponding matrix in `templates/typescript/template/tests/code-map.test.ts.jinja`

The positive fixture uses:

```js
/* note */ import("./a.mjs");
```

That line never starts with `*`, so it does not exercise the `*/` exemption.

Removing `!trimmed.includes("*/")` passed both suites, including rendered TypeScript **82/82**. Removing CR from the recognized line terminators also passed both suites.

Current HEAD correctly preserves imports after `*/` on a `*`-line and after CR, LF, CRLF, U+2028 and U+2029 comment endings.

**Smallest fix:** preserve these as regression tests. If the guard remains, test the actual `* … */ import(...)` boundary.

The negative matrix does catch bypassing the guard independently for STATIC_FROM, DYNAMIC and DYNAMIC_URL: each mutation fails both comment-shape tests. BARE_IMPORT’s negative cases are already rejected by its anchored regex, so bypassing its guard legitimately changes nothing.

### SHOULD 2 — The safety explanation reverses what subtraction guarantees

**Location:** `templates/typescript/template/scripts/code-map.mjs:404–411`; `REQUIREMENTS.md:520–521,1217–1219,1227–1230`

“Can only DROP … so it cannot introduce a new lost edge” is false. Dropping matches is precisely how the guard introduces lost edges.

Open question 12 also calls spurious edges “not a silent failure mode,” immediately before explaining how they can silently suppress the untraced-test count.

**Smallest fix:** remove the monotonicity-based safety claim. State that raw matching can invent edges and filtering can erase them. Replace the claimed single lost-edge exception with the actual decision taken after this review.

## Verification and earlier-round disposition

- **Independent graph comparison:** 172 modules; **144 → 245 edges**, **101 added, zero removed**, zero graph problems.
- **Zero-callee tests:** **67 → 13 of 95**.
- **Production modules without direct test callers:** **56 → 27 of 77**.
- The unchanged repository edge set does **not** establish guard safety; the executed fixtures above demonstrate regressions outside this checkout’s current source shapes.
- **Round-2 six-input replay:** all real imports survive. Both division cases and both comment-terminator cases are fixed. The two valid-string cases still invent `./fake.mjs`, squarely within Open question 12’s accepted string-text class.
- **R-863:** correctly retired; its unconditional lexical exclusion is no longer claimed.
- **R-861/R-862:** count evidence remains sound. Fresh scaffolds report **1/5 TypeScript**, **4/5 Python**.
- **Round-1 closures:** six URL combinations pass; exclusion fixtures pass; shared instructions accurately describe a global zero-callee count; identical-copies check passes.
- **Passed:** repository code-map suite, requirements-trace suite, template-render suite, `npm run map:check`, rendered TypeScript **82/82**, rendered Python **59/59**.
- **README gate:** the same five missing-path failures involving `node_modules` and `apps/bench/.ext`.
- Full repository suite not rerun. All mutations stayed under `/private/tmp`; the worktree remains clean.

**Landing recommendation:** subtract the guard, retain the documented raw-source false positives, and complete the whitespace evidence. No further lexer work is justified in this capped lane.

**VERDICT: BLOCK — 6/10**
