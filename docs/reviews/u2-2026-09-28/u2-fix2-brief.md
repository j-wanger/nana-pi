# Worker brief — lane U2 fix round 2, after sol r2 BLOCK (7/10, three MUSTs)

Worktree `~/nana-pi-wt/u2`, branch `lane/u2-agent-dir` (HEAD `624cf8e`). Read
`docs/reviews/u2-2026-09-28/u2-sol-r2.md`. Your three round-1 MUSTs are confirmed **FIXED** with
executed probes, and the reviewer accepted your deleted-cwd STOP ruling explicitly. What remains is
one shape of defect, found twice, plus a documentation mismatch.

**This is the last review round on this item.** After it the seat lands with residuals or subtracts.

## The one defect, in two places: a RELATIVE `PI_CODING_AGENT_DIR` is resolved by the wrong process

pi resolves a relative value against each process's own cwd (`dist/config.js:421`, no `resolve`).
So "inherit the same environment" does not mean "same directory". The reviewer's probe:

```
desk:            /tmp/.../desk/rel
spawned-session: /tmp/.../project/rel
```

### MUST 1 (HIGH) — the desk and the sessions it spawns must agree
`apps/desk/server.mjs:1178`, `:1323-1331`, `:445-447`. The desk shows and edits the config under
its OWN relative resolution while every session it spawns reads a different one. That is the exact
failure U2 exists to remove, reintroduced one level up.

**Ruling: pin, and say so.** When the inherited `PI_CODING_AGENT_DIR` is relative, the desk pins
`PI_CODING_AGENT_DIR=<the desk's resolved ABSOLUTE active dir>` into the environment of every pi
process it spawns, so the desk and its sessions share one store. It must not be silent: the desk
tells the user, where they see the settings, that the value was relative and which absolute
directory sessions started here will use. Absolute and tilde values are untouched.

### MUST 2 (HIGH) — a normal `nana-setup` run must not install into a cwd-specific directory
`packages/nana-setup/lib/paths.mjs:18-25`, `lib/doctor.mjs:132-142`. With an ambient relative value
and no explicit flag, `install` seeds `<setup-cwd>/rel/nana-pack.json` and `doctor` calls it healthy,
while pi started anywhere else reads a different file.

**Ruling: refuse, with the remedy.** An AMBIENT relative `PI_CODING_AGENT_DIR` and no explicit
`--pi-home` / `--home` is a refusal: exit non-zero naming the resolved directory, saying it is
specific to the current working directory, and telling the user to pass `--pi-home <absolute dir>`
or set an absolute value. An EXPLICIT `--pi-home` (relative or not) is the user's decision and is
resolved as today. `doctor` does not refuse — it reports the same fact as a warning line, naming
the cwd it resolved against, so a stale file can never read as healthy.

### MUST 3 (MEDIUM) — the documented spellings must be exactly what the regex catches
`lib/gate-paths.ts:128-130` vs `README.md:349-353` and `AGENTS.md:152-156`. The regex also matches
malformed, unbalanced and mixed forms (`$PI_CODING_AGENT_DIR}`, `${PI_CODING_AGENT_DIR` without the
brace, `%PI_CODING_AGENT_DIR` unterminated, `$env:PI_CODING_AGENT_DIR%`) and is case-insensitive
while POSIX variable names are not.

**Ruling: tighten the regex to the four documented spellings, balanced only** — `$NAME`,
`${NAME}`, `%NAME%`, `$env:NAME`. Keep case-insensitivity (a Windows/pwsh spelling is legitimately
case-insensitive, and over-blocking a variable NAME is harmless) and say so in one clause in both
documents. Nothing that is blocked today for a real path may become allowed: add a test that each
of the four spellings still blocks, and that the malformed forms no longer need to.

## Also
- The reviewer's parity test gap is real: the test compared resolver, desk and setup all running
  from the SAME cwd, so it could not see the split. Fix the test to resolve from different cwds.

## NOT
- Do not add `settings.json` / `auth.json` in the active dir to the policy floor (separate item).
- Do not touch the handoff store, the round-cap ledger, or the desk's stage keys.
- No migration or auto-copy of an existing config. No new config keys, no new env vars beyond
  pinning the EXISTING one into spawned environments.
- Do not change the deleted-cwd STOP behaviour — the reviewer ruled it correct.

## Allowlist
`apps/desk/server.mjs`, `apps/desk/public/app.js`, `packages/nana-setup/lib/{paths.mjs,doctor.mjs}`,
`packages/nana-setup/bin/nana-setup.mjs`, `packages/nana-pack/lib/gate-paths.ts`,
`packages/nana-pack/README.md`, `AGENTS.md`, `packages/nana-setup/README.md`, and tests under
`packages/nana-pack/tests/**` and `packages/nana-setup/tests/**`.

## Appetite
`--max-budget-usd 12` · ≤ 10 files / ≤ 200 LOC excluding tests. On crossing it, write a CHECKPOINT
paragraph and continue only if the remainder is mechanical.

## doneWhen
`env -u NANA_HANDOFF npm test` exits 0, and new tests cover: a relative value where the desk and a
process spawned from a DIFFERENT cwd resolve the same absolute dir; an ambient relative value
refusing `nana-setup install` while `--pi-home` succeeds; `doctor` warning instead of reporting
healthy; and the four variable spellings blocking with the malformed forms no longer required to.

## Report (≤30 lines)
Commit · the reviewer's two probes re-run before and after · what the desk now tells the user and
where · `env -u NANA_HANDOFF npm test` · `git diff --stat` and the scope statement · residuals · the
one claim most likely wrong · `VERDICT: DONE`.
