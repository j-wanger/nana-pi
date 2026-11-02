/**
 * @module packages/nana-pack/lib/memory-render.mjs
 * @purpose Render the shared index unchanged on fallback and beside a bounded memory push.
 * @inputs Shared header, index entries/path, optional bundle and whole-output budget.
 * @outputs Rendered text and index whole/shortened/omitted metadata.
 * @effects none
 * @errors None.
 */
import { SHARED_MEMORY_OUTPUT_BUDGET, SHARED_MEMORY_TRIM_MARK } from '../../nana-setup/lib/shared-memory-config.mjs';
export const HEADER = (idx) => `[nana:shared-memory] ${idx} — general feedback/user/reference memories are written HERE (symlinked as shared/ in this project's memory dir); project facts go in the project's own memory dir.`;
export const FOLD_LINE = (shortened, total, leftOut, idx) => `[nana:shared-memory] index shortened to fit the hook output cap: ${shortened} of ${total} entries shortened, ${leftOut} left out; full index: ${idx}`;

/** Moved from the hook: the no-push algorithm and bytes are unchanged. */
export function renderMemoryIndex(fixed, entries, idx, budget = SHARED_MEMORY_OUTPUT_BUDGET) {
 const full = fixed + entries.map((line) => `${line}\n`).join("");
 let output = full;
 let whole = entries;
 let shortenedEntries = [];
 let omitted = [];
 if (full.length <= budget) {
  // Full entries retain their original text and order.
 } else {
  const parts = entries.map((line) => {
   const head = line.match(/^- \[[^\]]*\]\([^)]*\)/)?.[0] ?? line;
   return { head, description: line.slice(head.length) };
  });
  const total = parts.length;
  const reservedFold = `${FOLD_LINE(total, total, total, idx)}\n`;
  const shorten = ({ head, description }, limit) => {
   if (description.length <= limit) return `${head}${description}`;
   let end = limit;
   if (end > 0 && /[\uD800-\uDBFF]/.test(description[end - 1])) end--;
   return `${head}${description.slice(0, end)}${SHARED_MEMORY_TRIM_MARK}`;
  };
  const render = (selected, limit) => selected.map((part) => `${shorten(part, limit)}\n`).join("");
  let limit = 0;
  let selected = parts;
  if ((fixed + render(parts, 0) + reservedFold).length <= budget) {
   let low = 0;
   let high = Math.max(0, ...parts.map(({ description }) => description.length));
   while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if ((fixed + render(parts, mid) + reservedFold).length <= budget) low = mid;
    else high = mid - 1;
   }
   limit = low;
  } else {
   let kept = 0;
   let renderedLength = 0;
   for (const part of parts) {
    const lineLength = shorten(part, 0).length + 1;
    if (fixed.length + renderedLength + lineLength + reservedFold.length > budget) break;
    renderedLength += lineLength;
    kept++;
   }
   selected = parts.slice(0, kept);
  }
  const shortened = selected.filter(({ description }) => description.length > limit).length;
  const leftOut = total - selected.length;
  output = fixed + render(selected, limit) + `${FOLD_LINE(shortened, total, leftOut, idx)}\n`;
  whole = selected.filter(({ description }) => description.length <= limit).map(({ head }) => head);
  shortenedEntries = selected.filter(({ description }) => description.length > limit).map(({ head }) => head);
  omitted = parts.slice(selected.length).map(({ head }) => head);
 }
 return {output, full, whole, shortenedEntries, omitted};
}
export function seatMemoryLayout({header,entries,indexPath,bundle,budget=SHARED_MEMORY_OUTPUT_BUDGET}) {
 const baseline=renderMemoryIndex(header,entries,indexPath,budget);
 if(!bundle)return baseline;
 const fixed=header+bundle.text;
 const result=renderMemoryIndex(fixed,entries,indexPath,budget);
 if(!result.omitted.length)return {...result,full:baseline.full,bundleDelivered:true};
 // Push-only title tier keeps the index's discovery surface beside the records.
 const reserve=`${FOLD_LINE(entries.length,entries.length,entries.length,indexPath)}\n`;
 if(fixed.length+reserve.length>budget)return {...baseline,bundleDelivered:false};
 let text='',kept=0;
 for(const entry of entries) {
  const title=entry.match(/^- \[[^\]]*\]/)?.[0]??entry;
  if(fixed.length+text.length+title.length+1+reserve.length>budget)break;
  text+=title+'\n';kept++;
 }
 return {output:fixed+text+FOLD_LINE(kept,entries.length,entries.length-kept,indexPath)+'\n',full:baseline.full,whole:[],shortenedEntries:entries.slice(0,kept),omitted:entries.slice(kept),bundleDelivered:true};
}
export const renderSeatMemory = options => seatMemoryLayout(options).output;
