/**
 * @module packages/nana-pack/lib/memory-making.mjs
 * @purpose Extract private low-trust memory candidates and resolve their source evidence.
 * @inputs Injected repository, Claude project and review roots, date window and private output path.
 * @outputs Shaped candidate records, evidence statuses and counts-only command output.
 * @effects disk (streams transcripts, reads bounded reviews, writes an explicit private JSONL file)
 * @errors Library filesystem errors propagate; command failures return nonzero with fixed messages.
 */
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { projectKey } from "../../nana-setup/lib/project-key.mjs";
import { assistantText, edtDay, privateFolder, streamEntriesIn, transcriptFiles } from "./claude-transcript.mjs";
import { readBounded } from "./bounded-read.mjs";
import { displayText } from "./display.mjs";
import { mustTitlesOf, verdictWordOf } from "./review-findings.mjs";
import { CANDIDATES_FILE, CLAIM_CAP, CONTEXT_MIN_WORDS, CORRECTION_CUES, CORRECTION_FORM, DECISION_FORM, PRIVATE_REFUSAL, QUESTION_PATTERN, REVIEW_EXCLUDE, ROLES, SHORT_ANSWER_WORD_CAP, STARTING_STATE, WRAPPER_TAGS } from "./memory-making-config.mjs";

const words = (text) => text.trim().split(/\s+/u).filter(Boolean).length;
const partsOf = (entry) => entry.message?.content ?? entry.content;
const textOnly = (entry) => {
 const content = partsOf(entry);
 return typeof content === "string" ? content : Array.isArray(content) ? content.filter((p) => p?.type === "text" && typeof p.text === "string").map((p) => p.text).join("\n") : "";
};
function ownerTurn(entry) {
 if (entry.type !== "user" || entry.isMeta || entry.isSidechain || entry.isCompactSummary) return false;
 const parts = partsOf(entry);
 if (Array.isArray(parts) && parts.some((p) => p?.type === "tool_result")) return false;
 if (entry.origin !== undefined) return entry.origin?.kind === "human";
 const text = textOnly(entry).trimStart();
 return !WRAPPER_TAGS.some((tag) => text.toLowerCase().startsWith(tag.toLowerCase()));
}
const inWindow = (date, { from, to }) => date && (!from || date >= from) && (!to || date <= to);
function lastSentence(text) {
 return text.trim().match(/[^.!?]+[.!?]*(?:["'”’])?/gu)?.at(-1)?.trim() ?? text.trim();
}
function sourceFiles({ projectsRoot, repoRoot, project }) {
 if (!fs.existsSync(projectsRoot)) return [];
 const key = projectKey(repoRoot), wt = `${projectKey(`${repoRoot}-wt`)}-`;
 return transcriptFiles(projectsRoot, (name) => project ? name === project : name === key || name.startsWith(wt));
}
function shape(type, kind, rawQuote, rawContext, evidence, date) {
 const quote = displayText(rawQuote, CLAIM_CAP), context = displayText(rawContext, CLAIM_CAP);
 const form = kind === "correction" ? CORRECTION_FORM : DECISION_FORM;
 const rawClaim = kind === "lesson" ? rawQuote : form.replace("<quote>", () => rawQuote).replace("<context>", () => rawContext);
 const claim = displayText(rawClaim, CLAIM_CAP);
 return { record: { id: crypto.createHash("sha256").update(`${evidence}\n${claim}`).digest("hex"), type, kind, claim, quote, context, evidence, date, ...STARTING_STATE, roles: [...ROLES[type]], validFrom: date, invalidAt: null, supersedes: [] }, capped: Number(rawClaim.length > CLAIM_CAP) };
}
function askCalls(entry) {
 const parts = partsOf(entry);
 return entry.type === "assistant" && entry.isSidechain !== true && Array.isArray(parts)
  ? parts.filter((p) => p?.type === "tool_use" && p.name === "AskUserQuestion") : [];
}
function askQuestion(call) {
 return (call.input?.questions ?? []).map((q) => q.question).filter((q) => typeof q === "string").join("; ");
}
function askAnswer(entry, result, call) {
 if (result.is_error) return null;
 let answers = entry.toolUseResult?.answers;
 if (!answers || typeof answers !== "object") {
  answers = {};
  const content = typeof result.content === "string" ? result.content : "";
  for (const match of content.matchAll(/"((?:\\.|[^"\\])*)"\s*=\s*"((?:\\.|[^"\\])*)"/gu)) {
   try { answers[JSON.parse(`"${match[1]}"`)] = JSON.parse(`"${match[2]}"`); } catch { /* no usable pair */ }
  }
 }
 const questions = (call.input?.questions ?? []).map((q) => q.question).filter((q) => typeof q === "string" && typeof answers[q] === "string");
 if (!questions.length) return null;
 return { quote: questions.map((q) => answers[q]).join("; "), context: questions.join("; ") };
}
async function transcriptCandidates(file, options, emit) {
 let question = null, substantial = null;
 const calls = new Map();
 for await (const entry of streamEntriesIn(file)) {
  if (entry.isSidechain || entry.isMeta || entry.isCompactSummary) continue;
  const sessionId = entry.sessionId ?? path.basename(file, ".jsonl");
  const day = edtDay(entry.timestamp ?? entry.message?.timestamp);
  for (const call of askCalls(entry)) calls.set(call.id, { call, uuid: entry.uuid });
  const seat = assistantText(entry).trim();
  if (seat) {
   const matches = [...seat.matchAll(new RegExp(QUESTION_PATTERN))];
   if (matches.length && entry.uuid) question = { text: matches.at(-1)[0].trim(), uuid: entry.uuid };
   if (words(seat) >= CONTEXT_MIN_WORDS && entry.uuid) substantial = { text: lastSentence(seat), uuid: entry.uuid };
  }
  const parts = partsOf(entry);
  if (entry.type === "user" && Array.isArray(parts)) {
   for (const result of parts.filter((p) => p?.type === "tool_result")) {
    const pending = calls.get(result.tool_use_id);
    if (!pending) continue;
    calls.delete(result.tool_use_id);
    const answer = askAnswer(entry, result, pending.call);
    if (answer && entry.uuid && pending.uuid && inWindow(day, options)) emit(shape("user", "decision", answer.quote, answer.context, `claude-code:${sessionId}#${entry.uuid}+${pending.uuid}`, day));
   }
  }
  if (!ownerTurn(entry)) continue;
  const quote = textOnly(entry).trim();
  if (quote && entry.uuid && inWindow(day, options)) {
   if (CORRECTION_CUES.test(quote) && substantial) emit(shape("user", "correction", quote, substantial.text, `claude-code:${sessionId}#${entry.uuid}+${substantial.uuid}`, day));
   else if (!CORRECTION_CUES.test(quote) && question && words(quote) <= SHORT_ANSWER_WORD_CAP) emit(shape("user", "decision", quote, question.text, `claude-code:${sessionId}#${entry.uuid}+${question.uuid}`, day));
  }
  question = null; substantial = null;
 }
}
function reviewCandidates(options, emit) {
 const { reviewsRoot } = options;
 if (!fs.existsSync(reviewsRoot)) return;
 for (const lane of fs.readdirSync(reviewsRoot, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
  if (!lane.isDirectory()) continue;
  const seen = new Set(), date = /\d{4}-\d{2}-\d{2}/u.exec(lane.name)?.[0] ?? null;
  if ((options.from || options.to) && !inWindow(date, options)) continue;
  const dir = path.join(reviewsRoot, lane.name);
  for (const file of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
   if (!file.isFile() || !file.name.endsWith(".md") || REVIEW_EXCLUDE.test(file.name)) continue;
   const text = readBounded(path.join(dir, file.name)).toString("utf8");
   // Existing review reader defines the verdict spelling; no verdict means not reviewer output.
   if (!verdictWordOf(text)) continue;
   mustTitlesOf(text).forEach((title, index) => {
    if (seen.has(title)) return;
    seen.add(title);
    emit(shape("worker", "lesson", title, "", `review:${lane.name}/${file.name}#${index}`, date));
   });
  }
 }
}
/** Roots are injected; the CLI alone chooses real-machine defaults. No model or delivery. */
export async function extractMemory(options) {
 const records = []; let cappedClaims = 0;
 const emit = ({ record, capped }) => { records.push(record); cappedClaims += capped; };
 for (const { file } of sourceFiles(options)) await transcriptCandidates(file, options, emit);
 reviewCandidates(options, emit);
 return { records, cappedClaims };
}
/** Review indices resolve by the existing parser; removed indices are stale, absent files missing.
 * Pass expectedTitle when checking a retained record to detect replacement at the same index. */
export async function resolveEvidence(pointer, roots) {
 const review = /^review:(.+)#(\d+)$/u.exec(pointer);
 if (review) {
  const file = path.resolve(roots.reviewsRoot, review[1]);
  const relative = path.relative(path.resolve(roots.reviewsRoot), file);
  if (relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) return { status: "missing" };
  let text;
  try { text = readBounded(file).toString("utf8"); } catch (error) { if (error.code === "ENOENT") return { status: "missing" }; throw error; }
  const title = mustTitlesOf(text)[Number(review[2])];
  if (!title || (roots.expectedTitle !== undefined && title !== roots.expectedTitle)) return { status: "stale" };
  return { status: "resolved", texts: [title] };
 }
 const match = /^claude-code:([^#]+)#([^+]+)\+(.+)$/u.exec(pointer);
 if (!match) return { status: "missing" };
 for (const { file } of sourceFiles(roots)) {
  const found = new Map();
  for await (const entry of streamEntriesIn(file)) {
   if ((entry.sessionId ?? path.basename(file, ".jsonl")) !== match[1]) continue;
   if (entry.uuid === match[2] || entry.uuid === match[3]) found.set(entry.uuid, entry);
  }
  if (found.size !== 2) continue;
  const owner = found.get(match[2]), seat = found.get(match[3]);
  const calls = askCalls(seat);
  if (calls.length) {
   const parts = partsOf(owner);
   const result = Array.isArray(parts) ? parts.find((p) => p?.type === "tool_result" && calls.some((call) => call.id === p.tool_use_id)) : null;
   if (!result) return { status: "stale" };
   const call = calls.find((c) => c.id === result.tool_use_id);
   const answer = askAnswer(owner, result, call);
   return answer ? { status: "resolved", texts: [answer.quote, askQuestion(call)] } : { status: "stale" };
  }
  return { status: "resolved", texts: [textOnly(owner), assistantText(seat)] };
 }
 return { status: "missing" };
}
/** Shared strict option reader for the two hand-run commands. */
export function memoryArgs(argv, allowed) {
 const args = {};
 for (let i = 0; i < argv.length; i += 2) {
  const key = argv[i]?.slice(2), value = argv[i + 1];
  if (!argv[i]?.startsWith("--") || !allowed.includes(key) || !value || value.startsWith("--") || key in args) throw new Error("invalid memory arguments");
  args[key] = value;
 }
 return args;
}
/** Resolve a linked worktree to the shared checkout for default project-key scope. */
export function defaultMemoryRepo(cwd, { runGit = (cwd) => spawnSync("git", ["rev-parse", "--git-common-dir"], { cwd, encoding: "utf8", windowsHide: true }) } = {}) {
 const result = runGit(cwd);
 if (result.status !== 0) throw new Error("repository unavailable");
 const common = path.resolve(cwd, result.stdout.trim());
 return fs.realpathSync.native(path.basename(common) === ".git" ? path.dirname(common) : path.resolve(cwd));
}
/** Fixed/counts-only diagnostics, including errors; no raw exception text crosses this boundary. */
export async function runMake(argv, { stdout = (s) => process.stdout.write(s), stderr = (s) => process.stderr.write(s), repoRoot = process.cwd(), projectsRoot = path.join(process.env.HOME ?? process.env.USERPROFILE ?? "~", ".claude", "projects") } = {}) {
 try {
  const args = memoryArgs(argv, ["repo", "root", "reviews", "project", "from", "to", "out"]);
  if (!args.out) throw new Error("missing output");
  repoRoot = args.repo ? path.resolve(args.repo) : defaultMemoryRepo(repoRoot);
  for (const day of [args.from, args.to]) if (day && (!/^\d{4}-\d{2}-\d{2}$/u.test(day) || !Number.isFinite(Date.parse(day)))) throw new Error("invalid day");
  if (args.from && args.to && args.from > args.to) throw new Error("invalid window");
  const out = privateFolder(args.out, { allowAncestorSymlinks: true, refuseCheckout: true, refusal: PRIVATE_REFUSAL });
  const { records, cappedClaims } = await extractMemory({ repoRoot, projectsRoot: args.root ?? projectsRoot, reviewsRoot: args.reviews ?? path.join(repoRoot, "docs", "reviews"), project: args.project, from: args.from, to: args.to });
  const fd = fs.openSync(path.join(out, CANDIDATES_FILE), "wx", 0o600);
  try { for (const record of records) fs.writeSync(fd, `${JSON.stringify(record)}\n`); } finally { fs.closeSync(fd); }
  for (const [type, kind] of [["user", "correction"], ["user", "decision"], ["worker", "lesson"]]) stdout(`${type} ${kind} ${records.filter((r) => r.type === type && r.kind === kind).length}\n`);
  stdout(`capped claims ${cappedClaims}\n`); return 0;
 } catch (error) {
  stderr(`${error.code === "OUTPUT_CHECKOUT" ? PRIVATE_REFUSAL : error.code === "OUTPUT_SYMLINK" ? `memory: final output folder is a symlink: ${displayText(error.component)}` : "memory: make failed"}\n`);
  return 1;
 }
}
