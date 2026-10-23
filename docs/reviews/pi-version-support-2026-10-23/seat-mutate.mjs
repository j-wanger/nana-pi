#!/usr/bin/env node
// Seat wrong-code pairs for lane pi-version-support (install), written by the seat 2026-10-23 after build 2, at tip c3968694.
// They are the draft's pairs 1 to 23 and the must-meet's 24 to 32.
// Run from the lane worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/pi-version-support-2026-10-23/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const CI = ".github/workflows/ci.yml";
const DEPS = "packages/nana-setup/lib/pi-dependencies.mjs";
const DOC = "packages/nana-setup/lib/doctor.mjs";
const ROOT_README = "README.md";
const SETUP_README = "packages/nana-setup/README.md";
const T_CI = "packages/nana-pack/tests/ci-workflow.test.mjs";
const T_DEPS = "packages/nana-setup/tests/doctor-pi-dependencies.test.mjs";
const T_PIN = "packages/nana-setup/tests/pi-install-pin.test.mjs";
const R_2711 = /^R-2711: /; // R-2711
const R_2712 = /^R-2712: /; // R-2712
const SEAL = /^pin R-2711 and R-2712: /; // R-2711, R-2712
const R_2713 = /^R-2713: /; // R-2713
const R_2714 = /^R-2714: /; // R-2714
const R_2715 = /^R-2715: /; // R-2715
const R_2716 = /^R-2716: /; // R-2716
const R_2717 = /^R-2717: /; // R-2717
const R_1090 = /^every pi install in CI resolves at the declared cutoff\b/; // R-1090
const R_1093 = /^every README pi install command carries CI's ceiling or floor version with that version's unquoted cutoff\b/; // R-1093
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const ENV = [
	"  # chosen 2026-10-23 (R-2711, R-2716): 1.4.0 is the supported ceiling; both CI probes passed.",
	"  PI_VERSION: 1.4.0",
	"  # measured 2026-10-23 (R-1091): the scratch install moment of pi 1.4.0; npm --before at this",
	"  # time reproduced that install's `npm ls -g --all` exactly (262 lines). Move it with PI_VERSION.",
	"  PI_BEFORE: \"2026-10-23T18:35:54Z\"",
	"  # chosen 2026-10-23 (R-2711, R-2712, R-2716): 1.0.3 is the supported floor; both CI probes passed.",
	"  PI_FLOOR_VERSION: 1.0.3",
	"  # measured 2026-10-23 (R-2712): inside pi 1.0.3's lockstep publish window; a scratch install",
	"  # resolved all six scoped pi dependencies at 1.0.3. Move it with PI_FLOOR_VERSION.",
	"  PI_FLOOR_BEFORE: \"2026-10-05T08:40:00Z\"",
	"",
].join("\n");
const MAIN_ENV = [
	"  # 1.0.2: installed and verified version, pi 1.0 adoption 2026-10-04",
	"  PI_VERSION: 1.0.2",
	"  PI_BEFORE: \"2026-10-04T06:57:57Z\"",
	"",
].join("\n");
const MATRIX_PI = "        pi: [ceiling, floor]\n";
const CEILING_INSTALL = "      - run: npm i -g --ignore-scripts @earendil-works/pi-coding-agent@${PI_VERSION} --before=\"${PI_BEFORE}\"\n        if: matrix.pi == 'ceiling'\n";
const CEILING_VERIFY = "      - name: Verify ceiling pi version\n        if: matrix.pi == 'ceiling'\n        run: test \"$(pi --version)\" = \"${PI_VERSION}\"\n";
const FLOOR_INSTALL_LINE = "      - run: npm i -g --ignore-scripts @earendil-works/pi-coding-agent@${PI_FLOOR_VERSION} --before=\"${PI_FLOOR_BEFORE}\"\n";
const FLOOR_GATE = "        if: matrix.pi == 'floor'\n";
const FLOOR_VERIFY = "      - name: Verify floor pi version\n        if: matrix.pi == 'floor'\n        run: test \"$(pi --version)\" = \"${PI_FLOOR_VERSION}\"\n";
const CHECK_STEP = "      - name: Install check\n        env:\n          TEMP: ${{ runner.temp }}\n          TMP: ${{ runner.temp }}\n        run: node packages/nana-setup/bin/install-check.mjs\n";
const MAIN_STEPS = "      - run: npm i -g --ignore-scripts @earendil-works/pi-coding-agent@${PI_VERSION} --before=\"${PI_BEFORE}\"\n      - name: Verify pi version\n        run: test \"$(pi --version)\" = \"${PI_VERSION}\"\n";

