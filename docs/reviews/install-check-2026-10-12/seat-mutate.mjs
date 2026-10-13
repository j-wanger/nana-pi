#!/usr/bin/env node
// Seat mutation runner for lane install-check (table from CHANGE.md §5 "Mutation pairs", plus seat pairs S1-S3).
// For each pair: apply a CODE mutation in a detached scratch worktree of the lane tip, refuse when an anchor
// does not occur exactly once (ANCHOR-MISS = runner bug), syntax-check the mutated module, run the named
// test files exactly as scripts/test.mjs does (package-dir cwd, fresh HOME/TMPDIR, NANA_* and
// PI_CODING_AGENT_DIR scrubbed, --experimental-strip-types), and print RED / GREEN (SURVIVED).
//
// install-check.test.mjs quirk: its `check(title, fn)` is synchronous, so an async check prints PASS before
// it runs and a failing async check surfaces only as an unhandled rejection that kills the process (exit 1).
// So each run of that file is done twice: a VERDICT run with default flags (the suite's own view: exit code
// and FAIL lines), and an ATTRIBUTION run with --unhandled-rejections=warn-with-error-code, whose rejection
// stacks are mapped back to the enclosing check() title. A pending promise that never settles is invisible
// to both (the process just exits 0).
//
// Pair 15 runs the seat acceptance script (case (d)1) against a scratch COMMIT of the mutation, because
// acceptance (d) builds its fault worktrees from HEAD. The commit is a dangling object in a detached
// scratch worktree; no ref moves. Set SEAT_MUTATE_SKIP_ACCEPTANCE=1 to skip it.
// `probe` entries are seat double-checks run against the mutated tree with a recording fixture: they show
// what the mutated code does, so a survivor is reported only after its mutation is shown to bite.
// Never touches the lane worktree or the main checkout; scratch lives under os.tmpdir() and is removed.
// Usage: SEAT_MUTATE_OUT=<file> node ic-seat-mutate.mjs [pair-id ...]
import { spawnSync, spawn } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const LANE_REPO = "/Users/jwang/nana-pi-wt/install-check";
// The tip under test: SEAT_MUTATE_TIP, else the lane branch head (built at 7b6c650 for the first run).
const TIP = process.env.SEAT_MUTATE_TIP || "feat/install-check";
const SCRATCH = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ic-seat-mutate-")));
const WT = path.join(SCRATCH, "wt");
const RUNS = path.join(SCRATCH, "runs");
const PROBE_FIXTURE = path.join(SCRATCH, "probe-fixture.mjs");
const TIMEOUT_MS = 10 * 60 * 1000;
const ACC_TIMEOUT_MS = 60 * 60 * 1000;
const SKIP_ACC = process.env.SEAT_MUTATE_SKIP_ACCEPTANCE === "1";

const IC = "packages/nana-setup/tests/install-check.test.mjs";
const CW = "packages/nana-pack/tests/ci-workflow.test.mjs";
const ACC = "docs/reviews/install-check-2026-10-12/acceptance.mjs"; // seat acceptance, real install, minutes

const LIB = "packages/nana-setup/lib/install-check.mjs";
const CFG = "packages/nana-setup/lib/install-check-config.mjs";
const CI = ".github/workflows/ci.yml";
const SETTINGS = "packages/nana-setup/lib/settings.mjs";

// Named-case titles (substrings of the test file's check titles).
const T = {
  dispatchBoth: "dispatch chooses direct exec or platform shell",
  execNoShell: "dispatch: an entry with args runs as exec form with no shell",
  shellForm: "dispatch: an entry without args runs /bin/sh -c on POSIX and Git Bash bash -c on win32",
  slowHook: "dispatch: a hook that runs past its timeout is a FAIL whose reason prints the duration",
  shape: "hook set: a missing type, async true, a shell field, non-string args, or a missing or non-5 timeout each fail",
  objMarker: "objective: the failure marker fails even though it starts with [nana:objective]",
  knowEmpty: "knowledge: an empty output fails",
  missingRow: "hook set: a missing row fails",
  extraEntry: "hook set: an unmapped extra entry fails",
  notBash: "matcher: NotBash does not admit Bash",
  anchored: "matcher: ^Bash$ admits Bash",
  listBoth: "matcher: 'Bash, PowerShell' and 'Bash|PowerShell' admit both tools",
  envSealed: "sealed override list removes every listed key and caller npm config keys case-insensitively",
  envCase: "environment: every override variable and every caller npm_config_* variable is removed, without case on win32",
  envRedirect: "environment: HOME, USERPROFILE, TMPDIR, TEMP, TMP and npm_config_cache point into the temporary home",
  envFirst: "environment removes overrides and redirects home, temp and npm cache",
  envPerStep: "environment: every child gets the base environment plus only its own step's additions",
  pinOverride: "pin R-1071: the override list",
  cmdLine: "install: the command line carries no override flag",
  cmdSource: "install invokes real-home mode without sandbox flags",
  doctorNote: "doctor: exit 0 with a note row off the note list is a FAIL",
  piD: "pi list: D:\\ matches d:\\ on win32",
  piRel: "pi list: a relative ../../ source still matches",
  piFiltered: "pi list: a (filtered) entry fails",
  piFilteredFirst: "pi list resolves both user packages and rejects filtered entries",
  forcedPlatform: "platform: NANA_SETUP_PLATFORM in the caller changes nothing",
  exitNonZero: "reporting: a run with any FAIL line exits non-zero and a run of only PASS lines exits 0",
  listedPass: "reporting: a listed item that passes prints FAIL",
  hookEvent: "verifier: a missing hookEventName fails",
  overlap: "dispatch: the three SessionStart entries start before any of them finishes",
  cap: "output: a 10,001-character stdout fails",
  piLaunch: "pi launch: on win32, pi install, pi list and the session go through findPi and winCommand",
  wrongCode: "reporting: a listed item failing with a different code prints FAIL",
  expired: "reporting: a listed item failing on or after its expiry prints FAIL",
  formWin: "form: a shell-form entry under win32 fails",
  formDarwin: "form: an exec-form entry under darwin fails",
  recording: "spawn: every child goes through the injected spawn",
  checklist: "checklist: the check writes only the objective lines and one MEMORY.md line",
  sessionEnv: "pi session: runs with NANA_TEST_TEMP_ROOTS set empty",
  claudeDir: "dispatch: each hook runs in the fixture project with CLAUDE_PROJECT_DIR set to it",
  ciJob: "install check is a blocking macOS and Windows job before suite",
  ciRelease: "root CI runs the suite on macOS, Linux, and Windows and gates tag release",
  ciR1032: "Windows suite failure does not block release",
  acc1: "(d) the verifier entry dropped from desiredHooks",
};

