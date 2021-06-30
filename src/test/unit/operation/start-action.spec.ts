import { expect } from 'chai';
import { IAction } from '../../../action/types';
import { TOperationData } from '../../../operation';
import { startAction } from '../../../operation/start-action';
import { applyOperation } from './apply-operation';

class MockAction {
  start(operationData: TOperationData) {
    return new Promise(resolve => {
      operationData.resolved = true;
      resolve(operationData);
    });
  }
}

describe('startAction', () => {
  it('should start the specified action', () => {
    // given

    const mockAction = (new MockAction() as any) as IAction;

    const operationData = {
      actionInstance: mockAction,
      actionOperationData: {
        prop: 'test',
      },
    };

    // test
    const promise = applyOperation<Promise<any>>(startAction, operationData);

    // expect
    promise.then(result => {
      expect(result.resolved).to.be.true;
      expect(result.prop).to.equal('test');
    });
    return promise;
  });
});
