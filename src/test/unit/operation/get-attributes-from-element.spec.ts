import {expect, describe, test} from 'vitest';
import type {IGetAttributesFromElementOperationData} from '../../../operation/get-attributes-from-element.ts';
import {getAttributesFromElement} from '../../../operation/index.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

describe('getAttibutesFromElement', () => {
  test('should extend the given controller', () => {
    // given
    const operationData: IGetAttributesFromElementOperationData = {
      selectedElement: {
        attr: (name: string) => `${name}Value`,
      } as unknown as JQuery,
      attributeNames: ['foo', 'bar'],
    };

    // test
    const newData = applyOperation(getAttributesFromElement, operationData);

    // expect
    expect(newData.attributeValues).toEqual({foo: 'fooValue', bar: 'barValue'});
  });
});
