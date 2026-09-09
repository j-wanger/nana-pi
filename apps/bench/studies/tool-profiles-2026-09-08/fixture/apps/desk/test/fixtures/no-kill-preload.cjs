// TEST-ONLY seam, loaded into the desk process with `node --require`. Nothing in
// apps/desk knows it exists.
//
// A child that survives SIGKILL cannot be faked portably (uninterruptible sleep is
// not something a test can arrange), but the invariant under test is really "the
// desk does not free a slot it cannot prove is free". That is reachable by making
// the KILL fail instead: ChildProcess#kill returns false and emits 'error', which
// is exactly what Node does when the signal cannot be delivered (EPERM), and the
// process goes on living.
//
// Patched on the PROTOTYPE, so it applies however the server imported spawn.
// Scoped to children whose argv carries the marker in DESK_TEST_NOKILL, so a test
// can have killable and unkillable children in the same desk.
const { ChildProcess } = require("node:child_process");

const realKill = ChildProcess.prototype.kill;
ChildProcess.prototype.kill = function (signal) {
	const marker = process.env.DESK_TEST_NOKILL;
	if (marker && (this.spawnargs || []).includes(marker)) {
		process.nextTick(() => this.emit("error", Object.assign(new Error(`kill ${signal || "SIGTERM"} refused (test seam)`), { code: "EPERM" })));
		return false;
	}
	return realKill.call(this, signal);
};
