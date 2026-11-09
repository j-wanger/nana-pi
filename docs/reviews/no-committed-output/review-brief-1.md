Feature: FEAT-008 · Build and review lanes
Card: fix

# Review brief 1: no-committed-output

Review the whole lane: `git diff main...HEAD` on branch feat/no-committed-output.

The builder preamble told builders "Send long script output to a committed file". Builders did, committing 1,832-, 369- and 403-line output files in recent lanes. The lane replaces that one line with: keep long output outside the repository, report each command, exit code and a one-line summary, commit no raw output. It updates the one test case that pinned the old line and R-3436's evidence name.

Question: does the new line clearly stop committed raw output without losing the builder's ability to report evidence, and does the change cause a harm the review standard lists?

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.
