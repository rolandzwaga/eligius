export function isFunction(value: any): value is (...arg: any) => any {
  return typeof value === 'function';
}
