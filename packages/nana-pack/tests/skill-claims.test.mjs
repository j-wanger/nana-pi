/**
 * @module packages/nana-pack/tests/skill-claims.test.mjs
 * @purpose Pin the surface inventory and checkout-only skill claim judgements.
 * @inputs Skill and shared-section text plus the current repository tree.
 * @outputs PASS/FAIL lines and claim accounting on stdout.
 * @effects disk (reads checkout files and creates isolated temporary fixtures), process (exits non-zero on failed checks)
 * @errors A failed contract check increments the failure count and exits 1.
 */
import { tmpDir } from "./tmp-dir.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { claims, commandProblems } from "../../../templates/typescript/template/scripts/readme-check.mjs";
import { EXEMPTIONS, SURFACES, UNJUDGED_CLAIM_NOTES, judgedClaimCount, judgeClaims, staleExemptions, surfaceCoverage } from "./skill-claims.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
let failures = 0;
const check = (title, ok, detail = "") => {
  console.log(ok ? "PASS" : "FAIL", title, ok ? "" : detail);
  if (!ok) failures++;
};
const read = (p) => fs.readFileSync(path.join(REPO, p), "utf8");
const skillsDir = path.join(REPO, "packages/nana-pack/skills");
const actualSkills = fs.readdirSync(skillsDir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => `${e.name}/SKILL.md`).sort();
const actualShared = "templates/_shared/working-under-nana-pi.md";
// req: R-598
check("surface table covers every skill and the shared working section", surfaceCoverage(SURFACES, actualSkills, actualShared), `${actualSkills}`);
const missingSurface = { ...SURFACES };
delete missingSurface.spec;
// req: R-598
check("surface table coverage detects a dropped entry", !surfaceCoverage(missingSurface, actualSkills, actualShared));
// req: R-598
check("every documented claim exemption has a reason", EXEMPTIONS.every((entry) => entry.reason.trim().length > 0));

const cwdTargets = [{ name: "checkout", root: REPO }];
const working = read(actualShared);
// req: R-598
check("checkout shared-section paths resolve", judgeClaims({ surface: actualShared, root: REPO, targets: cwdTargets, text: working }).pathProblems.length === 0);
// req: R-599
check("checkout shared-section package-script claims use valid runner spelling", judgeClaims({ surface: actualShared, root: REPO, targets: cwdTargets, text: working }).commandProblems.length === 0);
// req: R-629
check("checkout shared-section script flags and nana subcommands exist in source", judgeClaims({ surface: actualShared, root: REPO, targets: cwdTargets, text: working }).flagProblems.length === 0);

const requirements = read("packages/nana-pack/skills/requirements/SKILL.md");
const baseTarget = [{ name: "checkout", root: REPO }];
const mapFenceMutation = requirements.replace("pnpm map:impact <files>", "pnpm map:impact -- <files>");
// req: R-599
check("pnpm separator after a declared script is rejected", judgeClaims({ surface: "requirements", root: REPO, targets: baseTarget, text: mapFenceMutation }).commandProblems.some((p) => p.includes("separator")));
// req: R-599
check("npm separator remains valid", !judgeClaims({ surface: "requirements", root: REPO, targets: baseTarget, text: "```sh\nnpm run map:impact -- <files>\n```" }).commandProblems.some((p) => p.includes("separator")));
// req: R-599
check("unmodified requirements commands remain valid", judgeClaims({ surface: "requirements", root: REPO, targets: baseTarget, text: requirements }).commandProblems.length === 0);
// req: R-599
check("inline pnpm separator after a declared script is rejected", judgeClaims({ surface: "requirements", root: REPO, targets: baseTarget, text: `${requirements}\\nUse ` + "`pnpm map:impact -- <files>`." }).commandProblems.some((p) => p.includes("separator")));
// req: R-599
check("runner-less script names are rejected", judgeClaims({ surface: "requirements", root: REPO, targets: baseTarget, text: "```sh\nmap:impact -- <changed-files>\n```" }).commandProblems.some((p) => p.includes("spell it with its runner")));

