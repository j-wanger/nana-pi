# Review brief — desk pi-session adoption, sol RE-CHECK after your BLOCK (and a new safety-surface touch)

Your first review is at /private/tmp/claude-501/-Users-jwang-nana-agent-loop/bench-work/review-sol-deskpi.md (BLOCK: resolution not tied to PI_BIN; SHOULDs: unstable v1 ids, header id, null entries, README wording, tests). Re-check ONLY the folds and one new item. Read-only; no server on 7317.

## Folds (verify)
1. Resolution (apps/desk/pi-session.mjs, now also owns resolvePiBin): DESK_PI_ROOT exclusive and spawns nothing (warns if the binary lives in a different package); else walk-up from realpath(PI_BIN); else shim path: `PI_BIN --version`, enumerate npm root -g / npm_config_prefix / volta which + image / node prefix / bun / ~/.local / ~/.npm-global / %APPDATA%\npm / Homebrew / /usr/local / /usr, accept exactly one root whose package.json version equals; zero, two indistinguishable, or a mute binary → REFUSE listing candidates and naming DESK_PI_ROOT. PI_MIN_VERSION 0.84.4 is now a hard floor. Startup logs which path won.
2. v1 ids deterministic via stabilizeMigratedIds (position-derived `v1-…`, parentId/firstKeptEntryId/targetId/fromId remapped) instead of an LRU — stable across reads AND restarts.
3. isEntry filter at all three read sites; readSessionMeta requires string header.id; the bounded name scan is documented not widened.
4. READMEs reworded; "≥ 0.84.4 required" now true.
5. NEW SAFETY-SURFACE TOUCH: DESK_PORT=0 support — the listen callback records BOUND_PORT and the Host/Origin rules read it (previously a port-0 desk 403'd everything incl. itself). host-rule.test.mjs gained 5 port-0 cases via raw sockets (own bound port allowed; rebound Host, loopback name on wrong port, and the configured port 0 all 403).

## Read
- Diff (server.mjs + host-rule test): /private/tmp/claude-501/-Users-jwang-nana-agent-loop/bench-work/diff-desk-pi2.patch
- New module copy: /private/tmp/claude-501/-Users-jwang-nana-agent-loop/bench-work/new-pi-session2.mjs
- Post-change: ~/nana-pi/apps/desk/server.mjs, apps/desk/pi-session.mjs, apps/desk/test/pi-resolution.test.mjs, pi-session-parity.test.mjs, host-rule.test.mjs, apps/desk/README.md, ~/nana-pi/README.md

## Dimensions
A. Resolution soundness: any way the imported package still differs from the spawned binary; version-equality as the tie key (two roots same version but different builds?); refusal messages actionable; the `pi --version` subprocess only on the shim path; DESK_PI_ROOT disagreement warning vs refusal — right call?
B. Host/Origin rule with BOUND_PORT: is there ANY request that can reach a route before BOUND_PORT is set (listen callback ordering vs first connection)? Does hostRejection fall back safely (deny) if BOUND_PORT is unset? Do app listeners (apps.mjs) use their own bound port consistently? Any regression for the fixed-port path (7317)? Gate-survives-after evidence adequate?
C. Deterministic v1 ids: collision risk with real pi ids (prefix `v1-`), remap completeness (any other id-bearing field in pi's session-format.md?), interaction with the desk's rename append on a v1 file (parentId chained to a synthetic id that pi will re-mint on its own migration → does pi then resolve the leaf correctly, or does the rename orphan?).
D. Tests: failure-first plausibility; the 10 stub-pi tests now pass DESK_PI_ROOT — does that hide a real-machine resolution failure from CI? pi-resolution synthesizes shims with 9.9.x versions — sound isolation from the real pi?
E. Anything else introduced by the fold.

## Output
Per dimension: PASS or FINDING (BLOCK/SHOULD/NIT, file:line, minimal fix). End with exactly one line: `VERDICT: LAND` or `VERDICT: BLOCK`.
