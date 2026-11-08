Feature: FEAT-013 · Install and connect harness runtimes

# Review brief 2: setup-tail — confirmation round

Review only `git diff c95f1fff..HEAD`: the builder's fixes for round 1's MUST (Windows `cmd.exe` launch in M8 now uses verbatim arguments with a quoted line, proven by an injected-platform argv test), the CI failure (R-3156 lost edge `project.mjs -> json-text.mjs` now has a named loss reason; ten more test-import losses were added to the existing list), and SHOULDs 1, 2 and 4 (README rows, the `pi-worker` notice, tool-missing skips). Question: do these close the findings without weakening the launch-map check? Bar as in round 1.
