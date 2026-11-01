# Requirements tree

Generated from `REQUIREMENTS.md`; feature lifecycle and shared requirements are shown.

- **CAP-01 · Maintain direction and useful context**
  Purpose: Keep the agent aligned with the project and carry useful knowledge between work sessions.
  Parent: — · Rows: 389 · IDs: R-001–R-020, R-108–R-138, R-140–R-142, R-189, R-200–R-240, R-244, R-245, R-248, R-347, R-348, R-376, R-386, R-641, R-659, R-682, R-690, R-742–R-755, R-758, R-795–R-803, R-805–R-808, R-828, R-830, R-871–R-897, R-933–R-935, R-1410–R-1418, R-1710–R-1712, R-1910–R-1915, R-1970, R-1971, R-1973, R-2090, R-2092–R-2094, R-2160, R-2283–R-2285, R-2340–R-2346, R-2370–R-2376, R-2400–R-2409, R-2470–R-2473, R-2500–R-2510, R-2606–R-2613, R-2860–R-2863, R-2970–R-2977, R-2979, R-2990–R-2999, R-3188–R-3219, R-3230–R-3269, R-3290–R-3336, R-3340–R-3342, R-3437
  Kind: product
  Deliverables: R-001, R-108, R-873, R-201, R-217, R-749
  - **FEAT-001 · Keep goals and priorities in view**
    Purpose: Provide the governing project objective and preserve its precedence over background context.
    Status: active
    Also applies: R-021, R-022, R-122, R-191, R-634, R-687, R-781, R-819
    Parent: CAP-01 · Rows: 43 · IDs: R-001–R-020, R-641, R-659, R-758, R-1410–R-1418, R-1970, R-1971, R-1973, R-2090, R-2092–R-2094, R-2283–R-2285, R-3437
    Artifacts: A-001, A-049, A-050
    Reads: A-010, A-011, A-014
  - **FEAT-002 · Resume decisions and next actions**
    Purpose: Carry compaction summaries and a clear handoff frontier into later work without presenting past agent output as authority.
    Status: active
    Also applies: R-079, R-139, R-185, R-634, R-641, R-781
    Parent: CAP-01 · Rows: 101 · IDs: R-108–R-138, R-140–R-142, R-189, R-244, R-245, R-248, R-682, R-795–R-803, R-805–R-808, R-828, R-830, R-873–R-880, R-2160, R-2470–R-2473, R-2504–R-2510, R-2606–R-2613, R-2970–R-2977, R-2979, R-2990–R-2999
    Artifacts: A-002, A-003, A-084, A-051
    Reads: A-011, A-030, A-046, A-069
    - **SUB-001 · Write and identify a compaction summary**
      Purpose: Find the correct store, write the summary atomically and report its origin and any write failure.
      Parent: FEAT-002 · Rows: 13 · IDs: R-108, R-109, R-112, R-113, R-120, R-123, R-244, R-795–R-797, R-800, R-801, R-830
    - **SUB-002 · Resume only the appropriate summary**
      Purpose: Decide whether a summary belongs to this directory and session, distinguish missing and unreadable state, and respect role exclusions.
      Parent: FEAT-002 · Rows: 17 · IDs: R-110, R-111, R-114–R-119, R-121, R-137, R-138, R-140, R-141, R-798, R-799, R-807, R-808
    - **SUB-003 · Frame recent and stale context**
      Purpose: Label summary authority and replace stale content with a readable, correctly bounded pointer.
      Parent: FEAT-002 · Rows: 11 · IDs: R-122, R-124–R-129, R-189, R-802, R-803, R-2160
    - **SUB-004 · Use custom and legacy locations safely**
      Purpose: Resolve custom paths and reject unsafe or legacy locations without overwriting their contents.
      Parent: FEAT-002 · Rows: 14 · IDs: R-130–R-136, R-142, R-245, R-248, R-805, R-806, R-828, R-880
    - **SUB-005 · Keep next steps and open decisions current**
      Purpose: Inspect the HANDOFF frontier for oversized or stale entries and preserve unresolved owner questions across sessions.
      Parent: FEAT-002 · Rows: 46 · IDs: R-682, R-873–R-879, R-2470–R-2473, R-2504–R-2510, R-2606–R-2613, R-2970–R-2977, R-2979, R-2990–R-2999
  - **FEAT-041 · Shape each agent's context by role**
    Purpose: Give each launched agent bounded context for its role and record each delivery.
    Status: active
    Also applies: R-2560, R-2561, R-2581, R-2646, R-2647, R-2655
    Parent: CAP-01 · Rows: 10 · IDs: R-3210–R-3219
    Artifacts: A-089
  - **FEAT-003 · Index and connect existing knowledge sources**
    Purpose: Discover, index and connect existing knowledge sources so relevant material can be retrieved across projects.
    Status: active
    Also applies: R-310
    Parent: CAP-01 · Rows: 69 · IDs: R-200–R-216, R-232, R-235, R-236, R-240, R-347, R-348, R-386, R-871, R-872, R-881–R-885, R-894, R-933–R-935, R-1910–R-1915, R-2340–R-2346, R-2370–R-2376, R-2400–R-2409, R-2860–R-2863
    Artifacts: A-004, A-052, A-053
    Reads: A-055, A-062
  - **FEAT-004 · Retrieve relevant context with provenance**
    Purpose: Surface bounded, relevant knowledge pointers at the right moment with source framing and predictable failure behavior.
    Status: active
    Also applies: R-285, R-286, R-973, R-974
    Parent: CAP-01 · Rows: 34 · IDs: R-217–R-231, R-233, R-234, R-237–R-239, R-886–R-893, R-895–R-897, R-1710–R-1712
    Artifacts: A-054, A-055
    Reads: A-004, A-052
  - **FEAT-040 · Make and keep memory**
    Purpose: Turn past sessions and reviews into shaped, low-trust memory records that point back to their evidence, and keep them.
    Status: active
    Also applies: —
    Parent: CAP-01 · Rows: 85 · IDs: R-3188–R-3209, R-3230–R-3269, R-3290–R-3309, R-3340–R-3342
    Artifacts: A-088, A-090, A-091, A-093
    - **SUB-023 · Keep a private owner profile**
      Purpose: Keep what the seat learns about its owner in a private, synced store, ranked by trust the owner's words earn.
      Parent: FEAT-040 · Rows: 20 · IDs: R-3230–R-3249
    - **SUB-022 · Shape memory candidates with a model**
      Purpose: Classify owner turns and review findings with a capped, isolated model pass into the same shaped candidates, so they score against the same labels as the rules.
      Parent: FEAT-040 · Rows: 19 · IDs: R-3251–R-3269
    - **SUB-024 · Make memory when sessions and lands end**
      Purpose: Make new enabled repository units once into a private, synchronized project store through one merge step.
      Parent: FEAT-040 · Rows: 23 · IDs: R-3290–R-3309, R-3340–R-3342
  - **FEAT-043 · Measure memory outcomes**
    Purpose: Count, per window of owner interactions and pooled, owner corrections and decisions given again, review findings that recur and each role's logged context size, so memory changes are judged against a measured baseline.
    Status: active
    Also applies: —
    Parent: CAP-01 · Rows: 27 · IDs: R-3310–R-3336
    Artifacts: A-095
    Reads: A-088, A-089, A-091
  - **FEAT-005 · Communicate decisions clearly**
    Purpose: Deliver the preferred writing guidance and check report readability and structure.
    Status: active
    Also applies: R-641
    Parent: CAP-01 · Rows: 20 · IDs: R-376, R-690, R-742–R-755, R-2500–R-2503
    Artifacts: A-005
    Reads: A-011
