# readme-install: the install check runs the README's macOS checklist (2026-10-19, main ab5c3e8)

**Feature.** FEAT-015 · Diagnose the active environment. On macOS, the install check runs the root README's fresh-machine checklist as written, in a new home inside its temporary home. It fails unless every step exits 0 and the last step prints `all good`. A README install step that drifts then turns the blocking macOS install-check job red. R-1546 extends FEAT-013 SUB-011, next to R-950, R-951 and R-1111.

**Class: ordinary.** The lane changes the install check, its spawn adapter, its sealed config and the README. It changes no install, uninstall or doctor code, no hook or extension, no gate policy and no land or review tool. Earlier lanes that changed install-check output were classed small or ordinary. It touches `packages/nana-setup/`, so the seat runs `install-check.mjs` locally before `nana-land`. The seat also confirms that the pull request's macOS install-check job prints `PASS readme checklist`.

**Threat model.** In scope: honest drift in README wording and commands; runner images (path_helper order, a second Node, the Node version); a caller's `ZDOTDIR`; shallow, detached and linked-worktree checkouts. Out of scope: forged README text or a planted repository.

## Gap
- install-check runs its own coded sequence. It never runs README text, never calls `nana-setup` through the PATH link, never runs `trust` and never runs doctor from the clone.
- The static tests pin only anchors and versions (R-950, R-951, R-1093, R-1111). A wrong PATH file, a mistyped path or a doctor step that passes only from another folder all stay green.
- Step 8 says "from `~/nana-pi`" only in prose. Run as written, doctor runs from the home, skips the trust check and prints `all good` (probe). The `cd` must become a command.

## Design
- New `packages/nana-setup/lib/readme-rehearsal.mjs` with named exports `parseChecklist`, `rehearsalPlan` and `runReadmeRehearsal({ root, home, env, spawn })`, which returns `{ item, code, passed, detail }`. It carries the six-tag header and does not import `install-check.mjs`.
- Grammar: a step's commands are the backticked spans that directly follow `Run ` or `then `. Its expected text is the span that directly follows `expect `. Steps 1 and 7 have no commands and do not run.
- One rule: append `--yes` to a command that starts with `nana-setup trust `, because no terminal is there to answer y. Every other command runs as written, step 2's global pi install included.
- Run: each step with commands is one `/bin/zsh -l -c "<a> && <b>"` call, with the rehearsal home as cwd and stdin closed. The rehearsal stops at the first failing step.
- Env: `buildEnvironment(env, rehearsalHome)` minus `ZDOTDIR`. `npm_config_prefix` is `<rehearsal home>/.npm-global`, and its `bin` folder goes before the caller's PATH. It stands in for step 1's writable global prefix, so step 2 installs pi there and `npm root -g` (which `trust` reads) holds the same pi that `pi` runs. Then `GIT_CONFIG_COUNT=1`, `GIT_CONFIG_KEY_0=url.<checkout>.insteadOf`, `GIT_CONFIG_VALUE_0=<https form of package.json "repository">` and `GIT_ALLOW_PROTOCOL=file`. The caller's PATH is otherwise unchanged, because step 5 must add `~/.local/bin` itself.
- Home: `<install-check home>/readme-home`. Darwin only, as the last item. Cleanup and retain-on-failure follow the existing home.
- Output: `createSpawnAdapter` honours `options.maxOutput`, default 10,001, so hooks keep that cap. Step 8's output is 7.5 to 7.9 KB today; the rehearsal passes its own sealed cap.
- Sealed `README_REHEARSAL` in `install-check-config.mjs`, each value with provenance: item, readme, heading, platforms, home folder, npm prefix folder, shell and arguments, lead words, dropped variables, answer rule, step timeout, output cap.
- README step 8 becomes: Run `cd ~/nana-pi`, then `nana-setup trust ~/nana-pi` (it asks before it records), then `nana-setup doctor`; expect `all good`. An HTML comment above the list, with no backticks, names the Run, then and expect grammar.

