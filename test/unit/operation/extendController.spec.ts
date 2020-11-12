import { expect } from 'chai';
import { IController } from '~/controllers/types';
import { extendController } from '~/operation/extend-controller';

describe('extendController', () => {
  it('should extend the given controller', () => {
    // given
    const operationData = {
      controllerInstance: ({
        prop1: 'prop1',
      } as any) as IController<any>,
      controllerExtension: {
        prop2: 'prop2',
      },
    };

    // test
    const newData: any = extendController(operationData, {} as any);

    // expect
    expect(newData.controllerInstance.prop1).to.equal('prop1');
    expect(newData.controllerInstance.prop2).to.equal('prop2');
  });
});
