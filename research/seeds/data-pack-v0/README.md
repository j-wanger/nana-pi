# Data pack v0 (seed)

This is a prototype of a generic, parametric data-standards check pack. It ran once against one real data project, read-only. It is the seed for the v1 lane, not a shipped package.

- `checks.py`: eight generic checks. Each takes a manifest and returns findings `{check, severity, location, detail}`:
  - (a) identifier types are consistent across tables;
  - (b) declared keys hold in the data;
  - (c) one name normalizer per kind;
  - (d) connectors and database opens go through the declared modules;
  - (e) persisted ids are stable (no builtin `hash`);
  - (f) every report carries provenance;
  - (g) no near-duplicate helpers;
  - (h) a budget for row-wise operations.
- `run.py <manifest>`: runs every check and prints the findings.

The project-specific manifest lives in the project, not here. On its first project, v0 found a real crosswalk merge (two players sharing one external id) that the project's 953 tests missed. It also found five false-positive patterns, which were fixed in place.
