/**
 * @module packages/nana-setup/tests/agent-dir-consumers.test.mjs
 * @purpose Pins that widening the agent-dir resolution never splits a producer from its consumer — the installer's knowledge home matches the runtime default
 * @inputs lib/paths.mjs and throwaway --home targets
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (throwaway home layouts), process (spawns resolver probes)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// U2 astra land (MUST 2): widening the agent-dir resolution must not split a producer from
// its consumer.
//   MUST 2 — under an ABSOLUTE ambient PI_CODING_AGENT_DIR the installer's knowledge home is the
//            nana-knowledge RUNTIME default (<home>/.pi/agent/nana-knowledge), which never reads
//            that variable; the explicit --pi-home / --home flags still place it.
// Run with --experimental-strip-types (the runtime paths module is TypeScript).
import { tmpDir } from "./tmp-dir.mjs";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const PATHS = new URL("../lib/paths.mjs", import.meta.url).href;
const KPATHS = new URL("../../nana-knowledge/lib/paths.ts", import.meta.url).href;

let fails = 0;
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra ?? "");
	if (!ok) fails++;
};

const HOME = fs.realpathSync(tmpDir(path.join(os.tmpdir(), "nana-setup-adc-")));
const CUSTOM = path.join(HOME, "custom-agent"); // absolute override
const baseEnv = { ...process.env, HOME, USERPROFILE: HOME };
delete baseEnv.NANA_KNOWLEDGE_HOME;
delete baseEnv.PI_CODING_AGENT_DIR;

// Both resolvers, each in a fresh process with the env under test (they read env at call time,
// but os.homedir() and the resolver must see exactly what a real run would).
function paths(env, opts = {}) {
	const src = `const L = await import(${JSON.stringify(PATHS)}); const K = await import(${JSON.stringify(KPATHS)});
		const l = L.resolveLayout(${JSON.stringify(opts)}); console.log(JSON.stringify({ piHome: l.piHome, knowledgeHome: l.knowledgeHome, runtime: K.home() }));`;
	const r = spawnSync(process.execPath, ["--experimental-strip-types", "--no-warnings", "--input-type=module", "-e", src], { env, encoding: "utf-8" });
	if (r.status !== 0) throw new Error(r.stderr);
	return JSON.parse(r.stdout);
}

try {
	// ── MUST 2 ──
	const amb = paths({ ...baseEnv, PI_CODING_AGENT_DIR: CUSTOM });
	check("MUST 2: the ambient absolute override still moves piHome", amb.piHome === CUSTOM, JSON.stringify(amb));
	// req: R-310
	check("MUST 2: installer knowledgeHome == the nana-knowledge runtime default under that override",
		amb.knowledgeHome === amb.runtime && amb.runtime === path.join(HOME, ".pi", "agent", "nana-knowledge"), JSON.stringify(amb));
	const dflt = paths(baseEnv);
	// req: R-310
	check("MUST 2: with no override the two agree too", dflt.knowledgeHome === dflt.runtime, JSON.stringify(dflt));
	const flagged = paths({ ...baseEnv, PI_CODING_AGENT_DIR: CUSTOM }, { piHome: path.join(HOME, "flag-agent") });
	check("MUST 2: an explicit --pi-home still places it", flagged.knowledgeHome === path.join(HOME, "flag-agent", "nana-knowledge"), JSON.stringify(flagged));
	const homed = paths(baseEnv, { home: path.join(HOME, "h2") });
	check("MUST 2: --home still places it", homed.knowledgeHome === path.join(HOME, "h2", ".pi", "agent", "nana-knowledge"), JSON.stringify(homed));
} finally {
	fs.rmSync(HOME, { recursive: true, force: true });
}
console.log(fails ? `${fails} FAILED` : "all PASS");
process.exit(fails ? 1 : 0);
