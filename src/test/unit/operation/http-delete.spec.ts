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
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: {
        get: (name: string) =>
          name === 'content-type' ? 'application/json' : null,
      },
      json: async () => mockResponse,
    });

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
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      statusText: 'No Content',
      headers: {
        get: () => null,
      },
    });

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
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    });

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
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      headers: {get: () => null},
    });

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
});
