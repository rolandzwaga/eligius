// @vitest-environment node
import * as controllerMetadata from '@controllers/metadata/index.ts';
import {LabelController} from '@controllers/metadata/index.ts';
import * as operationMetadata from '@operation/metadata/index.ts';
import {animateWithClass, clearStorage} from '@operation/metadata/index.ts';
import {PARAMETER_TYPES} from '@operation/metadata/parameter-types.ts';
import type {TPropertyMetadata} from '@operation/metadata/types.ts';
import {Project} from 'ts-morph';
import {describe, expect, test} from 'vitest';
import {getTypeFromProperty} from '@/tools/code-generator/property-type.ts';

// One shared in-memory project, creating a project per test reloads the lib files every time
const project = new Project({
  useInMemoryFileSystem: true,
  compilerOptions: {strict: true},
});
let fileIndex = 0;

function getPropertyType(source: string, propertyName: string) {
  const sourceFile = project.createSourceFile(`test${fileIndex++}.ts`, source);
  const property = sourceFile
    .getInterfaceOrThrow('ITest')
    .getPropertyOrThrow(propertyName);
  return getTypeFromProperty(property);
}

describe('getTypeFromProperty', () => {
  test('given an operation data interface with optional property key?: string, when the type is resolved, then it is ParameterType:string', () => {
    // given
    const source = 'export interface ITest { key?: string; }';

    // test
    const result = getPropertyType(source, 'key');

    // expect
    expect(result).toBe(`type: 'ParameterType:string'`);
  });

  test('given an optional boolean property, when the type is resolved, then it is ParameterType:boolean', () => {
    // given
    const source = 'export interface ITest { flag?: boolean; }';

    // test
    const result = getPropertyType(source, 'flag');

    // expect
    expect(result).toBe(`type: 'ParameterType:boolean'`);
  });

  test('given a required boolean property, when the type is resolved, then it is ParameterType:boolean', () => {
    // given
    const source = 'export interface ITest { flag: boolean; }';

    // test
    const result = getPropertyType(source, 'flag');

    // expect
    expect(result).toBe(`type: 'ParameterType:boolean'`);
  });

  test('given an optional number property, when the type is resolved, then it is ParameterType:number', () => {
    // given
    const source = 'export interface ITest { count?: number; }';

    // test
    const result = getPropertyType(source, 'count');

    // expect
    expect(result).toBe(`type: 'ParameterType:number'`);
  });

  test('given an optional string literal union property, when the type is resolved, then it lists only the literal values', () => {
    // given
    const source =
      "type TKind = 'local' | 'session'; export interface ITest { kind?: TKind; }";

    // test
    const result = getPropertyType(source, 'kind');

    // expect
    expect(result).toBe(`type: [\n{value: 'local'},\n{value: 'session'}\n]`);
  });

  test('given an optional string array property, when the type is resolved, then it is an array of strings', () => {
    // given
    const source = 'export interface ITest { items?: string[]; }';

    // test
    const result = getPropertyType(source, 'items');

    // expect
    expect(result).toBe(
      `type: 'ParameterType:array',\nitemType: 'ParameterType:string'`
    );
  });

  test('given an optional unknown property, when the type is resolved, then it is ParameterType:object', () => {
    // given
    const source = 'export interface ITest { value?: unknown; }';

    // test
    const result = getPropertyType(source, 'value');

    // expect
    expect(result).toBe(`type: 'ParameterType:object'`);
  });

  test('given an optional mixed union property, when the type is resolved, then it is a delimited list of parameter types without undefined', () => {
    // given
    const source =
      'export interface ITest { value?: string | number | boolean | RegExp; }';

    // test
    const result = getPropertyType(source, 'value');

    // expect
    expect(result).toBe(
      `type: 'ParameterType:string|ParameterType:number|ParameterType:boolean|ParameterType:RegExp'`
    );
  });

  test('given an optional generic property constrained to a literal union, when the type is resolved, then it lists only the literal values', () => {
    // given
    const source = "export interface ITest<T extends 'a' | 'b'> { value?: T; }";

    // test
    const result = getPropertyType(source, 'value');

    // expect
    expect(result).toBe(`type: [\n{value: 'a'},\n{value: 'b'}\n]`);
  });

  test('given a generic property constrained to string, when the type is resolved, then it is ParameterType:string', () => {
    // given
    const source = 'export interface ITest<T extends string> { value: T; }';

    // test
    const result = getPropertyType(source, 'value');

    // expect
    expect(result).toBe(`type: 'ParameterType:string'`);
  });

  test('given a string | DOM node union property, when the type is resolved, then every DOM node type is a parameter type', () => {
    // given
    const source =
      'export interface ITest { template?: string | Element | Text | Comment | Document | DocumentFragment; }';

    // test
    const result = getPropertyType(source, 'template');

    // expect
    expect(result).toBe(
      `type: 'ParameterType:string|ParameterType:Element|ParameterType:Text|ParameterType:Comment|ParameterType:Document|ParameterType:DocumentFragment'`
    );
  });

  test('given a property of a type that is not a parameter type, when the type is resolved, then it throws naming the property and the type', () => {
    // given
    const source = 'export interface ITest { lookup?: Map<string, number>; }';

    // test
    const resolve = () => getPropertyType(source, 'lookup');

    // expect
    expect(resolve).toThrow(/lookup.*Map<string, number>/);
  });

  test('given a union with a member that is not a parameter type, when the type is resolved, then it throws naming the property and the type', () => {
    // given
    const source = 'export interface ITest { value?: string | Blob; }';

    // test
    const resolve = () => getPropertyType(source, 'value');

    // expect
    expect(resolve).toThrow(/value.*Blob/);
  });

  test('given an array of a type that is not a parameter type, when the type is resolved, then it throws naming the property and the type', () => {
    // given
    const source = 'export interface ITest { items?: Blob[]; }';

    // test
    const resolve = () => getPropertyType(source, 'items');

    // expect
    expect(resolve).toThrow(/items.*Blob/);
  });
});

