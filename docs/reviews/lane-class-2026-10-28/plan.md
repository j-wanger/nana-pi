# lane-class · plan (seat, 2026-10-28; revised after one adversary pass)

Feature: FEAT-029 · Navigate code and investigate impact

The seat wrote this plan, and one adversary attacked it (`plan-attack.md` beside it: 1 MUST, 5 SHOULD, 5 NOTE). The seat took every finding; the revision notes at the end say where each one went. Plans get no review round.

## Purpose

This lane serves the owner's top idea "Flag lands that change what runs next". Code reads a change's file list and says how much review it needs, so the seat no longer decides.

On 2026-10-28 the owner said "go" to the seat's slate. The slate described this lane in these words: "A small script reads a lane's changed files and names the class and the file behind it."

It also serves the current priority's first clause, removing the ceremony the seat added. Today the seat and its adversary argue each lane's class by hand from prose (AGENTS.md:94). Code would make that call from the files.

What the owner gets:

- Every build ends with one line from code.
- That line says whether the work changes his hooks, install steps, gate or review tools, and names the file.
- Review depth then follows the files, not the seat's habit.

This lane does not, by itself, stop wrong-code pairs in ordinary lanes. The planner-prompt lane does that.

## Assumptions (any may be wrong)

- B1. AGENTS.md:94 defines the class. That definition can be written as three tests:
  - a sealed path list, matched by raw path prefix, so it also covers deleted files and files that are not modules;
  - the CLIs that a Claude Code hook or a pi extension launches as a process;
  - one import hop from the extensions, the hooks and those launched CLIs.

  The land and review tools also include every module that only those four tools import, tests aside. Such a module is part of the tool, and no list is needed to find it.
- B2. Applied by hand to the last 10 landed lanes, these tests agreed with the seat's call 9 times. That is agreement with the seat, not accuracy, because the seat is not the answer key. There are two known splits:
  - **review-texts-durable.** The rule says install, because uninstall reads `state-manifest.mjs`. The seat's adversary argued it down to ordinary, and the rule may be the right one.
  - **keep-movement.** The seat counted `review-ledger keep` as a review tool. Under AGENTS.md:94's four names, a change to `review-ledger.mjs` alone prints ordinary.

  The reviewer judges both splits on merit. AGENTS.md:94's four names govern unless the owner widens them.
- B3. A walk across every step is too wide, and one hop is not. Measured on 877b123d from B1's entry points, with the launched CLIs counted as entry points, a full walk reaches 41 of 135 non-class modules. One hop reaches 29.
- B4. The seat already reads pi-worker's build-end line, so a class line printed there gets used without a new step.

## Open choices

The builder decides each one and reports it, unless it is marked for the owner.

- C1. The script name and the output wording.
  - The seat's pick is `scripts/lane-class.mjs`.
  - It prints one line: the class, the first triggering file and why. Deeper hits get one "also reaches" line.
- C2. The extension folders come from the pi manifests, not from a list kept by hand. They are the root `package.json` `pi.extensions` (`packages/nana-pack/extensions`, `packages/nana-knowledge/extensions`) and `packages/nana-stage/package.json` (`./extensions`).
- C3. For the owner: should the class widen to everything that "runs as you after land", meaning symlinked rules, PATH launchers, prompts and package scripts?
  - This lane does not widen it.
  - The seat runs the wide list by hand over the same ten lanes and brings the owner the number of disagreements.
  - The planner-prompt lane's files are the live example.
- C4. pi-worker runs the pack's own copy of the class script from the main checkout, as the review-movement precedent does. That copy reads only the reviewed list.
  - A residual follows: a lane that adds a CLI to the list sees its own entry only after the land.

## Threat model

In scope is honest variation in our tools' output, files and environment:

- renamed, deleted or untracked files;
- non-module files under a class folder, such as `.sh` and `.json` files;
- Windows backslash or `./`-prefixed paths in `--files`;
- a planned file that does not exist yet;
- a branch with no merge base;
- a lane tree that predates the script, where pi-worker prints nothing;
- a hung git call.

A lane that adds a new launched CLI is a residual (C4). It already changes a hook, so it updates the list in the same change.

Deliberate forgery is out. A finding outside this model is a residual.

## Precedent

- `scripts/blast-radius.mjs:295-322`: the changed set, a merge-base diff plus untracked files. It is lifted into one exported function that both scripts import, per the 2026-10-22 second-caller ruling.
  - `scripts/blast-radius.mjs:105-140` (`blastModel`) keeps only mapped modules. The class check matches raw paths first and uses the map only for hops.
- `scripts/code-map.mjs:45, :54`: the `impact` re-export and `repoGraph`, for the import hop.
- `packages/nana-pack/lib/blast-radius-config.mjs`: a sealed config module with provenance. The sealed list follows its form.
- `packages/nana-pack/lib/review-movement.mjs:16-31` and `packages/nana-pack/lib/review-movement-config.mjs:18`: a pack lib that runs a `scripts/` CLI as a child process. It runs only when the tree carries the file at HEAD, under a sealed timeout. pi-worker's call follows it, timeout included.
- `packages/nana-pack/bin/pi-worker.mjs:339, :385`: `buildEndLine`, after which the class line prints.
- `packages/nana-setup/lib/hook-producer.mjs:30-47` and `packages/nana-setup/lib/settings.mjs:194-233`: the launch tables. They are read for the launched-CLI list and its provenance, and not edited. They name four launched CLIs today, `packages/nana-setup/bin/stale-copies.mjs` among them.
- `code-map.config.json:44`: the layers. Nothing in a package may import from `scripts/`, so pi-worker spawns the class script as a child process and never imports it, as review-movement does.
- `packages/nana-knowledge/extensions/nana-knowledge.ts:57`: an extension that launches a CLI with `execFile`. That is why launched CLIs are hop starts.
- `packages/nana-pack/extensions/nana-gate.ts:51-58`: the gate extension imports the gate libraries directly. The sealed list still names the five `packages/nana-pack/lib/gate-*.ts` files as gate policy.
- `packages/nana-pack/tests/build-records.test.mjs:312-313`: the R-2602 check on pi-worker's last stderr line.
- `AGENTS.md:94`: the class definition the list encodes.

