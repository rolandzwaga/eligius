import jQuery from 'jquery';

export function prepareValueForSerialization(value: any): any {
  if (Array.isArray(value)) {
    return (value as Array<any>).map(prepareValueForSerialization);
  } else if (value instanceof jQuery) {
    return 'jQuery object';
  } else if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([propName, propValue]) => [
        propName,
        prepareValueForSerialization(propValue),
      ])
    );
  } else if (typeof value === 'function') {
    const funcString: string = value.toString();
    const paranIndex = funcString.indexOf('{');
    if (paranIndex > -1) {
      return funcString.substring(0, funcString.indexOf('{') + 1);
    }
    return funcString;
  }
  return value;
}
