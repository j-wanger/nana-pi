# FEAT-017 — known bugs

*One line per known bug in this feature. A review finding that does not block a land goes here as one line.*
- `packages/nana-setup/tests/restore.test.mjs` fails at import on a machine whose `~/.npmrc` sets the npm prefix: it asks `npm root -g` for pi's install under a temporary home, so npm falls back to node's own prefix, where pi is not installed (inferred; CI green).
- State manifest (artifact audit, 2026-10-24): the list labels the handoff store as pi-owned and disposable.
- Kept review texts (review-texts-durable, plan): a backup taken while a review completes can make tar fail on a vanished temporary text. Re-run it (inferred, not run).
- Kept review texts (review-texts-durable, plan): tar reads the tally before the texts. A review that ends between the listing and that read leaves one LAND row with no text (inferred).
- Kept review texts (review-texts-durable, plan): the check sees only the paths the review ledger names. The seat's one-off legacy copy beside the ledger stays unlisted.
- Kept review texts (review-texts-durable, plan): only the seat's pair 1 catches a list that loops over the ledger's paths; R-2871's check cannot see it.
- Kept review texts (review-texts-durable, plan): the README's state table is hand-kept prose, and no test ties it to the list.
- Kept review texts (review-texts-durable, plan): the store has no cap. The archive grows about 2 MB a month at today's pace (inferred from three days).
- Kept review texts (review-texts-durable, plan): build and land records live in each clone's git folder, outside the archive, like unpushed commits.
- Kept review texts (review-texts-durable, plan): `state --paths` skips a store under a symlinked folder, such as a linked `~/.pi`, with no message. That already drops the tally and the audit.
- Kept review texts (review-texts-durable, final review): R-2872's check is one compound boolean with no detail. A failure will not say whether the listing, the bytes or the evidence broke.
- Kept review texts (review-texts-durable, final review): R-2871's title says wherever pi home is, but the ledger's paths follow only the home folder.
