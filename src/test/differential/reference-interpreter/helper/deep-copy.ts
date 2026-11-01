// PINNED COPY of src/operation/helper/deep-copy.ts at commit d937f6be. Do not edit.
// Reference interpreter for the differential harness of specs/007-aot-compiler
// (Phase 1: old interpreter vs optimised interpreter). Delete after Phase 4.
import {isPlainObject} from '@util/guards/is-plain-object.ts';
import {isDefined} from 'ts-is-present';

/**
 * Re-exported for existing imports; the implementation lives in
 * `@util/guards/is-plain-object.ts`. Objects from another realm (an iframe,
 * or the realm `fetch` parses JSON in) count as plain too.
 */
export {isPlainObject};

const copyFunction =
  typeof structuredClone !== 'undefined'
    ? structuredClone
    : <T>(original: any) => JSON.parse(JSON.stringify(original)) as T;

/**
 * Deep copies the given value.
 *
 * Arrays and plain objects are copied recursively (cycles are preserved). Date, RegExp,
 * Map, Set, Error, ArrayBuffer and typed array values are copied with `structuredClone`.
 *
 * Everything else is kept by reference:
 * - functions, so function-valued operation data (such as `mapArray`'s `mapFunction` or
 *   `sortArray`'s `sortComparator`, supplied through the TypeScript fluent API) survives
 *   the copy;
 * - jQuery instances and DOM nodes;
 * - class instances (controllers, actions, the eventbus and other objects whose prototype
 *   is not `Object.prototype` or `null`). `structuredClone` would either throw on them or
 *   return a plain object without their methods.
 *
 * @param original The value to copy.
 * @returns The copy.
 */
export function deepCopy<T>(original: T): T {
  if (isDefined(original)) {
    return copyValue(original, new WeakMap()) as T;
  }
  return original;
}

function copyValue(value: unknown, seen: WeakMap<object, unknown>): unknown {
  // Primitives and functions are returned as-is.
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (isReferenceOnly(value)) {
    return value;
  }
  if (seen.has(value)) {
    return seen.get(value);
  }

  if (Array.isArray(value)) {
    const copy: unknown[] = new Array(value.length);
    seen.set(value, copy);
    value.forEach((item, index) => {
      copy[index] = copyValue(item, seen);
    });
    return copy;
  }

  if (isPlainObject(value)) {
    const copy: Record<string, unknown> = {};
    seen.set(value, copy);
    for (const key of Object.keys(value)) {
      // defineProperty, so an own '__proto__' key (e.g. from JSON.parse) stays a
      // data property instead of replacing the copy's prototype.
      Object.defineProperty(copy, key, {
        value: copyValue((value as Record<string, unknown>)[key], seen),
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
    return copy;
  }

  if (!isStructuredCloneable(value)) {
    return value;
  }

  const copy = copyFunction(value);
  seen.set(value, copy);
  return copy;
}

function isReferenceOnly(value: object) {
  return (
    typeof (value as {jquery?: unknown}).jquery === 'string' ||
    (typeof Node !== 'undefined' && value instanceof Node)
  );
}

/**
 * Built-in value types that `structuredClone` copies faithfully.
 */
function isStructuredCloneable(value: object) {
  // Tags instead of instanceof, so values from another realm are recognised.
  return (
    cloneableTags.has(Object.prototype.toString.call(value)) ||
    ArrayBuffer.isView(value)
  );
}

const cloneableTags = new Set([
  '[object Date]',
  '[object RegExp]',
  '[object Map]',
  '[object Set]',
  '[object Error]',
  '[object ArrayBuffer]',
]);
