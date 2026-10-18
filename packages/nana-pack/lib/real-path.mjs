/**
 * @module packages/nana-pack/lib/real-path.mjs
 * @purpose The one canonical-path function the land and review tools key and compare folders by, so two
 *  spellings of one folder (case, an 8.3 short name, a link, a `\\?\` prefix or a Unicode form) resolve the same.
 * @inputs a path string and, for realPath, an optional mustExist flag
 * @outputs realPath(p, opts): the folder's native spelling on disk; gitPathKey(s): s normalized for a
 *  git-path compare
 * @effects disk (reads: realpathSync.native / realpathSync walk up to an existing ancestor)
 * @errors realPath throws (as realpathSync does) when mustExist is true and p does not exist; otherwise
 *  it never throws
 */
// real-path.mjs (W7c, 2026-10-18) — native realpath everywhere, because native returns the spelling ON
// DISK (case, long name, resolved symlink), which is what git already prints, while JS realpathSync keeps
// a typed case, an 8.3 short name or a lowercase drive letter. No case folding: native already returns the
// case on disk, and folding would change every Windows ledger key once (see review-round.mjs, nana-land.mjs,
// review-ledger.mjs). No `\\?\` strip: libuv's native resolver is believed to remove it already (inferred;
// a Windows-only spelling in the must-meet tests measures this).
import { realpathSync } from 'node:fs';
import { dirname, basename, join, resolve } from 'node:path';

const MISSING = new Set(['ENOENT', 'ENOTDIR']);

/** Canonicalize the deepest existing ancestor of `abs` and append the rest of the path unchanged. */
function canonicalizeMissing(abs) {
  let cur = dirname(abs);
  const tail = [basename(abs)];
  for (;;) {
    try {
      return join(realpathSync.native(cur), ...tail);
    } catch (e) {
      if (!MISSING.has(e.code)) {
        try { return join(realpathSync(cur), ...tail); } catch { return abs; }
      }
      const parent = dirname(cur);
      if (parent === cur) return abs; // nothing on this path exists at all
      tail.unshift(basename(cur));
      cur = parent;
    }
  }
}

/**
 * The folder's (or file's) spelling on disk: `fs.realpathSync.native(path.resolve(p))`.
 * - Missing (`ENOENT`/`ENOTDIR`): with `mustExist`, throws, as `realpathSync` does today; otherwise
 *   canonicalizes the deepest existing ancestor and appends the rest unchanged.
 * - Any other native error: falls back to `fs.realpathSync(abs)` (today's result), so a volume whose
 *   native resolver fails still works as it did before this function existed.
 */
export function realPath(p, { mustExist = false } = {}) {
  const abs = resolve(p);
  try {
    return realpathSync.native(abs);
  } catch (e) {
    if (MISSING.has(e.code)) {
      if (mustExist) throw e;
      return canonicalizeMissing(abs);
    }
    try { return realpathSync(abs); } catch { return abs; }
  }
}

/** `s` normalized for a git-path compare: NFC on darwin (APFS/HFS+ store NFD; git lists NFC), `s`
 *  unchanged elsewhere. No case folding. */
export function gitPathKey(s) {
  return process.platform === 'darwin' ? s.normalize('NFC') : s;
}
