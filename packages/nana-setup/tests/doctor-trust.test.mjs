/**
 * @module packages/nana-setup/tests/doctor-trust.test.mjs
 * @purpose Pins doctor's project-trust warning and repair command for an untrusted project configuration.
 * @inputs doctor diagnose, explicit setup layout, and a temporary project and home.
 * @outputs PASS/FAIL lines and a nonzero process exit when any assertion fails.
 * @effects disk (temporary project config and home).
 * @errors a failed assertion prints FAIL and exits nonzero.
 */
import * as fs from "node:fs";
import { tmpDir } from "./tmp-dir.mjs";
import * as os from "node:os";
import * as path from "node:path";
import { diagnose, STATUS } from "../lib/doctor.mjs";
import { resolveLayout } from "../lib/paths.mjs";
import { withPiStub } from "./stub-pi.mjs";
const diagnoseWithPi = (...args) => withPiStub(() => diagnose(...args));

const root = tmpDir(path.join(os.tmpdir(), "nana-doctor-trust-"));
const projectDir = path.join(root, "project");
const home = path.join(root, "home");
fs.mkdirSync(path.join(projectDir, ".pi"), { recursive: true });
fs.writeFileSync(path.join(projectDir, ".pi", "nana-pack.json"), "{}\n");
const row = diagnoseWithPi(resolveLayout({ home }), { projectDir }).find((check) => check.label === "project trust");
let fails = 0;
const check = (name, ok, detail = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : detail); if (!ok) fails++; };
// req: R-674
check("doctor warns and prints trust command for an untrusted project configuration", row?.status === STATUS.WARN && row.detail.includes(`nana-setup trust ${projectDir}`), JSON.stringify(row));
fs.rmSync(root, { recursive: true, force: true });
process.exit(fails ? 1 : 0);
