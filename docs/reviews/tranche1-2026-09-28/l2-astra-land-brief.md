# Astra land ruling — lane L2: gate self-protection, segment-scoped exceptions, floor, corpus (permission surface)

You are the land ruler for permission-surface lanes. Read-only. Decide whether this merges to nana-pi main and what it changes upstream. Installed pi 0.87.1. L1 landed first (`6a8c5c7`); L3 lands after.

Read in order: `l2-brief.md` (contract, invariants a–g) → `l2-worker-r1.md` → `l2-sol-r1.md` (3 HIGH) → `l2-fix-brief.md` (seat rulings A–D) → `l2-worker-r2.md` → `l2-fix2-brief.md` → `l2-worker-r3.md` → `l2-sol-r2.md` (BLOCK) → `l2-fix3-brief.md` (seat rulings E–G) → `l2-worker-r4.md` → `l2-sol-r3.md` (LAND, 4 residuals) → clean diff `l2-r4.patch` → the code (`extensions/nana-gate.ts`, `lib/gate-shell.ts`, `lib/gate-paths.ts`, the three gate tests, README Gate/Config bullets) → arch contract `~/nana-pi/research/raw/2026-09-27-advances/opus-arch-tranche1.md` §L2.

**Review history: sol ran its full three rounds (r1 BLOCK, r2 BLOCK, r3 LAND).** The cap is spent; your ruling is the independent check, not a fourth round. Four seat rulings to judge explicitly, each overriding or redirecting a reviewer finding:
- **A — the shell-text arms race is NOT patched.** sol proved policy-file writes are reachable by `cd`+relative, escapes, globs, variables, same-command symlinks. Ruled: text inspection cannot win this; the claim was narrowed and sol's bypass list is published verbatim as a named residual with the sandbox named as the closer.
- **C — project-scope `.claude/**` protection KEPT** over sol's "revert as unapproved expansion", because those files carry hooks that execute code. Declared in the README.
- **E — the regex defense was SUBTRACTED entirely** after three failed designs (per-call `vm` watchdog → blocked benign 4 MB commands; load-time probe → the probe itself hung at 872 ms). Now: count cap 200, subject cap 64 KB, and a README statement that an owner's own pathological regex can hang their own gate.
- **F/G — a dropped DENY entry now STOPs (never fails open), and the published mitigation was narrowed** after sol showed `postEdit.commands` apply live, so a bypassed policy write can execute code in the SAME session.

Seat-verified: `npm test` 64 files / 2984 checks / exit 0; both probe scripts 94 BLOCK / 16 ALLOW with every dangerous row blocked and `echo reboot`, `git log --grep=sudo`, `ruff format c:\x` allowed; gate code net −45 LOC in the last round; `node:vm` absent.

Rule on:
A. **Contract satisfied?** Invariants (a)–(g) each with the test that pins it; any invariant only asserted.
B. **Blast-radius row "1 + 2" of the synthesis** — is it NOW met by L1+L2 together (compounds, shell/PowerShell mutation, non-bypassable floor, session-bound loosening, gate-survives-after mutation)? Astra r1 on L1 warned not to claim it from L1 alone; say plainly what is and is not covered now.
C. **Harm if merged.** sol's three MEDs: (1) a config with >200 deny patterns previously used its first 200 and now STOPs — migration lockout; (2) a trusted project with 201 patterns STOPs every gated tool, and repair must happen outside pi's own tools — availability trap; (3) live tightening unions policies without re-capping, so a session can exceed the published 200 bound. The seat's position: keep the STOP absolute (allowing repair-while-stopped would be the escalation path: break config → stop → write permissive config → restart), and document recovery as "edit the file with any editor outside pi, or delete it — missing means defaults". **Rule on that position**, and on whether (3) needs a code fix or a narrowed claim.
D. **Upstream contracts declared** — README Gate + Config bullets, `AGENTS.md`, gate header, desk label and desk README. Anything a consumer reads that still says "read live" or "skip gate"? Is the published residual list honest and complete against sol's executed findings?
E. **Seat conduct** — were any reviewer findings adopted without verification, any assertion weakened, any ruling exceeding Jake's 09-28 ruling #8 (loosening at session start, tightening live)? Note that the worker corrected an impossible done-condition in the seat's own brief; judge that exchange.
F. **Coupling to L3** (landing next, `l3-brief.md`): L2 must ALLOW edits under `~/.pi/agent/handoffs/**`; L3 adds one `config.ts` leaf. Any conflict?

End with `SCORE: n/10`, MUST (empty if none), CARRY with each residual priced by cost of error, the upstream-contract declaration, and `VERDICT: LAND` or `VERDICT: BLOCK`. ≤70 lines.
