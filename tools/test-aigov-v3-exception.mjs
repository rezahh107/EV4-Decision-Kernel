#!/usr/bin/env node
import {
  aggregateAuthoritativeCi,
  verifyCurrentMainExecution,
  verifyMergeResultPayloads,
  verifyWorkflowDescriptorPayloads,
  AUTHORITATIVE_WORKFLOWS,
  GITHUB_ACTIONS_APP_ID,
} from './lib/aigov-ci-descriptor.mjs';
import { BATCH_A_EXCEPTION, OWNER, PR50_HEAD_SHA, PR50_SCOPE_REVISION, TARGET_REPOSITORY, TARGET_REPOSITORY_ID, V4_PLAN_ID, compareCanonicalTrees, verifyBatchAOneTimeReconciliation, verifyBatchBFinalClosure } from './lib/aigov-v3-closure.mjs';
const TREE = '8a8c83aee95ab36ab59ba128c7710bafedaa2d20';
const baseA = () => ({ repository: TARGET_REPOSITORY, repositoryId: TARGET_REPOSITORY_ID, batchId: 'BATCH_A', prNumber: 49, baseSha: BATCH_A_EXCEPTION.baseSha, headSha: BATCH_A_EXCEPTION.headSha, mergeCommitSha: BATCH_A_EXCEPTION.mergeCommitSha, exceptionPlanId: V4_PLAN_ID, exceptionUseCount: 1, exceptionReusable: false, exceptionPrecedential: false, prMerged: true, mergeMode: 'squash', mergeActor: OWNER, equivalenceMode: 'exact_tree_equality', patchReconstructionSucceeded: null, prHeadTreeSha: TREE, squashCommitTreeSha: TREE, contentEquivalenceVerified: true, mergeAncestorVerified: true, exactHeadCiGreen: true, currentMainValidationGreen: true, coverageStatus: 'not_measurable_pending_external_promotion', coveragePromotionEffect: 'none', productEffect: 'none', productTaskActivation: false, kroad012rStatus: 'historical_non_authoritative', kroad012Status: 'preserved', kroad013Through018Status: 'not_started', historicalIndependentGreenClaimed: false });
function descriptor(expected, event, head) {
  const workflow = { id: Math.floor(Math.random()*100000)+1, name: expected.name, path: expected.path };
  const run = { id: workflow.id+100000, workflow_id: workflow.id, run_attempt: 1, name: expected.name, path: expected.path, event, head_sha: head, status: 'completed', conclusion: 'success', updated_at: '2026-07-16T10:00:00Z', repository: { id: TARGET_REPOSITORY_ID, full_name: TARGET_REPOSITORY } };
  const job = { id: run.id+100000, run_id: run.id, name: expected.checkName, head_sha: head, status: 'completed', conclusion: 'success', completed_at: '2026-07-16T10:00:00Z' };
  const check = { id: job.id, name: expected.checkName, head_sha: head, status: 'completed', conclusion: 'success', app: { id: GITHUB_ACTIONS_APP_ID, slug: 'github-actions', owner: { login: 'github' } } };
  return verifyWorkflowDescriptorPayloads({ repository: TARGET_REPOSITORY, repositoryId: TARGET_REPOSITORY_ID, exactHeadSha: head, event, expected, workflow, runs: [run], allRepositoryRuns: [run], jobs: [job], checkRuns: [check] }).evidence;
}
function validB() {
  const paths = [AUTHORITATIVE_WORKFLOWS.behavioral, AUTHORITATIVE_WORKFLOWS.sequence, AUTHORITATIVE_WORKFLOWS.mvk];
  const descriptors = paths.map((item) => descriptor(item, 'pull_request', PR50_HEAD_SHA));
  const ci = aggregateAuthoritativeCi({ exactHeadSha: PR50_HEAD_SHA, event: 'pull_request', descriptors, requiredPaths: paths.map((item) => item.path) }).evidence;
  const merge = verifyMergeResultPayloads({ pr: { number: 50, merged: true, head: { sha: PR50_HEAD_SHA }, base: { sha: '1'.repeat(40) }, merge_commit_sha: '435add8ee3f3274f781b6e391f11e3262e380c4e', merged_by: { login: OWNER }, merged_at: '2026-07-16T12:00:00Z' }, reviewedHeadSha: PR50_HEAD_SHA, headCommit: { sha: PR50_HEAD_SHA, tree: { sha: '2'.repeat(40) } }, mergeCommit: { sha: '435add8ee3f3274f781b6e391f11e3262e380c4e', tree: { sha: '2'.repeat(40) }, parents: [{ sha: '1'.repeat(40) }] }, headToMain: { status: 'diverged' }, mergeToMain: { status: 'ahead' } }).evidence;
  const mainDescriptor = descriptor(AUTHORITATIVE_WORKFLOWS.main, 'push', '3'.repeat(40));
  const currentMain = verifyCurrentMainExecution({ beforeSha: '3'.repeat(40), afterSha: '3'.repeat(40), eventHeadSha: '3'.repeat(40), descriptor: mainDescriptor }).evidence;
  return { planId: V4_PLAN_ID, batchId: 'BATCH_B', exceptionApplied: false, repository: TARGET_REPOSITORY, repositoryId: TARGET_REPOSITORY_ID, prNumber: 50, headSha: PR50_HEAD_SHA, scopeRevision: PR50_SCOPE_REVISION, exactHeadCiEvidence: ci, reviewEvidence: null, mergeEvidence: merge, currentMainEvidence: currentMain, memory: { coverageStatus: 'not_measurable_pending_external_promotion', coveragePromotionEffect: 'none', coverageCredit: false, productEffect: 'none', externalRepositoryEffect: 'none', kroad012Status: 'preserved', kroad013Through018Status: 'not_started', kroad012rStatus: 'historical_non_authoritative', kroadSupersessionEffect: 'none', recoveryProgramStatus: 'active', krecStatus: 'active', implementationAuthorized: true, readinessClaim: false, historicalIndependentGreenReceiptForPr49: 'not_claimed', pr49ExceptionReusable: false, pr49ExceptionPrecedential: false } };
}
const cases=[]; const rec=(name,pass,diagnostics=[])=>cases.push({name,pass:Boolean(pass),diagnostics});
rec('exact PR49 squash exception passes', verifyBatchAOneTimeReconciliation(baseA()).status === 'pass');
{const x=baseA();x.historicalIndependentGreenClaimed=true;const r=verifyBatchAOneTimeReconciliation(x);rec('historical review fabrication rejected',r.diagnostics.includes('AIGOV_V4_HISTORICAL_REVIEW_FABRICATION_FORBIDDEN'),r.diagnostics);}
rec('missing independent review does not fail Batch B', verifyBatchBFinalClosure(validB()).status === 'pass', verifyBatchBFinalClosure(validB()).diagnostics);
{const x=validB();x.reviewEvidence={reviewed_head_sha:'0'.repeat(40),review_status:'GREEN_TECHNICALLY_READY'};const r=verifyBatchBFinalClosure(x);rec('stale advisory review does not fail',r.status==='pass'&&r.review_status==='stale_advisory',r.diagnostics);}
{const x=validB();x.exactHeadCiEvidence=null;const r=verifyBatchBFinalClosure(x);rec('exact-head CI failure still blocks',r.diagnostics.includes('AIGOV_BATCH_B_EXACT_HEAD_CI_REQUIRED'),r.diagnostics);}
{const x=validB();x.memory.coveragePromotionEffect='measurement_active';const r=verifyBatchBFinalClosure(x);rec('Coverage overclaim still blocks',r.diagnostics.includes('AIGOV_COVERAGE_PROMOTION_FORBIDDEN'),r.diagnostics);}
const baseTree=[{path:'a',mode:'100644',type:'blob',sha:'a'}]; rec('tree byte mismatch remains blocked',compareCanonicalTrees(baseTree,[{...baseTree[0],sha:'b'}]).includes('AIGOV_V4_SQUASH_CHANGED_BYTES_DETECTED'));
const report={suite:'aigov-v4-owner-policy-closure',status:cases.every((x)=>x.pass)?'pass':'fail',cases};console.log(JSON.stringify(report,null,2));if(report.status!=='pass')process.exitCode=1;
