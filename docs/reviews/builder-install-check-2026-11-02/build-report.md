VERDICT: DONE

Commit: `b256d5865a68e818ef3c10485d8e9003d0306731`  
Branch: `feat/builder-install-check`; clean worktree; not pushed.

- **Rows:** R-3713–R-3715 implemented with tagged evidence; R-1071 seal evidence amended.
- **Files:** install-check config, worker config, pi-worker, two setup test files, requirements, generated map/tree, and lane records.
- **Shared definition:** frozen `builderChildEnv(entry, cwd)`; pi-worker imports it as `workerEnv` for both runtimes, preserving values.
- **Overrides:** existing nine names plus `NANA_WORKTREE_ROOT`.
- **Kept:** Claude auto-memory suppression, Bash timeouts, git resets/count/numbered slots, askpass variables, terminal-prompt and GCM controls.
- **M2:** Windows exercised the non-exempt branch. Sanitized writes passed; restoring the boundary produced `write-error`.
- **Existing-test edits:** both override seals gained the boundary; length changed from nine to ten. Worker tests stayed unedited.
- **Wrong-code runs:** baseline M1–M3 failed, exit 1; fixed code passed, exit 0. An unclassified shared-definition addition failed M3, exit 1; restoration passed.
- **Departure/export:** Revision 2 moves private `workerEnv` into worker-config as exported `builderChildEnv`. No additional authorization export or copied helper.

**Checks rerun sequentially on this tip: all exit 0**
- Six named test files: install-check, new builder-env, worker-lane, worker-claude, credential-strip, test-runner.
- Map, README, requirements trace/tree, known-bugs, identity scan, and lane-class checks.

```text
install: packages/nana-setup/lib/install-check-config.mjs — nana-setup library
```

Evidence: `docs/reviews/builder-install-check-2026-11-02/`, including `env-audit.md`, `wrong-code.txt`, and `build-1-green.txt`.

Not done: full install-check, macOS install check, model sessions, push, or CI inspection. AGENTS assigns the full suite to CI. No listed known bug changed.

Writing check ran; mandated technical identifiers and verdict format remain.
