/**
 * @module packages/nana-pack/lib/memory-run-config.mjs
 * @purpose Retain the existing project-record layout and stale-index bound for profile compatibility.
 * @inputs Profile git timeout.
 * @outputs Immutable storage layout, folder length and derived index-lock age.
 * @effects none
 * @errors none
 */
import { PROFILE_GIT_TIMEOUT_MS } from './profile-config.mjs';
// Preserved 2026-11-09: profile sync still recovers stopped writers.
export const STALE_INDEX_LOCK_MS=2*PROFILE_GIT_TIMEOUT_MS;
// Preserved 2026-11-09: existing project records retain their original paths.
export const FOLDER_ID_LENGTH=16;
export const STORE_LAYOUT=Object.freeze({projects:'projects',records:'records',events:'events'});
