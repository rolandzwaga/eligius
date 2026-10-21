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

  test('given setOperationData-style properties with a nested object and an array holding $operationdata strings, when resolvePropertyValues is called with a separate properties object, then the returned copy has the resolved values and the input is not mutated', () => {
    // given
    const operationData: any = {name: 'x', x: 5};
    const operationScope = {} as IOperationScope;
    const properties = {
      nested: {a: '$operationdata.name', deeper: {b: '$operationdata.x'}},
      arr: ['$operationdata.name', {c: '$operationdata.x'}, 'literal'],
    };
    const original = JSON.parse(JSON.stringify(properties));

    // test
    const resolved = resolvePropertyValues<any>(
      operationData,
      operationScope,
      properties
    );

    // expect
    expect(resolved).toEqual({
      nested: {a: 'x', deeper: {b: 5}},
      arr: ['x', {c: 5}, 'literal'],
    });
    expect(properties).toEqual(original);
  });

  test('given properties that are the operation data itself, when nested values are resolved, then they are resolved in place', () => {
    // given
    const operationData: any = {
      name: 'x',
      nested: {a: '$operationdata.name'},
      arr: ['$operationdata.name'],
    };

    // test
    const resolved = resolvePropertyValues<any>(
      operationData,
      {} as IOperationScope,
      operationData
    );

    // expect
    expect(resolved).toBe(operationData);
    expect(resolved.nested.a).toBe('x');
    expect(resolved.arr[0]).toBe('x');
  });
});

describe('resolvePropertyValues does not walk or mutate shared objects', () => {
  test('given operation data holding a class instance with a property chain inside, when it is resolved in place, then the instance is not walked', () => {
    // given
    class Holder {
      config = {selector: '$operationdata.panelSelector'};
    }
    const holder = new Holder();
    const operationData: any = {
      holder,
      value: '$operationdata.name',
      name: 'x',
    };

    // test
    const resolved = resolvePropertyValues<any>(
      operationData,
      {} as IOperationScope,
      operationData
    );

    // expect
    expect(resolved.value).toBe('x');
    expect(resolved.holder).toBe(holder);
    expect(holder.config.selector).toBe('$operationdata.panelSelector');
  });

  test('given a nested plain object shared with other data, when it is resolved in place, then the shared object is replaced by a resolved copy and not mutated', () => {
    // given
    const shared = {a: '$operationdata.name', untouched: {b: 1}};
    const operationData: any = {name: 'x', nested: shared};

    // test
    const resolved = resolvePropertyValues<any>(
      operationData,
      {} as IOperationScope,
      operationData
    );

    // expect
    expect(resolved.nested).toEqual({a: 'x', untouched: {b: 1}});
    expect(resolved.nested).not.toBe(shared);
    expect(resolved.nested.untouched).toBe(shared.untouched);
    expect(shared.a).toBe('$operationdata.name');
  });

  test('given cyclic plain data, when it is resolved, then it terminates', () => {
    // given
    const cyclic: any = {a: '$operationdata.name'};
    cyclic.self = cyclic;
    const operationData: any = {name: 'x', cyclic};

    // test
    const resolved = resolvePropertyValues<any>(
      operationData,
      {} as IOperationScope,
      operationData
    );

    // expect
    expect(resolved.cyclic.a).toBe('x');
  });
});