const NEWER_TEST = "if (versionAtLeast(version, piVersion) && !versionAtLeast(piVersion, version)) newer.push(`${name} ${version}`);";
const PI_GATE = "  if (typeof piVersion !== \"string\" || !VERSION.test(piVersion)) {\n    return { status: \"note\", detail: `could not read an exact three-part version from ${PI_PACKAGE}` };\n  }\n";
const SCOPE_FILTER = "const names = Object.keys(found.manifest.dependencies ?? {}).filter((name) => name.startsWith(scope));";
const EXECUTABLE = "const executable = win32 ? piEntry : firstOnPath(\"pi\", env.PATH);";
const ROW = "add(packages.status, \"pi dependencies\", packages.detail);";
const FLOOR_SENTENCE = "To stay at the supported floor, use `npm i -g --ignore-scripts @earendil-works/pi-coding-agent@1.0.3 --before=2026-10-05T08:40:00Z`. ";

const DECLARED = [
	"(plan) pairs 1 to 23 follow the draft's pair table; 24 to 32 are the must-meet's (attack M-1, S-1, S-3, S-6, N-7; build 1 finding)",
	"(seat) pair 1 restores main's env and install-check steps but keeps the suite and release jobs, which main and the lane share",
	"(seat) pair 8 takes the unquoted form, pair 9 the floor declared above PI_BEFORE, pair 10 PI_VERSION 1.3.0",
	"(seat) pair 17 finds the package through `npm root -g`, reading its package.json in the decoy prefix, so the row reads the lockstep decoy (attack S-2)",
	"(seat) pair 21 makes the win32 branch search PATH as off win32 does, instead of using the shim's package entry",
	"(seat) pair 28 drops the gate on pi's own version and reads newer as !versionAtLeast(pi, dep), the attack's reading A, so a version-less pi gives ✗",
];

