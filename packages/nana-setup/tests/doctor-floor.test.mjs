/**
 * @module packages/nana-setup/tests/doctor-floor.test.mjs
 * @purpose Run extracted core contract guards on every land.
 * @inputs Real modules and isolated fixtures.
 * @outputs Original requirement-tagged PASS/FAIL checks.
 * @effects disk (temporary fixtures), process (bounded fixture children).
 * @errors Failed checks exit nonzero.
 */
import { DESK_NODE_FLOOR } from "../lib/doctor.mjs";
const check = (name, ok) => { console.log(ok ? "PASS" : "FAIL", name); if (!ok) process.exitCode = 1; };
	// req: R-650
	check("desk Node floor is pinned at 22.19", DESK_NODE_FLOOR === "22.19");
	// Node floor: the objective hook's CLI imports .ts unflagged (type stripping, default from 22.18)
	{
		const { nodeMeetsFloor, NODE_FLOOR } = await import(new URL("../lib/doctor.mjs", import.meta.url).href);
		// req: R-344
		check("NODE_FLOOR is 22.18", NODE_FLOOR === "22.18");
		// req: R-344
		check("node floor: 22.17.1 fails, 22.18.0 / 22.22.2 / v24.0.0 pass, 21.9.0 fails",
			!nodeMeetsFloor("22.17.1") && nodeMeetsFloor("22.18.0") && nodeMeetsFloor("22.22.2") && nodeMeetsFloor("v24.0.0") && !nodeMeetsFloor("21.9.0"));
	}

