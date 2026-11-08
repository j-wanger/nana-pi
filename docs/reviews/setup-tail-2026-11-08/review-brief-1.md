Feature: FEAT-013 · Install and connect harness runtimes

# Review brief 1: setup-tail

Review the whole lane: `git diff main...HEAD` on branch feat/setup-tail (includes a clean merge of main). Plan: `docs/plan/setup-tail.md` (M1–M9). Builder reports: `docs/reviews/setup-tail/builder-report.md` and `docs/reviews/setup-tail/continuation-report.md`. One commit is the seat's (`9f858343`): it deletes both `templates/*/template/.pi/nana-pack.json.jinja`, because the pi gate keeps builders off policy files. Each held only the retired post-edit commands, which now appear as manual checks.

Question: after this lane, does nothing tell a user or agent that post-edit checks run after edits, and do the templates and adoption skills name runnable manual checks that catch broken files? Do project setup, project check, trust and the gate's project config, copier update of existing projects, install, doctor and uninstall still work, including uninstall on a home whose only leftover is the dangling verifier link? Do the four restored matcher cases test live code?

Threat model: honest variation in projects' existing `.pi` files, old installs and copier update histories. Forgery out.
