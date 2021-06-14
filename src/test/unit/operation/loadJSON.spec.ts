import { expect } from 'chai';
import { deepCopy } from '../../../operation/helper/deep-copy';
import { clearCache, loadJSON } from '../../../operation/load-json';

let result = null;

function getResult() {
  return new Promise(resolve => {
    resolve(result);
  });
}

describe('loadJSON', () => {
  let fetch;

  beforeAll(() => {
    fetch = window.fetch;
    window.fetch = function() {
      return new Promise(resolve => {
        resolve({
          json: getResult,
        } as any);
      });
    };
  });

  beforeEach(() => {
    clearCache();
  });

  afterAll(() => {
    window.fetch = fetch;
  });

  it('should load the specified json', async () => {
    // given
    result = { test: true };
    const operationData = {
      url: '/test.json',
      cache: true,
    };

    // test
    const newData = await loadJSON(operationData, {} as any);

    // expect
    expect(newData.json).to.equal(result);
  });

  it('should return the cached json the second time its called', async () => {
    // given
    result = { test: true };
    const operationData = {
      url: '/test.json',
      cache: true,
    };

    // test
    let newData: any = await loadJSON(deepCopy(operationData), {} as any);

    // expect
    expect(newData.json).to.equal(result);
    result = { test: false };
    newData = await loadJSON(operationData, {} as any);
    expect(newData.json).to.not.equal(result);
  });

  it('should assign the json to the given propertyName', async () => {
    // given
    result = { test: true };
    const operationData = {
      url: '/test.json',
      propertyName: 'testProperty',
      cache: true,
    };
    await loadJSON(deepCopy(operationData), {} as any);

    // test
    const newData: any = await loadJSON(operationData, {} as any);

    // expect
    expect(newData.testProperty.test).to.be.true;
  });
});
