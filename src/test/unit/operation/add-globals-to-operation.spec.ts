import { expect } from 'chai';
import { describe, test } from 'vitest';
import { addGlobalsToOperation } from '../../../operation/add-globals-to-operation.ts';
import { setGlobal } from '../../../operation/helper/set-global.ts';
import { applyOperation } from '../../../util/apply-operation.ts';
describe('addGlobalsToOperation', () => {
  test('should add the given global properties to the given operation data', () => {
    setGlobal('test', 'testing');

    const operationData = {
      globalProperties: ['test'],
    };

    const newData: any = applyOperation(addGlobalsToOperation, operationData);

    expect(newData.test).to.equal('testing');
  });
});
