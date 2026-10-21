import fs from 'node:fs';
import path from 'node:path';
import * as operations from '@operation/index.ts';
import camelCaseToDash from '@util/camel-case-to-dash.ts';
import {describe, expect, test} from 'vitest';

// These tests check the output of `npm run generate-schema` (part of `npm run build`).
// The jsonschema directory is gitignored, so they are skipped when it has not been generated.
const schemaDirectory = path.resolve(process.cwd(), 'jsonschema');
const operationsDirectory = path.join(schemaDirectory, 'operations');
const configurationSchemaPath = path.join(
  schemaDirectory,
  'eligius-configuration.json'
);
const schemaExists = fs.existsSync(configurationSchemaPath);

function readJson(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, {encoding: 'utf-8'}));
}

function readOperationSchema(operationName: string) {
  return readJson(
    path.join(operationsDirectory, `${camelCaseToDash(operationName)}.json`)
  );
}

const operationNames = Object.keys(operations);

describe.skipIf(!schemaExists)('generated JSON schema', () => {
  test('given the generated jsonschema/operations directory, when listing schema files against the operation exports, then every exported operation has a schema file', () => {
    // given
    const files = fs.readdirSync(operationsDirectory);

    // test
    const missing = operationNames.filter(
      name => !files.includes(`${camelCaseToDash(name)}.json`)
    );

    // expect
    expect(missing).toEqual([]);
  });

  test('given the generated configuration schema, when reading the IOperationConfiguration oneOf, then it references every exported operation', () => {
    // given
    const schema = readJson(configurationSchemaPath);
    const definitionName = Object.keys(schema.definitions).find(name =>
      name.includes('IOperationConfiguration')
    );

    // test
    const refs: string[] = schema.definitions[definitionName!].oneOf.map(
      (x: {$ref: string}) => x.$ref
    );

    // expect
    expect(refs.sort()).toEqual(
      operationNames
        .map(name => `operations/${camelCaseToDash(name)}.json`)
        .sort()
    );
  });

  test('given the endWhen schema, when reading it, then systemName is its only required property and operationData is optional', () => {
    // test
    const schema = readOperationSchema('endWhen');

    // expect
    expect(schema.properties.systemName.const).toBe('endWhen');
    expect(schema.required).toEqual(['systemName']);
    expect(schema.properties.operationData).toBeDefined();
  });

  test('given the clearStorage schema, when reading it, then it describes the clear storage operation data', () => {
    // test
    const schema = readOperationSchema('clearStorage');

    // expect
    expect(schema.properties.systemName.const).toBe('clearStorage');
    expect(
      schema.properties.operationData.properties.storageType
    ).toBeDefined();
    expect(schema.properties.operationData.required).toEqual(['storageType']);
  });

  test('given the setOperationData schema, when reading it, then it describes the non-exported data interface', () => {
    // test
    const schema = readOperationSchema('setOperationData');

    // expect
    expect(schema.properties.systemName.const).toBe('setOperationData');
    expect(schema.properties.operationData.required).toEqual(['properties']);
  });

  test('given the addClass schema, when reading the operationData, then the @dependency property selectedElement is neither required nor listed', () => {
    // test
    const schema = readOperationSchema('addClass');

    // expect
    expect(schema.properties.operationData.required).toEqual(['className']);
    expect(
      schema.properties.operationData.properties.selectedElement
    ).toBeUndefined();
  });

  test('given an operation whose only data properties are dependencies, when reading its schema, then operationData is not required', () => {
    // given
    // removeElement only depends on selectedElement
    const schema = readOperationSchema('removeElement');

    // expect
    expect(schema.required).toEqual(['systemName']);
  });
});
