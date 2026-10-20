/**
 * @module packages/nana-setup/lib/install-check-review.mjs
 * @purpose Provide the install check's deterministic offline pi-review response and record its observed review prompt.
 * @inputs Pi's extension API, faux model requests and the sealed install-check review contracts.
 * @outputs A fixture provider response ending in the sealed verdict line and one JSON record in the temporary home.
 * @effects disk
 * @errors Provider or record-write errors surface through pi's extension and review diagnostics.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fauxAssistantMessage, fauxProvider, getCurrentSystemPrompt } from "@earendil-works/pi-ai";
import { PI_REVIEW } from "./install-check-config.mjs";

function contentText(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.filter((block) => block?.type === "text").map((block) => block.text).join("\n");
}

export default function installCheckReview(pi) {
  const faux = fauxProvider({
    provider: PI_REVIEW.provider,
    models: [{ id: PI_REVIEW.model, name: "Nana install-check review" }],
  });
  faux.setResponses([(context) => {
    const record = {
      system: getCurrentSystemPrompt(context.messages),
      userMessages: context.messages.filter((message) => message.role === "user").map((message) => contentText(message.content)),
      role: process.env.NANA_ROLE,
    };
    fs.writeFileSync(path.join(os.homedir(), PI_REVIEW.record), JSON.stringify(record));
    return fauxAssistantMessage(`${PI_REVIEW.answer}\n\n${PI_REVIEW.verdictLine}`);
  }]);
  pi.registerProvider(faux.provider);
}
