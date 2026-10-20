/**
 * @module packages/nana-setup/lib/readme-rehearsal.mjs
 * @purpose Rehearses the root README's platform checklist as written, in a second temporary home.
 * @inputs A platform name, the root README text, the repo root's package.json repository field, a rehearsal home, a base environment and an injected spawn function.
 * @outputs One readme-checklist judgment: { item, code, passed, detail }.
 * @effects disk (creates the rehearsal home's folders, reads the root README and package.json), process (spawns the checklist's own commands through the injected spawn)
 * @errors Never throws; a step that cannot run or match is reported as a failed judgment.
 */
import fs from "node:fs";
import path from "node:path";
import { README_REHEARSAL } from "./install-check-config.mjs";
import { resolveLayout } from "./paths.mjs";

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Parses the checklist's own `Run `/`then ` command grammar and `expect ` grammar (R-1541). */
export function parseChecklist(text, platformName) {
  const normalized = String(text).replace(/\r\n/g, "\n");
  const heading = README_REHEARSAL.heading[platformName];
  const start = normalized.indexOf(heading);
  const body = start < 0 ? "" : normalized.slice(start + heading.length).split(/\n###\s/)[0];
  const leadPattern = README_REHEARSAL.commandLeads.map(escapeRegExp).join("|");
  const commandRe = new RegExp(`\\b(?:${leadPattern})\\s+\`([^\`]+)\``, "g");
  const expectRe = new RegExp(`\\b${escapeRegExp(README_REHEARSAL.expectLead)}\\s+\`([^\`]+)\``);
  return [...body.matchAll(/^\s*(\d+)\.\s+(.+)$/gm)].map((match) => {
    const commands = [...match[2].matchAll(commandRe)].map((c) => c[1]);
    const expectMatch = match[2].match(expectRe);
    return { step: Number(match[1]), commands, expect: expectMatch ? expectMatch[1] : null };
  });
}

/** Applies the sealed answer rule and nothing else (R-1543). */
export function rehearsalPlan(steps) {
  return steps.map((item) => ({
    ...item,
    commands: item.commands.map((command) => {
      const rule = README_REHEARSAL.answers.find((answer) => command.startsWith(answer.prefix));
      return rule ? `${command} ${rule.append}` : command;
    }),
  }));
}

function cloneUrl(root) {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const shorthand = String(pkg.repository ?? "");
  const rest = shorthand.startsWith("github:") ? shorthand.slice("github:".length) : shorthand;
  return `https://github.com/${rest}`;
}

/** Runs the platform checklist's planned steps from a fresh rehearsal home (R-1540, R-1542, R-1545, R-1853 to R-1855). */
export async function runReadmeRehearsal({ root, home, env, spawn, platformName }) {
  fs.mkdirSync(home, { recursive: true });
  fs.mkdirSync(path.join(home, "tmp"), { recursive: true });
  fs.mkdirSync(path.join(home, ".npm"), { recursive: true });
  const npmPrefixDir = path.join(home, README_REHEARSAL.npmPrefix);
  fs.mkdirSync(npmPrefixDir, { recursive: true });

  const stepEnv = { ...env };
  for (const key of Object.keys(stepEnv)) {
    if (README_REHEARSAL.droppedEnv.some((name) => key.toUpperCase() === name.toUpperCase())) delete stepEnv[key];
  }
  stepEnv.npm_config_prefix = npmPrefixDir;
  const prefixBin = path.join(npmPrefixDir, README_REHEARSAL.npmPrefixBin[platformName]);
  if (platformName === "win32") {
    const pathKeys = Object.keys(stepEnv).filter((key) => key.toLowerCase() === "path");
    const pathKey = pathKeys[0] ?? "Path";
    const callerPath = stepEnv[pathKey] ?? "";
    for (const key of pathKeys) delete stepEnv[key];
    const pathParts = [prefixBin];
    if (README_REHEARSAL.binOnPath[platformName]) pathParts.push(resolveLayout({ home }).binDir);
    pathParts.push(callerPath);
    stepEnv[pathKey] = pathParts.join(";");
  } else {
    stepEnv.PATH = `${prefixBin}${path.delimiter}${stepEnv.PATH ?? ""}`;
  }
  stepEnv.GIT_CONFIG_COUNT = "1";
  stepEnv.GIT_CONFIG_KEY_0 = `url.${root}.insteadOf`;
  stepEnv.GIT_CONFIG_VALUE_0 = cloneUrl(root);
  stepEnv.GIT_ALLOW_PROTOCOL = "file";

  const text = fs.readFileSync(path.join(root, README_REHEARSAL.readme), "utf8");
  const steps = rehearsalPlan(parseChecklist(text, platformName));
  const runnable = steps.filter((step) => step.commands.length > 0);
  const hasTerminalStep = runnable.some((step) => step.expect);
  if (!hasTerminalStep) {
    return { item: README_REHEARSAL.item, code: "no-expectation", passed: false, detail: "no checklist step names both commands and expected text" };
  }
  for (const step of runnable) {
    const joined = step.commands.join(" && ");
    const commandText = platformName === "win32" ? `"${joined}"` : joined;
    const result = await spawn(README_REHEARSAL.shell[platformName], [...README_REHEARSAL.shellArgs[platformName], commandText], {
      cwd: home,
      env: stepEnv,
      timeout: README_REHEARSAL.stepTimeoutMs,
      maxOutput: README_REHEARSAL.maxOutput,
      ...(platformName === "win32" ? { windowsVerbatimArguments: true } : {}),
    });
    const timedOut = result?.error?.code === "ETIMEDOUT";
    const okay = !result?.error && result?.status === 0;
    if (!okay) {
      const reason = timedOut ? "timed out" : `exit status ${result?.status ?? "unknown"}`;
      return { item: README_REHEARSAL.item, code: timedOut ? "timeout" : "exit", passed: false, detail: `step ${step.step} (${joined}): ${reason}` };
    }
    if (step.expect && !String(result.stdout ?? "").includes(step.expect)) {
      return { item: README_REHEARSAL.item, code: "missing-expectation", passed: false, detail: `step ${step.step} (${joined}): expected text "${step.expect}" not in stdout` };
    }
  }
  return { item: README_REHEARSAL.item, code: null, passed: true, detail: "" };
}
