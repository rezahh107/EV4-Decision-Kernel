#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const SOURCE = 'docs/governance/BEHAVIORAL_RULE_COVERAGE.md';
const OUT_JSON = 'artifacts/behavioral-coverage-report.json';
const OUT_MD = 'artifacts/behavioral-coverage-report.md';

const COLUMNS = [
  'rule_id',
  'concept',
  'risk',
  'prose_source',
  'schema_carrier',
  'validator_rule',
  'valid_fixture',
  'invalid_fixture',
  'CI_step',
  'downstream_contract',
  'session_scope',
  'recovery_action',
  'status',
];

const RISKS = ['Critical', 'High', 'Medium', 'Low'];
const SESSION_SCOPES = ['per_artifact', 'cross_turn'];
const RECOVERY_ACTIONS = ['block', 'repair_request', 'rollback', 'flag_for_review'];
const STATUSES = [
  'prose_only',
  'schema_backed',
  'validator_backed',
  'fixture_tested',
  'advisory_ci_observed',
  'ci_enforced',
  'sequence_ci_enforced',
  'runtime_monitor_enforced',
  'os_harness_enforced',
  'downstream_contract_enforced',
];

const PER_ARTIFACT_MINIMUM = [
  'ci_enforced',
  'sequence_ci_enforced',
  'runtime_monitor_enforced',
  'os_harness_enforced',
  'downstream_contract_enforced',
];
const CROSS_TURN_MINIMUM = [
  'sequence_ci_enforced',
  'runtime_monitor_enforced',
  'os_harness_enforced',
  'downstream_contract_enforced',
];
const RUNTIME_MINIMUM = ['runtime_monitor_enforced', 'downstream_contract_enforced'];
const HIGH_MINIMUM = [
  'validator_backed',
  'fixture_tested',
  'ci_enforced',
  'sequence_ci_enforced',
  'runtime_monitor_enforced',
  'os_harness_enforced',
  'downstream_contract_enforced',
];
const HIGH_PREFERRED = [
  'fixture_tested',
  'ci_enforced',
  'sequence_ci_enforced',
  'runtime_monitor_enforced',
  'os_harness_enforced',
  'downstream_contract_enforced',
];

function optionsFrom(args) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node tools/audit-behavioral-coverage.mjs [--mode advisory|strict] [--rule-prefix PREFIX] [--no-write]');
    process.exit(0);
  }
  const options = { mode: 'advisory', rulePrefix: null, noWrite: false };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--mode') options.mode = args[++index];
    else if (arg.startsWith('--mode=')) options.mode = arg.slice(7);
    else if (arg === '--rule-prefix') options.rulePrefix = args[++index];
    else if (arg.startsWith('--rule-prefix=')) options.rulePrefix = arg.slice(14);
    else if (arg === '--no-write') options.noWrite = true;
    else throw new Error(`Invalid argument: ${arg}`);
  }
  if (!['advisory', 'strict'].includes(options.mode)) throw new Error(`Invalid mode: ${options.mode}`);
  if (options.rulePrefix === '') throw new Error('Rule prefix must not be empty.');
  return options;
}

function cells(line, lineNo) {
  const text = line.trim();
  if (!text.startsWith('|') || !text.endsWith('|')) throw new Error(`Line ${lineNo}: malformed table row.`);
  return text.slice(1, -1).split('|').map((cell) => cell.trim());
}

