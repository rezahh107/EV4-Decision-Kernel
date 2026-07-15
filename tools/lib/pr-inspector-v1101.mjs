import { TextDecoder } from 'node:util';
import { canonical, sha256 } from './aigov-lifecycle.mjs';

export const PROTOCOL_VERSION = 'v1.10.1';
export const FIXED_ARTIFACTS = [
  'review-package.json',
  'DECISION_PROJECTION.json',
  'OWNER_DECISION_CARD.fa.md',
  'TECHNICAL_HANDOFF.en.md',
  'OWNER_RESULT.fa.txt',
  'artifact-manifest.json',
];
export const PROMPT_ARTIFACT = 'NEXT_ACTION_PROMPT.en.md';

const SECURITY_CONTROLS = [
  'dedicated_github_app',
  'github_app_private_key',
  'exact_app_id_check_runs',
  'branch_protection',
  'repository_rulesets',
  'merge_queue',
  'codeowners_approval',
  'repository_hosted_exact_source_enforcement',
];

const OWNER_STATUS = '🟢 سبز — از نظر فنی آماده';
const OWNER_ACTION = 'آمادگی فنی برقرار است؛ مجوز و حفاظت واقعی ادغام باید از شواهد GitHub تأیید شود.';
const OWNER_RESULT = '🟢 وضعیت: از نظر فنی آماده\nآمادگی فنی تأیید شده؛ حفاظت ادغام در GitHub جداگانه بررسی شود.\n';
const CANONICAL_ACTION = 'No technical blocker, pending structured action, or additional technical approval remains for the reviewed head; the project owner may merge it.';

function compactJson(value) {
  return `${JSON.stringify(canonical(value))}\n`;
}

export function canonicalPackageBytes(pkg) {
  return Buffer.from(compactJson(pkg), 'utf8');
}

export function canonicalPackageSha256(pkg) {
  return sha256(canonicalPackageBytes(pkg));
}

