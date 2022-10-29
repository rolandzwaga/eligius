import { expect } from 'chai';
import { suite } from 'uvu';
import { removePropertiesFromOperationData } from '../../../operation/remove-properties-from-operation-data';
import { applyOperation } from '../../../util/apply-operation';

const RemovePropertiesFromOperationDataSuite = suite(
  'removePropertiesFromOperationData'
);

RemovePropertiesFromOperationDataSuite(
  'should remove the specified properties from the given operationData',
  () => {
    // given
    const operationData = {
      testProp1: 'test1',
      testProp2: 'test2',
      testProp3: 'test3',
      propertyNames: ['testProp1', 'testProp2'],
    };

    // test
    const newData = applyOperation<typeof operationData>(
      removePropertiesFromOperationData,
      operationData
    );

    // expect
    expect(newData.hasOwnProperty('testProp1')).to.be.false;
    expect(newData.hasOwnProperty('testProp2')).to.be.false;
    expect(newData.hasOwnProperty('propertyNames')).to.be.false;
    expect(newData.testProp3).to.equal('test3');
  }
);

RemovePropertiesFromOperationDataSuite.run();
