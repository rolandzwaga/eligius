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
  test('should resolve a bracket array-index segment', () => {
    // given
    const operationData = {eventArgs: ['#first', '#second']};

    // test / expect
    expect(getPropertyChainValue(['eventArgs[0]'], operationData)).toBe(
      '#first'
    );
    expect(getPropertyChainValue(['eventArgs[1]'], operationData)).toBe(
      '#second'
    );
  });
  test('should resolve bracket indices mixed with dotted properties', () => {
    // given
    const operationData = {items: [{label: 'a'}, {label: 'b'}]};

    // test
    const value = getPropertyChainValue(['items[1]', 'label'], operationData);

    // expect
    expect(value).toBe('b');
  });
  test('should treat bracket notation as equivalent to dot notation', () => {
    // given
    const operationData = {rows: [['x', 'y']]};

    // test / expect — nested indices
    expect(getPropertyChainValue(['rows[0][1]'], operationData)).toBe('y');
    expect(getPropertyChainValue(['rows', '0', '1'], operationData)).toBe('y');
  });
  test('should still suffix a bracket-indexed terminal value', () => {
    // given
    const operationData = {sizes: [42]};

    // test
    const value = getPropertyChainValue(['sizes[0]+px'], operationData);

    // expect
    expect(value).toBe('42px');
  });
});
