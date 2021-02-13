import { expect } from 'chai';
import { getNestedValue } from '../../../../operation/helper/get-nested-value';

describe('getNestedValue', () => {
  it('should get the nested value', () => {
    // given
    const operationData = {
      complexProperty: {
        anotherComplexProperty: {
          value: 'test',
        },
      },
    };

    // test
    const value = getNestedValue(['complexProperty', 'anotherComplexProperty', 'value'], operationData);

    // expect
    expect(value).to.equal('test');
  });

  it('should get the nested value and suffix it with the given value', () => {
    // given
    const operationData = {
      complexProperty: {
        anotherComplexProperty: {
          value: 100,
        },
      },
    };

    // test
    const value = getNestedValue(['complexProperty', 'anotherComplexProperty', 'value+px'], operationData);

    // expect
    expect(value).to.equal('100px');
  });
});
