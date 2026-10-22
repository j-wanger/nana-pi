# Plan review — lane roster (gpt-5.6-sol), 2026-10-13, round 3 — Owner-ordered after a design switch

Review the change declaration `CHANGE.md` in this folder and `shared-text.proposed.md`. The lane gives each
machine its own role roster (a `roster` block in the user-scope `nana-pack.json`; the Mac's values stay the
default), makes pi-worker's lane mode read it, adds a `nana-roster` print command, and makes the worker/reviewer
pattern the stated default for any change that touches code with tests, with the seat giving the land review when
a machine sets no land model. The owner's rulings it implements (2026-10-13): the default ("sure" to: the pattern for
any change that touches code with tests, a direct answer for questions and one-line fixes) and "land can be
optional due to token allowance, seat will take on landing review if no land model set". The lane rebases on the
in-flight `process` lane, which edits the same shared text. Threat model: honest variation in our tools' output
in scope (a machine with another provider; a typo'd roster); deliberate forgery out.

**Materiality bar (Owner, 2026-10-13) — apply it to every finding.** A MUST is a defect a real user or one of our
own tools would plausibly hit, with a consequence that matters: data lost or corrupted, a security or review
boundary bypassed in practice, wrong output someone acts on, a broken install or hook, or a regression of
behaviour main has today. Name the realistic input and the consequence; if you cannot, it is a SHOULD or NOTE.
Contrived inputs, rare edge cases, wording, citation bookkeeping and test-evidence gaps are SHOULD or NOTE.
`VERDICT: LAND` when no MUST stands; `VERDICT: SEND-BACK` only for a MUST. Do not use LAND-WITH-FIXES.

Round 3, ordered by the owner (2026-10-13: "Yes switch, but go through plan review"). Round 2 (`sol-plan-r2.md`) said LAND 9/10 for a design that started pi on Windows through cmd.exe (`winCommand`). New real-machine evidence — the owner's Windows seat hit `spawn pi ENOENT`, and starting pi's Node entry directly worked end-to-end there — switched the design: on win32 the launchers start `process.execPath` + pi's `bin` entry (npm global or `.bin` layout), a `.exe`/`.com` pi directly, and refuse anything else with a named message; the cmd.exe workarounds (prompt file, process-tree CPU) are dropped. The "Seat amendment (2026-10-13): Node entry" section lists every change; `research-node-entry.md` and the two `factcheck-node-entry-*.md` files are its evidence. Review the switched design and confirm round 2's notes still hold.

Check: (1) the land rule still holds — nothing can reach main without an independent reviewer's LAND, with or
without a land model; (2) a machine whose roster is absent, malformed or names another provider gets either the
Mac default or a clear refusal, never a silently wrong worker; (3) a Windows Claude Code seat and a pi seat can
both find and follow the default and the roster command as written; (4) each row has one `shall` and §5 pins it;
(5) anything that should block the build. MUST / SHOULD / NOTE with file:line, evidence and the smallest fix; a
score; the last line exactly `VERDICT: LAND` or `VERDICT: SEND-BACK`.
