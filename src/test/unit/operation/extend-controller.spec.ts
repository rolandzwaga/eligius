import { expect } from 'chai';
import { suite } from 'uvu';
import { IController } from '../../../controllers/types';
import { extendController } from '../../../operation/extend-controller';
import { applyOperation } from '../../../util/apply-operation';

const ExtendControllerSuite = suite('extendController');

ExtendControllerSuite('should extend the given controller', () => {
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
  const newData = applyOperation<{
    controllerInstance: { prop1: string; prop2: string };
  }>(extendController, operationData);

  // expect
  expect(newData.controllerInstance.prop1).to.equal('prop1');
  expect(newData.controllerInstance.prop2).to.equal('prop2');
});

ExtendControllerSuite.run();
