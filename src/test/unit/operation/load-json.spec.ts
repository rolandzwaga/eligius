/**
 * @jest-environment jsdom
 */

import { expect } from 'chai';
import { clearCache, loadJSON } from '../../../operation/load-json';
import { applyOperation } from './apply-operation';

let result: any = null;

function getResult() {
  return new Promise((resolve) => {
    resolve(result);
  });
}

describe('loadJSON', () => {
  let fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;

  beforeAll(() => {
    fetch = window.fetch;
    window.fetch = function () {
      return new Promise((resolve) => {
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
    const newData = await applyOperation<Promise<{ json: any }>>(
      loadJSON,
      operationData
    );

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
    let newData = await applyOperation<Promise<{ json: any }>>(
      loadJSON,
      operationData
    );

    // expect
    expect(newData.json).to.equal(result);
    result = { test: false };
    newData = await applyOperation<Promise<{ json: any }>>(
      loadJSON,
      operationData
    );
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
    await applyOperation<Promise<{ json: any }>>(loadJSON, operationData);

    // test
    const newData = await applyOperation<
      Promise<{ testProperty: { test: boolean } }>
    >(loadJSON, operationData);

    // expect
    expect(newData.testProperty.test).to.be.true;
  });
});
