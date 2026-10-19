# win-impact-paths — `--impact` finds a mapped module on Windows (2026-10-18)

**The feature.** `node scripts/code-map.mjs --impact <path>` names a module's callers, callees and measured tests. On
Windows it reports every module as unmapped: both JavaScript generators build the repo-relative path with
`relative(root, resolve(a))`, which returns backslashes there, and `posix.normalize` keeps them, so the lookup in the map
(forward-slash keys) and the runtime map's exact-string match both miss. CI's Windows leg shows it in runtime-map:
R-1272, R-1274 and R-1278 fail. The fix converts the relative path to forward slashes in both places:
- `scripts/code-map.mjs` `resolveImpactPaths` (this repo's generator, which adds the runtime block);
- `templates/typescript/template/scripts/code-map.mjs` `main`'s `--impact` branch (ships through CI's release tag).

**Lane class: ordinary** — two generators' path handling, one check, one row, one test's detail output; no install,
hook or gate code. Threat model: honest variation in Windows paths in scope; deliberate forgery out. The W7 cut's
adversary pass covered this lane (the seat's scratch, `w7-attack.md`); its amended plan is this one.

## Must-meet (one row)

- **IP2 (R-1361).** WHEN `--impact` names a mapped module by a path written with the platform's own folder separator,
  the TypeScript code-map generator shall report that module as mapped, under its forward-slash path. Pinned by one
  check in `packages/nana-pack/tests/code-map.test.mjs`, inside the existing scratch-copy block before the mutation: run
  the copied template generator with `--impact` and `path.join("packages", "nana-pack", "lib", "agent-dir.mjs")`; pass
  when the first output line is exactly `packages/nana-pack/lib/agent-dir.mjs` (no `[NOT A MAPPED MODULE]`). On macOS
  the native separator is `/`, so the check guards there; on Windows it fails on the unfixed generator. The seat proves
  that red on the Windows leg: the builder commits the check before the fix, and the seat runs CI on that commit alone.

## Evidence (no row)

- **IP1.** Windows CI: runtime-map gives 7 pass and 1 SKIP (R-1277's existing skip), and R-1278's check prints a detail
  (the measure run's status and output, the impact run's output) so the measure half can be seen if it fails. The
  macOS counts of code-map and runtime-map rise only by IP2's check.

## Known limits

The Python generator's `--impact` on Windows is unchecked (it converts through `as_posix()`, but its `resolve()` under
an 8.3 root is untested). An argument that names no mapped module and no existing file is printed as typed.
