Feature: FEAT-013 · Install and connect harness runtimes

# Review brief 1: setup-retire

Review the whole lane: `git diff main...HEAD` on branch feat/setup-retire (it includes a merge of main 2896328a). Plan: `docs/plan/setup-retire.md` (M1–M9). Builder reports in `docs/reviews/setup-retire-2026-11-07/` (notify-retirement.md, post-edit-retirement.md, continuation-report.md, finish-report.md) and the merge report `docs/reviews/setup-retire-merge-main/report.md`.

Question: after this lane, do install, doctor, uninstall (including straight after an update on an old home) and the install check work, with the verifier-pipe hook, the handoff, post-edit and notify extensions and the pi-subagents seeds gone; do the pi gate (pipe-guard) and adoption journaling still work; do old config files holding postEdit and handoff sections load cleanly; are edited seeds, foreign files and symlinks kept? Check that no test of surviving code was deleted rather than moved, and that every retired row's behaviour is really gone.

Threat model: honest variation in machines' installed state and old hook forms (POSIX shell and Windows exec). Forgery out.
