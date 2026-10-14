import fs from "node:fs";
const base = fs.readFileSync(process.argv[2], "utf8");
const L = base.replace(/\r/g, "").split("\n");
const TABLE = L.filter((l) => l.startsWith("- "));
const SCOPE = L[2];
function run(text) {
  const lines = text.replace(/\r/g, "").split("\n");
  const bullets = lines.filter((l) => l.startsWith("- "));
  const first = lines.findIndex((l) => l.startsWith("- "));
  const prose = lines.slice(1, first).filter((l) => l.trim());
  const oneSentence = prose.length === 1 && (prose[0].match(/[.!?](?=\s|$)/g) || []).length === 1;
  const r1141 = prose.length === 1 && prose[0] === SCOPE && oneSentence;
  const beyond = bullets.length === TABLE.length && bullets.every((b) => TABLE.includes(b));
  const per = TABLE.map((t) => lines.filter((l) => l === t).length === 1);
  return { r1141, beyond, perRed: per.map((ok, i) => (ok ? null : i + 1)).filter(Boolean) };
}
const idx = (s) => L.findIndex((l) => l.includes(s));
const muts = {
  base,
  crlf: base.replace(/\n/g, "\r\n"),
  M1_delete_no_reading: L.filter((_, i) => i !== idx("do not read or judge")).join("\n"),
  M2_dup_verify: L.flatMap((l, i) => (i === idx("Verify once") ? [l, l] : [l])).join("\n"),
  M3_ninth_bullet: base + "- Send reports verdict-first.\n",
  M4_drop_monitor_clause: L.map((l, i) => (i === idx("Leave a running") ? l.replace(" or a monitor reports a failure or a stall", "") : l)).join("\n"),
  M4b_add_monitor_ban: base + "- Arm no monitor or heartbeat on a builder or reviewer run.\n",
  M5_delete_scope: L.filter((_, i) => i !== 2).join("\n"),
  M6_move_scope: (() => { const a = [...L]; const s = a.splice(2, 1)[0]; a.splice(5, 0, s); return a.join("\n"); })(),
  M6b_split_scope: L.map((l, i) => (i === 2 ? l.replace("; a session", ". A session") : l)).join("\n"),
};
for (const [k, v] of Object.entries(muts)) console.log(k, JSON.stringify(run(v)));
