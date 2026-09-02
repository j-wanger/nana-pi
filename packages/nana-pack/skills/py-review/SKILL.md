---
name: py-review
description: Review Python code changes against the 8-point AI PR checklist. Use before committing, before creating a PR, or when asked for a review.
---

# Python change review — 8-point checklist

Review the current diff (`git diff` unstaged, `git diff --cached` staged, or
`git diff main...HEAD` for the branch). Report only findings — skip points that
pass.

1. **Duplicate code** — search for similar function names/logic nearby before
   approving; agents re-implement utilities that already exist.
2. **Real imports, pinned deps** — every new import is a real, maintained
   package; check the `uv.lock` diff; watch for hallucinated names
   (slopsquatting).
3. **Swallowed exceptions** — flag `except Exception: pass`, bare `except:`,
   handlers that log but neither re-raise nor return an error.
4. **Failure-path tests** — if only happy-path tests exist, list the missing
   negative cases (bad input, missing data, network errors, concurrency).
5. **Right API version** — usage matches the installed version (e.g. Pydantic
   v2 `model_config`, SQLAlchemy 2.x patterns); check against `uv.lock`.
6. **Codebase idioms** — repository idioms beat textbook idioms: naming,
   imports, error-handling patterns.
7. **Secrets and hardcoded paths** — keys, tokens, DB URLs, `~` paths, paths
   containing usernames, leaked `.env` values.
8. **Complexity** — functions >~40 lines or reducible cyclomatic complexity;
   agents inline more than humans; suggest the extraction.

## Output

```
[FAIL] N. Category — file:line — description + suggested fix
```

`[FAIL]` must fix before merge · `[WARN]` should fix, not blocking. If all 8
pass: "Review clean."

Degradation: no git history → review all Python files and say so; no `uv.lock`
→ skip point 2 and say so.
