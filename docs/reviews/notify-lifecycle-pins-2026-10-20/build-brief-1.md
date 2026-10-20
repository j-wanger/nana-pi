# Build brief — notify-lifecycle-pins

Feature: FEAT-023 · Inspect changes and receive useful notices.
- Builder: a Claude Sonnet subagent (simple lane). Follow `packages/nana-pack/prompts/builder-preamble.md`.
- Worktree `~/nana-pi-wt/notify-lifecycle-pins` on `feat/notify-lifecycle-pins`, from main 31b95f34 or newer.
- Tests only. Never edit an extension, lib/config.ts, an existing test file, HANDOFF.md, docs/sessions/ or a README. Run single test files only.
- Row text and test titles verbatim from must-meet.md. Each `// req: R-nnn` marker sits directly above `check("<title>", …`, with the title on that one line.

## Change
1. New `packages/nana-pack/tests/lifecycle-journal.test.mjs`, six-tag header. Temp HOME and USERPROFILE, delete `PI_CODING_AGENT_DIR`, user config `{ journal: { enabled: true, path: <temp>/journal.jsonl } }`. Register the real extension with `on` and a no-op `registerCommand`. Fire each handler once with `{ type, reason }` and ctx `{ cwd: <temp>, hasUI: false, isProjectTrusted: () => true }`; reasons: start "resume", before_compact "threshold", compact "manual", compact_failed "overflow", shutdown "fork". Filter journal lines by event name.
   - R-162: each event has exactly one line; its `cwd` equals the temp cwd and its `pid` equals `process.pid`.
   - R-2140: the start line's reason is "resume" and the shutdown line's is "fork".
2. New `packages/nana-pack/tests/notify-dispatch.test.mjs`, six-tag header, same HOME setup, `notify` set per case. Before importing the extension, set `createRequire(import.meta.url)("node:child_process").execFile` to a stand-in and call `syncBuiltinESMExports()`. The stand-in records `{ file, args }` and calls back on `setImmediate` with `(null, "", "")`; restore the real one and re-sync before exit. No real osascript or powershell.exe may start.
   - Fake `process.platform` with `Object.defineProperty` in try/finally, as notify-fallback does. Swap `process.stdout.write` only around the handler call and two `setImmediate` turns; restore it before any `check()`.
   - Every ctx: `cwd: <temp>`, `isProjectTrusted: () => true`, and a `ui: { notify }` that records calls. With a UI: `{ mode: "tui", hasUI: true }` and `{ mode: "rpc", hasUI: true }`. No UI: `{ mode: "print", hasUI: false }` and `{ mode: "json", hasUI: false }`; keep the ui object, because pi binds a no-op UI there.
   - R-166 macOS: darwin, both UI ctxs, `{ enabled: true, headless: false }`: per ctx one call, file `osascript`, args joined contain `display notification "Ready for input" with title "pi"`, no stdout, no in-app notify.
   - R-166 Windows: win32, both UI ctxs: per ctx one call, file `powershell.exe`, last arg contains `ToastNotificationManager` and `Ready for input`, no stdout, no in-app notify.
   - R-166 Linux: linux, tui ctx: no call, stdout exactly `\u001b]777;notify;pi;Ready for input\u0007`, no in-app notify.
   - R-173: `{ enabled: true }` and `{ enabled: true, headless: false }` × both no-UI ctxs × darwin, win32, linux: no call, no stdout, no notify_fallback line. `{ enabled: true, headless: true }` × both no-UI ctxs × darwin, win32: one call each.
   - R-818: the stand-in now calls back with an Error carrying `code: 1`; headless true × both no-UI ctxs × darwin, win32, linux: stdout holds no `\u001b` and no `\u0007`.
3. `REQUIREMENTS.md`, FEAT-023: replace R-162's text with the narrowed text and add R-2140 and R-2141 directly after it. Flip R-162, R-2140, R-166, R-173 and R-818 to implemented, citing their tests once green (R-166 cites all three). R-2141 is violated with the evidence cell from must-meet.md. Then `npm run req:tree` and `npm run map`.

## Wrong code
Make a probe folder with `mktemp -d` and keep its path in a variable; never find it by a glob over the temp dir, since other lanes probe there too. Copy the worktree into it and apply each variant there; never leave wrong code in the worktree. Run W1–W7 against lifecycle-journal and W8–W18 against notify-dispatch (list in must-meet.md). Each must turn its named check red.

## Done
- lifecycle-journal shows 2 PASS; notify-dispatch shows 5 PASS; notify-fallback and lifecycle-reload still pass.
- requirement-rows, requirements-trace, requirements-tree, requirements-unclaimed, line-endings and code-map tests pass.
- Exit 0: `node scripts/requirements-trace.mjs`, `node scripts/requirements-tree.mjs --check`, `npm run map:check`, `npm run readme:check`.
- Seat after the build: CI 0 failing on all three legs, and the Windows leg log shows both new files PASS, not skipped.

## Report (10 lines or fewer)
VERDICT; commits; the seven titles with PASS; W1–W18 each with the check seen red; exit codes of trace, tree, map and readme; files changed (expected: the two new tests, REQUIREMENTS.md, docs/requirements-tree.md, docs/code-map.md).