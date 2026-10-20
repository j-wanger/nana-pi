# gate-rm-bare-repo — must-meet

Feature: FEAT-010 · Guard risky commands and protected resources
Class: install, hook or gate. The lane changes the gate policy: the plain in-directory rm exemption in `packages/nana-pack/lib/gate-rm-inside.ts`, which `extensions/nana-gate.ts` uses to clear the "rm recursive/forced" danger. nana-gate.ts itself does not change.
Threat model: honest variation is in scope. That covers bare repositories that `git init --bare` and `git clone --bare` make, worktrees that `git worktree add` makes inside them, a working folder at any depth inside one, and macOS, Linux and Windows. Deliberate forgery is out: a disguised repository, or a stray `.git` entry planted to restore the exemption.

Falsifiable sentence: a plain `rm -rf` asks, as main did before gate-rm-workdir, when its target is a bare repository or lies inside one, or when the working folder is at any depth inside one. A worktree that git added inside a bare repository's folder keeps the exemption.

## Design
- Shape test `isBareShape(dir)`, lstat only, never following a link. `HEAD` is a regular file, and `objects` and `refs` are folders. This mirrors git's is_git_directory. Declare the names once as contract consts beside PLAIN_RM, with `// contract: R-2240, R-2241` provenance. One function serves both sites below.
- `lstatOrNull(p)` returns null on ENOENT/ENOTDIR and rethrows any other error. The module's outer catch turns that error into false (ask), which keeps the @errors contract.
- New step 3b walks up from `cwdReal` to the filesystem root, as git's discovery does. At each level it tests for a `.git` entry first, of any type, and finding one ends the walk. Only then does it test the bare shape, and a match returns false. Each level costs at most four lstats, usually two.
- Step 5 already lstats each existing part from the cwd down to the target. After its link check, add one line: an existing folder part with the bare shape returns false. This covers the target itself and every folder on the way to it.
- Update the module header (@inputs, @effects) and the rmInsideCwd doc comment. Update the test file header: git on PATH, and @effects process (spawns git).
- Pack README, exemption paragraph: add the bare-repository guard to the "still asks" list. Drop the two known limits it closes: a bare repository as the cwd, and a target that is itself a bare repository. Add the limits below.

## Must-meet tests
All four live in `packages/nana-pack/tests/gate-rm-inside.test.mjs` and run through the real registered tool_call handler. "Asks" means BLOCK headless and exactly one dialog per case when interactive. "Unasked" means ALLOW headless and interactive, with zero dialogs.

| Row | Requirement | Test (file::title) and cases | Red today |
|---|---|---|---|
| R-2240 | IF a target of such an rm, or an existing folder on the way to it below the session working directory, holds a `HEAD` file and `objects` and `refs` folders, THEN the gate shall keep today's verdict, a prompt when interactive and a block when headless. | `…::rm of a bare repository or of a path inside one still asks`. Cwd `work`, holding `vault` and `repos/mirror.git` from `git init --bare`: `rm -rf vault`, `vault/objects`, `vault/refs/heads`, `repos/mirror.git/objects` | Red. A probe on main 6f0098a8's module saw all four ALLOW headless with 0 dialogs. |
| R-2241 | IF the session working directory, or a folder above it, holds a `HEAD` file and `objects` and `refs` folders, and no folder from the working directory up to and including that folder holds a `.git` entry, THEN the gate shall keep today's verdict, a prompt when interactive and a block when headless, for an rm of the exempt form. | `…::rm in a bare repository's folder or a folder inside it still asks`. In the `git clone --bare` root `proj.git`: `rm -rf objects`, `rm -rf refs`. In `refs`: `rm -rf heads`. In `refs/heads`: `rm -rf topic`, after `git branch topic`. In `worktrees`: `rm -rf wt` | Red. The probe saw all five ALLOW headless with 0 dialogs. |
| R-2242 | WHEN a folder holding a `.git` entry is the session working directory or lies above it, at or below the nearest folder holding a `HEAD` file and `objects` and `refs` folders, as in a worktree that `git worktree add` made inside a bare repository, the gate shall still let a plain rm of a folder inside the working directory run with no approval prompt and no headless block. | `…::rm in a worktree that git added inside a bare repository's folder still runs unasked`. Cwd `proj.git/wt`: `rm -rf build`. Cwd `proj.git/wt/src`: `rm -rf gen`. Cwd `both`, a `git init` folder whose top also holds a `HEAD` file and `objects` and `refs` folders: `rm -rf build` | Guard pin, green today. W13 and W17 turn it red (probed); the plan reports W3 and W4 red too. |
| R-2243 | WHEN a target or the session working directory holds only part of a bare repository's shape (a `HEAD` file with `objects` and `refs` folders), such as a `HEAD` file alone, the two folders without `HEAD`, `HEAD` with only one of them, or a `HEAD` folder with both, the gate shall still let a plain rm of a folder inside the working directory run with no approval prompt and no headless block. | `…::rm of or in a folder holding only part of a bare repository's shape still runs unasked`. Five look-alikes, each also holding an empty `x/`: onlyhead, objrefs, headobj, headrefs, headdir. Each one is the target (`rm -rf <name>` from `look`) and the cwd (`rm -rf x`) | Guard pin, green today. W16 turns it red (probed). The plan reports W5, W9, W10, W11 and W12a red. |

Adversary amendments, each from a probe: four wrong versions passed every plan check, and each now fails an amended case.
- W13 tests the shape before `.git`; the `both` case catches it.
- W14 caps the walk at two levels; `refs/heads` catches it.
- W15 tests the shape on the first part only; `repos/mirror.git/objects` catches it.
- W16 walks testing HEAD alone; the look-alikes used as the cwd catch it.

With the prototype fix, all 11 checks passed. gate-corpus, gate-survives-mutation, gate-status and config-gate-fallback each had 0 FAIL. The existing R-1490 check stays the guard against a walk that asks everywhere.

Platforms: every row runs on macOS, Linux and Windows, with no skip and no req-candidate marker. Other pack tests already spawn git unskipped on all three CI legs. That Git for Windows makes the same lstat shape is inferred. The Windows CI leg confirms it before land.

## Known limits (residuals)
- A bare repository below a target (`rm -rf mirrors` holding `mirrors/app.git`) still runs unasked, as a non-bare repository nested below a target does. The owner's nested-repo trade stays as it is.
- A legacy symlinked `HEAD`, or `objects`/`refs` that are links, are not recognised. W12 accepts links, survives, and asks more.
- A plain folder inside a bare repository that is not a worktree over-asks. So does a path from outside through a bare repository into its worktree.
- Any `.git` entry ends the walk, whether valid or not; git also stops there. The walk ignores ceiling folders, filesystem boundaries and the GIT_DIR/GIT_OBJECT_DIRECTORY settings. It always runs to the root, which can only over-ask.
- Mount points and inner links keep their existing residuals.
- HANDOFF: this closes the bare-repository line. The nested-repo line stays open.