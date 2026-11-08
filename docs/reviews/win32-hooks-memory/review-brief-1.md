Feature: FEAT-013 · Install and connect harness runtimes
Card: fix

# Review brief 1: win32-hooks-memory — fix for red main

Main's Windows suite fails the Windows-only `hooks-win32-exec.test.mjs` with `FAIL doctor: "settings SessionEnd memory making" is ✓`. memory-cuts retired that hook. Review `git diff main...HEAD`: the label leaves the expected doctor rows, and production is unchanged. The builder checked each remaining label against doctor's row builder with an injected win32 platform. Question: does the file expect anything else that memory-cuts or setup-retire removed? Main's Windows run after the land is the proof. Threat model: honest platform variation; forgery out.
