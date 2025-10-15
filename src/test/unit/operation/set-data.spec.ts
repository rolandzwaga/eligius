import {expect} from 'chai';
import {afterAll, describe, test} from 'vitest';
import {getGlobals} from '../../../operation/helper/globals.ts';
import {setGlobal} from '../../../operation/helper/set-global.ts';
import {type IOperationContext, setData} from '../../../operation/index.ts';
import type {ISetDataOperationData} from '../../../operation/set-data.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

describe.concurrent('setData', () => {
  afterAll(() => {
    setGlobal('globalTarget', undefined);
  });
  test('should set the data', () => {
    // given
    const operationData: ISetDataOperationData & Record<string, any> = {
      properties: {
        'context.newIndex': 'operationdata.testValue',
        'operationdata.testTarget': 'context.currentItem',
        'globaldata.globalTarget': 'operationdata.testGlobalValue',
      },
      testTarget: undefined,
      testGlobalValue: 'bar',
      testValue: 100,
    };
    const context = {
      currentItem: 'foo',
      newIndex: 0,
    } as IOperationContext;

    // test
    const newData = applyOperation(setData, operationData, context) as Record<
      string,
      any
    >;

    // given
    expect(newData.testTarget).to.equal('foo');
    expect(context.newIndex).to.equal(100);
    expect(getGlobals('globalTarget')).to.equal('bar');
  });
  test('should set complex data', () => {
    // given
    const operationData: ISetDataOperationData & Record<string, any> = {
      properties: {
        'context.currentItem.value': 'operationdata.testValue',
        'operationdata.testTarget.value': 'foo',
      },
      testTarget: {
        value: undefined,
      },
      testValue: 100,
    };
    const context = {
      currentItem: {
        value: 'foo',
      },
      newIndex: 0,
    } as IOperationContext;

    // test
    const newData = applyOperation(setData, operationData, context) as Record<
      string,
      any
    >;

    // given
    expect(newData.testTarget.value).to.equal('foo');
    expect(context.currentItem.value).to.equal(100);
  });
});