- **CAP-02 · Deliver controlled changes**
  Purpose: Give builders, reviewers and the integration step separate responsibilities and concrete records.
  Parent: — · Rows: 322 · IDs: R-139, R-192, R-246, R-249, R-285, R-286, R-588, R-620–R-625, R-628, R-700–R-735, R-831–R-847, R-850–R-855, R-919, R-960–R-963, R-965–R-979, R-981, R-992, R-1002–R-1011, R-1105–R-1110, R-1120–R-1125, R-1140, R-1141, R-1190–R-1192, R-1212, R-1350–R-1356, R-1370–R-1378, R-1390–R-1395, R-1400–R-1407, R-1430–R-1433, R-1560–R-1565, R-1620–R-1623, R-1634, R-1636, R-1680–R-1683, R-1720–R-1723, R-1840–R-1842, R-1890–R-1893, R-2250–R-2255, R-2270–R-2273, R-2430–R-2432, R-2560–R-2576, R-2578–R-2583, R-2585–R-2592, R-2596–R-2603, R-2616–R-2621, R-2646–R-2651, R-2653–R-2655, R-2660, R-2662, R-2664, R-2665, R-2691–R-2694, R-2720–R-2728, R-2750–R-2752, R-2754–R-2756, R-2803, R-2810–R-2816, R-2900–R-2908, R-2910–R-2913, R-2950–R-2956, R-3010–R-3013, R-3020–R-3026, R-3030, R-3031, R-3070, R-3430–R-3432, R-3434–R-3436
  Kind: product
  Deliverables: R-1400, R-1008, R-1560, R-977, R-2597, R-2811
  - **FEAT-006 · Launch builders with execution limits**
    Purpose: Launch workers in identified worktrees with the current argument, lock, time and selected tool-write limits, and keep one record of each build; semantic change scope is a separate proposed feature.
    Status: active
    Also applies: R-137, R-623, R-700, R-702, R-728, R-831, R-846, R-1890, R-1891, R-1892, R-1893, R-2584, R-2652
    Parent: CAP-02 · Rows: 114 · IDs: R-285, R-286, R-628, R-732–R-735, R-847, R-960–R-963, R-965, R-966, R-1110, R-1120–R-1125, R-1140, R-1141, R-1190–R-1192, R-1212, R-1400–R-1407, R-1430–R-1433, R-1634, R-1636, R-2270–R-2273, R-2578–R-2583, R-2585, R-2596–R-2603, R-2616–R-2621, R-2646–R-2651, R-2653–R-2655, R-2662, R-2664, R-2665, R-2691–R-2694, R-2720–R-2728, R-2803, R-2950–R-2956, R-3010–R-3013, R-3020–R-3026, R-3030, R-3031, R-3070, R-3436
    Artifacts: A-006, A-079, A-080, A-083
    Reads: A-010, A-011, A-023, A-051, A-061
  - **FEAT-007 · Review a specific revision independently**
    Purpose: Review an identified snapshot with controlled rounds, role isolation, liveness and attributable verdicts.
    Status: active
    Also applies: R-137, R-2603, R-1125
    Parent: CAP-02 · Rows: 165 · IDs: R-139, R-192, R-246, R-249, R-620–R-625, R-700–R-731, R-831–R-846, R-850–R-855, R-919, R-967–R-974, R-992, R-1008, R-1010, R-1105–R-1108, R-1350–R-1354, R-1370–R-1378, R-1390–R-1395, R-1560–R-1565, R-1620–R-1623, R-1680–R-1683, R-1720–R-1723, R-1840–R-1842, R-1890–R-1893, R-2250–R-2255, R-2430–R-2432, R-2560–R-2576, R-2660, R-2900–R-2908, R-2910–R-2913
    Artifacts: A-007, A-008, A-056, A-057, A-058
    Reads: A-011
    - **SUB-006 · Identify and freeze the review target**
      Purpose: Name the review item, derive its content revision and materialize the intended snapshot with explicit scope limits.
      Parent: FEAT-007 · Rows: 27 · IDs: R-621, R-624, R-703–R-706, R-708–R-710, R-712, R-713, R-832, R-833, R-835, R-836, R-967, R-968, R-1352, R-1370–R-1378
    - **SUB-007 · Admit rounds and enforce the budget**
      Purpose: Count revisions consistently, reserve available rounds, reclaim eligible reservations and record cap overrides.
      Parent: FEAT-007 · Rows: 18 · IDs: R-192, R-707, R-711, R-714–R-716, R-719, R-720, R-726, R-729, R-834, R-837, R-840–R-842, R-850, R-971, R-972
    - **SUB-008 · Run and stop an isolated reviewer**
      Purpose: Keep reviewer roles separate, suppress unrelated context mutation, apply watchdog and retry rules, and stop child processes cleanly.
      Parent: FEAT-007 · Rows: 64 · IDs: R-139, R-246, R-623, R-700, R-702, R-727, R-728, R-831, R-846, R-851, R-854, R-919, R-973, R-974, R-1105–R-1108, R-1353, R-1354, R-1390–R-1395, R-1680–R-1683, R-1720–R-1723, R-1890–R-1893, R-2250–R-2255, R-2430–R-2432, R-2560–R-2567, R-2900–R-2908
    - **SUB-009 · Accept and record a valid result**
      Purpose: Require the expected completion evidence and a valid reservation while invalidating results for changed review state.
      Parent: FEAT-007 · Rows: 12 · IDs: R-249, R-701, R-717, R-718, R-838, R-839, R-969, R-1010, R-1620–R-1623
    - **SUB-010 · Protect and inspect review records**
      Purpose: Preserve the tally and log contracts, refuse unsafe output destinations and expose recorded rounds without mutation.
      Parent: FEAT-007 · Rows: 44 · IDs: R-620, R-622, R-625, R-721–R-725, R-730, R-731, R-843–R-845, R-852, R-853, R-855, R-970, R-992, R-1008, R-1350, R-1351, R-1560–R-1565, R-1840–R-1842, R-2568–R-2576, R-2660, R-2910–R-2913
  - **FEAT-008 · Integrate and clean up reviewed changes**
    Purpose: Check merge prerequisites, integrate only changes every reviewer accepted, and remove only safe completed worktrees.
    Status: active
    Also applies: R-705, R-708, R-717, R-969, R-992, R-1008
    Parent: CAP-02 · Rows: 43 · IDs: R-588, R-975–R-979, R-981, R-1002–R-1007, R-1009, R-1011, R-1109, R-1355, R-1356, R-2586–R-2592, R-2750–R-2752, R-2754–R-2756, R-2810–R-2816, R-3430–R-3432, R-3434, R-3435
    Artifacts: A-009, A-059, A-082
    Reads: A-007, A-021, A-034, A-008, A-022
