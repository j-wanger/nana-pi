/**
 * @module packages/nana-pack/lib/pack-config-write.mjs
 * @purpose Atomically replace one user-scope configuration member while preserving other members and a backup.
 * @inputs Agent directory, member, value and optional writeTemp and rename seams.
 * @outputs ok with file, or a named problem.
 * @effects disk
 * @errors Catches read and write failures and removes partial temporary files.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { readBounded, BOUNDED_READ_CAP } from './bounded-read.mjs';
import { parseJsonBytes } from './json-text.mjs';
// Chosen: retained from roster-set; brand-new user-scope files are owner-only.
const NEW_FILE_MODE = 0o600;
export function writePackConfigMember(agentDir, member, value, {
 writeTemp = (fd, text) => fs.writeFileSync(fd, text, 'utf8'),
 rename = (from, to) => fs.renameSync(from, to),
} = {}) {
 const file = path.join(agentDir, 'nana-pack.json');
 let raw = {};
 let existed = false;
 let targetPath = file;
 let mode = NEW_FILE_MODE;
 try {
  targetPath = fs.realpathSync(file);
  existed = true;
  mode = fs.statSync(targetPath).mode & 0o777;
  const buf = readBounded(targetPath, BOUNDED_READ_CAP);
  raw = parseJsonBytes(buf);
 } catch (err) {
  if (err?.code !== 'ENOENT') return { ok: false, problem: `${file}: ${String(err?.message ?? err)}` };
  // An existing dangling link is not an absent configuration.
  try { if (fs.lstatSync(file).isSymbolicLink()) return { ok:false, problem:`${file}: dangling symlink` }; } catch {}
  raw = {};
  existed = false;
  targetPath = file;
 }
 if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return {ok:false, problem:`${file}: top level is not an object`};
 raw[member] = value;
 const text = `${JSON.stringify(raw, null, 2)}\n`;
 const targetDir = path.dirname(targetPath);
 const temp = path.join(targetDir, `.nana-pack.json.${process.pid}.tmp`);
 let tempCreated = false;
 try {
  const fd = fs.openSync(temp, 'wx', mode);
  tempCreated = true;
  try {
   writeTemp(fd, text);
   fs.fsyncSync(fd);
  } finally { fs.closeSync(fd); }
  if (existed) fs.copyFileSync(targetPath, path.join(agentDir, 'nana-pack.json.bak'));
  rename(temp, targetPath);
 } catch (err) {
  if (tempCreated) { try { fs.unlinkSync(temp); } catch {} }
  return { ok:false, problem:`${file}: ${String(err?.message ?? err)}` };
 }
 return {ok:true, file};
}
