/**
 * @module apps/bench/lib/anatomy-sessions.mjs
 * @purpose Extract ordered pushed context and pulls from pi builder sessions grouped through build records.
 * @inputs Explicit sessions and repository roots, committed brief history and clone-shared ledgers.
 * @outputs Private segmented contexts, counted exclusions, skip reasons and extraction denominators.
 * @effects disk (explicit roots), process (read-only bounded git queries)
 * @errors Filesystem or git discovery failures propagate to the counts-only CLI boundary.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { entriesIn, textFrom, transcriptFiles } from "../../../packages/nana-pack/lib/claude-transcript.mjs";
import { buildRecordsPath, collectBuildUsage, readBuildLedger } from "../../../packages/nana-pack/lib/build-records.mjs";
import { landRecordsPath, readLandLedger } from "../../../packages/nana-pack/lib/land-records.mjs";
import { readBrief } from "../../../packages/nana-pack/lib/brief-precedent.mjs";
import { totalTokens } from "../../../packages/nana-pack/lib/pi-usage.mjs";
import { GIT_LIMIT_MS, GIT_MAX_BUFFER, KNOWN_BUG_HEADER, MILLISECONDS_PER_MINUTE, SESSION_PREFIX } from "./anatomy-config.mjs";
import { segmentPart } from "./anatomy-spans.mjs";
import { pullsOf } from "./anatomy-pulls.mjs";

const slash = (s) => s.replaceAll("\\", "/");
const basename = (s) => slash(s).split("/").filter(Boolean).at(-1) ?? "unknown";
function git(repo, args, optional = false) {
 const result = spawnSync("git", args, { cwd: repo, encoding: "utf8", timeout: GIT_LIMIT_MS, maxBuffer: GIT_MAX_BUFFER });
 if (result.status !== 0) { if (optional) return null; throw new Error("git-read-failed"); }
 return result.stdout;
}
function ledger(file, read) { return fs.existsSync(file) ? read(file).records : []; }
function briefAt(repo, start) {
 if (!start?.tip || !start.brief) return null;
 let file = start.brief;
 if (path.isAbsolute(file)) file = path.relative(repo, file);
 if (file.startsWith("..")) return null;
 const blob = `${start.tip}:${slash(file)}`, text = git(repo, ["show", blob], true);
 return text === null || !text ? null : { text, blob, file };
}
function historicalBriefs(repo) {
 const files = new Set((git(repo, ["ls-files", "--", "docs/reviews"], true) ?? "").split(/\r?\n/u));
 for (const f of (git(repo, ["log", "--all", "--format=", "--name-only", "--", "docs/reviews"], true) ?? "").split(/\r?\n/u)) files.add(f);
 const found = [], seen = new Set();
 for (const file of [...files].filter((f) => /brief[^/]*\.md$/iu.test(f)).sort()) {
  const tips = (git(repo, ["log", "--all", "--format=%H", "--", file], true) ?? "").split(/\r?\n/u).filter(Boolean);
  for (const tip of tips) {
   const blob = `${tip}:${file}`, text = git(repo, ["show", blob], true);
   if (text && !seen.has(text)) { seen.add(text); found.push({ text, blob, file }); }
  }
 }
 // Longest first avoids matching a short brief that is embedded in a later revision.
 return found.sort((a, b) => b.text.length - a.text.length || a.blob.localeCompare(b.blob));
}
/** Git's text checkout conversion can change only line endings between blob and prompt.
 * Match that honest variation without trimming spaces/tabs or rewriting the stored spans.
 * The blob identity still names the committed source; matchedText names the received bytes.
 */
