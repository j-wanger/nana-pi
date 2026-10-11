// Seat acceptance for lane pi-cmd-launch (frozen). Runs on ANY platform: every win32 case is forced
// through the injected seams the build brief pins. Run from the repo root:
//   node docs/reviews/pi-cmd-launch-2026-10-11/seat-verify-wincmd.mjs
// Contract under test (build brief 1):
//   packages/nana-pack/lib/win-command.mjs — findOnPath(name, { env, cwd, searchCwd, exists }) → string|null;
//     winCommand(file, args, { comspec }) → { command, args, options } | { refused };
//     cmdCouldNotRun(command, { env, cwd, exists }) → boolean
//   packages/nana-pack/lib/win-command-config.mjs — INTERNAL_COMMANDS, DEFAULT_PATHEXT, PI_EXTENSIONS
//   packages/nana-setup/lib/steps.mjs — stepPiRegister(layout, o, { platform, env, spawn, exists, manifestRoot })
//   packages/nana-setup/lib/doctor.mjs — diagnose(layout, { projectDir, pi: { platform, env, spawn, exists } })
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const root = process.cwd();
let bad = 0, n = 0;
const out = (title, got, want) => {
  n++;
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) bad++;
  console.log(`${ok ? "ok  " : "MISS"} ${title}${ok ? "" : ` → ${JSON.stringify(got)} (want ${JSON.stringify(want)})`}`);
};
const load = async (rel) => { try { return await import(path.join(root, rel)); } catch (e) { return { __error: e.message }; } };

const wc = await load("packages/nana-pack/lib/win-command.mjs");
const cfg = await load("packages/nana-pack/lib/win-command-config.mjs");
const steps = await load("packages/nana-setup/lib/steps.mjs");
const doc = await load("packages/nana-setup/lib/doctor.mjs");
const paths = await load("packages/nana-setup/lib/paths.mjs");
for (const [name, m] of [["win-command", wc], ["win-command-config", cfg], ["steps", steps], ["doctor", doc]]) if (m.__error) out(`module ${name} loads`, m.__error, "loaded");
// Every pinned export must exist: a renamed export must not silently skip a section.
for (const [label, v] of [["win-command findOnPath", wc.findOnPath], ["win-command winCommand", wc.winCommand], ["win-command cmdCouldNotRun", wc.cmdCouldNotRun],
  ["steps stepPiRegister", steps.stepPiRegister], ["steps installExitCode", steps.installExitCode], ["doctor diagnose", doc.diagnose]]) out(`export ${label} is a function`, typeof v, "function");

// A case-insensitive file set, as an NTFS folder behaves.
const fileSet = (...files) => { const s = new Set(files.map((f) => f.toLowerCase())); return (p) => s.has(String(p).toLowerCase()); };
const norm = (p) => (p == null ? p : path.win32.normalize(p).toLowerCase());
const safe = (fn) => { try { return fn(); } catch (e) { return `THREW ${e.message}`; } };
const PX = ".COM;.EXE;.BAT;.CMD";

// 1. the sealed internal-command set (R-1038)
const SEALED = "assoc break call cd chdir cls color copy date del dir dpath echo endlocal erase exit for ftype goto if keys md mkdir mklink move path pause popd prompt pushd rd rem ren rename rmdir set setlocal shift start time title type ver verify vol".split(" ");
out("INTERNAL_COMMANDS is exactly the sealed 45", [...(cfg.INTERNAL_COMMANDS ?? [])].map((x) => String(x).toLowerCase()).sort(), [...SEALED].sort());
out("DEFAULT_PATHEXT", String(cfg.DEFAULT_PATHEXT ?? "").toUpperCase(), PX);
out("PI_EXTENSIONS", [...(cfg.PI_EXTENSIONS ?? [])].map((x) => String(x).toLowerCase()).sort(), [".bat", ".cmd", ".com", ".exe"]);

