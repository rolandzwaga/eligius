import { expect } from 'chai';
import { suite } from 'uvu';
import type { IOperationContext } from '../../../../operation/index.ts';
import { removeGlobal } from '../../../../operation/helper/remove-global.ts';
import { type ExternalProperty, resolveExternalPropertyChain } from '../../../../operation/helper/resolve-external-property-chain.ts';
import { setGlobal } from '../../../../operation/helper/set-global.ts';

const ResolveExternalPropertyChainSuite = suite('resolveExternalPropertyChain');

ResolveExternalPropertyChainSuite.before(() => {
  setGlobal('foo', 'bar');
});

ResolveExternalPropertyChainSuite.after(() => {
  removeGlobal('foo');
});

ResolveExternalPropertyChainSuite(
  'should resolve the operation data argument values',
  () => {
    // given
    const operationData = {
      extractedValue: 'test',
      operationDataArgument: 'operationdata.extractedValue',
    };
    const operationContext = {} as IOperationContext;

    // test
    const value = resolveExternalPropertyChain(
      operationData,
      operationContext,
      operationData.operationDataArgument as ExternalProperty
    );

    // expect
    expect(value).to.equal(operationData.extractedValue);
  }
);

ResolveExternalPropertyChainSuite(
  'should resolve the global data argument values',
  () => {
    // given
    const operationData = {
      operationDataArgument: 'globaldata.foo',
    };
    const operationContext = {} as IOperationContext;

    // test
    const value = resolveExternalPropertyChain(
      operationData,
      operationContext,
      operationData.operationDataArgument as ExternalProperty
    );

    // expect
    expect(value).to.equal('bar');
  }
);

ResolveExternalPropertyChainSuite(
  'should resolve the context argument values',
  () => {
    // given
    const operationData = {
      operationDataArgument: 'context.currentIndex',
    };
    const operationContext = { currentIndex: 100 } as IOperationContext;

    // test
    const value = resolveExternalPropertyChain(
      operationData,
      operationContext,
      operationData.operationDataArgument as ExternalProperty
    );

    // expect
    expect(value).to.equal(100);
  }
);

ResolveExternalPropertyChainSuite(
  'should return null if argumentValue is null',
  () => {
    // given
    const operationData = {};
    const operationContext = {} as IOperationContext;

    // test
    const value = resolveExternalPropertyChain(
      operationData,
      operationContext,
      null
    );

    // expect
    expect(value).to.be.null;
  }
);

ResolveExternalPropertyChainSuite(
  'should return argumentValue when argumentValue is complex value',
  () => {
    // given
    const operationData = {};
    const arg = {};
    const operationContext = {} as IOperationContext;

    // test
    const value = resolveExternalPropertyChain(
      operationData,
      operationContext,
      arg
    );

    // expect
    expect(value).to.equal(arg);
  }
);

ResolveExternalPropertyChainSuite.run();
