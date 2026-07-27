import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import YAML from 'yaml';

const CONTROL_FILES = new Set(['00-MANIFEST.yaml', 'SHA256SUMS.txt']);
const EXPECTED_FOUNDATION = Object.freeze({
  bundle_id: 'EV4-PCVP-ACTIVE-BUNDLE',
  bundle_version: '1.0.0',
  normative_policy_id: 'EV4-PCVP',
  normative_policy_version: '1.0.0',
  bundle_status: 'release_candidate',
  adoption_status: 'not_yet_adopted',
});

function sha256Bytes(value) {
  return createHash('sha256').update(value).digest('hex');
}

function readBytes(file) {
  return readFileSync(file);
}

function readText(file) {
  return readFileSync(file, 'utf8');
}

function readJson(file) {
  return JSON.parse(readText(file));
}

function walkFiles(root, current = root) {
  const results = [];
  for (const entry of readdirSync(current, { withFileTypes: true })) {
    const resolved = path.join(current, entry.name);
    if (entry.isDirectory()) results.push(...walkFiles(root, resolved));
    else if (entry.isFile()) results.push(path.relative(root, resolved).split(path.sep).join('/'));
  }
  return results.sort();
}

function diagnostic(layer, code, subject, detail) {
  return { layer, code, subject, detail };
}

function unique(values) {
  return [...new Set(values)];
}

