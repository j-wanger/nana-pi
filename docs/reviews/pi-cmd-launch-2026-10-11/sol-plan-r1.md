## MUST

1. **The proposed locator does not cover every Windows installation shape.**  
   **File:** `docs/reviews/pi-cmd-launch-2026-10-11/CHANGE.md:23-25,36,42-48`  
   **Evidence:** `npm root -g` locates packages owned by the active npm installation only. It works for npm’s default or custom prefix and usually for the active nvm-windows version. It does not locate pnpm-global, Volta-managed, or Scoop installations. It can also select a different pi than the first `pi.cmd` on `PATH`. `packages/nana-setup/lib/npm-root.mjs:11-16` makes no connection between npm’s root and the active pi shim.  
   **Impact:** Install can still leave the pi seat unregistered while pi works normally from the terminal. Doctor may report the version of a different installation.  
   **Smallest fix:** Either:
   - explicitly limit support to npm-global pi and fail clearly for other managers; or
   - resolve the first pi command on `PATH`, tie that command to its package, then add npm, pnpm, and Volta-specific fallbacks. Treat a Scoop `.exe` as an executable rather than assuming a JavaScript package.

2. **Resolver failure still has no fail-closed installation contract.**  
   **File:** `docs/reviews/pi-cmd-launch-2026-10-11/CHANGE.md:22-30,36-38`  
   **Evidence:** Current registration returns `SKIPPED` when probing pi fails at `packages/nana-setup/lib/steps.mjs:984-985`. A skipped row does not fail installation. The declaration specifies successful resolution but not missing package metadata, malformed `bin`, mismatched managers, npm failure, or an inaccessible entry point.  
   **Impact:** The original silent-success bug survives for every unsupported installation shape.  
   **Smallest fix:** Add a requirement that unresolved pi registration is `PROBLEM`, exits nonzero, names every attempted source, and gives the install hint. Add tests for absent npm, failed `npm root -g`, missing package, malformed manifest, absent `bin.pi`, and an unreadable entry.

3. **The English cmd.exe-message rule is locale-dependent and spoofable.**  
   **File:** `docs/reviews/pi-cmd-launch-2026-10-11/CHANGE.md:45-50,59-61`  
   **Evidence:** cmd.exe localizes “is not recognized as an internal or external command.” A legitimate checker can also print that English phrase and exit 1. Current classification receives only an error code at `packages/nana-pack/extensions/nana-post-edit.ts:146-156`; output is collected separately by `run()` at lines 165-244.  
   **Impact:** Missing commands remain ordinary failed checks on non-English Windows systems. Some real checker failures can be mislabeled as launch errors.  
   **Smallest fix:** Do not classify from human-readable cmd output. Capture a locale-independent missing-command signal, such as a controlled wrapper preserving error level 9009, then classify that structured result. Test an ordinary exit 1 and localized arbitrary output as `checks_failed`.

4. **The proposed tests do not prove the requirements on both suite legs.**  
   **File:** `docs/reviews/pi-cmd-launch-2026-10-11/CHANGE.md:47-50,58-61`  
   **Evidence:** The registration mutation is forced-win32 and can run on macOS, but the post-edit mutation is declared to fail only on Windows. The existing registration fixture is POSIX-only at `packages/nana-setup/tests/pi-registration.test.mjs:163-180`. The doctor test creates shell executables and forces Darwin at `packages/nana-setup/tests/doctor-runtime.test.mjs:20-61`.  
   **Impact:** macOS cannot catch removal of the Windows classification rule. Windows may lose much of the existing doctor evidence when the Darwin cases are merely gated away.  
   **Smallest fix:** Extract injectable pure launch and classification helpers. Run their Windows cases on macOS and Windows. Keep one real cmd.exe integration case on Windows. Replace the POSIX pi fixture with a fake JavaScript entry that both platforms execute through Node.

## SHOULD

1. **Running the package entry with the current Node process is not fully equivalent to running the selected pi shim.**  
   **File:** `docs/reviews/pi-cmd-launch-2026-10-11/CHANGE.md:23-27,36`  
   **Evidence:** The installed package declares `bin.pi` as `dist/bundle/cli.js`. Direct execution preserves ordinary inherited environment and arguments. However, npm and manager shims may select another Node runtime, especially Volta. They can therefore enforce a different runtime or package selection than `process.execPath`.  
   **Impact:** Arguments, `PI_CODING_AGENT_DIR`, and normal numeric exit codes can be equivalent, but runtime selection and signal/error behavior are not guaranteed equivalent.  
   **Smallest fix:** Define the contract honestly: nana-setup runs the resolved pi package with `process.execPath`. Test complete environment inheritance, the install-only `PI_CODING_AGENT_DIR` override, working directory, arguments, nonzero exit status, and spawn failure. Rename doctor’s result from “executable version” unless the package is tied to the active PATH command.

2. **The requirement rows are grammatically single-shall but not behaviorally atomic.**  
   **File:** `docs/reviews/pi-cmd-launch-2026-10-11/CHANGE.md:34-38`  
   **Evidence:** R-1033 combines discovery, invocation, runtime choice, and shim prohibition. Revised R-952 combines version reporting, Windows routing, and shared repair text. One marker can turn either row green without proving every clause. R-323, R-392, and R-105 each express one testable result.  
   **Smallest fix:** Split discovery/failure from invocation, and split doctor probing from shared remediation text. Give each row its own mutation-backed test.

3. **The resolver needs containment and manifest-shape checks.**  
   **File:** `docs/reviews/pi-cmd-launch-2026-10-11/CHANGE.md:42-48`  
   **Evidence:** The declaration says to trust `package.json`’s `bin.pi`. It does not require a string, containment inside the package root, a regular file, or a readable entry.  
   **Impact:** A corrupt or hostile global package manifest could make setup execute an unintended path.  
   **Smallest fix:** Require `bin.pi` to be a relative string resolving inside the package root and to name a readable regular file. Add traversal and wrong-shape fixtures.

4. **The version probe must reject stderr-only and mixed-output ambiguity consistently.**  
   **File:** `packages/nana-setup/lib/doctor.mjs:308-315`  
   **Evidence:** Existing doctor accepts only the first stdout line matching a dotted version. The new shared launcher could accidentally change output or failure handling.  
   **Smallest fix:** Keep this parsing contract and add Windows-helper cases for nonzero exit, empty output, malformed output, stderr-only output, and spawn failure.

## NOTE

- `npm root -g` is adequate for npm’s default prefix, a custom npm prefix, and the active nvm-windows installation when that npm installed pi.
- It is not a universal package-manager locator. pnpm uses its own global root, Volta uses its tool inventory and shims, and Scoop need not expose an npm package tree.
- Direct Node execution safely preserves paths containing spaces because arguments remain an array.
- Passing `{...process.env, PI_CODING_AGENT_DIR: layout.piHome}` preserves the current environment while deliberately overriding the active agent directory.
- Normal pi numeric exit codes should propagate through direct Node execution. Signal termination and manager-selected runtime behavior are not shim-equivalent.
- R-323 and R-392 should retain their existing coverage tests while gaining a cross-platform invocation fixture.
- R-105’s wording is sufficient only if “missing executable” is detected without localized prose.

**Score: 4/10.** The plan identifies the right failures, but its locator, failure behavior, locale handling, and cross-platform proof are incomplete.

VERDICT: SEND-BACK
