export function prepareValueForSerialization(value: any): any {
  if (Array.isArray(value)) {
    return (value as Array<any>).map(prepareValueForSerialization);
  } else if (value instanceof jQuery) {
    return 'jQuery object';
  } else if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([name, value]) => [
        name,
        prepareValueForSerialization(value),
      ])
    );
  } else if (typeof value === 'function') {
    const funcString: string = value.toString();
    return funcString.substring(0, funcString.indexOf('{') + 1);
  }
  return value;
}