const MATCH_LIST_LINE = String.raw`  if (/^[A-Za-z0-9_\- ,|]+$/.test(matcher)) return matcher.split(/[|,]/).map((s) => s.trim()).includes(tool);` + "\n";
const MATCH_REGEX_LINE = "  try { return new RegExp(matcher).test(tool); } catch { return false; }\n";
const HOOK_SET_LINE = "  if (malformedGroup || all.length !== expectedHooks.length || used.size !== expectedHooks.length)";
const OVERRIDE_LINE = "    if (OVERRIDE_ENV.some((name) => key.toLowerCase() === name.toLowerCase())) continue;";
const MEMORY_LINE = "    fs.appendFileSync(memory, `\\n- [${token}] install-check fixture memory.\\n`);\n";
const HOOK_RUN_TAIL = "    report(expected.label, code, passed, detail);\n  });\n  await Promise.all(hookRuns);";
const PI_RUN_BODY = "    if (platformName !== \"win32\") return invoke(pi, args, { cwd: project, timeout });\n    const launch = winCommand(pi, args, { comspec: childEnv.ComSpec });\n    return launch.refused ? { status: 1, stderr: launch.refused } : invoke(launch.command, launch.args, { ...launch.options, cwd: project, timeout });\n";
const SESSION_LAUNCH = "  const sessionLaunch = platformName === \"win32\" ? winCommand(pi, sessionArgs, { comspec: childEnv.ComSpec }) : { command: pi, args: sessionArgs, options: {} };";
const CLASSIFY_XFAIL = "  if (match && match.code === code && date < match.expires) return { status: \"XFAIL\", code };";
const HOOKS_DERIVED = [
  "import { desiredHooks } from \"./settings.mjs\";",
  "const FROM_INSTALLER = { \"nana-objective.mjs\": [\"hook objective\", \"objective\"], \"nana-adoption.mjs\": [\"hook adoption\", \"adoption\"], \"nana-shared-memory.mjs\": [\"hook shared memory\", \"shared memory\"], \"verifier-pipe.mjs\": [\"hook verifier pipe (Bash)\", \"verifier pipe\"], \"nana-knowledge.ts\": [\"hook knowledge pull\", \"knowledge pull\"] };",
  "// Seat pair 15: the expected table is read from the installer's desiredHooks instead of being sealed.",
  "export const HOOKS = desiredHooks({ hooksDir: \"\", repoRoot: \"\" }).map((row) => ({ label: FROM_INSTALLER[row.spec.script][0], shortLabel: FROM_INSTALLER[row.spec.script][1], event: row.event, matcher: row.event === \"SessionStart\" ? \"startup\" : row.matcher ?? null, script: row.spec.script, timeout: row.entry.timeout, form: { darwin: \"shell\", linux: \"shell\", win32: \"exec\" }, ...(row.matcher ? { tool: row.matcher } : {}) }));",
  "",
].join("\n");