- **CAP-03 · Control trust and tool actions**
  Purpose: Make trust decisions, action restrictions and policy changes visible and predictable.
  Parent: — · Rows: 187 · IDs: R-021–R-083, R-174–R-188, R-193, R-195–R-197, R-242, R-630–R-639, R-670–R-672, R-759–R-781, R-819–R-824, R-826, R-829, R-856, R-857, R-865, R-982–R-984, R-1062, R-1490–R-1496, R-1730–R-1739, R-1800, R-1801, R-2240–R-2243, R-2330–R-2338, R-2350–R-2357, R-2360–R-2364, R-2490–R-2497
  Kind: constraint
  Binds: CAP-01, CAP-02, CAP-04, CAP-05, CAP-07
  - **FEAT-009 · Decide which project content is trusted**
    Purpose: Represent explicit project trust, explain untrusted sources and avoid gaining trust from incidental files.
    Status: active
    Also applies: R-069, R-190
    Parent: CAP-03 · Rows: 33 · IDs: R-021–R-034, R-074–R-079, R-242, R-670–R-672, R-759–R-761, R-778, R-779, R-856, R-857, R-1800, R-1801
    Artifacts: A-010
    Reads: A-069
  - **FEAT-010 · Guard risky commands and protected resources**
    Purpose: Inspect supported tool actions, preserve mandatory restrictions and provide actionable approval or refusal behavior.
    Status: active
    Also applies: R-033, R-079, R-081, R-183, R-184, R-190, R-774, R-962
    Parent: CAP-03 · Rows: 92 · IDs: R-035–R-042, R-044–R-047, R-051–R-058, R-071–R-073, R-195, R-630–R-633, R-637–R-639, R-762–R-764, R-766–R-768, R-770, R-771, R-775–R-777, R-982–R-984, R-1062, R-1490–R-1496, R-1730–R-1739, R-2240–R-2243, R-2330–R-2338, R-2350–R-2357, R-2490–R-2497
    Reads: A-011, A-069
  - **FEAT-011 · Keep policy changes safe and recoverable**
    Purpose: Load and refresh policy configuration with defined precedence, bounded reading and safe behavior when configuration breaks.
    Status: active
    Also applies: R-074, R-078, R-188, R-190, R-195, R-778
    Parent: CAP-03 · Rows: 41 · IDs: R-043, R-048–R-050, R-059–R-070, R-080–R-083, R-193, R-196, R-197, R-634–R-636, R-765, R-769, R-772–R-774, R-780, R-781, R-826, R-829, R-865, R-2360–R-2364
    Reads: A-011, A-069
  - **FEAT-012 · Render paths and provenance clearly**
    Purpose: Render paths, labels and provenance through the documented normalization and presentation rules.
    Status: active
    Also applies: R-224
    Parent: CAP-03 · Rows: 21 · IDs: R-174–R-188, R-819–R-824