function yamlScalar(value) {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

function markdownCell(value) {
  return String(value).replace(/[\r\n]/g, ' ').trim().replace(/\s+/g, ' ').replaceAll('|', '\\|');
}

function bullets(out, items) {
  if (items.length) out.push(...items.map((item) => `- ${item}`));
  else out.push('- none');
}

function numbered(out, items) {
  if (items.length) out.push(...items.map((item, index) => `${index + 1}. ${item}`));
  else out.push('1. none');
}

function acceptedSuggestions(pkg) {
  return (pkg.external_review_intake?.suggestions || []).filter((item) => item.triage_decision === 'accepted' && item.repair_handoff);
}

function renderExternalReviewIntake(out, pkg) {
  out.push('## 10. External Review Suggestions Considered', '');
  const suggestions = pkg.external_review_intake?.suggestions || [];
  if (!suggestions.length) {
    out.push('None.', '');
    return;
  }
  out.push('| id | source | decision | linked finding | reason |', '|---|---|---|---|---|');
  for (const item of suggestions) {
    const linked = item.linked_finding_ids.join(', ') || 'None';
    out.push(`| ${markdownCell(item.external_suggestion_id)} | ${markdownCell(item.author)} | ${markdownCell(item.triage_decision)} | ${markdownCell(linked)} | ${markdownCell(item.triage_reason)} |`);
  }
  out.push('');
}

function renderRepairHandoff(out, pkg) {
  const handoff = pkg.repair_handoff;
  const accepted = acceptedSuggestions(pkg);
  out.push('## 11. Repair Handoff for Implementer Model', '');
  if ((!handoff || !handoff.affected_findings?.length) && !accepted.length) {
    out.push('None.', '');
    return;
  }
  if (handoff?.affected_findings?.length) {
    out.push(`Intended recipient: ${handoff.intended_recipient}  `, `Repair scope: ${handoff.repair_scope}`, '');
    for (const item of handoff.affected_findings) {
      out.push(`### ${item.finding_id}`, '', 'Affected rules:');
      bullets(out, item.affected_rule_ids);
      out.push('', `Repair objective: ${item.repair_objective}`, '', 'Smallest safe repair:');
      numbered(out, item.smallest_safe_repair);
      out.push('', 'Do not change:');
      bullets(out, item.do_not_change);
      out.push('', 'Required validation:');
      bullets(out, item.required_validation);
      out.push('', 'Overclaim guards:');
      bullets(out, item.overclaim_guards);
      out.push('');
    }
  }
  if (accepted.length) {
    out.push('### Accepted External Suggestions', '');
    for (const item of accepted) {
      const repair = item.repair_handoff;
      out.push(`#### ${item.external_suggestion_id} → ${item.linked_finding_ids.join(', ') || 'None'}`, '', 'Source:', item.author, '', 'Verified issue:', item.claim_summary, '', 'Smallest safe repair:');
      numbered(out, repair.smallest_safe_repair);
      out.push('', 'Do not change:');
      bullets(out, repair.do_not_change);
      out.push('', 'Required validation:');
      bullets(out, repair.required_validation);
      out.push('', 'Overclaim guards:');
      bullets(out, repair.overclaim_guards);
      out.push('');
    }
  }
}

export function canonicalGreenProjection(pkg, ciIdentity) {
  const identity = pkg.review_identity;
  if (!ciIdentity || ciIdentity.tested_sha !== identity.reviewed_head_sha || ciIdentity.repository !== identity.target_repository || ciIdentity.pr_number !== identity.pr_number) {
    throw new Error('PRI-SEQUENCE-001: verified exact-head CI capability does not match the review package');
  }
  return {
    schema_version: 1,
    protocol_version: PROTOCOL_VERSION,
    technical_status: 'GREEN_TECHNICALLY_READY',
    technical_status_reason_codes: [],
    approval_requirement: 'NO_ADDITIONAL_TECHNICAL_APPROVAL',
    security_profile: {
      name: 'personal_ai_operated_strong_governance_minimum_security',
      security_level: 'minimum_security',
      sequence_ci_enforced: true,
      repository_hosted_requirement: 'optional_hardening',
      repository_hosted_enforcement: 'not_verified',
      github_app_exact_source_enforcement: 'optional_hardening',
      repository_settings_enforced: 'not_claimed',
      merge_authorized: 'not_claimed',
      governance_evidence_status: 'not_provided',
      governance_evidence_id: null,
      blocks_green_merge_recommendation: false,
      reason_codes: [],
      controls: SECURITY_CONTROLS.map((control) => ({ control, classification: 'optional_hardening' })),
    },
    owner_readiness: { color: 'GREEN', action_kind: 'merge_now', message_key: 'green_merge_now', reason_codes: [] },
    next_action: { kind: 'merge_now', recipient: 'none', may_modify_code: false, prompt_required: false, prompt_kind: null, reason_codes: [] },
    review_identity: { validity: 'CURRENT', reviewed_head_sha: identity.reviewed_head_sha },
    reason_details: [],
    required_actions: [],
  };
}

export function greenPackageDiagnostics(pkg, context, ciIdentity) {
  const out = [];
  const identity = pkg?.review_identity || {};
  const decision = pkg?.decision || {};
  const scope = pkg?.scope || {};
  const security = pkg?.security_profile || {};
  const mismatch = (condition, code) => { if (condition) out.push(code); };
  mismatch(pkg?.protocol_version !== PROTOCOL_VERSION || pkg?.schema_version !== 1, 'PRI-SEMANTIC-PROTOCOL');
  mismatch(identity.inspector_repository !== context.inspectorRepository || identity.inspector_commit_sha !== context.inspectorCommitSha, 'PRI-SEMANTIC-INSPECTOR-IDENTITY');
  mismatch(identity.target_repository !== context.repository || identity.pr_number !== context.prNumber || identity.base_sha !== context.baseSha || identity.reviewed_head_sha !== context.headSha, 'PRI-SEMANTIC-TARGET-IDENTITY');
  mismatch(identity.review_validity !== 'CURRENT' || identity.review_mode !== 'FULL', 'PRI-SEMANTIC-REVIEW-NOT-CURRENT-FULL');
  mismatch(decision.technical_status !== 'GREEN_TECHNICALLY_READY' || decision.approval_requirement !== 'NO_ADDITIONAL_TECHNICAL_APPROVAL' || decision.blocking_findings_count !== 0, 'PRI-SEMANTIC-NOT-CANONICAL-GREEN');
  mismatch((pkg.red_gate_flags || []).length > 0 || (pkg.required_actions || []).length > 0 || (pkg.unverified_areas || []).length > 0, 'PRI-SEMANTIC-PENDING-REASONS');
  mismatch(scope.coverage_complete !== true || (scope.files_not_reviewed || []).length > 0 || (scope.files_partially_reviewed || []).length > 0 || (scope.high_risk_areas_not_reviewed || []).length > 0, 'PRI-SEMANTIC-COVERAGE-INCOMPLETE');
  mismatch(!pkg.intent_fit || pkg.intent_fit.intent_fit_result !== 'satisfied' || (pkg.intent_fit.unsupported_claims || []).length > 0, 'PRI-SEMANTIC-INTENT-UNRESOLVED');
  const evidence = new Map((pkg.evidence_records || []).map((item) => [item.evidence_id, item]));
  mismatch((pkg.checks || []).some((check) => check.required && check.result !== 'PASS'), 'PRI-SEMANTIC-REQUIRED-CHECK-UNRESOLVED');
  mismatch((pkg.checks || []).some((check) => !evidence.has(check.evidence_id)), 'PRI-SEMANTIC-CHECK-EVIDENCE-MISSING');
  mismatch((pkg.evidence_records || []).some((item) => item.reviewed_head_sha !== context.headSha), 'PRI-SEMANTIC-EVIDENCE-STALE');
  const reasonFinding = (pkg.findings || []).some((finding) =>
    (finding.severity === 'CRITICAL' && ['REPRODUCED', 'CODE_SUPPORTED'].includes(finding.evidence_label))
    || (finding.severity === 'HIGH' && ['REPRODUCED', 'CODE_SUPPORTED', 'HYPOTHESIS'].includes(finding.evidence_label))
    || (finding.blocking && ['MEDIUM'].includes(finding.severity))
    || (finding.blocking && finding.evidence_label === 'HYPOTHESIS')
    || finding.evidence_label === 'NOT_ASSESSABLE');
  mismatch(reasonFinding || (pkg.findings || []).filter((item) => item.blocking).length !== decision.blocking_findings_count, 'PRI-SEMANTIC-FINDING-REQUIRES-ACTION');
  mismatch(Boolean(pkg.repair_handoff?.affected_findings?.length) || acceptedSuggestions(pkg).length > 0, 'PRI-SEMANTIC-REPAIR-HANDOFF-PRESENT');
  mismatch(security.profile_name !== 'personal_ai_operated_strong_governance_minimum_security' || security.sequence_ci_enforced !== true
    || security.explicit_repository_requirement !== false || security.security_activation_trigger !== false || security.external_requirement !== false
    || security.claim_repository_settings_enforced !== false || security.claim_merge_authorized !== false || security.governance_evidence_id !== null,
  'PRI-SEMANTIC-SECURITY-PROFILE-NONCANONICAL');
  try { canonicalGreenProjection(pkg, ciIdentity); } catch { out.push('PRI-SEQUENCE-001'); }
  return [...new Set(out)];
}

export function renderOwnerCard(pkg) {
  const card = pkg.owner_card;
  const specialist = ['SECURITY_OR_DOMAIN_SPECIALIST_REQUIRED'].includes(pkg.decision.approval_requirement);
  const lines = [
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'نتیجهٔ بررسی PR', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', '',
    `وضعیت: ${OWNER_STATUS}`, '', 'این تغییر چه کاری می‌کند؟', card.summary, '',
  ];
  if (card.mental_model) lines.push('تصویر ذهنی:', card.mental_model, '');
  lines.push('چه چیزی ممکن است خراب شود؟', card.risk, '', 'چه چیزی بررسی شده؟', card.checked, '', 'چه چیزی هنوز مشخص نیست؟', card.unknown, '', 'الان چه کار کنیم؟', OWNER_ACTION, '', 'آیا متخصص لازم است؟', specialist ? 'بله' : 'خیر', card.specialist_reason, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', '');
  return lines.join('\n');
}

export function renderTechnicalHandoff(pkg, projection) {
  const identity = pkg.review_identity;
  const decision = pkg.decision;
  const scope = pkg.scope;
  const out = ['# Technical Handoff Package', '', '## 1. Review Identity', '', '```yaml'];
  const fields = ['inspector_repository', 'inspector_commit_sha', 'protocol_version', 'target_repository', 'pr_number', 'base_branch', 'base_sha', 'head_branch', 'reviewed_head_sha', 'merge_base_sha', 'review_started', 'review_completed', 'review_validity', 'execution_mode', 'review_mode'];
  const merged = { ...identity, protocol_version: pkg.protocol_version };
  for (const key of fields) out.push(`${key}: ${yamlScalar(merged[key])}`);
  out.push('```', '', '> This review is valid only for the reviewed head SHA above.', '', '## 2. Decision Header', '', '```yaml');
  for (const key of ['technical_status', 'risk_classification', 'approval_requirement', 'blocking_findings_count']) out.push(`${key}: ${yamlScalar(decision[key])}`);
  out.push(`canonical_next_action_kind: ${projection.next_action.kind}`, `canonical_next_action_recipient: ${projection.next_action.recipient}`, `canonical_next_action_may_modify_code: ${yamlScalar(projection.next_action.may_modify_code)}`, `canonical_next_action_prompt_kind: ${yamlScalar(projection.next_action.prompt_kind)}`, `canonical_next_action_text: ${CANONICAL_ACTION}`, '```', '', '> `decision.next_required_action` remains in `review-package.json` only for legacy package compatibility. It is non-authoritative, is not rendered as an instruction, and cannot override `DECISION_PROJECTION.json`.', '', `Sensitive domains: ${decision.sensitive_domains.join(', ') || 'none'}`, '', '## 3. Capability Manifest', '');
  for (const [key, value] of Object.entries(pkg.capabilities)) out.push(`- \`${key}\`: \`${value}\``);
  out.push('', '## 4. Scope and Coverage', '', '```yaml');
  for (const key of ['total_changed_files', 'total_changed_lines', 'coverage_complete', 'scope_limit_reason']) out.push(`${key}: ${yamlScalar(scope[key])}`);
  out.push('```', '');
  for (const key of ['files_fully_reviewed', 'files_partially_reviewed', 'files_not_reviewed', 'files_reviewed_outside_diff', 'high_risk_areas_reviewed', 'high_risk_areas_not_reviewed', 'excluded_generated_or_vendor_files']) out.push(`- **${key}:** ${scope[key].join(', ') || 'none'}`);
  const summary = pkg.change_summary;
  out.push('', '## 5. Change Summary', '', `- **Previous behavior:** ${summary.previous_behavior}`, `- **Intended behavior:** ${summary.intended_behavior}`, `- **Actual implementation:** ${summary.actual_implementation}`, `- **Mismatch:** ${summary.mismatch || 'none'}`, '', '## 6. Intent Fit Evidence', '');
  const intent = pkg.intent_fit;
  if (!intent) out.push('None.');
  else {
    out.push('```yaml', `intent_source: ${intent.intent_source}`, `intent_fit_result: ${intent.intent_fit_result}`, '```', '', `- **Stated intent:** ${intent.stated_intent || 'none'}`, `- **Unsupported claims:** ${intent.unsupported_claims.join(', ') || 'none'}`, '');
    if (!intent.implementation_evidence.length) out.push('No implementation evidence recorded.');
    for (const item of intent.implementation_evidence) out.push(`- \`${item.evidence_label}\` ${item.file} (${item.lines_or_symbol}): ${item.evidence_summary}`, `  - Evidence refs: ${item.evidence_refs.join(', ')}`);
  }
  out.push('', '## 7. Evidence Records', '');
  if (!pkg.evidence_records.length) out.push('None.');
  for (const item of pkg.evidence_records) out.push(`### ${item.evidence_id}`, '', `- Type: \`${item.evidence_type}\``, `- Source: ${item.source}`, `- Head SHA: \`${item.reviewed_head_sha}\``, `- Result: \`${item.result}\``, `- Excerpt: ${item.excerpt || 'none'}`, `- Reference: ${item.reference || 'none'}`, `- SHA-256: ${item.sha256 || 'none'}`, `- Redactions: ${item.redactions.join(', ') || 'none'}`, `- Limitations: ${item.limitations.join(', ') || 'none'}`, '');
  const findingsSection = (title, items) => {
    out.push(title, '');
    if (!items.length) { out.push('None.', ''); return; }
    for (const item of items) out.push(`### ${item.finding_id} — ${item.severity} / ${item.evidence_label}`, '', `- Location: \`${item.file_location}\``, `- Symbol: \`${item.symbol || 'n/a'}\``, `- Issue: ${item.issue}`, `- Failure scenario: ${item.failure_scenario}`, `- Recommended fix: ${item.recommended_fix}`, `- Recommended test: ${item.recommended_test}`, `- Evidence: ${item.evidence_refs.join(', ')}`, `- Rules: ${item.rule_ids.join(', ')}`, '');
  };
  findingsSection('## 8. Merge-Blocking Findings', pkg.findings.filter((item) => item.blocking));
  findingsSection('## 9. Non-Blocking Findings', pkg.findings.filter((item) => !item.blocking));
  renderExternalReviewIntake(out, pkg);
  renderRepairHandoff(out, pkg);
  out.push('## 12. Files Reviewed Outside the Diff', '', ...scope.files_reviewed_outside_diff.map((item) => `- ${item}`));
  if (!scope.files_reviewed_outside_diff.length) out.push('None.');
  out.push('', '## 13. Unverified Areas', '', ...pkg.unverified_areas.map((item) => `- ${item}`));
  if (!pkg.unverified_areas.length) out.push('None.');
  out.push('', '## 14. Required Actions Before Merge', '', ...pkg.required_actions.map((item, index) => `${index + 1}. ${item}`));
  if (!pkg.required_actions.length) out.push('None.');
  out.push('', '## 15. Out-of-Scope Observations', '', ...pkg.out_of_scope_observations.map((item) => `- ${item}`));
  if (!pkg.out_of_scope_observations.length) out.push('None.');
  out.push('', '## 16. Owner-Card Consistency Map', '', '| Technical field | Owner-facing value |', '|---|---|', `| Status / validity | ${OWNER_STATUS} |`, `| Next owner action | ${OWNER_ACTION} |`, `| Projected recipient | ${projection.next_action.recipient} |`, '| Specialist required | no |', '', '## 17. Validation Metadata', '', `- Canonical package SHA-256: \`${canonicalPackageSha256(pkg)}\``, '- Canonicalization: sorted-key compact UTF-8 JSON with LF terminator, version 1', '- Schema: JSON Schema Draft 2020-12', '', '## 18. Final Technical Decision', '', `- Status: \`${decision.technical_status}\``, `- Risk: \`${decision.risk_classification}\``, `- Approval: \`${decision.approval_requirement}\``, `- Validity: \`${identity.review_validity}\``, `- Canonical next action kind: \`${projection.next_action.kind}\``, `- Canonical next action: ${CANONICAL_ACTION}`, '- Legacy `decision.next_required_action`: non-authoritative package context; intentionally omitted from action instructions.', '');
  return out.join('\n');
}

export function buildCanonicalArtifacts(pkg, reviewPackageBytes, ciIdentity) {
  const projection = canonicalGreenProjection(pkg, ciIdentity);
  const artifacts = {
    'DECISION_PROJECTION.json': compactJson(projection),
    'OWNER_DECISION_CARD.fa.md': renderOwnerCard(pkg),
    'TECHNICAL_HANDOFF.en.md': renderTechnicalHandoff(pkg, projection),
    'OWNER_RESULT.fa.txt': OWNER_RESULT,
  };
  const bytes = Object.fromEntries(Object.entries(artifacts).map(([name, text]) => [name, Buffer.from(text, 'utf8')]));
  const manifest = {
    schema_version: 2,
    canonical_review_package: {
      path: 'review-package.json',
      canonical_sha256: canonicalPackageSha256(pkg),
      canonical_hash_scope: 'canonical_sorted_compact_utf8_json',
      file_sha256: sha256(reviewPackageBytes),
      file_hash_scope: 'final_file_bytes',
    },
    decision_projection: { path: 'DECISION_PROJECTION.json', sha256: sha256(bytes['DECISION_PROJECTION.json']), hash_scope: 'final_file_bytes' },
    owner_decision_card: { path: 'OWNER_DECISION_CARD.fa.md', sha256: sha256(bytes['OWNER_DECISION_CARD.fa.md']), hash_scope: 'final_file_bytes' },
    technical_handoff: { path: 'TECHNICAL_HANDOFF.en.md', sha256: sha256(bytes['TECHNICAL_HANDOFF.en.md']), hash_scope: 'final_file_bytes' },
    simple_owner_result: { path: 'OWNER_RESULT.fa.txt', sha256: sha256(bytes['OWNER_RESULT.fa.txt']), hash_scope: 'final_file_bytes' },
    next_action_artifact: { generated: false, path: null, sha256: null, hash_scope: null, action_kind: 'merge_now', recipient: 'none', may_modify_code: false, prompt_kind: null },
  };
  artifacts['artifact-manifest.json'] = compactJson(manifest);
  return { projection, manifest, artifacts };
}

function strictText(raw, name, diagnostics) {
  if (!Buffer.isBuffer(raw)) { diagnostics.push(`PRI-INPUT-002:${name}:not-bytes`); return null; }
  if (raw.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf]))) diagnostics.push(`PRI-CONSIST-003:${name}:BOM`);
  if (raw.includes(0x0d)) diagnostics.push(`PRI-CONSIST-003:${name}:CRLF`);
  let text = null;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(raw); } catch { diagnostics.push(`PRI-CONSIST-003:${name}:UTF8`); }
  if (text !== null && (!text.endsWith('\n') || text.endsWith('\n\n'))) diagnostics.push(`PRI-CONSIST-003:${name}:NEWLINE`);
  return text;
}

