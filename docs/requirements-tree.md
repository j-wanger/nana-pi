# Requirements tree

Generated from `REQUIREMENTS.md`; requirement statuses are intentionally omitted.

- **CAP-01 · Maintain direction and useful context**
  Purpose: Keep the agent aligned with the project and carry useful knowledge between work sessions.
  Parent: — · Rows: 0 · IDs: —
  - **FEAT-001 · Keep goals and priorities in view**
    Purpose: Provide the governing project objective and preserve its precedence over background context.
    Parent: CAP-01 · Rows: 23 · IDs: R-001–R-020, R-641, R-659, R-758
  - **FEAT-002 · Resume decisions and next actions**
    Purpose: Carry compaction summaries and a clear handoff frontier into later work without presenting past agent output as authority.
    Parent: CAP-01 · Rows: 0 · IDs: —
    - **SUB-001 · Write and identify a compaction summary**
      Purpose: Find the correct store, write the summary atomically and report its origin and any write failure.
      Parent: FEAT-002 · Rows: 13 · IDs: R-108, R-112, R-120, R-123, R-244, R-795–R-797, R-800, R-830
    - **SUB-002 · Resume only the appropriate summary**
      Purpose: Decide whether a summary belongs to this directory and session, distinguish missing and unreadable state, and respect role exclusions.
      Parent: FEAT-002 · Rows: 17 · IDs: R-110, R-114–R-119, R-121, R-137, R-140, R-798, R-807
    - **SUB-003 · Frame recent and stale context**
      Purpose: Label summary authority and replace stale content with a readable, correctly bounded pointer.
      Parent: FEAT-002 · Rows: 10 · IDs: R-122, R-124–R-129, R-189, R-802
    - **SUB-004 · Use custom and legacy locations safely**
      Purpose: Resolve custom paths and reject unsafe or legacy locations without overwriting their contents.
      Parent: FEAT-002 · Rows: 14 · IDs: R-130–R-136, R-142, R-245, R-248, R-805, R-828, R-880
    - **SUB-005 · Keep next steps and open decisions current**
      Purpose: Inspect the HANDOFF frontier for oversized or stale entries and preserve unresolved owner questions across sessions.
      Parent: FEAT-002 · Rows: 8 · IDs: R-682, R-873–R-879
  - **FEAT-003 · Index and connect existing knowledge sources**
    Purpose: Discover, index and connect existing knowledge sources so relevant material can be retrieved across projects.
    Parent: CAP-01 · Rows: 35 · IDs: R-200–R-216, R-232, R-235, R-240, R-347, R-386, R-871, R-881–R-885, R-894, R-933–R-935
  - **FEAT-004 · Retrieve relevant context with provenance**
    Purpose: Surface bounded, relevant knowledge pointers at the right moment with source framing and predictable failure behavior.
    Parent: CAP-01 · Rows: 31 · IDs: R-217–R-231, R-233, R-237–R-239, R-886–R-893, R-895–R-897
  - **FEAT-005 · Communicate decisions clearly**
    Purpose: Deliver the preferred writing guidance and check report readability and structure.
    Parent: CAP-01 · Rows: 16 · IDs: R-376, R-690, R-742–R-755
