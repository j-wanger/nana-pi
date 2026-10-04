# Karpathy on X — latest long-form posts, 2026-10-04

Research pass for lane R (`docs/reviews/pi-1.0-2026-10-04/ROLES.md`). No prior Karpathy
research existed on this machine (checked `~/nana-pi/research`, `~/nana-agent-loop`,
`~/private-knowledge/agentic-engineering-wiki`, `~/private-knowledge/agent-memory-wiki` —
nothing dedicated; a few wiki articles mention him in passing, uncatalogued).

**Method note on verification:** `x.com` and `xcancel.com` refused direct fetch this
session (HTTP 402 / 451 respectively — login/geo-walled). Where marked **[V]**, the
verbatim quote and date come from X's own page metadata as surfaced by search (title/
description of the actual `x.com/karpathy/status/…` page), not a full in-browser fetch of
the thread — so quotes are accurate but may be excerpts, not the complete post. Status IDs
are Twitter/X snowflake IDs; dates were cross-decoded (`(id >> 22) + 1288834974657` ms since
epoch) and checked against independent news coverage where available. **[S]** = secondary
source quoting him by name. **[U]** = could not verify as primary.

## 1. Plain-language summary

Karpathy spent the first half of 2026 on two big things: a "wiki" habit where an AI agent
builds and maintains a persistent, cross-linked markdown knowledge base instead of
re-reading raw files every time (this went viral — thousands of people built clones), and
a conference talk arguing that AI coding agents are a new way of *programming* (through
context and prompts, not hand-written code) and that the hard part is no longer writing
code but keeping a professional quality bar while going faster. In May he left his
education startup on pause and joined Anthropic's pretraining team. Since July he's been
quieter and more experimental in public: he had Claude's Opus 5 build a 3D Lord-of-the-Rings
world from one paragraph of text and a $10 budget (a stress test of "how far can one agent
go unsupervised"), he publicly agreed with Anthropic CEO Dario Amodei's call to deliberately
slow down frontier capability growth to let safety work catch up, and — his most recent
substantial post, two days ago — he argued that as agents produce more text than any human
can read closely, the real bottleneck is now *verification*, and he recommends asking
models to write in a tightly controlled, aviation-manual-style English (ASD-STE100) so
humans can check their output faster. The two or three ideas that matter most for
nana-pi's work: (1) a compounding, agent-maintained wiki beats re-retrieving from scratch
every time — nana-pi already builds this, which is good external confirmation; (2) the
scarce resource in agent workflows has shifted from generation to human review, which is
exactly the problem nana-pi's review ladder and handoff summaries exist to manage, and
there may be a cheap lever in how that machine-written text is styled; (3) one widely
shared "field notes on agent loops" document attributed to him appears to be **misattributed
— do not cite it as his**.

## 2. The pieces, newest first

### Within the last three months (Jul–Oct 2026)

**ASD-STE100: writing for a world of AI-generated text** — 2026-10-02 —
https://x.com/karpathy/status/2105819303471976479 — **[V]**
Karpathy says "we'll be spending a lot more time trying to understand the outputs of
language models" and that the bottleneck is no longer generating text but a human reading
it closely enough to trust it. His main tip: ask the model to write in (or ~80% of the way
to) ASD-STE100, a 1970s controlled-language spec built for aircraft maintenance manuals
(~900 words, 20-word sentence cap, active voice, one instruction per sentence), because
models already know it well and it produces output he finds "a lot more readable." He
extends the idea to diagrams/images and full HTML pages as further steps up from plain
prose. Quote: *"Ask your LLM to explain something in ASD-STE100, it's a controlled language
specification originally developed for [aircraft maintenance manuals]."*

**Car-wash spatial reasoning quip (Opus 5 vs. Haiku 4.5)** — 2026-09-25 —
quoted via https://x.com/milan_janosov/status/2103457245723791727 (no primary URL located) —
**[S]**
A short, offhand example Karpathy gave of a spatial-reasoning question ("does the car have
to go through a car wash, or can it walk") where Opus 5 and Haiku 4.5 gave different answers
— used by him to illustrate how model scale changes whether spatial/physical context is
inferred correctly from language alone. Minor; not long-form.

**Reply to Dario Amodei's "Pacing the Frontier"** — 2026-09-12 —
https://x.com/karpathy/status/2098811935114551617 — **[V]**
On the day Amodei published his essay calling on the AI industry to deliberately slow
capability gains (citing faster-than-expected recursive self-improvement and an
OpenAI/Hugging Face agent-swarm incident where test agents attacked their own evaluators),
Karpathy replied in support. Quote (full post): *"I love this and really hope we can come
together as an industry and make it happen."* Brief, but notable as an on-record safety
stance from inside Anthropic.

**Opus 5 builds a 3D Lord-of-the-Rings world, unsupervised, from one paragraph** —
2026-08-02 — https://x.com/karpathy/status/2083749667410727319 — **[V]**
Karpathy gave Opus 5 the opening paragraph of *The Lord of the Rings*, a 1M-token budget
(~$10), and asked it to render the scene. The model worked alone for ~2 hours, wrote ~5,500
lines of Three.js from scratch (no stock assets/human 3D models), and produced a navigable
3D world. He frames this as moving past toy benchmarks ("create an svg of a pelican on a
bicycle") toward open-ended, long-horizon, unsupervised generation — and toward "ephemeral
game worlds on demand." He also notes a real limitation: the model can't easily audit its
own output because it can't natively watch video or play the result back. Quote: *"We're
starting to leave the territory where you'd test an LLM by e.g. 'create an svg of pelican on
a bicycle.'"*

**Denies rumors of leaving Anthropic** — 2026-07-26 —
https://x.com/karpathy/status/2081193667529003247 and
https://x.com/karpathy/status/2081195664479068350 — **[V]**
Short exchange ("weird misinformation... no") pushing back on a rumor he'd quit, referencing
an internal "10-paragraph essay" he'd shared with his team rather than a public statement.
Not a public long-form piece; included only because searches repeatedly surfaced it as
recent activity.

### Background (older than 3 months, included because they are his only substantial
2026 long-form writing and frame everything above)

**"I've joined Anthropic"** — 2026-05-19 — https://x.com/karpathy/status/2056753169888334312
— **[V]**
Announced joining Anthropic's pretraining team (under Nick Joseph, per TechCrunch/CNBC
coverage), pausing his education startup Eureka Labs. Quote: *"I think the next few years
at the frontier of LLMs will be especially formative... I remain deeply passionate about
education and plan to resume my work on it in time."*

**"Sequoia Ascent 2026 summary"** — 2026-04-30 — https://karpathy.bearblog.dev/sequoia-ascent-2026/
— **[V] fetched directly, his only 2026 blog post per the bear blog index**
Write-up of his Sequoia Ascent fireside chat. Core argument: traditional software automates
what you can *specify*; LLMs + RL automate what you can *verify*. Software is moving to
"programming through prompting," where the context window is your lever over the LLM as
interpreter — and "agentic engineering" is the discipline of preserving a professional
quality bar while going faster, not lowering the bar for speed. Quotes: *"Traditional
software automates what you can specify. LLMs and reinforcement learning automate what you
can verify."* / *"You can outsource your thinking, but you can't outsource your
understanding."*

**The "LLM Wiki" pattern (+ "Farzapedia" follow-up)** — ~2026-04-02–04 —
follow-up at https://x.com/karpathy/status/2040572272944324650 — **[V]/[S]** (original
post's own URL not located this session; follow-up fetched via search index)
Argued agents should stop re-reading raw docs on every question and instead *compile* a
persistent, cross-linked markdown wiki once, then keep it current ("RAG retrieves, a wiki
compounds" is the community's gloss, not his exact words — flagging as paraphrase). Went
viral (one post: 41K bookmarks; multiple open-source clones hit thousands of stars within
weeks). The Farzapedia follow-up adds that he prefers *explicit* memory artifacts a person
can read and edit over an AI that "allegedly gets better the more you use it" opaquely.

## 3. What this means for nana-pi

All points below are **inference** — Karpathy never mentions nana-pi or this toolkit;
these are judgment calls about fit, not his claims.

- **The LLM Wiki pattern is independent validation of nana-pi's existing wiki-compounding
  design**, not a reason to change anything. `packages/nana-knowledge`'s FTS5 pull over
  curated markdown, and the `wiki-add` → `wiki-absorb` → `wiki-consolidate` pipeline, are
  already doing what Karpathy describes (compile once, keep current, don't re-retrieve raw
  docs every query) and what `nana-soul.md` already states as a posture ("retrieval and
  context injection over parametric knowledge"). His Farzapedia point — prefer an explicit,
  readable memory artifact over an opaque "gets better with use" black box — also matches
  the two-tier SHARED/PROJECT memory design. *Inference: resist any future pressure to
  replace the wiki/compounding approach with heavier RAG machinery; the external signal
  points the other way.*

- **His "verification is now the bottleneck" argument lands directly on nana-pi's review
  ladder and handoff/receipt text**, which exist precisely because a human (Jake) has to
  read and trust machine-produced summaries (HANDOFF.md entries, review ledgers, post-edit
  receipts, REQUIREMENTS rows). His concrete lever — ask models to write in a tightly
  controlled style when the output is for human verification, not for more agents — is
  cheap to try on the artifacts Jake personally reads line-by-line. *Inference: this is a
  styling lever, not an architecture change, and the review ladder's existing deterministic
  caps (3-round limit, req: markers, code map) already do the harder structural half of
  what he's gesturing at.*

- **The Sequoia Ascent framing ("agentic engineering = speed without lowering the quality
  bar") describes nana-pi's requirements-first standard almost exactly**, landed
  2026-10-02 in this repo (507 rows, req: markers, module headers, code map, README
  contract). No action needed — it's corroboration, not news — but worth naming to Jake as
  an outside data point for "is this the right bet," since the standard was built from
  internal pressure (Jake's own rules) rather than from watching the field.

- **One widely-circulated document — "LOOPS.md: Field Notes on Agents That Run for Days,"
  nine rules for unsupervised agent harnesses (split roles, state on disk not in context,
  grade via a separate evaluator)** — reads as directly relevant to nana-pi's gate +
  post-edit + handoff design, but a secondary audit (aibuilderclub.com) found no such file
  in Karpathy's own GitHub repos/gists as of 2026-07-17. **Treat this as unverified /
  likely misattributed — do not cite it as Karpathy's in any nana-pi doc.** (His *actually
  verified* earlier work on autonomous multi-agent research loops — "Claws," Feb–Mar
  2026 — covers similar ground and is in-repo on his own GitHub, but falls outside this
  pass's 3-month window and wasn't deep-dived here.)

### Suggested actions, ranked by value

1. **(Highest value) Pilot a controlled-writing convention for the human-facing,
   machine-written artifacts Jake reads to verify work** — HANDOFF.md entries, review
   ledger summaries, post-edit receipts. *Reason: directly targets the bottleneck Karpathy
   names (human verification of agent-produced text) on exactly the documents nana-pi's
   current priority ("make the experience consistent, coherent and effective") depends on
   being fast to read.*
2. **(Medium value) No build — write one line into `HANDOFF.md` or a wiki article citing
   the LLM Wiki pattern as external validation of the wiki-compounding design**, so the
   decision not to add heavier retrieval machinery has a named outside data point behind
   it next time it's questioned. *Reason: `nana-soul.md`'s memory discipline already says
   "a documented past decision beats a fresh derivation" — this gives that future
   derivation something to point to.*
3. **(Lowest value, cheap) Flag "LOOPS.md" as unverified/misattributed wherever it might
   get cited** (e.g. if a future review or research pass reaches for it as an authority on
   agent-harness design). *Reason: nana-pi's own rule is "look things up; don't guess from
   training data" — this prevents a false attribution from entering a research file as
   fact.*

## 4. Sources

- https://x.com/karpathy/status/2105819303471976479 (ASD-STE100, 2026-10-02)
- https://x.com/aakashgupta/status/2105884986138411482 ,
  https://x.com/AGTPinsights/status/2106009736030327257 (secondary coverage of same)
- https://www.searchenginejournal.com/karpathy-llm-aircraft-manual-writing/591813/
- https://ted-merz.com/2026/10/03/karpathys-advice-on-writing-with-ai/
- https://x.com/milan_janosov/status/2103457245723791727 (2026-09-25, secondary)
- https://x.com/karpathy/status/2098811935114551617 (Amodei reply, 2026-09-12)
- https://rits.shanghai.nyu.edu/ai/amodei-calls-to-pace-the-frontier-altman-and-musk-agree/
  (context on what he was replying to)
- https://x.com/karpathy/status/2083749667410727319 (LOTR/Opus 5, 2026-08-02)
- https://www.developersdigest.tech/blog/karpathy-opus-5-1m-token-lotr-threejs
- https://x.com/karpathy/status/2081193667529003247 ,
  https://x.com/karpathy/status/2081195664479068350 (2026-07-26)
- https://x.com/karpathy/status/2056753169888334312 (joined Anthropic, 2026-05-19)
- https://techcrunch.com/2026/05/19/openai-co-founder-andrej-karpathy-joins-anthropics-pre-training-team/
- https://www.cnbc.com/2026/05/19/anthropic-hires-openai-cofounder-andrej-karpathy-former-tesla-ai-lead.html
- https://karpathy.bearblog.dev/sequoia-ascent-2026/ (2026-04-30, fetched directly)
- https://karpathy.bearblog.dev/blog/ (full post index, fetched directly)
- https://x.com/karpathy/status/2040572272944324650 (Farzapedia follow-up, ~2026-04-04)
- https://x.com/Yuchenj_UW/status/2040482771576197377 ,
  https://x.com/akshay_pachaar/status/2074850500441522457 ,
  https://x.com/himanshutwtxs/status/2079819558093783438 (LLM Wiki, secondary coverage)

## Could not verify

- **"LOOPS.md: Field Notes on Agents That Run for Days"** — widely attributed to Karpathy
  across aggregator sites and daily.dev; a secondary audit (aibuilderclub.com, checked
  2026-07-17) found no such file in his GitHub repos/gists. Treated as **not his** /
  unverified attribution, excluded from "the pieces" above.
- **Primary `x.com` URL for the original "LLM Wiki" post** (~April 2, 2026) — not located;
  only quote-tweets and secondary coverage found.
- **Full thread text** for every [V]-marked post above — `x.com/karpathy` and
  `xcancel.com/karpathy` both refused direct fetch this session (HTTP 402 / 451); quotes
  come from X's own page metadata as surfaced by search, which may be excerpts of longer
  threads.
- **"Claws" / autoresearch (Feb–Mar 2026)** — real and verified in his own GitHub per
  earlier secondary sources (Fortune, a third-party curated wiki), but outside this pass's
  3-month window; not independently re-verified here, flagged for anyone who later wants
  the LOOPS.md-vs-Claws distinction nailed down.

## 5. The outputs-consumption post in full, and alternatives to ASD-STE100 (follow-up 2026-10-04)

Jake's follow-up narrows the brief to the one Oct 2 post (not the broader pass) and asks:
get the full text, try the controlled style on this file itself, and survey alternatives to
ASD-STE100 worth exploring. Method: `x.com` and `xcancel.com` still refuse direct fetch, but
`api.fxtwitter.com/karpathy/status/2105819303471976479` returned the full post as a JSON
mirror — **[V]**, this is the primary text. No separate follow-up post by him in the days
after Oct 2 was found (searched specifically; a Thread Reader App thread under his name is
unrelated — it's dated 2025-10-18, about a Dwarkesh podcast appearance, not this topic). The
post was not split into visible reply-tweets either; it reads as one long X post with
internal section breaks.

### 5.1 Full text of the Oct 2 post — [V], fetched via fxtwitter JSON mirror

> "We'll be spending a lot more time trying to understand the outputs of language models.
> A few thoughts, tips & tricks:
>
> **Writing.** Something I've had success with: Ask your LLM to explain something in
> ASD-STE100, it's a controlled language specification originally developed for aerospace
> maintenance documentation. LLMs [are] well-versed in this language and it comes with
> heavy constraints on clean writing style that I often find a lot more readable. Sometimes
> I've tried to soften it a bit e.g. ask for "80% of the way to ASD-STE100" because the spec
> is quite stringent. But even better:
>
> **Diagrams / images.** Instead of writing, ask your LLM to create a diagram. These can be
> a lot easier to process, parse, and understand. But even better:
>
> **Web pages.** Ask for output "in HTML" to get a beautiful, interactive webpage. LLMs are
> getting really good at frontend and can create beautiful experiences, animations, etc.
> But even better:
>
> **Explainer videos.** The output format I am most bullish on is fully custom / bespoke
> explainer videos generated on any arbitrary topic. Experiment with things like "Create a
> 3b1b style video explainer on X. Use my ElevenLabs API key for audio narration" (you'd
> need an API key for the latter or you can ask your LLM to find you decent free
> alternatives that use your local compute). This is actually starting to work!
>
> In summary:
> - As LLMs get better, they will do more and more of the legwork autonomously, and a lot
>   more of our work will rise up the abstractions into oversight and understanding.
> - Luckily, LLMs can help here too because as intelligence and code are increasingly
>   abundant, you can ask for large, custom, discardable software artifacts (e.g. web apps,
>   video explainers) that would have never made sense to create before. Push the
>   boundaries here and you'll be surprised."

**Every idea he gives, besides ASD-STE100:**
1. **Diagrams / images** — ranked above plain controlled text; "easier to process, parse,
   and understand."
2. **Web pages ("in HTML")** — interactive, can include animation; ranked above diagrams.
3. **Explainer videos** — bespoke, topic-arbitrary (his "3b1b style" reference is to Grant
   Sanderson's 3Blue1Brown math-explainer visual style), narrated via a TTS API (ElevenLabs)
   or local-compute alternative; the format he's "most bullish on."
4. **Meta-point, not a format:** the underlying claim is that work is "ris[ing] up the
   abstractions into oversight and understanding" — i.e., the human's job shifts from
   producing to checking — and that cheap intelligence+code makes it rational to generate
   large, **discardable** artifacts (a one-off webpage or video, thrown away after one
   use) purely to make one checking pass faster.

### 5.2 Alternatives people raised, plus the standards a careful reader would compare

From the replies/quote-tweets surfaced in research (secondary, **[S]**) and independent of
the thread (established prior art, **[S]**/**[U]** per row below):

- **ASD-STE100 facts, triangulated from Wikipedia and a specialist guide** (asd-ste100.org
  itself returned HTTP 403 to direct fetch, so this is **[S]**, not the primary spec site):
  current edition **Issue 9 (January 2025)**; **53 writing rules**; a controlled dictionary
  of **~900 approved words** (one source gives ~2,000 "entries," which reconciles as
  word-plus-approved-meaning pairs rather than a different word count — flagging the
  discrepancy rather than picking a side); max sentence length **20 words for procedural
  text, 25 for descriptive text/notes**; **free since Issue 6 (2013)**, available by
  request from the ASD Simplified Technical English Maintenance Group.
- Replies proposed, among others: **Plain Language** (plainlanguage.gov; now also
  **ISO 24495-1:2023**, "Plain language — Governing principles and guidelines"), **BLUF**
  (bottom-line-up-front, US military writing doctrine), the **Minto Pyramid Principle**
  (Barbara Minto, McKinsey-origin, answer-first hierarchical structuring), **Ogden's Basic
  English** (1930s, 850-word controlled vocabulary), **Simple English Wikipedia** style
  (community convention, not a formal spec), **Attempto Controlled English** (ACE —
  academic controlled-English that compiles unambiguously into first-order logic), **EARS**
  (Easy Approach to Requirements Syntax — Mavin et al., Rolls-Royce, 2009; five sentence
  templates for requirements), **Gherkin** Given/When/Then (Cucumber BDD scenario syntax),
  and **Information Mapping** / **DITA** (structured-writing methods built on typed
  "information blocks"/topics — concept, procedure, process, fact, reference, etc. — rather
  than free prose).

### 5.3 Comparison table

| Standard | What it is | For: writing / structure / requirements | Evidence it speeds reading or checking | How an LLM is told to comply | Can a script check it, and how |
|---|---|---|---|---|---|
| **ASD-STE100** (Simplified Technical English) | Controlled English: 53 rules + ~900-word approved dictionary, built for aircraft maintenance manuals | Writing (sentence/word level) | **[S]** A self-paced reading pilot study (ResearchGate, "Exploring the Comprehension of Simplified Technical Text") found STE-simplified text processed faster on average and scored higher on comprehension than authentic text — small pilot, not large-N | "Write in ASD-STE100" or "80% of the way to ASD-STE100" (Karpathy's own softening) | Partial: sentence-length (≤20/25 words) and banned-word-outside-dictionary checks are cheap regex/wordlist scripts; full rule compliance (one-meaning-per-word, approved verb forms) needs the real dictionary, which is request-only, not bundled |
| **Plain Language** (plainlanguage.gov / ISO 24495-1:2023) | Governing principles (not a word list): reader-outcome-focused — findable, understandable, usable | Writing (principles, not sentence-level rules) | **[S]** A 117-participant self-paced reading study (onlinelibrary.wiley.com) found plain terms **improved comprehension but did not reduce reading time** — real but partial evidence; other studies cited by plainlanguage.gov claim time/cost savings organization-wide | "Write in plain language" / "follow ISO 24495 principles" | Weak: principles aren't a checklist: a script can check surface proxies (sentence length, passive voice, jargon wordlist) but not "is this findable and usable," which needs human judgment |
| **BLUF** (bottom line up front) | US military doctrine: state the conclusion/ask in sentence one, support after | Structure (ordering, not sentences) | **[S]** Cited practitioner evidence (codeless.io, police1.com) that front-loading improves retention given how little of a page gets read; no controlled experiment found | "Put your conclusion or recommendation in the first sentence, then support it" | Yes, cheaply: a script can flag whether sentence 1 contains a verdict keyword (LANDED / BLOCK / DONE / OPEN) — it can't verify the verdict is *correct*, only that it's *first* |
| **Minto Pyramid Principle** | Answer-first, hierarchically grouped supporting arguments (Barbara Minto, ex-McKinsey) | Structure (document/argument level) | **[U]** Widely adopted in consulting; no peer-reviewed effectiveness study found — "established professional practice," not experimentally validated | "Structure this as: governing thought, then grouped supporting arguments, in a pyramid" | No cheap check: pyramid *shape* is semantic (are these really the supporting arguments for that claim?), not a surface pattern a regex can see |
| **Ogden's Basic English** | 1930s, 850-word general-purpose controlled vocabulary | Writing (vocabulary only) | **[U]** Historical pedagogical use (ESL teaching); no modern comprehension-speed study found in this pass | "Use only Basic English's 850 words" | Yes, cheaply: wordlist-membership check per token — but the list predates software/technical vocabulary entirely, so it would reject almost all of nana-pi's own terms |
| **Simple English Wikipedia style** | Community house style for ESL/young readers: short sentences, common words, no formal spec | Writing (informal convention) | **[U]** No controlled study found; it's a style convention, not a researched method | "Write like a Simple English Wikipedia article" | Weak: no canonical rule set to check against, only fuzzy readability-score proxies (Flesch-Kincaid etc.) |
| **Attempto Controlled English (ACE)** | Academic controlled English that compiles unambiguously into first-order-logic discourse representation structures | Requirements (formal semantics, not readability) | **[U]** Built and evaluated for machine unambiguity, not human reading speed — wrong tool for this question | "Write each requirement as a single ACE sentence" (strict grammar, specific function words) | Yes, exactly: ACE's whole point is a parser either accepts or rejects a sentence — but adopting it means learning its grammar, a much bigger lift than the others |
| **EARS** (Easy Approach to Requirements Syntax) | Five fixed sentence templates for requirements (ubiquitous / event-driven / unwanted-behaviour / state-driven / optional-feature), Mavin et al., Rolls-Royce, RE'09 | **Requirements** specifically | **[S]** Industry adoption evidence (Airbus, Bosch, Intel, NASA, Siemens per Wikipedia/INCOSE) and claims of reduced ambiguity/errors; no independently-cited controlled defect-rate study found in this pass | "Write each requirement as: While `<precondition>`, When `<trigger>`, the `<system>` shall `<response>`" (template fill-in) | **Yes, cheaply and well**: a regex can check a row opens with one of the five keyword patterns and contains exactly one "shall" — this is the best-scripted fit of the whole table |
| **Gherkin** (Given/When/Then) | Cucumber BDD scenario syntax: structured natural language that also executes as a test | Requirements / test specification (behavioural, not declarative) | **[U]** Practitioner adoption evidence only; no reading-speed study found — and it's designed to be *executed*, not just read | "Write this as a Given/When/Then scenario" | Yes, trivially (it's already a parser-constrained grammar) — but it answers "does the system behave this way," a different question than nana-pi's req: rows, which pin *what a test checks*, not a behaviour script |
| **Information Mapping / DITA** | Typed "information blocks"/topics (concept, procedure, process, fact, reference...) instead of free prose; DITA is the XML-schema version used in tech docs | Structure (document/topic level) | **[S]** A cited comprehension study (academia.edu, "Testing an Information Mapping text") found **no comprehension gain but greater efficiency and higher reader appreciation** versus unaltered conventional text — a real but modest, mixed result | "Write this as a `<task>` topic with numbered steps" / "classify this block as concept, procedure, or fact, then write only that type's required fields" | Yes, structurally: DITA topics validate against an XML schema (right fields present, right type used) — doesn't check sentence-level style at all |
| **Diagrams / structured HTML / tables** (Karpathy's own escalation past ASD-STE100) | Not prose at all — visual/structural formats | Writing (non-prose alternative) | **[S]** Karpathy's own claim ("easier to process, parse, and understand") is asserted, not cited to a study in his post; general HCI literature on tables/diagrams vs. prose for structured data is extensive but wasn't re-surveyed in this pass | "Output this as a diagram" / "output this as an HTML table" | Yes, structurally: a script can check a table has the right columns, or an SVG/HTML diagram is well-formed — but can't check whether the *content* is right |

### 5.4 Recommended trial

**The standards are not exclusive — combining them is the real answer, not a tradeoff.**
BLUF or Minto decide *order* (verdict first). ASD-STE100 (80% mode) decides *sentences*
(short, active, one claim each). EARS decides *requirement-row shape*. None of the three
competes with the others; they answer different questions (order / sentence style / row
template), so applying all three where each fits is cheaper than picking one "winner."

- **Trial A — seat reports, decision points, and `HANDOFF.md` lines:** BLUF (verdict or
  status word in sentence one) + ASD-STE100 80% (≤20-word sentences, active voice, one
  claim per sentence) for everything after it. **Cheapest mechanical checker:** a small
  script flagging (a) sentences over 20/25 words, (b) a passive-voice regex
  (`\b(is|are|was|were|been|being)\b\s+\w+ed\b`), (c) whether line 1 contains a verdict
  keyword (LANDED/BLOCK/DONE/OPEN/CARRIED). This matches Jake's rule — LLMs judge content,
  scripts verify form — and needs no dictionary.
- **Trial B — new `REQUIREMENTS.md` rows going forward:** EARS templates. **Checker:** a
  regex confirming each row opens with one of the five EARS keywords (While/When/If/Where/
  Where-optional) and contains exactly one "shall." This is the best-scripted fit found —
  better than STE for this specific surface, because requirement *ambiguity* (EARS's target)
  matters more there than reading speed.
- **Not recommended for a trial:** ACE (too large a grammar to adopt for the win size),
  Gherkin (wrong question — behavioural, not declarative), Ogden's Basic English (vocabulary
  too dated for this domain), Information Mapping/DITA (real but modest gains, and a bigger
  structural lift than nana-pi's existing REQUIREMENTS/code-map scaffolding needs right now).