// 2. findOnPath (R-1033)
if (wc.findOnPath) {
  const f = (name, env, exists, extra = {}) => norm(safe(() => wc.findOnPath(name, { env, cwd: "C:\\proj", exists, ...extra })));
  out("PATH key read as Path", f("pi", { Path: "C:\\a;C:\\b", PATHEXT: PX }, fileSet("C:\\b\\pi.cmd")), "c:\\b\\pi.cmd");
  out("PATH key read as PATH", f("pi", { PATH: "C:\\a;C:\\b", PATHEXT: PX }, fileSet("C:\\b\\pi.cmd")), "c:\\b\\pi.cmd");
  out("quoted and empty PATH entries", f("pi", { Path: ";\"C:\\Program Files\\x\";;", PATHEXT: PX }, fileSet("C:\\Program Files\\x\\pi.exe")), "c:\\program files\\x\\pi.exe");
  out("PATHEXT order inside one folder", f("pi", { Path: "C:\\a", PATHEXT: PX }, fileSet("C:\\a\\pi.cmd", "C:\\a\\pi.exe")), "c:\\a\\pi.exe");
  out("earlier folder beats a later extension", f("pi", { Path: "C:\\a;C:\\b", PATHEXT: PX }, fileSet("C:\\a\\pi.cmd", "C:\\b\\pi.com")), "c:\\a\\pi.cmd");
  out("working folder never searched for pi", f("pi", { Path: "C:\\b", PATHEXT: PX }, fileSet("C:\\proj\\pi.cmd")), null);
  out("working folder searched first when asked", f("tool", { Path: "C:\\b", PATHEXT: PX }, fileSet("C:\\proj\\tool.bat", "C:\\b\\tool.exe"), { searchCwd: true }), "c:\\proj\\tool.bat");
  out("a directory named pi.cmd is skipped", f("pi", { Path: "C:\\a;C:\\b", PATHEXT: PX }, (p) => /^c:\\b\\pi\.cmd$/i.test(p)), "c:\\b\\pi.cmd");
  out("unset PATHEXT uses the default", f("pi", { Path: "C:\\a" }, fileSet("C:\\a\\pi.bat")), "c:\\a\\pi.bat");
  out(".JS and .PS1 in PATHEXT are skipped for pi", f("pi", { Path: "C:\\a", PATHEXT: ".JS;.PS1;.CMD" }, fileSet("C:\\a\\pi.js", "C:\\a\\pi.ps1", "C:\\a\\pi.cmd")), "c:\\a\\pi.cmd");
  out("upper-case pi.CMD found", f("pi", { Path: "C:\\a", PATHEXT: PX }, fileSet("C:\\a\\pi.CMD")), "c:\\a\\pi.cmd");
  out("nothing found → null", f("pi", { Path: "C:\\a", PATHEXT: PX }, fileSet()), null);
}

// 3. winCommand (R-1034, R-1035, R-1039)
if (wc.winCommand) {
  const CS = "C:\\Windows\\system32\\cmd.exe";
  const w = (file, args) => safe(() => wc.winCommand(file, args, { comspec: CS }));
  const c = w("C:\\Program Files\\nodejs\\pi.cmd", ["install", "C:\\a b\\pkg"]);
  out(".cmd → ComSpec", c?.command, CS);
  out(".cmd → exact switch list and quoted line", c?.args, ["/d", "/v:off", "/s", "/c", "\"\"C:\\Program Files\\nodejs\\pi.cmd\" \"install\" \"C:\\a b\\pkg\"\""]);
  out(".cmd → verbatim arguments", c?.options?.windowsVerbatimArguments, true);
  out("upper-case .CMD → ComSpec", w("C:\\a\\pi.CMD", ["--version"])?.command, CS);
  out("default ComSpec is cmd.exe", safe(() => wc.winCommand("C:\\a\\pi.bat", ["--version"], {}))?.command?.toLowerCase(), "cmd.exe");
  const e = w("C:\\a%b!c\\PI.EXE", ["install", "C:\\x%y!z\\"]);
  out(".exe → direct, path kept", e?.command, "C:\\a%b!c\\PI.EXE");
  out(".exe → argument array kept, nothing refused", e?.args, ["install", "C:\\x%y!z\\"]);
  out(".exe → no verbatim arguments", Boolean(e?.options?.windowsVerbatimArguments), false);
  out(".com → direct", w("C:\\a\\pi.com", ["--version"])?.command, "C:\\a\\pi.com");
  out(".ps1 → refused", typeof w("C:\\a\\pi.ps1", ["--version"])?.refused, "string");
  for (const [label, ch] of [["double quote", "\""], ["percent", "%"], ["bang", "!"]]) {
    const inArg = w("C:\\a\\pi.cmd", ["install", `C:\\x${ch}y`]);
    out(`.cmd refuses ${label} in an argument, naming it`, typeof inArg?.refused === "string" && inArg.refused.includes(ch), true);
    const inPath = w(`C:\\a${ch}b\\pi.cmd`, ["--version"]);
    out(`.cmd refuses ${label} in its path`, typeof inPath?.refused === "string" && inPath.refused.includes(ch), true);
  }
  for (const [label, ch] of [["CR", "\r"], ["LF", "\n"], ["NUL", "\0"]]) out(`.cmd refuses ${label}`, typeof w("C:\\a\\pi.cmd", ["install", `C:\\x${ch}y`])?.refused, "string");
  out(".cmd refuses a trailing backslash", typeof w("C:\\a\\pi.cmd", ["install", "C:\\x\\"])?.refused, "string");
  out(".cmd accepts & ( ) ^ ; and spaces inside quotes", w("C:\\a\\pi.cmd", ["install", "C:\\p & q (r)^;s"])?.args?.[4], "\"\"C:\\a\\pi.cmd\" \"install\" \"C:\\p & q (r)^;s\"\"");
}