## Must-meet tests
| Row | Row text (EARS) | Test file::title | Today |
|---|---|---|---|
| R-1540 | WHERE the platform is darwin, the install check shall print one `readme checklist` result line from rehearsing the root README's macOS fresh-machine checklist in a new `readme-home` folder inside its temporary home. | install-check.test.mjs::readme gate: darwin prints one readme checklist line from /bin/zsh runs in a second home; linux and win32 run no /bin/zsh and print none | RED: no such item; macOS CI run 39271352573 printed 13 result lines, none for the README |
| R-1541 | WHEN the rehearsal reads a checklist step, it shall take as commands exactly the backticked spans that directly follow `Run ` or `then `, and as the expected text the span that directly follows `expect `. | readme-rehearsal.test.mjs::parse: Run and then spans are commands, other spans are not, and the expect span is kept | RED: module absent |
| R-1542 | The rehearsal shall run each step that has commands as one `/bin/zsh -l -c` call joining them with ` && `, from the rehearsal home, with that home's base environment minus `ZDOTDIR`, plus only an npm global prefix inside that home whose bin folder precedes the caller's PATH, a git redirect of the package.json repository URL to the checkout, and file-only git transport. | readme-rehearsal.test.mjs::run: each command step is one login zsh call from the rehearsal home with no ZDOTDIR, a home npm prefix ahead of the caller's PATH and only the clone redirect added | RED: module absent |
| R-1543 | The rehearsal shall change a step command only by appending the sealed answer to a command that starts with a sealed prompting command. | readme-rehearsal.test.mjs::plan: nana-setup trust gets --yes and every other command, the global npm install included, runs as written | RED: module absent |
| R-1544 | The rehearsal shall keep each step's stdout up to its sealed output cap, beyond the 10,001-character hook cap. | readme-rehearsal.test.mjs::output: a 20,000-character step output keeps its last line through the spawn adapter | RED: the adapter always slices at 10,001 |
| R-1545 | The rehearsal shall stop at the first failing step and report `readme checklist` as PASS only when some step has both commands and expected text and every step with commands exits 0 within its sealed timeout with its expected text in its stdout, otherwise as FAIL naming the failing step's number and command or the missing expectation. | readme-rehearsal.test.mjs::verdict: all steps ok passes; a nonzero exit, a timeout, missing expected text or no expected text anywhere fails naming the step, and later steps do not run | RED: module absent |
| R-1546 | The fresh-machine checklist's last step shall run `cd ~/nana-pi`, then the trust command, then `nana-setup doctor` as rehearsal commands, and expect `all good`. | fresh-machine.test.mjs::last step runs cd ~/nana-pi, trust and doctor as commands and expects all good | RED: today's step 8 parses to [trust, doctor] with no cd |

R-1547 to R-1549 stay unused. One allowed pin test covers the sealed `README_REHEARSAL` values, tagged R-1542 to R-1545. Every test uses a stub spawn or a fake child and runs on all three platforms with no skip.

## Probes (macOS, temporary HOME, shallow detached clone of main ab5c3e8)
- Today's README parses to step 2 [npm i -g…, pi --version], 3 [git clone], 4 [cd, install], 5 [echo], 6 [pi install], 8 [trust, doctor] expecting `all good`.
- With step 8 reworded and a home npm prefix, every step exits 0 in `zsh -l`, also nested in a real install-check home. The whole rehearsal takes about 10 s locally; step 2's real pi install is 6.5 s.
- With step 8 as written today, the rehearsal also passes: doctor from the home prints `all good`. R-1546 is what makes doctor run from the clone.
- A step 5 typo (`.local/bins`) makes step 8 exit 1: a machine's own `nana-setup` runs and doctor prints ✗ rows. On CI the command is missing.
- `nana-setup trust` with an npm whose `npm root -g` lacks pi crashes with a stack trace and exits 1.
- On the macos-26-arm64 runner, Node 24 is brew-linked into `/opt/homebrew/bin`, and Homebrew's installer writes `/etc/paths.d/homebrew`. path_helper in a login zsh puts that folder ahead of setup-node's toolcache (reproduced with a runner-like PATH). Without the home npm prefix, step 8's trust would read Homebrew's npm root, which lacks pi, and fail on the first CI run (inferred).
- `readme:check` reports 0 problems and the four fresh-machine tests stay green with the reworded step 8 and the HTML comment.

## Known limits
- Steps 1 and 7 are human steps. The runner's tools stand in for step 1, and a hosted runner is not a clean macOS account.
- Step 2 now runs for real: one network pi install per run, into the home npm prefix.
- The clone is the checkout's committed HEAD, while the README text comes from the working tree.
- `--yes` answers the trust prompt, so the prompt itself goes untested.
- A login zsh reads `~/.zprofile`, not `~/.zshrc`. Each step starts at the home, so a step must name its folder. A clone URL with a `.git` suffix is a false red.
- The rehearsal runs every Run and then span with only HOME, temp, npm and git redirected. A future machine-wide command (brew, sudo, `--desk`) would act on the machine; the HTML comment warns editors.
- Residual for HANDOFF: `nana-setup trust` crashes with a stack trace when `npm root -g` lacks the pi on PATH. The home prefix keeps the rehearsal off that case.
- macOS only. The README has no Windows or Linux checklist, and the Windows install-check job is unchanged.