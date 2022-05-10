import { expect } from 'chai';
import { suite } from 'uvu';
import { resolveEventArguments } from '../../../../operation/helper/resolve-event-arguments';

const ResolveEventArgumentsSuite = suite('resolveEventArguments');

ResolveEventArgumentsSuite(
  'should return undefined when eventArgs is null',
  () => {
    // given
    const operationData = {};

    // test
    const resolved = resolveEventArguments(operationData);

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
  const eventArgs = ['operationdata.complexProperty.test'];

  // test
  const resolved = resolveEventArguments(operationData, eventArgs);

  // expect
  expect(resolved?.length).to.equal(1);
  expect(resolved?.[0]).to.equal('test');
});

ResolveEventArgumentsSuite.run();
