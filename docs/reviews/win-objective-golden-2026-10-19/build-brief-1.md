# Lane win-objective-golden — build brief 1 (2026-10-19 · feat/win-objective-golden · tip after the seat's plan commit)

Read `must-meet.md` here. Change only `packages/nana-pack/tests/objective-golden.test.mjs`, case 13d, as its "The change"
section says. Keep every check's title and the `mentionDetail` helper; update the comment above `shown` to say why the
expectation is hand-built (it must not follow the code it tests). No row changes.

Wrong code (OG1): in `packages/nana-pack/lib/display.mjs`, make `displayPath`'s `esc` write a newline as `\n` instead of
`\u000A`; run objective-golden and see the path-payload checks fail; restore. Record the failing titles in your report.

## Done
objective-golden green on macOS with its current check count; `npm run map:check`, `node scripts/requirements-trace.mjs`
and `npm run readme:check` clean; the full suite through `npm run test:locked` green. Do not push; the seat pushes.

## Report
≤ 6 lines, first line `VERDICT: DONE | PARTIAL | BLOCKED`: the commit; objective-golden's macOS line; the wrong-code
result; the suite line.