## Outside precedent

- Nx "affected" walks changed files through the dependency graph. We borrow the idea and import no code.
- GitHub CODEOWNERS path rules: a pattern only.

## Must-meet

Rows R-2960 to R-2969 are free for this lane. Each check carries its `// req:` marker directly above it. One more test pins the sealed list and names its row.

1. A changed set prints `ordinary` when it touches nothing in B1's three tests and no tool-only module.
2. A change prints install, hook or gate, and names the first such file and why, when it touches any of these:
   - a file in a pi extension folder (C2) or the Claude Code hooks folder;
   - nana-setup's bin or lib;
   - the five gate policy files;
   - one of the four land and review tools.

   Matching is by raw path prefix. The check includes a deleted extension file and an edited `packages/nana-setup/lib/*.json` file, and both print install, hook or gate.
3. A change to a launched CLI prints install, hook or gate and names that CLI as launched. The launched CLIs are every CLI the two launch tables name: today the three producer bins, the knowledge-pull CLI and `stale-copies.mjs`.
4. A change to a module that an extension, a hook or a launched CLI imports directly prints install, hook or gate, and names that importer.
   - A change to `packages/nana-knowledge/lib/hook.ts` alone names `packages/nana-knowledge/bin/nana-knowledge.ts`.
   - A module imported only by the four land and review tools prints install, hook or gate and names the tool.
   - A module that is reached only through a deeper import, or that a tool shares with other code, prints `ordinary` plus one "also reaches" line.
5. `--files <list>` takes a planned file list and gives the same class as a diff holding those files. Backslash-separated and `./`-prefixed forms of a class path give the same class and the same named file as the posix form.
6. Errors:
   - A bad argument exits 2 and names the flags.
   - A base with no merge base exits 1, names the cause and prints no class.
7. pi-worker prints the class line after its build-end line only when the lane tree carries the class script at HEAD. Otherwise it prints nothing.
   - A failed class run prints one reason, and pi-worker keeps the build's own exit code.
   - A class run that passes a sealed time limit is stopped and prints one reason. pi-worker then exits with the build's own code.

Also in this change, with no new row:

- One sentence goes in nana-pi's AGENTS.md project section, after the shared marker region: "In nana-pi, the lane class is what lane-class prints; a wrong call is fixed in its list."
- `packages/nana-pack/README.md:314` says the final stderr line gives the build's outcome. It gains: in a tree carrying the class script, the class line follows that line.
- The shared template and R-1300 stay as they are.

## Expected changes to existing tests (forecast, not a limit)

- Lifting blast-radius's changed set may touch call sites in `blast-radius.test.mjs`. Their assertions stay.
- The R-2602 check stays green only because its fixture has no class script. Its title may need wording that says "last build-record line". The row text at `REQUIREMENTS.md:517` holds.
- The install check's pi-worker leg launches pi-worker in a fixture without the script. That leg is the live test of the script-absent path.
- The builder reports any other test that changes.

## Class and size

- Class: ordinary, by this lane's own rule run on its planned files. The planned files are:
  - a new script;
  - its config;
  - the lifted function;
  - a pi-worker call;
  - AGENTS.md;
  - the README;
  - tests.

  pi-worker is not a land or review tool, and no extension, hook or launched CLI imports these files. No nana-setup file changes, so no local install check is due.
- Size: small, so `pi-worker --lane-size small`.
- The claim most likely wrong: that a tool which sets review depth is not itself a gate. AGENTS.md:94 does not list such a tool, and the reviewer is asked to judge that.

## Revision notes (seat, after the attack)

- **MUST:** hops now also start at launched CLIs (B1, must-meet 4), and the `hook.ts` case was added.
- **SHOULD findings, all taken:**
  - **Hops at the tools:** a module only the tools import counts as part of the tool. No list is needed (B1, must-meet 4).
  - **Deleted and non-module files:** matching is by raw prefix (must-meet 2).
  - **Windows paths:** must-meet 5.
  - **Time limit:** must-meet 7.
  - **README:** the line goes under "Also in this change", and R-2602 goes in the forecast.
- **NOTE findings, all taken:**
  - **Count:** B3 now uses like-for-like counts.
  - **Gate files and extension folders:** both are named (C2, must-meet 2).
  - **Which copy runs:** C4.
  - **Splits:** the review-ledger split was added to B2.
  - **Install check:** its pi-worker leg went into the forecast.
- **Forward precedent search (after the attack):** it added the layer rule (pi-worker must spawn the script) and the fourth launched CLI. It matched 4 of the seat's 5 picks.
- **Brief parser:** outside precedent moved to its own heading. pi-worker refused the first version.