// 4. cmdCouldNotRun (R-1038)
if (wc.cmdCouldNotRun) {
  const env = { Path: "C:\\tools;C:\\bin", PATHEXT: PX };
  const exists = fileSet("C:\\tools\\ruff.exe", "C:\\proj\\check.cmd", "C:\\proj\\local.exe");
  const k = (cmd) => safe(() => wc.cmdCouldNotRun(cmd, { env, cwd: "C:\\proj", exists }));
  for (const cmd of ["missing-tool x", ".\\missing-tool", "C:\\nowhere\\tool.exe", "   missing-tool", "\tmissing-tool", "dirt"]) out(`could not run: ${JSON.stringify(cmd)}`, k(cmd), true);
  for (const cmd of ["ruff check .", "local", ".\\check", "ECHO hi", "type missing.txt", "dir/Z", "cd\\nowhere", "cd..", "echo.text", "", "   ",
    "%ComSpec% /c exit 1", "@node -e x", "^ruff check", "\"C:\\nowhere\\tool.exe\"", "ruff,check", "missing-tool&&x"]) out(`not classified: ${JSON.stringify(cmd)}`, k(cmd), false);
}

// Sections 5 and 6 must never reach a real pi: if the seam is ignored, a bare spawn finds nothing.
const savedPath = process.env.PATH;
process.env.PATH = fs.mkdtempSync(path.join(os.tmpdir(), "seat-wincmd-empty-path-"));

// 5. stepPiRegister through the injected seam (R-1033..R-1036, R-1039)
if (steps.stepPiRegister && paths.resolveLayout) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "seat-wincmd-"));
  const layout = { ...paths.resolveLayout({ home }), isRealHome: true };
  const CS = "C:\\Windows\\system32\\cmd.exe";
  const run = (platform, exists, reply, piDir = "C:\\npm") => {
    const calls = [];
    const spawn = (command, args, options) => { calls.push({ command, args, options }); return typeof reply === "function" ? reply(command, args) : reply; };
    const env = { Path: `${piDir};C:\\Windows`, PATHEXT: PX, ComSpec: CS };
    const result = safe(() => steps.stepPiRegister(layout, {}, { platform, env, spawn, exists, manifestRoot: root }));
    return { result: Array.isArray(result) ? result[0] : result, calls };
  };
  const ok = { status: 0, stdout: "1.0.2\n", stderr: "" };
  const a = run("win32", fileSet("C:\\npm\\pi.cmd"), ok);
  out("win32 .cmd: first call is ComSpec --version", [a.calls[0]?.command, a.calls[0]?.args?.at(-1)], [CS, "\"\"C:\\npm\\pi.cmd\" \"--version\"\""]);
  out("win32 .cmd: install calls go through ComSpec with PI_CODING_AGENT_DIR", a.calls.slice(1).length > 0 && a.calls.slice(1).every((c) => c.command === CS && c.options?.windowsVerbatimArguments === true && c.options?.env?.PI_CODING_AGENT_DIR === layout.piHome && /^""C:\\npm\\pi\.cmd" "install" "/.test(c.args?.at(-1) ?? "")), true);
  out("win32 .cmd: step created", a.result?.status, "created");
  const none = run("win32", fileSet(), ok);
  out("win32 not found → skipped with the hint, no spawn", [none.result?.status, String(none.result?.detail ?? "").includes(steps.PI_INSTALL_HINT), none.calls.length], ["skipped", true, 0]);
  const err = run("win32", fileSet("C:\\npm\\pi.cmd"), { status: null, error: Object.assign(new Error("spawn EACCES"), { code: "EACCES" }) });
  out("win32 spawn error → problem, install exits 1", [err.result?.status, steps.installExitCode?.([err.result])], ["problem", 1]);
  const nz = run("win32", fileSet("C:\\npm\\pi.cmd"), { status: 1, stdout: "", stderr: "boom" });
  out("win32 --version exit 1 → problem", nz.result?.status, "problem");
  const ref = run("win32", fileSet("C:\\n%pm\\pi.cmd"), ok, "C:\\n%pm");
  out("win32 refused .cmd path → problem naming %, no spawn", [ref.result?.status, String(ref.result?.detail ?? "").includes("%"), ref.calls.length], ["problem", true, 0]);
  const exe = run("win32", fileSet("C:\\n%pm\\PI.EXE"), ok, "C:\\n%pm");
  out("win32 .exe with % → spawned directly", [exe.calls[0]?.command?.toLowerCase(), exe.calls[0]?.args, exe.result?.status], ["c:\\n%pm\\pi.exe", ["--version"], "created"]);
  const enoent = run("darwin", null, { status: null, error: Object.assign(new Error("spawn pi ENOENT"), { code: "ENOENT" }) });
  out("posix ENOENT → skipped", enoent.result?.status, "skipped");
  const eacces = run("darwin", null, { status: null, error: Object.assign(new Error("spawn pi EACCES"), { code: "EACCES" }) });
  out("posix EACCES → problem", eacces.result?.status, "problem");
  const pnz = run("darwin", null, { status: 2, stdout: "", stderr: "" });
  out("posix --version exit 2 → problem", pnz.result?.status, "problem");
  fs.rmSync(home, { recursive: true, force: true });
}

