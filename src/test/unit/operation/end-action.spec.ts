import { expect } from 'chai';
import { suite } from 'uvu';
import { TOperation } from '../../../operation';
import { endAction } from '../../../operation/end-action';
import { applyOperation } from '../../../util/apply-operation';

class MockAction {
  end(operationData: TOperation) {
    return new Promise((resolve) => {
      resolve(operationData);
    });
  }
}

const EndActionSuite = suite('endAction');

EndActionSuite(
  'should call the end() method on the given action with the given operationdata',
  async () => {
    // given
    const mockAction = new MockAction();

    const operationData = {
      actionInstance: mockAction,
      actionOperationData: {
        test: true,
      },
    };

    // test
    const result = await applyOperation<Promise<typeof operationData>>(
      endAction,
      operationData
    );

    expect(result).to.eql(operationData);
  }
);

EndActionSuite.run();
