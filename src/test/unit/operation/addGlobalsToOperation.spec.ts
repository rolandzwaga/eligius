import { expect } from 'chai';
import { addGlobalsToOperation } from '../operation/add-globals-to-operation';
import { setGlobal } from '../operation/helper/set-global';

describe('addGlobalsToOperation', () => {
  it('should add the given gloabl properties to the given operation data', () => {
    setGlobal('test', 'testing');
    let operationData = {
      globalProperties: ['test'],
    };
    const newData: any = addGlobalsToOperation(operationData, {} as any);
    expect(newData.test).to.equal('testing');
  });
});
