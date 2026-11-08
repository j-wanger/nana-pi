# ci-packs build 2

## Pack adjustment

The first M1–M7-only data-pack measurement took 178.70 s. M6 (Copier update acceptance) took 167.22 s; M1 took 8.86 s. These are not fast fixture cases. Following the brief's fallback, the original file moves to release and M2 moves to `data-pack-land.test.mjs`, retaining its marker and assertion. Its measured fixture time was 0.12 s.

The fast guard imports the newly public `py` helper from the precedent file. The release cases are entry-point guarded so importing that helper never runs acceptance. No helper was copied or moved into an unauthorized shared module. There are no new requirement IDs or tunables. R-3841's evidence path changes first. The existing R-3855 guard list follows that path; no assertion is weakened.

First four-job land measurement: 90.46 s real / 89.4 s runner. `win-main-only.test.mjs` took 56.8 s. It moves from land to main: this is event/platform integration policy, not one of the design's core-contract guards. Windows forced-launch and shard policy guards remain in land. `land.test.mjs` (33.7 s) and `brief-check.test.mjs` (30.6 s) stay: land authorization and builder refusal are named core contracts.

After that move: 52.09 s real / 51.5 s runner, 71 files, 2,445 passing checks. Evidence: `land-first.log`, `land-packs.log`, `data-fixtures-timing.log`.

Mutation pair: the extracted M2 first fails against the absent public helper (`data-land-red.log`, exit 1). A product-code mutation returning no findings also fails M2 (`data-contract-mutation-red.log`, exit 1). Restoring the product passes (`data-contract-green.log`, exit 0). No assertion was inverted. The original release file passes all seven remaining cases (`data-release-premerge.log`, exit 0).

Precedent departures: the alternative whole-file release move is explicitly allowed by brief 2. The original test exposes `py` and gains an entry-point guard solely to reuse its existing implementation without executing release acceptance during land.

## Merge and final verification

To be completed after merging current main. Full-suite execution is delegated to CI by AGENTS.md. No push, CI read, credential lookup, model launch, or GitHub operation is performed.
