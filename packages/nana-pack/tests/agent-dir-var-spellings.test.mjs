/**
 * @module packages/nana-pack/tests/agent-dir-var-spellings.test.mjs
 * @purpose Pins that the agent-dir variable rule catches exactly the four documented balanced spellings, case-insensitively, for both policy files and both separators
 * @inputs lib/gate-paths.ts and a temp dir standing in for the active agent dir
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (a temp dir), process (sets PI_CODING_AGENT_DIR)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// U2 fix round 2 (sol r2 MEDIUM): the agent-dir variable special case catches EXACTLY the four
// documented balanced spellings — `$NAME`, `${NAME}`, `%NAME%`, `$env:NAME` — case-insensitively
// (documented), each still blocking for both policy files and both slashes; the malformed or mixed
// forms the old optional-brace regex also caught are no longer required to block. The active dir
// is placed where no literal-path rule can see it, so only the variable rule can produce a hit.
// Run: node --experimental-strip-types packages/nana-pack/tests/agent-dir-var-spellings.test.mjs
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const TD = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "nana-u2v-")));
process.env.PI_CODING_AGENT_DIR = path.join(TD, "active");
const gp = await import(new URL("../lib/gate-paths.ts", import.meta.url).href);

let fails = 0;
const check = (n, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra); if (!ok) fails++; };
const hit = (word) => gp.commandPolicyHit(`printf x > ${word}`, TD);

const SPELLINGS = ["$PI_CODING_AGENT_DIR", "${PI_CODING_AGENT_DIR}", "%PI_CODING_AGENT_DIR%", "$env:PI_CODING_AGENT_DIR"];
for (const v of SPELLINGS)
	for (const file of ["nana-pack.json", "trust.json"])
		for (const sep of ["/", "\\", "//"]) {
			// req: R-053
			check(`blocks ${v}${sep}${file}`, hit(`${v}${sep}${file}`) !== null);
			check(`blocks "${v}${sep}${file}" (quoted)`, hit(`"${v}${sep}${file}"`) !== null);
		}
// documented: case-insensitive on purpose (cmd / pwsh names are)
for (const v of ["$pi_coding_agent_dir", "${Pi_Coding_Agent_Dir}", "%pi_coding_agent_dir%", "$ENV:pi_coding_agent_dir"])
	// req: R-053
	check(`blocks case variant ${v}/nana-pack.json`, hit(`${v}/nana-pack.json`) !== null);

// malformed / unbalanced / mixed: not one of the four — no longer required to block
for (const w of ["$PI_CODING_AGENT_DIR}/nana-pack.json", "${PI_CODING_AGENT_DIR/nana-pack.json", "%PI_CODING_AGENT_DIR/trust.json", "$env:PI_CODING_AGENT_DIR%/trust.json", "${PI_CODING_AGENT_DIR%/trust.json", "%PI_CODING_AGENT_DIR}/nana-pack.json"])
	// req: R-053
	check(`malformed ${w} is not matched by the variable rule`, hit(w) === null, String(hit(w)));

// nothing real became allowed: the literal active-dir path and the default dir still block
check("literal active-dir nana-pack.json still blocks", hit(path.join(TD, "active", "nana-pack.json")) !== null);
check("literal default-dir trust.json still blocks", hit("~/.pi/agent/trust.json") !== null);

fs.rmSync(TD, { recursive: true, force: true });
console.log(fails ? `${fails} FAIL` : "all PASS");
process.exit(fails ? 1 : 0);