function crossRecordAndSemanticDiagnostics(document) {
  const carrier = document.continuation_assurance;
  const claims = carrier.claims;
  const effects = carrier.effects;
  const authorizations = carrier.authorizations;
  const summary = carrier.stage_summary;
  const crossRecord = [];
  const semanticPolicy = [];

  const claimsById = new Map(claims.map((item) => [item.claim_id, item]));
  const effectsById = new Map(effects.map((item) => [item.effect_id, item]));
  const authorizationsById = new Map(authorizations.map((item) => [item.authorization_id, item]));
  const allIds = [
    ...claims.map((item) => item.claim_id),
    ...effects.map((item) => item.effect_id),
    ...authorizations.map((item) => item.authorization_id),
  ];

  if (unique(allIds).length !== allIds.length) {
    crossRecord.push(diagnostic('CROSS_RECORD', 'PCVP_ID_NOT_GLOBALLY_UNIQUE', 'continuation_assurance', 'Claim, Effect and Authorization identifiers must be globally unique within the carrier.'));
  }

  for (const effect of effects) {
    for (const claimId of effect.depends_on_claim_ids) {
      if (!claimsById.has(claimId)) {
        crossRecord.push(diagnostic('CROSS_RECORD', 'PCVP_EFFECT_CLAIM_REF_UNRESOLVED', effect.effect_id, claimId));
      }
    }

    const authorization = effect.authorization_ref === null
      ? null
      : authorizationsById.get(effect.authorization_ref);

    if (effect.authorization_ref !== null && !authorization) {
      crossRecord.push(diagnostic('CROSS_RECORD', 'PCVP_EFFECT_AUTH_REF_UNRESOLVED', effect.effect_id, effect.authorization_ref));
    }

    if (authorization) {
      if (authorization.status !== 'ACTIVE') {
        crossRecord.push(diagnostic('CROSS_RECORD', 'PCVP_EFFECT_AUTH_NOT_ACTIVE', effect.effect_id, authorization.authorization_id));
      }
      const covered = authorization.allowed_effect_ids.includes(effect.effect_id)
        || authorization.allowed_effect_classes.includes(effect.effect_class);
      if (!covered) {
        crossRecord.push(diagnostic('CROSS_RECORD', 'PCVP_EFFECT_AUTH_NOT_COVERING', effect.effect_id, authorization.authorization_id));
      }
      if (authorization.permitted_scope !== effect.permitted_scope) {
        crossRecord.push(diagnostic('CROSS_RECORD', 'PCVP_EFFECT_AUTH_SCOPE_MISMATCH', effect.effect_id, authorization.authorization_id));
      }
      if (
        authorization.basis === 'SAFE_REVERSIBLE_DEFAULT'
        && ['EXTERNAL_MUTATION', 'IRREVERSIBLE_OR_AUTHORITY_BEARING'].includes(effect.effect_class)
      ) {
        semanticPolicy.push(diagnostic('SEMANTIC_POLICY', 'PCVP_SAFE_DEFAULT_FORBIDDEN_EFFECT', effect.effect_id, effect.effect_class));
      }
    }

    const dependentClaims = effect.depends_on_claim_ids
      .map((claimId) => claimsById.get(claimId))
      .filter(Boolean);
    const contradictedCritical = dependentClaims.some((claim) => (
      claim.criticality === 'CRITICAL'
      && claim.applicability_state === 'APPLICABLE'
      && claim.verification_state === 'CONTRADICTED'
    ));
    if (contradictedCritical && effect.continuation_state !== 'BLOCKED') {
      semanticPolicy.push(diagnostic('SEMANTIC_POLICY', 'PCVP_CONTRADICTED_CRITICAL_EFFECT_NOT_BLOCKED', effect.effect_id, effect.continuation_state));
    }
  }

  const currentEffect = effectsById.get(summary.current_effect_id);
  if (!currentEffect) {
    crossRecord.push(diagnostic('CROSS_RECORD', 'PCVP_SUMMARY_EFFECT_REF_UNRESOLVED', 'stage_summary', summary.current_effect_id));
    return { crossRecord, semanticPolicy };
  }

  const currentDependencies = new Set(currentEffect.depends_on_claim_ids);
  for (const claimId of summary.derived_from_claim_ids) {
    if (!claimsById.has(claimId)) {
      crossRecord.push(diagnostic('CROSS_RECORD', 'PCVP_SUMMARY_CLAIM_REF_UNRESOLVED', 'stage_summary', claimId));
    } else if (!currentDependencies.has(claimId)) {
      crossRecord.push(diagnostic('CROSS_RECORD', 'PCVP_SUMMARY_CLAIM_NOT_EFFECT_DEPENDENCY', 'stage_summary', claimId));
    }
  }

  const dependentClaims = currentEffect.depends_on_claim_ids
    .map((claimId) => claimsById.get(claimId))
    .filter(Boolean);
  const criticalContradicted = dependentClaims.some((claim) => (
    claim.criticality === 'CRITICAL'
    && claim.applicability_state === 'APPLICABLE'
    && claim.verification_state === 'CONTRADICTED'
  ));
  const anyContradicted = dependentClaims.some((claim) => claim.verification_state === 'CONTRADICTED');
  const criticalApplicableNotVerified = dependentClaims.some((claim) => (
    claim.criticality === 'CRITICAL'
    && claim.applicability_state === 'APPLICABLE'
    && claim.verification_state !== 'VERIFIED'
  ));
  const materialApplicabilityUndetermined = dependentClaims.some((claim) => (
    ['CRITICAL', 'MATERIAL'].includes(claim.criticality)
    && claim.applicability_state === 'UNDETERMINED'
  ));
  const applicableUnverified = dependentClaims.some((claim) => (
    claim.applicability_state === 'APPLICABLE'
    && claim.verification_state === 'UNVERIFIED'
  ));

  if (summary.owner_projection === 'GREEN') {
    if (
      currentEffect.continuation_state !== 'CONTINUE'
      || criticalApplicableNotVerified
      || anyContradicted
      || materialApplicabilityUndetermined
    ) {
      semanticPolicy.push(diagnostic('SEMANTIC_POLICY', 'PCVP_GREEN_PROJECTION_INVALID', 'stage_summary', currentEffect.effect_id));
    }
  }

  if (summary.owner_projection === 'YELLOW') {
    const expectedSubstate = currentEffect.continuation_state === 'CONTINUE'
      ? 'CONTINUATION_AVAILABLE'
      : currentEffect.continuation_state === 'AUTHORIZATION_REQUIRED'
        ? 'OWNER_CHOICE_REQUIRED'
        : null;
    if (
      expectedSubstate === null
      || summary.yellow_substate !== expectedSubstate
      || (!applicableUnverified && currentEffect.continuation_state !== 'AUTHORIZATION_REQUIRED')
      || criticalContradicted
    ) {
      semanticPolicy.push(diagnostic('SEMANTIC_POLICY', 'PCVP_YELLOW_PROJECTION_INVALID', 'stage_summary', currentEffect.effect_id));
    }
  }

  if (
    summary.owner_projection === 'RED'
    && currentEffect.continuation_state !== 'BLOCKED'
  ) {
    semanticPolicy.push(diagnostic('SEMANTIC_POLICY', 'PCVP_RED_WITH_NON_BLOCKED_EFFECT', 'stage_summary', currentEffect.effect_id));
  }

  if (
    (currentEffect.continuation_state === 'BLOCKED' || criticalContradicted)
    && summary.owner_projection !== 'RED'
  ) {
    semanticPolicy.push(diagnostic('SEMANTIC_POLICY', 'PCVP_REQUIRED_RED_PROJECTION_MISSING', 'stage_summary', currentEffect.effect_id));
  }

  return { crossRecord, semanticPolicy };
}

