import {expect} from 'chai';
import {describe, test} from 'vitest';
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
    expect(newOperationData).to.not.equal(operationData);
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
    expect(newOperationData.bla).to.be.undefined;
    expect(newOperationData.bla3).to.be.undefined;
    expect(newOperationData.properties).to.be.undefined;
    expect(newOperationData.bla2).to.be.true;
  });
});
