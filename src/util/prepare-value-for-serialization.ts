export function prepareValueForSerialization(value: any): any {
  if (Array.isArray(value)) {
    return (value as Array<any>).map(prepareValueForSerialization);
  } else if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([name, value]) => [
        name,
        prepareValueForSerialization(value),
      ])
    );
  } else if (typeof value === 'function') {
    return value.toString();
  }
  return value;
}
