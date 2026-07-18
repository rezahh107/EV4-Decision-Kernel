import { Buffer as NodeBuffer } from 'node:buffer';
import { createHash as nodeCreateHash } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { ClientRequest } from 'node:http';

const intrinsicCall = Function.prototype.call;
const intrinsicBind = Function.prototype.bind;
const bindIntrinsic = intrinsicCall.bind(intrinsicBind);
const uncurryThis = (method) => bindIntrinsic(intrinsicCall, method);

const objectFreeze = bindIntrinsic(Object.freeze, Object);
const objectCreate = bindIntrinsic(Object.create, Object);
const objectDefineProperty = bindIntrinsic(Object.defineProperty, Object);
const objectKeys = bindIntrinsic(Object.keys, Object);
const objectValues = bindIntrinsic(Object.values, Object);
const objectFromEntries = bindIntrinsic(Object.fromEntries, Object);
const objectHasOwn = bindIntrinsic(Object.hasOwn, Object);
const objectGetOwnPropertyDescriptor = bindIntrinsic(Object.getOwnPropertyDescriptor, Object);
const jsonParse = bindIntrinsic(JSON.parse, JSON);
const jsonStringify = bindIntrinsic(JSON.stringify, JSON);
const arrayIsArray = bindIntrinsic(Array.isArray, Array);
const numberIsFinite = bindIntrinsic(Number.isFinite, Number);
const numberIsInteger = bindIntrinsic(Number.isInteger, Number);
const mathMin = bindIntrinsic(Math.min, Math);
const mathAbs = bindIntrinsic(Math.abs, Math);
const mathMax = bindIntrinsic(Math.max, Math);
const promiseAll = bindIntrinsic(Promise.all, Promise);

const arrayMap = uncurryThis(Array.prototype.map);
const arrayFilter = uncurryThis(Array.prototype.filter);
const arrayFind = uncurryThis(Array.prototype.find);
const arrayFindIndex = uncurryThis(Array.prototype.findIndex);
const arraySome = uncurryThis(Array.prototype.some);
const arrayIncludes = uncurryThis(Array.prototype.includes);
const arrayPush = uncurryThis(Array.prototype.push);
const arraySort = uncurryThis(Array.prototype.sort);
const arrayJoin = uncurryThis(Array.prototype.join);
const arrayAt = uncurryThis(Array.prototype.at);
const arraySlice = uncurryThis(Array.prototype.slice);
const arrayFlatMap = uncurryThis(Array.prototype.flatMap);

const mapGet = uncurryThis(Map.prototype.get);
const mapSet = uncurryThis(Map.prototype.set);
const mapDelete = uncurryThis(Map.prototype.delete);
const mapClear = uncurryThis(Map.prototype.clear);
const mapForEach = uncurryThis(Map.prototype.forEach);
const mapHas = uncurryThis(Map.prototype.has);
const mapSize = uncurryThis(objectGetOwnPropertyDescriptor(Map.prototype, 'size').get);
const setAdd = uncurryThis(Set.prototype.add);
const setHas = uncurryThis(Set.prototype.has);
const setSize = uncurryThis(objectGetOwnPropertyDescriptor(Set.prototype, 'size').get);
const weakMapGet = uncurryThis(WeakMap.prototype.get);
const weakMapSet = uncurryThis(WeakMap.prototype.set);
const weakMapDelete = uncurryThis(WeakMap.prototype.delete);
const weakSetAdd = uncurryThis(WeakSet.prototype.add);
const weakSetHas = uncurryThis(WeakSet.prototype.has);
const weakSetDelete = uncurryThis(WeakSet.prototype.delete);

const stringReplaceAll = uncurryThis(String.prototype.replaceAll);
const stringSplit = uncurryThis(String.prototype.split);
const stringTrim = uncurryThis(String.prototype.trim);
const stringTrimEnd = uncurryThis(String.prototype.trimEnd);
const stringToLowerCase = uncurryThis(String.prototype.toLowerCase);
const stringStartsWith = uncurryThis(String.prototype.startsWith);
const stringIncludes = uncurryThis(String.prototype.includes);
const stringAt = uncurryThis(String.prototype.at);
const stringCharCodeAt = uncurryThis(String.prototype.charCodeAt);
const regexpTest = uncurryThis(RegExp.prototype.test);

