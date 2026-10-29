#!/usr/bin/env node
/**
 * @module scripts/component-contract.mjs
 * @purpose Validate component documents against the frozen nana-components v1 contract.
 * @inputs A data document and its frozen contract object.
 * @outputs Named problem strings, empty for valid data.
 * @effects none
 * @errors Invalid input is returned as problem strings.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const exactKeys = (value, fields) => object(value) && Object.keys(value).sort().join("\0") === [...fields].sort().join("\0");
const text = (value) => typeof value === "string" && value.trim().length > 0;
const repoPath = (value) => text(value) && !value.startsWith("/") && !value.includes("\\") && !value.split("/").includes("..") && !value.includes("//");

export function readComponentContract(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

export function checkComponentData(data, contract) {
  const problems = [];
  const add = (where, field, detail) => problems.push(`${where}: ${field} ${detail}`);
  if (!object(contract)) return ["contract: must be an object"];
  if (!object(data)) return ["document: must be an object"];
  for (const field of contract.documentFields) if (!Object.hasOwn(data, field)) add("document", field, "is required");
  for (const field of Object.keys(data)) if (!contract.documentFields.includes(field)) add("document", field, "is not in documentFields");
  if (data.contract !== contract.contract) add("document", "contract", `must equal ${contract.contract}`);
  if (data.version !== contract.version) add("document", "version", `must equal ${contract.version}`);
  if (!text(data.project)) add("document", "project", "must be a non-empty string");
  if (!Array.isArray(data.components) || data.components.length === 0) return [...problems, "document: components must be a non-empty array"];
  const seen = new Set();
  for (const [index, component] of data.components.entries()) {
    const at = `components[${index}]${component?.id ? ` (${component.id})` : ""}`;
    if (!exactKeys(component, contract.componentFields)) { add(at, "keys", "must exactly match componentFields"); continue; }
    if (typeof component.id !== "string" || !/^[a-z][a-z0-9-]*$/.test(component.id)) add(at, "id", "must match ^[a-z][a-z0-9-]*$");
    else if (seen.has(component.id)) add(at, "id", "must be unique");
    seen.add(component.id);
    for (const field of ["name", "metaphor"]) if (!text(component[field])) add(at, field, "must be a non-empty string");
    if (!contract.kinds.includes(component.kind)) add(at, "kind", "is not in contract kinds");
    if (!contract.statuses.includes(component.status)) add(at, "status", "is not in contract statuses");
    if (!Array.isArray(component.parts)) add(at, "parts", "must be an array");
    else {
      component.parts.forEach((part) => { if (!repoPath(part)) add(at, "parts", `contains invalid repo-relative path ${JSON.stringify(part)}`); });
      if ((component.parts.length === 0) !== (component.status === "absent")) add(at, "parts", "must be empty exactly for absent status");
    }
    if (!Array.isArray(component.features)) add(at, "features", "must be an array");
    else for (const [featureIndex, feature] of component.features.entries()) {
      const f = `${at}.features[${featureIndex}]`;
      if (!exactKeys(feature, contract.featureFields)) { add(f, "keys", "must exactly match featureFields"); continue; }
      if (typeof feature.id !== "string" || !/^FEAT-\d{3}$/.test(feature.id)) add(f, "id", "must be FEAT-nnn");
      if (!text(feature.label)) add(f, "label", "must be a non-empty string");
      if (!Number.isInteger(feature.rows) || feature.rows < 0) add(f, "rows", "must be an integer of at least 0");
      if (!Number.isInteger(feature.implemented) || feature.implemented < 0 || feature.implemented > feature.rows) add(f, "implemented", "must be an integer from 0 to rows");
    }
    if (component.status === "sound" ? component.gap !== null : !text(component.gap)) add(at, "gap", "must be null exactly for sound status, otherwise non-empty");
    if (component.ask !== null) {
      if (!exactKeys(component.ask, contract.askFields)) add(at, "ask", "keys must exactly match askFields");
      else for (const field of contract.askFields) if (!text(component.ask[field])) add(at, `ask.${field}`, "must be a non-empty string");
    }
    if (component.status === "sound" && component.ask !== null) add(at, "ask", "must be null for sound status");
    if (!Array.isArray(component.evidence) || component.evidence.length === 0) add(at, "evidence", "must be a non-empty array");
    else component.evidence.forEach((item) => { if (!(repoPath(item) || /^(?:R-\d{3,4}|G-\d{3}|FEAT-\d{3}|CAP-\d{2})$/.test(item))) add(at, "evidence", `contains invalid path or ID ${JSON.stringify(item)}`); });
    if (!exactKeys(component.activity, contract.activityFields)) add(at, "activity", "keys must exactly match activityFields");
    else for (const field of contract.activityFields) if (!Number.isInteger(component.activity[field]) || component.activity[field] < 0) add(at, `activity.${field}`, "must be an integer of at least 0");
  }
  return problems;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const data = JSON.parse(readFileSync(process.argv[2], "utf8"));
  const contract = readComponentContract(process.argv[3]);
  const problems = checkComponentData(data, contract);
  for (const line of problems) console.log(line);
  process.exitCode = problems.length ? 1 : 0;
}
