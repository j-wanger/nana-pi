# builder-credential-strip — plan (revision 2)

Feature: FEAT-006 · Launch builders with execution limits

Lane class (`node scripts/lane-class.mjs --root . --files packages/nana-pack/bin/pi-worker.mjs,packages/nana-pack/bin/claude-review.mjs,packages/nana-pack/bin/review-ledger.mjs,packages/nana-pack/extensions/nana-gate.ts,packages/nana-pack/prompts/builder-preamble.md,packages/nana-pack/rules/nana-rulings.md,templates/_shared/working-under-nana-pi.md,AGENTS.md`): `gate: packages/nana-pack/bin/claude-review.mjs — review tool`. This is a gate lane. It takes the full ladder: the seat's wrong-code pairs, the land reviewer, one independent check and the macOS install check. Per the seat, **the land also waits for the owner at 07:00**, even if every reviewer says LAND, because this lane reverses part of the 2026-11-01 ruling.

Revision 2 takes every MUST and SHOULD in `plan-attack.md` (a pi adversary on gpt-6-astra, read-only: 5 MUST, 3 SHOULD). Each was shown with a fixture probe on this laptop's git (2.56.0.windows.2).

## Purpose

The decision, from `consult.md` (relayed by the seat on 2026-11-02; astra consulted under the owner's overnight rule):

> Take (c): the environment strip in pi-worker and claude-review children as the control, the text gate rule as the early readable refusal, OS credential stores and env overrides documented as residuals.

The seat also asked for this:

> update the builder-preamble line that builder-credentials adds ("Push with plain git push...") to "Do not push; the seat pushes after verifying; report the tip", and the shared working-pattern/ruling text that says builders push.

The incident: a builder briefed to "open a draft PR" on a machine without `gh` wrote `execFileSync('git', ['credential', 'fill'])` into a temp `.mjs` file and ran it with `node`. It then used the owner's GitHub token to open PR #321 through the REST API. The shell saw only `node <file>`, so a text gate alone cannot stop this form. The control has to be the child's environment.

What the control does, stated exactly (attack SHOULD 8): **it stops git's normal credential dispatch in builder and reviewer children.** That covers helpers, askpass programs and prompts. It does not stop a child from reaching a credential store by other means; those are residuals.

**This reverses part of the 2026-11-01 ruling**: "Builders push and do not wait; the seat waits for CI." After this lane, builders do not push. The seat pushes after verifying, then waits for CI.

## Assumptions

- A1 (corrected, attack MUST 1 and 2). git takes command-scope config from two environment forms: `GIT_CONFIG_PARAMETERS`, and `GIT_CONFIG_COUNT` with `GIT_CONFIG_KEY_<n>` and `GIT_CONFIG_VALUE_<n>`. An empty `credential.helper` resets the helper list. The probe showed:
  - A reset placed only in the counted form left a helper inherited through `GIT_CONFIG_PARAMETERS` working (exit 0, `password=true`).
  - Askpass is separate. `GIT_ASKPASS`, `core.askPass` and `SSH_ASKPASS` still supplied a password with prompts off.

  So the strip must reset the helper in **both** forms, preserving every unrelated entry, and must neutralise all three askpass routes. The builder confirms the exact form against git on Windows and in CI.
- A2. Unrelated inherited config entries in either form are kept, so the effective settings for everything except credentials and askpass are unchanged.
- A3 (corrected, attack MUST 3 and 4). These are the model-child launch points:
  - `runWatchdog`'s spawn (`pi-watchdog.mjs:190`), used by pi-worker (`childEnv` at 92, 166, 216, 226) and pi-review (244);
  - the **Claude flag-settings environment**: Claude Code builders (`pi-worker.mjs:166-172`) and claude-review (`claude-review.mjs:103`) carry environment through settings (`claude-settings-carry.mjs:49`), which Claude applies to its tools. A spawn-only strip can be undone there;
  - **`review-ledger run -- …`'s model spawn** (`review-ledger.mjs:168`), a supported direct reviewer entry point.

  The strip goes into all three. Other subprocesses are not model children, and are recorded by reachability, not stripped:
  - land subprocesses inherit the caller's environment;
  - the mutation runner keeps counted git settings and scrubs `NANA_ROLE` (`mutation-runner.mjs:407-415`);
  - README rehearsal overwrites the count (`readme-rehearsal.mjs:76-79`).
- A4. The seat's own shells are not stripped. The seat pushes and is never launched through these tools.
- A5. nana-gate runs only in pi sessions. Claude Code builders and reviewers get the environment strip but not the text rule.

## Open choices

- O1. One shared helper, `packages/nana-pack/lib/credential-strip.mjs`, exporting `credentialStripEnv(baseEnv)`. It returns the environment additions:
  - `GIT_CONFIG_PARAMETERS`, with `'credential.helper='` and `'core.askPass='` appended after any inherited entries;
  - the counted form, with the same two resets appended and the count raised;
  - `GIT_ASKPASS` and `SSH_ASKPASS` set to empty;
  - `GIT_TERMINAL_PROMPT=0` and `GCM_INTERACTIVE=never`.

  If git treats an empty `GIT_ASKPASS` as unset, the builder picks the form the probe shows works, and names it. The names and values are sealed in `credential-strip-config.mjs`. pi-worker (every `childEnv`, and the Claude settings env), pi-review, claude-review (spawn and settings env) and review-ledger's model spawn all use it.
- O2. Reviewers are stripped too. They do not need git's helper: the immutable review checkout is made locally before the model spawn (`pi-review.mjs:178-185`).
- O3 (attack SHOULD 6). The gate's credential refusals are a **floor**: they apply where `NANA_ROLE` is `worker` or `reviewer`, and `allowPatterns` cannot exempt them, the same way protected paths are not exempted. Where `NANA_ROLE` is unset, the existing policy is unchanged; that is not an unconditional permission. Patterns:
  - `git credential fill|get|approve|reject`, including with git global options (`git -c x=y credential fill`);
  - `git credential-manager`, `git-credential-manager` and `git-credential-osxkeychain` with `get`, by name or by path;
  - `gh auth token`;
  - `security find-generic-password` and `security find-internet-password`;
  - `cmdkey /list`, `vaultcmd` and `Get-StoredCredential`;
  - `curl`, `wget`, `Invoke-RestMethod`, `Invoke-WebRequest`, `irm` and `iwr` to `api.github.com`, including PowerShell call-operator forms.

  Allowed, and pinned so: `git credential-cache exit`, and a command that only mentions these words inside a quoted documentation string, following the gate corpus's existing rules for mentions (`gate-corpus.test.mjs:103`).
- O4 (attack MUST 5). Wording and contracts:
  - The preamble push line becomes "Do not push; the seat pushes after verifying; report the tip". If builder-credentials has landed, its line is replaced; otherwise the current line at `builder-preamble.md:34` is. The builder says which.
  - The preamble's report shape (`builder-preamble.md:38`), which asks for "the pushed branch, the pushed tip's full SHA and the push's exit code", becomes the branch, the tip's full SHA, and the seat checks run on it.
  - `AGENTS.md:146` and the shared working-pattern source change to match.
  - `nana-rulings.md`'s 2026-11-01 ruling is replaced by a dated 2026-11-02 ruling. It keeps "CI stands in for the local full suite" and says "the seat pushes after verifying, then waits for CI". That follows the rulings file's own rule ("removes any ruling it replaces").
  - **R-3436** (the preamble's push-and-stop line and push-result reporting) and **R-3437** (the rulings carry the 2026-11-01 CI ruling) are amended first. Their tests (`worker-lane.test.mjs:418`, `rulings.test.mjs:365-382`) are updated to the new text. Shared-marker parity is kept.
- O5 (attack SHOULD 7). `packages/nana-pack/README.md` gains a short compatibility note: what children lose (git helper authentication for HTTPS fetches, private submodules and git-backed package dependencies), what they keep (pi's provider logins, npm registry config), and the recovery: the seat fetches or installs authenticated sources before the build.

## Questions for the owner

None for the build. The decision is recorded in `consult.md`. The owner reviews the land at 07:00 because of the ruling reversal.

## Threat model

In scope: honest variation in our tools and machines. That covers:
- Windows Git Credential Manager (the system `credential.helper=manager`) and the macOS osxkeychain helper;
- inherited config in either environment form, and askpass programs;
- pi and Claude Code builders, and every reviewer entry point;
- a builder that, trying to finish its brief, reaches for a credential through git, a script, or a helper command.

Out of scope: a builder deliberately defeating the controls. Examples: rebuilding its environment without the strip, calling an OS keychain API from its own code, or reading a token file.

Residuals, each recorded as a FEAT-006 known-bug line and in the README note:
- **Direct helper or store access:** a child can still run `git-credential-manager get` from inside a script, or use an OS keychain API. The strip stops git's dispatch, not the store. The gate's floor rule only catches the direct shell form.
- **Environment overrides:** a child can remove the strip for its own subprocess.
- **Managed Claude policy:** Claude settings precedence above the flag settings can still supply environment.
- **Claude Code builders:** the text rule does not run there (A5).
- **Advisory gate:** like every gate rule, the floor is advisory by load path. Unattended enforcement belongs to the container layer.

## Precedent

- `packages/nana-pack/bin/pi-watchdog.mjs` — `runWatchdog`'s spawn and `childEnv` merge (172-190).
- `packages/nana-pack/bin/pi-worker.mjs` — the `childEnv` assignments (92, 166, 216, 226), `CLAUDE_BUILDER_CHILD_ENV`, and the Claude settings env (166-172).
- `packages/nana-pack/lib/claude-settings-carry.mjs` — the sealed settings env carry (49).
- `packages/nana-pack/bin/claude-review.mjs` — the settings (103) and the ledger spawn (122).
- `packages/nana-pack/bin/review-ledger.mjs` — the model spawn (168).
- `packages/nana-pack/bin/pi-review.mjs` — the watchdog launch (244) and the local checkout (178-185).
- `packages/nana-pack/extensions/nana-gate.ts` — `PROTECTED_PATHS` as the floor form, and `segHit` with `allowPatterns` (165-182).
- `packages/nana-pack/tests/gate-corpus.test.mjs` — the command corpus and its mention rule (103).
- `packages/nana-pack/prompts/builder-preamble.md` — lines 34 and 38.
- `packages/nana-pack/rules/nana-rulings.md` — the 2026-11-01 ruling.
- `packages/nana-pack/tests/worker-lane.test.mjs` (418) and `packages/nana-pack/tests/rulings.test.mjs` (365-382) — the R-3436 and R-3437 pins.
- `AGENTS.md` — line 146; `templates/_shared/working-under-nana-pi.md` — the shared working pattern.

## Outside precedent

- git's documentation for `GIT_CONFIG_PARAMETERS`, `GIT_CONFIG_COUNT`, `credential.helper` resets, `GIT_ASKPASS`, `core.askPass` and `SSH_ASKPASS` (GPL-2.0, docs only): **adopt** the mechanism. No code is taken.

## Must-meet

Amend R-3436 and R-3437 first. Then add rows R-3660 to R-3667 to the FEAT-006 table, each tagged on its check. Every fixture uses a temporary helper and a temporary askpass program in a temp HOME. **No test or evidence run reads a real stored credential** (attack SHOULD 8). New checks are red against main's code first, recorded in the lane folder.

- **M1 · R-3660** — WHEN pi-worker launches a builder child, in either the pi or the Claude Code runtime, a `git credential fill` for github.com run from a script file inside the child shall get no password. It shall not invoke the fixture helper or the fixture askpass program, and shall not prompt. This holds when the parent supplies that helper through its global config, through `GIT_CONFIG_PARAMETERS`, and through the counted form, and when the parent sets `GIT_ASKPASS`. Pins:
  - In the parent, each fixture route returns the fixture password.
  - In the child: no `password=` line, a marker file showing neither fixture program ran, and an exit within a short limit.
  - The Claude case goes through the settings env, with a conflicting project-settings env present.
  - Red on main.
- **M2 · R-3661** — The same holds for children of pi-review, claude-review (its spawn and its settings env), and `review-ledger run -- …`. Pins: the same fixtures through each entry point.
- **M3 · R-3662** — Unrelated inherited git config, in either environment form, shall keep its effect in the child. Pins: a parent with `core.autocrlf` set through each form; the child reads the same value.
- **M4 · R-3663** — WHERE `NANA_ROLE` is `worker` or `reviewer`, the nana gate shall refuse each O3 command with a reason naming the credential rule, even when a configured `allowPatterns` entry would exempt it. Where `NANA_ROLE` is unset, the existing policy shall decide. Pins:
  - a corpus of each pattern, in dequoted, path, global-option and PowerShell call forms;
  - an `allowPatterns: ["^git"]` case that is still refused;
  - the allowed near misses (`git credential-cache exit`, the mention rule, `git push`, `curl https://example.com`);
  - the unset-role case.
- **M5 · R-3664** — The builder preamble shall tell builders not to push and to report the branch, the tip and the seat checks run. No shipped builder guidance shall tell a builder to push. Pins:
  - the preamble's new line and report shape;
  - a scan of the preamble, `AGENTS.md`'s working pattern, the shared source and the rulings finds no builder-push instruction;
  - amended R-3436 passes.
- **M6 · R-3665** — The rulings shall carry a 2026-11-02 ruling, in place of the 2026-11-01 one, saying the seat pushes after verifying and CI stands in for the local full suite. Pins: amended R-3437, the rulings install and parity tests, and shared-marker parity.
- **M7 · R-3666 and R-3667** — seals:
  - R-3666: the strip's config keys and values, and its environment names and values;
  - R-3667: the gate's credential pattern list.

  Each is pinned once.
- **M8 (evidence)** — on the laptop:
  - the seat's wrong-code pairs, all red;
  - the Windows install check;
  - the touched tests;
  - a run through the installed launchers with the **fixture helper only**, showing the child gets no password while the parent gets the fixture's.

Expected changes (a forecast, not a limit):
- the new `packages/nana-pack/lib/credential-strip.mjs` and its config module;
- `pi-worker.mjs`, `pi-review.mjs`, `claude-review.mjs`, `review-ledger.mjs`, and `claude-settings-carry.mjs` if the settings env needs it;
- `nana-gate.ts` and its config;
- `builder-preamble.md`, `nana-rulings.md`, `AGENTS.md`, the shared working-pattern template and `packages/nana-pack/README.md`;
- new and amended tests;
- `REQUIREMENTS.md`, `docs/known-bugs/FEAT-006.md`, the generated code map and requirements tree, and one session entry at the top of `docs/sessions/2026-10.md`.
