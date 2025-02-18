import { expect } from 'chai';
import { suite } from 'uvu';
import { getAttributesFromElement } from '../../../operation/index.ts';
import type { IGetAttributesFromElementOperationData } from '../../../operation/get-attributes-from-element.ts';
import { applyOperation } from '../../../util/apply-operation.ts';

const GetAttibutesFromElementSuite = suite('getAttibutesFromElement');

GetAttibutesFromElementSuite('should extend the given controller', () => {
  // given
  const operationData: IGetAttributesFromElementOperationData = {
    selectedElement: {
      attr: (name: string) => `${name}Value`,
    } as unknown as JQuery,
    attributeNames: ['foo', 'bar'],
  };

  // test
  const newData = applyOperation<{
    attributeValues: Record<string, any>;
  }>(getAttributesFromElement, operationData);

  // expect
  expect(newData.attributeValues).to.eql({ foo: 'fooValue', bar: 'barValue' });
});

GetAttibutesFromElementSuite.run();
