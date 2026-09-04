// Security property (2026-09-04): every state-changing route on the desk rejects
// cross-origin browser requests and non-JSON bodies BEFORE doing anything. The desk
// is unauthenticated on localhost, so without this any web page open in the same
// browser could fire a "simple" text/plain POST at /api/spawn. Reads stay open.
// Zero-dep: drives the REAL server on a test port, no pi child is ever spawned.
// Run: node apps/desk/test/origin-rule.test.mjs   (exit 0 = all PASS)
import { spawn } from "node:child_process";

const PORT = Number(process.env.DESK_TEST_PORT || 4391);
const BASE = `http://127.0.0.1:${PORT}`;
const OWN = `http://127.0.0.1:${PORT}`;
const EVIL = "http://evil.example";
const SERVER = new URL("../server.mjs", import.meta.url).pathname;

const server = spawn("node", [SERVER], { env: { ...process.env, DESK_PORT: String(PORT) }, stdio: ["ignore", "pipe", "pipe"] });
let fails = 0;
const check = (n, ok, extra = "") => { console.log(ok ? "PASS" : "FAIL", n, extra); if (!ok) fails++; };
const req = (method, path, { origin, ct, body } = {}) => {
	const headers = {};
	if (origin !== undefined) headers.origin = origin;
	if (ct) headers["content-type"] = ct;
	return fetch(BASE + path, { method, headers, body });
};

try {
	for (let i = 0; i < 40; i++) {
		try { await fetch(BASE + "/api/live"); break; } catch { await new Promise((r) => setTimeout(r, 250)); }
		if (i === 39) throw new Error("desk server never came up");
	}

	// 1. the attack: cross-origin simple POST at /api/spawn → 403, and nothing spawned
	let r = await req("POST", "/api/spawn", { origin: EVIL, ct: "text/plain", body: JSON.stringify({ cwd: "/tmp" }) });
	check("cross-origin text/plain POST /api/spawn → 403", r.status === 403, String(r.status));
	const live = await fetch(BASE + "/api/live").then((x) => x.json());
	check("…and no child was spawned", Array.isArray(live) && live.length === 0);

	// 2. cross-origin but JSON (would need a preflight in a browser; still refused on origin)
	r = await req("POST", "/api/spawn", { origin: EVIL, ct: "application/json", body: JSON.stringify({ cwd: "/tmp" }) });
	check("cross-origin JSON POST → 403", r.status === 403, String(r.status));

	// 3. same-origin JSON POST reaches the route (bad file → not 403)
	r = await req("POST", "/api/rename", { origin: OWN, ct: "application/json", body: JSON.stringify({ file: "/nope", name: "x" }) });
	check("same-origin JSON POST reaches the route", r.status !== 403, String(r.status));

	// 4. same-origin but text/plain body → 403 (JSON content-type is mandatory)
	r = await req("POST", "/api/rename", { origin: OWN, ct: "text/plain", body: JSON.stringify({ file: "/nope", name: "x" }) });
	check("same-origin text/plain POST → 403", r.status === 403, String(r.status));

	// 5. non-browser client (no Origin) with JSON body reaches the route
	r = await req("POST", "/api/rename", { ct: "application/json", body: JSON.stringify({ file: "/nope", name: "x" }) });
	check("no-Origin JSON POST reaches the route", r.status !== 403, String(r.status));

	// 6. localhost spelling of our own origin is accepted
	r = await req("POST", "/api/rename", { origin: `http://localhost:${PORT}`, ct: "application/json", body: JSON.stringify({ file: "/nope", name: "x" }) });
	check("http://localhost:<port> origin accepted", r.status !== 403, String(r.status));

	// 7. body-less DELETE: foreign origin → 403; no origin → reaches the route (404 here)
	r = await req("DELETE", "/api/session/nope", { origin: EVIL });
	check("cross-origin body-less DELETE → 403", r.status === 403, String(r.status));
	r = await req("DELETE", "/api/session/nope", {});
	check("no-Origin DELETE reaches the route", r.status === 404, String(r.status));

	// 8. reads stay open regardless of origin
	r = await req("GET", "/api/live", { origin: EVIL });
	check("cross-origin GET still 200 (browser SOP hides the body)", r.status === 200, String(r.status));

	// 9. Origin: null (sandboxed iframe / file://) is foreign
	r = await req("POST", "/api/spawn", { origin: "null", ct: "application/json", body: "{}" });
	check("Origin: null → 403", r.status === 403, String(r.status));
} catch (e) {
	console.log("HARNESS ERROR", e);
	fails = 99;
} finally {
	server.kill();
}
process.exit(fails ? 1 : 0);
