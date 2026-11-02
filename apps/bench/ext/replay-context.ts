/**
 * @module apps/bench/ext/replay-context.ts
 * @purpose Supply the exact private recorded first system prompt at the before-agent-start boundary.
 * @inputs NANA_REPLAY_CONTEXT private JSON containing sections and their joined systemPrompt.
 * @outputs Exact system bytes persisted through pi's custom preamble and ordered post-cwd sections.
 * @effects disk (one private prompt read)
 * @errors Missing or inconsistent prompt input refuses extension loading.
 */
import fs from "node:fs";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function replayContext(pi: ExtensionAPI) {
 const input = JSON.parse(fs.readFileSync(process.env.NANA_REPLAY_CONTEXT!, "utf8"));
 if (typeof input.systemPrompt !== "string" || Object.values(input.sections).join("\n\n") !== input.systemPrompt) throw new Error("replay: invalid prompt");
 pi.on("before_agent_start", event => {
  // pi 1.4.0 never persists forceSystemPrompt. Use its custom-preamble fallback instead:
  // all recorded front sections become one opaque preamble, then cwd and custom sections.
  const ordered = Object.entries(input.sections) as [string, string][];
  const at = ordered.findIndex(([name]) => name === "cwd");
  if (at < 1) throw new Error("replay: unsupported prompt order");
  const unwrap = (name: string, text: string) => {
   const open = `<${name}>\n`, close = `\n</${name}>`;
   if (!text.startsWith(open) || !text.endsWith(close)) throw new Error("replay: unsupported prompt section");
   return text.slice(open.length, -close.length);
  };
  const options = event.systemPromptOptions;
  options.forceSystemPrompt = undefined;
  options.customPrompt = ordered.slice(0, at).map(([, text]) => text).join("\n\n");
  options.cwd = unwrap("cwd", ordered[at][1]);
  options.contextFiles = []; options.skills = []; options.appendSystemPrompt = "";
  options.sections = Object.fromEntries(ordered.slice(at + 1).map(([name, text]) => [name, unwrap(name, text)]));
 });
}
