Feature: FEAT-001 · Keep goals and priorities in view

Lane objective-file. Class: ordinary. Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.

Review `git diff origin/main...HEAD` on `feat/objective-file`: one new file, `OBJECTIVE.md` at the repository root, made from `templates/_shared/OBJECTIVE.md`. Until now nana-pi had none, so every nana-pi session printed the umbrella's lines from `~/nana-agent-loop/OBJECTIVE.md`. The owner said on 2026-11-02: "yes, give nana-pi its own objective file... every nana-pi project then gets their own.. isnt that the design?". The current priority line repeats the one the owner approved that day ("yes"); its appetite is seat-proposed and marked so.

Question: does a nana-pi session now get nana-pi's own two lines as governing, with the umbrella lines as program lines; does the file follow the seed's shape (one physical line per marker line, the seed's rules); does the new root file break any test, check or tool that reads the repository root (CI on this tip is the suite); does it cause a harm the review standard lists?

Do not begin any line with the word "Verdict". Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`, and nowhere else, not bolded.
