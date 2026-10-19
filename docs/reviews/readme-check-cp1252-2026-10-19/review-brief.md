# Review — readme-check-cp1252 (a Python project's readme check and code map print their whole report under any output encoding), 2026-10-19 (Opus, the lane's one final reviewer)

Feature: rendering the language templates (SUB-019 in FEAT-014), the Python template's readme check and code map

Review `git diff b3f6ec2..HEAD` on `feat/readme-check-cp1252` (`git merge-base HEAD main` is `b3f6ec2`; when this brief
was written main stood at `73f39d5`, which this tip has not merged). The plan of record is
`docs/reviews/readme-check-cp1252-2026-10-19/must-meet.md` (rows R-1440 to R-1443), amended by the adversary's
`plan-attack.md`. The seat's record `seat-verify-8721f8b.md` holds CI, the Windows log beside it.

Tree movement: four rows added, R-1440 to R-1443, under SUB-019 (FEAT-014, CAP-04): SUB-019 26 to 30 rows, the leaf
total 1,215 to 1,219 (R-291's pin). No existing row changed.

Judge whether a scaffolded Python project's readme check (check and list mode) and code map (check and impact mode)
now print, under ASCII and cp1252 output, the report they print under UTF-8, each character the encoding lacks written
as its Python backslash escape, with the UTF-8 exit status; and whether UTF-8 output stays unescaped. The seat ran no
wrong-code pairs and the builder's results for the brief's seven are not recorded, so judge from the code and the
adversary's probe whether the checks fail on that wrong code: a fix in one script only, `errors="replace"` or
`"namereplace"`, forcing UTF-8, a Windows-only guard, catch-and-exit around main, escaping at the print sites.

Threat model: honest variation in our tools' output and the OS in scope (output encodings: a cp1252 Windows pipe,
ascii, an explicit PYTHONIOENCODING; path names); deliberate forgery out. Lane class: ordinary — two template scripts,
one nana-pack test file and four rows; no install, hook, gate, land or review tool.

Check: (1) the must-meet checks are not vacuous: each fails without the fix, and R-1443 fails when output is escaped
everywhere; (2) the extra render and its fixture live in temp folders the test owns and are removed in `finally`;
(3) the fix changes only stdout's error handler and keeps the caller's encoding, and nothing else changed beyond R-291's
leaf-total pin; (4) a failed render makes the four checks FAIL rather than vanish; (5) HANDOFF and the session entry are
true; (6) any MUST.