const surfaceTexts = Object.entries(SURFACES).map(([surface, declared]) => ({
  surface,
  text: surface === actualShared ? working : read(`packages/nana-pack/skills/${surface}/SKILL.md`),
  declared,
}));
const checkoutSurfaces = surfaceTexts.filter(({ declared }) => declared.includes("checkout"));
const checkoutJudgements = checkoutSurfaces.map(({ surface, text }) => ({ surface, text, result: judgeClaims({ surface, root: REPO, targets: cwdTargets, text }) }));
const pathErrors = checkoutJudgements.filter(({ surface }) => surface === actualShared).flatMap(({ result }) => result.pathProblems);
const commandErrors = checkoutJudgements.flatMap(({ result }) => result.commandProblems);
const flagErrors = checkoutJudgements.flatMap(({ result }) => result.flagProblems);
for (const { surface, text } of surfaceTexts) {
  for (const entry of staleExemptions(surface, text)) console.log(`STALE exemption ${entry.surface} ${entry.kind} '${entry.text}'`);
}
// req: R-598
check("checkout shared-section claim paths resolve", pathErrors.length === 0, pathErrors.join("\n"));
// req: R-599
check("checkout skill package-script claims resolve for every declared checkout surface", commandErrors.length === 0, commandErrors.join("\n"));
// req: R-629
check("checkout skill claim flags and subcommands exist in source for every declared checkout surface", flagErrors.length === 0, flagErrors.join("\n"));
const checkoutScripts = new Set(JSON.parse(read("package.json")).scripts ? Object.keys(JSON.parse(read("package.json")).scripts) : []);
function checkoutRunnerProblems(surface, text) {
  const problems = [];
  for (const claim of claims(text)) {
    if (claim.kind !== "command") continue;
    const first = claim.text.trim().split(/\s+/)[0];
    const command = /^(npm|pnpm|yarn|bun)\s+(?:run\s+)?([A-Za-z0-9:_.-]+)/.exec(claim.text);
    if (command && checkoutScripts.has(command[2])) problems.push(...commandProblems(REPO, surface, claim, [...checkoutScripts]));
    if (command && checkoutScripts.has(command[2]) && command[1] === "pnpm" && /(?:^|\s)--(?:\s|$)/.test(claim.text)) problems.push(`${surface}:${claim.line}: pnpm separator`);
    if (checkoutScripts.has(first)) problems.push(`${surface}:${claim.line}: runner-less ${first}`);
  }
  return problems;
}
const checkoutCommandErrors = surfaceTexts.flatMap(({ surface, text }) => checkoutRunnerProblems(surface, text));
// req: R-599
check("checkout script spelling rules inspect all skill and shared surfaces", checkoutCommandErrors.length === 0, checkoutCommandErrors.join("\n"));
// req: R-599
check("a pnpm separator in scaffold-ts is caught without rendering", checkoutRunnerProblems("scaffold-ts", read("packages/nana-pack/skills/scaffold-ts/SKILL.md").replace("pnpm map:check", "pnpm map:check -- <files>")).some((p) => p.includes("scaffold-ts:") && p.includes("separator")));
// req: R-599
check("a runner-less checkout script in py-review is caught without rendering", checkoutRunnerProblems("py-review", `${read("packages/nana-pack/skills/py-review/SKILL.md")}\n\`\`\`sh\nmap:impact -- <changed-files>\n\`\`\``).some((p) => p.includes("py-review:") && p.includes("runner-less")));
const fixtureRoot = tmpDir(path.join(os.tmpdir(), "skill-claim-fixture-"));
fs.writeFileSync(path.join(fixtureRoot, "package.json"), JSON.stringify({ scripts: { map: "node map.mjs" } }));
const emptyRoot = tmpDir(path.join(os.tmpdir(), "skill-claim-empty-"));
fs.writeFileSync(path.join(emptyRoot, "package.json"), JSON.stringify({ scripts: {} }));
// req: R-599
check("missing pnpm test script is rejected", judgeClaims({ surface: "fixture", root: REPO, targets: [{ name: "empty", root: emptyRoot }], text: "`pnpm test`" }).commandProblems.some((p) => p.includes("pnpm test")));
// req: R-599
check("missing pnpm build script is rejected", judgeClaims({ surface: "fixture", root: REPO, targets: [{ name: "empty", root: emptyRoot }], text: "`pnpm build`" }).commandProblems.some((p) => p.includes("pnpm build")));
// req: R-599
check("runner spelling uses the declared target script inventory", judgeClaims({ surface: "fixture", root: REPO, targets: [{ name: "fixture", root: fixtureRoot }], text: "```sh\nmap\n```" }).commandProblems.some((p) => p.includes("spell it with its runner")));
// req: R-599
check("literal pnpm argument separator is rejected by the command judge", judgeClaims({ surface: "fixture", root: REPO, targets: [{ name: "fixture", root: fixtureRoot }], text: "```sh\npnpm map -- <files>\n```" }).commandProblems.some((p) => p.includes("separator")));
fs.mkdirSync(path.join(fixtureRoot, "scripts"));
fs.writeFileSync(path.join(fixtureRoot, "scripts/map.mjs"), "export const usage = '--impact';\\n");
// req: R-598
check("a removed claimed path is rejected", judgeClaims({ surface: "fixture", root: REPO, targets: [{ name: "fixture", root: fixtureRoot }], text: "`scripts/gone.mjs`" }).pathProblems.length > 0);
fs.writeFileSync(path.join(fixtureRoot, "REQUIREMENTS.md"), "present before the in-memory path mutation");
fs.unlinkSync(path.join(fixtureRoot, "REQUIREMENTS.md"));
// req: R-598
check("a checkout copy cannot mask a removed path in its declared target", judgeClaims({ surface: "fixture", root: REPO, targets: [{ name: "fixture", root: fixtureRoot }], text: "`REQUIREMENTS.md`" }).pathProblems.length > 0);
// req: R-629
check("a missing script flag is rejected by the reused flag judge", judgeClaims({ surface: "fixture", root: REPO, targets: [{ name: "fixture", root: fixtureRoot }], text: "`node scripts/map.mjs --impakt`" }).flagProblems.some((p) => p.includes("--impakt")));
// req: R-629
check("a missing nana-command flag is rejected", judgeClaims({ surface: actualShared, root: REPO, targets: cwdTargets, text: working.replace("--brief <file>", "--brieff <file>") }).flagProblems.some((p) => p.includes("--brieff")));
// req: R-629
check("a declared nana subcommand absent from its source is rejected", judgeClaims({ surface: "requirements", root: REPO, targets: cwdTargets, text: "`review-ledger reports`" }).flagProblems.some((p) => p.includes("reports")));
const claimCount = checkoutJudgements.reduce((n, { result }) => n + result.claims, 0);
const unjudged = checkoutJudgements.flatMap(({ result }) => result.unjudgedCommands);
const judged = judgedClaimCount(claimCount, unjudged);
// req: R-599
check("judged claim accounting excludes unjudged commands", judged === claimCount - unjudged.length && unjudged.length > 0);
// req: R-599
check("node -e is reported as unjudged", judgeClaims({ surface: "requirements", root: REPO, targets: baseTarget, text: "`node -e 'process.exit(0)'`" }).unjudgedCommands.includes("node"));
// req: R-599
check("uv run pytest is reported as unjudged", judgeClaims({ surface: "requirements", root: REPO, targets: baseTarget, text: "`uv run pytest`" }).unjudgedCommands.includes("uv"));
// req: R-599
check("README unchecked list matches the exported classification", UNJUDGED_CLAIM_NOTES.every((note) => read("packages/nana-pack/README.md").includes(note)), UNJUDGED_CLAIM_NOTES.filter((note) => !read("packages/nana-pack/README.md").includes(note)).join(", "));
console.log(`claims: ${judged} judged, ${unjudged.length} unjudged command claims (heads: ${[...new Set(unjudged)].join(", ") || "none"})`);

if (failures) console.log(`${failures} FAILED`);
else console.log("all passed");
process.exit(failures ? 1 : 0);
