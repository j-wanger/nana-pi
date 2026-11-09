Feature: FEAT-006 · Launch builders with execution limits

# Review brief 2: waking (confirmation)

Confirmation round. Review only the change since round 1's tip `5f317d5b`: `git diff 5f317d5b..HEAD` on branch feat/waking. Round 1 said LAND. Since then:
- `8dbae47d` (seat): the three new hook tests go in the module pack; CI's pack check refused files with no pack.
- `0e846501` (builder): round 1's three SHOULDs — the `pi-review` launch entries key on `--item`, the nonexistent `nana-main-ci --wait` entry is gone, the README says the hooks are wired, and the waking ruling is scoped to Claude Code seats.

Questions:
- Does either commit change behaviour beyond what it says?
- Does the guard now deny a foreground `pi-review --item …` launch and pass a background one?

Threat model: honest variation in our tools' output is in scope; deliberate forgery is out.
