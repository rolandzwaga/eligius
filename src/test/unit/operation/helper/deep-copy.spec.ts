import {Action} from '@action/action.ts';
import {ConfigurationFactory} from '@configuration/api/index.ts';
import {deepCopy} from '@operation/helper/deep-copy.ts';
import {mapArray} from '@operation/map-array.ts';
import {createMockEventbus} from '@test/fixtures/eventbus-factory.ts';
import $ from 'jquery';
import {describe, expect, test} from 'vitest';

describe('deepCopy', () => {
  test('given nested plain data, when it is copied, then the copy is equal but shares no objects with the original', () => {
    const original = {a: 1, nested: {b: [1, {c: 'x'}]}, d: new Date(0)};

    const copy = deepCopy(original);

    expect(copy).toEqual(original);
    expect(copy).not.toBe(original);
    expect(copy.nested).not.toBe(original.nested);
    expect(copy.nested.b).not.toBe(original.nested.b);
    expect(copy.nested.b[1]).not.toBe(original.nested.b[1]);
    expect(copy.d).not.toBe(original.d);
    expect(copy.d.getTime()).toBe(0);
  });

  test('given function-valued properties, when they are copied, then the functions are kept by reference instead of throwing DataCloneError', () => {
    const mapFunction = (x: number) => x * 2;
    const original = {mapFunction, nested: {list: [mapFunction]}};

    const copy = deepCopy(original);

    expect(copy.mapFunction).toBe(mapFunction);
    expect(copy.nested.list[0]).toBe(mapFunction);
    expect(copy.nested).not.toBe(original.nested);
  });

  test('given jQuery and DOM node values, when they are copied, then they are kept by reference', () => {
    const element = document.createElement('div');
    const selectedElement = $(element);
    const original = {selectedElement, element};

    const copy = deepCopy(original);

    expect(copy.selectedElement).toBe(selectedElement);
    expect(copy.element).toBe(element);
  });

  test('given a cyclic structure, when it is copied, then the cycle is preserved in the copy', () => {
    const original: any = {name: 'root'};
    original.self = original;

    const copy = deepCopy(original);

    expect(copy).not.toBe(original);
    expect(copy.self).toBe(copy);
  });

  test('given an own __proto__ key from parsed JSON, when it is copied, then it stays an own data property and does not change the prototype', () => {
    const original = JSON.parse('{"__proto__": {"polluted": "yes"}}');

    const copy = deepCopy(original);

    expect(Object.getPrototypeOf(copy)).toBe(Object.prototype);
    expect(copy.polluted).toBeUndefined();
    expect(({} as any).polluted).toBeUndefined();
  });

  test('given null, undefined and primitives, when they are copied, then they are returned as-is', () => {
    expect(deepCopy(null)).toBeNull();
    expect(deepCopy(undefined)).toBeUndefined();
    expect(deepCopy(5)).toBe(5);
    expect(deepCopy('s')).toBe('s');
  });

  test('given a ConfigurationFactory init action with a mapArray start operation whose mapFunction is a function, when the configuration is built and the action is run, then it does not throw and mappedArray contains the mapped values', async () => {
    // given
    const factory = new ConfigurationFactory();
    factory.init('en-US');
    factory
      .createInitAction('MapNumbers')
      .addStartOperationByType(mapArray, {
        arrayData: [1, 2, 3],
        mapFunction: (x: number) => x * 2,
      } as any)
      .next()
      .end();

    // test
    const configuration = factory.getConfiguration();
    const operationConfig = configuration.initActions[0].startOperations[0];
    const action = new Action(
      'MapNumbers',
      [
        {
          id: operationConfig.id,
          systemName: operationConfig.systemName,
          operationData: operationConfig.operationData ?? {},
          instance: mapArray,
        },
      ],
      createMockEventbus()
    );
    const result = await action.start();

    // expect
    expect(result.mappedArray).toEqual([2, 4, 6]);
  });
});