// Frozen table. `file/anchor/replacement` is the primary edit; `more` holds further edits the same wrong code
// needs. `expectRed`: substrings of the case titles the CHANGE says go red. `probe`: seat double-check body
// (runs with `probeRun` and `wt` in scope, prints one line). `why`: how the CHANGE's wording was expressed.
const PAIRS = [
  { n: "1", name: "ignore args and always use a shell (args joined into the shell string)", file: LIB,
    anchor: "  if (Array.isArray(entry.args)) return { command: entry.command, args: entry.args, shell: false };\n",
    replacement: "  if (Array.isArray(entry.args)) entry = { command: [entry.command, ...entry.args].join(\" \") };\n",
    tests: [IC], expectRed: [T.execNoShell, T.dispatchBoth] },
  { n: "2", name: "split a shell-form command on spaces with no shell (POSIX and win32)", file: LIB,
    anchor: "  if (platformName === \"win32\") return { command: gitBash, args: [\"-c\", entry.command], shell: false };\n  return { command: \"/bin/sh\", args: [\"-c\", entry.command], shell: false };\n",
    replacement: "  const [word, ...rest] = String(entry.command).split(\" \");\n  return { command: word, args: rest, shell: false };\n",
    tests: [IC], expectRed: [T.shellForm, T.dispatchBoth] },
  { n: "3", name: "use bash instead of /bin/sh on POSIX", file: LIB,
    anchor: "  return { command: \"/bin/sh\", args: [\"-c\", entry.command], shell: false };",
    replacement: "  return { command: \"bash\", args: [\"-c\", entry.command], shell: false };",
    tests: [IC], expectRed: [T.shellForm, T.dispatchBoth] },
  { n: "4a", name: "drop the hook spawn timeout (hit and miss spawns; the bin then falls back to its 300 s default)", file: LIB,
    anchor: "{ cwd: project, timeout: expected.timeout * 1000, input: JSON.stringify(input), env: hookEnv }",
    replacement: "{ cwd: project, input: JSON.stringify(input), env: hookEnv }",
    more: [{ file: LIB, anchor: "{ cwd: project, timeout: expected.timeout * 1000, input: JSON.stringify(missInput), env: hookEnv }", replacement: "{ cwd: project, input: JSON.stringify(missInput), env: hookEnv }" }],
    tests: [IC], expectRed: [T.slowHook],
    probe: "const r = await probeRun({ wt }); const t = r.calls.filter((c) => /nana-(objective|adoption|shared-memory|knowledge)|verifier-pipe/.test(c.args.join(' '))).map((c) => c.options.timeout ?? 'none'); console.log(`hook spawns carry timeout: ${JSON.stringify(t)} (tip passes 5000 on each)`);" },
  { n: "4b", name: "accept a missing timeout", file: LIB,
    anchor: "e.timeout !== expected.timeout ||", replacement: "(e.timeout !== undefined && e.timeout !== expected.timeout) ||",
    tests: [IC], expectRed: [T.shape] },
  { n: "5", name: "judge each hook by exit status only", file: LIB,
    anchor: "    let code = result.error?.code === \"ETIMEDOUT\" ? \"timeout\"",
    replacement: "    passed = okay(result);\n    let code = result.error?.code === \"ETIMEDOUT\" ? \"timeout\"",
    tests: [IC], expectRed: [T.objMarker, T.knowEmpty] },
  { n: "6", name: "treat a missing row as SKIP (no row failure, no hook-set failure, no hook line)", file: LIB,
    anchor: "    if (hitIndex < 0) { for (const item of labelsFor(expected)) failures.push({ item, code: \"missing-entry\" }); continue; }",
    replacement: "    if (hitIndex < 0) continue;",
    more: [
      { file: LIB, anchor: HOOK_SET_LINE, replacement: "  if (malformedGroup || all.length !== used.size)" },
      { file: LIB, anchor: "    if (!mappedEntry) { report(label, structural?.code ?? \"missing-entry\", false); return; }", replacement: "    if (!mappedEntry) return;" },
    ],
    why: "the hook-set count also fails a missing row, so SKIP needs the count to ignore missing rows too",
    tests: [IC], expectRed: [T.missingRow] },
  { n: "7", name: "ignore unmapped entries", file: LIB,
    anchor: HOOK_SET_LINE, replacement: "  if (malformedGroup || used.size !== expectedHooks.length)",
    tests: [IC], expectRed: [T.extraEntry] },
  { n: "8a", name: "matcher: substring match", file: LIB,
    anchor: MATCH_LIST_LINE, replacement: String.raw`  if (/^[A-Za-z0-9_\- ,|]+$/.test(matcher)) return matcher.includes(tool);` + "\n",
    tests: [IC], expectRed: [T.notBash] },
  { n: "8b", name: "matcher: every matcher is a list of exact names", file: LIB,
    anchor: MATCH_LIST_LINE + MATCH_REGEX_LINE, replacement: "  return matcher.split(/[|,]/).map((s) => s.trim()).includes(tool);\n",
    tests: [IC], expectRed: [T.anchored] },
  { n: "8c", name: "matcher: every matcher is a regex", file: LIB,
    anchor: MATCH_LIST_LINE, replacement: "",
    tests: [IC], expectRed: [T.listBoth] },
  { n: "9a", name: "drop one variable (NANA_HANDOFF) from the removal the code applies", file: LIB,
    anchor: OVERRIDE_LINE, replacement: "    if (OVERRIDE_ENV.filter((name) => name !== \"NANA_HANDOFF\").some((name) => key.toLowerCase() === name.toLowerCase())) continue;",
    tests: [IC], expectRed: [T.envSealed, T.envCase] },
  { n: "9b", name: "retune the sealed override list (drop NANA_HANDOFF)", file: CFG,
    anchor: "\"NANA_TEST_TEMP_ROOTS\", \"NANA_HANDOFF\"];", replacement: "\"NANA_TEST_TEMP_ROOTS\"];",
    tests: [IC], expectRed: [T.pinOverride] },
  { n: "10", name: "pass --home to install", file: LIB,
    anchor: "[path.join(root, \"packages/nana-setup/bin/nana-setup.mjs\"), \"install\"], { cwd: root, timeout: SPAWN_TIMEOUT_MS.install }",
    replacement: "[path.join(root, \"packages/nana-setup/bin/nana-setup.mjs\"), \"install\", \"--home\", home], { cwd: root, timeout: SPAWN_TIMEOUT_MS.install }",
    tests: [IC], expectRed: [T.cmdLine, T.cmdSource] },
  { n: "11", name: "read doctor's exit status alone (ignore note rows)", file: LIB,
    anchor: "  const unexpected = (doctor.stdout ?? \"\")", replacement: "  const unexpected = false && (doctor.stdout ?? \"\")",
    tests: [IC], expectRed: [T.doctorNote] },
  { n: "12a", name: "compare pi list paths as raw strings", file: LIB,
    anchor: "  const norm = (v) => comparablePath(String(v).trim(), platformName);", replacement: "  const norm = (v) => String(v).trim();",
    tests: [IC], expectRed: [T.piD, T.piRel] },
  { n: "12b", name: "accept (filtered) in pi list", file: LIB,
    anchor: "    return !header.includes(\"(filtered)\") && (header.includes(pkg)", replacement: "    return (header.includes(pkg)",
    tests: [IC], expectRed: [T.piFiltered, T.piFilteredFirst] },
  { n: "13a", name: "honour NANA_SETUP_PLATFORM as the check's own platform (runInstallCheck)", file: LIB,
    anchor: "  const lines = [];\n  const emitLine", replacement: "  if (env?.NANA_SETUP_PLATFORM) platformName = env.NANA_SETUP_PLATFORM;\n  const lines = [];\n  const emitLine",
    why: "the CHANGE's wrong code is the check honouring the variable; the check's platform is chosen in runInstallCheck",
    tests: [IC], expectRed: [T.forcedPlatform],
    probe: "const r = await probeRun({ wt, platformName: 'linux', env: { NANA_SETUP_PLATFORM: 'win32' } }); console.log(`linux run, caller NANA_SETUP_PLATFORM=win32: first line ${JSON.stringify(r.lines[0])}, exit ${r.exitCode} (tip: first line is pi:)`);" },
  { n: "13b", name: "honour NANA_SETUP_PLATFORM in the children (pass it through buildEnvironment)", file: LIB,
    anchor: OVERRIDE_LINE, replacement: "    if (key !== \"NANA_SETUP_PLATFORM\" && OVERRIDE_ENV.some((name) => key.toLowerCase() === name.toLowerCase())) continue;",
    tests: [IC], expectRed: [T.forcedPlatform] },
  { n: "14", name: "exit 0 with a FAIL line", file: LIB,
    anchor: "  return { lines, exitCode: failed ? 1 : 0 };", replacement: "  return { lines, exitCode: 0 };",
    tests: [IC], expectRed: [T.exitNonZero] },
  { n: "15", name: "import desiredHooks as the table (labels kept so acceptance can read the lines)", file: CFG,
    anchor: "export const HOOKS = [", replacement: "const HOOKS_SEALED_UNUSED = [",
    more: [{ file: CFG, anchor: "// Contract value: documented command-hook fields", replacement: HOOKS_DERIVED + "// Contract value: documented command-hook fields" }],
    why: "the table is mapped from desiredHooks rows (event, matcher, spec.script, timeout); the six sealed labels are kept so acceptance's line reader still finds them",
    tests: [IC, ACC], expectRed: [T.acc1], acceptance: true },
  { n: "16", name: "treat a listed item that passes as PASS", file: LIB,
    anchor: "  if (passed) return { status: match ? \"FAIL\" : \"PASS\", code: match ? \"unexpected-pass\" : null };", replacement: "  if (passed) return { status: \"PASS\", code: null };",
    tests: [IC], expectRed: [T.listedPass] },
  { n: "17", name: "drop the hookEventName check", file: LIB,
    anchor: "valid = payload?.hookEventName === \"PreToolUse\" && payload?.permissionDecision === \"ask\";", replacement: "valid = payload?.permissionDecision === \"ask\";",
    tests: [IC], expectRed: [T.hookEvent],
    probe: "const r = await probeRun({ wt, override: async ({ args, options }) => { if (!args.join(' ').includes('verifier-pipe.mjs')) return undefined; const hit = JSON.parse(options.input).tool_input.command !== 'git status'; return { status: 0, stdout: hit ? JSON.stringify({ hookSpecificOutput: { permissionDecision: 'ask' } }) + '\\n' : '' }; } }); console.log(`hit prints one well-formed ask line WITHOUT hookEventName, miss prints nothing -> ${JSON.stringify(r.lines.find((l) => l.includes('verifier pipe')))} (tip: FAIL)`);" },
  { n: "18", name: "run the hook entries one at a time (one promise chain instead of Promise.all)", file: LIB,
    anchor: "(expected.tools?.[platformName] ?? [null]).map(async (tool) => {", replacement: "(expected.tools?.[platformName] ?? [null]).map((tool) => (__chain = __chain.then(async () => {",
    more: [
      { file: LIB, anchor: "  const hookRuns = HOOKS.filter(", replacement: "  let __chain = Promise.resolve();\n  const hookRuns = HOOKS.filter(" },
      { file: LIB, anchor: "    report(label, code, passed, detail);\n  }));\n  await Promise.all(hookRuns);", replacement: "    report(label, code, passed, detail);\n  }))));\n  await Promise.all(hookRuns);" },
    ],
    tests: [IC], expectRed: [T.overlap],
    probe: "const order = []; const r = await probeRun({ wt, override: async ({ command, args, options, base }) => { const m = /nana-(objective|adoption|shared-memory)/.exec(args.join(' ')); if (!m) return undefined; order.push('start ' + m[1]); await new Promise((res) => setTimeout(res, 20)); const out = await base(command, args, options); order.push('end ' + m[1]); return out; } }); console.log(`SessionStart spawn order: ${order.join(', ')}; exit ${r.exitCode}`);" },
  { n: "19", name: "drop the 10,000-character stdout cap", file: LIB,
    anchor: "    let passed = !structural && okay(result) && stdout.length <= SAMPLE_INPUTS.maxOutput;", replacement: "    let passed = !structural && okay(result);",
    tests: [IC], expectRed: [T.cap],
    probe: "const r = await probeRun({ wt, override: async ({ command, args, options, base }) => { if (!args.join(' ').includes('nana-objective.mjs')) return undefined; const out = await base(command, args, options); return { ...out, stdout: out.stdout + ' ' + 'x'.repeat(10000) }; } }); console.log(`objective stdout of ${'x'.repeat(10000).length + 40}+ chars WITH the run token -> ${JSON.stringify(r.lines.find((l) => l.includes('hook objective')))} (tip: FAIL)`);" },
  { n: "20a", name: "accept async: true", file: LIB,
    anchor: "Object.keys(e).some((k) => !ALLOWED_HOOK_KEYS.includes(k))", replacement: "Object.keys(e).some((k) => k !== \"async\" && !ALLOWED_HOOK_KEYS.includes(k))",
    tests: [IC], expectRed: [T.shape] },
  { n: "20b", name: "accept a missing type", file: LIB,
    anchor: "e.type !== \"command\"", replacement: "(e.type !== undefined && e.type !== \"command\")",
    tests: [IC], expectRed: [T.shape] },
  { n: "21", name: "leave children's TMPDIR, TEMP and TMP unset (test-file half; acceptance (a) half not run)", file: LIB,
    anchor: "  env.TMPDIR = path.join(home, \"tmp\");\n  env.TEMP = path.join(home, \"tmp\");\n  env.TMP = path.join(home, \"tmp\");\n", replacement: "",
    tests: [IC], expectRed: [T.envRedirect, T.envFirst] },
  { n: "22", name: "spawn pi directly on win32 (findPi kept, winCommand removed for pi install, pi list and the session)", file: LIB,
    anchor: PI_RUN_BODY, replacement: "    return invoke(pi, args, { cwd: project, timeout });\n",
    more: [{ file: LIB, anchor: SESSION_LAUNCH, replacement: "  const sessionLaunch = { command: pi, args: sessionArgs, options: {} };" }],
    tests: [IC], expectRed: [T.piLaunch],
    probe: "const r = await probeRun({ wt, platformName: 'win32', piExt: '.cmd' }); const cmds = r.calls.filter((c) => /pi\\.cmd|cmd\\.exe/i.test(c.command)).map((c) => `${c.command} ${c.args[0] ?? ''}`); console.log(`win32, pi.cmd on PATH: pi spawns ${JSON.stringify(cmds)} (tip: ComSpec with /d)`);" },
  { n: "23a", name: "ci.yml: drop windows-latest from the install-check matrix", file: CI,
    anchor: "        os: [macos-latest, windows-latest]\n", replacement: "        os: [macos-latest]\n",
    tests: [CW], expectRed: [T.ciJob] },
  { n: "23b", name: "ci.yml: continue-on-error at job level", file: CI,
    anchor: "    timeout-minutes: 20\n", replacement: "    timeout-minutes: 20\n    continue-on-error: true\n",
    tests: [CW], expectRed: [T.ciJob] },
  { n: "23c", name: "ci.yml: continue-on-error at step level", file: CI,
    anchor: "      - name: Install check\n", replacement: "      - name: Install check\n        continue-on-error: true\n",
    tests: [CW], expectRed: [T.ciJob] },
  { n: "23d", name: "ci.yml: || true on the run line", file: CI,
    anchor: "        run: node packages/nana-setup/bin/install-check.mjs\n", replacement: "        run: node packages/nana-setup/bin/install-check.mjs || true\n",
    tests: [CW], expectRed: [T.ciJob] },
  { n: "23e", name: "ci.yml: drop timeout-minutes", file: CI,
    anchor: "    timeout-minutes: 20\n", replacement: "",
    tests: [CW], expectRed: [T.ciJob] },
  { n: "23f", name: "ci.yml: drop install-check from the release job's needs", file: CI,
    anchor: "    needs: [suite, install-check]\n", replacement: "    needs: [suite]\n",
    tests: [CW], expectRed: [T.ciRelease, T.ciR1032] },
  { n: "23g", name: "ci.yml: plain npm i -g without --ignore-scripts", file: CI,
    anchor: "      - run: npm i -g --ignore-scripts @earendil-works/pi-coding-agent@${PI_VERSION} --before=\"${PI_BEFORE}\"\n", replacement: "      - run: npm i -g @earendil-works/pi-coding-agent@${PI_VERSION} --before=\"${PI_BEFORE}\"\n",
    tests: [CW], expectRed: [T.ciJob] },
  { n: "24", name: "XFAIL any failure of a listed item whatever its code", file: LIB,
    anchor: CLASSIFY_XFAIL, replacement: "  if (match && date < match.expires) return { status: \"XFAIL\", code };",
    tests: [IC], expectRed: [T.wrongCode] },
  { n: "25", name: "ignore the expiry", file: LIB,
    anchor: CLASSIFY_XFAIL, replacement: "  if (match && match.code === code) return { status: \"XFAIL\", code };",
    tests: [IC], expectRed: [T.expired] },
  { n: "26", name: "skip the form check (R-1082)", file: LIB,
    anchor: "    if (form !== expected.form[platformName]) for (const item of labelsFor(expected)) failures.push({ item, code: \"wrong-form\" });\n", replacement: "",
    tests: [IC], expectRed: [T.formWin, T.formDarwin] },
  { n: "27", name: "spawn the fixture git init directly (child_process) instead of through the shared spawn", file: LIB,
    anchor: "  const git = (folder) => invoke(\"git\", [\"init\", \"--quiet\", folder], { cwd: folder, timeout: SPAWN_TIMEOUT_MS.git });",
    replacement: "  const git = async (folder) => (await import(\"node:child_process\")).spawnSync(\"git\", [\"init\", \"--quiet\", folder], { cwd: folder, encoding: \"utf8\", timeout: SPAWN_TIMEOUT_MS.git });",
    tests: [IC], expectRed: [T.recording] },
  // Seat pairs beyond the CHANGE.
  { n: "S1a", name: "the check writes an extra file <home>/.claude-placeholder", file: LIB,
    anchor: MEMORY_LINE, replacement: MEMORY_LINE + "    fs.writeFileSync(path.join(home, \".claude-placeholder\"), \"\");\n",
    tests: [IC], expectRed: [T.checklist] },
  { n: "S1b", name: "the check writes an extra file <home>/.claude/CLAUDE.md (a path the case does not name)", file: LIB,
    anchor: MEMORY_LINE, replacement: MEMORY_LINE + "    fs.writeFileSync(path.join(home, \".claude\", \"CLAUDE.md\"), \"seat\\n\");\n",
    tests: [IC], expectRed: [T.checklist] },
  { n: "S2", name: "the pi session no longer gets NANA_TEST_TEMP_ROOTS=\"\" (R-1079)", file: LIB,
    anchor: "  const sessionEnv = { ...childEnv, NANA_TEST_TEMP_ROOTS: \"\" };", replacement: "  const sessionEnv = { ...childEnv };",
    tests: [IC], expectRed: [T.sessionEnv, T.envPerStep] },
  { n: "S3", name: "hooks no longer get CLAUDE_PROJECT_DIR (R-1075)", file: LIB,
    anchor: "    const hookEnv = { ...childEnv, CLAUDE_PROJECT_DIR: project };", replacement: "    const hookEnv = { ...childEnv };",
    tests: [IC], expectRed: [T.claudeDir] },
];

