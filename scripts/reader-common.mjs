/**
 * @module scripts/reader-common.mjs
 * @purpose Share repository-boundary and numbered-item parsing between outside and visual readers.
 * @inputs A repository root and output path, or answer text.
 * @outputs Whether an output is outside the repository and numbered answer segments.
 * @effects none
 * @errors None.
 */
import path from "node:path";

export function outsideRepo(root, output) {
  const relative = path.relative(path.resolve(root), path.resolve(output));
  return relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative);
}

export function splitNumbered(answer) {
  const text = String(answer);
  const starts = [...text.matchAll(/^\s*(\d+)[.)]\s+/gm)];
  return starts.map((start, index) => ({
    number: Number(start[1]),
    text: text.slice(start.index, starts[index + 1]?.index ?? text.length).trim(),
  }));
}
