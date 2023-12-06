import jQuery from 'jquery';
import { isFunction } from './guards/is-function';
import { isObject } from './guards/is-object';

export function prepareValueForSerialization(value: unknown): any {
  if (Array.isArray(value)) {
    return (value as Array<any>).map(prepareValueForSerialization);
  } else if (value instanceof jQuery) {
    return '[jQuery object]';
  } else if (isObject(value)) {
    if (
      value.constructor.toString().substring(0, 5) === 'class' ||
      !value.constructor.toString().startsWith('function Object()')
    ) {
      const funcString: string = value.constructor.toString();
      return funcString.substring(0, funcString.indexOf('{') + 1);
    }
    return Object.fromEntries(
      Object.entries(value).map(([propName, propValue]) => [propName, prepareValueForSerialization(propValue)])
    );
  } else if (isFunction(value)) {
    const funcString: string = value.toString();
    const paranIndex = funcString.indexOf('{');
    if (paranIndex > -1) {
      return funcString.substring(0, funcString.indexOf('{') + 1);
    }
    return funcString;
  }
  return value;
}
