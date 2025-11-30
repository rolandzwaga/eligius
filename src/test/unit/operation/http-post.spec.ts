import {expect, beforeEach, describe, test, vi} from 'vitest';
import type {IEventbus} from '../../../eventbus/types.ts';
import {
  httpPost,
  type IHttpPostOperationData,
} from '../../../operation/http-post.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

describe('httpPost', () => {
  let mockEventbus: IEventbus;

  beforeEach(() => {
    mockEventbus = {
      broadcast: () => {},
    } as any;
    vi.unstubAllGlobals();
  });

  test('should perform POST request successfully', async () => {
    // Arrange
    const mockResponse = {id: 123, name: 'John'};
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      statusText: 'Created',
      json: async () => mockResponse,
    });

    const operationData: IHttpPostOperationData = {
      url: 'https://api.example.com/users',
      body: {name: 'John', email: 'john@example.com'},
      headers: {'Custom-Header': 'value'},
      response: null as any,
      status: 0,
    };

    // Act
    const result = await applyOperation(httpPost, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.response).toEqual(mockResponse);
    expect(result.status).toBe(201);
  });

  test('should throw error on HTTP error status', async () => {
    // Arrange
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
    });

    const operationData: IHttpPostOperationData = {
      url: 'https://api.example.com/users',
      body: {},
      response: null as any,
      status: 0,
    };

    // Act & Assert
    let error: Error | null = null;
    try {
      await applyOperation(httpPost, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    } catch (e) {
      error = e as Error;
    }

    expect(error).not.toBeNull();
    expect(error?.message).toContain('HTTP error 400');
  });

  test('should throw error if url not provided', async () => {
    // Arrange
    const operationData: IHttpPostOperationData = {
      url: '',
      response: null as any,
      status: 0,
    };

    // Act & Assert
    let error: Error | null = null;
    try {
      await applyOperation(httpPost, operationData, {
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
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({success: true}),
    });

    const operationData: IHttpPostOperationData = {
      url: 'https://api.example.com/test',
      body: {test: 'data'},
      headers: {'Test-Header': 'value'},
      response: null as any,
      status: 0,
    };

    // Act
    await applyOperation(httpPost, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect('url' in operationData).toBe(false);
    expect('body' in operationData).toBe(false);
    expect('headers' in operationData).toBe(false);
  });
});