function matchBrief(raw, brief) {
 if (!brief) return null;
 const lf = brief.text.replace(/\r\n|\r/gu, "\n");
 const matchedText = [brief.text, lf, lf.replaceAll("\n", "\r\n"), lf.replaceAll("\n", "\r")].find((text) => raw.includes(text));
 return matchedText === undefined ? null : { ...brief, matchedText };
}
function splitAddendum(raw, brief) {
 const at = brief ? raw.indexOf(brief.matchedText) : -1;
 if (at < 0) return [{ name: "addendum", raw, reason: "brief-unmatched" }];
 const after = at + brief.matchedText.length, tail = raw.slice(after), bug = KNOWN_BUG_HEADER.exec(tail);
 const bugAt = bug ? after + bug.index : raw.length;
 return [
  { name: "preamble", raw: raw.slice(0, at) },
  { name: "brief", raw: raw.slice(at, bugAt) },
  ...(bug ? [{ name: "known-bugs", raw: raw.slice(bugAt) }] : []),
 ];
}
const inProject = (cwd, repo) => {
 const p = slash(path.resolve(cwd)), root = slash(path.resolve(repo));
 return p === root || p.startsWith(`${root}/`) || p.startsWith(`${root}-wt/`);
};
const buildNumber = (file = "") => {
 const name = basename(file);
 const m = /(?:build[-_])?brief[-_](\d+)|build[-_](\d+)[-_]brief|fix(\d*)[-_]brief/iu.exec(name);
 return m ? Number(m[1] ?? m[2] ?? (m[3] || "2")) : "unknown";
};

