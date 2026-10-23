/**
 * @module packages/nana-setup/tests/doctor-package-source.test.mjs
 * @purpose Pins doctor classification of pi package entries against the checkout supplying hooks and rules.
 * @inputs doctor.mjs, steps.mjs, scratch pi settings and checkout fixtures.
 * @outputs PASS/FAIL lines and a nonzero exit on failed checks.
 * @effects disk (reads scratch settings and writes fixtures under the OS temp directory).
 * @errors failed checks exit nonzero.
 */
import { tmpDir } from "./tmp-dir.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { diagnose, packageSourceState } from "../lib/doctor.mjs";
import { resolveLayout, repoRoot } from "../lib/paths.mjs";
import { gitCommonDir, packageCoverage } from "../lib/steps.mjs";

let fails = 0;
const check = (title, ok, detail = "") => { console.log(ok ? "PASS" : "FAIL", title, ok ? "" : detail); if (!ok) fails++; };
const home = tmpDir(path.join(os.tmpdir(), "nana-doctor-package-source-"));
const bin = tmpDir(path.join(os.tmpdir(), "nana-doctor-package-pi-bin-"));
const piStub = path.join(bin, process.platform === "win32" ? "pi.cmd" : "pi");
fs.writeFileSync(piStub, process.platform === "win32" ? "@echo off\necho pi 1.0.2\n" : "#!/bin/sh\necho pi 1.0.2\n");
if (process.platform !== "win32") fs.chmodSync(piStub, 0o755);
const savedPath = process.env.PATH;
const layout = resolveLayout({ home });
fs.mkdirSync(path.dirname(layout.piSettings), { recursive: true });
const setPackages = (packages) => fs.writeFileSync(layout.piSettings, JSON.stringify({ packages }));
const row = (packages, root = repoRoot) => { setPackages(packages); return packageSourceState(layout, root); };
try {
process.env.PATH = `${bin}${path.delimiter}${savedPath || ""}`;
// req: R-997
check("remote entry names pi's own managed clone as foreign", (() => { const s = row(["git:github.com/j-wanger/nana-pi"]); return s?.status === "fail" && s.detail.includes("git:github.com/j-wanger/nana-pi") && s.detail.includes(path.join(layout.piHome, "git")); })());
// req: R-997
check("remote source fails directly after healthy pi package coverage", (() => { const rows = diagnose(layout, { projectDir: home }); const packages = rows.findIndex((item) => item.label === "pi packages"); return rows[packages]?.status === "ok" && rows[packages + 1]?.label === "pi package source" && rows[packages + 1]?.status === "fail"; })());
// req: R-997
check("remote plus local registrations still identifies the remote source", (() => { const s = row(["git:github.com/j-wanger/nana-pi", path.relative(layout.piHome, path.join(repoRoot, "packages/nana-pack"))]); return s?.status === "fail" && s.detail.includes("git:github.com/j-wanger/nana-pi"); })());
// req: R-998
check("relative package entries within checkout name the supplying tree", (() => { const packages = [path.relative(layout.piHome, path.join(repoRoot, "packages/nana-pack")), "npm:pi-subagents@0.75.0"]; const s = row(packages); const doctor = diagnose(layout, { projectDir: home }).find((item) => item.label === "pi package source"); return s?.status === "ok" && s.detail === `${repoRoot}: the tree supplying hooks and rules` && doctor?.status === "ok" && doctor.detail === s.detail; })());
// req: R-997
check("same git identity outside checkout is reported by resolved path", (() => { const fixture = tmpDir(path.join(os.tmpdir(), "nana-doctor-package-worktree-")); const gitFile = path.join(fixture, ".git"); const common = gitCommonDir(repoRoot); fs.writeFileSync(gitFile, `gitdir: ${common}\n`); const s = row([fixture]); return s?.status === "fail" && s.detail.includes(fixture); })(), "fixture not detected");
// req: R-997
check("object-form remote source is classified", (() => { const s = row([{ source: "git:github.com/j-wanger/nana-pi" }]); return s?.status === "fail" && s.detail.includes("git:github.com/j-wanger/nana-pi"); })());
// req: R-999
check("managed checkout remedy clones first", (() => { const root = path.join(layout.piHome, "git", "github.com", "j-wanger", "nana-pi"); const s = row(["git:github.com/j-wanger/nana-pi"], root); return s?.remedy?.includes("git clone https://github.com/j-wanger/nana-pi") && s.remedy.includes("run `nana-setup install` from the clone") && s.remedy.indexOf("nana-setup install") < s.remedy.indexOf("pi remove"); })());
// req: R-998
check("unrelated npm-only entries produce no package-source state", row(["npm:pi-subagents@0.75.0"]) === null);
const localEntry = path.relative(layout.piHome, repoRoot);
const settingsObjects = [{ packages: [localEntry] }, { packages: ["git:github.com/j-wanger/nana-pi", localEntry] }];
const packageRows = () => diagnose(layout, { projectDir: home }).filter((item) => item.label === "pi packages" || item.label === "pi package source").map(({ status, label, detail }) => ({ status, label, detail }));
// req: R-1810
check("doctor prints the pi packages and pi package source rows for a pi settings.json saved with a byte-order mark as for the same file without one", settingsObjects.every((settings, index) => { const text = JSON.stringify(settings, null, 2) + "\n"; fs.writeFileSync(layout.piSettings, text); const baseline = packageRows(); const anchored = JSON.stringify(baseline.map(({ status }) => status)) === JSON.stringify(index === 0 ? ["ok", "ok"] : ["ok", "fail"]); return anchored && ["\uFEFF" + text, ("\uFEFF" + text).replace(/\n/g, "\r\n")].every((marked) => { fs.writeFileSync(layout.piSettings, marked); return JSON.stringify(packageRows()) === JSON.stringify(baseline); }); }));
const validSettings = JSON.stringify({ packages: [localEntry] }, null, 2) + "\n";
const invalidSettings = ["\uFEFF\uFEFF" + validSettings, "\uFEFF{" + "\uFEFF" + validSettings.slice(1), "\uFEFF" + validSettings.replace(/}\n$/, "\n")];
// req: R-1812
check("two leading marks, a mark inside the object or malformed text after one mark leave pi's settings with no package entries for doctor and install", invalidSettings.every((text) => { fs.writeFileSync(layout.piSettings, text); const coverage = packageCoverage(layout); return packageSourceState(layout) === null && !coverage.present && coverage.entries.length === 0; }));
if (fails) process.exitCode = 1;
} finally { process.env.PATH = savedPath; }
