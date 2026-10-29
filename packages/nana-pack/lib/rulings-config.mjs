/**
 * @module packages/nana-pack/lib/rulings-config.mjs
 * @purpose Every tunable the nana-rulings extension and nana-setup's install/doctor steps read, each defined once with provenance, so file names, caps and prompt sections have no inline duplicates.
 * @inputs none — pure constants
 * @outputs RULINGS_FILE, RULINGS_READ_CAP, RULINGS_HEADING, RULINGS_SECTION, RULINGS_UNAVAILABLE and the sealed pi seat-guide values
 * @effects none
 * @errors none
 */
// Sealed tunables for nana's standing rulings (rulings-file lane, 2026-10-19). Defined once
// here, read by name everywhere else (extensions/nana-rulings.ts, nana-setup's lib/steps.mjs,
// lib/paths.mjs, lib/doctor.mjs, lib/state-manifest.mjs). Retuning any of these must change no
// code — only this file.

/** contract R-1412/R-1413: the installed file's own name, both in pi's active agent dir and in
 *  Claude Code's rules folder. */
export const RULINGS_FILE = "nana-rulings.md";

/** chosen: about 3.4 times the shipped seed (packages/nana-pack/rules/nana-rulings.md is 2,404
 *  bytes as shipped, 2026-10-19), roughly 2k tokens — enough headroom for ordinary growth of a
 *  dated-bullet file without raising the cap at every land that adds one ruling. Pinned by
 *  rulings.test.mjs::seal: RULINGS_READ_CAP is 8192 (R-1411). */
export const RULINGS_READ_CAP = 8192;

/** The heading the injected block carries, read fresh at every session_start (R-1410). */
export const RULINGS_HEADING = "## Standing rulings (nana)";

/** The system-prompt section key the nana-rulings extension sets at before_agent_start. */
export const RULINGS_SECTION = "nana-rulings";

/** The one-line marker's fixed prefix when the installed file is unusable (R-1411) — addressed
 *  to the user, never an instruction for an agent to act on by itself. */
export const RULINGS_UNAVAILABLE = "RULINGS UNAVAILABLE:";

/** contract R-3020/R-3021: the shared canonical seat rule's installed file name. */
export const SEAT_GUIDE_FILE = "nana-seat.md";

/** chosen: the shipped guide is about 2.6 KiB (2026-10-29), and 8192 bytes allows substantial growth while bounding each seat session's read. Pinned by rulings.test.mjs::seal: SEAT_GUIDE_READ_CAP is 8192 (R-3023). */
export const SEAT_GUIDE_READ_CAP = 8192;

/** The heading under which the full installed seat guide is injected. */
export const SEAT_GUIDE_HEADING = "## Seat guide (nana)";

/** The system-prompt section key the nana-rulings extension sets at before_agent_start. */
export const SEAT_GUIDE_SECTION = "nana-seat-guide";

/** The one-line unavailable marker prefix, distinct from rulings. */
export const SEAT_GUIDE_UNAVAILABLE = "SEAT GUIDE UNAVAILABLE:";