- **CAP-04 · Bring nana to each project and maintain it**
  Purpose: Install the toolkit, adopt projects, diagnose its environment and manage its lifecycle.
  Parent: — · Rows: 593 · IDs: R-143–R-158, R-190, R-191, R-194, R-199, R-300–R-346, R-349–R-372, R-377–R-385, R-387–R-404, R-462, R-464, R-468, R-469, R-581, R-582, R-584–R-587, R-589–R-597, R-640, R-645–R-647, R-650–R-654, R-660–R-669, R-673–R-679, R-683, R-684, R-686–R-688, R-736–R-741, R-804, R-809–R-813, R-825, R-827, R-848, R-849, R-858, R-859, R-900–R-909, R-921–R-932, R-936–R-939, R-950–R-959, R-964, R-980, R-985–R-991, R-995–R-999, R-1031–R-1037, R-1039, R-1050, R-1051, R-1053–R-1061, R-1063, R-1064, R-1070–R-1084, R-1090–R-1094, R-1096, R-1100–R-1104, R-1111, R-1126–R-1128, R-1142, R-1150–R-1153, R-1193, R-1205–R-1209, R-1213, R-1214, R-1300, R-1310–R-1313, R-1320, R-1321, R-1330, R-1340, R-1360, R-1420–R-1426, R-1440–R-1443, R-1530, R-1531, R-1540–R-1546, R-1580–R-1586, R-1590–R-1593, R-1600–R-1606, R-1610–R-1618, R-1670, R-1690, R-1713, R-1750–R-1752, R-1760–R-1766, R-1780–R-1782, R-1790–R-1796, R-1810–R-1812, R-1850–R-1855, R-1860, R-1861, R-1870, R-1871, R-1880–R-1889, R-1900–R-1904, R-1930–R-1932, R-1940–R-1944, R-1972, R-1974, R-1980–R-1985, R-1990–R-1997, R-2000–R-2004, R-2010–R-2015, R-2020–R-2027, R-2050–R-2052, R-2060, R-2061, R-2070–R-2076, R-2080–R-2085, R-2091, R-2130–R-2133, R-2180–R-2184, R-2200–R-2205, R-2230–R-2237, R-2260–R-2263, R-2280–R-2282, R-2290–R-2294, R-2300–R-2303, R-2310–R-2313, R-2315–R-2318, R-2320–R-2325, R-2390–R-2394, R-2397, R-2398, R-2410–R-2412, R-2420–R-2423, R-2498, R-2499, R-2556–R-2559, R-2577, R-2584, R-2623–R-2628, R-2652, R-2671–R-2674, R-2681–R-2687, R-2701–R-2705, R-2711–R-2717, R-2760–R-2765, R-2850–R-2852, R-2870–R-2872, R-2890–R-2895
  Kind: product
  Deliverables: R-301, R-327, R-1150, R-341, R-1070, R-596
  - **FEAT-013 · Install and connect harness runtimes**
    Purpose: Install and identify the intended runtime resources, hooks, skills, commands and configuration while preserving foreign content.
    Status: active
    Also applies: R-004
    Parent: CAP-04 · Rows: 217 · IDs: R-190, R-191, R-194, R-199, R-300–R-326, R-345, R-349–R-353, R-357–R-361, R-363, R-378, R-379, R-381–R-384, R-387, R-388, R-391, R-392, R-589, R-663, R-665, R-679, R-687, R-688, R-736, R-739, R-825, R-827, R-921–R-927, R-932, R-936, R-938, R-939, R-950, R-951, R-964, R-980, R-985, R-995, R-1033–R-1036, R-1039, R-1050, R-1051, R-1053, R-1054, R-1058, R-1061, R-1063, R-1064, R-1093, R-1094, R-1111, R-1128, R-1205–R-1208, R-1330, R-1340, R-1420–R-1426, R-1546, R-1590–R-1593, R-1610–R-1618, R-1690, R-1713, R-1850–R-1852, R-1860, R-1861, R-1870, R-1871, R-1880–R-1889, R-1900–R-1904, R-1930–R-1932, R-1940–R-1944, R-1981, R-1982, R-1984, R-2010–R-2015, R-2020, R-2022–R-2027, R-2080–R-2083, R-2130–R-2133, R-2200–R-2202, R-2205, R-2260–R-2263, R-2282, R-2290, R-2291, R-2300–R-2303, R-2390–R-2394, R-2397, R-2398, R-2498, R-2499, R-2671–R-2674, R-2704, R-2716, R-2717, R-2890–R-2895
    Artifacts: A-011, A-012, A-013, A-060, A-061, A-062, A-063, A-064, A-065, A-066, A-081
    Reads: A-004, A-005, A-036, A-037, A-049, A-080
    - **SUB-011 · Select the active runtime and home**
      Purpose: Resolve the intended executable and agent locations and provide the matching fresh-machine setup instructions.
      Parent: FEAT-013 · Rows: 26 · IDs: R-190, R-191, R-194, R-199, R-345, R-825, R-827, R-932, R-950, R-951, R-1093, R-1094, R-1111, R-1546, R-1850–R-1852, R-2390–R-2394, R-2397, R-2398, R-2716, R-2717
    - **SUB-012 · Deliver commands, hooks and workflow resources**
      Purpose: Install the shared resources and seed missing private or runtime configuration with known resource contracts.
      Parent: FEAT-013 · Rows: 47 · IDs: R-301–R-303, R-306, R-308–R-311, R-357, R-360, R-361, R-363, R-589, R-665, R-687, R-688, R-736, R-739, R-921, R-964, R-980, R-985, R-1054, R-1064, R-1128, R-1205–R-1207, R-1940–R-1944, R-2010–R-2015, R-2200, R-2201, R-2282, R-2498, R-2671–R-2674
    - **SUB-013 · Connect hooks and packages without duplication**
      Purpose: Recognize equivalent hook commands and package registrations while retaining unrelated settings and entries.
      Parent: FEAT-013 · Rows: 51 · IDs: R-316–R-319, R-323–R-326, R-384, R-392, R-679, R-922, R-923, R-927, R-1033–R-1036, R-1039, R-1061, R-1208, R-1690, R-1880–R-1889, R-1981, R-1984, R-2020, R-2022–R-2027, R-2130–R-2133, R-2202, R-2205, R-2300–R-2303
    - **SUB-014 · Preserve files and preview installation changes**
      Purpose: Apply idempotent and atomic writes, report dry runs accurately and refuse unsafe files or conflicting ownership.
      Parent: FEAT-013 · Rows: 44 · IDs: R-300, R-304, R-305, R-307, R-312–R-315, R-320–R-322, R-353, R-358, R-378, R-379, R-381–R-383, R-391, R-663, R-924–R-926, R-1590–R-1593, R-1870, R-1871, R-1930–R-1932, R-1982, R-2080–R-2083, R-2260–R-2263, R-2290, R-2291, R-2704
    - **SUB-015 · Apply the platform's supported installation**
      Purpose: Wire supported Windows integrations in their platform form, skip unsupported ones, and maintain supported copies and mirrors without overwriting owner content.
      Parent: FEAT-013 · Rows: 49 · IDs: R-349–R-352, R-359, R-387, R-388, R-936, R-938, R-939, R-995, R-1050, R-1051, R-1053, R-1058, R-1063, R-1330, R-1340, R-1420–R-1426, R-1610–R-1618, R-1713, R-1860, R-1861, R-1900–R-1904, R-2499, R-2890–R-2895
  - **FEAT-014 · Create or adopt a project workspace**
    Purpose: Seed and update the project working structure and templates, expose adoption needs and obtain the actual owner objective.
    Status: active
    Also applies: R-345, R-383, R-578, R-579, R-583, R-673, R-674, R-681, R-687, R-740, R-1000, R-1001
    Parent: CAP-04 · Rows: 116 · IDs: R-143–R-158, R-327–R-340, R-385, R-395, R-581, R-582, R-590–R-592, R-640, R-645–R-647, R-676, R-683, R-737, R-738, R-741, R-809–R-813, R-849, R-858, R-859, R-928–R-931, R-986–R-989, R-1100–R-1104, R-1126, R-1127, R-1142, R-1150–R-1153, R-1193, R-1213, R-1214, R-1300, R-1310–R-1312, R-1321, R-1360, R-1440–R-1443, R-1670, R-1780–R-1782, R-2050–R-2052, R-2420–R-2423, R-2559, R-2584, R-2623–R-2628, R-2652, R-2760–R-2765, R-2850–R-2852
    Artifacts: A-014, A-015, A-046, A-047, A-067, A-068, A-069, A-070
    Reads: A-002, A-003, A-004, A-011, A-025, A-038
    - **SUB-016 · Recognize projects that need adoption**
      Purpose: Detect eligible repository roots and report actionable adoption candidates with bounded, honest and safely rendered signals.
      Parent: FEAT-014 · Rows: 37 · IDs: R-143–R-157, R-640, R-645–R-647, R-809–R-813, R-2623–R-2627, R-2760, R-2761, R-2763–R-2765, R-2850–R-2852
    - **SUB-017 · Seed a minimal project workspace**
      Purpose: Create the basic objective, handoff, session log, instructions and starter configuration while respecting the enclosing repository and bounded refresh behavior.
      Parent: FEAT-014 · Rows: 12 · IDs: R-327–R-332, R-335, R-928, R-931, R-1310–R-1312
    - **SUB-018 · Adopt or update shared working structure**
      Purpose: Apply the reusable structure and marker-owned instructions from their canonical sources using the documented preservation boundaries.
      Parent: FEAT-014 · Rows: 12 · IDs: R-339, R-591, R-592, R-741, R-849, R-929, R-986–R-988, R-1780–R-1782
    - **SUB-019 · Render language templates**
      Purpose: Provide the Python and TypeScript scaffold/adopt outputs with their shared requirement set, working instructions and clean checks.
      Parent: FEAT-014 · Rows: 33 · IDs: R-581, R-582, R-590, R-683, R-737, R-738, R-858, R-859, R-1100–R-1104, R-1126, R-1127, R-1142, R-1150–R-1153, R-1193, R-1213, R-1214, R-1300, R-1321, R-1360, R-1440–R-1443, R-2559, R-2584, R-2652
    - **SUB-020 · Preserve existing content and honor opt-outs**
      Purpose: Recognize existing filesystem entries, preview changes and honor an explicit decision that a repository is not a nana project.
      Parent: FEAT-014 · Rows: 8 · IDs: R-158, R-333, R-334, R-338, R-340, R-385, R-2420, R-2421
    - **SUB-021 · Check readiness and ratify the objective**
      Purpose: Report structural readiness and require the owner's objective and current priority before the trust step.
      Parent: FEAT-014 · Rows: 14 · IDs: R-336, R-337, R-395, R-676, R-930, R-989, R-1670, R-2050–R-2052, R-2422, R-2423, R-2628, R-2762
  - **FEAT-015 · Diagnose the active environment**
    Purpose: Report what is installed, configured or unhealthy with concrete repair guidance and accurate active-source attribution.
    Status: active
    Also applies: R-193, R-307, R-347, R-378, R-392, R-589, R-650, R-909, R-959, R-964, R-980, R-985, R-2023, R-2024
    Parent: CAP-04 · Rows: 164 · IDs: R-341–R-344, R-346, R-362, R-364–R-372, R-377, R-393, R-399, R-586, R-654, R-666, R-667, R-673–R-675, R-937, R-952, R-953, R-990, R-991, R-997–R-999, R-1037, R-1055, R-1057, R-1060, R-1070–R-1077, R-1079–R-1084, R-1096, R-1209, R-1540–R-1545, R-1580–R-1586, R-1600–R-1606, R-1750–R-1752, R-1760–R-1766, R-1790–R-1796, R-1810–R-1812, R-1853–R-1855, R-1972, R-1974, R-1980, R-1983, R-1990–R-1997, R-2000–R-2004, R-2021, R-2070–R-2076, R-2084, R-2085, R-2091, R-2180–R-2183, R-2230–R-2237, R-2280, R-2281, R-2292–R-2294, R-2320–R-2325, R-2410–R-2412, R-2681–R-2687, R-2701–R-2703, R-2705, R-2713–R-2715
    Artifacts: A-022, A-048
    Reads: A-001, A-004, A-006, A-007, A-009, A-010, A-011, A-012, A-013, A-016, A-021, A-025, A-052, A-053, A-054, A-058, A-060, A-061, A-062, A-063, A-064, A-065, A-066, A-069, A-071, A-079
  - **FEAT-016 · Start the local development desk**
    Purpose: Bind the intended pi runtime and run the local desk with appropriate platform and service behavior.
    Status: frozen (the owner 2026-10-10: the desk stays frozen until he reopens it)
    Also applies: R-199
    Parent: CAP-04 · Rows: 23 · IDs: R-354–R-356, R-380, R-389, R-390, R-396–R-398, R-400–R-404, R-462, R-464, R-468, R-469, R-650–R-652, R-677, R-678
    Artifacts: A-016, A-017
  - **FEAT-017 · Inspect durable state and follow restoration steps**
    Purpose: Inspect the durable-state manifest, export the documented state and follow its archive and restoration guidance.
    Status: active
    Also applies: —
    Parent: CAP-04 · Rows: 9 · IDs: R-954–R-959, R-2870–R-2872
    Artifacts: A-018
    Reads: A-010
  - **FEAT-018 · Update or remove managed components safely**
    Purpose: Migrate retired artifacts and remove only resources nana owns while preserving foreign or edited state.
    Status: active
    Also applies: R-378, R-663
    Parent: CAP-04 · Rows: 33 · IDs: R-394, R-653, R-660–R-662, R-664, R-668, R-669, R-804, R-900–R-909, R-1056, R-1059, R-1985, R-2184, R-2203, R-2204, R-2310–R-2313, R-2315–R-2318
    Artifacts: A-019, A-020
    Reads: A-001, A-011, A-012, A-013, A-016, A-050, A-060, A-061, A-062, A-063, A-065, A-066
  - **FEAT-019 · Release usable templates and report support**
    Purpose: Verify template combinations, identify delivered versions and publish accurate release and support information.
    Status: active
    Also applies: —
    Parent: CAP-04 · Rows: 31 · IDs: R-584, R-585, R-587, R-593–R-597, R-684, R-686, R-740, R-848, R-996, R-1031, R-1032, R-1078, R-1090–R-1092, R-1313, R-1320, R-1530, R-1531, R-2060, R-2061, R-2556–R-2558, R-2577, R-2711, R-2712
    Artifacts: A-021
    Reads: A-009, A-022
