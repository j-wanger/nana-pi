# Plan review — the tree for every project, 2026-10-14 (gpt-5.6-sol; format lane: up to two rounds)

Review the change declaration `docs/reviews/tree-2026-10-14/CHANGE.md` on `feat/tree` (based on main `484329c`).
Nothing is built yet. Lane `seat-guide` is in flight on another branch and touches some of the same files (§4 names
them); this lane merges after it.

The owner's words: 2026-10-13, "why does the default behavior today create requirements in row by row ears format instead
of tree based design which we adopted?" — he agreed to the seat's proposal (templates seed the tree, the adopt step
sorts a flat ledger into it, the report runs in any project). 2026-10-14, on sorting: "Lift is the tool that enables
better regroup, but this is a core feature for nana, understanding existing repo and turn into feature trees, then
development really becomes feature oriented". This lane is the first of the four lanes §6 queues; the lift, the
regroup and feature-oriented development are later lanes and out of scope here.

Threat model (§1): honest variation in our tools' output and our users' files is in scope — CRLF from Git for Windows,
a BOM, a UTF-16 file from Windows PowerShell 5.1 redirection, PowerShell or Bash, Node 22.18 or later, a project in a
subfolder, a hand-typed heading, an old project running `copier update`; deliberate forgery is out. Lane class: format
(it changes the ledger format every new project inherits). The review standard pi-review appends governs the bar and
the verdict line.

Evidence in the folder: `research-templates.md`, `research-tree.md`, `research-adopt.md`, `factcheck-repo.md` and
`factcheck-external.md` (both written against draft 1; "Seat revision (2026-10-14)" at the end of CHANGE.md lists what
changed), and the probe scripts in `probes/`.

Check: (1) a new project in either language and either mode starts with a tree the checker accepts, with the general
engineering rows in one feature whose IDs cannot collide with the product's; (2) the skills tell both seats where a
row goes, in a tree ledger and in a flat one, and promise no command that does not exist; (3) the checker's `--root`,
CRLF, UTF-16, no-row and flat-ledger behaviour is right on macOS and Windows and never prints "0 problems" for a
ledger it could not read; (4) rows R-1150–R-1159 are each pinned by a named test, and every "wrong code first" pair
reds the titles it names; (5) scope is the smallest that serves the owner's words; (6) any MUST under the standard.