function plain(value) {
  const match = value.match(/^`([^`]*)`$/);
  return match ? match[1].trim() : value.trim();
}

function equal(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function parseMatrix(source) {
  const lines = source.split(/\r\n|\n|\r/);
  const start = lines.findIndex((line) => /^##\s+(?:\d+\.\s+)?MVK Coverage Matrix\s*$/.test(line.trim()));
  if (start < 0) throw new Error('MVK Coverage Matrix section not found.');
  const next = lines.findIndex((line, index) => index > start && /^##\s+/.test(line.trim()));
  const end = next < 0 ? lines.length : next;
  let headerAt = -1;

  for (let i = start + 1; i < end; i += 1) {
    if (!lines[i].trim().startsWith('|')) continue;
    const candidate = cells(lines[i], i + 1).map(plain);
    if (candidate.includes('rule_id') || candidate.includes('status')) {
      headerAt = i;
      break;
    }
  }

  if (headerAt < 0) throw new Error('Coverage matrix header not found.');
  const header = cells(lines[headerAt], headerAt + 1).map(plain);
  if (!equal(header, COLUMNS)) throw new Error(`Columns must exactly equal: ${COLUMNS.join(', ')}. Found: ${header.join(', ')}.`);

  const separator = cells(lines[headerAt + 1] ?? '', headerAt + 2);
  if (separator.length !== COLUMNS.length || separator.some((cell) => !/^:?-+:?$/.test(cell))) {
    throw new Error(`Line ${headerAt + 2}: invalid separator row.`);
  }

  const rows = [];
  for (let i = headerAt + 2; i < end && lines[i].trim().startsWith('|'); i += 1) {
    const rowCells = cells(lines[i], i + 1);
    if (rowCells.length !== COLUMNS.length) throw new Error(`Line ${i + 1}: expected ${COLUMNS.length} cells, found ${rowCells.length}.`);
    if (rowCells.some((cell) => cell === '')) throw new Error(`Line ${i + 1}: empty cells are not allowed; use None, not_implemented, not_applicable, or insufficient_evidence.`);
    rows.push({
      ...Object.fromEntries(COLUMNS.map((column, index) => [column, plain(rowCells[index])])),
      source_line: i + 1,
    });
  }

  if (!rows.length) throw new Error('Coverage matrix contains no rule rows.');
  const ids = rows.map((row) => row.rule_id);
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))].sort();
  if (duplicates.length) throw new Error(`Duplicate rule_id: ${duplicates.join(', ')}.`);
  return rows;
}

const sorted = (items) => items.sort((a, b) => {
  if (a.rule_id && b.rule_id && a.rule_id !== b.rule_id) return a.rule_id < b.rule_id ? -1 : 1;
  return JSON.stringify(a).localeCompare(JSON.stringify(b));
});
const pick = (rows, predicate, map) => sorted(rows.filter(predicate).map(map));
const has = (row, field, value) => String(row[field] ?? '').toLowerCase().includes(value);
const anyFieldHas = (row, value) => COLUMNS.some((field) => has(row, field, value));
const meaningful = (value) => !['None', 'not_implemented', 'not_applicable', 'insufficient_evidence'].includes(value);

function thresholdFor(row) {
  if (row.risk === 'Critical' && anyFieldHas(row, 'execution-only observability')) {
    return { minimum: 'runtime_monitor_enforced', allowed: RUNTIME_MINIMUM, target: 'downstream_contract_enforced' };
  }
  if (row.risk === 'Critical' && row.session_scope === 'cross_turn') {
    return { minimum: 'sequence_ci_enforced OR runtime_monitor_enforced', allowed: CROSS_TURN_MINIMUM, target: 'downstream_contract_enforced when a downstream boundary exists' };
  }
  if (row.risk === 'Critical') {
    return { minimum: 'ci_enforced', allowed: PER_ARTIFACT_MINIMUM, target: 'downstream_contract_enforced' };
  }
  if (row.risk === 'High') {
    return { minimum: 'validator_backed', allowed: HIGH_MINIMUM, target: 'fixture_tested or ci_enforced', preferred: HIGH_PREFERRED };
  }
  return null;
}

function overclaimRisks(rows) {
  return [
    {
      risk_id: 'advisory_ci_treated_as_ci_enforced',
      description: 'advisory CI treated as ci_enforced',
      rows: pick(rows, (r) => r.status === 'ci_enforced' && /advisory/i.test(`${r.CI_step} ${r.prose_source}`), (r) => ({ rule_id: r.rule_id, status: r.status, CI_step: r.CI_step, source_line: r.source_line })),
    },
    {
      risk_id: 'field_presence_treated_as_semantic_enforcement',
      description: 'field presence treated as semantic enforcement',
      rows: pick(rows, (r) => ['validator_backed', 'fixture_tested', 'ci_enforced', 'sequence_ci_enforced', 'runtime_monitor_enforced', 'os_harness_enforced', 'downstream_contract_enforced'].includes(r.status) && meaningful(r.schema_carrier) && !meaningful(r.validator_rule), (r) => ({ rule_id: r.rule_id, status: r.status, schema_carrier: r.schema_carrier, validator_rule: r.validator_rule, source_line: r.source_line })),
    },
    {
      risk_id: 'fixture_existence_treated_as_ci_enforcement',
      description: 'fixture existence treated as CI enforcement',
      rows: pick(rows, (r) => ['ci_enforced', 'sequence_ci_enforced'].includes(r.status) && (!meaningful(r.CI_step) || !meaningful(r.invalid_fixture) || !meaningful(r.valid_fixture)), (r) => ({ rule_id: r.rule_id, status: r.status, valid_fixture: r.valid_fixture, invalid_fixture: r.invalid_fixture, CI_step: r.CI_step, source_line: r.source_line })),
    },
    {
      risk_id: 'synthetic_fixture_treated_as_real_e2e',
      description: 'synthetic fixture treated as real E2E',
      rows: pick(rows, (r) => /synthetic/i.test(`${r.valid_fixture} ${r.invalid_fixture}`) && /e2e|production|runtime|downstream/i.test(r.status), (r) => ({ rule_id: r.rule_id, status: r.status, valid_fixture: r.valid_fixture, invalid_fixture: r.invalid_fixture, source_line: r.source_line })),
    },
    {
      risk_id: 'ci_success_treated_as_production_readiness',
      description: 'CI success treated as production readiness',
      rows: pick(rows, (r) => /production ready|production readiness/i.test(r.concept) && ['ci_enforced', 'sequence_ci_enforced', 'advisory_ci_observed'].includes(r.status), (r) => ({ rule_id: r.rule_id, status: r.status, concept: r.concept, source_line: r.source_line })),
    },
    {
      risk_id: 'downstream_contract_without_rejection_evidence',
      description: 'downstream_contract_enforced without inspected downstream rejection evidence',
      rows: pick(rows, (r) => r.status === 'downstream_contract_enforced' && !/reject|rejection|consumer/i.test(r.downstream_contract), (r) => ({ rule_id: r.rule_id, status: r.status, downstream_contract: r.downstream_contract, source_line: r.source_line })),
    },
    {
      risk_id: 'cross_turn_critical_satisfied_by_single_artifact_ci',
      description: 'cross_turn Critical rule treated as satisfied by single-artifact ci_enforced',
      rows: pick(rows, (r) => r.risk === 'Critical' && r.session_scope === 'cross_turn' && r.status === 'ci_enforced', (r) => ({ rule_id: r.rule_id, status: r.status, session_scope: r.session_scope, source_line: r.source_line })),
    },
  ];
}

function analyze(rows) {
  const invalidRisks = pick(rows, (r) => !RISKS.includes(r.risk), (r) => ({ rule_id: r.rule_id, value: r.risk, source_line: r.source_line }));
  const invalidScopes = pick(rows, (r) => !SESSION_SCOPES.includes(r.session_scope), (r) => ({ rule_id: r.rule_id, value: r.session_scope, source_line: r.source_line }));
  const invalidRecoveryActions = pick(rows, (r) => !RECOVERY_ACTIONS.includes(r.recovery_action), (r) => ({ rule_id: r.rule_id, value: r.recovery_action, source_line: r.source_line }));
  const invalidStatuses = pick(rows, (r) => !STATUSES.includes(r.status), (r) => ({ rule_id: r.rule_id, value: r.status, source_line: r.source_line }));
  const enumErrors = [
    ...invalidRisks.map((x) => ({ field: 'risk', ...x })),
    ...invalidScopes.map((x) => ({ field: 'session_scope', ...x })),
    ...invalidRecoveryActions.map((x) => ({ field: 'recovery_action', ...x })),
    ...invalidStatuses.map((x) => ({ field: 'status', ...x })),
  ];

  const thresholdViolations = pick(
    rows,
    (r) => {
      const threshold = thresholdFor(r);
      return threshold && !threshold.allowed.includes(r.status);
    },
    (r) => {
      const threshold = thresholdFor(r);
      return {
        rule_id: r.rule_id,
        risk: r.risk,
        session_scope: r.session_scope,
        recovery_action: r.recovery_action,
        status: r.status,
        minimum: threshold.minimum,
        target: threshold.target,
        source_line: r.source_line,
      };
    },
  );

  const highBelowPreferred = pick(
    rows,
    (r) => r.risk === 'High' && HIGH_MINIMUM.includes(r.status) && !HIGH_PREFERRED.includes(r.status),
    (r) => ({ rule_id: r.rule_id, status: r.status, preferred: 'fixture_tested or ci_enforced', source_line: r.source_line }),
  );

  const openGaps = pick(
    rows,
    (r) => ['Critical', 'High'].includes(r.risk) && r.status !== 'downstream_contract_enforced',
    (r) => ({ rule_id: r.rule_id, risk: r.risk, status: r.status, target: thresholdFor(r)?.target ?? 'not_applicable', source_line: r.source_line }),
  );

  return {
    invalid_risks: invalidRisks,
    invalid_session_scopes: invalidScopes,
    invalid_recovery_actions: invalidRecoveryActions,
    invalid_statuses: invalidStatuses,
    enum_errors: enumErrors,
    threshold_violations: thresholdViolations,
    high_below_preferred: highBelowPreferred,
    overclaim_risk_checks: overclaimRisks(rows),
    open_enforcement_gaps: openGaps,
  };
}

function count(rows, field, values) {
  return Object.fromEntries(values.map((value) => [value, rows.filter((row) => row[field] === value).length]));
}

function section(title, items, format) {
  return `## ${title}\n\n${items.length ? items.map((item) => `- ${format(item)}`).join('\n') : 'None.'}\n`;
}