- **CAP-05 · Follow and steer development**
  Purpose: Let the developer understand ongoing and historical work and interact with the correct live session.
  Parent: — · Rows: 108 · IDs: R-159–R-173, R-198, R-405–R-431, R-433–R-436, R-455–R-457, R-460, R-461, R-463, R-466, R-467, R-470–R-490, R-642, R-643, R-685, R-689, R-814–R-818, R-867, R-869, R-941, R-942, R-1194–R-1204, R-1210, R-1211, R-1215, R-2140, R-2141, R-2380–R-2382
  Kind: product
  Deliverables: R-406, R-422, R-159, R-1194, R-457
  - **FEAT-020 · Find and read previous sessions**
    Purpose: Read, title, navigate and display session history while retaining correct branch identity.
    Status: frozen (the owner 2026-10-10: the desk stays frozen until he reopens it)
    Also applies: R-401, R-458, R-459
    Parent: CAP-05 · Rows: 14 · IDs: R-405–R-413, R-463, R-470–R-473
    Artifacts: A-023
  - **FEAT-021 · Choose and start an agent session**
    Purpose: Select a working directory, runtime resources, tools and trust options before launching the appropriate child.
    Status: frozen (the owner 2026-10-10: the desk stays frozen until he reopens it)
    Also applies: R-404, R-459, R-944
    Parent: CAP-05 · Rows: 11 · IDs: R-198, R-414–R-418, R-475–R-478, R-685
    Artifacts: A-024
  - **FEAT-022 · Steer and recover live sessions**
    Purpose: Deliver prompts and RPCs to the intended session, reconcile asynchronous state and handle reload, disconnect and teardown.
    Status: frozen (the owner 2026-10-10: the desk stays frozen until he reopens it)
    Also applies: R-426, R-458, R-459
    Parent: CAP-05 · Rows: 26 · IDs: R-164, R-165, R-419, R-420, R-427, R-429–R-431, R-433–R-436, R-460, R-461, R-467, R-479–R-481, R-484–R-487, R-489, R-490, R-689, R-942
  - **FEAT-023 · Inspect changes and receive useful notices**
    Purpose: Show working-tree changes, readable activity and bounded output, and notify the developer when attention is needed.
    Status: active
    Also applies: R-458, R-484, R-781, R-810
    Parent: CAP-05 · Rows: 50 · IDs: R-159–R-163, R-166–R-173, R-421–R-426, R-428, R-474, R-482, R-483, R-488, R-642, R-643, R-814–R-818, R-1194–R-1204, R-1210, R-1211, R-1215, R-2140, R-2141, R-2380–R-2382
    Artifacts: A-025
    Reads: A-011, A-069
  - **FEAT-024 · Edit session and project settings safely**
    Purpose: Expose supported configuration and context edits while preserving unknown fields and existing files on failure.
    Status: frozen (the owner 2026-10-10: the desk stays frozen until he reopens it)
    Also applies: R-458, R-459
    Parent: CAP-05 · Rows: 7 · IDs: R-455–R-457, R-466, R-867, R-869, R-941
    Artifacts: A-071
    Reads: A-011, A-064, A-069
