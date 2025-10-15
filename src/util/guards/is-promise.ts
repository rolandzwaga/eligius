export function isPromise(obj: any): obj is Promise<unknown> {
  return typeof obj === 'object' && typeof obj.then === 'function';
}