function markdown(report) {
  const overclaim = report.findings.overclaim_risk_checks
    .map((check) => `### ${check.risk_id}\n\n${check.description}\n\n${check.rows.length ? check.rows.map((row) => `- \`${row.rule_id}\` line ${row.source_line}: status=\`${row.status ?? 'n/a'}\``).join('\n') : 'None detected.'}`)
    .join('\n\n');

  return `# Behavioral Rule Coverage Audit Report\n\n- Source: \`${report.source}\`\n- Model: \`${report.model}\`\n- Mode: \`${report.mode}\`\n- Outcome: \`${report.outcome}\`\n- Parse status: \`${report.parse_status}\`\n- Rules parsed: ${report.summary.total_rules}\n- Enum errors: ${report.summary.enum_errors}\n- Threshold violations: ${report.summary.threshold_violations}\n\n## Enforcement Boundary\n\nThis audit enforces matrix structure, enum safety, and threshold reporting. It does not make a listed behavioral rule \`ci_enforced\`; actual rule-level CI enforcement, sequence replay, runtime monitoring, OS/harness controls, and downstream rejection remain separate evidence carriers.\n\n${section('Structural Errors', report.structural_errors, (x) => x)}\n${section('Enum Errors', report.findings.enum_errors, (x) => `\`${x.rule_id}\`: invalid ${x.field} \`${x.value}\` (line ${x.source_line})`)}\n${section('Threshold Violations', report.findings.threshold_violations, (x) => `\`${x.rule_id}\`: status \`${x.status}\` is below minimum \`${x.minimum}\` for ${x.risk}/${x.session_scope} (line ${x.source_line})`)}\n${section('High Below Preferred', report.findings.high_below_preferred, (x) => `\`${x.rule_id}\`: status \`${x.status}\`; preferred ${x.preferred} (line ${x.source_line})`)}\n${section('Open Enforcement Gaps', report.findings.open_enforcement_gaps, (x) => `\`${x.rule_id}\`: ${x.risk} currently \`${x.status}\`; target \`${x.target}\` (line ${x.source_line})`)}\n## Overclaim Risk Checks\n\n${overclaim}\n`;
}

