import { expect } from 'chai';
import { IAction } from '../../../action/types';
import { startAction } from '../../../operation/start-action';

class MockAction {
  start(operationData) {
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
    const promise = startAction(operationData, {} as any) as Promise<any>;

    // expect
    promise.then(result => {
      expect(result.resolved).to.be.true;
      expect(result.prop).to.equal('test');
    });
    return promise;
  });
});
