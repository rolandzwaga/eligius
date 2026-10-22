import fs from 'node:fs';
import path from 'node:path';
import * as operations from '@operation/index.ts';
import * as operationMetadata from '@operation/metadata/index.ts';
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

  test('given the endWhen schema, when reading it, then id and systemName are its only required properties and operationData is optional', () => {
    // test
    const schema = readOperationSchema('endWhen');

    // expect
    expect(schema.properties.systemName.const).toBe('endWhen');
    expect(schema.required).toEqual(['id', 'systemName']);
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
    expect(schema.required).toEqual(['id', 'systemName']);
  });
  test('given the forEach schema, when reading the collection property, then it keeps the anyOf of the TypeScript type and adds no conflicting type', () => {
    // test
    const {collection} =
      readOperationSchema('forEach').properties.operationData.properties;

    // expect
    expect(collection.type).toBeUndefined();
    expect(collection.anyOf.map((x: {type: string}) => x.type)).toEqual([
      'array',
      'string',
    ]);
  });

  test('given the setVariable and log schemas, when reading their any typed values, then no type is enforced', () => {
    // test
    const setVariable = readOperationSchema('setVariable');
    const log = readOperationSchema('log');

    // expect
    expect(
      setVariable.properties.operationData.properties.value.type
    ).toBeUndefined();
    expect(
      log.properties.operationData.properties.logValue.type
    ).toBeUndefined();
  });

  test('given every operation schema, when comparing its required operation data with the operation metadata, then both list the same @required properties', () => {
    // given
    const mismatches: string[] = [];

    // test
    for (const name of operationNames) {
      const getMetadata = (
        operationMetadata as Record<string, () => {properties?: object}>
      )[name];
      const metadataRequired = Object.entries(getMetadata().properties ?? {})
        .filter(
          ([, value]) => typeof value === 'object' && value?.required === true
        )
        .map(([key]) => key)
        .sort();
      const schema = readOperationSchema(name);
      const schemaRequired = [
        ...(schema.properties.operationData.required ?? []),
      ].sort();
      if (JSON.stringify(metadataRequired) !== JSON.stringify(schemaRequired)) {
        mismatches.push(
          `${name}: metadata [${metadataRequired}] schema [${schemaRequired}]`
        );
      }
      // operationData is required exactly when one of its properties is
      expect(schema.required.includes('operationData')).toBe(
        schemaRequired.length > 0
      );
    }

    // expect
    expect(mismatches).toEqual([]);
  });

  test('given the setElementContent schema, when reading the required operation data, then insertionType is not required because it is not tagged @required', () => {
    // test
    const schema = readOperationSchema('setElementContent');

    // expect
    expect(schema.properties.operationData.required ?? []).not.toContain(
      'insertionType'
    );
  });

  test('given operations whose data type the schema generator cannot handle, when reading their schemas, then they still describe and require the @required properties', () => {
    // test
    const createElement = readOperationSchema('createElement');
    const getControllerInstance = readOperationSchema('getControllerInstance');
    const addControllerToElement = readOperationSchema(
      'addControllerToElement'
    );

    // expect
    expect(createElement.properties.operationData.required).toEqual([
      'elementName',
    ]);
    expect(
      createElement.properties.operationData.properties.elementName
    ).toBeDefined();
    expect(createElement.required).toContain('operationData');
    expect(getControllerInstance.properties.operationData.required).toEqual([
      'systemName',
    ]);
    expect(
      addControllerToElement.properties.operationData.properties.selectedElement
    ).toBeUndefined();
  });

  test('given every operation schema, when reading the id property, then it is a required string without a UUID pattern', () => {
    for (const name of operationNames) {
      // test
      const schema = readOperationSchema(name);

      // expect
      expect(schema.required).toContain('id');
      expect(schema.properties.id.type).toBe('string');
      expect(schema.properties.id.pattern).toBeUndefined();
    }
  });

  test('given the configuration schema, when reading the root required list, then it is the one derived from IEngineConfiguration', () => {
    // test
    const schema = readJson(configurationSchemaPath);

    // expect
    expect([...schema.required].sort()).toEqual(
      [
        'id',
        'engine',
        'containerSelector',
        'cssFiles',
        'language',
        'layoutTemplate',
        'availableLanguages',
        'initActions',
        'actions',
        'timelines',
      ].sort()
    );
  });
});