function buildCarrierValidator(bundleRoot) {
  const schemaRoot = path.join(bundleRoot, '04-SCHEMAS');
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  for (const name of ['claim.schema.json', 'effect.schema.json', 'authorization.schema.json']) {
    ajv.addSchema(readJson(path.join(schemaRoot, name)));
  }
  return ajv.compile(readJson(path.join(schemaRoot, 'handoff.schema.json')));
}

export function evaluatePcvpCarrier(document, validateCarrier) {
  const schemaAccepted = validateCarrier(document);
  if (!schemaAccepted) {
    return {
      observed_layer: 'JSON_SCHEMA',
      accepted: false,
      diagnostics: (validateCarrier.errors ?? []).map((error) => diagnostic(
        'JSON_SCHEMA',
        `PCVP_SCHEMA_${String(error.keyword).toUpperCase()}`,
        error.instancePath || '/',
        error.message ?? 'schema validation failed',
      )),
    };
  }

  const { crossRecord, semanticPolicy } = crossRecordAndSemanticDiagnostics(document);
  if (crossRecord.length) {
    return { observed_layer: 'CROSS_RECORD', accepted: false, diagnostics: crossRecord };
  }
  if (semanticPolicy.length) {
    return { observed_layer: 'SEMANTIC_POLICY', accepted: false, diagnostics: semanticPolicy };
  }
  return { observed_layer: 'ACCEPT', accepted: true, diagnostics: [] };
}

