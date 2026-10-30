/**
 * @module apps/hive/roads.mjs
 * @purpose Selects visible roads and describes their recorded units.
 * @inputs Published roads and an optional selected structure ID.
 * @outputs Overview plus incident roads and source captions.
 * @effects none
 * @errors None.
 */
import { NAVIGATION } from './config.mjs';
export function visibleRoads(roads, selected = null) { return roads.filter(r => NAVIGATION.overviewClasses.includes(r.class) || (selected && [r.from, r.to].includes(selected))); }
export function roadCaption(road) { const units = { import: 'import links', artifact: 'artifacts', join: 'deliverable rows', feature: 'shared features', loop: 'loop step', spur: 'chapter tie' }; return road.sources.map(s => `${s.count} ${units[s.source]}${s.declared ? ', declared' : ''}`).join(' · '); }
