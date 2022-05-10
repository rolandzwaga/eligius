import { expect } from 'chai';
import { suite } from 'uvu';
import { IAction } from '../../../action/types';
import { TOperationData } from '../../../operation';
import { startAction } from '../../../operation/start-action';
import { applyOperation } from '../../../util/apply-operation';

class MockAction {
  start(operationData: TOperationData) {
    return new Promise((resolve) => {
      operationData.resolved = true;
      resolve(operationData);
    });
  }
}

const StartActionSuite = suite('startAction');

StartActionSuite('should start the specified action', async () => {
  // given
  const mockAction = new MockAction() as unknown as IAction;

  const operationData = {
    actionInstance: mockAction,
    actionOperationData: {
      prop: 'test',
    },
  };

  // test
  const result = await applyOperation<Promise<any>>(startAction, operationData);

  // expect
  expect(result.resolved).to.be.true;
  expect(result.prop).to.be.undefined;
  return result;
});

StartActionSuite.run();
