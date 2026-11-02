/**
 * @module apps/bench/lib/replay-grade.mjs
 * @purpose Apply frozen overlays after builder exit and grade stable per-file checks without excusing broken implementations.
 * @inputs Frozen grading manifest, private tree/output folder and busy predicate.
 * @outputs Private full test captures and check outcomes with exclusion status and worst/best bounds.
 * @effects disk (overlay and private evidence), process (bounded direct node test files)
 * @errors Hash/path mismatches refuse grading; process failures become grader-broken outcomes.
 */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { runChild, treeAlive } from "../run.mjs";
import { privateFolder } from "../../../packages/nana-pack/lib/claude-transcript.mjs";
import { BUSY_POLL_MS, CHECK_MS, VOLATILE_MASKS } from "./replay-config.mjs";

export function loadGrading(file) {
 const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
 return { ...manifest, overlay: manifest.overlay.map(o => ({ ...o, source: path.resolve(path.dirname(file), o.source) })) };
}
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
function target(tree, relative) {
 if (typeof relative !== "string" || !relative || path.isAbsolute(relative) || relative.split(/[\\/]/u).includes("..")) throw new Error("replay: overlay path refused");
 const resolved = path.resolve(tree, relative);
 let current = tree;
 for (const part of relative.split(/[\\/]/u)) {
  current = path.join(current, part);
  try { if (fs.lstatSync(current).isSymbolicLink()) throw new Error("replay: overlay path refused"); } catch (e) { if (e.code !== "ENOENT") throw e; }
 }
 return resolved;
}
export function checkId(file, text, occurrence = 1) { return `${file}#${text}#${occurrence}`; }
function maskText(text, masks) {
 let value = text.replace(/[ \t]+$/u, "");
 for (const m of masks) value = value.replace(new RegExp(m.pattern, "gu"), m.replacement ?? "<VOLATILE>");
 return value;
}
function parsedChecks(file, stdout, masks) {
 const found = new Map(), counts = new Map();
 for (const line of stdout.replaceAll("\r\n", "\n").split("\n")) {
  // Indented child output and runner summaries cannot declare a manifest check.
  const match = /^(PASS|FAIL) (\S.*)$/u.exec(line); if (!match) continue;
  const text = maskText(match[2], masks), count = (counts.get(text) ?? 0) + 1; counts.set(text, count);
  found.set(checkId(file, text, count), match[1] === "PASS" ? "pass" : "fail");
 }
 return found;
}
function codeFault(stderr, manifest, tree, file) {
 const modules = manifest.interface?.modules ?? [], slash = s => s.replaceAll("\\", "/");
 const canonical = p => { try { return slash(fs.realpathSync(p)); } catch { return slash(path.resolve(p)).replace(/^\/var\//u, "/private/var/"); } };
 const named = p => modules.find(m => canonical(path.resolve(tree, m.path)) === canonical(p.replace(/^file:\/\//u, "")));
 const missing = /Cannot find module ['"]([^'"]+)['"]/u.exec(stderr);
 if (missing) {
  if (named(missing[1])) return "model";
  const importer = /imported from ([^\r\n]+)/u.exec(stderr)?.[1];
  return importer && named(importer) ? "model" : "incompatible";
 }
 const exported = /requested module ['"]([^'"]+)['"] does not provide an export named ['"]([^'"]+)['"]/u.exec(stderr);
 if (exported) {
  const module = named(path.resolve(tree, path.dirname(file), exported[1]));
  return module?.exports?.includes(exported[2]) ? "model" : "incompatible";
 }
 if (/SyntaxError/u.test(stderr)) {
  return modules.some(m => stderr.includes(canonical(path.resolve(tree, m.path))) || stderr.includes(slash(path.resolve(tree, m.path)))) ? "model" : "incompatible";
 }
 return null;
}
export async function grade({ manifest, tree, out, busy = () => false, pollMs = BUSY_POLL_MS, builderPid, signal }) {
 if (builderPid && treeAlive(builderPid)) throw new Error("replay: builder still alive");
 const wait = async () => { while (await busy()) { if (signal?.aborted) throw new Error("replay: grading interrupted"); await new Promise(r => setTimeout(r, pollMs)); } };
 await wait();
 out = privateFolder(out, { allowAncestorSymlinks: true, refuseCheckout: true });
 const ids = new Set();
 if (!Array.isArray(manifest.checks) || !Array.isArray(manifest.files) || !Array.isArray(manifest.overlay)) throw new Error("replay: invalid grading manifest");
 for (const c of manifest.checks) {
  if (c.id !== checkId(c.file, c.text, c.occurrence) || ids.has(c.id) || !manifest.files.includes(c.file) || !["fail-to-pass", "pass-to-pass"].includes(c.class) || !Number.isFinite(c.weight) || c.weight <= 0) throw new Error("replay: invalid check identity");
  ids.add(c.id);
 }
 const overlay = new Map();
 for (const o of manifest.overlay) {
  const bytes = fs.readFileSync(o.source);
  if (digest(bytes) !== o.sha256) throw new Error("replay: overlay mismatch");
  const dest = target(tree, o.path); if (overlay.has(dest)) throw new Error("replay: duplicate overlay"); overlay.set(dest, bytes);
 }
 for (const file of manifest.files) if (!overlay.has(target(tree, file))) throw new Error("replay: test outside overlay");
 await wait();
 for (const [dest, bytes] of overlay) { fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.writeFileSync(dest, bytes); }
 const checks = manifest.checks.map(c => ({ ...c, outcome: "not-run" })), files = [];
 let status = "graded";
 for (const [index, file] of manifest.files.entries()) {
  await wait();
  const home = path.join(out, `home-${index}`); fs.mkdirSync(home, { recursive: true, mode: 0o700 });
  const r = await runChild({ cmd: process.execPath, args: [target(tree, file)], cwd: tree, env: { ...process.env, HOME: home, USERPROFILE: home, TMPDIR: home, TEMP: home, TMP: home, NANA_ROLE: "worker", NANA_HANDOFF: "off", PI_CODING_AGENT_DIR: path.join(home, ".pi"), CLAUDE_CONFIG_DIR: path.join(home, ".claude") }, timeoutMs: manifest.timeoutMs ?? CHECK_MS, reapOnExit: true });
  fs.writeFileSync(path.join(out, `test-${index}.stdout`), r.stdout, { mode: 0o600 }); fs.writeFileSync(path.join(out, `test-${index}.stderr`), r.stderr, { mode: 0o600 });
  const broken = r.exit === null || r.timedOut || r.killedCleanly === false;
  const fault = broken ? null : codeFault(r.stderr, manifest, tree, file);
  const found = parsedChecks(file, r.stdout, manifest.masks ?? VOLATILE_MASKS);
  for (const c of checks.filter(c => c.file === file)) c.outcome = found.get(c.id) ?? (broken ? "grader-broken" : fault === "model" ? "fail" : "not-run");
  if (broken) status = "grader-broken";
  else if (fault === "incompatible" && status !== "grader-broken") status = "grader-incompatible";
  files.push({ file, exit: r.exit, signal: r.signal, timedOut: r.timedOut });
 }
 const total = checks.reduce((n, c) => n + c.weight, 0), score = total ? checks.reduce((n, c) => n + (c.outcome === "pass" ? c.weight : 0), 0) / total : 0;
 const result = { status, checks, files, bounds: status === "graded" ? { worst: score, best: score } : { worst: 0, best: 1 } };
 fs.writeFileSync(path.join(out, "grade.json"), JSON.stringify(result) + "\n", { mode: 0o600 });
 return result;
}
