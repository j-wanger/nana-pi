# install-dry-run-pi-packages — plan attack (one adversary)

Verdict: AMEND

AMEND, for two reasons, both probed in a temp clone of main d4423eff with a temp HOME.

(1) R-391 overclaims as written. Under --home, a registered home reports `unchanged`, and R-323's "install reports all extension directories registered" check pins that. Flipping R-391 to implemented verbatim would therefore cite a row the code contradicts. The fix is to narrow it in place: "WHILE --home is in force and an extension directory is unregistered". This is the requirements skill's own §2 remedy.

(2) There is a simpler design that passes the same checks. Delete the early dry-run return. Add `if (install && o.dryRun) return { status: 0 };` in `launch` after the refusal check. Pick the final detail by o.dryRun. The plan's change was 16 lines with a commandFor split and a second refusal branch; this one is 3 lines. The dry run then walks install's own loop: --home, pi lookup, `pi --version` and each root's launch refusal. It stops at the first `pi install` spawn, so the two paths cannot drift. The plan's variant could drift: a mutant that checked only the first root's refusal survived its tests. With this design that mutant cannot exist.

Probes:
- Red today: R-391, R-1930 and R-1931 are red on main. R-358 and R-1932 are green, as pins and guards should be.
- Under the amended design, all five pass.
- Wrong-code pairs: all nine (W2 to W10, W9 and W10 new) turn their named checks red.
- Single files: pi-registration, install, doctor-runtime, settings-merge, retired-artifacts, relative-agent-dir, desk-service and stale-copies each exit 0. pi-registration takes about 0.7 s longer.
- Forced `NANA_SETUP_PLATFORM=win32`: only the R-323 FAIL that main already has.
- Rows and maps: the trace finds 0 rows off EARS form. map:check and readme:check exit 0. requirements-moved reports no tree movement, and the code map is unchanged.
- End-to-end CLI on a temp real home (HOME set, no --home, macOS):
  - No pi on PATH: main says `would add`, exit 0. The amended code says skipped with the install hint.
  - A pi whose --version exits 2: main says `would add`, exit 0. The amended code says ✗, exit 1.
  - A working pi: `would add`, only `--version` is called, and the temp home stays empty.

The README already promises "--dry-run reports the same ✗ and exits 1 with it", so main breaks that promise for this step. The broader scope earns its place over the HANDOFF note's one-line fix.

Dry-run callers: only the CLI runs the dry run of this step; the session-start stale-copies check dry-runs only stepSkills. Every test dry run passes --home or --pi-home, so isRealHome is false and none of them now starts pi.

Lane class: install, hook or gate is correct.

Builder: switch to a Claude Sonnet subagent. With 3 code lines and a specified test block this is a simple lane under the slate's rule. A Sonnet builder also gives a different lineage from the roster's sol reviewer.

The one claim most likely wrong: that the new CLI block, the recording pi.cmd anchor and the `!` temp folder pass natively on the Windows leg. That is inferred from the R-1690 pi.cmd recorder precedent and the injected win32 cases; nobody has run it. Second: that `pi --version` writes nothing nana owns on Windows. pi 1.0.2's main runs a managed-install staging cleanup under a lock in pi's install folder, and on Windows a self-update quarantine cleanup, before the version branch. Both touch only pi's own folder, and doctor already runs the same probe. Under a temp HOME on macOS it wrote nothing.
