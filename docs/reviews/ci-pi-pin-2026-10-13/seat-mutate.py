import subprocess, os, re, sys, tempfile, shutil
repo = os.path.expanduser("~/nana-pi-wt/ci-pi-pin")
wt = tempfile.mkdtemp(prefix="pin-mut-"); os.rmdir(wt)
subprocess.run(["git","-C",repo,"worktree","add","--detach","-q",wt,"HEAD"],check=True)
ci = os.path.join(wt,".github/workflows/ci.yml"); base = open(ci).read()
npmrc = os.path.join(wt,".npmrc")
T1="every pi install in CI resolves at the declared cutoff"
T2="the pi resolution cutoff is declared once, quoted, in UTC ISO form beside PI_VERSION"
T3="the pi resolution cutoff is sealed at the seat's install moment"
T4="npm's before is never set through the environment or a repository-root .npmrc"
FLAG=' --before="${PI_BEFORE}"'
def last_install(s):  # drop the flag from the LAST install line (release)
    i = s.rfind(FLAG); return s[:i]+s[i+len(FLAG):]
M = [
 ("flag dropped from the release line", lambda s: last_install(s), None, T1),
 ("a third pi install line without the flag", lambda s: s.replace("      - run: npm test", "      - run: npm i -g @earendil-works/pi-coding-agent@${PI_VERSION}\n      - run: npm test",1), None, T1),
 ("an unversioned pi install step", lambda s: s.replace("      - run: npm test", "      - run: npm i -g @earendil-works/pi-coding-agent\n      - run: npm test",1), None, T1),
 ("no Z", lambda s: s.replace('PI_BEFORE: "2026-10-04T06:57:57Z"','PI_BEFORE: "2026-10-04T06:57:57"'), None, T2),
 ("unquoted value", lambda s: s.replace('PI_BEFORE: "2026-10-04T06:57:57Z"','PI_BEFORE: 2026-10-04T06:57:57Z'), None, T2),
 ("rollover date", lambda s: s.replace('PI_BEFORE: "2026-10-04T06:57:57Z"','PI_BEFORE: "2026-02-30T06:57:57Z"'), None, T2),
 ("a second PI_BEFORE in the suite env", lambda s: re.sub(r"(\n  suite:\n(?:    .*\n)*?)(    steps:)", r"\1    env:\n      PI_BEFORE: \"2026-10-04T06:57:57Z\"\n\2", s, count=1), None, T2),
 ("npm_config_before in the suite env", lambda s: re.sub(r"(\n  suite:\n(?:    .*\n)*?)(    steps:)", r"\1    env:\n      npm_config_before: ${{ env.PI_BEFORE }}\n\2", s, count=1), None, T4),
 ("a root .npmrc with before", lambda s: s, "before=2026-10-04\n", T4),
 ("retuned cutoff", lambda s: s.replace('PI_BEFORE: "2026-10-04T06:57:57Z"','PI_BEFORE: "2026-10-05T00:00:00Z"'), None, T3),
]
red=0
for name, f, rc, title in M:
    s = f(base); applied = s != base or rc
    open(ci,"w").write(s)
    if rc: open(npmrc,"w").write(rc)
    r = subprocess.run(["node","packages/nana-pack/tests/ci-workflow.test.mjs"],cwd=wt,capture_output=True,text=True)
    fails = [l for l in r.stdout.splitlines() if l.startswith("FAIL")]
    ok = applied and any(title in l for l in fails)
    red += ok
    print(("RED  " if ok else "MISS ")+name+(" — failing: "+"; ".join(l[5:60] for l in fails) if not ok else ""))
    open(ci,"w").write(base)
    if rc: os.remove(npmrc)
subprocess.run(["git","-C",repo,"worktree","remove","--force",wt])
print(f"pin-mutate: {red}/{len(M)} red")
