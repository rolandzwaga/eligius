import { expect } from 'chai';
import { suite } from 'uvu';
import { getPropertyChainValue } from '../../../../operation/helper/get-property-chain-value';

const GetNestedValueSuite = suite('getNestedValue');

GetNestedValueSuite('should get the nested value', () => {
  // given
  const operationData = {
    complexProperty: {
      anotherComplexProperty: {
        value: 'test',
      },
    },
  };

  // test
  const value = getPropertyChainValue(
    ['complexProperty', 'anotherComplexProperty', 'value'],
    operationData
  );

  // expect
  expect(value).to.equal('test');
});

GetNestedValueSuite(
  'should get the nested value and suffix it with the given value',
  () => {
    // given
    const operationData = {
      complexProperty: {
        anotherComplexProperty: {
          value: 100,
        },
      },
    };

    // test
    const value = getPropertyChainValue(
      ['complexProperty', 'anotherComplexProperty', 'value+px'],
      operationData
    );

    // expect
    expect(value).to.equal('100px');
  }
);

GetNestedValueSuite.run();
