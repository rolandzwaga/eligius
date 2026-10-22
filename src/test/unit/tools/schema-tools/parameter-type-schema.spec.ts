// @vitest-environment node
import {PARAMETER_TYPES} from '@operation/metadata/parameter-types.ts';
import {describe, expect, test} from 'vitest';
import {
  isParameterTypeTag,
  parameterTypeTagToJsonSchemaType,
} from '@/tools/schema-tools/parameter-type-schema.ts';

describe('parameterTypeTagToJsonSchemaType', () => {
  test('given a single ParameterType as ts-json-schema-generator reports it, when mapped, then it is the JSON type', () => {
    expect(parameterTypeTagToJsonSchemaType('= ParameterType:className')).toBe(
      'string'
    );
    expect(parameterTypeTagToJsonSchemaType('ParameterType:number')).toBe(
      'number'
    );
  });

  test('given a union tag, when mapped, then every prefix is stripped and the result is a type array', () => {
    expect(
      parameterTypeTagToJsonSchemaType(
        '= ParameterType:array|ParameterType:string'
      )
    ).toEqual(['array', 'string']);
  });

  test('given a union of ParameterTypes that share a JSON type, when mapped, then the types are deduplicated', () => {
    expect(
      parameterTypeTagToJsonSchemaType(
        'ParameterType:selector|ParameterType:className'
      )
    ).toBe('string');
  });

  test('given the union of every JSON type, when mapped, then no type is enforced', () => {
    expect(
      parameterTypeTagToJsonSchemaType(
        '=ParameterType:object|ParameterType:string|ParameterType:number|ParameterType:boolean|ParameterType:array'
      )
    ).toBeUndefined();
  });

  test('given an unknown ParameterType, when mapped, then no type is enforced instead of string', () => {
    expect(
      parameterTypeTagToJsonSchemaType('ParameterType:somethingNew')
    ).toBeUndefined();
    expect(
      parameterTypeTagToJsonSchemaType(
        'ParameterType:number|ParameterType:somethingNew'
      )
    ).toBeUndefined();
    expect(
      parameterTypeTagToJsonSchemaType('ParameterType:constructor')
    ).toBeUndefined();
  });

  test('given every known ParameterType, when mapped, then each one has a JSON type', () => {
    const unmapped = PARAMETER_TYPES.filter(
      type => parameterTypeTagToJsonSchemaType(type) === undefined
    );

    expect(unmapped).toEqual([]);
  });

  test('given a string | RegExp union, when mapped, then it accepts a string or an object', () => {
    expect(
      parameterTypeTagToJsonSchemaType(
        'ParameterType:string|ParameterType:RegExp'
      )
    ).toEqual(['string', 'object']);
  });

  test('given a string | DOM node union, when mapped, then it accepts a string or an object', () => {
    expect(
      parameterTypeTagToJsonSchemaType(
        'ParameterType:string|ParameterType:Element|ParameterType:Text|ParameterType:Comment|ParameterType:Document|ParameterType:DocumentFragment'
      )
    ).toEqual(['string', 'object']);
  });
});

describe('isParameterTypeTag', () => {
  test('given tag values and JSON types, when checked, then only the tag values match', () => {
    expect(isParameterTypeTag('= ParameterType:array')).toBe(true);
    expect(isParameterTypeTag('ParameterType:array')).toBe(true);
    expect(isParameterTypeTag('array')).toBe(false);
    expect(isParameterTypeTag(['string'])).toBe(false);
  });
});