// Pair 15's seat double-check: a TRUE drop of the verifier row from desiredHooks (acceptance (d)1 renames the
// script path instead), run through the real command on top of the pair-15 commit.
const TRUE_DROP = {
  file: SETTINGS,
  anchor: "export function desiredHooks({ hooksDir, repoRoot, platform }) {",
  replacement: "export function desiredHooks(o) { return desiredHooksAll(o).filter((r) => r.marker !== \"verifier-pipe.mjs\"); }\nfunction desiredHooksAll({ hooksDir, repoRoot }) {",
};

// ── probe fixture (written into SCRATCH, imported by probe children; mirrors the test file's recordingRun) ──
const PROBE_SRC = String.raw`
import fs from "node:fs"; import os from "node:os"; import path from "node:path"; import { pathToFileURL } from "node:url";
export async function probeRun({ wt, platformName = "linux", env = {}, piExt = ".exe", override = null }) {
  const imp = (rel) => import(pathToFileURL(path.join(wt, rel)).href);
  const lib = await imp("packages/nana-setup/lib/install-check.mjs");
  const { HOOKS } = await imp("packages/nana-setup/lib/install-check-config.mjs");
  const { projectKey } = await imp("packages/nana-setup/lib/project-key.mjs");
  const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ic-probe-")));
  const root = wt; const calls = [];
  const base = async (command, args, options) => {
    const joined = command + " " + args.join(" ");
    if (joined.includes("nana-setup.mjs") && args.includes("install")) {
      fs.mkdirSync(path.join(home, ".pi/agent"), { recursive: true });
      fs.mkdirSync(path.join(home, ".claude/nana-memory/shared"), { recursive: true });
      const sessionDir = path.join(home, ".claude/projects", projectKey(path.join(home, "project")));
      fs.mkdirSync(path.join(sessionDir, "memory"), { recursive: true });
      fs.symlinkSync(path.join(home, ".claude/nana-memory/shared"), path.join(sessionDir, "memory/shared"), "dir");
      const hooks = {};
      for (const hook of HOOKS.filter((h) => !h.platforms || h.platforms.includes(platformName))) {
        const entry = platformName === "win32" ? { type: "command", command: "node", args: [hook.script], timeout: hook.timeout } : { type: "command", command: "node " + hook.script, timeout: hook.timeout };
        const matcher = platformName === "win32" && hook.tool === "Bash" ? "Bash|PowerShell" : hook.matcher;
        (hooks[hook.event] ??= []).push({ ...(matcher ? { matcher } : {}), hooks: [entry] });
      }
      fs.writeFileSync(path.join(home, ".claude/settings.json"), JSON.stringify({ hooks }));
      return { status: 0, stdout: "" };
    }
    if (args[0] === "init") return { status: 0 };
    if (args[0] === "list") return { status: 0, stdout: "User packages:\n nana-pack\n  " + path.join(root, "packages/nana-pack") + "\n nana-knowledge\n  " + path.join(root, "packages/nana-knowledge") + "\n" };
    if (args.includes("--mode") && args.includes("rpc")) { fs.mkdirSync(path.join(home, ".pi/agent"), { recursive: true }); fs.writeFileSync(path.join(home, ".pi/agent/nana-journal.jsonl"), JSON.stringify({ event: "directory_unadopted", cwd: path.join(home, "project") })); return { status: 0, stdout: "reload-runtime" }; }
    if (joined.includes("nana-objective.mjs")) { const o = fs.readFileSync(path.join(home, ".pi/agent/nana-objective.md"), "utf8"); return { status: 0, stdout: "[nana:objective] " + (o.match(/installcheck_[a-z0-9]+/)?.[0] ?? "fixture") }; }
    if (joined.includes("nana-adoption.mjs")) return { status: 0, stdout: "[nana:adoption] " + path.join(home, "project") };
    if (joined.includes("nana-shared-memory.mjs")) { const m = fs.readFileSync(path.join(home, ".claude/nana-memory/shared/MEMORY.md"), "utf8"); return { status: 0, stdout: "[nana:shared-memory] " + (m.split("\n").find((l) => l.startsWith("- [")) ?? "") }; }
    if (joined.includes("nana-knowledge.ts")) return { status: 0, stdout: "[nana:knowledge] install-check.md" };
    if (joined.includes("verifier-pipe.mjs")) { const input = JSON.parse(options.input); return { status: 0, stdout: input.tool_input.command !== "git status" ? JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "ask" } }) + "\n" : "" }; }
    return { status: 0, stdout: "" };
  };
  const spawn = async (command, args, options) => { calls.push({ command, args, options }); return (override && await override({ command, args, options, base })) ?? base(command, args, options); };
  try {
    const res = await lib.runInstallCheck({ root, home, platformName, env: { PATH: platformName === "win32" ? "C:\\tools" : "/bin", ComSpec: "C:\\Windows\\System32\\cmd.exe", ...env }, spawn, exists: platformName === "win32" ? (c) => c.toLowerCase().endsWith("\\pi" + piExt) : undefined, now: () => new Date("2026-10-12T00:00:00Z"), out: () => {} });
    return { ...res, calls, home };
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
}
`;

