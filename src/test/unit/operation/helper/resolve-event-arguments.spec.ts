import {expect} from 'chai';
import {describe, test} from 'vitest';
import {resolveEventArguments} from '../../../../operation/helper/resolve-event-arguments.ts';
import type {IOperationScope} from '../../../../operation/index.ts';

describe('resolveEventArguments', () => {
  test('should return undefined when eventArgs is undefined', () => {
    // given
    const operationData = {};
    const operationScope = {} as IOperationScope;

    // test
    const resolved = resolveEventArguments(operationData, operationScope);

    // expect
    expect(resolved).to.be.undefined;
  });
  test('should resolve the given event argument', () => {
    // given
    const operationData = {
      complexProperty: {
        test: 'test',
      },
    };
    const operationScope = {} as IOperationScope;
    const eventArgs = ['operationdata.complexProperty.test'];

    // test
    const resolved = resolveEventArguments(
      operationData,
      operationScope,
      eventArgs
    );

    // expect
    expect(resolved?.length).to.equal(1);
    expect(resolved?.[0]).to.equal('test');
  });
});