export function validatePcvpBundle(bundleRoot) {
  const diagnostics = [];
  const manifestPath = path.join(bundleRoot, '00-MANIFEST.yaml');
  const sumsPath = path.join(bundleRoot, 'SHA256SUMS.txt');
  const manifest = YAML.parse(readText(manifestPath));
  const actualFiles = walkFiles(bundleRoot);
  const actualSet = new Set(actualFiles);
  const declaredEntries = manifest.files ?? [];
  const declaredPaths = declaredEntries.map((entry) => entry.path);
  const declaredSet = new Set(declaredPaths);

  for (const [key, expected] of Object.entries(EXPECTED_FOUNDATION)) {
    if (manifest.bundle?.[key] !== expected) {
      diagnostics.push(diagnostic('BUNDLE_INTEGRITY', 'PCVP_MANIFEST_IDENTITY_MISMATCH', `bundle.${key}`, `expected ${expected}`));
    }
  }

  for (const file of declaredPaths) {
    if (!actualSet.has(file)) diagnostics.push(diagnostic('BUNDLE_INTEGRITY', 'PCVP_DECLARED_FILE_MISSING', file, 'missing'));
  }
  for (const file of actualFiles) {
    if (!declaredSet.has(file) && !CONTROL_FILES.has(file)) {
      diagnostics.push(diagnostic('BUNDLE_INTEGRITY', 'PCVP_UNDECLARED_FILE', file, 'not present in manifest inventory'));
    }
  }

  for (const entry of declaredEntries) {
    const file = path.join(bundleRoot, entry.path);
    if (!actualSet.has(entry.path)) continue;
    const bytes = readBytes(file);
    if (bytes.length !== entry.size_bytes) {
      diagnostics.push(diagnostic('BUNDLE_INTEGRITY', 'PCVP_DECLARED_SIZE_MISMATCH', entry.path, `${bytes.length} != ${entry.size_bytes}`));
    }
    const observedHash = sha256Bytes(bytes);
    if (observedHash !== entry.sha256) {
      diagnostics.push(diagnostic('BUNDLE_INTEGRITY', 'PCVP_DECLARED_HASH_MISMATCH', entry.path, `${observedHash} != ${entry.sha256}`));
    }
  }

  const sums = new Map();
  for (const [index, line] of readText(sumsPath).trimEnd().split(/\r?\n/u).entries()) {
    const match = /^([0-9a-f]{64})  (.+)$/u.exec(line);
    if (!match) {
      diagnostics.push(diagnostic('BUNDLE_INTEGRITY', 'PCVP_CHECKSUM_LINE_MALFORMED', 'SHA256SUMS.txt', String(index + 1)));
      continue;
    }
    sums.set(match[2], match[1]);
  }
  for (const file of actualFiles.filter((item) => item !== 'SHA256SUMS.txt')) {
    if (!sums.has(file)) {
      diagnostics.push(diagnostic('BUNDLE_INTEGRITY', 'PCVP_CHECKSUM_ENTRY_MISSING', file, 'not covered'));
      continue;
    }
    const observedHash = sha256Bytes(readBytes(path.join(bundleRoot, file)));
    if (sums.get(file) !== observedHash) {
      diagnostics.push(diagnostic('BUNDLE_INTEGRITY', 'PCVP_CHECKSUM_MISMATCH', file, `${observedHash} != ${sums.get(file)}`));
    }
  }
  for (const file of sums.keys()) {
    if (!actualSet.has(file)) diagnostics.push(diagnostic('BUNDLE_INTEGRITY', 'PCVP_CHECKSUM_TARGET_MISSING', file, 'missing'));
  }
  if (!sums.has('00-MANIFEST.yaml')) {
    diagnostics.push(diagnostic('BUNDLE_INTEGRITY', 'PCVP_MANIFEST_NOT_CHECKSUM_COVERED', '00-MANIFEST.yaml', 'missing SHA256SUMS entry'));
  }

  for (const file of actualFiles.filter((item) => item.endsWith('.yaml'))) {
    try {
      YAML.parse(readText(path.join(bundleRoot, file)));
    } catch (error) {
      diagnostics.push(diagnostic('PARSE', 'PCVP_YAML_PARSE_FAILED', file, error.message));
    }
  }
  for (const file of actualFiles.filter((item) => item.endsWith('.json'))) {
    try {
      readJson(path.join(bundleRoot, file));
    } catch (error) {
      diagnostics.push(diagnostic('PARSE', 'PCVP_JSON_PARSE_FAILED', file, error.message));
    }
  }

  let validateCarrier;
  try {
    validateCarrier = buildCarrierValidator(bundleRoot);
  } catch (error) {
    diagnostics.push(diagnostic('SCHEMA', 'PCVP_SCHEMA_COMPILE_FAILED', '04-SCHEMAS', error.message));
  }

  const fixtureResults = [];
  if (validateCarrier) {
    const fixtureIndex = YAML.parse(readText(path.join(bundleRoot, '05-FIXTURES/fixture-index.yaml'))).fixture_suite;
    for (const group of ['valid', 'invalid']) {
      for (const fixture of fixtureIndex[group]) {
        const fixturePath = path.join(bundleRoot, '05-FIXTURES', fixture.file);
        if (!statSync(fixturePath).isFile()) {
          diagnostics.push(diagnostic('FIXTURE', 'PCVP_INDEXED_FIXTURE_MISSING', fixture.file, group));
          continue;
        }
        const result = evaluatePcvpCarrier(readJson(fixturePath), validateCarrier);
        const passed = group === 'valid'
          ? result.observed_layer === 'ACCEPT'
          : fixture.expected === 'REJECT' && result.observed_layer === fixture.layer;
        fixtureResults.push({
          file: fixture.file,
          expected: fixture.expected,
          declared_layer: fixture.layer ?? null,
          observed_layer: result.observed_layer,
          passed,
          diagnostics: result.diagnostics,
        });
        if (!passed) {
          diagnostics.push(diagnostic('FIXTURE', 'PCVP_FIXTURE_WRONG_RESULT', fixture.file, `${result.observed_layer} != ${fixture.layer ?? 'ACCEPT'}`));
        }
      }
    }
  }

  return {
    result: diagnostics.length ? 'FAIL' : 'PASS',
    bundle: manifest.bundle,
    inventory: {
      declared_files: declaredPaths.length,
      observed_files_including_controls: actualFiles.length,
      checksum_entries: sums.size,
    },
    fixtures: {
      total: fixtureResults.length,
      valid: fixtureResults.filter((item) => item.expected === 'ACCEPT').length,
      invalid: fixtureResults.filter((item) => item.expected === 'REJECT').length,
      all_passed_at_declared_layer: fixtureResults.every((item) => item.passed),
      results: fixtureResults,
    },
    diagnostics,
    validateCarrier,
  };
}

export function sha256Text(value) {
  return sha256Bytes(Buffer.from(value, 'utf8'));
}
