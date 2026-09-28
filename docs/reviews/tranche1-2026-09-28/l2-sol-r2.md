### R1 findings

1. **RULED — appetite overrun.** Retroactively accepted; checkpoint rule is process follow-up, not code.
2. **PARTIAL — policy-file bypass** (`README.md:188–205`). Bypass list is faithful and the gate ratchet claim is true. But “cross-session escalation” is too broad: `nana-pack.json` also controls post-edit commands, and non-gate blocks apply live (`README.md:109`), permitting same-session execution after a bypassed write.
3. **FIXED — floor gaps** (`gate-shell.ts:174–195,242–267`; corpus lines 126–145). All 23 r1 rows now block under matching allows.
4. **RULED — project `.claude/**`** (`README.md:188–191`). Ratified expansion is clearly declared.
5. **NOT FIXED — desk label.** Actual `apps/desk/public/app.js:2120` still says `allow (skip gate)`, not the seat-specified wording.
6. **PARTIAL — regex bounds** (`config.ts:467–526`). Count/subject limits exist, but load-time probing is unsound.

### New defects / probe results

- **HIGH — probe can itself hang and misses trivial alternate shapes.** Under temp HOME, `(?=a{27})(a+)+$` made config load take **872 ms** despite the 10 ms claim; raising the threshold toward 40 can hang. `(b+)+$` was retained and one 25-character test took **435 ms**. Thus per-call work remains unbounded.
- The process cache makes both timing false-drops (including GC pauses) and false negatives sticky until restart.
- Dropping an unsafe allow is conservative; dropping `extraPatterns` or `protectedPaths` silently removes requested protection. That should STOP/preserve last-good, not fail open with only `config_invalid`.
- Dropping inside the first 200 activates later entries: a 201-entry probe retained entry 201, contradicting “first 200.”
- README names polynomial misses only (`README.md:223–227`); the worker report correctly names outside-shape exponential misses, but published documentation does not.
- **MED — stdin floor is both over- and under-inclusive** (`gate-shell.ts:249–253`): temp-HOME probe BLOCKed benign `echo x | python3 --version`, while allowing destructive stdin code through `python3 -W ignore`.
- **MED — silent expansion:** `parallel` and `watch` disable all exceptions (`gate-shell.ts:45`) but are absent from the declared unsegmentable list.
- Temp-HOME full corpus passed, including every existing ALLOW row; worktree remained clean.

### CARRY for astra

- Correct or subtract the regex probe; ensure probing cannot block, deny-pattern rejection fails closed, cache behavior is recoverable, and cap ordering is honest.
- Fix both stdin-interpreter cases and add regression rows.
- Apply the required desk label.
- Narrow the policy mitigation to gate loosening, or make non-gate policy blocks session-baselined.
- Declare or remove `parallel`/`watch` expansion.

VERDICT: BLOCK
