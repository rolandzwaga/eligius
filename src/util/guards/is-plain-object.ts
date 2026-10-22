const functionToString = Function.prototype.toString;
/** Source text of `Object`, the same in every realm */
const objectConstructorSource = functionToString.call(Object);

/**
 * Returns true for plain data objects: object literals, parsed JSON objects
 * and `Object.create(null)` objects, also when they were created in another
 * realm (an iframe, a worker, the realm `fetch` parses JSON in). Returns false
 * for arrays, class instances, `Date`, `Map`, DOM nodes, jQuery objects and
 * objects that inherit from another object.
 *
 * @param value - Any value
 * @returns Whether `value` is a plain data object
 */
export function isPlainObject(
  value: unknown
): value is Record<PropertyKey, unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype === null || prototype === Object.prototype) {
    return true;
  }
  // Another realm's Object.prototype: no prototype of its own, and its own
  // constructor is that realm's Object.
  if (Object.getPrototypeOf(prototype) !== null) {
    return false;
  }
  const objectConstructor = Object.hasOwn(prototype, 'constructor')
    ? prototype.constructor
    : undefined;
  return (
    typeof objectConstructor === 'function' &&
    functionToString.call(objectConstructor) === objectConstructorSource
  );
}
