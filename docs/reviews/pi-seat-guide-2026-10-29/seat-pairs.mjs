import fs from "node:fs"; import path from "node:path"; import { execSync, spawnSync } from "node:child_process";
const S = path.dirname(new URL(import.meta.url).pathname); const R = path.join(S, "repo");
const EXT = "packages/nana-pack/extensions/nana-rulings.ts", CFG = "packages/nana-pack/lib/rulings-config.mjs";
const P = [
 ["P1", "R-3022", "guide injected for NANA_ROLE=worker (only reviewer excluded)", EXT,
  "seatGuide = LAUNCHER_ROLES.includes(env?.NANA_ROLE) ? null", `seatGuide = env?.NANA_ROLE === "reviewer" ? null`],
 ["P2", "R-3022", "guide injected for NANA_ROLE=reviewer (only worker excluded)", EXT,
  "seatGuide = LAUNCHER_ROLES.includes(env?.NANA_ROLE) ? null", `seatGuide = env?.NANA_ROLE === "worker" ? null`],
 ["P3", "R-3021/R-3022", "role check reads process.env instead of the injected env", EXT,
  "const env = opts.env ?? process.env;", "const env = process.env;"],
 ["P4", "R-3023", "oversized guide truncated to the cap instead of refused", EXT,
  "bytes = readBounded(filePath, SEAT_GUIDE_READ_CAP);", "bytes = readBounded(filePath, SEAT_GUIDE_READ_CAP * 4).subarray(0, SEAT_GUIDE_READ_CAP);"],
 ["P5", "R-3023", "marker reuses the rulings prefix (code)", EXT,
  "return `${SEAT_GUIDE_UNAVAILABLE} ${cause}", "return `${RULINGS_UNAVAILABLE} ${cause}"],
 ["P6", "R-3023", "marker reuses the rulings prefix (config value)", CFG,
  'export const SEAT_GUIDE_UNAVAILABLE = "SEAT GUIDE UNAVAILABLE:";', 'export const SEAT_GUIDE_UNAVAILABLE = "RULINGS UNAVAILABLE:";'],
 ["P7", "R-3022", "rulings section changed: guide appended into it for seat sessions", EXT,
  "if (block) (event as any).systemPromptOptions.sections[RULINGS_SECTION] = block;", "if (block) (event as any).systemPromptOptions.sections[RULINGS_SECTION] = seatGuide ? `${block}\\n\\n${seatGuide}` : block;"],
 ["P8", "R-3022", "rulings section dropped for launcher roles", EXT,
  "if (block) (event as any).systemPromptOptions.sections[RULINGS_SECTION] = block;", "if (block && seatGuide) (event as any).systemPromptOptions.sections[RULINGS_SECTION] = block;"],
 ["P9", "R-3020", "install copies the guide instead of linking on macOS", "packages/nana-setup/lib/steps.mjs",
  "linkFile(layout.piSeatGuide, seatGuideSource, { ...o, copyInstead: win(),", "linkFile(layout.piSeatGuide, seatGuideSource, { ...o, copyInstead: true,"],
 ["P10", "R-3020", "uninstall leaves the guide (manifest row removed)", "packages/nana-setup/lib/state-manifest.mjs",
  "  rebuild(`pi rule link ${SEAT_GUIDE_FILE}`, layout.piSeatGuide);\n", ""],
 ["P11", "R-3024", "doctor reports OK for a byte-equal POSIX copy", "packages/nana-setup/lib/doctor.mjs",
  "add(linkOk(layout.piSeatGuide, seatGuideSource) ? OK : FAIL", "add(fs.existsSync(layout.piSeatGuide) && fs.readFileSync(layout.piSeatGuide).equals(fs.readFileSync(seatGuideSource)) ? OK : FAIL"],
 ["P12", "R-3024", "doctor reports OK for a stale Windows copy", "packages/nana-setup/lib/doctor.mjs",
  "add(linkOk(layout.piSeatGuide, seatGuideSource) ? OK : FAIL", "add((platform() === \"win32\" ? fs.existsSync(layout.piSeatGuide) : linkOk(layout.piSeatGuide, seatGuideSource)) ? OK : FAIL"],
 ["P13", "R-3024", "stale-install notice omits the guide", EXT,
  "...(staleSeatGuide ? [`pi ${SEAT_GUIDE_FILE}`] : [])", ""],
 ["P14", "R-3025", "install-check does not check the guide heading", "packages/nana-setup/lib/install-check.mjs",
  "  if (!system.includes(PI_TURN.seatGuideHeading)) return { passed: false, code: \"missing-seat-guide\", detail: `system prompt does not hold ${PI_TURN.seatGuideHeading}` };\n", ""],
 ["P15", "R-3021/R-3025", "extension heading drifts from the heading install-check looks for", CFG,
  'export const SEAT_GUIDE_HEADING = "## Seat guide (nana)";', 'export const SEAT_GUIDE_HEADING = "## Seat guide";'],
 ["P16", "R-3026", "guide's pi sentence removed", "packages/nana-setup/claude/rules/nana-seat.md",
  "  In pi, the seat asks the user to start another lane's build from another pi session or the desk; its own builds run in the foreground.", ""],
 ["P17", "R-3026", "AGENTS.md seat-guide bullet not updated (region drifts from template)", "AGENTS.md",
  "Claude Code loads it as a rule, and pi installs and injects the same guide for seat sessions.", "Claude Code loads it as a rule."],
 ["P18", "R-3023", "read cap retuned without the seal", CFG,
  "export const SEAT_GUIDE_READ_CAP = 8192;", "export const SEAT_GUIDE_READ_CAP = 4096;"],
];
const only = process.argv.slice(2);
const rows = [];
for (const [id, row, desc, file, from, to] of P) {
  if (only.length && !only.includes(id)) continue;
  const f = path.join(R, file); const src = fs.readFileSync(f, "utf8");
  const n = src.split(from).length - 1;
  if (n !== 1) { rows.push({ id, row, desc, verdict: `NOT APPLIED (${n} matches)` }); continue; }
  if (id === "P11" || id === "P12") { if (!/import \* as fs from "node:fs"|import fs from "node:fs"/.test(src)) console.error("doctor fs import?"); }
  fs.writeFileSync(f, src.replace(from, to));
  const r = spawnSync("bash", [path.join(S, "run.sh")], { encoding: "utf8", maxBuffer: 1 << 26 });
  execSync(`git -C ${R} checkout -- ${file}`);
  const fails = r.stdout.split("\n").filter((l) => /^(FAIL|TIMEOUT)/.test(l)).map((l) => l.split(/\s+/)[1].split("/").pop());
  const summary = r.stdout.split("\n").find((l) => l.includes("files:")) || "";
  rows.push({ id, row, desc, verdict: fails.length ? "RED" : "GREEN", fails: fails.join(", "), summary });
  console.log(JSON.stringify(rows.at(-1)));
  fs.writeFileSync(path.join(S, "raw", `${id}.txt`), r.stdout + r.stderr);
}
fs.writeFileSync(path.join(S, `results-${only.join("-") || "all"}.json`), JSON.stringify(rows, null, 1));
