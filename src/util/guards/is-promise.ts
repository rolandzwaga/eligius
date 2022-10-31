export function isPromise(obj: any): obj is Promise<any> {
  return typeof obj === 'object' && typeof obj.then === 'function';
}
