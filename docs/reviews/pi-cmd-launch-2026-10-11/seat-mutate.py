#!/usr/bin/env python3
"""Seat mutation runner for lane pi-cmd-launch (frozen). Each mutation breaks the CODE, runs the named
test file, and expects at least one FAIL line in it (or a non-zero exit); the file is restored with
`git checkout` after each. Run from the repo root (macOS: Windows-only cases are skipped there, so every
mutation here must be caught by a cross-platform case)."""
import subprocess, sys
WC = "packages/nana-pack/lib/win-command.mjs"
ST = "packages/nana-setup/lib/steps.mjs"
DR = "packages/nana-setup/lib/doctor.mjs"
PE = "packages/nana-pack/extensions/nana-post-edit.ts"
T_WC = "packages/nana-pack/tests/win-command.test.mjs"
T_PR = "packages/nana-setup/tests/pi-registration.test.mjs"
T_DR = "packages/nana-setup/tests/doctor-runtime.test.mjs"
T_PE = "packages/nana-pack/tests/post-edit-status.test.mjs"
M = [
  ("bare pi spawn on win32", ST, 'const pi = win32 ? findOnPath("pi", { env: piLookupEnv(env), cwd: process.cwd(), exists }) : "pi";', 'const pi = "pi";', T_PR),
  ("drop PATHEXT in the lookup", WC, "const candidates = nameExt && pats.some", "const candidates = [name]; const _unused = nameExt && pats.some", T_WC),
  ("search the working folder for pi", WC, "if (searchCwd && cwd) dirs.unshift(cwd);", "if (cwd) dirs.unshift(cwd);", T_WC),
  ("drop the argument quoting", WC, 'const line = [file, ...args].map((arg) => `"${arg}"`).join(" ");', 'const line = [file, ...args].join(" ");', T_WC),
  ("drop the % refusal", WC, '["%", "%"], ', '', T_WC),
  ("refuse % for .exe too", WC, 'if (ext === ".exe" || ext === ".com") return { command: file, args, options: {} };', 'if ((ext === ".exe" || ext === ".com") && ![file, ...args].some((v) => v.includes("%"))) return { command: file, args, options: {} };', T_WC),
  ("drop /v:off", WC, '["/d", "/v:off", "/s", "/c",', '["/d", "/s", "/c",', T_WC),
  ("compare extensions with case", WC, "const ext = path.win32.extname(file).toLowerCase();", "const ext = path.win32.extname(file);", T_WC),
  ("treat internal commands as missing", WC, "|| internal(word)) return false;", ") return false;", T_WC),
  ("let %, @ and ^ words through", WC, "!/^[A-Za-z0-9_.\\\\/:\\-]+$/.test(word)", "!/^.+$/.test(word)", T_WC),
  ("drop PATHEXT for separator paths", WC, "const candidates = [word, ...extensions(env).map((ext) => `${word}${ext}`)];", "const candidates = [word];", T_WC),
  ("drop the attached-syntax rule", WC, '["/", "\\\\", ".", ":"].some((sep) => folded.startsWith(name + sep))', "false", T_WC),
  ("found-but-failing pi is skipped", ST, 'if (probe.error || probe.status !== 0) return [{ label: "pi packages", status: PROBLEM,', 'if (probe.error || probe.status !== 0) return [{ label: "pi packages", status: SKIPPED,', T_PR),
  ("posix: any probe error is a skip", ST, 'if (!win32 && probe.error?.code === "ENOENT") return', 'if (!win32 && probe.error) return', T_PR),
  ("doctor runs a refused .cmd pi", DR, "refusal = invocation.refused;", "refusal = undefined;", T_DR),
  ("doctor: a refusal is only a note", DR, "add(valid ? OK : layout.isRealHome ? FAIL : NOTE,", "add(valid ? OK : NOTE,", T_DR),
  ("post-edit: drop the win32 missing-command rule", PE, "try { if (cmdCouldNotRun(command, { env, cwd, exists })) return \"error\"; } catch", "try { } catch", T_PE),
]
red = 0
for name, f, a, b, t in M:
    src = open(f, encoding="utf-8").read()
    if src.count(a) != 1:
        print(f"ANCHOR {name}: found {src.count(a)} times in {f}"); continue
    open(f, "w", encoding="utf-8").write(src.replace(a, b))
    r = subprocess.run(["node", t], capture_output=True, text=True, timeout=600)
    fails = [l for l in r.stdout.splitlines() if l.startswith("FAIL")]
    hit = bool(fails) or r.returncode != 0
    red += hit
    print(f"{'red ' if hit else 'GREEN'} {name} → {t.split('/')[-1]}: {fails[0][:90] if fails else ('exit ' + str(r.returncode))}")
    subprocess.run(["git", "checkout", "--", f])
st = subprocess.run(["git", "status", "--short", WC, ST, DR, PE], capture_output=True, text=True).stdout.strip()
print("worktree clean" if not st else f"WORKTREE DIRTY: {st}")
print(f"mutations: {red}/{len(M)} red")
sys.exit(0 if red == len(M) and not st else 1)
