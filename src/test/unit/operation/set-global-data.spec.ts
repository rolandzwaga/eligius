import { expect } from 'chai';
import { suite } from 'uvu';
import { clearGlobals, getGlobals } from '../../../operation/helper/globals.ts';
import {
  type ISetGlobalDataOperationData,
  setGlobalData,
} from '../../../operation/set-global-data.ts';
import { applyOperation } from '../../../util/apply-operation.ts';

const SetGlobalDataSuite = suite('setGlobalData');

SetGlobalDataSuite.before(() => {
  clearGlobals();
});

SetGlobalDataSuite('should set the specified values on the global data', () => {
  // given
  const operationData = {
    properties: ['foo', 'bar'],
    foo: 'bar',
    bar: 'foo',
    test: false,
  };

  // test
  const result = applyOperation<ISetGlobalDataOperationData>(
    setGlobalData,
    operationData
  );
  const globals = getGlobals();

  // expect
  expect(result).to.eql({ foo: 'bar', bar: 'foo', test: false });
  expect(globals).to.eql({ foo: 'bar', bar: 'foo' });
});

SetGlobalDataSuite.run();
