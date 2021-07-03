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
  it('should start the specified action', async done => {
    // given

    const mockAction = (new MockAction() as unknown) as IAction;

    const operationData = {
      actionInstance: mockAction,
      actionOperationData: {
        prop: 'test',
      },
    };

    // test
    const result = await applyOperation<Promise<any>>(
      startAction,
      operationData
    );

    // expect
    expect(result.resolved).to.be.true;
    expect(result.prop).to.be.undefined;
    done();
  });
});
