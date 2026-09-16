# Review brief — pi-side knowledge pull (round 1 of max 3)

You are an independent code reviewer. Read-only. Be adversarial: find what breaks, what fails closed when it must fail open, what blocks pi's event loop, and what is more machinery than the job needs.

## What changed and why

`packages/nana-knowledge` (in `/Users/jwang/nana-pi`, landed 2026-09-16 as `f611e3f`…`46befcc`) pulls knowledge pointers at prompt time — but only for Claude Code, through a `UserPromptSubmit` hook that runs `bin/nana-knowledge.ts hook` with `{prompt, session_id, cwd}` JSON on stdin. pi had no pull. The premise carried in the handoff ("pi's agent-start event has no prompt text; it would need a tool") was WRONG: pi 0.84.4's `before_agent_start` event carries `event.prompt` (verified in the installed `dist/core/extensions/types.d.ts` ~line 539). So the change is a thin pi extension, uncommitted in the working tree (`git diff` + untracked files under `packages/nana-knowledge/`):

- `packages/nana-knowledge/extensions/nana-knowledge.ts` (NEW): on `before_agent_start`, spawns the SAME `hook` CLI out-of-process (`execFile(process.execPath, [bin, "hook"], { timeout: 2000, maxBuffer: 64 KiB })`) with `{prompt (sliced to 8 KiB), session_id: ctx.sessionManager.getSessionId(), cwd, source: "pi"}` on stdin, and injects the printed block as a persistent custom message `{ customType: "nana-knowledge", display: true }`. Fail-open on everything. Exports `makePull({bin, timeoutMs})` for tests.
- `lib/hook.ts` + `lib/tokenize.ts`: `PROMPT_MAX_CHARS` moved to `tokenize.ts` (no sqlite imports) and re-exported; the `pull.log` line gains a `source` field.
- `package.json` (package + repo root): pi manifest entries so `pi install` loads the extension.
- `README.md`: the pi section.
- `tests/extension.test.mjs` (NEW).

Design intent, so you review against it and not against a different design: ONE producer of pointers (the CLI), one log, one dedup; node:sqlite never loads inside pi's process; the execFile `timeout` is the pi-side equivalent of the Claude Code harness hook timeout; `message` rather than `systemPrompt` because pi rebuilds the system prompt every turn and a deduped pointer would vanish; `display: true` because the owner must see what the agent sees; no config key (uninstall the package to turn it off).

## Dimensions

A. **Never blocks, never throws.** Enumerate every path in the handler and `makePull` that can reject, throw synchronously, or hold pi's loop: stdin EPIPE before the child reads, a child that never exits, a child that prints > maxBuffer, `process.execPath` not being node (bun-run pi), `import.meta.url` under jiti, a `sessionManager` without `getSessionId`, `event.prompt` undefined. Is the 2 s bound real (does execFile's `timeout` kill the child AND resolve the callback), and is the child's own process group cleaned up on darwin, linux and win32 (`windowsHide`, taskkill)? Does a queued `followUp`/`steer` prompt (pi fires `before_agent_start` per run) cause overlapping children, and does that matter?
B. **Trust boundary.** The child reads user-scope files only. Can the pi session (`ctx.cwd`, a crafted session id from a forked/renamed session, a prompt with control characters or a 200 KB skill expansion) make the child write outside `~/.pi/agent/nana-knowledge/`, exceed the 2000-char block, or inject something that escapes the "untrusted DATA" framing? Is `session_id` sanitised the same way the Claude Code path sanitises it (`hook.ts sessionFile`)?
C. **Context hygiene.** A custom message with `display: true` is stored in the session and sent to the LLM on every later turn. Cost per turn of the accumulated pointers over a long session; whether they survive compaction; whether an injected message could be mistaken for a user turn by pi's own parser or by the desk (`apps/desk/public/app.js` ~line 581 renders `case "custom"`). Would `systemPrompt` (ephemeral) or `display: false` have been the better call? Argue it, don't assume.
D. **One producer, no drift.** Is there any pull logic duplicated in the extension that also lives in `lib/hook.ts` (skip rules, slicing, dedup)? The 8 KiB slice before the spawn is deliberate (payload size); anything else duplicated is a finding.
E. **Subtraction.** Name anything in the diff that is more than the job needs. The owner prefers removing a mechanism over adding one.
F. **Tests.** Do `tests/extension.test.mjs` assertions prove the invariants above (fail-open under timeout/ENOENT/missing API, no sqlite in-process, slice-before-spawn, dedup per session, `source: "pi"` logged) or only mirror the implementation? Name the single missing test that matters most. Confirm the existing `hook.test.mjs` still passes with the `PROMPT_MAX_CHARS` move.
G. **Docs.** Does the README section state the bound honestly (a bound on the child, not on a synchronous stall inside pi) and the install path correctly (`packages` entry in `~/.pi/agent/settings.json`, or the repo-root manifest for `pi install git:`)?

## Files to read

- `/Users/jwang/nana-pi/packages/nana-knowledge/extensions/nana-knowledge.ts`
- `/Users/jwang/nana-pi/packages/nana-knowledge/lib/hook.ts`, `lib/tokenize.ts`, `lib/paths.ts`, `bin/nana-knowledge.ts`
- `/Users/jwang/nana-pi/packages/nana-knowledge/tests/extension.test.mjs`, `tests/hook.test.mjs`
- `/Users/jwang/nana-pi/packages/nana-knowledge/README.md`, `package.json`; `/Users/jwang/nana-pi/package.json`
- Precedents: `/Users/jwang/nana-pi/packages/nana-pack/extensions/nana-objective.ts`, `nana-notify.ts`
- pi API: `/Users/jwang/.local/lib/node_modules/@earendil-works/pi-coding-agent/docs/extensions.md` (`before_agent_start`, `input`, `pi.sendMessage`), `dist/core/extensions/types.d.ts` (`BeforeAgentStartEvent`, `BeforeAgentStartEventResult`, `ExtensionContext`)

## Output

Per dimension: PASS or FINDING (severity BLOCK / HIGH / MEDIUM / LOW, file:line, one-paragraph failure scenario, the smallest fix). End with `VERDICT: LAND` or `VERDICT: BLOCK` and a one-line reason.
