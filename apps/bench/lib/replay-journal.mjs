/**
 * @module apps/bench/lib/replay-journal.mjs
 * @purpose Persist replay identities, exclusive folder ownership and durable no-retry spend reservations.
 * @inputs Private output folder, immutable manifest, bounded operation allowances and injected execution.
 * @outputs Fsynced start/end/refusal journal, one row per admitted key and interrupted recovery rows.
 * @effects disk (private output only), process (pid liveness)
 * @errors Cap refusals stop admission; identity, lock and persistence failures stop execution.
 */
import fs from "node:fs";
import path from "node:path";
import { privateFolder } from "../../../packages/nana-pack/lib/claude-transcript.mjs";
import { releaseLaneLock } from "../../../packages/nana-pack/lib/lane-lock.mjs";
import { pidAlive } from "../../../packages/nana-pack/lib/process-tree.mjs";
import { readJsonl } from "./plan.mjs";
import { parseStream } from "./usage.mjs";

export function appendDurable(file, row) {
 const fd = fs.openSync(file, "a", 0o600);
 try { fs.writeSync(fd, JSON.stringify(row) + "\n"); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
}
export async function lockFolder(folder) {
 const out = privateFolder(folder, { allowAncestorSymlinks: true, refuseCheckout: true }), lock = path.join(out, "replay.pid"), reclaim = `${lock}.reclaim`;
 const take = () => { const fd = fs.openSync(lock, "wx", 0o600); try { fs.writeSync(fd, String(process.pid)); fs.fsyncSync(fd); } finally { fs.closeSync(fd); } };
 try { take(); }
 catch (error) {
  if (error.code !== "EEXIST") throw error;
  let guard;
  try {
   guard = fs.openSync(reclaim, "wx", 0o600);
   const holder = Number(fs.readFileSync(lock, "utf8").trim());
   if (!Number.isInteger(holder) || holder < 1 || pidAlive(holder)) throw new Error("replay: folder in use");
   fs.unlinkSync(lock); take();
  } catch { throw new Error("replay: folder in use"); }
  finally { if (guard !== undefined) { fs.closeSync(guard); fs.unlinkSync(reclaim); } }
 }
 return () => releaseLaneLock(lock);
}
export async function assertRunManifest(out, current) {
 privateFolder(out, { allowAncestorSymlinks: true, refuseCheckout: true });
 const file = path.join(out, "run-manifest.json");
 let previous;
 try { previous = JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { if (e.code !== "ENOENT") throw new Error("replay: invalid saved manifest"); }
 if (!previous) { fs.writeFileSync(file, JSON.stringify(current) + "\n", { flag: "wx", mode: 0o600 }); return; }
 for (const key of new Set([...Object.keys(previous.inputs), ...Object.keys(current.inputs)])) if (previous.inputs[key] !== current.inputs[key]) throw new Error(`replay: changed input ${key}`);
 if (previous.fingerprint !== current.fingerprint) throw new Error("replay: changed input fingerprint");
}
export async function readRows(out, { file = "rows.jsonl", repair = false } = {}) { return (await readJsonl(path.join(out, file), { repair })).rows; }
function partial(start) {
 let text = "";
 try { text = fs.readFileSync(start.streamFile, "utf8"); } catch {}
 const p = parseStream(text);
 return { ...start.tuple, tokens: p.tokens, totalTokens: p.tokens.totalTokens, turns: p.turns, toolCalls: p.toolCalls, retries: p.retries, compactions: p.compactions, cost: null, costReason: "interrupted; partial spend only", partialCost: p.tokens.cost.total, outcome: "interrupted", checks: [], reviewer: "missing", wallMs: null, pulls: { byClass: [], byFunction: [] }, errors: {} };
}
/** The caller holds the folder lock; nested reviewer operations use their own row file and the same journal. */
export async function runOperations({ out, manifestHash, cap, operations, execute, rowFile = "rows.jsonl", recover = partial }) {
 privateFolder(out, { allowAncestorSymlinks: true, refuseCheckout: true });
 if (!Number.isFinite(cap) || cap < 0) throw new Error("replay: invalid cap");
 const journalFile = path.join(out, "journal.jsonl"), journal = (await readJsonl(journalFile)).rows;
 const rows = await readRows(out, { file: rowFile, repair: true });
 const ends = new Map(journal.filter(r => r.kind === "end").map(r => [r.key, r]));
 const starts = new Map(journal.filter(r => r.kind === "start").map(r => [r.key, r]));
 for (const start of starts.values()) {
  if (start.manifestHash !== manifestHash) throw new Error("replay: changed input journal manifest");
  if (!ends.has(start.key) && (start.rowFile ?? "rows.jsonl") === rowFile && !rows.some(r => r.key === start.key)) {
   const row = { ...recover(start), key: start.key, manifestHash };
   appendDurable(path.join(out, rowFile), row); rows.push(row);
  }
 }
 const spent = () => [...starts.values()].reduce((sum, start) => sum + (ends.get(start.key)?.charged ?? start.reserved), 0);
 for (const op of operations) {
  if (starts.has(op.key)) continue;
  if (!op.key || !Number.isFinite(op.allowance) || op.allowance <= 0) throw new Error("replay: invalid allowance");
  // Reload shared journal: a nested reviewer may have spent since this invocation's last operation.
  const now = (await readJsonl(journalFile)).rows;
  for (const r of now) { if (r.kind === "start") starts.set(r.key, r); else if (r.kind === "end") ends.set(r.key, r); }
  if (spent() + op.allowance > cap) { appendDurable(journalFile, { kind: "refused", key: op.key, reason: "cap", manifestHash }); break; }
  const start = { kind: "start", key: op.key, manifestHash, reserved: op.allowance, streamFile: op.streamFile, tuple: op.tuple, rowFile, at: new Date().toISOString() };
  appendDurable(journalFile, start); starts.set(op.key, start);
  // An execution exception leaves its durable start interrupted. Never turn unknown spend into zero.
  const value = await execute(op);
  const row = { ...op.tuple, ...value, key: op.key, manifestHash };
  appendDurable(path.join(out, rowFile), row); rows.push(row);
  const charged = Number.isFinite(row.cost) && row.cost >= 0 ? row.cost : op.allowance;
  const end = { kind: "end", key: op.key, manifestHash, charged, cost: row.cost ?? null, at: new Date().toISOString() };
  appendDurable(journalFile, end); ends.set(op.key, end);
 }
 return rows;
}
