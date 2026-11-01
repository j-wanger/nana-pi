/**
 * @module apps/bench/lib/anatomy.mjs
 * @purpose Run the five hand-operated builder anatomy subcommands with private writers and counts-only printers.
 * @inputs Explicit argv roots and injected stdout/stderr callbacks.
 * @outputs Private contexts, blind sheets or replay parts; counts-only JSON on stdout.
 * @effects disk (explicit private folders), process (extractor's read-only git queries)
 * @errors Returns 1 with fixed diagnostics on invalid inputs, unsafe output or malformed data.
 */
import fs from "node:fs";
import path from "node:path";
import { entriesIn, privateFolder } from "../../../packages/nana-pack/lib/claude-transcript.mjs";
import { CONTEXT_FILE, MANIFEST_FILE, SAMPLE_SIZE, SHEET_FILE, STAGED_FILE } from "./anatomy-config.mjs";
import { extractContexts } from "./anatomy-sessions.mjs";
import { agreement, assembleParts, drawSample, reportContexts } from "./anatomy-measures.mjs";

const COMMANDS = ["segment", "report", "sample", "agree", "assemble"];
const OPTIONS = ["repo", "sessions", "out", "in", "seed", "n", "a", "b", "context", "drop", "stage"];
function argsIn(argv) {
 const [command, ...rest] = argv;
 if (!COMMANDS.includes(command)) throw new Error("arguments");
 const args = { command };
 for (let i = 0; i < rest.length; i += 2) {
  const name = rest[i].slice(2), value = rest[i + 1];
  if (!rest[i].startsWith("--") || !OPTIONS.includes(name) || args[name] !== undefined || !value || value.startsWith("--")) throw new Error("arguments");
  args[name] = value;
 }
 return args;
}
const write = (folder, name, text) => fs.writeFileSync(path.join(folder, name), text, { mode: 0o600, flag: "wx" });
const jsonl = (rows) => rows.map((r) => JSON.stringify(r)).join("\n") + (rows.length ? "\n" : "");
/** All paths and exception strings stay private; only fixed reasons and count fields print. */
export async function runAnatomy(argv, { stdout = (s) => process.stdout.write(s), stderr = (s) => process.stderr.write(s) } = {}) {
 try {
  const args = argsIn(argv), print = (o) => stdout(`${JSON.stringify(o)}\n`);
  let out;
  if (["segment", "sample", "assemble"].includes(args.command)) {
   if (!args.out) throw new Error("arguments");
   out = privateFolder(args.out, { allowAncestorSymlinks: true, refuseCheckout: true });
   if (fs.readdirSync(out).length) { const error = new Error("output occupied"); error.code = "OUTPUT_OCCUPIED"; throw error; }
  }
  if (args.command === "segment") {
   if (!args.repo || !args.sessions) throw new Error("arguments");
   const result = extractContexts({ repo: args.repo, sessions: args.sessions });
   write(out, CONTEXT_FILE, jsonl(result.contexts));
   const reasons = [...new Set(result.skipped.map((s) => s.reason))].sort();
   print({ command: "segment", ...result.denominators, skipped: reasons.map((reason) => ({ reason, count: result.skipped.filter((s) => s.reason === reason).length })), excluded: reportContexts(result.contexts).excluded });
   return 0;
  }
  if (!args.in) throw new Error("arguments");
  const contexts = entriesIn(path.join(args.in, CONTEXT_FILE));
  if (args.command === "report") print(reportContexts(contexts));
  if (args.command === "sample") {
   const sheet = drawSample(contexts, { seed: args.seed, n: args.n === undefined ? SAMPLE_SIZE : Number(args.n) });
   write(out, SHEET_FILE, jsonl(sheet)); print({ command: "sample", units: sheet.length, chars: sheet.reduce((n, u) => n + u.text.length, 0) });
  }
  if (args.command === "agree") {
   if (!args.a || !args.b) throw new Error("arguments");
   print(agreement(contexts, entriesIn(args.a), entriesIn(args.b)));
  }
  if (args.command === "assemble") {
   const c = args.context ? contexts.find((c) => c.id === args.context) : contexts.length === 1 ? contexts[0] : null;
   if (!c) throw new Error("context selection");
   const result = assembleParts(c, { drop: args.drop, stage: args.stage });
   const manifest = [];
   for (const p of result.parts) { const file = `part-${p.index + 1}.txt`; write(out, file, p.text); manifest.push({ file, part: p.name, chars: p.text.length }); }
   if (args.stage) write(out, STAGED_FILE, result.staged);
   write(out, MANIFEST_FILE, JSON.stringify(manifest) + "\n");
   print({ command: "assemble", parts: result.parts.length, chars: result.parts.reduce((n, p) => n + p.text.length, 0), removedUnits: result.removedUnits, removedChars: result.removedChars, stagedChars: result.staged.length });
  }
  return 0;
 } catch (error) {
  const reason = error.code === "OUTPUT_CHECKOUT" ? "output checkout refused" : error.code === "OUTPUT_SYMLINK" ? "output symlink refused" : error.code === "OUTPUT_OCCUPIED" ? "output not empty" : /^ids differ: \d+$/u.test(error.message) ? error.message : "invalid inputs or read/write failure";
  stderr(`anatomy: ${reason}\n`); return 1;
 }
}
