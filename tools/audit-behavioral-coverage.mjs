#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const SOURCE = 'docs/governance/BEHAVIORAL_RULE_COVERAGE.md';
const OUT_JSON = 'artifacts/behavioral-coverage-report.json';
const OUT_MD = 'artifacts/behavioral-coverage-report.md';
const COLUMNS = ['rule_id','concept','risk','prose_source','schema_carrier','validator_rule','valid_fixture','invalid_fixture','CI_step','downstream_contract','status'];
const RISKS = ['Critical','High','Medium','Low'];
const STATUSES = ['prose_only','schema_backed','validator_backed','fixture_tested','ci_enforced','downstream_contract_enforced'];
const CARRIERS = ['schema_carrier','validator_rule','invalid_fixture','CI_step','downstream_contract'];

function modeFrom(args) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node tools/audit-behavioral-coverage.mjs [--mode advisory|strict]');
    process.exit(0);
  }
  let mode = 'advisory';
  if (args.length === 1 && args[0].startsWith('--mode=')) mode = args[0].slice(7);
  else if (args.length === 2 && args[0] === '--mode') mode = args[1];
  else if (args.length !== 0) throw new Error('Invalid arguments.');
  if (!['advisory','strict'].includes(mode)) throw new Error(`Invalid mode: ${mode}`);
  return mode;
}

