# GitHub CLI evidence — Revision 2

Only local help was run: `gh --help`, `gh run rerun --help`, and `gh pr list --help`. No network call, authentication probe or credential read ran.

## Local help quotations

`gh --help`:

```text
GITHUB ACTIONS COMMANDS
  cache:         Manage GitHub Actions caches
  run:           View details about workflow runs
  workflow:      View details about GitHub Actions workflows
```

`gh run rerun --help`:

```text
Rerun an entire run, only failed jobs, or a specific job from a run.

USAGE
  gh run rerun [<run-id>] [flags]

FLAGS
  -d, --debug        Rerun with debug logging
      --failed       Rerun only failed jobs, including dependencies
  -j, --job string   Rerun a specific job ID from a run, including dependencies

INHERITED FLAGS
      --help                     Show help for command
  -R, --repo [HOST/]OWNER/REPO   Select another repository using the [HOST/]OWNER/REPO format
```

`gh pr list --help`:

```text
  -H, --head string       Filter by head branch ("<owner>:<branch>" syntax not supported)
      --json fields       Output JSON with the specified fields
  -s, --state string      Filter by state: {open|closed|merged|all} (default "open")

INHERITED FLAGS
      --help                     Show help for command
  -R, --repo [HOST/]OWNER/REPO   Select another repository using the [HOST/]OWNER/REPO format

JSON FIELDS
  createdAt, deletions, files, fullDatabaseId, headRefName, headRefOid,
  headRepository, headRepositoryOwner, id, isCrossRepository, isDraft, labels,
  latestReviews, maintainerCanModify, mergeCommit, mergeStateStatus, mergeable,
```

This confirms the field names and command syntax, not the live field values or service transitions.

## Evidence limits

The Node fakes prove only that the waiter calls `gh run rerun <id> --failed --repo github.com/<owner>/<repo>`, and handles modelled responses. They cannot prove GitHub restarts cancelled jobs. The installed help says “failed jobs, including dependencies”; it does not explicitly say “cancelled”. Restarting cancelled jobs is the plan's service-behaviour assumption, not a live validation claimed by this build.

Published references (not fetched during this build):

- CLI manual: https://cli.github.com/manual/gh_run_rerun
- CLI PR fields: https://cli.github.com/manual/gh_pr_list
- REST failed-job rerun: https://docs.github.com/en/rest/actions/workflow-runs#re-run-failed-jobs-from-a-workflow-run
- REST run list and `head_sha`: https://docs.github.com/en/rest/actions/workflow-runs#list-workflow-runs-for-a-repository
- REST attempt jobs: https://docs.github.com/en/rest/actions/workflow-jobs#list-jobs-for-a-workflow-run-attempt

The existing `head_sha` query is unchanged. A PR's merged checkout SHA is not substituted for its workflow run's head SHA.

## Targeting departure

`gh api` has no `--repo` flag. API calls therefore use an explicit `repos/<owner>/<repo>/...` endpoint and `--hostname github.com`, following nana-land's precedent. PR and rerun commands use the host-qualified `--repo github.com/<owner>/<repo>` form; their child environment also fixes `GH_HOST`. Thus hostile ambient `GH_REPO` or `GH_HOST` values cannot redirect reads or writes. This departs from Revision 2's literal “every gh read and write passes --repo”, not from its targeting guarantee.

## Workflow classification

The checked-in workflow triggers PR runs and main pushes. PR job evidence includes three suite legs, four install-check legs and skipped release. Success follows the overall run conclusion. Capacity recovery requires complete attempt-matched jobs, at least one cancellation, and no blocking failures or timeouts. Only the suite's explicit `continue-on-error: ${{ matrix.os == 'ubuntu-latest' }}` stanza at the tip authorizes the advisory `suite (ubuntu-latest)` failure in an overall cancelled run. Missing or changed workflow text fails closed for that exception. Skipped and neutral conclusions do not count as failures. Manual cancellation remains indistinguishable under this rule and is recorded as the specified known bug.
