import { expect } from 'chai';
import { suite } from 'uvu';
import { clearCache, loadJSON } from '../../../operation/load-json';
import { applyOperation } from '../../../util/apply-operation';

function getResult(context: Context) {
  return () =>
    new Promise((resolve) => {
      resolve(context.result);
    });
}

interface Context {
  fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
  result: any;
}

const LoadJSONSuite = suite<Context>('loadJSON');

LoadJSONSuite.before((context) => {
  context.fetch = global.fetch;
  context.result = {};
  global.fetch = function () {
    return new Promise((resolve) => {
      resolve({
        json: getResult(context),
      } as any);
    });
  };
});

LoadJSONSuite.before.each(() => {
  clearCache();
});

LoadJSONSuite.after((context) => {
  (global as any).fetch = context.fetch;
});

LoadJSONSuite('should load the specified json', async (context) => {
  // given
  context.result = { test: true };
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
  expect(newData.json).to.equal(context.result);
});

LoadJSONSuite(
  'should return the cached json the second time its called',
  async (context) => {
    // given
    context.result = { test: true };
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
    expect(newData.json).to.equal(context.result);
    context.result = { test: false };
    newData = await applyOperation<Promise<{ json: any }>>(
      loadJSON,
      operationData
    );
    expect(newData.json).to.not.equal(context.result);
  }
);

LoadJSONSuite.run();
