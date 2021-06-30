import { expect } from 'chai';
import { addGlobalsToOperation } from '../../../operation/add-globals-to-operation';
import { setGlobal } from '../../../operation/helper/set-global';
import { applyOperation } from './apply-operation';

describe('addGlobalsToOperation', () => {
  it('should add the given global properties to the given operation data', () => {
    setGlobal('test', 'testing');

    const operationData = {
      globalProperties: ['test'],
    };

    const newData: any = applyOperation(addGlobalsToOperation, operationData);

    expect(newData.test).to.equal('testing');
  });
});