- **CAP-02 · Deliver controlled changes**
  Purpose: Give builders, reviewers and the integration step separate responsibilities and concrete records.
  Parent: — · Rows: 0 · IDs: —
  - **FEAT-006 · Launch builders with execution limits**
    Purpose: Launch workers in identified worktrees with the current argument, lock, time and selected tool-write limits; semantic change scope is a separate proposed feature.
    Parent: CAP-02 · Rows: 15 · IDs: R-285, R-628, R-683, R-732–R-735, R-847, R-960–R-963, R-965
  - **FEAT-007 · Review a specific revision independently**
    Purpose: Review an identified snapshot with controlled rounds, role isolation, liveness and attributable verdicts.
    Parent: CAP-02 · Rows: 0 · IDs: —
    - **SUB-006 · Identify and freeze the review target**
      Purpose: Name the review item, derive its content revision and materialize the intended snapshot with explicit scope limits.
      Parent: FEAT-007 · Rows: 17 · IDs: R-621, R-624, R-703–R-706, R-708–R-710, R-712, R-832, R-835, R-967
    - **SUB-007 · Admit rounds and enforce the budget**
      Purpose: Count revisions consistently, reserve available rounds, reclaim eligible reservations and record cap overrides.
      Parent: FEAT-007 · Rows: 18 · IDs: R-192, R-707, R-711, R-714–R-716, R-719, R-726, R-729, R-834, R-837, R-840–R-842, R-850, R-971
    - **SUB-008 · Run and stop an isolated reviewer**
      Purpose: Keep reviewer roles separate, suppress unrelated context mutation, apply watchdog and retry rules, and stop child processes cleanly.
      Parent: FEAT-007 · Rows: 14 · IDs: R-139, R-246, R-623, R-700, R-702, R-727, R-831, R-846, R-851, R-854, R-919, R-973
    - **SUB-009 · Accept and record a valid result**
      Purpose: Require the expected completion evidence and a valid reservation while invalidating results for changed review state.
      Parent: FEAT-007 · Rows: 7 · IDs: R-249, R-701, R-717, R-838, R-969
    - **SUB-010 · Protect and inspect review records**
      Purpose: Preserve the tally and log contracts, refuse unsafe output destinations and expose recorded rounds without mutation.
      Parent: FEAT-007 · Rows: 18 · IDs: R-620, R-622, R-625, R-721–R-725, R-730, R-843–R-845, R-852, R-855, R-970, R-992
  - **FEAT-008 · Integrate and clean up reviewed changes**
    Purpose: Check merge prerequisites, integrate eligible changes, record the result and remove only safe completed worktrees.
    Parent: CAP-02 · Rows: 7 · IDs: R-588, R-975–R-979, R-981
- **CAP-03 · Control trust and tool actions**
  Purpose: Make trust decisions, action restrictions and policy changes visible and predictable.
  Parent: — · Rows: 0 · IDs: —
  - **FEAT-009 · Decide which project content is trusted**
    Purpose: Represent explicit project trust, explain untrusted sources and avoid gaining trust from incidental files.
    Parent: CAP-03 · Rows: 31 · IDs: R-021–R-034, R-074–R-079, R-242, R-670–R-672, R-759–R-761, R-778, R-856
  - **FEAT-010 · Guard risky commands and protected resources**
    Purpose: Inspect supported tool actions, preserve mandatory restrictions and provide actionable approval or refusal behavior.
    Parent: CAP-03 · Rows: 45 · IDs: R-035–R-042, R-044–R-047, R-051–R-058, R-071–R-073, R-195, R-630–R-633, R-637–R-639, R-762–R-764, R-766–R-768, R-770, R-775–R-777, R-982–R-984
  - **FEAT-011 · Keep policy changes safe and recoverable**
    Purpose: Load and refresh policy configuration with defined precedence, bounded reading and safe behavior when configuration breaks.
    Parent: CAP-03 · Rows: 36 · IDs: R-043, R-048–R-050, R-059–R-070, R-080–R-083, R-193, R-196, R-634–R-636, R-765, R-769, R-772–R-774, R-780, R-826, R-829, R-865
  - **FEAT-012 · Render paths and provenance clearly**
    Purpose: Render paths, labels and provenance through the documented normalization and presentation rules.
    Parent: CAP-03 · Rows: 21 · IDs: R-174–R-188, R-819–R-824