const PAIRS = [
	{ n: "1", name: "main's ci.yml env and install-check steps", edits: [
		one(CI, ENV, MAIN_ENV),
		one(CI, MATRIX_PI, ""),
		one(CI, CEILING_INSTALL + CEILING_VERIFY + FLOOR_INSTALL_LINE + FLOOR_GATE + FLOOR_VERIFY, MAIN_STEPS),
	], tests: [T_CI], expectRed: [R_2711, R_2712, SEAL] },
	{ n: "2", name: "the pi matrix dimension dropped", edits: [
		one(CI, MATRIX_PI, ""),
	], tests: [T_CI], expectRed: [R_2711] },
	{ n: "3", name: "the floor leg installs PI_VERSION", edits: [
		one(CI, "@${PI_FLOOR_VERSION} --before=\"${PI_FLOOR_BEFORE}\"", "@${PI_VERSION} --before=\"${PI_FLOOR_BEFORE}\""),
	], tests: [T_CI], expectRed: [R_2711] },
	{ n: "4", name: "the floor install uses the ceiling cutoff", edits: [
		one(CI, "@${PI_FLOOR_VERSION} --before=\"${PI_FLOOR_BEFORE}\"", "@${PI_FLOOR_VERSION} --before=\"${PI_BEFORE}\""),
	], tests: [T_CI], expectRed: [R_2711, R_1090] },
	{ n: "5", name: "the floor version check compares with PI_VERSION", edits: [
		one(CI, "run: test \"$(pi --version)\" = \"${PI_FLOOR_VERSION}\"", "run: test \"$(pi --version)\" = \"${PI_VERSION}\""),
	], tests: [T_CI], expectRed: [R_2711] },
	{ n: "6", name: "the floor version check after the install-check step", edits: [
		one(CI, FLOOR_VERIFY + CHECK_STEP, CHECK_STEP + FLOOR_VERIFY),
	], tests: [T_CI], expectRed: [R_2711] },
	{ n: "7", name: "the floor install step has no if:", edits: [
		one(CI, FLOOR_INSTALL_LINE + FLOOR_GATE, FLOOR_INSTALL_LINE),
	], tests: [T_CI], expectRed: [R_2711] },
	{ n: "8", name: "PI_FLOOR_BEFORE unquoted", edits: [
		one(CI, "  PI_FLOOR_BEFORE: \"2026-10-05T08:40:00Z\"\n", "  PI_FLOOR_BEFORE: 2026-10-05T08:40:00Z\n"),
	], tests: [T_CI], expectRed: [R_2712] },
	{ n: "9", name: "the floor pair declared above PI_BEFORE", edits: [
		one(CI, "  PI_BEFORE: \"2026-10-23T18:35:54Z\"\n  # chosen 2026-10-23 (R-2711, R-2712, R-2716): 1.0.3 is the supported floor; both CI probes passed.\n  PI_FLOOR_VERSION: 1.0.3\n  # measured 2026-10-23 (R-2712): inside pi 1.0.3's lockstep publish window; a scratch install\n  # resolved all six scoped pi dependencies at 1.0.3. Move it with PI_FLOOR_VERSION.\n  PI_FLOOR_BEFORE: \"2026-10-05T08:40:00Z\"\n",
			"  PI_FLOOR_VERSION: 1.0.3\n  PI_FLOOR_BEFORE: \"2026-10-05T08:40:00Z\"\n  PI_BEFORE: \"2026-10-23T18:35:54Z\"\n"),
	], tests: [T_CI], expectRed: [R_2712] },
	{ n: "10", name: "PI_VERSION 1.3.0", edits: [
		one(CI, "  PI_VERSION: 1.4.0\n", "  PI_VERSION: 1.3.0\n"),
	], tests: [T_CI], expectRed: [SEAL] },
	{ n: "11", name: "main's doctor: no new row", edits: [
		one(DOC, ROW, ""),
	], tests: [T_DEPS], expectRed: [R_2713, R_2714, R_2715] },
	{ n: "12", name: "any version difference counts as newer", edits: [
		one(DEPS, NEWER_TEST, "if (version !== piVersion) newer.push(`${name} ${version}`);"),
	], tests: [T_DEPS], expectRed: [R_2714] },
	{ n: "13", name: "string compare instead of numeric", edits: [
		one(DEPS, NEWER_TEST, "if (version > piVersion) newer.push(`${name} ${version}`);"),
	], tests: [T_DEPS], expectRed: [R_2713] },
	{ n: "14", name: "the scope filter dropped", edits: [
		one(DEPS, SCOPE_FILTER, "const names = Object.keys(found.manifest.dependencies ?? {});"),
	], tests: [T_DEPS], expectRed: [R_2714] },
	{ n: "15", name: "nested lookup dropped (hoisted only)", edits: [
		one(DEPS, "function dependencyManifest(packageRoot, name, { paths, readText }) {\n  let dir = packageRoot;", "function dependencyManifest(packageRoot, name, { paths, readText }) {\n  let dir = paths.dirname(packageRoot);"),
	], tests: [T_DEPS], expectRed: [R_2713, R_2714] },
	{ n: "16", name: "hoisted lookup dropped (nested only)", edits: [
		one(DEPS, "    if (manifest) return manifest;\n", "    return manifest;\n"),
	], tests: [T_DEPS], expectRed: [R_2714] },
	{ n: "17", name: "the package found through npm root -g instead of the pi on PATH", edits: [
		one(DEPS, EXECUTABLE, "const executable = win32 ? piEntry : paths.join(String(process.getBuiltinModule(\"node:child_process\").spawnSync(\"npm\", [\"root\", \"-g\"], { env, encoding: \"utf8\" }).stdout ?? \"\").trim(), ...PI_PACKAGE.split(\"/\"), \"package.json\");"),
	], tests: [T_DEPS], expectRed: [R_2713] },
	{ n: "18", name: "a missing dependency reported as newer", edits: [
		one(DEPS, "      unreadable.push(name);\n", "      newer.push(`${name} missing`);\n"),
	], tests: [T_DEPS], expectRed: [R_2715] },
	{ n: "19", name: "no package found reported ✗", edits: [
		one(DEPS, "if (!found) return { status: \"note\",", "if (!found) return { status: \"fail\","),
	], tests: [T_DEPS], expectRed: [R_2715] },
	{ n: "20", name: "the ✗ detail without the install hint", edits: [
		one(DEPS, " — install: ${PI_INSTALL_HINT}`,", "`,"),
	], tests: [T_DEPS], expectRed: [R_2713] },
	{ n: "21", name: "the win32 branch searches PATH instead of using the shim's package", edits: [
		one(DEPS, EXECUTABLE, "const executable = firstOnPath(\"pi\", env.PATH);"),
	], tests: [T_DEPS], expectRed: [R_2713, R_2714] },
	{ n: "22", name: "the README names 1.0.2 through 1.4.0", edits: [
		one(ROOT_README, "nana supports pi 1.0.3 through 1.4.0.", "nana supports pi 1.0.2 through 1.4.0."),
	], tests: [T_PIN], expectRed: [R_2716] },
	{ n: "23", name: "the README support sentence removed", edits: [
		one(ROOT_README, "nana supports pi 1.0.3 through 1.4.0. ", ""),
	], tests: [T_PIN], expectRed: [R_2716] },
	{ n: "24", name: "the install-check step gated to the ceiling", edits: [
		one(CI, "      - name: Install check\n", "      - name: Install check\n        if: matrix.pi == 'ceiling'\n"),
	], tests: [T_CI], expectRed: [R_2711] },
	{ n: "25", name: "a matrix exclude of the Windows floor leg", edits: [
		one(CI, MATRIX_PI, MATRIX_PI + "        exclude:\n          - os: windows-latest\n            pi: floor\n"),
	], tests: [T_CI], expectRed: [R_2711] },
	{ n: "26", name: "the ✗ detail names only the first newer dependency", edits: [
		one(DEPS, "${newer.join(\", \")}", "${newer[0]}"),
	], tests: [T_DEPS], expectRed: [R_2713] },
	{ n: "27", name: "the row also reads devDependencies", edits: [
		one(DEPS, SCOPE_FILTER, "const names = Object.keys({ ...found.manifest.dependencies, ...found.manifest.devDependencies }).filter((name) => name.startsWith(scope));"),
	], tests: [T_DEPS], expectRed: [R_2714] },
	{ n: "28", name: "pi's own version not judged, newer read as !versionAtLeast(pi, dep)", edits: [
		one(DEPS, PI_GATE, ""),
		one(DEPS, NEWER_TEST, "if (!versionAtLeast(piVersion, version)) newer.push(`${name} ${version}`);"),
	], tests: [T_DEPS], expectRed: [R_2715] },
	{ n: "29", name: "the floor install drops --ignore-scripts", edits: [
		one(CI, "npm i -g --ignore-scripts @earendil-works/pi-coding-agent@${PI_FLOOR_VERSION}", "npm i -g @earendil-works/pi-coding-agent@${PI_FLOOR_VERSION}"),
	], tests: [T_CI], expectRed: [R_2711] },
	{ n: "30", name: "the setup README's floor command carries the ceiling cutoff", edits: [
		one(SETUP_README, "@earendil-works/pi-coding-agent@1.0.3 --before=2026-10-05T08:40:00Z", "@earendil-works/pi-coding-agent@1.0.3 --before=2026-10-23T18:35:54Z"),
	], tests: [T_PIN], expectRed: [R_1093] },
	{ n: "31", name: "the setup README's floor command removed", edits: [
		one(SETUP_README, FLOOR_SENTENCE, ""),
	], tests: [T_PIN], expectRed: [R_2717] },
	{ n: "32", name: "the new row labelled pi packages", edits: [
		one(DOC, ROW, "add(packages.status, \"pi packages\", packages.detail);"),
	], tests: [T_DEPS], expectRed: [R_2714] },
];
process.exitCode = await runMutations({ lane: "pi-version-support", self: import.meta.url, tip: "c3968694", declared: DECLARED, pairs: PAIRS });
