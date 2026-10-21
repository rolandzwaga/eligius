import {clearCache, loadJson} from '@operation/load-json.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {beforeEach, describe, expect, type TestContext, test, vi} from 'vitest';

function getResult(context: LoadJsonContext) {
  return () =>
    new Promise(resolve => {
      resolve(context.result);
    });
}

type LoadJsonContext = {
  result: any;
} & TestContext;

describe<LoadJsonContext>('loadJSON', () => {
  beforeEach<LoadJsonContext>(context => {
    context.result = {};
    vi.stubGlobal(
      'fetch',
      () =>
        new Promise(resolve => {
          resolve({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: getResult(context),
          } as any);
        })
    );
    clearCache();
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
    expect(newData.json).toEqual(context.result);
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
    expect(newData.json).toBe(context.result);
    context.result = {test: false};
    newData = await applyOperation(loadJson, {
      url: '/test.json',
      cache: true,
    });
    expect(newData.json).not.toEqual(context.result);
  });

  test<LoadJsonContext>('should remove the url and cache properties from the operation data', async context => {
    // given
    context.result = {test: true};
    const operationData = {
      url: '/test.json',
      cache: true,
    };

    // test
    let newData = await applyOperation(loadJson, operationData);

    // expect
    expect('url' in newData).toBe(false);
    expect('cache' in newData).toBe(false);
  });

  test('given fetch returns a 404 response with an HTML body, when loadJson runs, then it rejects with an error naming loadJson, the status and the url', async () => {
    // given
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('<html>not found</html>', {
          status: 404,
          statusText: 'Not Found',
        })
      )
    );

    // test + expect
    await expect(
      applyOperation(loadJson, {url: '/missing.json'})
    ).rejects.toThrow(
      new Error('loadJson: /missing.json responded 404 Not Found')
    );
  });

  test('given fetch returns an ok response with an invalid JSON body, when loadJson runs, then it rejects with an error naming loadJson and the url', async () => {
    // given
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('<html></html>', {status: 200}))
    );

    // test
    let error: Error | undefined;
    try {
      await applyOperation(loadJson, {url: '/broken.json'});
    } catch (e) {
      error = e as Error;
    }

    // expect
    expect(error?.message).toMatch(/^loadJson: \/broken\.json /);
    // fetch's Response lives in another realm, so compare by name
    expect((error?.cause as Error).name).toBe('SyntaxError');
  });

  test('given loadJson with cache true and a mutated json result, when loadJson is called again for the same url, then the second result is not affected by the mutation', async () => {
    // given
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(new Response(JSON.stringify({title: 'original'})))
      )
    );
    const first = await applyOperation(loadJson, {
      url: '/test.json',
      cache: true,
    });
    first.json.title = 'mutated';

    // test
    const second = await applyOperation(loadJson, {
      url: '/test.json',
      cache: true,
    });
    second.json.title = 'mutated again';
    const third = await applyOperation(loadJson, {
      url: '/test.json',
      cache: true,
    });

    // expect
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(second.json).not.toBe(first.json);
    expect(third.json).toEqual({title: 'original'});
  });

  test('given a cached falsy JSON value, when loadJson is called again with cache true, then the cached value is used instead of fetching again', async () => {
    // given
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('false')))
    );
    await applyOperation(loadJson, {url: '/flag.json', cache: true});

    // test
    const result = await applyOperation(loadJson, {
      url: '/flag.json',
      cache: true,
    });

    // expect
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result.json).toBe(false);
  });

  test('given fetch rejects, when loadJson runs, then it rejects with an error naming loadJson and the url and keeps the cause', async () => {
    // given
    const networkError = new TypeError('Failed to fetch');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(networkError));

    // test
    let error: Error | undefined;
    try {
      await applyOperation(loadJson, {url: '/offline.json'});
    } catch (e) {
      error = e as Error;
    }

    // expect
    expect(error?.message).toBe(
      'loadJson: /offline.json failed: Failed to fetch'
    );
    expect(error?.cause).toBe(networkError);
  });
});
