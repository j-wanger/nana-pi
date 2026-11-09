Feature: FEAT-013 · Install and connect harness runtimes
Card: fix

# Review brief 5: child-context (confirmation round)

Round 4 accepted tip 7983d13ccaf58be7a2f049e3c7564b072ce787d1. Its CI failed only the lane Windows job (run 42561631283): child-context M5, and memory-curation "bad models fail closed" (which passed on main's Windows run).

Review only `git diff 7983d13c HEAD`: commit f8c181fb reorders the child-context fixture so a Windows-only helper no longer overwrites the fixture's ESM package metadata, makes M5's assertions print their values, regenerates code-map lines, and records the work in `docs/reviews/child-context/windows-fix.md` and `.log`. The builder found memory-curation reaches no lane-changed module and left it unchanged.

Check: the cases assert the same behaviour as before; no production code changed; the fixture change is plausible for the Windows failure; the memory-curation reasoning holds.

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.
