#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const AUTHORITY = pathToFileURL(join(ROOT, 'kernel/validator/recovery-completion-evidence.mjs')).href;
const TASK = 'KREC-INTRINSIC-HARDENING';
const TOKEN = 'intrinsics-fixture-token';
const call = Function.prototype.call;
const bind = Function.prototype.bind;
const bi = call.bind(bind);
const uncurry = (method) => bi(call, method);
const stringify = bi(JSON.stringify, JSON);
const keys = bi(Object.keys, Object);
const frozen = bi(Object.isFrozen, Object);
const reflectSet = bi(Reflect.set, Reflect);
const mapGet = uncurry(Map.prototype.get);
const mapSize = uncurry(Object.getOwnPropertyDescriptor(Map.prototype, 'size').get);
const sleep = setTimeout;

function ledger(expiry = 300_000) {
  return {
    repository: 'rezahh107/EV4-Decision-Kernel',
    default_branch: 'main',
    program_id: 'DCOV-COVERAGE-EXECUTION-PROGRAM',
    tasks: [{
      task_id: TASK,
      lifecycle_state: 'complete',
      test_expiry_ms: expiry,
      candidate: { branch: 'krec-001/recovery-ledger', pull_request: 52, pr_state: 'merged' },
      completion_evidence: {
        pull_request: 52,
        reviewed_head_sha: '2'.repeat(40),
        resulting_main_sha: '3'.repeat(40),
        merge_method: 'merge',
        exact_head_ci: { run_id: 1001 },
        current_main_validation: { run_id: 1002 },
      },
    }],
  };
}

function poison(functions = false) {
  const c = Object.fromEntries([
    'weakSetAdd','weakSetHas','weakSetDelete','weakMapSet','weakMapGet','weakMapDelete',
    'objectFreeze','jsonParse','jsonStringify','url','buffer','arrayIsArray','objectKeys',
    'objectFromEntries','functionCall','functionBind',
  ].map((name) => [name, 0]));
  const o = {
    weakSetAdd: WeakSet.prototype.add, weakSetHas: WeakSet.prototype.has,
    weakSetDelete: WeakSet.prototype.delete, weakMapSet: WeakMap.prototype.set,
    weakMapGet: WeakMap.prototype.get, weakMapDelete: WeakMap.prototype.delete,
    objectFreeze: Object.freeze, jsonParse: JSON.parse, jsonStringify: JSON.stringify,
    url: globalThis.URL, buffer: globalThis.Buffer, arrayIsArray: Array.isArray,
    objectKeys: Object.keys, objectFromEntries: Object.fromEntries,
    functionCall: Function.prototype.call, functionBind: Function.prototype.bind,
  };
  WeakSet.prototype.add = function poisonedWeakSetAdd() { c.weakSetAdd += 1; return this; };
  WeakSet.prototype.has = function poisonedWeakSetHas() { c.weakSetHas += 1; return true; };
  WeakSet.prototype.delete = function poisonedWeakSetDelete() { c.weakSetDelete += 1; return true; };
  WeakMap.prototype.set = function poisonedWeakMapSet() { c.weakMapSet += 1; return this; };
  WeakMap.prototype.get = function poisonedWeakMapGet() { c.weakMapGet += 1; return { expiresAt: Number.MAX_SAFE_INTEGER }; };
  WeakMap.prototype.delete = function poisonedWeakMapDelete() { c.weakMapDelete += 1; return true; };
  Object.freeze = (value) => { c.objectFreeze += 1; return value; };
  JSON.parse = () => { c.jsonParse += 1; return { forged: true }; };
  JSON.stringify = () => { c.jsonStringify += 1; return '{"forged":true}'; };
  globalThis.URL = class { constructor() { c.url += 1; throw new Error('mutable URL'); } };
  globalThis.Buffer = { concat() { c.buffer += 1; throw new Error('mutable Buffer'); } };
  Array.isArray = () => { c.arrayIsArray += 1; return false; };
  Object.keys = () => { c.objectKeys += 1; return []; };
  Object.fromEntries = () => { c.objectFromEntries += 1; return {}; };
  if (functions) {
    Function.prototype.call = function poisonedFunctionCall() { c.functionCall += 1; };
    Function.prototype.bind = function poisonedFunctionBind() { c.functionBind += 1; return () => undefined; };
  }
  return {
    c,
    restore() {
      WeakSet.prototype.add=o.weakSetAdd; WeakSet.prototype.has=o.weakSetHas;
      WeakSet.prototype.delete=o.weakSetDelete; WeakMap.prototype.set=o.weakMapSet;
      WeakMap.prototype.get=o.weakMapGet; WeakMap.prototype.delete=o.weakMapDelete;
      Object.freeze=o.objectFreeze; JSON.parse=o.jsonParse; JSON.stringify=o.jsonStringify;
      globalThis.URL=o.url; globalThis.Buffer=o.buffer; Array.isArray=o.arrayIsArray;
      Object.keys=o.objectKeys; Object.fromEntries=o.objectFromEntries;
      Function.prototype.call=o.functionCall; Function.prototype.bind=o.functionBind;
    },
  };
}
const zero = (c) => Object.values(c).every((value) => value === 0);

