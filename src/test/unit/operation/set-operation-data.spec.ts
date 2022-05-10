import { expect } from 'chai';
import { suite } from 'uvu';
import { setOperationData } from '../../../operation/set-operation-data';
import { applyOperation } from '../../../util/apply-operation';

const SetOperationDataSuite = suite('setOperationData');

SetOperationDataSuite('should set the specified operation data', () => {
  // given
  const operationData = {
    unusedProperty: 'test',
    testProperty: 'testProperty1',
    properties: {
      prop1: 'prop1',
      prop2: 'prop2',
      prop3: 'operationdata.testProperty',
    },
  };

  // test
  const newData = applyOperation<
    typeof operationData.properties & { unusedProperty: string }
  >(setOperationData, operationData);

  // expect
  expect(newData.unusedProperty).to.equal('test');
  expect(newData.prop1).to.equal('prop1');
  expect(newData.prop2).to.equal('prop2');
  expect(newData.prop3).to.equal('testProperty1');
});

SetOperationDataSuite(
  'should override all the existing operationdata with the specified data',
  () => {
    // given
    const operationData = {
      unusedProperty: 'test',
      testProperty: 'testProperty1',
      override: true,
      properties: {
        prop1: 'prop1',
        prop2: 'prop2',
        prop3: 'operationdata.testProperty',
      },
    };

    // test
    const newData = applyOperation<
      typeof operationData.properties & {
        unusedProperty: string;
        testProperty: string;
        override: boolean;
      }
    >(setOperationData, operationData);

    // expect
    expect(newData.unusedProperty).to.be.undefined;
    expect(newData.testProperty).to.be.undefined;
    expect(newData.override).to.be.undefined;
    expect(newData.prop1).to.equal('prop1');
    expect(newData.prop2).to.equal('prop2');
    expect(newData.prop3).to.equal('testProperty1');
  }
);

SetOperationDataSuite.run();
