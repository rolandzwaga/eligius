import {isPlainObject} from '@util/guards/is-plain-object.ts';

export {isPlainObject};

const copyFunction =
  typeof structuredClone !== 'undefined'
    ? structuredClone
    : <T>(original: any) => JSON.parse(JSON.stringify(original)) as T;

/**
 * Deep-copies plain data: arrays and plain objects are copied recursively (cycles are preserved),
 * Date, RegExp, Map, Set, Error, ArrayBuffer and typed arrays are cloned, and everything else
 * (functions, jQuery objects, DOM nodes, class instances) is kept by reference.
 *
 * An own `__proto__` key (as `JSON.parse` creates) stays an own data property of the copy.
 *
 * This runs for every execution of every operation with nested configured data, so it avoids
 * work on the common shapes: the cycle map is only created once a nested object or array
 * appears, and plain keys are assigned instead of defined.
 *
 * @param original The value to copy
 * @returns The copy, or the value itself when it is not copied
 */
export function deepCopy<T>(original: T): T {
  if (
    original === null ||
    typeof original !== 'object' ||
    isReferenceOnly(original)
  ) {
    return original;
  }
  return copyObject(original, {seen: null}) as T;
}

interface ICopyContext {
  /**
   * Copies made so far, so that a cycle or a shared reference maps to one
   * copy. Created on the first nested object, because most configured data
   * is flat and never needs it.
   */
  seen: WeakMap<object, unknown> | null;
}

/**
 * Copies a child value of `parentValue`, whose copy is `parentCopy`.
 */
function copyChild(
  child: unknown,
  parentValue: object,
  parentCopy: unknown,
  context: ICopyContext
): unknown {
  // Primitives, functions, jQuery objects, DOM nodes: as-is.
  if (child === null || typeof child !== 'object' || isReferenceOnly(child)) {
    return child;
  }
  if (context.seen === null) {
    context.seen = new WeakMap();
    context.seen.set(parentValue, parentCopy);
  }
  return copyObject(child, context);
}

/**
 * Copies an object that is not reference-only.
 */
function copyObject(value: object, context: ICopyContext): unknown {
  const {seen} = context;
  // Copies are always objects, so undefined means "not seen".
  const prior = seen?.get(value);
  if (prior !== undefined) {
    return prior;
  }

  if (Array.isArray(value)) {
    const copy: unknown[] = new Array(value.length);
    if (seen !== null) {
      seen.set(value, copy);
    }
    // forEach skips holes, so a sparse array stays sparse.
    value.forEach((item, index) => {
      copy[index] = copyChild(item, value, copy, context);
    });
    return copy;
  }

  if (isPlainObject(value)) {
    const copy: Record<string, unknown> = {};
    if (seen !== null) {
      seen.set(value, copy);
    }
    for (const key of Object.keys(value)) {
      const copied = copyChild(
        (value as Record<string, unknown>)[key],
        value,
        copy,
        context
      );
      if (key === '__proto__') {
        // defineProperty, so an own '__proto__' key (e.g. from JSON.parse) stays
        // a data property instead of replacing the copy's prototype.
        Object.defineProperty(copy, key, {
          value: copied,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      } else {
        copy[key] = copied;
      }
    }
    return copy;
  }

  if (!isStructuredCloneable(value)) {
    return value;
  }

  const copy = copyFunction(value);
  if (seen !== null) {
    seen.set(value, copy);
  }
  return copy;
}

function isReferenceOnly(value: object) {
  return (
    typeof (value as {jquery?: unknown}).jquery === 'string' ||
    (typeof Node !== 'undefined' && value instanceof Node)
  );
}

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
