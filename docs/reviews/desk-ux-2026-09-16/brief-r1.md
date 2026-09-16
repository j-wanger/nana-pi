# Review brief — nana code desk, 2026-09-16 UX batch (branch feat/desk-2026-09-16, base main d6c53e0)

You are the independent code reviewer for a land onto `main` of `/Users/jwang/nana-pi`. Three Opus-authored lanes were merged plus one test fix. Read the diffs and the files named below; do not edit anything.

## What changed and why (user-felt gaps named by the owner after dogfooding)
1. **Activity line** above the composer while a turn runs (spinner + verb derived from RPC events + elapsed). `apps/desk/public/app.js`, `desk-client.mjs` (`activityVerb`/`toolActivity`), `index.html`, `styles.css`.
2. **Streaming thinking card**: last few lines visible while reasoning streams, expandable, collapses to `<details>` with chars + duration; history render header carries the char count.
3. **Skill-trigger collapse**: pi expands `/skill:name args` into the recorded user text as `<skill name=".." location="..">…</skill>\n\n<args>` (pi 0.84.4 `dist/core/agent-session.js` `_expandSkillCommand`). The desk now parses that exact shape (`parseSkillMessage`) and renders `▸ /skill:NAME` + hidden body; the optimistic-bubble echo match became prefix-tolerant (`matchesUserEcho`).
4. **Files-changed bar + floating diff window**: new read-only server endpoints `GET /api/session/:id/changes` and `/changes/file?path=` in `apps/desk/server.mjs` backed by `apps/desk/changes.mjs` (git via `spawn`, never a shell; baseline = working tree vs HEAD incl. untracked; caps `DESK_DIFF_CAP` 512 KiB, 20 s per git call, 1000 rows, 1 MiB per untracked file; path validation: no absolute, no `..`, realpath inside root, `--literal-pathspecs`, untracked symlinks never read). Client module `apps/desk/public/changes.js` (bar, expandable rows, draggable non-modal window, Esc in capture phase closes the window instead of aborting the turn). Refreshed on `agent_settled`, on `selectLive`, and on the reconnect `desk_hello`.
5. **Live skills reload**: nana-pack gains `/reload-runtime` (`packages/nana-pack/extensions/nana-lifecycle.ts`, `ctx.reload()`); the desk's `/reload` sends it as a `prompt` RPC then refetches `get_commands` + `/api/resources`; auto-detect compares the `/api/resources` skill/extension path set on window focus / before send / after settings folder changes (throttled 3 s, gains only, deferred while streaming, runs at `agent_settled`).
6. **Test fix** in `apps/desk/test/session-races.e2e.mjs`: three reconnect sites released a held bash POST on a wait condition (card count / any rpc response) that the pre-reconnect pane already satisfied; the `/changes` GET on the same hello added a few ms of server work and the POST won the race. Now: mark the first bubble, cut the stream, wait for an unmarked bubble (the rebuild). 3/3 green after; the failing bisect proved the race was in the test's wait, not the page.

## Read (in this order)
- `unit.diff` — everything except tests
- `tests.diff` — the tests
- `/Users/jwang/nana-pi/apps/desk/changes.mjs`, `/Users/jwang/nana-pi/apps/desk/public/changes.js` (whole files, new)
- `/Users/jwang/nana-pi/apps/desk/README.md` sections "What it does", "Contract notes (page races)", "Known limits" — the contract the page must keep
- `/Users/jwang/nana-pi/apps/desk/public/app.js` around `handleEvent`, `resync`, `send`, `clearStage`, `runReload`, `checkResources` (grep for them)

## Dimensions (answer each with PASS or FINDING(severity: BLOCK|HIGH|MED|LOW) + file:line + one-paragraph reason)
A. **Stage-generation rule** — every new async continuation (activity timer, thinking card, changes fetches, reload/resources checks, focus handlers) drops its effect when the stage changed. Name any that can paint or toast into the wrong session.
B. **Server safety of the two new endpoints** — path handling, symlink/realpath, shell-injection impossibility, resource bounds, behaviour when git is absent / cwd deleted / repo with no HEAD / huge untracked tree; do they respect the existing Host/Origin rules (check where those run in `server.mjs`); can they wedge the single event loop (sync fs calls per untracked file up to 1000 × 1 MiB).
C. **Reload correctness** — can the auto-reload fire mid-turn or race a `prompt`; can it loop (reload → resources differ → reload …); is the "gains only" comparison right when `/api/resources` fails or returns partial; is `/reload-runtime` safe to register in the TUI too (nana-pack loads there) — name collision with pi's built-in `/reload`.
D. **Skill collapse** — can the parser hide REAL user content (false positive) or fail to collapse (false negative) on shapes pi actually produces (args present/absent, body containing `</skill>` text, CRLF); does the tolerant echo match break the README's "explicit rejection returns your text to the editor" or the content-matched rule against another tab's echo.
E. **Thinking card / activity line** — leaks (intervals not cleared on `clearStage`, `desk_exit`, session switch); a turn that ends without `agent_settled`; `pin()` bottom-pinning kept.
F. **Tests** — do the new tests assert the invariants above or just the implementation; is the session-races fix a real determinism fix or a wider wait that could mask a regression (say specifically whether the new wait can be satisfied without the reconnect read having answered).
G. **README/contract drift** — every user-visible behaviour above is stated once, in the right section, and nothing in the README now contradicts the code.

End with `VERDICT: LAND` or `VERDICT: BLOCK` plus the ordered list of findings to fix before landing (BLOCK/HIGH only) and a separate list of MED/LOW that may land as-is.
