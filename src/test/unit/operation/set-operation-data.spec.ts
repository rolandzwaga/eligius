import {setOperationData} from '@operation/set-operation-data.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {describe, expect, test} from 'vitest';

describe('setOperationData', () => {
  test('should set the specified operation data', () => {
    // given
    const operationData = {
      unusedProperty: 'test',
      testProperty: 'testProperty1',
      prop5: false,
      prop6: 'foo',
      prop7: 'bar',
      properties: {
        prop1: 'prop1',
        prop2: 'prop2',
        prop3: '$operationdata.testProperty',
        prop4: 100,
        prop5: true,
        prop6: null,
        prop7: undefined,
      },
    };

    // test
    const newData = applyOperation(setOperationData, operationData) as Record<
      PropertyKey,
      any
    >;

    // expect
    expect(newData.unusedProperty).toBe('test');
    expect(newData.prop1).toBe('prop1');
    expect(newData.prop2).toBe('prop2');
    expect(newData.prop3).toBe('testProperty1');
    expect(newData.prop4).toBe(100);
    expect(newData.prop5).toBe(true);
    expect(newData.prop6).toBe(null);
    expect(newData.prop7).toBe(undefined);
    expect('properties' in newData).toBe(false);
  });
  test('should override all the existing operationdata with the specified data', () => {
    // given
    const operationData = {
      unusedProperty: 'test',
      testProperty: 'testProperty1',
      override: true,
      properties: {
        prop1: 'prop1',
        prop2: 'prop2',
        prop3: '$operationdata.testProperty',
      },
    };

    // test
    const newData = applyOperation(setOperationData, operationData) as Record<
      PropertyKey,
      any
    >;

    // expect
    expect(newData.unusedProperty).toBeUndefined();
    expect(newData.testProperty).toBeUndefined();
    expect(newData.override).toBeUndefined();
    expect(newData.prop1).toBe('prop1');
    expect(newData.prop2).toBe('prop2');
    expect(newData.prop3).toBe('testProperty1');
  });

  test('should remove the override and properties properties from the operation data', () => {
    // given
    const operationData = {
      unusedProperty: 'test',
      testProperty: 'testProperty1',
      override: true,
      properties: {
        prop1: 'prop1',
        prop2: 'prop2',
        prop3: '$operationdata.testProperty',
      },
    };

    // test
    const newData = applyOperation(setOperationData, operationData) as Record<
      PropertyKey,
      any
    >;

    // expect
    expect('override' in newData).toBe(false);
    expect('properties' in newData).toBe(false);
  });
});