const bufferIsBuffer = bindIntrinsic(NodeBuffer.isBuffer, NodeBuffer);
const bufferFrom = bindIntrinsic(NodeBuffer.from, NodeBuffer);
const bufferConcat = bindIntrinsic(NodeBuffer.concat, NodeBuffer);
const bufferToString = uncurryThis(NodeBuffer.prototype.toString);
const eventOn = uncurryThis(EventEmitter.prototype.on);
const clientRequestSetTimeout = uncurryThis(ClientRequest.prototype.setTimeout);
const clientRequestEnd = uncurryThis(ClientRequest.prototype.end);
const clientRequestDestroy = uncurryThis(ClientRequest.prototype.destroy);

const NativeDate = globalThis.Date;
const dateParse = bindIntrinsic(NativeDate.parse, NativeDate);
const dateNow = bindIntrinsic(NativeDate.now, NativeDate);
const dateToISOString = uncurryThis(NativeDate.prototype.toISOString);
const TrustedString = String;
const TrustedBoolean = Boolean;
const TrustedError = Error;
const TrustedTypeError = TypeError;
const TrustedMap = Map;
const TrustedSet = Set;
const TrustedWeakMap = WeakMap;
const TrustedWeakSet = WeakSet;
const TrustedPromise = Promise;
const TrustedRegExp = RegExp;
const trustedEncodeURIComponent = encodeURIComponent;

const canonical = (value) => {
  if (arrayIsArray(value)) return arrayMap(value, canonical);
  if (value && typeof value === 'object') {
    const keys = objectKeys(value);
    arraySort(keys);
    return objectFromEntries(arrayMap(keys, (key) => [key, canonical(value[key])]));
  }
  return value;
};

const canonicalSha256 = (value) => nodeCreateHash('sha256')
  .update(jsonStringify(canonical(value)))
  .digest('hex');

export const recoveryPrimordials = objectFreeze({
  intrinsicCall,
  intrinsicBind,
  bindIntrinsic,
  uncurryThis,
  objectFreeze,
  objectCreate,
  objectDefineProperty,
  objectKeys,
  objectValues,
  objectFromEntries,
  objectHasOwn,
  jsonParse,
  jsonStringify,
  arrayIsArray,
  numberIsFinite,
  numberIsInteger,
  mathMin,
  mathAbs,
  mathMax,
  promiseAll,
  arrayMap,
  arrayFilter,
  arrayFind,
  arrayFindIndex,
  arraySome,
  arrayIncludes,
  arrayPush,
  arraySort,
  arrayJoin,
  arrayAt,
  arraySlice,
  arrayFlatMap,
  mapGet,
  mapSet,
  mapDelete,
  mapClear,
  mapForEach,
  mapHas,
  mapSize,
  setAdd,
  setHas,
  setSize,
  weakMapGet,
  weakMapSet,
  weakMapDelete,
  weakSetAdd,
  weakSetHas,
  weakSetDelete,
  stringReplaceAll,
  stringSplit,
  stringTrim,
  stringTrimEnd,
  stringToLowerCase,
  stringStartsWith,
  stringIncludes,
  stringAt,
  stringCharCodeAt,
  regexpTest,
  bufferIsBuffer,
  bufferFrom,
  bufferConcat,
  bufferToString,
  eventOn,
  clientRequestSetTimeout,
  clientRequestEnd,
  clientRequestDestroy,
  NativeDate,
  dateParse,
  dateNow,
  dateToISOString,
  TrustedString,
  TrustedBoolean,
  TrustedError,
  TrustedTypeError,
  TrustedMap,
  TrustedSet,
  TrustedWeakMap,
  TrustedWeakSet,
  TrustedPromise,
  TrustedRegExp,
  trustedEncodeURIComponent,
  canonical,
  canonicalSha256,
  createHash: nodeCreateHash,
});