export function verifyReviewDirectory({ artifacts, schemas, schemaErrors, context, ciIdentity }) {
  const diagnostics = [];
  const map = new Map();
  for (const item of artifacts || []) {
    const name = item.path.split('/').at(-1);
    if (map.has(name)) diagnostics.push(`PRI-INPUT-003:${name}:duplicate`);
    map.set(name, item);
  }
  for (const name of FIXED_ARTIFACTS) if (!map.has(name)) diagnostics.push(`PRI-CONSIST-001:${name}:missing`);
  if (diagnostics.length) return { diagnostics, hashes: null, projection: null };
  const texts = new Map();
  for (const [name, item] of map) texts.set(name, strictText(item.raw, name, diagnostics));
  let pkg;
  let projection;
  let manifest;
  try { pkg = JSON.parse(texts.get('review-package.json')); } catch { diagnostics.push('PRI-INPUT-002:review-package.json:JSON'); }
  try { projection = JSON.parse(texts.get('DECISION_PROJECTION.json')); } catch { diagnostics.push('PRI-PROJECTION-002:DECISION_PROJECTION.json:JSON'); }
  try { manifest = JSON.parse(texts.get('artifact-manifest.json')); } catch { diagnostics.push('PRI-MANIFEST-001:artifact-manifest.json:JSON'); }
  if (projection?.next_action?.prompt_required === true && !map.has(PROMPT_ARTIFACT)) diagnostics.push(`PRI-CONSIST-001:${PROMPT_ARTIFACT}:missing`);
  if (projection?.next_action?.prompt_required === false && map.has(PROMPT_ARTIFACT)) diagnostics.push(`PRI-CONSIST-002:${PROMPT_ARTIFACT}:unexpected`);
  if (pkg) diagnostics.push(...schemaErrors(schemas.reviewPackage, pkg, 'PR-Inspector/review-package.json'));
  if (projection) diagnostics.push(...schemaErrors(schemas.decisionProjection, projection, 'PR-Inspector/DECISION_PROJECTION.json'));
  if (pkg) diagnostics.push(...greenPackageDiagnostics(pkg, context, ciIdentity));
  if (!pkg || !projection || !manifest || diagnostics.length) return { diagnostics: [...new Set(diagnostics)], hashes: null, projection };
  let expected;
  try { expected = buildCanonicalArtifacts(pkg, map.get('review-package.json').raw, ciIdentity); } catch (error) {
    diagnostics.push(`PRI-PROJECTION-001:${error.message}`);
    return { diagnostics, hashes: null, projection };
  }
  if (JSON.stringify(canonical(projection)) !== JSON.stringify(canonical(expected.projection))) diagnostics.push('PRI-PROJECTION-003:canonical-projection-mismatch');
  const expectedNames = [...FIXED_ARTIFACTS];
  for (const name of expectedNames.filter((item) => item !== 'review-package.json')) {
    const expectedBytes = Buffer.from(expected.artifacts[name], 'utf8');
    if (!map.get(name).raw.equals(expectedBytes)) diagnostics.push(`PRI-CONSIST-001:${name}:byte-drift`);
  }
  if (JSON.stringify(canonical(manifest)) !== JSON.stringify(canonical(expected.manifest))) diagnostics.push('PRI-MANIFEST-001:deterministic-manifest-mismatch');
  for (const [name, item] of map) if (item.sha256 && item.sha256 !== sha256(item.raw)) diagnostics.push(`PRI-MANIFEST-003:${name}:source-hash-mismatch`);
  return {
    diagnostics: [...new Set(diagnostics)],
    projection,
    hashes: {
      canonical_review_package_sha256: canonicalPackageSha256(pkg),
      review_package_file_sha256: sha256(map.get('review-package.json').raw),
      decision_projection_sha256: sha256(map.get('DECISION_PROJECTION.json').raw),
      artifact_manifest_sha256: sha256(map.get('artifact-manifest.json').raw),
      artifact_byte_hashes: Object.fromEntries([...map].sort(([a], [b]) => a.localeCompare(b)).map(([name, item]) => [name, sha256(item.raw)])),
    },
  };
}