- **CAP-04 · Bring nana to each project and maintain it**
  Purpose: Install the toolkit, adopt projects, diagnose its environment and manage its lifecycle.
  Parent: — · Rows: 0 · IDs: —
  - **FEAT-013 · Install and connect harness runtimes**
    Purpose: Install and identify the intended runtime resources, hooks, skills, commands and configuration while preserving foreign content.
    Parent: CAP-04 · Rows: 0 · IDs: —
    - **SUB-011 · Select the active runtime and home**
      Purpose: Resolve the intended executable and agent locations and provide the matching fresh-machine setup instructions.
      Parent: FEAT-013 · Rows: 11 · IDs: R-190, R-194, R-199, R-345, R-601, R-825, R-827, R-932, R-950
    - **SUB-012 · Deliver commands, hooks and workflow resources**
      Purpose: Install the shared resources and seed missing private or runtime configuration with known resource contracts.
      Parent: FEAT-013 · Rows: 23 · IDs: R-301–R-303, R-306, R-308–R-311, R-357, R-360, R-363, R-589, R-665, R-680, R-687, R-736, R-739, R-921, R-964, R-980, R-985
    - **SUB-013 · Connect hooks and packages without duplication**
      Purpose: Recognize equivalent hook commands and package registrations while retaining unrelated settings and entries.
      Parent: FEAT-013 · Rows: 14 · IDs: R-316–R-319, R-323–R-326, R-384, R-392, R-679, R-922, R-927
    - **SUB-014 · Preserve files and preview installation changes**
      Purpose: Apply idempotent and atomic writes, report dry runs accurately and refuse unsafe files or conflicting ownership.
      Parent: FEAT-013 · Rows: 24 · IDs: R-300, R-304, R-307, R-312–R-315, R-320–R-322, R-353, R-358, R-377–R-379, R-381–R-383, R-391, R-663, R-924–R-926
    - **SUB-015 · Apply the platform's supported installation**
      Purpose: Skip unsupported Windows integrations and maintain supported copies and mirrors without overwriting owner content.
      Parent: FEAT-013 · Rows: 11 · IDs: R-349–R-352, R-359, R-387, R-936, R-938, R-995
  - **FEAT-014 · Create or adopt a project workspace**
    Purpose: Seed and update the project working structure and templates, expose adoption needs and obtain the actual owner objective.
    Parent: CAP-04 · Rows: 0 · IDs: —
    - **SUB-016 · Recognize projects that need adoption**
      Purpose: Detect eligible repository roots and report actionable adoption candidates with bounded, honest and safely rendered signals.
      Parent: FEAT-014 · Rows: 24 · IDs: R-143–R-157, R-640, R-645–R-647, R-809–R-813
    - **SUB-017 · Seed a minimal project workspace**
      Purpose: Create the basic objective, handoff, session log, instructions and starter configuration while respecting the enclosing repository and bounded refresh behavior.
      Parent: FEAT-014 · Rows: 9 · IDs: R-327–R-332, R-335, R-928, R-931
    - **SUB-018 · Adopt or update shared working structure**
      Purpose: Apply the reusable structure and marker-owned instructions from their canonical sources using the documented preservation boundaries.
      Parent: FEAT-014 · Rows: 9 · IDs: R-339, R-591, R-741, R-849, R-929, R-986–R-988
    - **SUB-019 · Render language templates**
      Purpose: Provide the Python and TypeScript scaffold/adopt outputs with their shared requirement set, working instructions and clean checks.
      Parent: FEAT-014 · Rows: 7 · IDs: R-581, R-590, R-737, R-858
    - **SUB-020 · Preserve existing content and honor opt-outs**
      Purpose: Recognize existing filesystem entries, preview changes and honor an explicit decision that a repository is not a nana project.
      Parent: FEAT-014 · Rows: 6 · IDs: R-158, R-333, R-338, R-340, R-385
    - **SUB-021 · Check readiness and ratify the objective**
      Purpose: Report structural readiness and require the owner's objective and current priority before the trust step.
      Parent: FEAT-014 · Rows: 6 · IDs: R-336, R-395, R-676, R-930, R-989
  - **FEAT-015 · Diagnose the active environment**
    Purpose: Report what is installed, configured or unhealthy with concrete repair guidance and accurate active-source attribution.
    Parent: CAP-04 · Rows: 31 · IDs: R-341–R-344, R-346, R-362, R-364–R-372, R-393, R-586, R-654, R-666, R-673–R-675, R-937, R-952, R-990, R-997–R-999
  - **FEAT-016 · Start the local development desk**
    Purpose: Bind the intended pi runtime and run the local desk with appropriate platform and service behavior.
    Parent: CAP-04 · Rows: 24 · IDs: R-354–R-356, R-380, R-389, R-396–R-404, R-462, R-464, R-468, R-650–R-652, R-677
  - **FEAT-017 · Inspect durable state and follow restoration steps**
    Purpose: Inspect the durable-state manifest, export the documented state and follow its archive and restoration guidance.
    Parent: CAP-04 · Rows: 6 · IDs: R-954–R-959
  - **FEAT-018 · Update or remove managed components safely**
    Purpose: Migrate retired artifacts and remove only resources nana owns while preserving foreign or edited state.
    Parent: CAP-04 · Rows: 19 · IDs: R-394, R-653, R-660–R-662, R-664, R-668, R-804, R-900–R-909
  - **FEAT-019 · Release usable templates and report support**
    Purpose: Verify template combinations, identify delivered versions and publish accurate release and support information.
    Parent: CAP-04 · Rows: 13 · IDs: R-584, R-587, R-593–R-597, R-684, R-686, R-740, R-848, R-996
