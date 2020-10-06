import { expect } from 'chai';
import loadJSON from '../../operation/loadJSON';

let result = null;
global.fetch = function () {
  return new Promise((resolve) => {
    resolve({
      body: result,
    });
  });
};

describe('loadJSON', () => {
  it('should load the specified json', () => {
    // given
    result = { test: true };
    const operationData = {
      url: '/test.json',
      cache: true,
    };

    // test
    const promise = loadJSON(operationData);

    // expect
    promise.then((newData) => {
      expect(newData.json).to.equal(result);
    });
    return promise;
  });

  it('should return the cached json the second time its called', () => {
    // given
    let oldResult = result;
    result = { test: false };
    const operationData = {
      url: '/test.json',
      cache: true,
    };

    // test
    const newData = loadJSON(operationData);

    // expect
    expect(newData.json).to.not.equal(result);
    expect(newData.json).to.equal(oldResult);
  });

  it('should assign the json to the given propertyName', () => {
    // given
    const operationData = {
      url: '/test.json',
      propertyName: 'testProperty',
      cache: true,
    };

    // test
    const newData = loadJSON(operationData);

    // expect
    expect(newData.testProperty.test).to.be.true;
  });
});
