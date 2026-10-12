## MUST

1. **The declaration still overstates PATH lookup as “the same pi the terminal runs.”**  
   **File:** `docs/reviews/pi-cmd-launch-2026-10-11/CHANGE.md:29-32,55,104-106`  
   **Evidence:** `cmd.exe` searches the working directory before PATH. PowerShell can select `pi.ps1`, an alias, or a function before `pi.cmd`. The proposed resolver intentionally ignores the working directory and `.ps1`. Therefore, its result is not universally the command either terminal runs.  
   **Smallest fix:** Define the outcome as the first supported external `pi.com`, `pi.exe`, `pi.bat`, or `pi.cmd` on PATH. Keep the working-directory exclusion and PowerShell difference as explicit limits.

2. **The refusal rule unnecessarily rejects safe direct `.exe` and `.com` launches.**  
   **File:** `docs/reviews/pi-cmd-launch-2026-10-11/CHANGE.md:36-37,56-57,77-82`  
   **Evidence:** `%`, `!`, quotes, and trailing backslashes are cmd.exe concerns. A located `.exe` or `.com` receives an argument array directly and does not pass through cmd.exe. R-1035 applies the refusal to every Windows pi, including Volta or Scoop executables.  
   **Impact:** A valid direct pi installation can fail solely because its path or package folder contains a refused character.  
   **Smallest fix:** Apply R-1035 only when launching `.cmd` or `.bat`. Preserve normal argument-array behavior for `.exe` and `.com`, relying on spawn errors for invalid values.

3. **The post-edit predicate does not parse the first command as cmd.exe does.**  
   **File:** `docs/reviews/pi-cmd-launch-2026-10-11/CHANGE.md:61,83-86,134-136`  
   **Evidence:** cmd.exe expands variables and recognizes command modifiers and caret escapes before execution. Commands such as `%ComSpec% /c exit 1`, `@node -e "process.exit(1)"`, and caret-escaped words can run successfully but appear unresolved to the proposed literal lookup. They would be mislabeled “could not run.” A relative command such as `.\check` can resolve as `.\check.cmd`, but the separator branch checks only the path itself.  
   **Smallest fix:** Make the classifier conservative. Classify only a simple literal first word as missing. Return `checks_failed` when the word uses `%`, `!`, `^`, `@`, or unsupported quoting. Apply PATHEXT expansion to relative and absolute words containing separators. Add each example as a pure test.

4. **Two Windows-only tests cannot prove the claimed contracts.**  
   **File:** `docs/reviews/pi-cmd-launch-2026-10-11/CHANGE.md:142-147`  
   **Evidence:** Placing `pi.cmd` in a folder containing a space tests command-path quoting, but the actual package root used by `stepPiRegister` need not contain a space. It therefore does not test argument quoting through the shim’s `%*`. Also, iterating over the configured internal-command list cannot detect a command omitted from that same list. Only `echo` has an independent mutation test.  
   **Smallest fix:** Run the real shim with an injected package root containing a space and assert the exact arguments observed after `%*` forwarding. Pin the complete internal-command vocabulary in an independent test fixture, including an internal command that exits 1 during an ordinary failure.

## SHOULD

1. **R-952 does not state the version parsing contract precisely.**  
   **File:** `docs/reviews/pi-cmd-launch-2026-10-11/CHANGE.md:59,97-99,140-141`  
   **Evidence:** The design requires the first stdout line to begin with a dotted version, but the row only says “the version line printed.” It does not define first-line selection, malformed output, or stderr handling.  
   **Smallest fix:** State that status must be zero and the first stdout line must start with a dotted version. Add a valid stdout-plus-stderr case to settle mixed output.

2. **The internal-command contract depends on an unspecified chosen list.**  
   **File:** `docs/reviews/pi-cmd-launch-2026-10-11/CHANGE.md:61,87-90`  
   **Evidence:** R-1038 says no cmd.exe internal command, which implies a complete set. The design instead describes a chosen list without naming or sealing it. Completeness is therefore neither reviewable nor traceable.  
   **Smallest fix:** Put the complete sourced list in the declaration or narrow the requirement to a named supported set. Give every name independent test evidence.

3. **The Windows integration should include one accepted metacharacter case.**  
   **File:** `docs/reviews/pi-cmd-launch-2026-10-11/CHANGE.md:128-145`  
   **Evidence:** npm and pnpm shims forward `%*`, causing another cmd.exe parse. Pure expected-array tests cannot prove that quoted `&`, `|`, parentheses, or caret characters survive that forwarding.  
   **Smallest fix:** Pass one accepted argument containing representative cmd metacharacters through the real shim and assert its exact Node-visible value.

## NOTE

- The npm-root defect is closed: the design now selects supported external PATH entries and covers pnpm, Volta, and Scoop shapes.
- The found-but-broken defect is closed for installation by R-1036 and the planned exit-code assertions.
- Locale-dependent output matching is removed. The remaining issue is false classification from incomplete cmd.exe parsing.
- Cross-leg proof is substantially improved through injectable pure helpers.
- The `process.execPath` equivalence concern is obsolete because the selected shim or executable now runs directly.
- The manifest-containment concern is obsolete because version 2 no longer reads package manifests.
- The earlier atomicity concern is partly closed by separating discovery, invocation, failure, and remediation. R-952 still needs a sharper observable contract.
- The invocation shape matches cross-spawn’s outer `/d /s /c` construction, with `/v:off` added. Cross-spawn’s escaping code does more than simply quote each argument, so the real `%*` test remains necessary.

**Score: 6/10.** Version 2 fixes the main architecture, but its direct-executable refusal, cmd parsing, and Windows proof need correction before implementation.

VERDICT: SEND-BACK
