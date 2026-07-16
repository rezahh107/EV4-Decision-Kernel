#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { ownerPolicyReviewObservation } from './lib/pr-inspector-v1102.mjs';
import { recoveryProgramDiagnostics } from '../kernel/validator/validate-recovery-execution-program.mjs';
const results=[]; const record=(name,pass,diagnostics=[])=>results.push({name,pass:Boolean(pass),diagnostics});
const policy=JSON.parse(readFileSync('kernel/decision-governance/aigov-repository-policy.v1.json','utf8'));
record('mandatory independent review removed repository-wide', policy.authority.independent_review_required===false && policy.authority.independent_exact_head_review==='optional_advisory');
const missing=ownerPolicyReviewObservation();
record('missing review is explicitly not required', missing.required===false && missing.status==='not_required_by_owner_policy' && missing.merge_authority===false);
const stale=ownerPolicyReviewObservation({reviewed_head_sha:'0'.repeat(40),reviewed_scope_revision:`sha256:${'1'.repeat(64)}`,review_status:'GREEN_TECHNICALLY_READY',provenance:'external'}, {headSha:'2'.repeat(40),scopeRevision:`sha256:${'3'.repeat(64)}`});
record('stale review remains advisory and grants no Merge authority', stale.status==='stale_advisory' && stale.merge_authority===false);
record('owner policy cannot fabricate GREEN_TECHNICALLY_READY', missing.technical_status == null);
const closureSource=readFileSync('tools/lib/aigov-v3-closure.mjs','utf8');
for (const code of ['AIGOV_BATCH_B_REVIEW_REQUIRED','AIGOV_BATCH_B_REVIEW_STALE','AIGOV_BATCH_B_REVIEW_PROVENANCE_UNVERIFIED','AIGOV_BATCH_B_REVIEW_SEQUENCE_INVALID']) record(`${code} removed from active closure`, !closureSource.includes(code));
const finalizer=readFileSync('.github/workflows/finalize-aigov-batch-b.yml','utf8');
record('post-Merge finalizer uses owner-policy verifier without PR Inspector checkout', finalizer.includes('--mode batch-b-final') && !finalizer.includes('Checkout pinned PR Inspector'));
const sequenceWorkflow=readFileSync('.github/workflows/validate-rereview-sequence.yml','utf8');
record('stable sequence check is now owner-policy validation', sequenceWorkflow.includes('Validate owner policy and remaining Merge gates') && !sequenceWorkflow.includes('validate_rereview_sequence.py'));
const recovery=JSON.parse(readFileSync('planning/recovery/recovery-execution-program.v1.json','utf8'));
record('full Recovery activation passes', recoveryProgramDiagnostics(recovery).length===0, recoveryProgramDiagnostics(recovery));
{const x=structuredClone(recovery);x.kroad_supersession_effect='superseded';const d=recoveryProgramDiagnostics(x);record('KROAD mutation still blocks',d.includes('RECOVERY_KROAD_SUPERSESSION_FORBIDDEN'),d);}
{const x=structuredClone(recovery);x.tasks[0].coverage_credit=true;const d=recoveryProgramDiagnostics(x);record('Coverage overclaim still blocks',d.includes('RECOVERY_COVERAGE_CREDIT_FORBIDDEN'),d);}
{const x=structuredClone(recovery);x.tasks[1].status='complete';const d=recoveryProgramDiagnostics(x);record('premature task completion still blocks',d.includes('RECOVERY_COMPLETE_TASK_DEPENDENCY_INCOMPLETE'),d);}
const report={suite:'aigov-v4-owner-policy-hardening',status:results.every((item)=>item.pass)?'pass':'fail',cases:results};console.log(JSON.stringify(report,null,2));if(report.status!=='pass')process.exitCode=1;
