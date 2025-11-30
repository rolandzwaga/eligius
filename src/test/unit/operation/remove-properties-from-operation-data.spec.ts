import {expect, describe, test} from 'vitest';
import {removePropertiesFromOperationData} from '../../../operation/remove-properties-from-operation-data.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

describe('removePropertiesFromOperationData', () => {
  test('should remove the specified properties from the given operationData', () => {
    // given
    const operationData = {
      testProp1: 'test1',
      testProp2: 'test2',
      testProp3: 'test3',
      propertyNames: ['testProp1', 'testProp2'],
    };

    // test
    const newData = applyOperation(
      removePropertiesFromOperationData,
      operationData
    ) as typeof operationData;

    // expect
    expect(Object.hasOwn(newData, 'testProp1')).toBe(false);
    expect(Object.hasOwn(newData, 'testProp2')).toBe(false);
    expect(Object.hasOwn(newData, 'propertyNames')).toBe(false);
    expect(newData.testProp3).toBe('test3');
  });
});
