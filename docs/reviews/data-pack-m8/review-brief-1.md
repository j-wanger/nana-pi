Feature: FEAT-033 · Adopt explicit engineering standards
Card: fix

# Review brief 1: data-pack-m8 — urgent fix for red main

Main's Windows CI fails every run in `data-pack.test.mjs` M8: the test ran the whole release acceptance, and the default-off TypeScript modes' `pnpm install` exits 1 on Windows; the Python modes pass. Review `git diff main...HEAD`: M8 now runs only the Python modes through an optional `modes` filter on `runAcceptance`; `npm run template:accept` and the release path keep running every mode. Question: does M8 still prove R-3847 (opted-in Python scaffold and adopt pass every native check with the data test discovered and run), and are the CLI and release defaults unchanged? Lane CI no longer runs Windows; main's Windows run after the land is the proof. Threat model: honest runner variation; forgery out.