async function main() {
  let options;
  try {
    options = optionsFrom(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
    return;
  }

  let rows = [];
  let findings = analyze([]);
  const structuralErrors = [];

  try {
    rows = parseMatrix(await readFile(SOURCE, 'utf8'));
    if (options.rulePrefix) rows = rows.filter((row) => row.rule_id.startsWith(options.rulePrefix));
    if (options.rulePrefix && rows.length === 0) throw new Error(`No rules matched prefix: ${options.rulePrefix}`);
    findings = analyze(rows);
  } catch (error) {
    structuralErrors.push(error.code === 'ENOENT' ? `Source document not found: ${SOURCE}` : error.message);
  }

  const enumErrorCount = findings.enum_errors.length;
  const thresholdViolationCount = findings.threshold_violations.length;
  const advisoryFailed = structuralErrors.length > 0 || enumErrorCount > 0;
  const strictFailed = advisoryFailed || thresholdViolationCount > 0;
  const failed = options.mode === 'strict' ? strictFailed : advisoryFailed;

  const report = {
    report_version: 2,
    model: 'Behavioral Rule Coverage v0.4.1',
    source: SOURCE,
    mode: options.mode,
    rule_prefix: options.rulePrefix,
    outcome: failed ? 'fail' : 'pass',
    parse_status: structuralErrors.length ? 'malformed' : 'parsed',
    enforcement_scope: {
      matrix_integrity: 'system_level_enforcement',
      enum_validation: 'system_level_enforcement',
      threshold_reporting: options.mode === 'strict' ? 'strict_threshold_gate' : 'advisory_observation_only',
      behavioral_rules: 'coverage_observation_only',
    },
    advisory_failure_policy: [
      'missing document',
      'malformed matrix',
      'missing required columns',
      'invalid enum values',
      'unsafe parser interpretation',
    ],
    summary: {
      total_rules: rows.length,
      risk_counts: count(rows, 'risk', RISKS),
      session_scope_counts: count(rows, 'session_scope', SESSION_SCOPES),
      recovery_action_counts: count(rows, 'recovery_action', RECOVERY_ACTIONS),
      status_counts: count(rows, 'status', STATUSES),
      enum_errors: enumErrorCount,
      threshold_violations: thresholdViolationCount,
      high_below_preferred: findings.high_below_preferred.length,
      open_enforcement_gaps: findings.open_enforcement_gaps.length,
      structural_errors: structuralErrors.length,
    },
    findings,
    structural_errors: structuralErrors,
    rules: sorted(rows.map((row) => ({ ...row }))),
  };

  if (!options.noWrite) {
    await mkdir('artifacts', { recursive: true });
    await Promise.all([
      writeFile(OUT_JSON, `${JSON.stringify(report, null, 2)}\n`, 'utf8'),
      writeFile(OUT_MD, markdown(report), 'utf8'),
    ]);
  }

  console.log(`Behavioral Coverage Audit: model=v0.4.1 mode=${options.mode} outcome=${report.outcome} parse=${report.parse_status}`);
  console.log(`rules=${rows.length} enum_errors=${enumErrorCount} threshold_violations=${thresholdViolationCount} open_gaps=${report.summary.open_enforcement_gaps}`);
  console.log(options.noWrite ? 'reports: disabled (--no-write)' : `reports: ${OUT_JSON}, ${OUT_MD}`);

  for (const error of structuralErrors) console.error(`ERROR: ${error}`);
  for (const x of findings.enum_errors) console.error(`ERROR: ${x.rule_id} has invalid ${x.field} ${x.value}.`);
  for (const x of findings.threshold_violations) console.warn(`WARNING: ${x.rule_id} is below v0.4.1 minimum ${x.minimum} with status ${x.status}.`);
  for (const check of findings.overclaim_risk_checks) {
    if (check.rows.length) console.warn(`WARNING: overclaim risk ${check.risk_id} matched ${check.rows.length} row(s).`);
  }

  if (failed) process.exitCode = 1;
}

await main();
