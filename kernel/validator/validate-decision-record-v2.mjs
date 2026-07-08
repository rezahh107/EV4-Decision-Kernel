#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const schemaPath = 'kernel/schemas/decision-record.v2.schema.json';

const fixturePlan = [
  {
    path: 'valid/decision_record_v2_svg_conditional_valid.json',
    shouldFail: false,
    expectedCodes: []
  },
  {
    path: 'invalid/decision_record_v2_missing_required_fields_invalid.json',
    shouldFail: true,
    expectedCodes: [
      'SCHEMA_REQUIRED_RESOLVER_STATUS',
      'SCHEMA_REQUIRED_RULE_VERSION',
      'SCHEMA_REQUIRED_PROVISIONAL_STATUS'
    ]
  }
];

function readJson(pathFromRoot) {
  return JSON.parse(readFileSync(join(repoRoot, pathFromRoot), 'utf8'));
}

function diagnostic({ rule_id, code, message, source, path }) {
  return {
    rule_id,
    code,
    message,
    source,
    ...(path ? { path } : {})
  };
}

function pushWhen(diagnostics, condition, detail) {
  if (condition) diagnostics.push(diagnostic(detail));
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasItems(value) {
  return Array.isArray(value) && value.length > 0;
}

function pathFromAjvError(error) {
  const basePath = error.instancePath
    ? error.instancePath.slice(1).replaceAll('/', '.')
    : '(root)';
  if (error.keyword === 'required' && error.params?.missingProperty) {
    return basePath === '(root)' ? error.params.missingProperty : `${basePath}.${error.params.missingProperty}`;
  }
  if (error.keyword === 'additionalProperties' && error.params?.additionalProperty) {
    return basePath === '(root)' ? error.params.additionalProperty : `${basePath}.${error.params.additionalProperty}`;
  }
  return basePath;
}

function codeFromAjvError(error) {
  if (error.keyword === 'required' && error.params?.missingProperty) {
    return `SCHEMA_REQUIRED_${String(error.params.missingProperty).toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
  }
  if (error.keyword === 'additionalProperties' && error.params?.additionalProperty) {
    return `SCHEMA_ADDITIONAL_PROPERTY_${String(error.params.additionalProperty).toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
  }
  return `SCHEMA_${String(error.keyword || 'CONFORMANCE').toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
}

function schemaDiagnostics(record, validate) {
  const valid = validate(record);
  if (valid) return [];
  return (validate.errors || []).map((error) => diagnostic({
    rule_id: 'DECISION_RECORD_V2_SCHEMA',
    code: codeFromAjvError(error),
    message: `decision_record_v2: ${error.message}`,
    source: 'schema',
    path: pathFromAjvError(error)
  }));
}

function validateDecisionRecordV2(record) {
  const diagnostics = [];
  if (!isObject(record)) {
    return [diagnostic({
      rule_id: 'DECISION_RECORD_V2_SEMANTIC',
      code: 'DECISION_RECORD_V2_OBJECT_REQUIRED',
      message: 'decision_record_v2 fixture must be an object',
      source: 'semantic',
      path: '(root)'
    })];
  }

  const selectedOptionId = record.selected_option?.option_id;
  const allowedOptionIds = Array.isArray(record.allowed_options)
    ? record.allowed_options.map((option) => option?.option_id)
    : [];

  pushWhen(
    diagnostics,
    record.resolver_status !== 'unresolvable' && Boolean(selectedOptionId) && !allowedOptionIds.includes(selectedOptionId),
    {
      rule_id: 'DECISION_RECORD_V2_OPTION_BOUNDARY',
      code: 'SELECTED_OPTION_MUST_BE_ALLOWED',
      message: 'selected_option.option_id must be present in allowed_options unless resolver_status is unresolvable',
      source: 'semantic',
      path: 'selected_option.option_id'
    }
  );

  pushWhen(
    diagnostics,
    Number.isInteger(record.reopen_count) && Number.isInteger(record.max_reopen_count) && record.reopen_count > record.max_reopen_count,
    {
      rule_id: 'DECISION_RECORD_V2_REOPEN_LINEAGE',
      code: 'REOPEN_COUNT_EXCEEDS_MAX',
      message: 'reopen_count must not exceed max_reopen_count',
      source: 'semantic',
      path: 'reopen_count'
    }
  );

  pushWhen(
    diagnostics,
    Number.isInteger(record.reopen_count) && record.reopen_count > 0 && !record.previous_decision_ref,
    {
      rule_id: 'DECISION_RECORD_V2_REOPEN_LINEAGE',
      code: 'PREVIOUS_DECISION_REF_REQUIRED_FOR_REOPEN',
      message: 'reopened decisions must reference the previous decision',
      source: 'semantic',
      path: 'previous_decision_ref'
    }
  );

  if (record.evidence_tier === 'official_docs') {
    const requiredBoundaryGuards = [
      'official_docs_do_not_prove_project_availability',
      'official_docs_do_not_prove_runtime_behavior'
    ];
    const overclaims = Array.isArray(record.forbidden_overclaims) ? record.forbidden_overclaims : [];
    const missing = requiredBoundaryGuards.filter((guard) => !overclaims.includes(guard));
    pushWhen(diagnostics, missing.length > 0, {
      rule_id: 'DECISION_RECORD_V2_EVIDENCE_BOUNDARY',
      code: 'OFFICIAL_DOCS_BOUNDARY_OVERCLAIM_GUARDS_REQUIRED',
      message: `official_docs evidence requires explicit overclaim guards: ${missing.join(', ')}`,
      source: 'semantic',
      path: 'forbidden_overclaims'
    });
  }

  if (record.evidence_tier === 'runtime_browser') {
    pushWhen(
      diagnostics,
      !hasItems(record.evidence_refs) || !record.evidence_refs.some((item) => item?.evidence_tier === 'runtime_browser'),
      {
        rule_id: 'DECISION_RECORD_V2_EVIDENCE_BOUNDARY',
        code: 'RUNTIME_TIER_REQUIRES_RUNTIME_EVIDENCE_REF',
        message: 'runtime_browser evidence_tier requires at least one runtime_browser evidence ref',
        source: 'semantic',
        path: 'evidence_refs'
      }
    );
  }

  if (record.evidence_tier === 'project_export') {
    pushWhen(
      diagnostics,
      !hasItems(record.evidence_refs) || !record.evidence_refs.some((item) => item?.evidence_tier === 'project_export'),
      {
        rule_id: 'DECISION_RECORD_V2_EVIDENCE_BOUNDARY',
        code: 'PROJECT_EXPORT_TIER_REQUIRES_PROJECT_EXPORT_EVIDENCE_REF',
        message: 'project_export evidence_tier requires at least one project_export evidence ref',
        source: 'semantic',
        path: 'evidence_refs'
      }
    );
  }

  return diagnostics;
}

function readFixture(fixturePath) {
  try {
    return {
      record: readJson(`kernel/fixtures/${fixturePath}`),
      diagnostics: []
    };
  } catch (error) {
    return {
      record: null,
      diagnostics: [diagnostic({
        rule_id: 'DECISION_RECORD_V2_FIXTURE',
        code: 'FIXTURE_JSON_READ_OR_PARSE_FAILED',
        message: `${fixturePath} failed to read or parse: ${error.message}`,
        source: 'fixture',
        path: `kernel/fixtures/${fixturePath}`
      })]
    };
  }
}

function formatDiagnostic(item) {
  return `${item.rule_id} ${item.code} [${item.source}]${item.path ? ` ${item.path}` : ''}: ${item.message}`;
}

const output = ['Decision Record v2 validator summary'];
let failed = false;
let validate;

try {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  validate = ajv.compile(readJson(schemaPath));
  output.push('Schema setup: PASS');
} catch (error) {
  failed = true;
  output.push('Schema setup: FAIL');
  output.push(`  - DECISION_RECORD_V2_SCHEMA SCHEMA_COMPILE_FAILED [schema] ${schemaPath}: ${error.message}`);
}

let validPassed = 0;
let invalidFailed = 0;
let expectedDiagnosticsPassed = 0;
const expectedValid = fixturePlan.filter(({ shouldFail }) => !shouldFail).length;
const expectedInvalid = fixturePlan.filter(({ shouldFail }) => shouldFail).length;
const invalidDiagnosticLines = [];

if (validate) {
  for (const fixture of fixturePlan) {
    const fixtureRead = readFixture(fixture.path);
    const record = fixtureRead.record;
    const allDiagnostics = [
      ...fixtureRead.diagnostics,
      ...(record ? schemaDiagnostics(record, validate) : []),
      ...(record ? validateDecisionRecordV2(record) : [])
    ];

    if (!fixture.shouldFail) {
      if (allDiagnostics.length === 0) {
        validPassed += 1;
      } else {
        failed = true;
        output.push(`${fixture.path}: FAIL`, ...allDiagnostics.map((item) => `  - ${formatDiagnostic(item)}`));
      }
      continue;
    }

    const observedCodes = new Set(allDiagnostics.map((item) => item.code));
    const missingCodes = fixture.expectedCodes.filter((code) => !observedCodes.has(code));
    if (allDiagnostics.length > 0 && missingCodes.length === 0) {
      invalidFailed += 1;
      expectedDiagnosticsPassed += 1;
      invalidDiagnosticLines.push(`  - ${fixture.path}: PASS [${fixture.expectedCodes.join(', ')}]`);
    } else {
      failed = true;
      output.push(`${fixture.path}: ${allDiagnostics.length === 0 ? 'unexpected PASS' : 'unexpected diagnostics'}`);
      if (missingCodes.length > 0) output.push(`  - Missing expected diagnostic codes: ${missingCodes.join(', ')}`);
      output.push(...allDiagnostics.map((item) => `  - ${formatDiagnostic(item)}`));
    }
  }
}

output.push(`Valid v2 fixtures passed schema + semantic validation: ${validPassed}/${expectedValid}`);
output.push(`Invalid v2 fixtures failed with expected diagnostics: ${invalidFailed}/${expectedInvalid}`);
output.push(`Expected diagnostic assertions: ${expectedDiagnosticsPassed === expectedInvalid ? 'PASS' : 'FAIL'} (${expectedDiagnosticsPassed}/${expectedInvalid})`);
output.push('Invalid fixture diagnostic assertions:');
output.push(...invalidDiagnosticLines);
output.push(`Result: ${failed ? 'FAIL' : 'PASS'}`);
console.log(output.join('\n'));
process.exit(failed ? 1 : 0);
