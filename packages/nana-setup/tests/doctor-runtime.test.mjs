/**
 * @module packages/nana-setup/tests/doctor-runtime.test.mjs
 * @purpose Pins pi executable diagnostics and first-executable pi-review PATH resolution.
 * @inputs doctor.mjs, steps.mjs, PATH fixtures and scratch layouts.
 * @outputs PASS/FAIL lines and a nonzero exit on failed checks.
 * @effects disk (creates executables and links under the OS temp directory), process environment (temporarily changes PATH/platform).
 * @errors failed checks exit nonzero.
 */
import { tmpDir } from "./tmp-dir.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { diagnose, firstOnPath } from "../lib/doctor.mjs";
import { resolveLayout, repoRoot } from "../lib/paths.mjs";
import { PI_INSTALL_HINT, PI_REVIEW_BIN, stepPiRegister } from "../lib/steps.mjs";

let fails = 0;
const check = (title, ok, detail = "") => { console.log(ok ? "PASS" : "FAIL", title, ok ? "" : detail); if (!ok) fails++; };
const home = tmpDir(path.join(os.tmpdir(), "nana-doctor-runtime-"));
const bin = path.join(home, "bin");
fs.mkdirSync(bin);
const executable = (name, body) => { const file = path.join(bin, name); fs.writeFileSync(file, `#!/bin/sh\n${body}\n`); fs.chmodSync(file, 0o755); return file; };
const savedPath = process.env.PATH;
const savedPlatform = process.env.NANA_SETUP_PLATFORM;
process.env.NANA_SETUP_PLATFORM = "darwin";
const layout = { ...resolveLayout({ home }), isRealHome: true };
const piRow = () => diagnose(layout, { projectDir: home }).find((item) => item.label === "pi executable");
try {
	const valid = executable("pi", "echo 1.0.2");
	process.env.PATH = `${bin}:/usr/bin:/bin`;
	const goodPi = piRow();
	// req: R-952
	check("pi executable reports a dotted version", goodPi?.status === "ok" && goodPi.detail === "1.0.2", JSON.stringify(goodPi));
	executable("pi", "exit 1");
	// req: R-952
	check("pi executable failure is a real-home failure", piRow()?.status === "fail" && piRow().detail.includes("pi --version exited 1"));
	executable("pi", "echo hello");
	// req: R-952
	check("pi executable rejects output without a version", piRow()?.status === "fail" && piRow().detail.includes("printed no version"));
	fs.unlinkSync(valid);
	// req: R-952
	check("missing pi names the shared install hint", piRow()?.status === "fail" && piRow().detail.includes(PI_INSTALL_HINT));
	// req: R-952
	check("install missing-pi detail imports the same hint and never reaches install", stepPiRegister(layout, {}).at(-1)?.detail.includes(PI_INSTALL_HINT));
	const override = resolveLayout({ home });
	// req: R-952
	check("missing pi under override is informational", diagnose(override, { projectDir: home }).find((item) => item.label === "pi executable")?.status === "note");
	process.env.NANA_SETUP_PLATFORM = "win32";
	// req: R-952
	check("win32 skips pi executable probe", diagnose(layout, { projectDir: home }).find((item) => item.label === "pi executable")?.detail === "skipped (win32)");
	process.env.NANA_SETUP_PLATFORM = "darwin";

	const realBin = path.join(home, "real-bin");
	fs.mkdirSync(realBin);
	fs.symlinkSync(PI_REVIEW_BIN, path.join(realBin, "pi-review"));
	const stubDir = path.join(home, "shadow-bin");
	fs.mkdirSync(stubDir);
	const stub = path.join(stubDir, "pi-review");
	fs.writeFileSync(stub, "#!/bin/sh\nexit 0\n");
	fs.chmodSync(stub, 0o755);
	// req: R-953
	check("firstOnPath skips empty and non-executable entries", (() => { const noExec = path.join(home, "not-executable"); fs.writeFileSync(noExec, "x"); process.env.PATH = `${path.dirname(noExec)}:${realBin}`; return firstOnPath("pi-review") === path.join(realBin, "pi-review"); })());
	process.env.PATH = realBin;
	// req: R-953
	check("real pi-review target on PATH passes", diagnose(layout, { projectDir: home }).find((item) => item.label === "PATH resolves pi-review")?.status === "ok");
	process.env.PATH = `${stubDir}:${realBin}`;
	const shadow = diagnose(layout, { projectDir: home }).find((item) => item.label === "PATH resolves pi-review");
	// req: R-953
	check("earlier executable shadow is rejected by realpath", shadow?.status === "fail" && shadow.detail.includes(stub));
	process.env.PATH = "/usr/bin:/bin";
	const absent = diagnose(layout, { projectDir: home }).find((item) => item.label === "PATH resolves pi-review");
	// req: R-953
	check("missing pi-review names the PATH fix", absent?.status === "fail" && absent.detail.includes(layout.binDir) && absent.detail.includes("~/.zprofile"));
	// req: R-953
	check("PATH mismatch under override is informational", diagnose(resolveLayout({ home }), { projectDir: home }).find((item) => item.label === "PATH resolves pi-review")?.status === "note");
} finally {
	process.env.PATH = savedPath;
	if (savedPlatform === undefined) delete process.env.NANA_SETUP_PLATFORM;
	else process.env.NANA_SETUP_PLATFORM = savedPlatform;
}
if (fails) process.exitCode = 1;
