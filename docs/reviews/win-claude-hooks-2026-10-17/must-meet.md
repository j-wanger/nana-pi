# win-claude-hooks — the Claude Code seat's hooks are proven on Windows (W3 of the Windows fixes, 2026-10-17)

**The feature.** On Windows, the Claude Code seat's hooks run from the checkout in exec form (landed 2026-10-12), but the
only Windows proof is that each hook exits 0 with no module error: a hook that always prints nothing passes it
(`packages/nana-setup/tests/hooks-win32-exec.test.mjs:183-185`; the Windows plan's adversary, 1.2). The tests that would
prove the knowledge pull, shared memory and the verifier pipe on Windows fail there for test-portability reasons: a
file URL's `.pathname` handed to node (`hook.test.mjs:286-293`, `discovery.test.mjs:201,224`), names NTFS forbids
(`render.test.mjs:41,48`), POSIX mode bits and a `~/.claude/hooks` folder Windows install does not create
(`settings-merge.test.mjs:481,600,753,773`; `verifier-pipe.test.mjs:32-37`), and a deleted working folder Windows
cannot have (`shared-memory-hook.test.mjs:138-147`). `hook.test.mjs` crashes and hides 32 checks, among them the
hung-stdin deadline and the 16-process build-lock race. After this lane, the Windows leg shows the knowledge pull
printing a real block through the installed command, and every hook test runs to its end.

**Lane class: ordinary** while the changes stay in tests. If a hidden check reds on Windows because of hook code (the
build-lock race is the likeliest), the builder stops and reports; that fix becomes a hook-class lane. Threat model:
honest variation in Windows paths, file names and process behaviour in scope; deliberate forgery out. Sources:
`docs/reviews/windows-fixes-2026-10-17/rows.json` and `plan.md` §2 L6 and L7.

## Rows

| ID | Text |
|---|---|
| R-1330 | WHERE the platform is Windows, the knowledge hook command install writes shall, run with a prompt that matches a fixture knowledge store, print a pull block naming the matching fixture file. |

## Must-meet tests

- **KH1 (R-1330).** In `hooks-win32-exec.test.mjs` (Windows only; it SKIPs elsewhere with its reason): seed a fixture
  knowledge store in the temp home, build its index, run the installed UserPromptSubmit knowledge command exactly as
  settings.json holds it with a matching prompt on stdin, and assert the output carries the pull block and the fixture
  file's name.
- **KH2 (evidence).** On the Windows CI leg, `packages/nana-knowledge/tests/hook.test.mjs`, `discovery.test.mjs` and
  `render.test.mjs`, and `packages/nana-setup/tests/settings-merge.test.mjs`, `verifier-pipe.test.mjs` and
  `shared-memory-hook.test.mjs`, each pass with their macOS count minus declared win32 skips, each skip printing its
  reason; `render.test.mjs` keeps one NTFS-legal hostile name so its end-to-end path stays pinned on Windows.

## Known limits

The deleted-working-folder case cannot happen on Windows and is skipped there. Mode-bit checks are POSIX-only.
