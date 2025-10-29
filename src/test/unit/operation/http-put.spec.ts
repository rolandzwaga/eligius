import {expect} from 'chai';
import {beforeEach, describe, test, vi} from 'vitest';
import type {IEventbus} from '../../../eventbus/types.ts';
import {
  httpPut,
  type IHttpPutOperationData,
} from '../../../operation/http-put.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

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
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => mockResponse,
    });

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
    expect(result.response).to.deep.equal(mockResponse);
    expect(result.status).to.equal(200);
  });

  test('should throw error on HTTP error status', async () => {
    // Arrange
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

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

    expect(error).to.not.be.null;
    expect(error?.message).to.include('HTTP error 404');
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

    expect(error).to.not.be.null;
    expect(error?.message).to.include('url is required');
  });

  test('should erase url, body, and headers properties', async () => {
    // Arrange
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({success: true}),
    });

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
    expect('url' in operationData).to.be.false;
    expect('body' in operationData).to.be.false;
    expect('headers' in operationData).to.be.false;
  });
});
