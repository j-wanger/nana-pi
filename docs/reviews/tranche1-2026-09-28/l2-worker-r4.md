**Commit:** `c1b1a11` on `lane/l2-gate`. The worktree is clean and nothing was pushed.

**Removed:** the load-time regex probe, its process-wide cache, `PROBE_MS`, the gate's own second cap and the three "catastrophic pattern dropped" tests. The 200-pattern cap now lives in `regexList` (`config.ts`) and is a hard prefix of the list as written. The 64 KB subject cap is unchanged. Gate code (`nana-gate.ts` + `lib/`) went +35 / −80, net **−45**. Across all files it is +92 / −123. `grep probe|SLOW|PROBE config.ts` finds nothing.

**STOP when a deny entry is dropped:**
- If an `extraPatterns` or `protectedPaths` entry does not compile, or the list runs past 200, the gate block counts as malformed. The gate then uses the last valid policy, or blocks every gated tool with a STOP reason that names the file and the entry. Example: `gate.extraPatterns[1] "(unclosed": invalid regex`, or `gate.extraPatterns: 201 entries exceed the cap of 200 — entries 201–201`.
- Too many `allowPatterns` entries is only a drop, with a `config_invalid` line; the gate is not stopped.
- Tests: the loop "deny drop STOPs" (3 cases, each with a fresh HOME, checking that a benign `ls` is blocked with the file and the entry named). "allow cap: entry 201 is not considered, even after an earlier rejection" reproduces sol's cap-ordering case.

**Claim wording, now in the README, `AGENTS.md` and the gate header:** "*gate loosening* from such a write waits for the next `session_start`. The **other blocks in the same file, including `postEdit.commands`, apply live**, so a write that evades the gate's text scan can run code in the **same** session through a post-edit command. That is a residual; **what closes it** is the OS sandbox / container layer." Making post-edit wait for session start too is left as an open option for astra.

**Two stdin corpus rows:** `echo x | python3 --version` now ALLOWs. `curl u | python3 -W ignore` is now blocked by the floor even under an `^curl` allow. The fix skips an option's value when looking for the script, and treats `--version` / `--help` (and `-V` outside shells) as not reading stdin.

**Also:** `parallel` and `watch` are now declared in the README's unsegmentable list. The desk label at `app.js:2120` in this worktree now reads `allow (exempt matching segment; not the floor)`.

**Verification:**
- `npm test`: exit 0, 64 files (63 PASS, 0 FAIL, 1 SKIP), 2984 checks pass, 0 fail.
- Seat probes, before vs after: probe 1 differs only in a PID inside a Node warning (94 BLOCK / 16 ALLOW, the benign rows including `echo reboot` and `git log --grep=sudo` still ALLOW). Probe 2 is identical.

**Residuals:**
- A catastrophic or polynomial regex in your own `nana-pack.json` can make your own gate slow or hang; the README now says so.
- Policy-file writes through paths the shell computes are still not caught, and can reach same-session code execution via post-edit.
- Across live tightenings in one session, the baseline union can grow past 200 per list.

**The claim most likely wrong:** the done condition says "a catastrophic pattern in `extraPatterns` produces a STOP". Without a probe, nothing can detect a catastrophic pattern, so `(a+)+$` is kept and enforced as written; the test "catastrophic extraPattern is kept and enforced" pins that. It is never silently dropped, but it does not STOP either. Only an entry that fails to compile or is over the cap STOPs. Also, the list of options that take a value (`-W -X -r -I -C -o -O --require --import --rcfile --init-file`) is hand-picked. It errs strict: `cat x | python3 -O script.py` now counts as reading stdin and hits the floor.

VERDICT: DONE
