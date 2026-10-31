/**
 * @module packages/nana-pack/lib/claude-transcript.mjs
 * @purpose Share Claude transcript reading, day conversion and private-folder creation.
 * @inputs Transcript files, project roots, timestamps and explicit output folders.
 * @outputs Entries, text, dated days, sorted transcript paths and private folders.
 * @effects disk (reads transcripts and creates private folders)
 * @errors Filesystem errors propagate; torn JSON lines are skipped; unsafe output folders are refused.
 */
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

// Provenance: writing-trial-extractor's existing day convention, moved unchanged
// 2026-10-31; contract plan A11, R-3207.
export const DAY_TIMEZONE = "America/New_York";
export function textFrom(value) {
 if (typeof value === "string") return value;
 if (Array.isArray(value)) return value.map(textFrom).filter(Boolean).join("\n");
 if (!value || typeof value !== "object") return "";
 if (typeof value.text === "string") return value.text;
 return Object.values(value).map(textFrom).filter(Boolean).join("\n");
}
export function entriesIn(file) {
 const entries = [];
 for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/u)) {
  if (!line.trim()) continue;
  try { entries.push(JSON.parse(line)); } catch { /* torn transcript line */ }
 }
 return entries;
}
/** Streaming counterpart for large transcripts; retains the extractor's torn-line rule. */
export async function* streamEntriesIn(file) {
 const input = fs.createReadStream(file, { encoding: "utf8" });
 const lines = readline.createInterface({ input, crlfDelay: Infinity });
 try {
  for await (const line of lines) {
   if (!line.trim()) continue;
   let entry;
   try { entry = JSON.parse(line); } catch { continue; }
   yield entry;
  }
 } finally { lines.close(); input.destroy(); }
}
export function assistantText(entry) {
 if (entry.type !== "assistant" || entry.isSidechain !== false) return "";
 const message = entry.message ?? entry;
 if (message.role && message.role !== "assistant") return "";
 const content = message.content ?? entry.content;
 return Array.isArray(content)
  ? content.filter((part) => part?.type === "text" || typeof part === "string").map(textFrom).join("\n")
  : textFrom(content);
}
export function edtDay(timestamp) {
 const date = new Date(timestamp);
 if (Number.isNaN(date.valueOf())) return null;
 return new Intl.DateTimeFormat("en-CA", { timeZone: DAY_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}
/** No selector preserves writing-trial scope; explicit selectors can include worktrees. */
export function transcriptFiles(root, selectProject = (name) => !name.includes("-wt-") && !name.includes("-private-tmp-")) {
 const found = [];
 for (const project of fs.readdirSync(root, { withFileTypes: true })) {
  if (!project.isDirectory() || !selectProject(project.name)) continue;
  const dir = path.join(root, project.name);
  for (const name of fs.readdirSync(dir)) if (name.endsWith(".jsonl")) found.push({ project: project.name, file: path.join(dir, name) });
 }
 return found.sort((a, b) => a.file.localeCompare(b.file));
}
/** Default is the extractor's strict path walk. The maker permits OS ancestor aliases,
 * checks the resolved checkout ancestry, rejects the final symlink and tightens modes. */
export function privateFolder(output, { allowAncestorSymlinks = false, refuseCheckout = false, refusal = "private output refused" } = {}) {
 const destination = path.resolve(output);
 if (!allowAncestorSymlinks) {
  let current = path.parse(destination).root;
  for (const component of destination.slice(current.length).split(path.sep).filter(Boolean)) {
   current = path.join(current, component);
   try {
    if (fs.lstatSync(current).isSymbolicLink()) throw new Error(`private output path contains symlink: ${current}`);
   } catch (error) {
    if (error.code === "ENOENT") break;
    throw error;
   }
  }
 } else {
  try {
   if (fs.lstatSync(destination).isSymbolicLink()) {
    const error = new Error("private output final folder is a symlink");
    error.code = "OUTPUT_SYMLINK"; error.component = path.basename(destination); throw error;
   }
  } catch (error) { if (error.code !== "ENOENT") throw error; }
 }
 if (refuseCheckout) {
  let ancestor = destination;
  while (!fs.existsSync(ancestor)) {
   const parent = path.dirname(ancestor);
   if (parent === ancestor) throw new Error("no existing ancestor");
   ancestor = parent;
  }
  ancestor = fs.realpathSync(ancestor);
  for (;;) {
   if (fs.existsSync(path.join(ancestor, ".git"))) {
    const error = new Error(refusal); error.code = "OUTPUT_CHECKOUT"; throw error;
   }
   const parent = path.dirname(ancestor); if (parent === ancestor) break; ancestor = parent;
  }
 }
 fs.mkdirSync(destination, { recursive: true, mode: 0o700 });
 if (allowAncestorSymlinks && process.platform !== "win32") fs.chmodSync(destination, 0o700);
 return destination;
}
