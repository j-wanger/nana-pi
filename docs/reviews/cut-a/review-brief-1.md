Feature: FEAT-007 · Review a specific revision independently

# Review brief 1: Cut A

Review only this lane's commits: `git diff 95138872 HEAD` on feat/cut-a. It is stacked on the helper-start lane at 95138872 (that lane has its own review); after helper-start lands, this branch merges main.

Card (what was asked): remove six tools nothing runs — the review timeline, the brief-check and build-report bins, the `nana-frontier` checker bin, `scripts/ci-records.mjs`, `scripts/ts-syntax-check.mjs`, and the component audit with `docs/components/`; delete absence-only cases from earlier cuts' retirement tests, keeping cases that drive live setup, doctor, install or land behaviour; cut the slow owner-profile tests, keeping the two privacy guards (R-3234, R-3410), the save case (R-3230) and the seal pins. Rows: a row whose feature goes is `retired`; a row whose last test goes but whose feature stays is `untested`; no row deleted. No new tests or rows.

Seat additions (53961942): removed `.pi/nana-pack.json`, which held only the retired, ignored postEdit block naming the deleted syntax-check script (the builder's gate refuses that path); removed the 19 known-bug lines that describe only the deleted tools.

Builder's own checks on 010f4614: trace, tree, map and README checks exit 0; each of 15 touched test files passes alone; install check passes. Size: 42 files, +182 / −3,143 before the seat commit.

Questions:
- Does any live code, hook, CI step, setup step or rule still call something this lane deleted?
- Did any deleted test case pin live behaviour (a recorded failure, the main use of a kept feature, or a safety line: privacy, credentials, rm, identity, Windows paths)?
- Are the retired and untested rows the right ones?

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.