// 6. doctor's pi row through the injected seam (R-952, R-1035, R-1037)
if (doc.diagnose && paths.resolveLayout) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "seat-wincmd-doc-"));
  const row = (realHome, exists, reply, piDir = "C:\\npm") => {
    const calls = [];
    const spawn = (command, args, options) => { calls.push({ command, args }); return reply; };
    const layout = { ...paths.resolveLayout({ home }), isRealHome: realHome };
    const env = { Path: `${piDir};C:\\Windows`, PATHEXT: PX, ComSpec: "C:\\Windows\\system32\\cmd.exe" };
    const rows = safe(() => doc.diagnose(layout, { projectDir: home, pi: { platform: "win32", env, spawn, exists } }));
    const r = Array.isArray(rows) ? rows.find((x) => x.label === "pi executable") : null;
    return { status: r?.status, detail: String(r?.detail ?? ""), calls };
  };
  const cmd = fileSet("C:\\npm\\pi.cmd");
  const v = row(true, cmd, { status: 0, stdout: "1.0.2\r\nmore\r\n", stderr: "a warning" });
  out("doctor win32: version with stderr noise → ok 1.0.2", [v.status, v.detail], ["ok", "1.0.2"]);
  out("doctor win32: ran through ComSpec", v.calls[0]?.command, "C:\\Windows\\system32\\cmd.exe");
  for (const [label, reply] of [["exit 1", { status: 1, stdout: "1.0.2\n", stderr: "" }], ["empty", { status: 0, stdout: "", stderr: "" }],
    ["malformed", { status: 0, stdout: "pi version one\n", stderr: "" }], ["stderr only", { status: 0, stdout: "", stderr: "1.0.2\n" }],
    ["spawn error", { status: null, error: Object.assign(new Error("spawn EACCES"), { code: "EACCES" }) }]]) out(`doctor win32: ${label} → fail on the real home`, row(true, cmd, reply).status, "fail");
  const miss = row(true, fileSet(), { status: 0, stdout: "1.0.2\n", stderr: "" });
  out("doctor win32: not found → fail with the shared hint", [miss.status, miss.detail.includes(steps.PI_INSTALL_HINT ?? "\u0000")], ["fail", true]);
  const refReal = row(true, fileSet("C:\\n%pm\\pi.cmd"), { status: 0, stdout: "1.0.2\n", stderr: "" }, "C:\\n%pm");
  out("doctor win32: refused .cmd on the real home → fail naming %, no spawn", [refReal.status, refReal.detail.includes("%"), refReal.calls.length], ["fail", true, 0]);
  const refOver = row(false, fileSet("C:\\n%pm\\pi.cmd"), { status: 0, stdout: "1.0.2\n", stderr: "" }, "C:\\n%pm");
  out("doctor win32: refused .cmd under --home → note naming %, no spawn", [refOver.status, refOver.detail.includes("%"), refOver.calls.length], ["note", true, 0]);
  fs.rmSync(home, { recursive: true, force: true });
}

process.env.PATH = savedPath;
console.log(`cases: ${n - bad}/${n}`);
console.log(`seat-verify-wincmd: ${bad} mismatch(es)`);
process.exit(bad ? 1 : 0);