- **CAP-06 · Use attributable tool outputs and focused apps**
  Purpose: Give tools a consistent presentation contract and connect apps without confusing their origin or authority.
  Parent: — · Rows: 72 · IDs: R-250–R-284, R-432, R-437–R-454, R-458, R-459, R-465, R-491–R-499, R-940, R-943–R-947
  Kind: product
  Deliverables: R-260, R-256, R-257, R-437, R-264
  - **FEAT-025 · Use consistent structured tool output**
    Purpose: Validate and render supported cards, tables, charts and actions from the recognized tool carriers.
    Status: active
    Also applies: R-256
    Parent: CAP-06 · Rows: 26 · IDs: R-250–R-255, R-260–R-263, R-266–R-272, R-274–R-279, R-282–R-284
  - **FEAT-026 · Verify output provenance across session history**
    Purpose: Stamp and verify tool output, retain session signing lineage and reject forged or mismatched content.
    Status: frozen (the owner 2026-10-10: the desk stays frozen until he reopens it)
    Also applies: R-283, R-284
    Parent: CAP-06 · Rows: 24 · IDs: R-256–R-259, R-264, R-273, R-280, R-281, R-437–R-446, R-451, R-491, R-492, R-945–R-947
    Artifacts: A-028
    Reads: A-023
  - **FEAT-027 · Connect and isolate focused app surfaces**
    Purpose: Load app manifests, route their tools and data, track readiness and enforce listener and request boundaries.
    Status: frozen (the owner 2026-10-10: the desk stays frozen until he reopens it)
    Also applies: R-461
    Parent: CAP-06 · Rows: 22 · IDs: R-265, R-432, R-447–R-450, R-452–R-454, R-458, R-459, R-465, R-493–R-499, R-940, R-943, R-944
    Artifacts: A-029
- **CAP-07 · Keep code and promises checkable**
  Purpose: Make requirements, code structure, checks and engineering rules inspectable with explicit limits.
  Parent: — · Rows: 581 · IDs: R-084–R-107, R-243, R-247, R-287–R-294, R-544, R-578–R-580, R-583, R-598–R-619, R-626, R-627, R-629, R-644, R-648, R-649, R-655–R-658, R-680, R-681, R-756, R-757, R-782–R-794, R-860–R-864, R-866, R-868, R-870, R-898, R-899, R-910–R-918, R-920, R-948, R-949, R-993, R-994, R-1000, R-1001, R-1012–R-1030, R-1038, R-1040–R-1043, R-1154–R-1184, R-1187, R-1230–R-1244, R-1270–R-1278, R-1301, R-1322, R-1361, R-1380–R-1383, R-1460–R-1463, R-1470–R-1477, R-1480, R-1510–R-1515, R-1521, R-1550–R-1557, R-1570, R-1571, R-1630–R-1633, R-1640–R-1643, R-1650–R-1655, R-1660–R-1665, R-1700–R-1703, R-1740–R-1743, R-1770–R-1779, R-1820, R-1920–R-1924, R-1950–R-1957, R-1960, R-1986, R-2150, R-2151, R-2170–R-2172, R-2210–R-2215, R-2396, R-2440–R-2447, R-2450–R-2454, R-2460, R-2480–R-2486, R-2511–R-2516, R-2518–R-2555, R-2631–R-2635, R-2637–R-2643, R-2656–R-2659, R-2661, R-2663, R-2666–R-2670, R-2730, R-2740–R-2745, R-2753, R-2780–R-2787, R-2790–R-2802, R-2820–R-2823, R-2830–R-2834, R-2837, R-2880–R-2885, R-2920–R-2925, R-2927, R-2930–R-2933, R-2960–R-2969, R-2978, R-2980–R-2986, R-3000–R-3008, R-3040–R-3043, R-3050–R-3055, R-3060–R-3067, R-3071–R-3074, R-3080–R-3082, R-3100–R-3110, R-3120–R-3134, R-3139–R-3150, R-3152–R-3160, R-3170–R-3187, R-3433, G-001–G-022
  Kind: product
  Deliverables: R-291, R-1460, R-1014, R-1272, R-616, R-1239, R-2547, R-2632
  - **FEAT-028 · Maintain requirement identity and trace links**
    Purpose: Keep stable requirement records and syntactic test links, while making the checker's limited guarantees explicit.
    Status: active
    Also applies: G-013, G-014, G-015
    Parent: CAP-07 · Rows: 100 · IDs: R-287–R-294, R-578–R-580, R-583, R-681, R-756, R-757, R-1000, R-1001, R-1157–R-1168, R-1170–R-1179, R-1181–R-1184, R-1187, R-1460–R-1463, R-1630, R-1631, R-1640–R-1643, R-1660–R-1665, R-2440–R-2447, R-2460, R-2535–R-2541, R-2639–R-2641, R-2643, R-2730, R-2780–R-2787, R-2795–R-2798, R-2830–R-2834, R-2837, R-2978
    Artifacts: A-030, A-031
    Reads: A-015, A-038
  - **FEAT-029 · Navigate code and investigate impact**
    Purpose: Maintain a generated module map, suggest precedent code for planners and find candidate affected requirements through source and test relationships.
    Status: active
    Also applies: G-004, G-007, G-008, G-009, G-010, G-011, G-019
    Parent: CAP-07 · Rows: 71 · IDs: R-649, R-860–R-864, R-1271–R-1278, R-1361, R-1550–R-1557, R-1632, R-2522–R-2534, R-2820–R-2823, R-2960–R-2969, R-3000–R-3008, R-3149, R-3150, R-3152–R-3160
    Artifacts: A-032
    Reads: A-009, A-030
  - **FEAT-030 · Get trustworthy feedback after edits**
    Purpose: Run matching checks after file edits and communicate failures, timeouts, skipped work and evidence state correctly.
    Status: active
    Also applies: R-079, R-186, R-781
    Parent: CAP-07 · Rows: 62 · IDs: R-084–R-107, R-243, R-247, R-644, R-782–R-794, R-866, R-868, R-993, R-994, R-1038, R-1700–R-1703, R-1740–R-1743, R-1820, R-2150, R-2151, R-2210–R-2215
    Reads: A-011, A-069
  - **FEAT-031 · Run checks reliably and without contaminating work**
    Purpose: Execute the test suite with appropriate collection, isolation, liveness, output and environmental controls.
    Status: active
    Also applies: —
    Parent: CAP-07 · Rows: 142 · IDs: R-544, R-600–R-619, R-626, R-627, R-648, R-898, R-899, R-910–R-918, R-948, R-949, R-1230–R-1244, R-1270, R-1322, R-1380–R-1383, R-1470–R-1477, R-1521, R-1770–R-1779, R-1920–R-1924, R-1950–R-1957, R-1960, R-1986, R-2170–R-2172, R-2396, R-2480–R-2486, R-2546–R-2555, R-2631–R-2635, R-2637, R-2638, R-2666–R-2670, R-2753, R-2880–R-2885, R-3178–R-3186, R-3433
    Artifacts: A-033, A-034, A-035
    Reads: A-009
  - **FEAT-032 · Keep instructions and documentation accurate**
    Purpose: Check documentation and skill commands against the interfaces and files they claim to describe.
    Status: active
    Also applies: G-012, G-021, G-022
    Parent: CAP-07 · Rows: 24 · IDs: R-598, R-599, R-629, R-655–R-658, R-680, R-870, R-1154–R-1156, R-1169, R-1180, R-2511–R-2516, R-2518–R-2521
    Artifacts: A-036
  - **FEAT-033 · Adopt explicit engineering standards**
    Purpose: Keep shared configuration and module-boundary policies in one place and link their applicability to project features.
    Status: active
    Also applies: R-756, R-2660, R-2662
    Parent: CAP-07 · Rows: 31 · IDs: R-920, R-1301, R-1480, R-2656–R-2659, R-2661, R-2663, G-001–G-022
    Artifacts: A-037, A-038, A-072
    Reads: A-024
  - **FEAT-039 · See the product and its decisions in one report**
    Purpose: Rebuild one report of the product, its features, their requirements and the decisions waiting on the owner, from the repo at any commit from its first build on.
    Status: active
    Also applies: R-287, R-288, R-289, R-290, R-292, R-293, R-294, R-878, R-1000
    Parent: CAP-07 · Rows: 151 · IDs: R-1012–R-1030, R-1040–R-1043, R-1510–R-1515, R-1570, R-1571, R-1633, R-1650–R-1655, R-2450–R-2454, R-2542–R-2545, R-2642, R-2740–R-2745, R-2790–R-2794, R-2799–R-2802, R-2920–R-2925, R-2927, R-2930–R-2933, R-2980–R-2986, R-3040–R-3043, R-3050–R-3055, R-3060–R-3067, R-3071–R-3074, R-3080–R-3082, R-3100–R-3110, R-3120–R-3134, R-3139–R-3148, R-3170–R-3177, R-3187
    Artifacts: A-045, A-073, A-085, A-087, A-086
    Reads: A-003, A-015, A-046, A-006, A-030, A-032, A-033
