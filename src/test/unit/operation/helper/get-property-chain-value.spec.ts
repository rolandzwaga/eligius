import {getPropertyChainValue} from '@operation/helper/get-property-chain-value.ts';
import {describe, expect, test} from 'vitest';

describe('getNestedValue', () => {
  test('should get the nested value', () => {
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
    expect(value).toBe('test');
  });
  test('should get the nested value and suffix it with the given value', () => {
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
    expect(value).toBe('100px');
  });
});