// ── plumbing ────────────────────────────────────────────────────────────────────────────────
const sh = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: "utf8", ...opts });
const git = (...args) => sh("git", args);
const count = (hay, needle) => hay.split(needle).length - 1;
const SCRUB = (k) => /^NANA_/.test(k) || k === "PI_CODING_AGENT_DIR";
const BASE_ENV = (() => {
  const e = { ...process.env };
  for (const k of Object.keys(e)) if (SCRUB(k)) delete e[k];
  const c = Number.isSafeInteger(Number(e.GIT_CONFIG_COUNT)) && Number(e.GIT_CONFIG_COUNT) >= 0 ? Number(e.GIT_CONFIG_COUNT) : 0;
  e[`GIT_CONFIG_KEY_${c}`] = "gc.auto";
  e[`GIT_CONFIG_VALUE_${c}`] = "0";
  e.GIT_CONFIG_COUNT = String(c + 1);
  return e;
})();
let runSeq = 0;

function addWorktree(dir, ref) {
  if (fs.existsSync(dir)) { git("-C", LANE_REPO, "worktree", "remove", "--force", dir); fs.rmSync(dir, { recursive: true, force: true }); }
  git("-C", LANE_REPO, "worktree", "prune");
  const r = git("-C", LANE_REPO, "worktree", "add", "--detach", dir, ref);
  if (r.status !== 0) throw new Error(`worktree add ${ref} failed: ${r.stderr}`);
}
function removeWorktree(dir) {
  git("-C", LANE_REPO, "worktree", "remove", "--force", dir);
  fs.rmSync(dir, { recursive: true, force: true });
  git("-C", LANE_REPO, "worktree", "prune");
}
let tipSha = "";
function resetWorktree() {
  // reset --hard moves only this detached worktree's HEAD (back from pair 15's scratch commit); no ref moves.
  git("-C", WT, "reset", "--hard", "--quiet", tipSha);
  git("-C", WT, "clean", "-fdq");
  const st = git("-C", WT, "status", "--porcelain");
  const head = git("-C", WT, "rev-parse", "HEAD").stdout.trim();
  if (st.stdout.trim() || head !== tipSha) throw new Error(`scratch worktree not clean at tip after reset (HEAD ${head}):\n${st.stdout}`);
}
function applyEdits(edits) {
  for (const e of edits) {
    const abs = path.join(WT, e.file);
    const text = fs.readFileSync(abs, "utf8");
    const c = count(text, e.anchor);
    if (c !== 1) return `${e.file}: anchor occurs ${c}× — ${short(JSON.stringify(e.anchor), 80)}`;
    fs.writeFileSync(abs, text.replace(e.anchor, () => e.replacement));
  }
  return null;
}

