/**
 * @module scripts/code-map-launch-config.mjs
 * @purpose Seal launch inference vocabulary and impact labels with their plan provenance.
 * @inputs none
 * @outputs Named immutable launch settings.
 * @effects none
 * @errors none
 */
// Contract 2026-10-29, map-spawn-edges plan revision 2 A3 (R-3157).
export const LAUNCH_CALLS = Object.freeze(["spawn", "spawnSync", "exec", "execSync", "execFile", "execFileSync", "fork", "boundedSpawnSync", "runHookProducer"]);
// Contract 2026-10-29, plan rule 2 (R-3158): declared spelling variants, not arbitrary wrappers.
export const PATH_PRESERVING = Object.freeze(["fileURLToPath", "url.fileURLToPath", "realpathSync", "fs.realpathSync", "realpathSync.native", "fs.realpathSync.native", "realPath"]);
// Contract 2026-10-29, plan A4 (R-3159): these programs may execute repository code.
export const REPO_CODE_PROGRAMS = Object.freeze(["pi", "PI_BIN", "piBin", "piPath", "PI_PATH", "bash", "sh", "cmd", "cmd.exe", "powershell", "powershell.exe", "pwsh"]);
// Contract 2026-10-29, plan rule 5 (R-3160).
export const INLINE_FLAGS = Object.freeze(["-e", "-p", "--eval", "--print", "--input-type"]);
// Chosen 2026-10-29 (R-3153, R-3154; plan O2/O3): stable text, not a selector API.
export const IMPACT_LABELS = Object.freeze({ launch: "[launch/path]", blind: "always-run tests (blind reach):", untraced: "untraced tests:", unlinked: "test modules link no mapped module" });
