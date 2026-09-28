## Findings

### HIGH

1. **Untrusted repo content becomes governing system-prompt instructions without owner trust.** `[adversarial]`  
   `packages/nana-pack/lib/objective.ts:187-193,214` accepts any walked-up `OBJECTIVE.md`, marks it `source = "project"`, and labels it `governing`; `extensions/nana-objective.ts:73` inserts it into the system prompt. A file without an `**Objective` line gets its first 4000 characters injected as written (`lib/objective.ts:160-162`), making arbitrary prompt injection straightforward. See provenance ruling below.

### MEDIUM

2. **Oversized objectives can erase a required current-priority line.** `[adversarial]`  
   `packages/nana-pack/lib/objective.ts:164,222-225` caps the concatenated objective and priority, so a long objective consumes the cap before the priority. Executed against both runtimes:
   - Long product objective: product current priority absent.
   - Long program objective: `program current priority` absent.
   
   The oversized corpus only checks “truncation announced” and length (`tests/objective-golden.test.mjs:238-245`), despite the core outcome requiring both lines. Also, the alleged hard 12,000-character cap appends its marker *after* slicing 12,000 (`lib/objective.ts:235-236`), so output exceeds the cap.

3. **The golden test hides real byte divergence.** `[adversarial]`  
   The contract says normalize only the tag line, but `tests/objective-golden.test.mjs:91-92` also removes the hook’s terminal newline. A strict scratch mutation that removed only that extra normalization made all five selected cases fail byte identity: umbrella, product, symlink refusal, CRLF, and fresh-machine product; 25 identity checks failed overall. Root cause: CLI/hook adds a trailing LF (`bin/nana-objective.mjs:15`, hook lines 12-13), while pi does not (`extensions/nana-objective.ts:73`).
   
   An uncovered divergence also exists for NUL-containing input: the 300 MiB sparse-file probe preserved NULs in pi but Bash command substitution removed them (`nana-objective.sh:12`). Both remained bounded and non-hanging, but outputs differed materially.

### LOW

4. **Invalid UTF-8 is silently replacement-decoded, not reported malformed.** `[adversarial]`  
   `packages/nana-pack/lib/objective.ts:127-130` uses non-fatal `Buffer.toString("utf-8")`. The executed probe injected U+FFFD-containing text rather than a named unavailable marker.

5. **Doctor falsely calls the installed default a rename.** `[compat]`  
   The standard seed explicitly contains `"projectFile": "OBJECTIVE.md"` (`packages/nana-setup/pi/nana-pack.seed.json:4`), while `packages/nana-setup/lib/doctor.mjs:94-95` reports any truthy value as “per-repo file renamed.” Fresh install probe:
   ```text
   ✓ pi objective.projectFile  OBJECTIVE.md (per-repo file renamed)
   ```
   Install, doctor, and the symlinked hook otherwise exited 0.

## Executed review evidence

- **R2 regression fix verified:** current golden corpus passed 141 checks. Replaying its tests against r1’s `objective.ts` exited 8 and failed the fresh-machine product assertions.
- **Vacuous checks independently mutation-tested:**
  - `(n)` duplicate program block mutant → exit 2; `(n)` failed.
  - `(p)` silent refusal mutant → exit 1; refusal assertion failed.
  - `(q)` silent missing-program mutant → exit 1; unavailable assertion failed.
- **R2 guards:** no regular-file, 256 KiB read, symlink, 12,000-output mechanism, or catch was removed. FIFO, directory, 300 MiB file, symlink cwd, deleted cwd, CRLF, invalid UTF-8, and 10,000 objective lines all completed within a 3-second bound; hook exited 0 and pi never threw. Deleted process cwd produced shell diagnostics on stderr but did not hang.
- **Stale `PWD`:** `env PWD=/elsewhere bash hook` was corrected by Bash to the actual cwd; the product objective was found. The worker’s doubt is refuted on the tested runtime.
- **Compatibility:** installed symlink resolves and runs. `objective.path`, absent/null/false/custom `projectFile`, and the default user seed were exercised successfully. Precedence is documented in `packages/nana-pack/README.md:377-389`.
- **Existing products:** `~/aml-desk` and `~/game-world` previously showed product objective/priority plus only the umbrella objective. They now show product lines, both labelled program lines, and the precedence sentence.
- **Umbrella wording:** `~/nana-agent-loop/OBJECTIVE.md:11` matches implementation and Jake’s hierarchy.
- **Scope:** 10 total files, +734/−251 after r2. `loadUserObjective()` is necessary for launcher parity; README/header/HANDOFF corrections are justified. Doctor was also justified, but its wording remains wrong as found above.
- **Suite:** `env -u NANA_HANDOFF npm test` → 69 files, 68 pass, 1 skip, 3323 checks. Raw execution under this reviewer’s intentional `NANA_HANDOFF=off` failed two unrelated writer tests.

## Provenance ruling for Jake

A provenance label is useful defense-in-depth, but **not sufficient** as a security boundary. The same system prompt cannot safely say both “untrusted data, never instructions” and “governing”; models can still follow attacker text.

Actual incremental exposure:

- Claude Code already had unconditional walk-up before this lane.
- Installed pi users commonly already had the global `projectFile` opt-in from the seed.
- **Fresh/no-config pi sessions are newly exposed.**
- An attacker cannot directly execute or gain permissions, but can steer permitted reads, edits, commands, scripts, or disclosure before the user supplies intent. Nana’s tool gate still limits downstream actions.

**Ruling recommendation: require nana-trust before repo text is injected or called governing.** Until trusted, the umbrella should govern and the session may receive only a bounded untrusted pointer/provenance notice. Filesystem ownership after cloning is not provenance. If Jake accepts label-only risk, it should be recorded explicitly as risk acceptance, not represented as closing prompt injection.

## Residuals

- `packages/nana-pack/lib/config.ts:488-490` still describes `projectFile` as an owner opt-in, contrary to the restored default.
- Windows was not exercised.
- A Claude environment without `node` on `PATH` degrades to the producer-failed marker while pi continues normally.

**VERDICT: BLOCK**
