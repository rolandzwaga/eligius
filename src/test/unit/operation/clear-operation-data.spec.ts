import {expect, describe, test} from 'vitest';
import {clearOperationData} from '../../../operation/clear-operation-data.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

describe('clearOperationData', () => {
  test('should clear the given operation data', () => {
    // given
    const operationData = {
      bla: 1,
      bla2: true,
      bla3: 'hello',
    };

    // test
    const newOperationData = applyOperation(clearOperationData, operationData);

    // expect
    expect(newOperationData).not.toBe(operationData);
  });
  test('should clear the given properties on the given operation data', () => {
    // given
    const operationData = {
      bla: 1,
      bla2: true,
      bla3: 'hello',
      properties: ['bla', 'bla3'],
    };

    // test
    const newOperationData = applyOperation(
      clearOperationData,
      operationData
    ) as typeof operationData;

    // expect
    expect(newOperationData.bla).toBeUndefined();
    expect(newOperationData.bla3).toBeUndefined();
    expect(newOperationData.properties).toBeUndefined();
    expect(newOperationData.bla2).toBe(true);
  });
});
