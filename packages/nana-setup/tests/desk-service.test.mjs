/**
 * @module packages/nana-setup/tests/desk-service.test.mjs
 * @purpose Pins that the desk launchd service is opt-in, rendered from the template with REAL resolved values, never bootstrapped from a test, and that a skipped plist write (a symlink in the way) makes zero launchctl calls
 * @inputs lib/steps.mjs renderPlist/stepDesk, the plist template, bin/nana-setup.mjs, a throwaway --home, and (for the caller-level section) a stubbed `launchctl` script placed first on PATH
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (throwaway home layouts, rendered plists and a stub launchctl script), process (spawns the installer CLI, and — only via the PATH-stubbed fake — `launchctl`; the REAL launchctl is never called)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// Gate: the desk launchd service is opt-in, rendered from the template with REAL resolved
// values, and never loaded from a test. launchctl is only ever called when the install targets
// the real home — every run here uses --home, so the service is written and not bootstrapped.
//
// The second section below calls stepDesk() directly with a hand-built layout (isRealHome:
// true) and a FAKE `launchctl` placed first on PATH for the duration of the call, restored
// immediately after — this is the only way to exercise the isRealHome branch (where launchctl
// IS called) without ever touching the real machine's real launchctl.
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const pkg = path.resolve(new URL("..", import.meta.url).pathname);
const cli = path.join(pkg, "bin", "nana-setup.mjs");
const repo = path.resolve(pkg, "..", "..");
const { renderPlist, stepDesk, DESK_SERVER, installExitCode } = await import(new URL("../lib/steps.mjs", import.meta.url).href);
const { SKIPPED, UPDATED, CREATED, PROBLEM } = await import(new URL("../lib/fsops.mjs", import.meta.url).href);

let fails = 0;
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra ?? "");
	if (!ok) fails++;
};

/* --- the template renders, and escapes ------------------------------------------------- */
{
	const out = renderPlist({ LABEL: "com.nana.pi-desk", NODE: "/n/node", SERVER: "/r/server.mjs", WORKDIR: "/r", PATH: "/a&b:/c<d>", LOG: "/l/desk.log" });
	check("template: no placeholders left", !/\{\{\w+\}\}/.test(out));
	check("template: keeps the launchd label", out.includes("<key>Label</key><string>com.nana.pi-desk</string>"));
	check("template: program arguments are node + server", out.includes("<string>/n/node</string>") && out.includes("<string>/r/server.mjs</string>"));
	check("template: PATH is XML-escaped", out.includes("/a&amp;b:/c&lt;d&gt;"));
	check("template: RunAtLoad and KeepAlive survive", out.includes("<key>RunAtLoad</key><true/>") && out.includes("<key>KeepAlive</key><true/>"));
	let threw = false;
	try {
		renderPlist({ LABEL: "x" });
	} catch {
		threw = true;
	}
	check("template: a missing value is an error, not an empty string", threw);
}

if (process.platform !== "darwin") {
	console.log("SKIP not darwin — the install half of this test is macOS-only");
	process.exit(fails);
}

const { PI_SUBAGENTS_FLOOR } = await import(new URL("../lib/doctor.mjs", import.meta.url).href);

const tmps = [];
function freshHome() {
	const td = fs.mkdtempSync(path.join(os.tmpdir(), "nana-setup-desk-"));
	tmps.push(td);
	fs.mkdirSync(path.join(td, ".pi", "agent", "nana-knowledge"), { recursive: true });
	fs.writeFileSync(path.join(td, ".pi", "agent", "nana-knowledge", "sources.json"), JSON.stringify({ roots: [] }));
	// doctor's pi-subagents version check (R-364) reads a vendor package nana-setup never
	// installs — seed it at the floor so this fixture reads as an already-set-up machine.
	const subagentsDir = path.join(td, ".pi", "agent", "npm", "node_modules", "pi-subagents");
	fs.mkdirSync(subagentsDir, { recursive: true });
	fs.writeFileSync(path.join(subagentsDir, "package.json"), JSON.stringify({ name: "pi-subagents", version: PI_SUBAGENTS_FLOOR }));
	return td;
}
const run = (args) => spawnSync(process.execPath, [cli, ...args], { encoding: "utf8" });

/* --- opt-in ---------------------------------------------------------------------------- */
const home = freshHome();
const plist = path.join(home, "Library", "LaunchAgents", "com.nana.pi-desk.plist");
run(["install", "--home", home]);
check("no --desk: no plist is written", !fs.existsSync(plist));