/** Run one file; resolve { code, out, timedOut, secs }. Package tests run as scripts/test.mjs runs them. */
function runFile(rel, { attribution = false } = {}) {
  const file = path.join(WT, rel);
  const isPkgTest = /\/tests\//.test(rel);
  const cwd = isPkgTest ? path.dirname(path.dirname(file)) : WT;
  let env = { ...BASE_ENV };
  let home = null, tmp = null;
  if (isPkgTest) {
    const id = ++runSeq;
    home = path.join(RUNS, `home-${id}`);
    tmp = path.join(RUNS, `tmp-${id}`);
    fs.mkdirSync(home, { recursive: true });
    fs.mkdirSync(tmp, { recursive: true });
    env = { ...env, HOME: home, USERPROFILE: home, TMPDIR: tmp, TEMP: tmp, TMP: tmp };
  }
  // Acceptance runs as the seat runs it: from the worktree root, real HOME, default TMPDIR.
  const flags = rel === ACC ? [] : ["--experimental-strip-types", ...(attribution ? ["--unhandled-rejections=warn-with-error-code"] : [])];
  const t0 = Date.now();
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [...flags, file], { cwd, env, stdio: ["ignore", "pipe", "pipe"], detached: true });
    let out = "";
    child.stdout.on("data", (d) => { out += d; });
    child.stderr.on("data", (d) => { out += d; });
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; try { process.kill(-child.pid, "SIGKILL"); } catch {} }, rel === ACC ? ACC_TIMEOUT_MS : TIMEOUT_MS);
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      if (home) fs.rmSync(home, { recursive: true, force: true });
      if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
      resolve({ code: code ?? (signal ? 128 : 1), out, timedOut, secs: ((Date.now() - t0) / 1000).toFixed(1) });
    });
  });
}
const failLines = (out) => out.split("\n").filter((l) => /^(FAIL|MISS) /.test(l)).map((l) => l.replace(/^(FAIL|MISS) +/, "").trim());
const passLines = (out) => out.split("\n").filter((l) => /^(PASS|ok) +/.test(l)).map((l) => l.replace(/^(PASS|ok) +/, "").trim());
const short = (s, n = 110) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

