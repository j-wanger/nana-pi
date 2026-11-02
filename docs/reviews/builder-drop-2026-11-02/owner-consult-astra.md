DONE. I endorse all three defaults, with the conditions below. These choices serve the builder-context drop tests.

### 1. First paid round
- **Pick:** Pilot: 10 lanes × 2 controls, about $33. Then conditionally run 10 lanes × 3 arms × 3 repeats, reviewing one repeat per lane and arm. Target $205 total within $400.
- **Why:** Prove replay fitness before buying treatment evidence.
- **Change my mind:** Failed pilot, insufficient power, or measured costs that prevent completing the design within budget.

Register an explicit power threshold before the pilot: **80% for both planned decisions**, using the actual corrected verdict rule. Reserve headroom for one-turn overshoot; otherwise $400 is not a hard total cap.

### 2. Tool-list removal
- **Pick:** Remove the recorded skills listing, `tools` section, and `docs` section. Retain schemas and tool references in briefs and AGENTS.md.
- **Why:** The structural cut is reproducible; tool labels are unreliable.
- **Change my mind:** Evidence of unrelated instructions inside those sections, or clarification that the intended question concerns every tool reference.

Describe this as removing three listings, not removing tool access. A joint result cannot identify which listing mattered.

### 3. Builder model
- **Pick:** Pin `openai-codex gpt-6.1-sol`, thinking **medium**, throughout the study.
- **Why:** Test the builder whose context we intend to redesign, rather than the cheapest historical model.
- **Change my mind:** A production-model change before registration, model unavailability, or pilot costs that make an adequately powered study unaffordable.

Never switch models within this study; stop and register a separate study instead.

No files changed.