const r = run(["install", "--home", home, "--desk"]);
check("--desk exits 0", r.status === 0, r.stderr);
check("--desk writes the plist", fs.existsSync(plist));
const body = fs.readFileSync(plist, "utf8");
check("plist uses the resolved node", body.includes(`<string>${process.execPath}</string>`));
check("plist points at this install's desk server", body.includes(path.join(repo, "apps", "desk", "server.mjs")));
check("plist WorkingDirectory is the install root", body.includes(`<key>WorkingDirectory</key><string>${repo}</string>`));
check("plist logs into the pi home", body.includes(path.join(home, ".pi", "agent", "desk.log")));
check("plist carries a PATH", /<key>PATH<\/key><string>[^<]+<\/string>/.test(body));
const launchPath = /<key>PATH<\/key><string>([^<]+)<\/string>/.exec(body)?.[1] ?? "";
// req: R-396
check("plist PATH is curated and excludes the installing shell snapshot", launchPath === [path.dirname(process.execPath), path.join(home, ".local", "bin"), "/opt/homebrew/bin", "/usr/local/bin", "/usr/bin", "/bin"].join(":"), launchPath);
// req: R-314
check("launchctl is NOT called under --home", r.stdout.includes("not loaded (--home override in play)"));

const again = run(["install", "--home", home, "--desk"]);
check("--desk is idempotent", again.stdout.includes("nothing to do"));
check("doctor marks a sandbox desk service as not live-loaded", /· desk service/.test(run(["doctor", "--home", home]).stdout));

