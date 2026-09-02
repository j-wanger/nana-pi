// E2E regression: a sent prompt renders exactly ONE user bubble during the
// turn and after settle (guards the optimistic-append × echoed-user-message_end
// swap, including the echo-beats-fetch race found 2026-09-02).
//
// Not part of any suite — the desk is zero-dep. Run manually:
//   npm i playwright && npx playwright install chromium-headless-shell
//   node apps/desk/test/double-msg.e2e.mjs
// Drives the REAL desk server + a REAL `pi --mode rpc` child (one tiny model
// call) in headless Chromium. Exit 0 = pass, 1 = duplicate seen, 2 = never
// settled (provider issue), 3 = harness error.
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PORT = process.env.DESK_TEST_PORT || 4381;
const BASE = `http://127.0.0.1:${PORT}`;
const MSG = "Reply with exactly: ok";
const SERVER = new URL("../server.mjs", import.meta.url).pathname;
const CWD = fs.mkdtempSync(path.join(os.tmpdir(), "desk-e2e-"));

const server = spawn("node", [SERVER], {
  env: { ...process.env, DESK_PORT: String(PORT) },
  stdio: ["ignore", "pipe", "pipe"],
});
const die = (code) => { server.kill(); process.exit(code); };

try {
  for (let i = 0; i < 40; i++) {
    try { await fetch(BASE + "/api/live"); break; } catch { await new Promise((r) => setTimeout(r, 250)); }
    if (i === 39) throw new Error("desk server never came up");
  }

  const spawned = await fetch(BASE + "/api/spawn", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ cwd: CWD, name: "e2e-double-msg" }),
  }).then((r) => r.json());
  if (!spawned.id) throw new Error("spawn failed: " + JSON.stringify(spawned));

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(BASE);
  await page.waitForSelector("#live-list .live-row", { timeout: 10000 });
  await page.click("#live-list .live-row");
  await page.waitForSelector("#input", { timeout: 5000 });
  await page.fill("#input", MSG);
  await page.press("#input", "Enter");

  const counts = [];
  let settled = false;
  for (let t = 0; t < 120 && !settled; t++) {
    await page.waitForTimeout(500);
    const [n, chip] = await page.evaluate((msg) => [
      [...document.querySelectorAll("#transcript .msg.user")].filter((b) => b.textContent.includes(msg)).length,
      document.getElementById("chip")?.textContent,
    ], MSG);
    counts.push(n);
    if (n > 0 && chip === "idle") settled = true;
  }
  await browser.close();

  const maxDuring = Math.max(...counts);
  const finalCount = counts[counts.length - 1];
  console.log(`max-bubbles-during-turn=${maxDuring} final=${finalCount} settled=${settled}`);
  if (maxDuring === 1 && finalCount === 1 && settled) { console.log("PASS"); die(0); }
  die(settled ? 1 : 2);
} catch (e) {
  console.error("E2E error:", e.message);
  die(3);
}
