/**
 * @module packages/nana-pack/tests/handoff-asks.test.mjs
 * @purpose Pins Open for Jake entry splitting and the independent frontier-tag and report-title grammars.
 * @inputs handoff-asks.mjs and temporary HANDOFF text.
 * @outputs named PASS/FAIL checks and a nonzero exit when an assertion fails.
 * @effects disk (writes fixtures under the OS temp directory).
 * @errors failed assertions are reported and cause exit 1.
 */
import { splitOpenForJake } from "../lib/handoff-asks.mjs";

let failures = 0;
const check = (name, value) => {
  console.log(value ? "PASS" : "FAIL", name);
  if (!value) failures++;
};
const entries = splitOpenForJake([
  "## Open for Jake (asks)",
  "- **[optional, since 2026-10-10] Parsed title.** Full body here.",
  "  second body line.",
  "- [blocking, since 2026-10-10] no report title grammar",
  "- **[parked, since 2026-10-09] Continuation tag.** body",
  "  [optional, since 2026-10-08]",
  "## Next",
  "- **[blocking, since 2026-10-10] not in section.**",
].join("\n"));
check("all raw ask entries preserve lines and starting line", entries.length === 3 && entries[0].line === 2 && entries[0].lines.length === 2 && entries[0].lines[1].includes("second body line"));
check("tag parsing accepts the frontier tag independently", entries[0].tag.kind === "optional" && entries[0].tag.since === "2026-10-10");
check("title grammar extracts title and complete body", entries[0].title.title === "Parsed title" && entries[0].title.body === "Full body here.\n  second body line.");
check("a tag need not make an entry title-parseable", entries[1].tag.kind === "blocking" && entries[1].title === null);
check("a title grammar match and continuation tag are independent", entries[2].title.title === "Continuation tag" && entries[2].tag.kind === "parked" && entries[2].tag.since === "2026-10-09");
if (failures) process.exitCode = 1;