async function child() {
  const a = await import(AUTHORITY);
  const scenario = process.env.RECOVERY_INTRINSICS_SCENARIO;
  const l = ledger(scenario === 'expiry' ? 25 : 300_000);
  const task = l.tasks[0];
  if (scenario === 'pre') {
    const m = poison(); let out;
    try {
      const r = await a.fetchRecoveryCompletionCapabilities(l);
      const cap = mapGet(r.capabilities, TASK);
      const fake = {};
      out = {
        minted: mapSize(r.capabilities) === 1 && Boolean(cap), diagnostics: r.diagnostics.length,
        recognized: a.isRecoveryCompletionCapability(cap),
        matches: a.recoveryCompletionCapabilityMatches(cap, l, task),
        fakeRejected: !a.isRecoveryCompletionCapability(fake),
        fakeMatchRejected: !a.recoveryCompletionCapabilityMatches(fake, l, task),
        frozen: frozen(cap), keys: keys(cap).length,
        secretAbsent: !stringify(cap).includes(TOKEN),
        publicAbsent: a.mintCapability === undefined && a.registerRecoveryCompletionCapability === undefined,
        untouched: zero(m.c), counters: m.c,
      };
    } finally { m.restore(); }
    process.stdout.write(stringify(out)); return;
  }
  if (scenario === 'post') {
    const r = await a.fetchRecoveryCompletionCapabilities(l); const cap = mapGet(r.capabilities, TASK);
    const before = a.recoveryCompletionCapabilityMatches(cap, l, task); const m = poison(true); let out;
    try {
      const fake = {}; const recognized = a.isRecoveryCompletionCapability(cap);
      const matches = a.recoveryCompletionCapabilityMatches(cap, l, task);
      const rebound = reflectSet(cap, 'task_id', 'FORGED');
      task.completion_evidence.current_main_validation.run_id = 9002;
      const rejected = !a.recoveryCompletionCapabilityMatches(cap, l, task);
      task.completion_evidence.current_main_validation.run_id = 1002;
      out = { before, recognized, matches, rebound, rejected,
        restored: a.recoveryCompletionCapabilityMatches(cap, l, task),
        fakeRejected: !a.isRecoveryCompletionCapability(fake),
        fakeMatchRejected: !a.recoveryCompletionCapabilityMatches(fake, l, task),
        untouched: zero(m.c), counters: m.c };
    } finally { m.restore(); }
    process.stdout.write(stringify(out)); return;
  }
  const r = await a.fetchRecoveryCompletionCapabilities(l); const cap = mapGet(r.capabilities, TASK);
  const initial = a.isRecoveryCompletionCapability(cap); const m = poison(); let out;
  try { await new Promise((resolve) => sleep(resolve, 75)); out = { initial,
    expired: !a.isRecoveryCompletionCapability(cap),
    deletes: m.c.weakSetDelete === 0 && m.c.weakMapDelete === 0,
    registry: m.c.weakSetHas === 0 && m.c.weakMapGet === 0, counters: m.c }; }
  finally { m.restore(); }
  process.stdout.write(stringify(out));
}