/** Reads only selected roots; never opens the context load log or starts a model. */
export function extractContexts({ repo, sessions }) {
 repo = path.resolve(repo); sessions = path.resolve(sessions);
 const common = path.resolve(repo, git(repo, ["rev-parse", "--git-common-dir"]).trim());
 const records = ledger(buildRecordsPath(common), readBuildLedger), lands = ledger(landRecordsPath(common), readLandLedger);
 const starts = records.filter((r) => r.kind === "start"), ends = new Map(records.filter((r) => r.kind === "end").map((r) => [r.build, r]));
 const landed = new Set(lands.filter((r) => r.kind === "start" && lands.some((e) => e.kind === "end" && e.attempt === r.attempt && e.outcome === "landed")).map((r) => r.lane));
 // Explicit selector: the default intentionally drops worktree sessions.
 const files = transcriptFiles(sessions, () => true).map((r) => r.file);
 for (const e of fs.readdirSync(sessions, { withFileTypes: true })) if (e.isFile() && e.name.endsWith(".jsonl")) files.push(path.join(sessions, e.name));
 const contexts = [], skipped = [], groups = new Map(); let history;
 for (const file of [...new Set(files)].sort()) {
  const entries = entriesIn(file), header = entries.find((e) => e.type === "session"), info = entries.filter((e) => e.type === "session_info").at(-1);
  if (!info?.name?.startsWith(SESSION_PREFIX)) { skipped.push({ reason: "not-builder" }); continue; }
  if (!header?.cwd || !inProject(header.cwd, repo)) { skipped.push({ reason: "other-project" }); continue; }
  const start = starts.find((s) => ends.get(s.build)?.sessions?.some((n) => basename(n) === basename(file)) && path.resolve(s.sessionDir) === path.dirname(file));
  const key = start?.build ?? `older-${contexts.length + 1}`;
  let c = groups.get(key);
  if (!c) {
   const end = start ? ends.get(start.build) : null;
   const usage = start ? collectBuildUsage(start, { before: end?.endedAt ?? null }) : collectBuildUsage({ cwd: header.cwd, sessionDir: path.dirname(file), startedAt: header.timestamp ?? "1970-01-01T00:00:00Z" }, { fsApi: { ...fs, readdirSync: () => [basename(file)] } });
   c = { id: key, lane: basename(header.cwd), cwd: header.cwd, branch: `feat/${basename(header.cwd)}`, buildNumber: buildNumber(start?.brief), model: start?.model ?? "unknown", verdict: "none", tokens: totalTokens(usage.usage), wallMinutes: (end?.durationMs ?? usage.durationMs ?? 0) / MILLISECONDS_PER_MINUTE, landed: landed.has(basename(header.cwd)), attempts: 0, startTip: start?.tip ?? null, briefBlob: null, parts: [], excluded: [], pulls: [] };
   groups.set(key, c); contexts.push(c);
  }
  const attempt = c.attempts++, exact = briefAt(repo, start);
  let brief = null, firstUser = false, hasSystem = false, lastAssistant = null;
  const push = (name, raw, extra = {}) => {
   const id = `${key}:a${attempt}:p${c.parts.length}`;
   c.parts.push({ name, raw, attempt, ...extra, spans: segmentPart(raw, name, id) });
  };
  for (const e of entries) {
   const m = e.message;
   if (e.type === "message" && m?.role === "system") {
    hasSystem = true;
    const sections = m.sections ?? { preamble: textFrom(m.content) };
    for (const [section, value] of Object.entries(sections)) {
     const raw = typeof value === "string" ? value : textFrom(value);
     if (section === "addendum") {
      brief = matchBrief(raw, exact);
      if (!brief) for (const candidate of (history ??= historicalBriefs(repo))) { brief = matchBrief(raw, candidate); if (brief) break; }
      if (brief) { c.briefBlob ??= brief.blob; if (c.buildNumber === "unknown") c.buildNumber = buildNumber(brief.file); }
      for (const p of splitAddendum(raw, brief)) push(p.name, p.raw, { section, ...(p.reason ? { reason: p.reason } : {}) });
     } else push(section, raw, { section });
    }
    if (m.toolsAdded !== undefined) push("toolsAdded", typeof m.toolsAdded === "string" ? m.toolsAdded : JSON.stringify(m.toolsAdded), { section: "toolsAdded" });
   } else if (e.type === "message" && m?.role === "user" && !firstUser) { firstUser = true; push("instruction", textFrom(m.content)); }
   else if (e.type === "custom_message" && e.customType === "nana-knowledge") push("knowledge-pull", textFrom(e.content));
   if (e.type === "context_edit") c.excluded.push({ reason: "context-edit", chars: textFrom(e.replacement).length });
   if (e.type === "compaction") c.excluded.push({ reason: "compaction", chars: textFrom(e.summary).length });
   if (e.type === "message" && m?.role === "assistant") { lastAssistant = typeof m.content === "string" ? m.content : textFrom(m.content?.filter((p) => p.type === "text")); c.model = m.model ?? c.model; }
  }
  if (!hasSystem) c.excluded.push({ reason: "no-system", chars: 0 });
  c.verdict = lastAssistant?.match(/\bVERDICT:\s*\**\s*([A-Z]+)\b/u)?.[1] ?? "none";
  const precedent = brief ? (readBrief(brief.text).precedent ?? []).filter((p) => p.kind === "path").map((p) => p.value) : [];
  c.pulls.push(...pullsOf(entries, { cwd: header.cwd, precedent }));
 }
 // Denominators include recorded builds with no addendum, not only successful split candidates.
 const recordedContexts = contexts.filter((c) => starts.some((s) => s.build === c.id));
 const olderContexts = contexts.filter((c) => !recordedContexts.includes(c));
 const fullySplit = (c) => Array.from({ length: c.attempts }, (_, attempt) => c.parts.some((p) => p.attempt === attempt && p.name === "brief")).every(Boolean);
 return { contexts, skipped, denominators: { files: files.length, builds: contexts.length, recorded: recordedContexts.length, splitRecorded: recordedContexts.filter(fullySplit).length, older: olderContexts.length, splitOlder: olderContexts.filter(fullySplit).length, briefUnmatched: contexts.flatMap((c) => c.parts).filter((p) => p.reason === "brief-unmatched").length, withKnownBugs: contexts.filter((c) => c.parts.some((p) => p.name === "known-bugs")).length } };
}