/**
 * Returns every `ParameterType:<name>` a property metadata entry refers to, its
 * `|` delimited type and its item type.
 */
function getParameterTypes(property: TPropertyMetadata): string[] {
  if (typeof property === 'string') {
    return property.split('|');
  }
  const types = Array.isArray(property.type) ? [] : property.type.split('|');
  return 'itemType' in property ? [...types, property.itemType] : types;
}

function getAllMetadataProperties() {
  const sources = [
    ...Object.entries(operationMetadata),
    ...Object.entries(controllerMetadata),
  ];
  return sources
    .filter(([, factory]) => typeof factory === 'function')
    .flatMap(([name, factory]) => {
      const metadata = (
        factory as () => {
          properties?: Record<string, TPropertyMetadata | undefined>;
          outputProperties?: Record<string, TPropertyMetadata | undefined>;
        }
      )();
      return [
        ...Object.entries(metadata.properties ?? {}),
        ...Object.entries(metadata.outputProperties ?? {}),
      ].map(([property, entry]) => ({name: `${name}.${property}`, entry}));
    });
}

describe('generated metadata', () => {
  test('given every operation and controller metadata, when splitting each type on |, then every part is a known parameter type', () => {
    // given
    const properties = getAllMetadataProperties();
    const known = new Set<string>(PARAMETER_TYPES);

    // test
    const unknown = properties.flatMap(({name, entry}) =>
      entry
        ? getParameterTypes(entry)
            .filter(type => !known.has(type))
            .map(type => `${name}: ${type}`)
        : []
    );

    // expect
    expect(properties.length).toBeGreaterThan(0);
    expect(unknown).toEqual([]);
  });

  test('given the clearStorage metadata, when reading the optional key property, then its type is ParameterType:string', () => {
    // test
    const metadata = clearStorage();

    // expect
    expect(metadata.properties?.key).toEqual({
      type: 'ParameterType:string',
      erased: true,
    });
  });

  test('given the animateWithClass metadata, when reading the optional removeClass property, then its type is ParameterType:boolean', () => {
    // test
    const metadata = animateWithClass();

    // expect
    expect(metadata.properties?.removeClass).toMatchObject({
      type: 'ParameterType:boolean',
    });
  });

  test('given the LabelController metadata, when reading the optional attributeName property, then its type is ParameterType:string', () => {
    // test
    const metadata = LabelController();

    // expect
    expect(metadata.properties?.attributeName).toMatchObject({
      type: 'ParameterType:string',
    });
  });
});