// ajv is a devDependency; a missing install fails this file instead of
// skipping the validation tests
const ajvModule: any = await import('ajv');
const AjvClass: any = ajvModule.default ?? ajvModule;

describe.skipIf(!schemaExists)(
  'generated JSON schema validation with ajv',
  () => {
    function createAjv() {
      const ajv = new AjvClass({strict: false, allErrors: true});
      for (const file of fs.readdirSync(operationsDirectory)) {
        ajv.addSchema(readJson(path.join(operationsDirectory, file)));
      }
      return ajv;
    }

    function validateOperation(
      systemName: string,
      operationData?: Record<string, unknown>
    ) {
      const ajv = createAjv();
      const schema = readOperationSchema(systemName);
      const validate = ajv.getSchema(schema.$id);
      const valid = validate({id: 'op-id', systemName, operationData});
      return {valid, errors: validate.errors};
    }

    test('given forEach over a literal array or a property chain, when validated, then both pass and a number fails', () => {
      expect(validateOperation('forEach', {collection: [1, 2, 3]}).valid).toBe(
        true
      );
      expect(
        validateOperation('forEach', {collection: 'operationData.items'}).valid
      ).toBe(true);
      expect(validateOperation('forEach', {collection: 5}).valid).toBe(false);
    });

    test('given setVariable with a number and log with an object, when validated, then both pass', () => {
      expect(
        validateOperation('setVariable', {name: 'n', value: 42}).valid
      ).toBe(true);
      expect(validateOperation('log', {logValue: {a: 1}}).valid).toBe(true);
    });

    test('given setElementContent without insertionType, when validated, then it passes', () => {
      expect(
        validateOperation('setElementContent', {template: '<p/>'}).valid
      ).toBe(true);
    });

    test('given createElement and getControllerInstance without their @required data, when validated, then both fail', () => {
      expect(validateOperation('createElement', {}).valid).toBe(false);
      expect(validateOperation('createElement').valid).toBe(false);
      expect(
        validateOperation('createElement', {elementName: 'div'}).valid
      ).toBe(true);
      expect(validateOperation('getControllerInstance', {}).valid).toBe(false);
    });

    test('given a full configuration using these operations, when validated against eligius-configuration.json, then it passes', () => {
      // given
      const ajv = createAjv();
      const validate = ajv.compile(readJson(configurationSchemaPath));
      const configuration = {
        id: 'config-id',
        engine: {systemName: 'EligiusEngine'},
        timelineProviderSettings: {
          animation: {positionSource: {systemName: 'RafPositionSource'}},
        },
        containerSelector: '#app',
        cssFiles: [],
        language: 'en-US',
        layoutTemplate: '<div></div>',
        availableLanguages: [],
        initActions: [
          {
            id: 'init-1',
            name: 'Init',
            startOperations: [
              {
                id: 'op-1',
                systemName: 'setVariable',
                operationData: {name: 'count', value: 42},
              },
              {
                id: 'op-2',
                systemName: 'forEach',
                operationData: {collection: 'operationData.items'},
              },
              {
                id: 'op-3',
                systemName: 'log',
                operationData: {logValue: {a: 1}},
              },
              {id: 'op-4', systemName: 'endForEach'},
            ],
            endOperations: [],
          },
        ],
        actions: [],
        timelines: [],
      };

      // test
      const valid = validate(configuration);

      // expect
      expect(validate.errors ?? []).toEqual([]);
      expect(valid).toBe(true);
    });
  }
);
