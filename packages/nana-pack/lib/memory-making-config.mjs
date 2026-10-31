/**
 * @module packages/nana-pack/lib/memory-making-config.mjs
 * @purpose Define the shared candidate shape and sealed deterministic memory-making baseline.
 * @inputs none
 * @outputs Candidate shape, vocabularies, patterns, caps, claim forms and private-output words.
 * @effects none
 * @errors none
 */
// Chosen 2026-10-31, plan O1 (R-3196): generic English, frozen before labelling.
export const CORRECTION_CUES = /(?:^\s*no\b|\bi thought\b|\bagain\b|\bwhy did you\b|\bdon['’]t\b|\bstop\b|\?{2,})/iu;
// Chosen 2026-10-31, plan A7 (R-3197): last question sentence or YOUR CALL block.
export const QUESTION_PATTERN = /(?:[^.!?\n]+\?|YOUR CALL\b[^\n]*(?:\n(?!\s*\n)[^\n]*)*)/giu;
// Chosen 2026-10-31, plan O2: short replies, substantial correction context (R-3198, R-3199).
export const SHORT_ANSWER_WORD_CAP = 40;
export const CONTEXT_MIN_WORDS = 20;
// Chosen 2026-10-31 (R-3200): readable private snapshots without unbounded output text.
export const CLAIM_CAP = 1200;
// Contract: plan must-meets 1 and 3 (R-3201, R-3202), context never a bare answer.
export const CORRECTION_FORM = "<quote> — correcting: <context>";
export const DECISION_FORM = "<quote> — answering: <context>";
// Chosen 2026-10-31, plan A4 (R-3203): first guess, not delivery policy.
export const ROLES = Object.freeze({ user: Object.freeze(["seat"]), worker: Object.freeze(["planner", "builder", "reviewer"]) });
// Contract: plan A3 (R-3204); no promotion in the making station. trust and invalidAt are write-time values; readers derive effective state later.
export const STARTING_STATE = Object.freeze({ trust: "low", source: "extracted" });
// The owner-profile store may also write saved; this station pins only extracted.
export const SOURCE_WORDS = Object.freeze(["extracted", "saved"]);
// Shared vocabulary; this station currently emits only correction and decision for user candidates.
export const USER_KIND_WORDS = Object.freeze(["correction", "decision", "preference", "fact", "thinking"]);
// Chosen 2026-10-31, plan A6 (R-3205): older runtimes lack origin metadata.
export const WRAPPER_TAGS = Object.freeze(["<command", "<local-command", "<system-reminder", "<task-notification", "[Request interrupted"]);
// Contract: plan A12 (R-3206); plans, build notes and reports are not reviewer outputs.
export const REVIEW_EXCLUDE = /(?:^plan|[-]plan[-]|^sol-plan-|^must-meet|brief|report|^factcheck-|^tree-movement\.md$|^CHANGE\.md$|build[-_]?(?:notes?|[0-9]))/iu;
// Chosen 2026-10-31, plan O5 (R-3208): one JSONL file per hand run.
export const CANDIDATES_FILE = "candidates.jsonl";
// Contract: plan A14 (R-3209): fixed refusal, no private content in diagnostics.
export const PRIVATE_REFUSAL = "memory: output must be outside git checkouts";
// Contract: station 2 candidate shape, plan A2 (R-3250). Owner-profile imports this plain list.
// Seat-saved evidence is seat:<runtime>:<session key>:<date> and resolves to that record's quote.
// trust and invalidAt record write-time values; effective state is derived by a later reader.
export const CANDIDATE_FIELDS = ["id", "type", "kind", "claim", "quote", "context", "evidence", "date", "trust", "source", "roles", "validFrom", "invalidAt", "supersedes"];
