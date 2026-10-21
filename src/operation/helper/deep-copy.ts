import {isDefined} from 'ts-is-present';

const copyFunction =
  typeof structuredClone !== 'undefined'
    ? structuredClone
    : <T>(original: any) => JSON.parse(JSON.stringify(original)) as T;

/**
 * Deep copies the given value.
 *
 * Arrays and plain objects are copied recursively (cycles are preserved). Functions,
 * jQuery instances and DOM nodes cannot be cloned meaningfully, so they are kept by
 * reference; this lets function-valued operation data (such as `mapArray`'s
 * `mapFunction` or `sortArray`'s `sortComparator`, supplied through the TypeScript
 * fluent API) and stored elements survive the copy. Other objects (Date, Map, Set,
 * RegExp, ...) are copied with `structuredClone`.
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

  const copy = copyFunction(value);
  seen.set(value, copy);
  return copy;
}

function isPlainObject(value: object) {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isReferenceOnly(value: object) {
  return (
    typeof (value as {jquery?: unknown}).jquery === 'string' ||
    (typeof Node !== 'undefined' && value instanceof Node)
  );
}
