# FEAT-022 — known bugs

*One line per known bug in this feature. A review finding that does not block a land goes here as one line.*

- Carry (desk-page-retire): `apps/desk/pi-session.mjs` transport rows R-429/R-461, R-430/R-431, R-419/R-420 and R-460 lack manifest-child tests after their general-spawn harness retired.
- Carry (desk-page-retire): `apps/desk/server.mjs` session-id enumeration neither strips a BOM nor refuses symlinked transcript files before authorizing stage-key pruning.
- Carry (desk-page-retire): `apps/desk/test/*.e2e.mjs` browser cases skip in CI without Playwright, leaving page behaviour unexercised there.
