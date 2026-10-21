import type {IEventbus} from '@eventbus/types.ts';
import {httpPut, type IHttpPutOperationData} from '@operation/http-put.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {beforeEach, describe, expect, test, vi} from 'vitest';

describe('httpPut', () => {
  let mockEventbus: IEventbus;

  beforeEach(() => {
    mockEventbus = {
      broadcast: () => {},
    } as any;
    vi.unstubAllGlobals();
  });

  test('should perform PUT request successfully', async () => {
    // Arrange
    const mockResponse = {id: 123, name: 'John Updated'};
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          statusText: 'OK',
          headers: {'content-type': 'application/json'},
        })
      )
    );

    const operationData: IHttpPutOperationData = {
      url: 'https://api.example.com/users/123',
      body: {name: 'John Updated'},
      response: null as any,
      status: 0,
    };

    // Act
    const result = await applyOperation(httpPut, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.response).toEqual(mockResponse);
    expect(result.status).toBe(200);
  });

  test('should throw error on HTTP error status', async () => {
    // Arrange
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })
    );

    const operationData: IHttpPutOperationData = {
      url: 'https://api.example.com/users/999',
      body: {},
      response: null as any,
      status: 0,
    };

    // Act & Assert
    let error: Error | null = null;
    try {
      await applyOperation(httpPut, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    } catch (e) {
      error = e as Error;
    }

    expect(error).not.toBeNull();
    expect(error?.message).toContain('HTTP error 404');
  });

  test('should throw error if url not provided', async () => {
    // Arrange
    const operationData: IHttpPutOperationData = {
      url: '',
      response: null as any,
      status: 0,
    };

    // Act & Assert
    let error: Error | null = null;
    try {
      await applyOperation(httpPut, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    } catch (e) {
      error = e as Error;
    }

    expect(error).not.toBeNull();
    expect(error?.message).toContain('url is required');
  });

  test('should erase url, body, and headers properties', async () => {
    // Arrange
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({success: true}), {status: 200})
        )
    );

    const operationData: IHttpPutOperationData = {
      url: 'https://api.example.com/test',
      body: {test: 'data'},
      headers: {'Test-Header': 'value'},
      response: null as any,
      status: 0,
    };

    // Act
    await applyOperation(httpPut, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect('url' in operationData).toBe(false);
    expect('body' in operationData).toBe(false);
    expect('headers' in operationData).toBe(false);
  });

  test('given a PUT endpoint that responds 204 No Content with an empty body, when httpPut runs, then it resolves with status 204 and response null', async () => {
    // given
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(null, {status: 204, statusText: 'No Content'})
        )
    );
    const operationData: IHttpPutOperationData = {
      url: 'https://api.example.com/users/123',
      body: {name: 'John'},
      response: undefined as any,
      status: 0,
    };

    // test
    const result = await applyOperation(httpPut, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // expect
    expect(result.status).toBe(204);
    expect(result.response).toBeNull();
  });

  test('given a PUT endpoint that responds 200 with an empty body, when httpPut runs, then it resolves with response null', async () => {
    // given
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('', {status: 200}))
    );
    const operationData: IHttpPutOperationData = {
      url: 'https://api.example.com/users/123',
      body: {name: 'John'},
      response: undefined as any,
      status: 0,
    };

    // test
    const result = await applyOperation(httpPut, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // expect
    expect(result.status).toBe(200);
    expect(result.response).toBeNull();
  });

  test('given fetch resolves with an error status, when httpPut runs, then the error message carries a single operation prefix', async () => {
    // given
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response('nope', {status: 400, statusText: 'Bad Request'})
        )
    );
    const operationData: IHttpPutOperationData = {
      url: 'https://api.example.com/users',
      body: {},
      response: undefined as any,
      status: 0,
    };

    // test + expect
    await expect(
      applyOperation(httpPut, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      })
    ).rejects.toThrow(new Error('httpPut: HTTP error 400 Bad Request'));
  });

  test('given fetch rejects, when httpPut runs, then it rethrows with the operation name and keeps the original error as cause', async () => {
    // given
    const networkError = new TypeError('Failed to fetch');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(networkError));
    const operationData: IHttpPutOperationData = {
      url: 'https://api.example.com/users',
      body: {},
      response: undefined as any,
      status: 0,
    };

    // test
    let error: Error | undefined;
    try {
      await applyOperation(httpPut, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    } catch (e) {
      error = e as Error;
    }

    // expect
    expect(error?.message).toBe('httpPut: Failed to fetch');
    expect(error?.cause).toBe(networkError);
  });

  test('given a response body that is not valid JSON, when httpPut runs, then it throws an error naming the operation with the parse error as cause', async () => {
    // given
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('<html></html>', {status: 200}))
    );
    const operationData: IHttpPutOperationData = {
      url: 'https://api.example.com/users',
      body: {},
      response: undefined as any,
      status: 0,
    };

    // test
    let error: Error | undefined;
    try {
      await applyOperation(httpPut, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    } catch (e) {
      error = e as Error;
    }

    // expect
    expect(error?.message).toMatch(/^httpPut: invalid JSON response/);
    expect(error?.cause).toBeInstanceOf(SyntaxError);
  });

  describe('request headers and body', () => {
    async function send(body: unknown, headers?: Record<string, string>) {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(new Response(null, {status: 204}));
      vi.stubGlobal('fetch', fetchMock);
      await applyOperation(
        httpPut,
        {
          url: 'https://api.example.com/users/1',
          body,
          headers,
          response: null,
          status: 0,
        },
        {currentIndex: 0, eventbus: mockEventbus, operations: []}
      );
      const init = fetchMock.mock.calls[0][1] as RequestInit;
      return {headers: new Headers(init.headers), body: init.body, init};
    }

    test("given headers {'content-type': 'application/json'} in lowercase, when httpPut is called, then the request sent to fetch has a single Content-Type value 'application/json'", async () => {
      const {headers} = await send(
        {name: 'John'},
        {'content-type': 'application/json'}
      );

      expect(headers.get('Content-Type')).toBe('application/json');
    });

    test('given no headers, when httpPut is called, then Content-Type defaults to application/json and the body is JSON', async () => {
      const {headers, body, init} = await send({name: 'John'});

      expect(init.method).toBe('PUT');
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(body).toBe('{"name":"John"}');
    });

    test("given a string body and headers {'content-type': 'text/plain'}, when httpPut is called, then the body is sent as is with a single text/plain Content-Type", async () => {
      const {headers, body} = await send('hello', {
        'content-type': 'text/plain',
      });

      expect(headers.get('Content-Type')).toBe('text/plain');
      expect(body).toBe('hello');
    });

    test('given a string body without headers, when httpPut is called, then it is JSON encoded', async () => {
      const {body} = await send('hello');

      expect(body).toBe('"hello"');
    });
  });
});
