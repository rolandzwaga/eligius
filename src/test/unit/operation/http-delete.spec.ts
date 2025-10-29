import {expect} from 'chai';
import {beforeEach, describe, test, vi} from 'vitest';
import type {IEventbus} from '../../../eventbus/types.ts';
import {
  httpDelete,
  type IHttpDeleteOperationData,
} from '../../../operation/http-delete.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

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
    expect(result.response).to.deep.equal(mockResponse);
    expect(result.status).to.equal(200);
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
    expect(result.response).to.be.null;
    expect(result.status).to.equal(204);
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

    expect(error).to.not.be.null;
    expect(error?.message).to.include('HTTP error 403');
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

    expect(error).to.not.be.null;
    expect(error?.message).to.include('url is required');
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
    expect('url' in operationData).to.be.false;
    expect('headers' in operationData).to.be.false;
  });
});
