// The prepared agent dir. Two failure modes it must not have: running a study against the
// operator's own settings (so pi's default auto-retry and auto-compaction quietly change what a
// run costs), and running without credentials so every run fails one API error at a time.
// Nothing here touches ~/.pi — the source dir is a temp fake.
// Run: node apps/bench/test/agentdir.test.mjs   (exit 0 = all PASS)
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { defaultBenchDir, defaultSourceDir, PINNED_SETTINGS, prepareAgentDir, refreshAuth } from "../lib/agentdir.mjs";

let fails = 0;
const check = (n, ok, extra = "") => {
	console.log(ok ? "PASS" : "FAIL", n, extra);
	if (!ok) fails++;
};

// The pinned values, against docs/settings.md. Each of these is a documented DEFAULT that would
// otherwise be on and would change the measurement.
check("retry.enabled pinned off (settings.md:143 default true)", PINNED_SETTINGS.retry.enabled === false);
check("retry.maxRetries pinned 0 (settings.md:144 default 3)", PINNED_SETTINGS.retry.maxRetries === 0);
check("retry.provider.maxRetries pinned 0 (settings.md:147)", PINNED_SETTINGS.retry.provider.maxRetries === 0);
check("compaction pinned off (settings.md:118 default true)", PINNED_SETTINGS.compaction.enabled === false);
check("no defaultTools key — --tools must be the only thing choosing tools", !("defaultTools" in PINNED_SETTINGS));
check("project trust pinned to never (usage.md:126-128)", PINNED_SETTINGS.defaultProjectTrust === "never");
check("the default bench dir is OUTSIDE the repo and separate from ~/.pi/agent", defaultBenchDir() !== defaultSourceDir() && defaultBenchDir().includes(".pi"));

const root = await fs.mkdtemp(path.join(os.tmpdir(), "bench-agentdir-"));
const src = path.join(root, "src-agent");
const dir = path.join(root, "bench-agent");
try {
	// 1. no credentials → refuse LOUDLY, before any spend
	await fs.mkdir(src, { recursive: true });
	let threw = null;
	try { await prepareAgentDir({ dir, sourceDir: src }); } catch (e) { threw = e.message; }
	check("refuses to prepare a dir with no auth.json", threw !== null);
	check("…and says where it looked and what to do", /auth\.json/.test(threw ?? "") && /cannot run isolated/.test(threw ?? ""), (threw ?? "").split("\n")[0]);
	check("…and creates nothing", !(await fs.stat(dir).catch(() => null)));

	// 2. with credentials → prepared, pinned, permissioned
	await fs.writeFile(path.join(src, "auth.json"), JSON.stringify({ "openai-codex": { type: "oauth", token: "SECRET-DO-NOT-LEAK" } }));
	await fs.writeFile(path.join(src, "models.json"), "{}");
	await fs.writeFile(path.join(src, "settings.json"), JSON.stringify({ retry: { enabled: true }, compaction: { enabled: true }, defaultTools: ["read"] }));
	await fs.writeFile(path.join(src, "AGENTS.md"), "operator instructions that must NOT reach a bench run");
	const prep = await prepareAgentDir({ dir, sourceDir: src });
	const written = JSON.parse(await fs.readFile(path.join(dir, "settings.json"), "utf8"));
	check("prepared", prep.dir === dir && prep.seeded.includes("auth.json"));
	check("settings.json is OURS, not the operator's", written.retry.enabled === false && written.compaction.enabled === false);
	check("the operator's defaultTools does not survive", !("defaultTools" in written));
	check("the operator's AGENTS.md is not copied", !(await fs.stat(path.join(dir, "AGENTS.md")).catch(() => null)));
	check("credentials were copied", (await fs.readFile(path.join(dir, "auth.json"), "utf8")).includes("SECRET"));
	check("models.json copied when present", prep.seeded.includes("models.json"));
	const mode = (p) => fs.stat(p).then((s) => s.mode & 0o777);
	check("the dir is 0700", (await mode(dir)) === 0o700, (await mode(dir)).toString(8));
	check("auth.json is 0600", (await mode(path.join(dir, "auth.json"))) === 0o600, (await mode(path.join(dir, "auth.json"))).toString(8));

	// 3. a stale dir is rebuilt, not merged into
	await fs.writeFile(path.join(dir, "leftover.json"), "{}");
	await prepareAgentDir({ dir, sourceDir: src });
	check("preparing again wipes leftovers (no state carries between studies)", !(await fs.stat(path.join(dir, "leftover.json")).catch(() => null)));

	// 4. per-run refresh picks up an upstream token rotation
	await fs.writeFile(path.join(src, "auth.json"), JSON.stringify({ "openai-codex": { type: "oauth", token: "ROTATED" } }));
	await refreshAuth({ dir, sourceDir: src });
	check("refreshAuth copies the CURRENT credentials", (await fs.readFile(path.join(dir, "auth.json"), "utf8")).includes("ROTATED"));
	check("…and keeps 0600", (await mode(path.join(dir, "auth.json"))) === 0o600);

	// 5. a token pi refreshed INSIDE the bench dir is never written back upstream
	await fs.writeFile(path.join(dir, "auth.json"), JSON.stringify({ "openai-codex": { token: "BENCH-LOCAL" } }));
	await refreshAuth({ dir, sourceDir: src });
	check("the bench dir never writes back to the operator's auth.json", (await fs.readFile(path.join(src, "auth.json"), "utf8")).includes("ROTATED"));
	check("…the bench copy is simply overwritten from upstream (documented limitation)", (await fs.readFile(path.join(dir, "auth.json"), "utf8")).includes("ROTATED"));

	// 6. credentials disappearing mid-study is loud, not silent
	await fs.rm(path.join(src, "auth.json"));
	threw = null;
	try { await refreshAuth({ dir, sourceDir: src }); } catch (e) { threw = e.message; }
	check("refreshAuth refuses to run without credentials", /refusing to run without credentials/.test(threw ?? ""), threw ?? "no throw");

	// 7. the fingerprint input never carries a secret
	const { settingsFingerprintInput } = await import("../lib/agentdir.mjs");
	check("the settings fingerprint contains no credential material", !/SECRET|ROTATED|BENCH-LOCAL|token/i.test(settingsFingerprintInput()));
} finally {
	await fs.rm(root, { recursive: true, force: true });
}
process.exit(fails ? 1 : 0);
