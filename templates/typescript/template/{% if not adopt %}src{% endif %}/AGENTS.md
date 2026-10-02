# src/ — package code

- One folder per feature; everything a feature needs (logic, types, helpers)
  colocated inside it. Shared utilities earn a folder only after a second
  consumer exists.
- A feature's public surface is its own entry module; import features by path,
  don't build barrel chains.
- File cap 300 lines, cognitive complexity 15 — split before suppressing.
- NodeNext resolution: relative imports need the `.js` extension.
- **Contract header, every module.** Open each file with a JSDoc block carrying the
  six tags in order: `@module @purpose @inputs @outputs @effects @errors`.
  `@effects` is one of `none | disk | database | network | process` (optional
  parenthetical). `docs/code-map.md` is generated from these — `pnpm map:check`
  fails on a missing or malformed one, and on a stale map.
- **One purpose per module; split before the header needs two sentences.** A
  `@purpose` with a second sentence in it is the module telling you it is two
  modules.
- Before changing a mapped module, read its blast radius:
  `pnpm map:impact -- src/<file>.ts`.