- **CAP-08 · Evaluate agent choices with credible evidence**
  Purpose: Run controlled studies and interpret results without confusing missing measurement with success.
  Parent: — · Rows: 106 · IDs: R-500–R-543, R-545–R-577, R-691–R-699, R-1095, R-1500–R-1504, R-1520, R-2517, R-2770–R-2772, R-3270–R-3278
  Kind: product
  Deliverables: R-509, R-532, R-507, R-535, R-536, R-694, R-3270
  - **FEAT-034 · Define reproducible comparisons**
    Purpose: Specify profiles, inputs, schedules, pins and evidence so an experiment can be resumed without changing its meaning.
    Status: active
    Also applies: —
    Parent: CAP-08 · Rows: 21 · IDs: R-501, R-502, R-508–R-514, R-532–R-534, R-551–R-554, R-573, R-1095, R-2770–R-2772
    Artifacts: A-039, A-074
    Reads: A-042
  - **FEAT-035 · Account for cost and uncertainty**
    Purpose: Measure direct and nested work with consistent usage semantics and report unknown or partially priced spend explicitly.
    Status: active
    Also applies: —
    Parent: CAP-08 · Rows: 11 · IDs: R-503–R-506, R-535, R-546–R-550, R-557
    Artifacts: A-040
    Reads: A-042
  - **FEAT-036 · Bound study execution and paid work**
    Purpose: Preflight paid work, apply budgets and stop conditions and preserve exactly-once records during interruption.
    Status: active
    Also applies: —
    Parent: CAP-08 · Rows: 21 · IDs: R-500, R-515–R-521, R-541, R-542, R-545, R-555, R-556, R-558–R-560, R-1500–R-1504
    Artifacts: A-041
    Reads: A-042
  - **FEAT-037 · Grade behavior with trustworthy checks**
    Purpose: Separate behavioral grading from the code under evaluation and report failures and grader errors honestly.
    Status: active
    Also applies: —
    Parent: CAP-08 · Rows: 24 · IDs: R-507, R-522–R-531, R-543, R-561–R-572
    Artifacts: A-042, A-075
  - **FEAT-038 · Interpret workflow experiments and their limits**
    Purpose: Analyze review and writing evidence, require stated controls and avoid changing practice beyond what the evidence supports.
    Status: active
    Also applies: —
    Parent: CAP-08 · Rows: 20 · IDs: R-536–R-540, R-574–R-577, R-691–R-699, R-1520, R-2517
    Artifacts: A-043, A-044, A-076, A-077, A-078
  - **FEAT-042 · Measure what a builder's context is for**
    Purpose: Split real builder contexts into units labelled by function, report their cost and builder fetches, and keep spans for later cut or staged replay.
    Status: active
    Also applies: —
    Parent: CAP-08 · Rows: 9 · IDs: R-3270–R-3278
    Artifacts: A-092

