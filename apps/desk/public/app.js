const $ = (id) => document.getElementById(id);
const HOME = "~";

let selected = null; // {kind: "live"|"hist", id?, file?, cwd?}
let stream = null;
let currentBubble = null;
let toolRows = new Map(); // toolCallId → element

const short = (p) => (p || "").replace(/^\/(Users|home)\/[^/]+/, HOME);
const when = (ms) => {
	const d = new Date(ms);
	const today = new Date().toDateString() === d.toDateString();
	return today
		? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
		: d.toLocaleDateString([], { month: "short", day: "numeric" });
};

// ── rail: live + historical sessions ──
async function refreshRail() {
	const [live, groups] = await Promise.all([
		fetch("/api/live").then((r) => r.json()),
		fetch("/api/sessions").then((r) => r.json()),
	]);

	const liveList = $("live-list");
	liveList.innerHTML = "";
	for (const c of live) {
		const b = document.createElement("button");
		b.className = `live-row ${c.state}` + (selected?.kind === "live" && selected.id === c.id ? " selected" : "");
		b.innerHTML = `<span class="lamp">●</span><span class="cwd">${short(c.cwd)}</span>${c.state}`;
		b.onclick = () => openLive(c.id, c.cwd);
		liveList.appendChild(b);
	}

	const list = $("session-list");
	list.innerHTML = "";
	let count = 0;
	for (const g of groups) {
		const h = document.createElement("div");
		h.className = "ws-head";
		h.textContent = short(g.cwd);
		list.appendChild(h);
		for (const s of g.sessions) {
			count++;
			const b = document.createElement("button");
			b.className = "sess" + (selected?.kind === "hist" && selected.file === s.file ? " selected" : "");
			b.innerHTML = `<span class="when">${when(s.mtime)}</span><span class="title"></span>`;
			b.querySelector(".title").textContent = s.title;
			b.title = s.title || "(untitled)";
			b.onclick = () => openHistorical(s.file, g.cwd);
			list.appendChild(b);
		}
	}
	$("stats").textContent = `${groups.length} workspaces · ${count} sessions · ${live.length} live`;
}

// ── stage helpers ──
function clearStage() {
	stream?.close();
	stream = null;
	currentBubble = null;
	toolRows.clear();
	$("transcript").innerHTML = "";
	$("stage-head").innerHTML = "";
}

function addMsg(cls, text) {
	const el = document.createElement("div");
	el.className = `msg ${cls}`;
	el.textContent = text;
	$("transcript").appendChild(el);
	el.scrollIntoView({ block: "end" });
	return el;
}

function addTool(id, name, detail) {
	const el = document.createElement("div");
	el.className = "tool";
	el.innerHTML = `<span class="spin">⚙</span> `;
	el.append(`${name} ${detail}`);
	$("transcript").appendChild(el);
	el.scrollIntoView({ block: "end" });
	if (id) toolRows.set(id, el);
	return el;
}

function setChip(state) {
	const head = $("stage-head");
	let chip = head.querySelector(".chip");
	if (!chip) {
		chip = document.createElement("span");
		chip.className = "chip";
		head.appendChild(chip);
	}
	chip.className = `chip ${state}`;
	chip.textContent = state;
}

// ── historical view ──
async function openHistorical(file, cwd) {
	selected = { kind: "hist", file, cwd };
	clearStage();
	$("empty").hidden = true;
	$("composer").hidden = true;

	const head = $("stage-head");
	head.innerHTML = `<span>${short(file.split("/").pop())}</span>`;
	const cont = document.createElement("button");
	cont.textContent = "Continue here";
	cont.onclick = () => spawnSession(cwd, file);
	head.appendChild(cont);

	const entries = await fetch(`/api/transcript?file=${encodeURIComponent(file)}`).then((r) => r.json());
	if (entries.error) return addMsg("error", entries.error);
	for (const e of entries) {
		if (e.role === "user") addMsg("user", e.text);
		else if (e.role === "assistant") {
			if (e.text) addMsg("assistant", e.text);
			for (const t of e.tools || []) addTool(null, t.name, t.args);
		} else if (e.role === "tool" && e.isError) addMsg("error", e.text.slice(0, 300));
	}
	refreshRail();
}

// ── live view ──
function openLive(id, cwd) {
	selected = { kind: "live", id, cwd };
	clearStage();
	$("empty").hidden = true;
	$("composer").hidden = false;
	$("stage-head").innerHTML = `<span>${short(cwd)}</span>`;
	setChip("running");

	stream = new EventSource(`/api/session/${id}/events`);
	stream.onmessage = (ev) => {
		let e;
		try {
			e = JSON.parse(ev.data);
		} catch {
			return;
		}
		handleEvent(e);
	};
	stream.onerror = () => setChip("exited");
	refreshRail();
	$("input").focus();
}

