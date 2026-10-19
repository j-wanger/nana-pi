# clean-revision — a checkout git calls clean reads clean to the review and land tools (2026-10-18)

**The feature.** A tree whose only difference from HEAD is what git itself ignores reviews and lands at its plain HEAD
sha. Today review-round's `workingState` hashes raw bytes and the fs execute bit, so two honest checkouts get a `+snap`
revision and nana-land refuses every land from them:
- (a) `core.fileMode=false` with a committed 100755 file that lacks the execute bit on disk — every Windows checkout of
  nana-pi, whose NTFS stores no exec bit (inferred from libuv; probed on macOS);
- (b) `core.autocrlf=true` with a text file checked out CRLF and no eol attribute — every project the templates render,
  on Git for Windows' default (seen on Windows CI: land.test's in-flight check records `+snap:dabb3236…`).

**Lane class: gate** — review-round sits behind pi-review and nana-land. Reviewers: sol final, astra land, the seat's
wrong-code pairs and one independent check. Threat model: honest variation in git config, attributes and platform in
scope; deliberate forgery out. **Sequencing:** build only after win-review-paths lands; plan against its `realOut`,
`gitPathKey` and canonical root.

**The design** (`plan-design.md`, amended by the adversary in `plan-attack.md`; the adversary wins where they differ):
the revision is the tree `git add -A` would record over HEAD, plus recursive nested-repository records. A scratch index
seeded with `read-tree HEAD` (never a copy of the real index); a scratch object folder that borrows the repo's objects
through `objects/info/alternates` (a file, not the environment variable; forward slashes on Windows; a newline in the
path refuses); the real index read first so a corrupt index still refuses; `--out` paths restored to HEAD after the add;
scratch removed in `finally`. pi-review, nana-land and review-ledger keep their code. The adversary weighed the smaller
alternative (git decides clean, raw hash for dirty) and rejected it: a CRLF file removed only from the index gets a
snapshot, which breaks R-710, and fixing that needs the same scratch index.

## Must-meet (one row each; rows planned)

| MM | Row | Test (`packages/nana-pack/tests/` file :: title) | Today |
|---|---|---|---|
| 1 | R-1370 | review-ledger :: `lost committed exec bit retains plain HEAD` | red |
| 2 | R-1371 | review-ledger :: `CRLF checkout retains plain HEAD` | red |
| 3 | R-1372 | land :: `normalized checkout review lands its exact tip` | red (probed) |
| 4 | R-1373 | review-ledger :: `normalized dirty copies share one snapshot` | red |
| 5 | R-1374 | immutable-review :: `normalized dirty review reproduces exactly` | guard |
| 6 | R-1375 | review-ledger :: `snapshot derivation leaves git metadata unchanged` | guard |
| 7 | R-1376 | review-ledger :: `cached removal of normalized content retains plain HEAD` | red |
| 8 | R-1377 | review-ledger :: `scratch objects resolve a linked repository with special path characters` | guard |

Every test runs on every platform with no skip. A committed mode comes from `git update-index --chmod=+x`, never from
chmod. R-1373 varies line endings on every platform; the exec-bit variation is extra.

**Row amendments the build makes:** R-708 defines clean against the HEAD-seeded, git-normalized tree plus nested
repositories, excluding review outputs (plain sha and null snapshot when clean). R-709 narrows to "never renders a
diff, so diff or colour config cannot change the revision", with a dated note that R-1370, R-1371 and R-1373 reverse its
EOL, clean-filter and fileMode clauses; its CRLF, chmod and clean-filter collapse checks go, its split check stays.
`win32-launch.test.mjs`'s plain-sha check commits its file with `update-index --chmod=+x` and fixes its comment.

**Wrong-code pairs** (the mutation runner, one table): the adversary's twelve, in `plan-attack.md`.

**Independent check:** a Windows CI run on the exact tip: all eight tests pass; the strengthened win32-launch check
passes; land.test's in-flight check passes with no `+snap:dabb3236…`.

## Known limits
Dirty snapshot values change once at the switch (deploy with no review in flight). Differences git ignores inside a
dirty tree no longer cost a separate round. A configured filter runs during derivation and may write or vary; the README
says so, and R-1375 holds only without filters. Sparse checkouts, partial clones, ignored staged additions and submodule
refusal keep their declared limits. About 0.34 s more per derivation (the adversary's median, nana-pi clone).
**Claim most likely wrong:** Windows git reads the alternates file's absolute drive path as assumed; R-1377 on the
Windows leg pins it, and macOS evidence alone cannot land this lane.
