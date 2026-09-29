## Round 2 confirmation

### Findings

#### HIGH — field identity is structural now, but the displayed path is lossy
**`packages/nana-knowledge/lib/query.ts:75-80` — executed**

The exact delimiter is successfully removed from fields:

```text
- real title - /forged - header — /actual — real - snippet
fields: 3
```

However, the same replacement mutates the locator:

```json
{
  "input": "/wiki/a — b.md",
  "line": "- t — /wiki/a - b.md",
  "display": "/wiki/a - b.md"
}
```

`/wiki/a - b.md` does not name `/wiki/a — b.md`. On a surface explicitly telling the agent to open relevant files, a pointer that cannot be opened directly defeats a core part of the feature. Long-path truncation is visibly marked; this substitution silently names a different possible file.

I would **not land** this behavior. Preserve an exact or reversibly escaped locator while preventing the delimiter from occurring structurally—for example, encode delimiter characters inside fields rather than substituting another valid filename character.

#### LOW — look-alike enumeration is not a complete defense
**`packages/nana-knowledge/lib/query.ts:66-67` — executed/source-read**

The en dash and minus sign survive:

```text
left – right — /actual — real - snippet
left − right — /actual — real - snippet
```

Both still split into exactly three fields on the actual grammar delimiter. Therefore the structural invariant is intact; an en dash does not literally become another field. But a model or reader may visually interpret ` – ` as a separator.

Chasing Unicode look-alikes is the wrong primary defense: the set is open-ended and context-dependent. The exact structural delimiter should define field identity, with field contents encoded reversibly where necessary. Look-alike normalization can remain a display nicety, but should not be presented as the security invariant.

## MUST confirmation

### MUST 1 — field identity: **PARTIAL**

**`packages/nana-knowledge/lib/query.ts:67-87`, `lib/hook.ts:104-106` — executed/source-read**

Fixed:

- `renderFields()` is shared by `search()` and `renderBlock()`.
- A delimiter-bearing title produces exactly three fields.
- The exact `FIELD_SEP` occurs only where `renderBlock()` inserts it.
- Em dash, horizontal bar, two-em dash, and three-em dash are normalized.

Not acceptable as landed: normalization silently corrupts displayed paths, so the field remains structurally a path but can cease to identify the file.

### MUST 2 — bounded N+1 rendering: **FIXED**

**`packages/nana-knowledge/lib/query.ts:75-87`, `lib/hook.ts:86-113` — executed**

Re-running the long-field probe:

```json
{"size":700,"chars":1932,"lines":4,"fields":[3,3,3]}
{"size":4096,"chars":1932,"lines":4,"fields":[3,3,3]}
```

All three fields are capped before block accounting. One hostile field can no longer empty the block or consume an unbounded amount.

Budget and arithmetic probe:

```json
{
  "caps":[90,337,160],
  "lineLengths":[595,595,595],
  "threeChars":1932,
  "threeIDs":["0","1","2"],
  "fourChars":1932,
  "fourIDs":["0","1","2"],
  "budget":2000
}
```

Each maximum line is:

```text
2 prefix + 90 title + 3 separator + 337 display
+ 3 separator + 160 snippet = 595
```

The 144-character header plus three newlines and three 595-character lines totals exactly 1932. A fourth line would exceed 2000; attempting it does not remove or reorder the third.

With five capped hits, the retained order is `0,1,2`. With a hostile 4 KB first hit:

```json
{"chars":1932,"pointers":3,"ids":["H","1","2"],"lengths":[595,595,595]}
```

The first hit occupies one ordinary capped slot and therefore displaces only the same trailing hits any at-cap first hit would. It causes no additional displacement or reordering.

## Tests and historical count

**Executed:**

```text
env -u NANA_HANDOFF npm test
83 files: 82 PASS, 0 FAIL, 1 SKIP, 0 WARN
checks: 5158 pass, 0 fail, 6 skip
```

`render.test.mjs` itself reports 60 passing checks.

The reported “38 FAIL / 19 PASS on main” is not the real unchanged-test result:

- The current test copied unchanged to `main` runs **zero checks** because `TITLE_MAX`, `DISPLAY_MAX`, and `FIELD_SEP` are not exported there, causing module-instantiation failure.
- Supplying only their intended values as a compatibility shim gives **36 FAIL / 21 PASS**. The claimed extra two failures came from comparing against undefined constants.
- The original round-one test on main remains the previously observed **5 FAIL, then crash** on the throwing getter.

## Scope

**`0eae18e..3438a3d` — source-read**

Exactly four files changed:

```text
packages/nana-knowledge/README.md
packages/nana-knowledge/lib/hook.ts
packages/nana-knowledge/lib/query.ts
packages/nana-knowledge/tests/render.test.mjs
```

`git diff --check` passes. No `nana-pack`, ranking, schema, build, tokenizer, `sources.json`, budget constant, deduplication, logging, header, app, or `display.mjs` change occurred. The README now declares the sibling renderer dependency.

SCORE: 7/10  
MUST: Field identity PARTIAL because structural spoofing is fixed by silently corrupting some path locators; bounded N+1 rendering FIXED.  
CARRY: Replace lossy path substitution with reversible field encoding; treat exact grammar—not an enumerable Unicode look-alike list—as the structural invariant; retain neutral-package and CLI-test follow-ups.  
VERDICT: BLOCK
