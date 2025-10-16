import {expect} from 'chai';
import {describe, test} from 'vitest';
import type {IController} from '../../../controllers/types.ts';
import {extendController} from '../../../operation/extend-controller.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

describe('extendController', () => {
  test('should extend the given controller', () => {
    // given
    const operationData = {
      controllerInstance: {
        prop1: 'prop1',
      } as any as IController<any>,
      controllerExtension: {
        prop2: 'prop2',
      },
    };

    // test
    const newData = applyOperation(extendController, operationData);

    // expect
    expect((newData.controllerInstance as any).prop1).to.equal('prop1');
    expect((newData.controllerInstance as any).prop2).to.equal('prop2');
  });
});
