/**
 * @module packages/nana-pack/lib/profile-config.mjs
 * @purpose Declare the private profile's sealed storage, trust and command policy.
 * @inputs none
 * @outputs Named sealed values with chosen provenance.
 * @effects none
 * @errors none
 */
import { SOURCE_WORDS, USER_KIND_WORDS, ROLES, STARTING_STATE } from './memory-making-config.mjs';
// Chosen 2026-10-31 (R-3237): three independent statements before medium trust.
export const PROFILE_MEDIUM_SESSIONS = 3;
// Chosen 2026-10-31 (R-3238): below the shared-memory hook budget; room for other context.
export const PROFILE_SHOW_BUDGET = 4000;
// Chosen 2026-10-31 (R-3239): bound each local or network child on both machines.
export const PROFILE_GIT_TIMEOUT_MS = 15000;
// Chosen 2026-10-31 (R-3240): wait for a short save, not a stalled network.
export const PROFILE_LOCK_WAIT_MS = 5000;
// Chosen 2026-10-31 (R-3241): longer than any expected locked sequence; never evict a live pid.
export const PROFILE_LOCK_STALE_MS = 120000;
// Contract plan A13 (R-3242): retry once after a non-fast-forward rejection.
export const PROFILE_PUSH_RETRIES = 1;
// Chosen 2026-10-31 (R-3243): bound accidental loops and preserve readable owner statements.
export const PROFILE_LIMITS = Object.freeze({ daily:40, claim:1200, quote:4000 });
// Chosen 2026-10-31 (R-3244): PI_SESSION_ID and PI_SESSION_FILE observed in this pi builder's
// shell; CLAUDE_SESSION_ID absent. Seat-shell availability is inferred, not verified here.
// Neither host promises these variables across versions; local-day fallback errs low.
export const PROFILE_SESSION_VARIABLES = Object.freeze(['CLAUDE_SESSION_ID','PI_SESSION_ID','PI_SESSION_FILE']);
// Chosen 2026-10-31 (R-3245): lowercase the canonical colon-free suiteRecordStamp.
export const PROFILE_STAMP_FORMAT = 'toLowerCase';
// Chosen 2026-10-31 (R-3246): avoid Windows reserved characters, leave path headroom,
// bound child output at 1 MiB and use 96 random bits per exclusive-create name.
export const PROFILE_PATH_POLICY = Object.freeze({pattern:'^[a-z0-9._/-]+$',max:180,outputBytes:1048576,randomBytes:12});
// Chosen 2026-10-31 (R-3247): no SSH aliases; explicit GitHub hosts only.
export const PROFILE_REMOTE_FORMS = Object.freeze([
 '^https://github\\.com/([^/]+/[^/]+?)(?:\\.git)?$',
 '^git@github\\.com:([^/]+/[^/]+?)(?:\\.git)?$',
 '^ssh://git@(?:github\\.com|ssh\\.github\\.com:443)/([^/]+/[^/]+?)(?:\\.git)?$'
]);
// Chosen 2026-10-31 (R-3248): independent append-only records/events and git-local controls.
export const PROFILE_LAYOUT = Object.freeze({records:'records',events:'events',marker:'.nana-profile',lock:'nana-profile.lock',counter:'nana-profile-day.json',attributes:'* -text\n',readme:'Private owner profile. Records are append-only JSON; use nana-profile, never edit records by hand.\n'});
// Chosen 2026-10-31 (R-3249): fixed diagnostics reveal no transport or home path.
// Shared shape words belong to memory-making; only this lane's choices and diagnostics live here.
export const PROFILE_WORDS = Object.freeze({
 initialized:'profile: initialized',synced:'profile: synced',saved:'Saved: ',notPushed:'not pushed: ',unverified:'profile: unverified remote',recovered:'profile: aborted stopped rebase',fold:'[nana:owner-profile] records left out: ',conflict:'[nana:owner-profile] competing superseders: ',
 quote:'profile refused: --quote is required',decision:'profile refused: decision belongs in nana-rulings.md',openThread:'profile refused: open-thread belongs in GitHub issues',kind:'profile refused: unsupported kind',claimCap:'profile refused: claim exceeds cap',quoteCap:'profile refused: quote exceeds cap',dailyCap:'profile refused: daily save cap',role:'profile refused: NANA_ROLE is set',worktree:'profile refused: linked worktree',disabled:'profile refused: saving is not enabled on this machine',pointer:'profile refused: run init --dir <clone>',private:'profile refused: push target is not verified private; use --unverified-remote explicitly',checkout:'profile refused: nana-pi checkout or push target',marker:'profile refused: missing store marker',repeatedQuote:'profile refused: confirmation needs new owner words',unknown:'profile refused: unknown record',locked:'profile refused: locked',dirty:'profile refused: clone has changes outside the store',git:'profile refused: git failed',config:'profile refused: invalid user configuration',usage:'profile refused: invalid command or flags',
 gitCommandEnv:'NANA_PROFILE_GIT_COMMAND',source:SOURCE_WORDS[1],type:'user',roles:ROLES.user,trust:Object.freeze([STARTING_STATE.trust,'medium','high']),kinds:USER_KIND_WORDS,reasons:Object.freeze(['offline','auth','rejected','mismatch','locked']),evidencePrefix:'seat',runtimePi:'pi',runtimeClaude:'claude-code'
});
