import {ConfigurationFactory} from '@configuration/api/index.ts';
import {
  assertKnownOperationName,
  getOperationNameByType,
  isKnownOperationName,
  registerOperationTypes,
} from '@configuration/api/operation-lookup.ts';
import * as controllers from '@controllers/index.ts';
import * as controllerMetadata from '@controllers/metadata/index.ts';
import * as operations from '@operation/index.ts';
import * as operationMetadata from '@operation/metadata/index.ts';
import {selectElement} from '@operation/select-element.ts';
import {describe, expect, test} from 'vitest';

describe('operation-lookup', () => {
  test('given the generated metadata, when compared to the implementations, then both list the same operations', () => {
    expect(Object.keys(operationMetadata).sort()).toEqual(
      Object.keys(operations).sort()
    );
  });

  test('given the generated metadata, when compared to the implementations, then both list the same controllers', () => {
    expect(Object.keys(controllerMetadata).sort()).toEqual(
      Object.keys(controllers).sort()
    );
  });

  test('given an operation name, when checked, then only own metadata entries are known', () => {
    expect(isKnownOperationName('selectElement')).toBe(true);
    expect(isKnownOperationName('doesNotExist')).toBe(false);
    expect(isKnownOperationName('toString')).toBe(false);
    expect(isKnownOperationName('__proto__')).toBe(false);
  });

  test('given an unknown operation name, when asserted, then it throws', () => {
    expect(() => assertKnownOperationName('doesNotExist')).toThrowError(
      'Unknown operation: doesNotExist'
    );
    expect(() => assertKnownOperationName('selectElement')).not.toThrow();
  });

  test('given custom operation names, when a custom name is asserted, then it does not throw, and a misspelled one suggests the custom name', () => {
    const customNames = new Set(['trackEvent']);

    expect(() =>
      assertKnownOperationName('trackEvent', customNames)
    ).not.toThrow();
    expect(() => assertKnownOperationName('trackEvent')).toThrowError(
      /^Unknown operation: trackEvent\. To add a custom operation/
    );
    expect(() =>
      assertKnownOperationName('trackEvnt', customNames)
    ).toThrowError(
      /^Unknown operation: trackEvnt\. Did you mean 'trackEvent'\?/
    );
  });

  test('given a misspelled built-in name, when asserted, then the message suggests the built-in name', () => {
    expect(() => assertKnownOperationName('selectElemnt')).toThrowError(
      /^Unknown operation: selectElemnt\. Did you mean 'selectElement'\?/
    );
  });

  test('given the fluent API barrel is loaded, when an operation function is looked up, then its system name is returned', () => {
    expect(
      getOperationNameByType(
        selectElement,
        'addStartOperationByType',
        'addStartOperation'
      )
    ).toBe('selectElement');
  });

  test('given the fluent API barrel is loaded, when an unknown function is looked up, then it throws', () => {
    const unknownOperation = () => ({});
    expect(() =>
      getOperationNameByType(
        unknownOperation,
        'addStartOperationByType',
        'addStartOperation'
      )
    ).toThrowError(/^Operation class not found/);
  });

  test('given entries that are not operations, when registered, then they are ignored', () => {
    const notAnOperation = () => ({});
    registerOperationTypes({
      notAnOperation,
      selectElement: 'not a function',
    });

    expect(() =>
      getOperationNameByType(
        notAnOperation,
        'addStartOperationByType',
        'addStartOperation'
      )
    ).toThrowError(/^Operation class not found/);
    expect(
      getOperationNameByType(
        selectElement,
        'addStartOperationByType',
        'addStartOperation'
      )
    ).toBe('selectElement');
  });

  test('given the fluent API barrel is loaded, when operations are added by type, then the system names are stored', () => {
    const factory = new ConfigurationFactory();
    factory.init('en-US');
    factory
      .createAction('ByType')
      .addStartOperationByType(operations.selectElement, {selector: '#a'})
      .addEndOperationByType(operations.removeElement, {});

    const [action] = factory.getConfiguration().actions;
    expect(action.startOperations[0].systemName).toBe('selectElement');
    expect(action.endOperations[0].systemName).toBe('removeElement');
  });
});
