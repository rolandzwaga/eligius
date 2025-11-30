import {expect, beforeAll, describe, test} from 'vitest';
import {clearGlobals, getGlobals} from '../../../operation/helper/globals.ts';
import {
  type ISetGlobalDataOperationData,
  setGlobalData,
} from '../../../operation/set-global-data.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

describe('setGlobalData', () => {
  beforeAll(() => {
    clearGlobals();
  });
  test('should set the specified values on the global data', () => {
    // given
    const operationData = {
      propertyNames: ['foo', 'bar'],
      foo: 'bar',
      bar: 'foo',
      test: false,
    } as ISetGlobalDataOperationData;

    // test
    const result = applyOperation(setGlobalData, operationData);
    const globals = getGlobals();

    // expect
    expect(result).toEqual({foo: 'bar', bar: 'foo', test: false});
    expect(globals).toEqual({foo: 'bar', bar: 'foo'});
  });

  test('should remove the propertyNames property from the operation data', () => {
    // given
    const operationData = {
      propertyNames: ['foo', 'bar'],
      foo: 'bar',
      bar: 'foo',
      test: false,
    } as ISetGlobalDataOperationData;

    // test
    const result = applyOperation(setGlobalData, operationData);
    const globals = getGlobals();

    // expect
    expect('propertyNames' in result).toBe(false);
  });
});
