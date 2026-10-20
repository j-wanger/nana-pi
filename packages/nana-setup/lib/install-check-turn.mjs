/**
 * @module packages/nana-setup/lib/install-check-turn.mjs
 * @purpose Provide the install check's deterministic offline pi turn and record its observed prompt and tool result.
 * @inputs Pi's extension API, faux model requests and the sealed install-check turn contract.
 * @outputs A fixture provider response and one JSON record in the temporary home.
 * @effects disk
 * @errors Provider or record-write errors surface through pi's extension and turn diagnostics.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fauxAssistantMessage, fauxProvider, fauxToolCall, getCurrentSystemPrompt } from "@earendil-works/pi-ai";
import { PI_TURN, SAMPLE_INPUTS } from "./install-check-config.mjs";

function contentText(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.filter((block) => block?.type === "text").map((block) => block.text).join("\n");
}

export default function installCheckTurn(pi) {
  const record = { system: "", userMessages: [], toolResults: [] };
  const faux = fauxProvider({
    provider: PI_TURN.provider,
    models: [{ id: PI_TURN.model, name: "Nana install-check turn" }],
  });
  faux.setResponses([
    (context) => {
      record.system = getCurrentSystemPrompt(context.messages);
      record.userMessages = context.messages.filter((message) => message.role === "user").map((message) => contentText(message.content));
      return fauxAssistantMessage(fauxToolCall(PI_TURN.tool, { command: SAMPLE_INPUTS.verifier.bashHit }), { stopReason: "toolUse" });
    },
    (context) => {
      record.toolResults = context.messages.filter((message) => message.role === "toolResult").map((message) => ({
        toolName: message.toolName,
        isError: message.isError,
        text: contentText(message.content),
      }));
      fs.writeFileSync(path.join(os.homedir(), PI_TURN.record), JSON.stringify(record));
      return fauxAssistantMessage("install-check turn complete");
    },
  ]);
  pi.registerProvider(faux.provider);
}
