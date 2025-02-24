import { expect } from 'chai';
import { describe, test } from 'vitest';
import type { IGetAttributesFromElementOperationData } from '../../../operation/get-attributes-from-element.ts';
import { getAttributesFromElement } from '../../../operation/index.ts';
import { applyOperation } from '../../../util/apply-operation.ts';
describe.concurrent('getAttibutesFromElement', () => {
  test('should extend the given controller', () => {
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
});
