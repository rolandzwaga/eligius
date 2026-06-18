import {removeGlobal} from '@operation/helper/remove-global.ts';
import {
  type ExternalProperty,
  resolveExternalPropertyChain,
} from '@operation/helper/resolve-external-property-chain.ts';
import {setGlobal} from '@operation/helper/set-global.ts';
import type {IOperationScope} from '@operation/index.ts';
import {afterAll, beforeAll, describe, expect, test} from 'vitest';

describe('resolveExternalPropertyChain', () => {
  beforeAll(() => {
    setGlobal('foo', 'bar');
  });
  afterAll(() => {
    removeGlobal('foo');
  });
  test('should resolve the operation data argument values', () => {
    // given
    const operationData = {
      extractedValue: 'test',
      operationDataArgument: '$operationdata.extractedValue',
    };
    const operationScope = {} as IOperationScope;

    // test
    const value = resolveExternalPropertyChain(
      operationData,
      operationScope,
      operationData.operationDataArgument as ExternalProperty
    );

    // expect
    expect(value).toBe(operationData.extractedValue);
  });
  test('should resolve the global data argument values', () => {
    // given
    const operationData = {
      operationDataArgument: '$globaldata.foo',
    };
    const operationScope = {} as IOperationScope;

    // test
    const value = resolveExternalPropertyChain(
      operationData,
      operationScope,
      operationData.operationDataArgument as ExternalProperty
    );

    // expect
    expect(value).toBe('bar');
  });
  test('should resolve a bracket array-index in an operationdata chain', () => {
    // given: the shape an `on event` handler sees — args land on eventArgs[]
    const operationData = {eventArgs: ['#first', '#second']};
    const operationScope = {} as IOperationScope;

    // test / expect — bracket notation resolves the array element
    expect(
      resolveExternalPropertyChain(
        operationData,
        operationScope,
        '$operationdata.eventArgs[0]' as ExternalProperty
      )
    ).toBe('#first');
    expect(
      resolveExternalPropertyChain(
        operationData,
        operationScope,
        '$operationdata.eventArgs[1]' as ExternalProperty
      )
    ).toBe('#second');
  });
  test('should resolve the scope argument values', () => {
    // given
    const operationData = {
      operationDataArgument: '$scope.currentIndex',
    };
    const operationScope = {currentIndex: 100} as IOperationScope;

    // test
    const value = resolveExternalPropertyChain(
      operationData,
      operationScope,
      operationData.operationDataArgument as ExternalProperty
    );

    // expect
    expect(value).toBe(100);
  });
  test('should resolve a $scope variable declared on a parent scope', () => {
    // given: a child scope (as forEach/when create) whose parent holds the variable
    const parent = {
      variables: {items: ['a', 'b', 'c']},
    } as unknown as IOperationScope;
    const child = {parent} as unknown as IOperationScope;

    // test
    const value = resolveExternalPropertyChain(
      {},
      child,
      '$scope.variables.items' as ExternalProperty
    );

    // expect
    expect(value).toEqual(['a', 'b', 'c']);
  });
  test('should resolve through multiple parent scopes', () => {
    // given
    const grandparent = {
      variables: {greeting: 'hi'},
    } as unknown as IOperationScope;
    const parent = {parent: grandparent} as unknown as IOperationScope;
    const child = {parent} as unknown as IOperationScope;

    // test
    const value = resolveExternalPropertyChain(
      {},
      child,
      '$scope.variables.greeting' as ExternalProperty
    );

    // expect
    expect(value).toBe('hi');
  });
  test('should let an inner scope shadow an outer scope variable', () => {
    // given: same variable name on both scopes — the nearest one wins
    const parent = {
      variables: {x: 'outer'},
    } as unknown as IOperationScope;
    const child = {
      variables: {x: 'inner'},
      parent,
    } as unknown as IOperationScope;

    // test
    const value = resolveExternalPropertyChain(
      {},
      child,
      '$scope.variables.x' as ExternalProperty
    );

    // expect
    expect(value).toBe('inner');
  });
  test('should throw when a $scope variable exists on no scope in the chain', () => {
    // given
    const child = {
      parent: {} as IOperationScope,
    } as unknown as IOperationScope;

    // test / expect
    expect(() =>
      resolveExternalPropertyChain(
        {},
        child,
        '$scope.variables.missing' as ExternalProperty
      )
    ).toThrow(/cannot be resolved/);
  });
  test('should return null if argumentValue is null', () => {
    // given
    const operationData = {};
    const operationScope = {} as IOperationScope;

    // test
    const value = resolveExternalPropertyChain(
      operationData,
      operationScope,
      null
    );

    // expect
    expect(value).toBeNull();
  });
  test('should return argumentValue when argumentValue is complex value', () => {
    // given
    const operationData = {};
    const arg = {};
    const operationScope = {} as IOperationScope;

    // test
    const value = resolveExternalPropertyChain(
      operationData,
      operationScope,
      arg
    );

    // expect
    expect(value).toBe(arg);
  });
});
