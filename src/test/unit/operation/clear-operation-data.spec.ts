import { expect } from 'chai';
import { clearOperationData } from '../../../operation/clear-operation-data';
import { applyOperation } from './apply-operation';

describe('clearOperationData', () => {
  it('should clear the given operation data', () => {
    // given
    const operationData = {
      bla: 1,
      bla2: true,
      bla3: 'hello',
    };

    // test
    const newOperationData = applyOperation<typeof operationData>(
      clearOperationData,
      operationData
    );

    // expect
    expect(newOperationData).to.not.equal(operationData);
  });

  it('should clear the given properties on the given operation data', () => {
    // given
    const operationData = {
      bla: 1,
      bla2: true,
      bla3: 'hello',
      properties: ['bla', 'bla3'],
    };

    // test
    const newOperationData = applyOperation<typeof operationData>(
      clearOperationData,
      operationData
    );

    // expect
    expect(newOperationData.bla).to.be.undefined;
    expect(newOperationData.bla3).to.be.undefined;
    expect(newOperationData.properties).to.be.undefined;
    expect(newOperationData.bla2).to.be.true;
  });
});
