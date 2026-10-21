import type {IEventbus} from '@eventbus/types.ts';
import {
  httpDelete,
  type IHttpDeleteOperationData,
} from '@operation/http-delete.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {beforeEach, describe, expect, test, vi} from 'vitest';

describe('httpDelete', () => {
  let mockEventbus: IEventbus;

  beforeEach(() => {
    mockEventbus = {
      broadcast: () => {},
    } as any;
    vi.unstubAllGlobals();
  });

  test('should perform DELETE request with JSON response', async () => {
    // Arrange
    const mockResponse = {success: true};
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

    const operationData: IHttpDeleteOperationData = {
      url: 'https://api.example.com/users/123',
      response: undefined as any,
      status: 0,
    };

    // Act
    const result = await applyOperation(httpDelete, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.response).toEqual(mockResponse);
    expect(result.status).toBe(200);
  });

  test('should handle DELETE request with no content (204)', async () => {
    // Arrange
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        statusText: 'No Content',
        headers: {
          get: () => null,
        },
      })
    );

    const operationData: IHttpDeleteOperationData = {
      url: 'https://api.example.com/users/123',
      response: undefined as any,
      status: 0,
    };

    // Act
    const result = await applyOperation(httpDelete, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.response).toBeNull();
    expect(result.status).toBe(204);
  });

  test('should throw error on HTTP error status', async () => {
    // Arrange
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      })
    );

    const operationData: IHttpDeleteOperationData = {
      url: 'https://api.example.com/users/123',
      response: undefined as any,
      status: 0,
    };

    // Act & Assert
    let error: Error | null = null;
    try {
      await applyOperation(httpDelete, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    } catch (e) {
      error = e as Error;
    }

    expect(error).not.toBeNull();
    expect(error?.message).toContain('HTTP error 403');
  });

  test('should throw error if url not provided', async () => {
    // Arrange
    const operationData: IHttpDeleteOperationData = {
      url: '',
      response: undefined as any,
      status: 0,
    };

    // Act & Assert
    let error: Error | null = null;
    try {
      await applyOperation(httpDelete, operationData, {
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

  test('should erase url and headers properties', async () => {
    // Arrange
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        headers: {get: () => null},
      })
    );

    const operationData: IHttpDeleteOperationData = {
      url: 'https://api.example.com/test',
      headers: {Authorization: 'Bearer token'},
      response: undefined as any,
      status: 0,
    };

    // Act
    await applyOperation(httpDelete, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect('url' in operationData).toBe(false);
    expect('headers' in operationData).toBe(false);
  });

  test('given fetch resolves with status 403 Forbidden, when httpDelete is called, then the error message has a single operation prefix', async () => {
    // given
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(null, {status: 403, statusText: 'Forbidden'})
        )
    );
    const operationData: IHttpDeleteOperationData = {
      url: 'https://api.example.com/users/123',
      response: undefined as any,
      status: 0,
    };

    // test + expect
    await expect(
      applyOperation(httpDelete, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      })
    ).rejects.toThrow(new Error('httpDelete: HTTP error 403 Forbidden'));
  });

  test('given fetch rejects, when httpDelete runs, then it rethrows with the operation name and keeps the original error as cause', async () => {
    // given
    const abortError = new DOMException(
      'The operation was aborted.',
      'AbortError'
    );
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError));
    const operationData: IHttpDeleteOperationData = {
      url: 'https://api.example.com/users/123',
      response: undefined as any,
      status: 0,
    };

    // test
    let error: Error | undefined;
    try {
      await applyOperation(httpDelete, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    } catch (e) {
      error = e as Error;
    }

    // expect
    expect(error?.message).toBe('httpDelete: The operation was aborted.');
    expect(error?.cause).toBe(abortError);
  });

  test('given a JSON content type with an empty body, when httpDelete runs, then it resolves with response null', async () => {
    // given
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('', {
          status: 200,
          headers: {'content-type': 'application/json'},
        })
      )
    );
    const operationData: IHttpDeleteOperationData = {
      url: 'https://api.example.com/users/123',
      response: undefined as any,
      status: 0,
    };

    // test
    const result = await applyOperation(httpDelete, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // expect
    expect(result.status).toBe(200);
    expect(result.response).toBeNull();
  });
});
