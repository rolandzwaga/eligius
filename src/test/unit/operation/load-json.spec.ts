import {expect} from 'chai';
import {afterEach, beforeEach, describe, type TestContext, test} from 'vitest';
import {clearCache, loadJson} from '../../../operation/load-json.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

function getResult(context: LoadJsonContext) {
  return () =>
    new Promise(resolve => {
      resolve(context.result);
    });
}

type LoadJsonContext = {
  fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
  result: any;
} & TestContext;

describe<LoadJsonContext>('loadJSON', () => {
  beforeEach<LoadJsonContext>(context => {
    context.fetch = global.fetch;
    context.result = {};
    global.fetch = () =>
      new Promise(resolve => {
        resolve({
          json: getResult(context),
        } as any);
      });
    clearCache();
  });
  afterEach<LoadJsonContext>(context => {
    (global as any).fetch = context.fetch;
  });
  test<LoadJsonContext>('should load the specified json', async context => {
    // given
    context.result = {test: true};
    const operationData = {
      url: '/test.json',
      cache: true,
    };

    // test
    const newData = await applyOperation(loadJson, operationData);

    // expect
    expect(newData.json).to.eql(context.result);
  });
  test<LoadJsonContext>('should return the cached json the second time its called', async context => {
    // given
    context.result = {test: true};
    const operationData = {
      url: '/test.json',
      cache: true,
    };

    // test
    let newData = await applyOperation(loadJson, operationData);

    // expect
    expect(newData.json).to.equal(context.result);
    context.result = {test: false};
    newData = await applyOperation(loadJson, operationData);
    expect(newData.json).to.not.eql(context.result);
  });
});
