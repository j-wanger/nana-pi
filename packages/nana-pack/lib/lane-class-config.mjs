/**
 * @module packages/nana-pack/lib/lane-class-config.mjs
 * @purpose Seal lane-class paths, launchers and process bounds with their provenance.
 * @inputs none
 * @outputs Class path rules, launched CLI paths, base and timeout.
 * @effects none
 * @errors none
 */
// Plan: docs/reviews/lane-class-2026-10-28/plan.md, R-2960–R-2967.
// AGENTS.md:94 (2026-10-28): the ordinary/install/hook/gate boundary; paths mirror that definition.
export const CLASS_PATHS = [
	// contract (selective-ci revision 3, R-3185): no selector exists in this scope.
	{ prefix: ".github/workflows/ci.yml", kind: "gate", why: "CI verdict nana-land reads" },
	{ prefix: "scripts/test.mjs", kind: "gate", why: "CI verdict nana-land reads" },
	{ prefix: "packages/nana-pack/lib/test-runner-config.mjs", kind: "gate", why: "CI verdict nana-land reads" },
	{ prefix: "packages/nana-setup/claude/hooks/", kind: "hook", why: "Claude Code hook" },
	{ prefix: "packages/nana-setup/bin/", kind: "install", why: "nana-setup CLI" },
	{ prefix: "packages/nana-setup/lib/", kind: "install", why: "nana-setup library" },
	{ prefix: "packages/nana-pack/lib/gate-paths.ts", kind: "gate", why: "nana-gate policy" },
	{ prefix: "packages/nana-pack/lib/gate-rm-inside.ts", kind: "gate", why: "nana-gate policy" },
	{ prefix: "packages/nana-pack/lib/gate-rm-outside.ts", kind: "gate", why: "nana-gate policy" },
	{ prefix: "packages/nana-pack/lib/gate-shell.ts", kind: "gate", why: "nana-gate policy" },
	{ prefix: "packages/nana-pack/lib/gate-temp-roots.ts", kind: "gate", why: "nana-gate policy" },
	{ prefix: "packages/nana-pack/bin/nana-land.mjs", kind: "gate", why: "land tool" },
	{ prefix: "packages/nana-pack/bin/pi-review.mjs", kind: "gate", why: "review tool" },
	{ prefix: "packages/nana-pack/bin/claude-review.mjs", kind: "gate", why: "review tool" },
	{ prefix: "packages/nana-pack/bin/review-round.mjs", kind: "gate", why: "review tool" },
];

// packages/nana-setup/lib/hook-producer.mjs and settings.mjs launch tables, read 2026-10-28.
export const LAUNCHED_CLIS = [
	"packages/nana-pack/bin/nana-objective.mjs",
	"packages/nana-pack/bin/nana-frontier-summary.mjs",
	"packages/nana-pack/bin/nana-adoption.mjs",
	"packages/nana-knowledge/bin/nana-knowledge.ts",
	"packages/nana-setup/bin/stale-copies.mjs",
];
// chosen: follow review-movement's bounded child-process pattern; five seconds comfortably exceeds local classification.
export const LANE_CLASS_TIMEOUT_MS = 5000;
// chosen: cap captured class output at 1 MiB, far above the line-oriented classifier's bounded report.
export const LANE_CLASS_MAX_BUFFER_BYTES = 1024 * 1024;
export const LANE_CLASS_BASE = "main";
