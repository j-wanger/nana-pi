/**
 * @module packages/nana-pack/lib/waking-guards.mjs
 * @purpose Decide advisory Stop, away-owner question and lane-launch refusals.
 * @inputs Hook payload, clock, lane reader and transcript reader.
 * @outputs Claude Code block/deny objects or null for abstention.
 * @effects none (boundary readers injected)
 * @errors Reader errors propagate to the hook's fail-open boundary.
 */
import { LAUNCHER_ROLES } from "./frontier-summary-config.mjs";
import { commandIndex, splitCommand, tokens } from "./gate-shell.ts";
import { LANE_TOOL_LAUNCHES, OWNER_WINDOW_MS, WAKE_INTERVAL_MINUTES } from "./waking-config.mjs";

function armed(job) {
 if (job?.recurring !== true || typeof job.schedule !== "string") return false;
 const fields = job.schedule.trim().split(/\s+/);
 if (fields.length !== 5 || fields.slice(1).some(field => field !== "*")) return false;
 const minutes = new Set();
 for (const part of fields[0].split(",")) {
  const match = /^(\*|\d+(?:-\d+)?)(?:\/(\d+))?$/.exec(part);
  if (!match) return false;
  const step = Number(match[2] ?? 1);
  const [start, end] = match[1] === "*" ? [0, 59] : match[1].includes("-") ? match[1].split("-").map(Number) : [Number(match[1]), match[2] ? 59 : Number(match[1])];
  if (step < 1 || start < 0 || end > 59 || end < start) return false;
  for (let minute = start; minute <= end; minute += step) minutes.add(minute);
 }
 const sorted = [...minutes].sort((a, b) => a - b);
 return sorted.length >= 2 && sorted.every((minute, index) => ((sorted[index + 1] ?? sorted[0] + 60) - minute) <= WAKE_INTERVAL_MINUTES);
}

const deny = reason => ({ hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason } });
const base = word => word.split(/[\\/]/).pop();

function launches(command) {
 return splitCommand(command).segments.some(segment => {
  const words = tokens(segment.text, true);
  let index = commandIndex(words);
  // setsid is not one of the gate parser's transparent wrappers.
  if (base(words[index] ?? "") === "setsid") {
   index++;
   while (words[index]?.startsWith("-")) index++;
   index += commandIndex(words.slice(index));
  }
  if (/^node(?:\.exe)?$/.test(base(words[index] ?? ""))) {
   index++;
   while (words[index]?.startsWith("-")) index++;
  }
  const tool = base(words[index] ?? "");
  const args = words.slice(index + 1);
  return !args.includes("--help") && LANE_TOOL_LAUNCHES.some(entry => entry.tool === tool && args.some(arg => arg === entry.flag || arg.startsWith(`${entry.flag}=`)));
 });
}

function detaches(command) {
 let quote = "", live = "";
 for (let i = 0; i < command.length; i++) {
  const char = command[i];
  if (char === "\\" && quote !== "'") { i++; continue; }
  if (quote) { if (char === quote) quote = ""; continue; }
  if (char === "'" || char === '"') { quote = char; live += " "; } else live += char;
 }
 return /(?:^|[\s;()])(?:[^\s;()]*\/)?(?:nohup|setsid|disown)(?:\s|$)/.test(live) || /(?<![&<>])&(?![&>])/.test(live);
}

/** No hook asks for permission: each either denies/blocks or abstains. */
export function wakingDecision(payload, { role, now = Date.now(), lanes, readTranscript } = {}) {
 if (LAUNCHER_ROLES.includes(role) || role !== undefined) return null;
 if (payload?.hook_event_name === "Stop") {
  if (payload.stop_hook_active === true || !Object.hasOwn(payload, "session_crons")) return null;
  const open = lanes();
  if (!open.length || payload.session_crons?.some(armed)) return null;
  return { decision: "block", reason: `Open lanes: ${open.join(", ")}. Arm a recurring wake with CronCreate, firing at least every ${WAKE_INTERVAL_MINUTES} minutes, whose prompt checks each lane and advances anything ready or stalled; if this session is not the seat, end the turn again.` };
 }
 if (payload?.hook_event_name !== "PreToolUse") return null;
 if (payload.tool_name === "Bash") {
  const input = payload.tool_input;
  if (typeof input?.command !== "string" || !launches(input.command)) return null;
  if (input.run_in_background === true && !detaches(input.command)) return null;
  return deny("Run it as its own background call, so its exit wakes the seat.");
 }
 if (payload.tool_name !== "AskUserQuestion" || !lanes().length) return null;
 let newest = -Infinity;
 for (const line of readTranscript(payload.transcript_path).split(/\r\n|\r|\n/)) {
  let entry;
  try { entry = JSON.parse(line.trim()); } catch { continue; }
  if (entry?.type === "user" && entry.origin?.kind === "human") {
   const time = Date.parse(entry.timestamp);
   if (Number.isFinite(time)) newest = Math.max(newest, time);
  }
 }
 if (!Number.isFinite(newest) || now - newest <= OWNER_WINDOW_MS) return null;
 return deny("Put the question in your reply with a one-word default and act on the default, keep lanes moving; a default never authorizes deleting, overwriting or acting outside the working folder, so that one item waits for the owner's yes in a later message.");
}