/** Map a test-file line number to the check() title that encloses it (null inside a helper). */
function titleMapper(absTestFile) {
  const anchors = [];
  fs.readFileSync(absTestFile, "utf8").split("\n").forEach((l, i) => {
    const m = /^check\("((?:[^"\\]|\\.)*)"/.exec(l);
    if (m) anchors.push({ line: i + 1, title: JSON.parse(`"${m[1]}"`) });
    else if (/^(?:async function |function |const |let |var |if |for )/.test(l)) anchors.push({ line: i + 1, title: null });
  });
  return (n) => { let best = null; for (const a of anchors) { if (a.line <= n) best = a; else break; } return best?.title ?? null; };
}
/** Parse warn-mode rejection blocks into { title, msg }. */
function asyncRejections(out, rel) {
  const mapLine = titleMapper(path.join(WT, rel));
  const base = path.basename(rel).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const res = [];
  for (const block of out.split(/\(node:\d+\) UnhandledPromiseRejectionWarning: /).slice(1)) {
    if (block.startsWith("Unhandled promise rejection.")) continue;
    const msg = block.split("\n").map((l) => l.trim()).filter(Boolean).filter((l) => !/^at /.test(l)).slice(0, 2).join(" ");
    const frames = [...block.matchAll(new RegExp(`${base}:(\\d+):\\d+`, "g"))].map((m) => Number(m[1]));
    let title = null;
    for (const f of frames) { title = mapLine(f); if (title) break; }
    res.push({ title, msg });
  }
  return res;
}
async function runProbe(body) {
  const code = `import { probeRun } from ${JSON.stringify(PROBE_FIXTURE)};\nconst wt = ${JSON.stringify(WT)};\n${body}\n`;
  const r = sh(process.execPath, ["--input-type=module", "-e", code], { cwd: SCRATCH, env: { ...BASE_ENV, TMPDIR: RUNS }, timeout: 120000 });
  const text = `${r.stdout}${r.stderr}`.trim().split("\n");
  return r.status === 0 ? text.at(-1) : `probe failed (exit ${r.status}): ${short(text.slice(0, 3).join(" / "), 200)}`;
}

let logFile = null;
const log = (line) => { console.log(line); if (logFile) fs.appendFileSync(logFile, line + "\n"); };

// ── main ────────────────────────────────────────────────────────────────────────────────────
const only = process.argv.slice(2);
let pairs = only.length ? PAIRS.filter((p) => only.includes(p.n)) : PAIRS;
pairs = [...pairs.filter((p) => !p.acceptance), ...pairs.filter((p) => p.acceptance)]; // long run last
logFile = process.env.SEAT_MUTATE_OUT || null;
if (logFile) fs.writeFileSync(logFile, "");

fs.mkdirSync(RUNS, { recursive: true });
fs.writeFileSync(PROBE_FIXTURE, PROBE_SRC);
tipSha = git("-C", LANE_REPO, "rev-parse", TIP).stdout.trim();
log(`seat-mutate: lane install-check, tip ${tipSha}, node ${process.version}, ${new Date().toISOString()}, scratch ${SCRATCH}`);
addWorktree(WT, tipSha);

