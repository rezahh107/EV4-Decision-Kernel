#!/usr/bin/env node
import { readFileSync } from 'node:fs';

export const CURRENT_WORK_PACKAGE_FIELD = 'current_work_package_id';
export const WORK_PACKAGE_ID_PATTERN = /^[A-Z0-9][A-Z0-9._-]*$/;

export function parseCurrentWorkPackageId(text) {
  if (typeof text !== 'string') return null;
  const matches = [...text.matchAll(/^current_work_package_id:\s*([A-Z0-9][A-Z0-9._-]*)\s*$/gm)];
  if (matches.length !== 1) return null;
  return WORK_PACKAGE_ID_PATTERN.test(matches[0][1]) ? matches[0][1] : null;
}

export function currentWorkPackageFromRoadmap(path = 'planning/NEXT_WORK.md') {
  try {
    return parseCurrentWorkPackageId(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

export function impactWorkPackageToken(workPackageId) {
  return typeof workPackageId === 'string' && WORK_PACKAGE_ID_PATTERN.test(workPackageId)
    ? workPackageId.toLowerCase()
    : null;
}

export function impactIdentityCodes(impact, currentWorkPackage, sensitivePaths) {
  const codes = [];
  if (!impact || impact.work_package_id !== currentWorkPackage) {
    codes.push('COV_IMPACT_WORK_PACKAGE_MISMATCH');
  }
  const token = impactWorkPackageToken(impact?.work_package_id);
  if (!token || typeof impact?.impact_id !== 'string'
    || !impact.impact_id.includes(`.${token}.`)) {
    codes.push('COV_IMPACT_ID_MISMATCH');
  }
  const actual = [...new Set(impact?.changed_paths || [])].sort();
  const expected = [...new Set(sensitivePaths || [])].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)
    || (impact?.changed_paths || []).length !== expected.length) {
    codes.push('COV_IMPACT_CHANGED_PATHS_MISMATCH');
  }
  return [...new Set(codes)];
}

function replaceExactlyOnce(source, needle, replacement, label) {
  const first = source.indexOf(needle);
  if (first < 0 || source.indexOf(needle, first + needle.length) >= 0) {
    throw new Error(`COV_LEGACY_ADAPTER_SOURCE_MISMATCH:${label}`);
  }
  return source.replace(needle, replacement);
}

export function adaptLegacyValidatorSource(source) {
  let adapted = source;
  adapted = replaceExactlyOnce(
    adapted,
`function currentWorkPackageFromRoadmap() {
  const match = readText('planning/NEXT_WORK.md')
    .match(/Current PR[\\s\\S]*?DCOV-EXEC-[0-9]{3}/);
  return match?.[0].match(/DCOV-EXEC-[0-9]{3}/)?.[0] || null;
}`,
`function currentWorkPackageFromRoadmap() {
  const nextWork = readText('planning/NEXT_WORK.md');
  const matches = [...nextWork.matchAll(/^current_work_package_id:\\s*([A-Z0-9][A-Z0-9._-]*)\\s*$/gm)];
  return matches.length === 1 ? matches[0][1] : null;
}`,
    'current_work_package_parser',
  );
  adapted = replaceExactlyOnce(
    adapted,
`const validZeroDelta = impact.work_type === 'blocking_defect'
        && impact.blocking_defect
        && typeof impact.next_content_expansion_package === 'string'
        && impact.next_content_expansion_package.length > 0;
      if (!validZeroDelta) {
        diagnostics.push(diagnostic('COV_ZERO_DELTA_NOT_BLOCKING_DEFECT', 'Zero-delta coverage-sensitive work is limited to a blocking defect with a named next content package.', impact.impact_id));
      }`,
`const validBlockingDefect = impact.work_type === 'blocking_defect'
        && impact.blocking_defect
        && typeof impact.next_content_expansion_package === 'string'
        && impact.next_content_expansion_package.length > 0;
      const validNonCoverageMaintenance = impact.work_type === 'maintenance'
        && impact.coverage_sensitive === false
        && impact.impact_classification === 'not_applicable'
        && impact.coverage_state_before === impact.coverage_state_after
        && impact.element_coverage_delta === null
        && impact.question_coverage_delta === null
        && (impact.completed_obligation_ids || []).length === 0
        && (impact.closed_family_ids || []).length === 0
        && impact.blocking_defect === null
        && typeof impact.next_content_expansion_package === 'string'
        && impact.next_content_expansion_package.length > 0;
      if (!validBlockingDefect && !validNonCoverageMaintenance) {
        diagnostics.push(diagnostic('COV_ZERO_DELTA_NOT_ALLOWED', 'Zero-delta work requires either a bounded blocking defect or non-Coverage maintenance that preserves state and grants no credit.', impact.impact_id));
      }`,
    'zero_delta_policy',
  );
  adapted = replaceExactlyOnce(
    adapted,
    'merge_gate_requirements: Object.keys(contract.merge_gate),',
    'merge_gate: contract.merge_gate,',
    'normative_merge_gate_projection',
  );
  return adapted;
}
