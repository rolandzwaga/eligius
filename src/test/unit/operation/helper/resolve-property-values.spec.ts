import { expect } from 'chai';
import { suite } from 'uvu';
import { resolvePropertyValues } from '../../../../operation/helper/resolve-property-values';
import { setGlobal } from '../../../../operation/helper/set-global';

const ResolvePropertyValuesSuite = suite('resolvePropertyValues');

ResolvePropertyValuesSuite('should resolve the given property values', () => {
  // given
  const operationData = {
    test1: 'test1',
    test2: 100,
    test3: true,
  };
  const properties = {
    testValue1: 'operationdata.test1',
    testValue2: 'operationdata.test2',
    testValue3: 'operationdata.test3',
  };

  // test
  const resolved = resolvePropertyValues<
    typeof operationData & typeof properties
  >(operationData as any, properties);

  // expect
  expect(resolved.testValue1).to.equal('test1');
  expect(resolved.testValue2).to.equal(100);
  expect(resolved.testValue3).to.be.true;
});

ResolvePropertyValuesSuite(
  'should resolve the given property values on the operationdata itself',
  () => {
    // given
    const operationData = {
      test1: 'test1',
      test2: 100,
      test3: true,
      currentItem: { title: 'test' },
      resolvedItem: 'operationdata.currentItem.title',
    };

    // test
    const resolved = resolvePropertyValues(operationData, operationData);

    // expect
    expect(resolved.resolvedItem).to.equal('test');
  }
);

ResolvePropertyValuesSuite(
  'should resolve the given property values on the global data',
  () => {
    // given
    const operationData = {
      test1: 'test1',
      test2: 100,
      test3: true,
      currentItem: { title: 'test' },
      resolvedItem: 'globaldata.globalTitle',
    };
    setGlobal('globalTitle', 'global title');

    // test
    const resolved = resolvePropertyValues(operationData, operationData);

    // expect
    expect(resolved.resolvedItem).to.equal('global title');
  }
);


ResolvePropertyValuesSuite.run();
