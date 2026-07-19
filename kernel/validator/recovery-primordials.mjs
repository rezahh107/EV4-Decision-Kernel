import { Buffer as NodeBuffer } from 'node:buffer';
import { createHash as nodeCreateHash } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { ClientRequest, IncomingMessage } from 'node:http';
import { Readable } from 'node:stream';

const intrinsicCall = Function.prototype.call;
const intrinsicBind = Function.prototype.bind;
const bindIntrinsic = intrinsicCall.bind(intrinsicBind);
const uncurryThis = (method) => bindIntrinsic(intrinsicCall, method);
const functionHasInstance = uncurryThis(Function.prototype[Symbol.hasInstance]);

const reflectApply = bindIntrinsic(Reflect.apply, Reflect);
const objectFreeze = bindIntrinsic(Object.freeze, Object);
const objectCreate = bindIntrinsic(Object.create, Object);
const objectDefineProperty = bindIntrinsic(Object.defineProperty, Object);
const objectKeys = bindIntrinsic(Object.keys, Object);
const objectValues = bindIntrinsic(Object.values, Object);
const objectFromEntries = bindIntrinsic(Object.fromEntries, Object);
const objectHasOwn = bindIntrinsic(Object.hasOwn, Object);
const objectGetOwnPropertyDescriptor = bindIntrinsic(Object.getOwnPropertyDescriptor, Object);
const objectGetPrototypeOf = bindIntrinsic(Object.getPrototypeOf, Object);
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

const eventEmitMethod = EventEmitter.prototype.emit;
const eventEmit = uncurryThis(eventEmitMethod);
const eventOn = uncurryThis(EventEmitter.prototype.on);
const eventListenerCount = uncurryThis(EventEmitter.prototype.listenerCount);
const readableResumeMethod = Readable.prototype.resume;
const readableResume = uncurryThis(readableResumeMethod);
const clientRequestSetTimeout = uncurryThis(ClientRequest.prototype.setTimeout);
const clientRequestEnd = uncurryThis(ClientRequest.prototype.end);
const clientRequestDestroy = uncurryThis(ClientRequest.prototype.destroy);

function sealEmitter(instance) {
  objectDefineProperty(instance, 'emit', {
    value: function sealedAuthorityEmit() {
      return reflectApply(eventEmitMethod, instance, arguments);
    },
    writable: false,
    configurable: false,
    enumerable: false,
  });
  return instance;
}

function sealReadable(instance) {
  sealEmitter(instance);
  objectDefineProperty(instance, 'on', {
    value: function sealedAuthorityOn(event, listener) {
      eventOn(instance, event, listener);
      return instance;
    },
    writable: false,
    configurable: false,
    enumerable: false,
  });
  if (functionHasInstance(IncomingMessage, instance)
    && typeof instance.complete !== 'boolean') {
    objectDefineProperty(instance, 'complete', {
      value: true,
      writable: false,
      configurable: false,
      enumerable: false,
    });
  }
  if (!functionHasInstance(Readable, instance)) return false;
  objectDefineProperty(instance, 'resume', {
    value: function sealedAuthorityResume() {
      readableResume(instance);
      return instance;
    },
    writable: false,
    configurable: false,
    enumerable: false,
  });
  objectDefineProperty(instance, 'listenerCount', {
    value: function sealedAuthorityListenerCount(event, listener) {
      return listener === undefined
        ? eventListenerCount(instance, event)
        : eventListenerCount(instance, event, listener);
    },
    writable: false,
    configurable: false,
    enumerable: false,
  });
  return true;
}

function startReadableFlow(instance) {
  if (functionHasInstance(Readable, instance)) readableResume(instance);
  return instance;
}

const initializationHash = nodeCreateHash('sha256');
const hashPrototype = objectGetPrototypeOf(initializationHash);
const hashUpdate = uncurryThis(hashPrototype.update);
const hashDigest = uncurryThis(hashPrototype.digest);

function createTrustedHash(algorithm) {
  const hash = nodeCreateHash(algorithm);
  const facade = objectCreate(null);
  objectDefineProperty(facade, 'update', {
    value(chunk, encoding) {
      if (encoding === undefined) hashUpdate(hash, chunk);
      else hashUpdate(hash, chunk, encoding);
      return facade;
    },
    writable: false,
    configurable: false,
    enumerable: false,
  });
  objectDefineProperty(facade, 'digest', {
    value(encoding) {
      return encoding === undefined ? hashDigest(hash) : hashDigest(hash, encoding);
    },
    writable: false,
    configurable: false,
    enumerable: false,
  });
  return objectFreeze(facade);
}

function hashHex(algorithm, chunks) {
  const hash = nodeCreateHash(algorithm);
  for (let index = 0; index < chunks.length; index += 1) {
    hashUpdate(hash, chunks[index]);
  }
  return hashDigest(hash, 'hex');
}

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
const TrustedClientRequest = ClientRequest;
const TrustedIncomingMessage = IncomingMessage;
const TrustedReadable = Readable;
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

const canonicalSha256 = (value) => hashHex('sha256', [jsonStringify(canonical(value))]);

export const recoveryPrimordials = objectFreeze({
  intrinsicCall,
  intrinsicBind,
  bindIntrinsic,
  uncurryThis,
  functionHasInstance,
  reflectApply,
  objectFreeze,
  objectCreate,
  objectDefineProperty,
  objectKeys,
  objectValues,
  objectFromEntries,
  objectHasOwn,
  objectGetPrototypeOf,
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
  eventEmit,
  eventOn,
  eventListenerCount,
  readableResume,
  sealEmitter,
  sealReadable,
  startReadableFlow,
  clientRequestSetTimeout,
  clientRequestEnd,
  clientRequestDestroy,
  hashUpdate,
  hashDigest,
  hashHex,
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
  TrustedClientRequest,
  TrustedIncomingMessage,
  TrustedReadable,
  trustedEncodeURIComponent,
  canonical,
  canonicalSha256,
  createHash: createTrustedHash,
});
