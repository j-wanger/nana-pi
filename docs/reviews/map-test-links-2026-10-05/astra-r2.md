## Review: BLOCK

The original map repair works, but the new lexer introduces lost edges and still accepts valid string contents as imports.

### MUST 1 — Division after a template or object literal hides real imports

**Location:** `templates/typescript/template/scripts/code-map.mjs:479–482,553–584,603`

Both sources pass `node --check`:

```js
const q = `x` / 2; import("./a.mjs");
const q = {} / 2; import("./a.mjs");
```

Executed `parseRelativeImports` returns `[]` for each. The lexer mistakes division for a regex start and consumes through the slash in `"./a.mjs"`, hiding the import keyword.

This is a regression affecting ordinary expressions, not merely the documented regex-after-control-head ambiguity.

**Smallest fix:** mark a completed template literal as an expression-ending token. Distinguish object-expression closing braces from statement-block closing braces before deciding whether `/` starts a regex. Add regression tests for both examples.

### MUST 2 — Line comments swallow real imports after valid line terminators

**Location:** `templates/typescript/template/scripts/code-map.mjs:504–507`

Executed:

```js
parseRelativeImports('// comment\rimport("./a.mjs");')
parseRelativeImports('// comment\u2028import("./a.mjs");')
```

Both return `[]`. JavaScript ends these comments at the CR or U+2028; the lexer only stops at LF. Ordinary CRLF passed.

**Smallest fix:** terminate line comments on every ECMAScript line terminator. Apply the same terminator discipline to regex scanning. Pin CR, LF, CRLF, U+2028 and U+2029 separately.

### MUST 3 — Quoted-string recovery creates fake edges from valid strings

**Location:** `templates/typescript/template/scripts/code-map.mjs:516–527`

I wrote and syntax-checked two fixtures. Both passed `node --check`, but both produced `./fake.mjs` alongside the real edge:

- A double-quoted string continued with backslash + CRLF, containing `import('./fake.mjs')`.
- A double-quoted string containing raw U+2028 before that same text.

The escape scanner skips backslash and CR, then incorrectly treats the remaining LF as the string’s end. Separately, modern JavaScript permits raw U+2028/U+2029 inside quoted strings; the source comment incorrectly says otherwise.

**Smallest fix:** consume escaped CRLF as one continuation. Do not terminate quoted strings at raw U+2028/U+2029. Preserve raw CR/LF recovery for the seat’s misread-regex cases. Add positive and negative regression tests.

### MUST 4 — Requirement evidence still misses explicitly promised conditions

**Location:** `REQUIREMENTS.md:520–523`; `packages/nana-pack/tests/code-map.test.mjs:122–240`; `templates/typescript/template/tests/code-map.test.ts.jinja:261–387`

Two scratch mutations passed the repository code-map suite:

1. Restoring rejection of whitespace around member-access dots.
2. Applying `codeMask` only to `DYNAMIC_URL`, leaving the other three patterns ungated.

Thus:

- R-860’s whitespace behavior works today, but its evidence does not pin that explicit clause.
- R-863 promises gating for **all four patterns**, while its negative fixtures exercise only the URL pattern.
- R-863’s unconditional string exclusion is also contradicted by MUST 3 and the documented backtick desynchronization case.

**Smallest fix:** add whitespace fixtures and a four-pattern × lexical-region negative matrix in both suites. Make the requirement’s scope/status agree with any deliberately retained lexer limitations.

## Verified closures and checks

- Read the complete `git diff main..HEAD`, including both briefs and the first review.
- Independently recomputed graphs over the current 172-module source set:
  - Main generator: **144 edges**, zero problems.
  - Pre-lexer generator (`1dc1e69`): **245 edges**, zero problems.
  - HEAD generator: **245 edges**, zero problems.
  - Main → HEAD: **101 added, zero removed**, across **54 callers**.
  - Pre-lexer → HEAD: **zero added or removed**. No unexplained edge-set change.
- All six URL combinations resolve. Whitespace around member-access dots and parentheses also resolves.
- Replayed five targeted scratch mutations. Within the six-combination checks, failures were exactly **4 / 3 / 2 / 2 / 1**, matching the disabled forms.
- Ordinary division chains, regex quotes/slashes, nested template interpolations, strings containing `//`, CRLF comments, a shebang and the JSX-free generic-shaped expression preserved subsequent imports.
- Reproduced the documented backtick lost-edge case and HTML-comment false edge. The open question accurately acknowledges these limitations.
- The shared sentence now correctly describes a **global zero-callee count**, for both languages. The identical-copies check passed.
- R-861 and R-862 retain executable evidence: fresh scaffolds reported **1/5 TypeScript** and **4/5 Python**.
- Passed: repository code-map suite, requirements-trace suite, template-render suite and `npm run map:check`.
- I did not rerun the full repository suite or separately execute rendered language suites. All mutations stayed under `/private/tmp`; the worktree remains unchanged.

**VERDICT: BLOCK — 6/10**