function handleEvent(e) {
	switch (e.type) {
		case "agent_start":
			setChip("running");
			break;
		case "agent_settled":
			setChip("settled");
			currentBubble = null;
			break;
		case "message_start":
			currentBubble = null;
			break;
		case "message_update": {
			const ame = e.assistantMessageEvent;
			if (!ame) break;
			if (ame.type === "text_delta") {
				if (!currentBubble || currentBubble.dataset.kind !== "text") {
					currentBubble = addMsg("assistant", "");
					currentBubble.dataset.kind = "text";
				}
				currentBubble.textContent += ame.delta;
				currentBubble.scrollIntoView({ block: "end" });
			} else if (ame.type === "thinking_delta") {
				if (!currentBubble || currentBubble.dataset.kind !== "thinking") {
					currentBubble = addMsg("thinking", "");
					currentBubble.dataset.kind = "thinking";
				}
				currentBubble.textContent += ame.delta;
			}
			break;
		}
		case "message_end":
			currentBubble = null;
			break;
		case "tool_execution_start":
			addTool(e.toolCallId, e.toolName, JSON.stringify(e.input ?? {}).slice(0, 160));
			break;
		case "tool_execution_end": {
			const row = toolRows.get(e.toolCallId);
			if (row) {
				const mark = row.querySelector(".spin");
				if (mark) {
					mark.className = e.isError ? "bad" : "ok";
					mark.textContent = e.isError ? "✗" : "✓";
				}
			}
			break;
		}
		case "compaction_start":
			addMsg("note", "— compacting context —");
			break;
		case "compaction_end":
			addMsg("note", "— compaction done —");
			break;
		case "extension_error":
			addMsg("error", `extension error: ${JSON.stringify(e).slice(0, 200)}`);
			break;
		case "desk_exit":
			setChip("exited");
			addMsg("note", `— session process exited (${e.code}) ${e.stderrTail || ""}`);
			break;
	}
}

async function spawnSession(cwd, sessionFile) {
	const body = { cwd };
	if (sessionFile) body.session = sessionFile;
	const r = await fetch("/api/spawn", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(body),
	}).then((r) => r.json());
	if (r.error) return alert(r.error);
	openLive(r.id, cwd);
}

// ── composer ──
async function send() {
	if (selected?.kind !== "live") return;
	const text = $("input").value.trim();
	if (!text) return;
	addMsg("user", text);
	$("input").value = "";
	await fetch(`/api/session/${selected.id}/prompt`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ message: text, mode: $("mode").value }),
	});
	setChip("running");
}

$("send").onclick = send;
$("input").addEventListener("keydown", (e) => {
	if (e.key === "Enter" && !e.shiftKey) {
		e.preventDefault();
		send();
	}
});
$("abort").onclick = () => selected?.kind === "live" && fetch(`/api/session/${selected.id}/abort`, { method: "POST" });
$("kill").onclick = async () => {
	if (selected?.kind !== "live") return;
	await fetch(`/api/session/${selected.id}`, { method: "DELETE" });
	clearStage();
	$("composer").hidden = true;
	$("empty").hidden = false;
	selected = null;
	refreshRail();
};
$("spawn-form").onsubmit = (e) => {
	e.preventDefault();
	const raw = $("spawn-cwd").value.trim();
	if (raw) spawnSession(raw); // server expands a leading ~
};

// ── the wire ──
function startWire() {
	const es = new EventSource("/api/wire");
	es.onopen = () => $("wire-dot").classList.remove("off");
	es.onerror = () => $("wire-dot").classList.add("off");
	es.onmessage = (ev) => {
		let e;
		try {
			e = JSON.parse(ev.data);
		} catch {
			return;
		}
		const row = document.createElement("div");
		row.className = "wire-row fresh";
		const evName = (e.event || "?").replace("session_", "");
		const cls = evName.includes("compact") ? "compact" : evName.includes("fail") ? "fail" : "";
		row.innerHTML = `<span>${(e.ts || "").slice(11, 19)}</span><span class="ev ${cls}">${evName}</span><span>${short(e.cwd)}</span>`;
		const list = $("wire-list");
		list.prepend(row);
		while (list.children.length > 100) list.lastChild.remove();
	};
}

refreshRail();
startWire();
setInterval(refreshRail, 15000);
