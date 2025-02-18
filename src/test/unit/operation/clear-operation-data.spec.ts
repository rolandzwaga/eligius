import { expect } from 'chai';
import { suite } from 'uvu';
import { clearOperationData } from '../../../operation/clear-operation-data.ts';
import { applyOperation } from '../../../util/apply-operation.ts';

const ClearOperationDataSuite = suite('clearOperationData');

ClearOperationDataSuite('should clear the given operation data', () => {
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

ClearOperationDataSuite(
  'should clear the given properties on the given operation data',
  () => {
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
  }
);

ClearOperationDataSuite.run();
