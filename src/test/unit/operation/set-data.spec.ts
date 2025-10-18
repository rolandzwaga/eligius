import {expect} from 'chai';
import {afterAll, describe, test} from 'vitest';
import {getGlobals} from '../../../operation/helper/globals.ts';
import {setGlobal} from '../../../operation/helper/set-global.ts';
import {type IOperationScope, setData} from '../../../operation/index.ts';
import type {ISetDataOperationData} from '../../../operation/set-data.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

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
    expect(newData.testTarget).to.equal('foo');
    expect(scope.newIndex).to.equal(100);
    expect(getGlobals('globalTarget')).to.equal('bar');
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
    expect(newData.testTarget.value).to.equal('foo');
    expect(scope.currentItem.value).to.equal(100);
  });
});
