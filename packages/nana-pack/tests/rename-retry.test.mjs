/**
 * @module packages/nana-pack/tests/rename-retry.test.mjs
 * @purpose Pin the shared synchronous rename retry policy, seam ordering and sealed retry tunables.
 * @inputs rename-retry.mjs and injected rename, delay and recheck functions
 * @outputs one PASS / FAIL line per check and a non-zero exit when any check failed
 * @effects none
 * @errors a FAIL line naming the broken contract; a non-zero exit code
 */
import {
	RENAME_RETRY_ATTEMPTS,
	RENAME_RETRY_CODES,
	RENAME_RETRY_DELAY_MS,
	renameWithRetry,
} from "../lib/rename-retry.mjs";

let fails = 0;
const check = (name, ok, why = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : why); if (!ok) fails++; };
const coded = (code, n) => {
	let calls = 0;
	const events = [];
	const error = Object.assign(new Error(code), { code });
	const rename = () => {
		calls++;
		events.push(`rename:${calls}`);
		if (calls <= n) throw error;
	};
	return { rename, error, events, calls: () => calls };
};

let oneFailureOk = true;
for (const code of ["EPERM", "EBUSY", "EACCES"]) {
	const c = coded(code, 1);
	renameWithRetry("from", "to", { rename: c.rename, delay: () => c.events.push("delay"), recheck: () => c.events.push("recheck") });
	oneFailureOk &&= JSON.stringify(c.events) === JSON.stringify(["rename:1", "delay", "recheck", "rename:2"]);
}
let exhaustionOk = true;
for (const code of ["EPERM", "EBUSY", "EACCES"]) {
	const c = coded(code, Infinity);
	let thrown;
	try { renameWithRetry("from", "to", { rename: c.rename, delay: () => c.events.push("delay"), recheck: () => c.events.push("recheck") }); } catch (error) { thrown = error; }
	exhaustionOk &&= thrown === c.error && c.calls() === 3
		&& JSON.stringify(c.events) === JSON.stringify(["rename:1", "delay", "recheck", "rename:2", "delay", "recheck", "rename:3"]);
}
const defaultDelay = coded("EPERM", 1);
let defaultRechecks = 0;
const defaultStarted = Date.now();
let defaultDelayOk = true;
try { renameWithRetry("from", "to", { rename: defaultDelay.rename, delay: undefined, recheck: () => { defaultRechecks++; } }); } catch { defaultDelayOk = false; }
defaultDelayOk &&= defaultDelay.calls() === 2 && defaultRechecks === 1 && Date.now() - defaultStarted >= RENAME_RETRY_DELAY_MS;
let permanentOk = true;
for (const code of ["ENOENT", "EXDEV"]) {
	const c = coded(code, Infinity);
	let thrown;
	try { renameWithRetry("from", "to", { rename: c.rename, delay: () => c.events.push("delay"), recheck: () => c.events.push("recheck") }); } catch (error) { thrown = error; }
	permanentOk &&= thrown === c.error && JSON.stringify(c.events) === JSON.stringify(["rename:1"]);
}
// req: R-2659
check("R-2659: the shared rename retry waits, rechecks and retries only EPERM, EBUSY and EACCES, on every platform, up to the configured attempts, then throws the last error",
	oneFailureOk && defaultDelayOk && exhaustionOk && permanentOk);

// req: R-2659
check("seal: three attempts 20 ms apart on EPERM, EBUSY and EACCES",
	RENAME_RETRY_ATTEMPTS === 3 && RENAME_RETRY_DELAY_MS === 20 && Object.isFrozen(RENAME_RETRY_CODES)
	&& JSON.stringify(RENAME_RETRY_CODES) === JSON.stringify(["EPERM", "EBUSY", "EACCES"]));

process.exit(fails);
