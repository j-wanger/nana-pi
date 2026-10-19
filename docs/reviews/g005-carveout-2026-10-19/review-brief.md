# Review — g005-carveout (the export rule says a pi extension's default export counts as its named entry point), 2026-10-19 (Opus, the lane's one final reviewer)

Feature: FEAT-033 · Adopt explicit engineering standards

Review `git diff 4be0b79..HEAD` on `feat/g005-carveout` (the lane's base is `4be0b79`, and `git merge-base HEAD main` is
`4be0b79`; main has since moved to `2a96090`, which this tip does not merge). The plan of record is
`docs/reviews/g005-carveout-2026-10-19/must-meet.md` with the adversary's verdict `plan-attack.md`: row R-1480 (block
R-1480 to R-1489) plus G-005 reworded. The seat's record `seat-verify-b02048e.md` holds CI, the Windows log beside it.

Tree movement (`node scripts/requirements-moved.mjs --root . --base 4be0b79`): FEAT-033 · Adopt explicit engineering
standards — G-005 text changed; R-1480 new (implemented).

Judge whether the coding standards rule, the requirements skill and both ledger copies of G-005 now say that a pi
extension's default export counts as its named entry point, and whether R-1480 fails, naming the copy, when any one of
the three it reads loses those words — wrapped lines and CRLF included.

Threat model: honest variation in our tools' output and the OS in scope (a rule line that wraps mid-phrase, a CRLF
checkout on Windows, a later edit that drops the words from one copy, G-005 edited in one ledger copy only); deliberate
forgery out. Lane class: ordinary — rule, skill and ledger text plus one check in an existing test; no install,
uninstall or doctor code, no hook, no extension, no gate policy, no land or review tool.

Check: (1) R-1480 is not vacuous: it reads the real files and goes red naming each copy that drops the words; (2) G-005
is the same bytes in `REQUIREMENTS.md` and `templates/_shared/requirements-general.md`, with its status and evidence
unchanged; (3) the descriptive copies the plan leaves alone (`README.md`, the two scaffold skills, the Part G purpose
line) are still true; (4) nothing else changed: no scanner, no new module, the leaf total moved by exactly one, and the
requirements skill change needs no entry in win-skill-occupied's shipped-version list; (5) HANDOFF, its residual lines
and the session entry are true; (6) any MUST.