function cells(line, lineNo) {
  const text = line.trim();
  if (!text.startsWith('|') || !text.endsWith('|')) throw new Error(`Line ${lineNo}: malformed table row.`);
  return text.slice(1,-1).split('|').map((cell) => cell.trim());
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
  const next = lines.findIndex((line,index) => index > start && /^##\s+/.test(line.trim()));
  const end = next < 0 ? lines.length : next;
  let headerAt = -1;
  for (let i = start + 1; i < end; i += 1) {
    if (!lines[i].trim().startsWith('|')) continue;
    const candidate = cells(lines[i], i + 1).map(plain);
    if (candidate.includes('rule_id') || candidate.includes('status')) { headerAt = i; break; }
  }
  if (headerAt < 0) throw new Error('Coverage matrix header not found.');
  const header = cells(lines[headerAt], headerAt + 1).map(plain);
  if (!equal(header,COLUMNS)) throw new Error(`Columns must exactly equal: ${COLUMNS.join(', ')}. Found: ${header.join(', ')}.`);
  const separator = cells(lines[headerAt + 1] ?? '', headerAt + 2);
  if (separator.length !== COLUMNS.length || separator.some((cell) => !/^:?-+:?$/.test(cell))) throw new Error(`Line ${headerAt + 2}: invalid separator row.`);
  const rows = [];
  for (let i = headerAt + 2; i < end && lines[i].trim().startsWith('|'); i += 1) {
    const rowCells = cells(lines[i], i + 1);
    if (rowCells.length !== COLUMNS.length) throw new Error(`Line ${i + 1}: expected ${COLUMNS.length} cells, found ${rowCells.length}.`);
    if (rowCells.some((cell) => cell === '')) throw new Error(`Line ${i + 1}: empty cells are not allowed; use None.`);
    rows.push({...Object.fromEntries(COLUMNS.map((column,index) => [column,plain(rowCells[index])])),source_line:i + 1});
  }
  if (!rows.length) throw new Error('Coverage matrix contains no rule rows.');
  const ids = rows.map((row) => row.rule_id);
  const duplicates = [...new Set(ids.filter((id,index) => ids.indexOf(id) !== index))].sort();
  if (duplicates.length) throw new Error(`Duplicate rule_id: ${duplicates.join(', ')}.`);
  return rows;
}

const sorted = (items) => items.sort((a,b) => a.rule_id < b.rule_id ? -1 : a.rule_id > b.rule_id ? 1 : 0);
const pick = (rows,predicate,map) => sorted(rows.filter(predicate).map(map));

function analyze(rows) {
  return {
    invalid_risks: pick(rows,(r) => !RISKS.includes(r.risk),(r) => ({rule_id:r.rule_id,value:r.risk,source_line:r.source_line})),
    invalid_statuses: pick(rows,(r) => !STATUSES.includes(r.status),(r) => ({rule_id:r.rule_id,value:r.status,source_line:r.source_line})),
    critical_weak_coverage: pick(rows,(r) => r.risk === 'Critical' && ['prose_only','schema_backed'].includes(r.status),(r) => ({rule_id:r.rule_id,status:r.status,source_line:r.source_line})),
    high_prose_only_coverage: pick(rows,(r) => r.risk === 'High' && r.status === 'prose_only',(r) => ({rule_id:r.rule_id,status:r.status,source_line:r.source_line})),
    missing_carriers: sorted(rows.flatMap((r) => CARRIERS.filter((carrier) => r[carrier] === 'None').map((carrier) => ({rule_id:r.rule_id,carrier,source_line:r.source_line})))),
    critical_missing_invalid_fixture: pick(rows,(r) => r.risk === 'Critical' && r.invalid_fixture === 'None',(r) => ({rule_id:r.rule_id,source_line:r.source_line})),
    critical_ci_enforced_missing_step: pick(rows,(r) => r.risk === 'Critical' && r.status === 'ci_enforced' && r.CI_step === 'None',(r) => ({rule_id:r.rule_id,source_line:r.source_line})),
  };
}

function strictCount(f) {
  return f.invalid_risks.length + f.invalid_statuses.length + f.critical_weak_coverage.length + f.critical_missing_invalid_fixture.length + f.critical_ci_enforced_missing_step.length;
}

function count(rows,field,values) {
  return Object.fromEntries(values.map((value) => [value,rows.filter((row) => row[field] === value).length]));
}

function markdown(report) {
  const section = (title,items,format) => `## ${title}\n\n${items.length ? items.map((item) => `- ${format(item)}`).join('\n') : 'None.'}\n`;
  const invalid = [...report.findings.invalid_risks.map((x) => ({...x,field:'risk'})),...report.findings.invalid_statuses.map((x) => ({...x,field:'status'}))];
  return `# Behavioral Rule Coverage Audit Report\n\n- Source: \`${report.source}\`\n- Mode: \`${report.mode}\`\n- Outcome: \`${report.outcome}\`\n- Parse status: \`${report.parse_status}\`\n- Rules parsed: ${report.summary.total_rules}\n- Strict violation findings: ${report.summary.strict_violations}\n\n## Enforcement Boundary\n\nThis audit enforces matrix structure and selected strict thresholds. It does not make a listed behavioral rule \`ci_enforced\`; actual validator/fixture execution and applicable downstream rejection remain separate.\n\n${section('Structural Errors',report.structural_errors,(x) => x)}\n${section('Critical Weak Coverage',report.findings.critical_weak_coverage,(x) => `\`${x.rule_id}\`: \`${x.status}\` (line ${x.source_line})`)}\n${section('High Prose-Only Coverage',report.findings.high_prose_only_coverage,(x) => `\`${x.rule_id}\` (line ${x.source_line})`)}\n${section('Missing Carriers',report.findings.missing_carriers,(x) => `\`${x.rule_id}\`: \`${x.carrier}\` (line ${x.source_line})`)}\n${section('Invalid Values',invalid,(x) => `\`${x.rule_id}\`: invalid ${x.field} \`${x.value}\` (line ${x.source_line})`)}\n`;
}

async function main() {
  let mode;
  try { mode = modeFrom(process.argv.slice(2)); }
  catch (error) { console.error(error.message); process.exitCode = 2; return; }
  let rows = [];
  let findings = analyze([]);
  const structuralErrors = [];
  try { rows = parseMatrix(await readFile(SOURCE,'utf8')); findings = analyze(rows); }
  catch (error) { structuralErrors.push(error.code === 'ENOENT' ? `Source document not found: ${SOURCE}` : error.message); }
  const strictViolations = strictCount(findings);
  const failed = structuralErrors.length > 0 || (mode === 'strict' && strictViolations > 0);
  const report = {
    report_version:1,source:SOURCE,mode,outcome:failed?'fail':'pass',parse_status:structuralErrors.length?'malformed':'parsed',
    enforcement_scope:{matrix_integrity:'system_level_enforcement',behavioral_rules:'coverage_observation_only'},
    summary:{total_rules:rows.length,risk_counts:count(rows,'risk',RISKS),status_counts:count(rows,'status',STATUSES),critical_weak_coverage:findings.critical_weak_coverage.length,high_prose_only_coverage:findings.high_prose_only_coverage.length,missing_carriers:findings.missing_carriers.length,invalid_risks:findings.invalid_risks.length,invalid_statuses:findings.invalid_statuses.length,strict_violations:strictViolations,structural_errors:structuralErrors.length},
    findings,structural_errors:structuralErrors,rules:sorted(rows.map((row) => ({...row}))),
  };
  await mkdir('artifacts',{recursive:true});
  await Promise.all([writeFile(OUT_JSON,`${JSON.stringify(report,null,2)}\n`,'utf8'),writeFile(OUT_MD,markdown(report),'utf8')]);
  console.log(`Behavioral Coverage Audit: mode=${mode} outcome=${report.outcome} parse=${report.parse_status}`);
  console.log(`rules=${rows.length} critical_weak=${report.summary.critical_weak_coverage} high_prose_only=${report.summary.high_prose_only_coverage} missing_carriers=${report.summary.missing_carriers} strict_violations=${strictViolations}`);
  console.log(`reports: ${OUT_JSON}, ${OUT_MD}`);
  for (const x of findings.critical_weak_coverage) console.warn(`WARNING: ${x.rule_id} is Critical with ${x.status} coverage.`);
  for (const x of findings.high_prose_only_coverage) console.warn(`WARNING: ${x.rule_id} is High with prose_only coverage.`);
  for (const x of findings.invalid_risks) console.warn(`WARNING: ${x.rule_id} has invalid risk ${x.value}.`);
  for (const x of findings.invalid_statuses) console.warn(`WARNING: ${x.rule_id} has invalid status ${x.value}.`);
  for (const error of structuralErrors) console.error(`ERROR: ${error}`);
  if (failed) process.exitCode = 1;
}
await main();
