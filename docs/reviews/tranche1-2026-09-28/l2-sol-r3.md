### R2 closure
1. **RULED** — appetite overrun remains a process ruling, not code.
2. **FIXED / RULED** — policy claim narrowed; same-session `postEdit.commands` risk is explicit (`README.md:201–205`).
3. **FIXED** — all floor-gap rows remain covered (`gate-shell.ts:169–180,248–260`).
4. **RULED** — project `.claude/**` expansion remains declared (`README.md:187–190`).
5. **FIXED** — desk label applied in this worktree (`apps/desk/public/app.js:2120`).
6. **RULED** — temporal regex safety was subtracted; count/subject caps remain and owner-regex hangs are explicit (`README.md:225–232`).
7. **FIXED** — hanging probe and sticky cache removed completely; no probe/cache symbols remain in `config.ts`.
8. **FIXED** — unusable deny entries now select last-good or STOP (`config.ts:250,414,440–442`; tests `gate-corpus.test.mjs:164–181`).
9. **FIXED** — cap is the literal first 200 entries (`config.ts:148–151`; regression at test lines 146–150).
10. **FIXED** — documentation now covers catastrophic and polynomial regexes generally (`README.md:229–232`).
11. **FIXED** — `python3 -W ignore` BLOCK and `python3 --version` ALLOW (`gate-corpus.test.mjs:131,139`).
12. **FIXED** — `parallel` and `watch` are declared unsegmentable (`README.md:212–214`).
13. **RULED correct** — valid catastrophic patterns cannot be detected without probing; retaining/enforcing them is pinned at test line 157.

### New / residual
- **MED — compatibility lockout:** yes, a fresh process with >200 deny patterns previously used its first 200; it now STOPs. Last-good avoids this only after an earlier valid load.
- **MED — trusted-project DoS:** confirmed under temp HOME: a trusted project with 201 `extraPatterns` produces project STOP and blocks every gated tool. Untrusted projects remain ignored. This is availability loss, not privilege escalation, but repair must occur outside gated tools.
- **MED — effective cap leak:** live tightening unions policies without re-capping (`nana-gate.ts:77–83,241–244`), so one session can accumulate over 200 deny patterns; `README.md:232` overstates the bound.
- Temp-HOME `gate-corpus.test.mjs`: **all PASS**, including every benign ALLOW row and both new stdin rows. Worktree remains clean; full suite remains seat-verified at 2984 checks.

### CARRY for astra
- **CRITICAL cost:** shell-computed policy write → same-session post-edit execution; require sandbox or session-baseline post-edit.
- **HIGH availability cost:** owner-supplied pathological regex can hang the gate; use isolation/safer engine, not another in-process probe.
- **MED availability cost:** document/migrate >200-pattern configs and provide a safe recovery path for trusted-project STOP.
- **MED performance cost:** bound the accumulated session ratchet or narrow the published count-cap claim.
- **LOW correctness cost:** replace the hand-maintained interpreter option-arity table to reduce future stdin false positives/negatives.

VERDICT: LAND
