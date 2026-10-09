// Read-only stop-trigger count for the writing trial (plan 6.4, step 1).
// A report counts as CHECKED when, in the same turn (after the previous real user prompt), a
// main-thread Bash call ran `nana-writing.mjs --report` before a report-sized (>= 80 words)
// main-thread assistant message in a session where the canonical rule had attached.
// Seat projects only (the extractor's transcriptFiles: no worktree or private-tmp projects).
// Checker calls whose command names HANDOFF.md are excluded: they check the frontier file, not a report.
// Usage: node stop-count.mjs [claude-projects-root] [since-iso]   (read-only; prints JSON)
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
const ext = await import(new URL("../../../packages/nana-pack/lib/writing-trial-extractor.mjs", import.meta.url).href);
const root = process.argv[2] ?? path.join(os.homedir(), ".claude", "projects");
const since = process.argv[3] ?? "2026-10-04T00:00:00Z";
const RULE_TITLE = "# Nana — Writing for Jake";
const RULE_ANCHOR = "Put the verdict in the first sentence. Use one of:";
const textFrom = (v) => typeof v === "string" ? v : Array.isArray(v) ? v.map(textFrom).join("\n") : v && typeof v === "object" ? (typeof v.text === "string" ? v.text : Object.values(v).map(textFrom).join("\n")) : "";
const words = (t) => t.trim().split(/\s+/u).filter(Boolean).length;
const isRule = (e) => { const t = String(e.type ?? "").toLowerCase(); if (t !== "attachment" && e.isAttachment !== true && !e.attachment) return false; const s = textFrom(e.attachment ?? e.message ?? e.content ?? e); return s.includes(RULE_TITLE) && s.includes(RULE_ANCHOR); };
const isPrompt = (e) => e.type === "user" && e.isSidechain === false && !(Array.isArray(e.message?.content) && e.message.content.some((p) => p?.type === "tool_result"));
const checkCall = (e) => e.type === "assistant" && e.isSidechain === false && Array.isArray(e.message?.content) && e.message.content.some((p) => p?.type === "tool_use" && p.name === "Bash" && /(?:^|\/)nana-writing\.mjs\b/u.test(String(p.input?.command ?? "")) && /--report\b/u.test(String(p.input?.command ?? "")) && !/HANDOFF\.md/u.test(String(p.input?.command ?? "")));
const reportText = (e) => e.type === "assistant" && e.isSidechain === false && Array.isArray(e.message?.content) ? e.message.content.filter((p) => p?.type === "text").map((p) => p.text).join("\n").trim() : "";
const rows = [];
for (const { project, file } of ext.transcriptFiles(root)) {
  let rule = false, checkedInTurn = false;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    if (!line.trim()) continue;
    let e; try { e = JSON.parse(line); } catch { continue; }
    const ts = e.timestamp ?? e.message?.timestamp;
    if (isRule(e)) rule = true;
    if (isPrompt(e)) { checkedInTurn = false; continue; }
    if (!ts || ts < since) continue;
    if (checkCall(e)) checkedInTurn = true;
    const body = reportText(e);
    if (rule && checkedInTurn && body && words(body) >= 80) { rows.push({ project, session: path.basename(file, ".jsonl"), ts }); checkedInTurn = false; }
  }
}
rows.sort((a, b) => a.ts.localeCompare(b.ts));
console.log(JSON.stringify({ since, checkedReports: rows.length, twentieth: rows[19] ?? null, rows }, null, 1));