- **CAP-05 · Follow and steer development**
  Purpose: Let the developer understand ongoing and historical work and interact with the correct live session.
  Parent: — · Rows: 0 · IDs: —
  - **FEAT-020 · Find and read previous sessions**
    Purpose: Read, title, navigate and display session history while retaining correct branch identity.
    Parent: CAP-05 · Rows: 14 · IDs: R-405–R-413, R-463, R-470–R-473
  - **FEAT-021 · Choose and start an agent session**
    Purpose: Select a working directory, runtime resources, tools and trust options before launching the appropriate child.
    Parent: CAP-05 · Rows: 11 · IDs: R-198, R-414–R-418, R-475–R-478, R-685
  - **FEAT-022 · Steer and recover live sessions**
    Purpose: Deliver prompts and RPCs to the intended session, reconcile asynchronous state and handle reload, disconnect and teardown.
    Parent: CAP-05 · Rows: 25 · IDs: R-164, R-419, R-427, R-429–R-431, R-433–R-436, R-460, R-467, R-479–R-481, R-485–R-487, R-489, R-814, R-942
  - **FEAT-023 · Inspect changes and receive useful notices**
    Purpose: Show working-tree changes, readable activity and bounded output, and notify the developer when attention is needed.
    Parent: CAP-05 · Rows: 32 · IDs: R-159–R-163, R-166–R-173, R-421–R-426, R-428, R-474, R-482–R-484, R-488, R-642, R-699, R-815–R-818
  - **FEAT-024 · Edit session and project settings safely**
    Purpose: Expose supported configuration and context edits while preserving unknown fields and existing files on failure.
    Parent: CAP-05 · Rows: 7 · IDs: R-455–R-457, R-466, R-867, R-869, R-941
- **CAP-06 · Use attributable tool outputs and focused apps**
  Purpose: Give tools a consistent presentation contract and connect apps without confusing their origin or authority.
  Parent: — · Rows: 0 · IDs: —
  - **FEAT-025 · Use consistent structured tool output**
    Purpose: Validate and render supported cards, tables, charts and actions from the recognized tool carriers.
    Parent: CAP-06 · Rows: 26 · IDs: R-250–R-255, R-260–R-263, R-266–R-272, R-274–R-279, R-282–R-284
  - **FEAT-026 · Verify output provenance across session history**
    Purpose: Stamp and verify tool output, retain session signing lineage and reject forged or mismatched content.
    Parent: CAP-06 · Rows: 25 · IDs: R-256–R-259, R-264, R-273, R-280, R-437–R-446, R-451, R-491, R-945–R-947, R-949
  - **FEAT-027 · Connect and isolate focused app surfaces**
    Purpose: Load app manifests, route their tools and data, track readiness and enforce listener and request boundaries.
    Parent: CAP-06 · Rows: 23 · IDs: R-265, R-432, R-447–R-450, R-452–R-454, R-458, R-465, R-493–R-499, R-940, R-943, R-948
