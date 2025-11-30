import {getGlobals} from '@operation/helper/globals.ts';
import {setGlobal} from '@operation/helper/set-global.ts';
import {type IOperationScope, setData} from '@operation/index.ts';
import type {ISetDataOperationData} from '@operation/set-data.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {afterAll, describe, expect, test} from 'vitest';

describe('setData', () => {
  afterAll(() => {
    setGlobal('globalTarget', undefined);
  });
  test('should set the data', () => {
    // given
    const operationData: ISetDataOperationData & Record<string, any> = {
      properties: {
        '$scope.newIndex': '$operationdata.testValue',
        '$operationdata.testTarget': '$scope.currentItem',
        '$globaldata.globalTarget': '$operationdata.testGlobalValue',
      },
      testTarget: undefined,
      testGlobalValue: 'bar',
      testValue: 100,
    };
    const scope = {
      currentItem: 'foo',
      newIndex: 0,
    } as IOperationScope;

    // test
    const newData = applyOperation(setData, operationData, scope) as Record<
      string,
      any
    >;

    // given
    expect(newData.testTarget).toBe('foo');
    expect(scope.newIndex).toBe(100);
    expect(getGlobals('globalTarget')).toBe('bar');
  });
  test('should set complex data', () => {
    // given
    const operationData: ISetDataOperationData & Record<string, any> = {
      properties: {
        '$scope.currentItem.value': '$operationdata.testValue',
        '$operationdata.testTarget.value': 'foo',
      },
      testTarget: {
        value: undefined,
      },
      testValue: 100,
    };
    const scope = {
      currentItem: {
        value: 'foo',
      },
      newIndex: 0,
    } as IOperationScope;

    // test
    const newData = applyOperation(setData, operationData, scope) as Record<
      string,
      any
    >;

    // given
    expect(newData.testTarget.value).toBe('foo');
    expect(scope.currentItem.value).toBe(100);
  });
});