/* --- caller-level: a SKIPPED plist write must make zero launchctl calls (MUST 1, astra r1) --- */
{
	// A fake launchctl that logs every invocation and reports success for everything, so if
	// stepDesk DID call it we would see the call land in the log, not infer silence from a crash.
	const stubDir = fs.mkdtempSync(path.join(os.tmpdir(), "nana-fake-launchctl-"));
	tmps.push(stubDir);
	const callLog = path.join(stubDir, "calls.log");
	fs.writeFileSync(callLog, "");
	const stubPath = path.join(stubDir, "launchctl");
	fs.writeFileSync(stubPath, '#!/bin/bash\necho "$@" >> "' + callLog + '"\nexit 0\n');
	fs.chmodSync(stubPath, 0o755);

	const calls = () =>
		fs
			.readFileSync(callLog, "utf8")
			.split("\n")
			.filter(Boolean);
	const withStubFirst = (fn) => {
		const savedPath = process.env.PATH;
		process.env.PATH = `${stubDir}:${savedPath}`;
		try {
			return fn();
		} finally {
			process.env.PATH = savedPath;
		}
	};

	const baseLayout = (dir) => ({
		base: dir,
		piHome: path.join(dir, ".pi", "agent"),
		deskLog: path.join(dir, ".pi", "agent", "desk.log"),
		plistPath: path.join(dir, "Library", "LaunchAgents", "com.nana.pi-desk.plist"),
		isRealHome: true, // forces the branch where launchctl WOULD be called — exactly what MUST 1 is about
	});

	/* a LIVE symlinked plist pointing outside the install's own tree */
	{
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nana-desk-skip-live-"));
		tmps.push(dir);
		const layout = baseLayout(dir);
		fs.mkdirSync(path.dirname(layout.plistPath), { recursive: true });
		const victim = path.join(dir, "victim-plist.xml");
		fs.writeFileSync(victim, "the owner's original plist content\n");
		fs.symlinkSync(victim, layout.plistPath);
		fs.writeFileSync(callLog, "");

		const out = withStubFirst(() => stepDesk(layout, {}));
		// req: R-380
		check("live symlink: desk plist is SKIPPED", out[0]?.status === SKIPPED, JSON.stringify(out));
		// req: R-380
		check("live symlink: desk launchctl is SKIPPED too, not reloaded/bootstrapped", out[1]?.status === SKIPPED, JSON.stringify(out));
		// req: R-380
		check("live symlink: ZERO launchctl calls were made", calls().length === 0, calls().join(" | "));
		check("live symlink: the victim's content is untouched", fs.readFileSync(victim, "utf8") === "the owner's original plist content\n");
		check("live symlink: the plist path is still a symlink", fs.lstatSync(layout.plistPath).isSymbolicLink());
	}

	/* a DANGLING symlinked plist */
	{
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nana-desk-skip-dangling-"));
		tmps.push(dir);
		const layout = baseLayout(dir);
		fs.mkdirSync(path.dirname(layout.plistPath), { recursive: true });
		const missing = path.join(dir, "nowhere-plist.xml");
		fs.symlinkSync(missing, layout.plistPath);
		fs.writeFileSync(callLog, "");

		const out = withStubFirst(() => stepDesk(layout, {}));
		// req: R-380
		check("dangling symlink: desk plist is SKIPPED", out[0]?.status === SKIPPED, JSON.stringify(out));
		// req: R-380
		check("dangling symlink: desk launchctl is SKIPPED too", out[1]?.status === SKIPPED, JSON.stringify(out));
		// req: R-380
		check("dangling symlink: ZERO launchctl calls were made", calls().length === 0, calls().join(" | "));
		check("dangling symlink: the dangling target was NOT created", !fs.existsSync(missing));
		check("dangling symlink: the plist path is still a symlink", fs.lstatSync(layout.plistPath).isSymbolicLink());
	}

	/* regression: a REGULAR plist still proceeds to launchctl as before */
	{
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nana-desk-skip-regular-"));
		tmps.push(dir);
		const layout = baseLayout(dir);
		fs.mkdirSync(path.dirname(layout.plistPath), { recursive: true });
		fs.writeFileSync(callLog, "");

		const out = withStubFirst(() => stepDesk(layout, {}));
		check("regular file: desk plist is CREATED, not SKIPPED", out[0]?.status === CREATED, JSON.stringify(out));
		check("regular file: desk launchctl proceeded (not SKIPPED)", out[1]?.status !== SKIPPED, JSON.stringify(out));
		check("regular file: launchctl WAS called (print, then restart)", calls().length >= 2, calls().join(" | "));
		fs.writeFileSync(callLog, "");
		withStubFirst(() => stepDesk(layout, {})); // unchanged plist: explicit repair branch
		// req: R-397
		check("explicit repair restarts an unchanged loaded service with kickstart -k", calls().some((call) => call === `kickstart -k gui/${process.getuid()}/com.nana.pi-desk`), calls().join(" | "));
	}

	/* first-load sequence and fatal lifecycle failures */
	{
		fs.writeFileSync(stubPath, '#!/bin/sh\necho "$@" >> "' + callLog + '"\n[ "$1" = print ] && exit "${FAKE_LOADED:-1}"\n[ "$FAIL_ON" = "$1" ] && exit 7\nexit 0\n');
		fs.chmodSync(stubPath, 0o755);
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nana-desk-first-load-"));
		tmps.push(dir);
		const layout = baseLayout(dir);
		fs.mkdirSync(path.dirname(layout.plistPath), { recursive: true });
		fs.writeFileSync(callLog, "");
		const out = withStubFirst(() => stepDesk(layout, {}));
		const sequence = calls();
		// req: R-356
		check("first load bootstraps and then kickstarts without -k", sequence.includes(`bootstrap gui/${process.getuid()} ${layout.plistPath}`) && sequence.includes(`kickstart gui/${process.getuid()}/com.nana.pi-desk`) && !sequence.some((call) => call.includes("kickstart -k")), sequence.join(" | "));
		// req: R-652
		check("first-load kickstart is plain", sequence.at(-1) === `kickstart gui/${process.getuid()}/com.nana.pi-desk`, sequence.join(" | "));
		fs.writeFileSync(callLog, "");
		process.env.FAIL_ON = "bootstrap";
		const failed = withStubFirst(() => stepDesk(baseLayout(fs.mkdtempSync(path.join(os.tmpdir(), "nana-desk-bootstrap-fail-"))), {}));
		delete process.env.FAIL_ON;
		process.env.FAKE_LOADED = "0";
		process.env.FAIL_ON = "kickstart";
		const failedKickstart = withStubFirst(() => stepDesk(baseLayout(dir), {}));
		delete process.env.FAIL_ON;
		delete process.env.FAKE_LOADED;
		// req: R-398
		check("bootstrap or kickstart failure is a PROBLEM and makes install exit 1", failed.some((row) => row.status === PROBLEM) && failedKickstart.some((row) => row.status === PROBLEM) && installExitCode(failed) === 1 && installExitCode(failedKickstart) === 1, `${JSON.stringify(failed)} ${JSON.stringify(failedKickstart)}`);
	}


	/* R-380's scope boundary (astra r2 MUST 2): under --dry-run the early `if (o.dryRun) return
	   out;` fires before the SKIPPED-write check even runs, so a dangling plist under dry-run
	   returns just the one "desk plist" entry — no second "desk launchctl" entry at all. That
	   is still safe (no launchctl call either way); R-380's unconditional reporting promise is
	   qualified to "outside a dry run" rather than widened to cover this case too, which would
	   change dry-run's existing single-entry output. */
	{
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nana-desk-skip-dryrun-"));
		tmps.push(dir);
		const layout = baseLayout(dir);
		fs.mkdirSync(path.dirname(layout.plistPath), { recursive: true });
		fs.symlinkSync(path.join(dir, "nowhere-plist.xml"), layout.plistPath);
		fs.writeFileSync(callLog, "");

		const out = withStubFirst(() => stepDesk(layout, { dryRun: true }));
		// req: R-380
		check("dry run + skipped plist: only the desk plist entry is returned, no desk launchctl entry at all", out.length === 1 && out[0]?.status === SKIPPED, JSON.stringify(out));
		// req: R-380
		check("dry run + skipped plist: ZERO launchctl calls were made", calls().length === 0, calls().join(" | "));
	}
}

for (const t of tmps) fs.rmSync(t, { recursive: true, force: true });
process.exit(fails);