- **CAP-07 · Keep code and promises checkable**
  Purpose: Make requirements, code structure, checks and engineering rules inspectable with explicit limits.
  Parent: — · Rows: 0 · IDs: —
  - **FEAT-028 · Maintain requirement identity and trace links**
    Purpose: Keep stable requirement records and syntactic test links, while making the checker's limited guarantees explicit.
    Parent: CAP-07 · Rows: 12 · IDs: R-287–R-291, R-578–R-580, R-583, R-681, R-756
  - **FEAT-029 · Navigate code and investigate impact**
    Purpose: Maintain a generated module map and find candidate affected requirements through source and test relationships.
    Parent: CAP-07 · Rows: 7 · IDs: R-649, R-657, R-860–R-864
  - **FEAT-030 · Get trustworthy feedback after edits**
    Purpose: Run matching checks after file edits and communicate failures, timeouts, skipped work and evidence state correctly.
    Parent: CAP-07 · Rows: 42 · IDs: R-084–R-107, R-243, R-247, R-644, R-782–R-794, R-866, R-868
  - **FEAT-031 · Run checks reliably and without contaminating work**
    Purpose: Execute the test suite with appropriate collection, isolation, liveness, output and environmental controls.
    Parent: CAP-07 · Rows: 37 · IDs: R-544, R-600, R-602–R-619, R-626, R-648, R-689, R-898, R-910–R-918, R-993
  - **FEAT-032 · Keep instructions and documentation accurate**
    Purpose: Check documentation and skill commands against the interfaces and files they claim to describe.
    Parent: CAP-07 · Rows: 7 · IDs: R-598, R-629, R-655, R-658, R-870
  - **FEAT-033 · Adopt explicit engineering standards**
    Purpose: Keep shared configuration and module-boundary policies in one place and link their applicability to project features.
    Parent: CAP-07 · Rows: 23 · IDs: R-001–R-022, R-920
- **CAP-08 · Evaluate agent choices with credible evidence**
  Purpose: Run controlled studies and interpret results without confusing missing measurement with success.
  Parent: — · Rows: 0 · IDs: —
  - **FEAT-034 · Define reproducible comparisons**
    Purpose: Specify profiles, inputs, schedules, pins and evidence so an experiment can be resumed without changing its meaning.
    Parent: CAP-08 · Rows: 19 · IDs: R-501, R-508–R-514, R-532–R-534, R-550–R-554, R-572
  - **FEAT-035 · Account for cost and uncertainty**
    Purpose: Measure direct and nested work with consistent usage semantics and report unknown or partially priced spend explicitly.
    Parent: CAP-08 · Rows: 9 · IDs: R-503–R-506, R-546–R-549, R-557
  - **FEAT-036 · Bound study execution and paid work**
    Purpose: Preflight paid work, apply budgets and stop conditions and preserve exactly-once records during interruption.
    Parent: CAP-08 · Rows: 16 · IDs: R-500, R-515–R-521, R-541, R-545, R-555, R-558–R-560
  - **FEAT-037 · Grade behavior with trustworthy checks**
    Purpose: Separate behavioral grading from the code under evaluation and report failures and grader errors honestly.
    Parent: CAP-08 · Rows: 23 · IDs: R-507, R-522–R-531, R-543, R-561–R-571
  - **FEAT-038 · Interpret workflow experiments and their limits**
    Purpose: Analyze review and writing evidence, require stated controls and avoid changing practice beyond what the evidence supports.
    Parent: CAP-08 · Rows: 18 · IDs: R-535–R-540, R-574–R-577, R-691–R-698