const tally = { red: 0, survived: 0, anchorMiss: 0, syntax: 0, runnable: 0, accSkipped: 0 };
const survivors = [];
try {
  // Baseline: every named quick file, unmutated, must exit 0 with no FAIL line and no async rejection.
  const files = [...new Set(pairs.flatMap((p) => p.tests))].filter((f) => f !== ACC);
  let baselineOk = true;
  for (const rel of files) {
    const r = await runFile(rel);
    const fl = failLines(r.out);
    const rej = rel === IC ? asyncRejections((await runFile(rel, { attribution: true })).out, rel) : [];
    const ok = r.code === 0 && !r.timedOut && fl.length === 0 && rej.length === 0;
    log(`BASELINE ${ok ? "ok  " : "FAIL"} ${rel} (exit ${r.code}, ${passLines(r.out).length} PASS, ${fl.length} FAIL, ${rej.length} async rejection, ${r.secs}s)${ok ? "" : " — " + [...fl, ...rej.map((x) => `${x.title}: ${x.msg}`)].slice(0, 3).map((t) => short(t)).join(" | ")}`);
    if (!ok) baselineOk = false;
  }
  if (pairs.some((p) => p.acceptance)) log(`BASELINE acceptance not run (minutes); pair 15 judges its (d)1 line only`);
  resetWorktree();
  if (!baselineOk) { log("seat-mutate: baseline not green — refusing to judge mutations"); process.exitCode = 2; }
  else {
    for (const p of pairs) {
      resetWorktree();
      const edits = [{ file: p.file, anchor: p.anchor, replacement: p.replacement }, ...(p.more ?? [])];
      const miss = applyEdits(edits);
      if (miss) { tally.anchorMiss++; log(`ANCHOR-MISS ${p.n} ${p.name} — ${miss}`); continue; }
      const diff = git("-C", WT, "diff", "--stat").stdout.trim().split("\n").pop();
      let bad = null;
      for (const f of new Set(edits.map((e) => e.file))) {
        if (!/\.(mjs|js)$/.test(f)) continue;
        const chk = sh(process.execPath, ["--check", path.join(WT, f)]);
        if (chk.status !== 0) { bad = `${f}: ${chk.stderr.split("\n").slice(0, 4).join(" ")}`; break; }
      }
      if (bad) { tally.syntax++; log(`SYNTAX ${p.n} ${p.name} — ${bad}`); continue; }
      tally.runnable++;
      const reds = []; // { rel, t, async }
      const passTitles = [];
      const notes = [];
      let anyRed = false;
      for (const rel of p.tests) {
        if (rel === ACC) {
          if (SKIP_ACC) { tally.accSkipped++; notes.push("acceptance SKIPPED (SEAT_MUTATE_SKIP_ACCEPTANCE=1)"); continue; }
          const c = git("-C", WT, "-c", "user.name=seat-mutate", "-c", "user.email=seat-mutate@invalid", "commit", "--quiet", "--no-verify", "-am", `seat mutation ${p.n} (scratch, never pushed)`);
          if (c.status !== 0) { notes.push(`scratch commit failed: ${short(c.stderr.trim())}`); continue; }
          log(`  ${p.n}: acceptance running against scratch commit ${git("-C", WT, "rev-parse", "--short", "HEAD").stdout.trim()} (real installs; minutes)`);
          const r = await runFile(ACC);
          const accLines = r.out.split("\n").filter((l) => /^(ok  |MISS) /.test(l) || /^(cases|install-check acceptance):/.test(l));
          const d1 = accLines.find((l) => l.includes(T.acc1)) ?? "(d)1 line absent";
          notes.push(`acceptance exit ${r.code}${r.timedOut ? " (timeout)" : ""} in ${r.secs}s; (d)1: ${short(d1, 160)}; MISS lines: ${JSON.stringify(failLines(r.out).map((t) => short(t, 90)))}`);
          for (const t of failLines(r.out)) reds.push({ rel, t, async: false });
          passTitles.push(...passLines(r.out));
          if (r.code !== 0 || r.timedOut) anyRed = true;
          // Seat double-check: a TRUE drop of the verifier row, through the real command, on top of the mutation.
          const missDrop = applyEdits([TRUE_DROP]);
          if (missDrop) notes.push(`true-drop probe ANCHOR-MISS: ${missDrop}`);
          else {
            const env = { ...BASE_ENV };
            for (const k of Object.keys(env)) if (/^(CLAUDE_CONFIG_DIR|npm_config_)/i.test(k)) delete env[k];
            const t0 = Date.now();
            const d = sh(process.execPath, [path.join(WT, "packages/nana-setup/bin/install-check.mjs")], { cwd: WT, env, timeout: 30 * 60 * 1000, maxBuffer: 64 * 1024 * 1024 });
            const lines = `${d.stdout}`.split("\n").filter((l) => /^(PASS|FAIL|XFAIL) /.test(l));
            notes.push(`probe: pair 15 + verifier row truly dropped from desiredHooks, real run → exit ${d.status} in ${((Date.now() - t0) / 1000).toFixed(0)}s; verifier lines ${JSON.stringify(lines.filter((l) => /verifier|hook set/.test(l)).map((l) => short(l, 80)))}; FAIL lines ${JSON.stringify(lines.filter((l) => l.startsWith("FAIL")).map((l) => short(l, 80)))}`);
            const home = /install-check home retained: (\S+)/.exec(d.stderr ?? "")?.[1];
            if (home && home.startsWith(os.tmpdir())) fs.rmSync(home, { recursive: true, force: true });
          }
          continue;
        }
        const r = await runFile(rel);
        const fl = failLines(r.out);
        passTitles.push(...passLines(r.out));
        for (const t of fl) reds.push({ rel, t, async: false });
        if (r.code !== 0 || r.timedOut || fl.length) anyRed = true;
        if (rel === IC) {
          const a = await runFile(rel, { attribution: true });
          const rej = asyncRejections(a.out, rel);
          for (const x of rej) reds.push({ rel, t: `${x.title ?? "(unattributed)"} — ${x.msg}`, async: true });
          if (r.code !== 0 && !fl.length && !rej.length) notes.push(`verdict exit ${r.code} with no FAIL line and no attributed rejection: ${short(r.out.trim().split("\n").slice(-3).join(" / "), 160)}`);
          if (r.code === 0 && rej.length) notes.push(`attribution found ${rej.length} rejection(s) but the verdict run exited 0`);
          if (r.timedOut) notes.push("verdict run timed out");
        }
      }
      if (p.probe) notes.push(`probe: ${await runProbe(p.probe)}`);
      const has = (s) => reds.some(({ t }) => t.includes(s));
      const matched = reds.filter(({ t }) => p.expectRed.some((s) => t.includes(s)));
      const namedGreen = p.expectRed.filter((s) => !has(s) && passTitles.some((t) => t.includes(s)));
      const notReached = p.expectRed.filter((s) => !has(s) && !passTitles.some((t) => t.includes(s)));
      const fmt = ({ rel, t, async }) => `[${path.basename(rel)}]${async ? " (async)" : ""} ${short(t, async ? 260 : 150)}`;
      const extra = `${namedGreen.length ? `; named but GREEN: ${namedGreen.map((s) => JSON.stringify(s)).join(", ")}` : ""}${notReached.length ? `; named but NOT REACHED: ${notReached.map((s) => JSON.stringify(s)).join(", ")}` : ""}; ${reds.length} red case(s) total (${diff})${p.why ? `; expressed as: ${p.why}` : ""}`;
      if (matched.length) {
        tally.red++;
        log(`RED ${p.n} ${p.name} — ${matched.slice(0, 3).map(fmt).join(" | ")}${extra}`);
      } else if (anyRed || reds.length) {
        tally.red++;
        log(`RED ${p.n} ${p.name} — (no named case) ${reds.slice(0, 3).map(fmt).join(" | ")}${extra}`);
      } else {
        tally.survived++;
        survivors.push(p.n);
        log(`GREEN ${p.n} ${p.name} — SURVIVED${extra}`);
      }
      for (const n of notes) log(`  ${p.n}: ${n}`);
    }
  }
} finally {
  try { resetWorktree(); } catch (e) { log(`reset failed: ${e.message}`); }
  removeWorktree(WT);
  fs.rmSync(SCRATCH, { recursive: true, force: true });
}
log(`seat-mutate: ${tally.red}/${tally.runnable} red, ${tally.survived} survived${survivors.length ? ` (${survivors.join(", ")})` : ""}${tally.anchorMiss ? `, ${tally.anchorMiss} ANCHOR-MISS` : ""}${tally.syntax ? `, ${tally.syntax} SYNTAX` : ""}${tally.accSkipped ? `, acceptance skipped` : ""}`);
if (tally.anchorMiss || tally.syntax) process.exitCode = 3;
