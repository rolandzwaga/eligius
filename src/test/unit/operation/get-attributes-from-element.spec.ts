import { expect } from 'chai';
import { suite } from 'uvu';
import { getAttributesFromElement } from '../../../operation';
import { IGetAttributesFromElementOperationData } from '../../../operation/get-attributes-from-element';
import { applyOperation } from '../../../util/apply-operation';

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
