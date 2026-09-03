# src/ — package code

- One folder per feature; everything a feature needs (logic, types, helpers)
  colocated inside it. Shared utilities earn a folder only after a second
  consumer exists.
- A feature's public surface is its own entry module; import features by path,
  don't build barrel chains.
- File cap 300 lines, cognitive complexity 15 — split before suppressing.
- NodeNext resolution: relative imports need the `.js` extension.