| ID | Home | Also applies to | Count |
|---|---|---|---:|
| R-458 | FEAT-027 | FEAT-020, FEAT-022, FEAT-023, FEAT-024 | 4 |
| R-459 | FEAT-027 | FEAT-020, FEAT-021, FEAT-022, FEAT-024 | 4 |
| R-781 | FEAT-011 | FEAT-001, FEAT-002, FEAT-023, FEAT-030 | 4 |
| R-079 | FEAT-009 | FEAT-002, FEAT-010, FEAT-030 | 3 |
| R-190 | FEAT-013 | FEAT-009, FEAT-010, FEAT-011 | 3 |
| R-137 | FEAT-002 | FEAT-006, FEAT-007 | 2 |
| R-378 | FEAT-013 | FEAT-015, FEAT-018 | 2 |
| R-634 | FEAT-011 | FEAT-001, FEAT-002 | 2 |
| R-641 | FEAT-001 | FEAT-002, FEAT-005 | 2 |
| R-687 | FEAT-013 | FEAT-001, FEAT-014 | 2 |
| R-1000 | FEAT-028 | FEAT-014, FEAT-039 | 2 |
| R-004 | FEAT-001 | FEAT-013 | 1 |
| R-021 | FEAT-009 | FEAT-001 | 1 |
| R-022 | FEAT-009 | FEAT-001 | 1 |
| R-033 | FEAT-009 | FEAT-010 | 1 |
| R-069 | FEAT-011 | FEAT-009 | 1 |
| R-074 | FEAT-009 | FEAT-011 | 1 |
| R-078 | FEAT-009 | FEAT-011 | 1 |
| R-081 | FEAT-011 | FEAT-010 | 1 |
| R-122 | FEAT-002 | FEAT-001 | 1 |
| R-139 | FEAT-007 | FEAT-002 | 1 |
| R-183 | FEAT-012 | FEAT-010 | 1 |
| R-184 | FEAT-012 | FEAT-010 | 1 |
| R-185 | FEAT-012 | FEAT-002 | 1 |
| R-186 | FEAT-012 | FEAT-030 | 1 |
| R-188 | FEAT-012 | FEAT-011 | 1 |
| R-191 | FEAT-013 | FEAT-001 | 1 |
| R-193 | FEAT-011 | FEAT-015 | 1 |
| R-195 | FEAT-010 | FEAT-011 | 1 |
| R-199 | FEAT-013 | FEAT-016 | 1 |
| R-224 | FEAT-004 | FEAT-012 | 1 |
| R-256 | FEAT-026 | FEAT-025 | 1 |
| R-283 | FEAT-025 | FEAT-026 | 1 |
| R-284 | FEAT-025 | FEAT-026 | 1 |
| R-285 | FEAT-006 | FEAT-004 | 1 |
| R-286 | FEAT-006 | FEAT-004 | 1 |
| R-287 | FEAT-028 | FEAT-039 | 1 |
| R-288 | FEAT-028 | FEAT-039 | 1 |
| R-289 | FEAT-028 | FEAT-039 | 1 |
| R-290 | FEAT-028 | FEAT-039 | 1 |
| R-292 | FEAT-028 | FEAT-039 | 1 |
| R-293 | FEAT-028 | FEAT-039 | 1 |
| R-294 | FEAT-028 | FEAT-039 | 1 |
| R-307 | FEAT-013 | FEAT-015 | 1 |
| R-310 | FEAT-013 | FEAT-003 | 1 |
| R-345 | FEAT-013 | FEAT-014 | 1 |
| R-347 | FEAT-003 | FEAT-015 | 1 |
| R-383 | FEAT-013 | FEAT-014 | 1 |
| R-392 | FEAT-013 | FEAT-015 | 1 |
| R-401 | FEAT-016 | FEAT-020 | 1 |
| R-404 | FEAT-016 | FEAT-021 | 1 |
| R-426 | FEAT-023 | FEAT-022 | 1 |
| R-461 | FEAT-022 | FEAT-027 | 1 |
| R-484 | FEAT-022 | FEAT-023 | 1 |
| R-578 | FEAT-028 | FEAT-014 | 1 |
| R-579 | FEAT-028 | FEAT-014 | 1 |
| R-583 | FEAT-028 | FEAT-014 | 1 |
| R-589 | FEAT-013 | FEAT-015 | 1 |
| R-623 | FEAT-007 | FEAT-006 | 1 |
| R-650 | FEAT-016 | FEAT-015 | 1 |
| R-663 | FEAT-013 | FEAT-018 | 1 |
| R-673 | FEAT-015 | FEAT-014 | 1 |
| R-674 | FEAT-015 | FEAT-014 | 1 |
| R-681 | FEAT-028 | FEAT-014 | 1 |
| R-700 | FEAT-007 | FEAT-006 | 1 |
| R-702 | FEAT-007 | FEAT-006 | 1 |
| R-705 | FEAT-007 | FEAT-008 | 1 |
| R-708 | FEAT-007 | FEAT-008 | 1 |
| R-717 | FEAT-007 | FEAT-008 | 1 |
| R-728 | FEAT-007 | FEAT-006 | 1 |
| R-740 | FEAT-019 | FEAT-014 | 1 |
| R-756 | FEAT-028 | FEAT-033 | 1 |
| R-774 | FEAT-011 | FEAT-010 | 1 |
| R-778 | FEAT-009 | FEAT-011 | 1 |
| R-810 | FEAT-014 | FEAT-023 | 1 |
| R-819 | FEAT-012 | FEAT-001 | 1 |
| R-831 | FEAT-007 | FEAT-006 | 1 |
| R-846 | FEAT-007 | FEAT-006 | 1 |
| R-878 | FEAT-002 | FEAT-039 | 1 |
| R-909 | FEAT-018 | FEAT-015 | 1 |
| R-944 | FEAT-027 | FEAT-021 | 1 |
| R-959 | FEAT-017 | FEAT-015 | 1 |
| R-962 | FEAT-006 | FEAT-010 | 1 |
| R-964 | FEAT-013 | FEAT-015 | 1 |
| R-969 | FEAT-007 | FEAT-008 | 1 |
| R-973 | FEAT-007 | FEAT-004 | 1 |
| R-974 | FEAT-007 | FEAT-004 | 1 |
| R-980 | FEAT-013 | FEAT-015 | 1 |
| R-985 | FEAT-013 | FEAT-015 | 1 |
| R-992 | FEAT-007 | FEAT-008 | 1 |
| R-1001 | FEAT-028 | FEAT-014 | 1 |
| R-1008 | FEAT-007 | FEAT-008 | 1 |
| R-1125 | FEAT-006 | FEAT-007 | 1 |
| R-1890 | FEAT-007 | FEAT-006 | 1 |
| R-1891 | FEAT-007 | FEAT-006 | 1 |
| R-1892 | FEAT-007 | FEAT-006 | 1 |
| R-1893 | FEAT-007 | FEAT-006 | 1 |
| R-2023 | FEAT-013 | FEAT-015 | 1 |
| R-2024 | FEAT-013 | FEAT-015 | 1 |
| R-2560 | FEAT-007 | FEAT-041 | 1 |
| R-2561 | FEAT-007 | FEAT-041 | 1 |
| R-2581 | FEAT-006 | FEAT-041 | 1 |
| R-2584 | FEAT-014 | FEAT-006 | 1 |
| R-2603 | FEAT-006 | FEAT-007 | 1 |
| R-2646 | FEAT-006 | FEAT-041 | 1 |
| R-2647 | FEAT-006 | FEAT-041 | 1 |
| R-2652 | FEAT-014 | FEAT-006 | 1 |
| R-2655 | FEAT-006 | FEAT-041 | 1 |
| R-2660 | FEAT-007 | FEAT-033 | 1 |
| R-2662 | FEAT-006 | FEAT-033 | 1 |
| G-004 | FEAT-033 | FEAT-029 | 1 |
| G-007 | FEAT-033 | FEAT-029 | 1 |
| G-008 | FEAT-033 | FEAT-029 | 1 |
| G-009 | FEAT-033 | FEAT-029 | 1 |
| G-010 | FEAT-033 | FEAT-029 | 1 |
| G-011 | FEAT-033 | FEAT-029 | 1 |
| G-012 | FEAT-033 | FEAT-032 | 1 |
| G-013 | FEAT-033 | FEAT-028 | 1 |
| G-014 | FEAT-033 | FEAT-028 | 1 |
| G-015 | FEAT-033 | FEAT-028 | 1 |
| G-019 | FEAT-033 | FEAT-029 | 1 |
| G-021 | FEAT-033 | FEAT-032 | 1 |
| G-022 | FEAT-033 | FEAT-032 | 1 |