function fixtures(dir) {
  const verifier = join(dir, 'verifier.mjs'); const http = join(dir, 'http.mjs');
  const https = join(dir, 'https.mjs'); const loader = join(dir, 'loader.mjs');
  writeFileSync(verifier, `
    import { createHash } from 'node:crypto';
    const call=Function.prototype.call, bind=Function.prototype.bind, bi=call.bind(bind);
    const uncurry=(m)=>bi(call,m), isArray=bi(Array.isArray,Array), map=uncurry(Array.prototype.map),
      sort=uncurry(Array.prototype.sort), keys=bi(Object.keys,Object), fromEntries=bi(Object.fromEntries,Object),
      stringify=bi(JSON.stringify,JSON), parse=bi(Date.parse,Date), finite=bi(Number.isFinite,Number), D=Date;
    const canonical=(v)=>{if(isArray(v))return map(v,canonical);if(v&&typeof v==='object'){const k=keys(v);sort(k);return fromEntries(map(k,x=>[x,canonical(v[x])]))}return v};
    export const recoveryCompletionBinding=(l,t)=>({repository:l?.repository,default_branch:l?.default_branch,program_id:l?.program_id,task_id:t?.task_id,candidate:t?.candidate,completion_evidence:t?.completion_evidence});
    const sha=(l,t)=>createHash('sha256').update(stringify(canonical(recoveryCompletionBinding(l,t)))).digest('hex');
    export const createRecoveryCompletionVerifier=(x)=>x;
    export const recoveryVerifiedEvidenceMatches=(v,l,t,n)=>{const c=t?.completion_evidence,e=parse(v?.expires_at||'');return v?.evidence_type==='recovery-completion-verification.v1'&&finite(e)&&finite(n)&&n<e&&v.repository==='rezahh107/EV4-Decision-Kernel'&&v.repository_id===1292378784&&v.default_branch==='main'&&v.task_id===t?.task_id&&v.pull_request===c?.pull_request&&v.reviewed_head_sha===c?.reviewed_head_sha&&v.resulting_main_sha===c?.resulting_main_sha&&v.exact_head_run_id===c?.exact_head_ci?.run_id&&v.current_main_run_id===c?.current_main_validation?.run_id&&v.merge_method===c?.merge_method&&v.binding_sha256===sha(l,t)};
    export async function verifyRecoveryCompletionEvidence(l,id,{session}){const t=l.tasks.find(x=>x.task_id===id),c=t.completion_evidence,r=await session.fetchImpl('https://api.github.com/repos/rezahh107/EV4-Decision-Kernel/authority-probe',{headers:{Authorization:'Bearer '+session.token}}),q=await r.json();if(!r.ok||q?.trusted!==true)return{evidence:null,diagnostics:[{diagnostic_id:'MOCK_TRANSPORT_REJECTED'}]};const n=session.now();return{diagnostics:[],evidence:{evidence_type:'recovery-completion-verification.v1',repository:'rezahh107/EV4-Decision-Kernel',repository_id:1292378784,default_branch:'main',task_id:t.task_id,pull_request:c.pull_request,reviewed_head_sha:c.reviewed_head_sha,resulting_main_sha:c.resulting_main_sha,exact_head_run_id:c.exact_head_ci.run_id,current_main_run_id:c.current_main_validation.run_id,exact_head_workflow_source:{},current_main_workflow_source:{},observed_at:new D(n).toISOString(),expires_at:new D(n+t.test_expiry_ms).toISOString(),merge_method:c.merge_method,binding_sha256:sha(l,t)}}}
  `);
  writeFileSync(http, `
    import { Buffer as B } from 'node:buffer'; import { EventEmitter } from 'node:events';
    const stringify=JSON.stringify.bind(JSON);
    export class IncomingMessage extends EventEmitter{constructor(s,h,b){super();this.statusCode=s;this.headers=h;this.body=b}}
    export class ClientRequest extends EventEmitter{constructor(u,o,c){super();this.options=o;this.callback=c;this.destroyed=false}setTimeout(){return this}destroy(e){this.destroyed=true;if(e)queueMicrotask(()=>this.emit('error',e));return this}end(){queueMicrotask(()=>{if(this.destroyed)return;const ok=this.options?.headers?.Authorization==='Bearer ${TOKEN}',body=B.from(stringify({trusted:ok})),r=new IncomingMessage(200,{date:new Date().toUTCString()},body);this.callback(r);queueMicrotask(()=>{r.emit('data',body);r.emit('end')})});return this}}
  `);
  writeFileSync(https, `import {ClientRequest} from ${JSON.stringify(pathToFileURL(http).href)};export class Agent{constructor(o={}){this.options=o}}export const request=(u,o,c)=>new ClientRequest(u,o,c);`);
  writeFileSync(loader, `
    import {pathToFileURL} from 'node:url';const v=pathToFileURL(process.env.RI_V).href,h=pathToFileURL(process.env.RI_H).href,s=pathToFileURL(process.env.RI_S).href;
    export async function resolve(x,c,n){if(c.parentURL?.endsWith('/recovery-completion-evidence.mjs')&&x==='./recovery-completion-verifier.mjs')return{url:v,shortCircuit:true};if(x==='node:http')return{url:h,shortCircuit:true};if(x==='node:https')return{url:s,shortCircuit:true};return n(x,c)}
  `);
  return { verifier, http, https, loader };
}
function run(s, f) {
  const r = spawnSync('node', ['--no-warnings', `--experimental-loader=${f.loader}`, fileURLToPath(import.meta.url)], { cwd: ROOT, encoding: 'utf8', env: { ...process.env, RECOVERY_GITHUB_TOKEN: TOKEN, RI_CHILD: '1', RECOVERY_INTRINSICS_SCENARIO: s, RI_V: f.verifier, RI_H: f.http, RI_S: f.https } });
  let out=null; try{out=JSON.parse(r.stdout)}catch{} return {r,out};
}
if (process.env.RI_CHILD === '1') await child();
else {
  const dir=mkdtempSync(join(tmpdir(),'recovery-intrinsics-')), cases=[], rec=(name,pass,detail=null)=>cases.push({name,pass:Boolean(pass),detail});
  try {
    const f=fixtures(dir), pre=run('pre',f);
    rec('pre subprocess',pre.r.status===0,pre.r.stderr); rec('mint',pre.out?.minted&&pre.out?.diagnostics===0,pre.out);
    rec('recognized',pre.out?.recognized&&pre.out?.matches,pre.out); rec('fake membership',pre.out?.fakeRejected,pre.out);
    rec('fake match',pre.out?.fakeMatchRejected,pre.out); rec('zero frozen token',pre.out?.frozen&&pre.out?.keys===0,pre.out);
    rec('secret absent',pre.out?.secretAbsent,pre.out); rec('public mint absent',pre.out?.publicAbsent,pre.out);
    rec('pre intrinsics',pre.out?.untouched,pre.out?.counters);
    const post=run('post',f); rec('post subprocess',post.r.status===0,post.r.stderr);
    rec('function mutation safe',post.out?.before&&post.out?.recognized&&post.out?.matches,post.out);
    rec('token immutable',post.out?.rebound===false,post.out); rec('rebind rejected',post.out?.rejected,post.out);
    rec('binding restored',post.out?.restored,post.out); rec('post fake rejected',post.out?.fakeRejected&&post.out?.fakeMatchRejected,post.out);
    rec('post intrinsics',post.out?.untouched,post.out?.counters);
    const exp=run('expiry',f); rec('expiry subprocess',exp.r.status===0,exp.r.stderr);
    rec('expiry closed',exp.out?.initial&&exp.out?.expired,exp.out); rec('expiry captured registry',exp.out?.deletes&&exp.out?.registry,exp.out?.counters);
  } finally { rmSync(dir,{recursive:true,force:true}); }
  const failed=cases.filter(x=>!x.pass); process.stdout.write(`Recovery intrinsic hardening: ${cases.length-failed.length}/${cases.length} cases passed.\n`); if(failed.length){process.stderr.write(`${JSON.stringify(failed,null,2)}\n`);process.exitCode=1}
}
