import {expect, afterAll, beforeAll, describe, test} from 'vitest';
import {removeGlobal} from '../../../../operation/helper/remove-global.ts';
import {
  type ExternalProperty,
  resolveExternalPropertyChain,
} from '../../../../operation/helper/resolve-external-property-chain.ts';
import {setGlobal} from '../../../../operation/helper/set-global.ts';
import type {IOperationScope} from '../../../../operation/index.ts';

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
