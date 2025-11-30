import {resolvePropertyValues} from '@operation/helper/resolve-property-values.ts';
import {setGlobal} from '@operation/helper/set-global.ts';
import type {IOperationScope} from '@operation/index.ts';
import {describe, expect, test} from 'vitest';

describe('resolvePropertyValues', () => {
  test('should resolve the given property values', () => {
    // given
    const operationData: any = {
      test1: 'test1',
      test2: 100,
      test3: true,
    };
    const operationScope = {} as IOperationScope;
    const properties = {
      testValue1: '$operationdata.test1',
      testValue2: '$operationdata.test2',
      testValue3: '$operationdata.test3',
    };

    // test
    const resolved = resolvePropertyValues<
      typeof operationData & typeof properties
    >(operationData, operationScope, properties);

    // expect
    expect(resolved.testValue1).toBe('test1');
    expect(resolved.testValue2).toBe(100);
    expect(resolved.testValue3).toBe(true);
  });
  test('should resolve the given property values on the operationdata itself', () => {
    // given
    const operationData = {
      test1: 'test1',
      test2: 100,
      test3: true,
      currentItem: {title: 'test'},
      resolvedItem: '$operationdata.currentItem.title',
    };
    const operationScope = {} as IOperationScope;

    // test
    const resolved = resolvePropertyValues(
      operationData,
      operationScope,
      operationData
    );

    // expect
    expect(resolved.resolvedItem).toBe('test');
  });
  test('should resolve the given property values on the global data', () => {
    // given
    const operationData = {
      test1: 'test1',
      test2: 100,
      test3: true,
      currentItem: {title: 'test'},
      resolvedItem: '$globaldata.globalTitle',
    };
    const operationScope = {} as IOperationScope;
    setGlobal('globalTitle', 'global title');

    // test
    const resolved = resolvePropertyValues(
      operationData,
      operationScope,
      operationData
    );

    // expect
    expect(resolved.resolvedItem).toBe('global title');
  });
  test('should resolve the given property values on the scope', () => {
    // given
    const operationData = {
      test1: 'test1',
      test2: 100,
      test3: true,
      currentItem: {title: 'test'},
      resolvedItem: '$scope.currentIndex',
    };
    const operationScope = {currentIndex: 100} as IOperationScope;

    // test
    const resolved = resolvePropertyValues(
      operationData,
      operationScope,
      operationData
    );

    // expect
    expect(resolved.resolvedItem).toBe(100);
  });
});
