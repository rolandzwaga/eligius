import { expect } from 'chai';
import { suite } from 'uvu';
import { IOperationContext } from '../../../../operation';
import { resolveEventArguments } from '../../../../operation/helper/resolve-event-arguments';

const ResolveEventArgumentsSuite = suite('resolveEventArguments');

ResolveEventArgumentsSuite(
  'should return undefined when eventArgs is undefined',
  () => {
    // given
    const operationData = {};
    const operationContext = {} as IOperationContext;

    // test
    const resolved = resolveEventArguments(operationData, operationContext);

    // expect
    expect(resolved).to.be.undefined;
  }
);

ResolveEventArgumentsSuite('should resolve the given event argument', () => {
  // given
  const operationData = {
    complexProperty: {
      test: 'test',
    },
  };
  const operationContext = {} as IOperationContext;
  const eventArgs = ['operationdata.complexProperty.test'];

  // test
  const resolved = resolveEventArguments(
    operationData,
    operationContext,
    eventArgs
  );

  // expect
  expect(resolved?.length).to.equal(1);
  expect(resolved?.[0]).to.equal('test');
});

ResolveEventArgumentsSuite.run();
