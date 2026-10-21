/**
 * Returns true for promises and other thenables.
 *
 * @param obj - Any value
 * @returns Whether `obj` is an object with a `then` method
 */
export function isPromise(obj: any): obj is Promise<unknown> {
  return (
    typeof obj === 'object' && obj !== null && typeof obj.then === 'function'
  );
}
