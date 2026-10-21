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

  test('given an empty-string intermediate value, when the chain reads its length, then it returns 0 instead of throwing', () => {
    expect(getPropertyChainValue(['a', 'length'], {a: ''})).toBe(0);
  });

  test('given zero and false intermediate values, when the chain reads a member of them, then the member is returned', () => {
    expect(typeof getPropertyChainValue(['a', 'toFixed'], {a: 0})).toBe(
      'function'
    );
    expect(typeof getPropertyChainValue(['a', 'valueOf'], {a: false})).toBe(
      'function'
    );
  });

  test('given a null intermediate value, when the chain reads past it, then it still throws', () => {
    expect(() => getPropertyChainValue(['a', 'b'], {a: null})).toThrow(
      "Property chain 'a.b' cannot be resolved."
    );
  });

  test('given an undefined intermediate value, when the chain reads past it, then it still throws', () => {
    expect(() => getPropertyChainValue(['a', 'b', 'c'], {a: {}})).toThrow(
      "Property chain 'a.b.c' cannot be resolved."
    );
  });

  test('given a constructor.constructor chain, when it is resolved against a plain object, then it throws instead of returning the global Function constructor', () => {
    expect(() =>
      getPropertyChainValue(['x', 'constructor', 'constructor'], {x: 's'})
    ).toThrow(/forbidden segment 'constructor'/);
  });

  test.each([
    ['__proto__', ['__proto__', 'polluted']],
    ['prototype', ['fn', 'prototype']],
    ['constructor', ['constructor']],
    ['__proto__', ['items[0]', '__proto__']],
    ['__proto__', ['a.__proto__']],
    ['constructor', ['value', 'constructor+px']],
  ])(
    'given a chain containing %s, when it is resolved, then it throws naming the segment and the chain',
    (segment, chain) => {
      expect(() =>
        getPropertyChainValue(chain, {
          fn() {},
          items: [{}],
          a: {},
          value: 1,
        })
      ).toThrow(`forbidden segment '${segment}'`);
    }
  );

  test('given an operation name, when a forbidden chain is resolved, then the error names the operation', () => {
    expect(() => getPropertyChainValue(['__proto__'], {}, 'setData')).toThrow(
      "setData: property chain '__proto__' contains forbidden segment '__proto__'"
    );
  });

  test('given array index and length segments, when they are resolved, then own array members still work', () => {
    expect(getPropertyChainValue(['items', '1'], {items: ['a', 'b']})).toBe(
      'b'
    );
    expect(getPropertyChainValue(['items', 'length'], {items: ['a']})).toBe(1);
  });
});
