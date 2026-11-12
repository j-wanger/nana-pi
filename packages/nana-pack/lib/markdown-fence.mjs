/**
 * @module packages/nana-pack/lib/markdown-fence.mjs
 * @purpose Mark which Markdown lines belong to a fenced code block, its opening and closing lines included.
 * @inputs An array of Markdown lines without line endings.
 * @outputs A boolean mask of fenced lines.
 * @effects none
 * @errors none
 */
// contract: CommonMark's fenced code block rule — up to three spaces of indent; a
// closer uses the same character, at least the opening run's length, and no text.
const FENCE = /^ {0,3}(`{3,}|~{3,})/;
const CLOSE = /^ {0,3}(`{3,}|~{3,})[ \t]*$/;

export function fenceMask(bareLines) {
  const mask = Array(bareLines.length).fill(false);
  let fence = null;
  for (let i = 0; i < bareLines.length; i++) {
    const line = bareLines[i];
    if (fence) {
      mask[i] = true;
      const close = CLOSE.exec(line);
      if (close && close[1][0] === fence.char && close[1].length >= fence.length) fence = null;
      continue;
    }
    const open = FENCE.exec(line);
    if (open) { mask[i] = true; fence = { char: open[1][0], length: open[1].length }; }
  }
  return mask;
}
