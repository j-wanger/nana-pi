/**
 * @module packages/nana-pack/lib/memory-run-config.mjs
 * @purpose Seal automatic making policy independently of the scored classifier.
 * @inputs Shared profile and classifier bounds.
 * @outputs Named caps, layouts, fixed words and lane-folder pattern.
 * @effects none
 * @errors none
 */
import { CLAIM_CAP, CANDIDATE_FIELDS } from './memory-making-config.mjs';
import { TIMEOUT_MS } from './memory-shaping-config.mjs';
import { PROFILE_GIT_TIMEOUT_MS } from './profile-config.mjs';
// Contract, frozen snapshot end, plan revision 2 (R-3298).
export const START_INSTANT='2026-10-31T18:16:00Z';
// Chosen 2026-11-01, bounded automatic sweep rather than history backfill (R-3299 to R-3302).
export const RUN_TOKEN_CAP=200000;
export const RUN_CALL_CAP=20;
export const DAY_TOKEN_CAP=1000000;
export const UNKNOWN_USAGE_CHARGE=100000;
// Derived, one batch of headroom for local completion (R-3303, R-3304).
export const MAX_RUN_MS=(RUN_CALL_CAP+1)*TIMEOUT_MS;
export const STALE_INDEX_LOCK_MS=2*PROFILE_GIT_TIMEOUT_MS;
// Contract, shared readable evidence cap (R-3305).
export const EVIDENCE_CAP=CLAIM_CAP;
// Contract, matches profile day counter (R-3306).
export const DAY_BOUNDARY='UTC';
// Chosen 2026-11-01, leaves safe-path headroom for SHA-256 roots (R-3307).
export const FOLDER_ID_LENGTH=16;
// Chosen 2026-11-01, immutable store and git-local controls (R-3308).
export const STORE_LAYOUT=Object.freeze({projects:'projects',repository:'repository.json',records:'records',events:'events',seen:'seen',units:'units',runs:'runs'});
export const RUN_LAYOUT=Object.freeze({runLock:'nana-memory-<id>.lock',dayLedger:'nana-memory-day.json',dayLock:'nana-memory-day.lock',lastRun:'nana-memory-<id>-last.json',sources:'nana-memory-sources'});
// Contract, shared fields unchanged, local project defaults (R-3309).
export const STORE_FIELDS=Object.freeze([...CANDIDATE_FIELDS,'subject','scope','repository']);
// Chosen 2026-11-01, per-machine explicit opt-in (R-3340).
export const OPT_IN_MEMBER='memoryRepositories';
// Chosen 2026-11-01, counts-only public vocabulary (R-3341).
export const WORDS=Object.freeze({enabled:'memory: enabled',disabled:'memory: not enabled',shallow:'memory: shallow',unavailable:'memory: unavailable',ci:'memory: ci',role:'memory: role',busy:'memory: busy',failed:'memory: failed',cap:'memory: capped',complete:'memory: complete',malformed:'memory: unclassified',pointer:'memory: profile unavailable',collision:'memory: repository collision',invalid:'memory: invalid command',notStarted:'memory: not started',started:'memory: started',status:'memory: status',never:'never',unknown:'unknown',pending:'pending',done:'done',skipped:'skipped',unclassified:'unclassified',project:'project',scope:'local'});
// Contract, anchored lane name followed by an ISO day (R-3342).
export const LANE_FOLDER_SUFFIX='-\\d{4}-\\d{2}-\\d{2}$';
export const laneFolderPattern=lane=>new RegExp('^'+lane.replace(/[.*+?^${}()|[\]\\]/gu,'\\$&')+LANE_FOLDER_SUFFIX,'u');
