/**
 * @module packages/nana-pack/lib/bounded-read.mjs
 * @purpose Read a bounded number of bytes from a regular file without blocking on special files.
 * @inputs a file path, optional byte limit, and Node filesystem constants
 * @outputs a Buffer containing at most the requested limit plus one bytes
 * @effects disk (opens and reads one file descriptor)
 * @errors throws filesystem errors, ERR_NOT_REGULAR, or ERR_TOO_LARGE
 */
import * as fs from "node:fs";

/** chosen: one MiB accommodates config and handoff records while bounding sync allocations and reads. */
export const BOUNDED_READ_CAP = 1024 * 1024;

/** chosen: one extra byte distinguishes a file that crosses the caller's read window. */
export const readBudget = (fileSize, readLimit) => Math.min(fileSize, readLimit + 1);

/** Open nonblocking, verify the descriptor is a bounded regular file, and read no more than limit+1. */
export function readBounded(file, cap = BOUNDED_READ_CAP, readLimit = cap) {
 let fd;
 try {
  fd = fs.openSync(file, fs.constants.O_RDONLY | (fs.constants.O_NONBLOCK ?? 0));
  const stat = fs.fstatSync(fd);
  if (!stat.isFile()) {
   const error = new Error("not a regular file"); error.code = stat.isDirectory() ? "EISDIR" : "ERR_NOT_REGULAR"; throw error;
  }
  if (!Number.isSafeInteger(cap) || cap < 0 || stat.size > cap) {
   const error = new Error("file exceeds bounded read cap"); error.code = "ERR_TOO_LARGE"; throw error;
  }
  if (!Number.isSafeInteger(readLimit) || readLimit < 0) throw new RangeError("invalid read limit");
  const buf = Buffer.alloc(readBudget(stat.size, readLimit));
  let offset = 0;
  while (offset < buf.length) {
   const count = fs.readSync(fd, buf, offset, buf.length - offset, offset);
   if (count === 0) break;
   offset += count;
  }
  return buf.subarray(0, offset);
 } finally {
  if (fd !== undefined) try { fs.closeSync(fd); } catch { /* already closed */ }
 }
}
