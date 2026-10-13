# Review — per-machine roster, default pattern, Windows launch through pi's Node entry, 2026-10-13 (gpt-5.6-sol build review and gpt-6-astra land review, in parallel)

Review `git diff 5b53ebc..HEAD` on `feat/roster` (main `5b53ebc`, with the fresh-install and process lanes, is merged in).
Threat model: honest variation in our tools' output in scope (a machine with another provider or no land model; a
typo'd or malformed roster; Windows pi installed by npm globally, into a project's `.bin`, as a `.exe`, or by another
installer; a POSIX machine whose `pi` is npm's symlink or a shell launcher); deliberate forgery out. Lane class: gate
(lane mode gains a refusal and a Windows launch). The review standard pi-review appends governs the bar and the verdict
line.

Records in `docs/reviews/roster-2026-10-13/`: the plan `CHANGE.md` — planning workflow, fact-checks, a seat revision,
sol plan r1 SEND-BACK 6/10 and r2, then the final "Seat amendment (2026-10-13): Node entry" section, which Jake ruled
("Yes switch, but go through plan review") after his work seat hit `spawn pi ENOENT`; sol plan r3 said LAND 9/10. Its §6
lists every declared residual. Also: Sonnet 5.5's build brief 1, the shared-text proposal, the seat's acceptance
script (122/122 at the tip; read `acceptance-output.txt` rather than re-running unless you want to), the title check
(0 missing) and the seat's mutation runner (`seat-mutate.mjs`; read `seat-mutate-output.txt`, do not run it). Draft
PR #8's CI run 38477850586 (at `34f43bc`; `c7c7690` after it changed only seat scripts and records): macOS suite and
both install-check jobs green; on the non-blocking Windows leg `win32-launch` passes 11/11 and `nana-roster` 11 with 2
skips, and the leg fails the same 68 files as main's run 38459506991 (206 failing checks here, 210 there). Also `HANDOFF.md` and the session entry.

Check: (1) the roster reader: defaults byte-identical to today's lane defaults, a bad roster refused before the lock or
any spawn with the named refusal line, the stderr builder line, `nana-roster`'s output; (2) the win32 launch: npm global
and `.bin` layouts start `process.execPath` with the package's `bin` entry only when that entry is a file; `.exe`/`.com`
directly; every other case refused, named, with nothing started; POSIX unchanged (pi by name); native realpath on
win32 only; (3) the shared text and its copies in `AGENTS.md` and `nana-soul.md` say what Jake ruled — the pattern is the
default for any change that touches code with tests, and with no land model the seat gives the land review while the
slice reviewer still covers every land; (4) each new row R-1120–R-1128 is pinned by its cited test; (5) HANDOFF, the
session entry and the pack README's Windows line are true; (6) any MUST under the standard.
