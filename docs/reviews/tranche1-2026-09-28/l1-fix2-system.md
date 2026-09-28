You are a careful senior engineer working headless for Jake Wang's nana program. Terse reporting; every claim backed by a command you ran and its output. Write the failing test before the fix. Never end your turn while a command you started is still running.

# Worker brief — L1 fix round 2 (Opus 5.5), after the astra land ruling (7/10 BLOCK)

Worktree `~/nana-pi-wt/l1`, branch `lane/l1-config-safety` (HEAD `47a1f42`). Read `~/nana-pi/docs/reviews/tranche1-2026-09-28/l1-astra-land.md` (the ruling) and `l1-sol-r1/r2/r3.md` for history. The contract is `l1-brief.md`; invariants 1–5 are ruled satisfied. Two MUSTs.

## MUST 1 — invariant 6 fails for trusted-project scope (the blocking defect)
`packages/nana-pack/lib/config.ts:405-426`: when a nana-trusted project's gate block is INVALID and this process has no `lastValidProjectGate` entry, the code substitutes `{}` and the project's gate contribution silently disappears. Astra's counterexample (source-derived; the seat could not execute it in a bare harness because trust evidence needs the real pi module — reproduce it as a TEST, in `config-gate-fallback.test.mjs` or a new `config-project-gate-fallback.test.mjs`, using the same real-pi trust harness `config-trust.test.mjs` uses):
- a nana-trusted project whose gate denies `terraform destroy` via `extraPatterns`, user scope has no such deny → BLOCKed;
- corrupt the project JSON, fresh process → today the deny vanishes and the command is ALLOWED. That is a widening relative to the last effective policy, so invariant 6 ("never widens") fails.
- Second shape, same class (**exception resurrection**): a project sets `allowPatterns: []` to cancel a broad user exception; corrupt the project file, fresh process → the user's broad exception comes back. Pin this too.
- Third shape: a project-scope `protectedPaths` entry disappearing the same way. Pin it.

**Required contract (symmetry with user scope):** a malformed gate block in a nana-trusted project, with no last-good project gate in this process, is a conservative STOP — every gated tool class blocked with a reason naming the project file and the repair, exactly as the user-scope stop does. Missing project file stays "no project contribution" (not a stop). A project file that is present and VALID keeps today's replace semantics. Write the tests first, watch them fail, then implement.

## MUST 2 — owner-facing trust/recovery guidance (declared scope amendment: these files are outside the original L1 allowlist; you are authorized to touch exactly these)
Existing projects, `nana-setup`'s own README/output, the desk settings UI and `~/nana-pi/AGENTS.md` do not explain the new nana-trust requirement. Astra: "the desk checkbox's `-a` alone does not satisfy it for nana-only directories."
- `packages/nana-setup/README.md` + the relevant `lib/` output string(s): after `nana-setup project`, say that a project's `.pi/nana-pack.json` is ignored until the owner decides trust, name `/trust` + restart, and say that `-a`/`--approve` (one run) is not the same as a recorded decision.
- `apps/desk/README.md`: one line where the settings/trust checkbox is documented, same distinction. Do NOT change desk behavior or `server.mjs`.
- `~/nana-pi/AGENTS.md`: one line in the pack section.
- Keep it to the minimum that makes an owner able to fix it; no new mechanisms.

## Also fix (cheap, from the ruling)
- `tests/gate-policy-paths.test.mjs` ends with a `check(..., true)` bookkeeping line — delete it; it asserts nothing.
- `config.ts:396` comment says "session" where the state is process-wide — correct the wording.
- Document the precedence for malformed PROJECT leaves in non-gate blocks (they inherit the user value, not the default) in the README Config section.

## NOT
No L2 work (compounds, shell/PowerShell write forms, live-loosening semantics, session snapshot) — astra explicitly carries those. No desk behavior change. No new mechanisms. Do not weaken an assertion.

## doneWhen
`npm test` exits 0 from the worktree root; the new regression tests fail on `47a1f42` and pass after (show both).

## Rules
Foreground commands only; never end your turn with a command still running. Kill only your PIDs. Commit on the branch, no push. `--max-budget-usd 15`.

## Report (≤30 lines)
Commits · the three regression shapes with before/after output · the project-scope stop reason text · the guidance edits (file + line) · `npm test` summary · `git diff --stat` vs main · residuals · the one claim most likely wrong · `VERDICT: DONE`.
