import {expect, beforeEach, describe, test} from 'vitest';
import type {IEventbus} from '../../../eventbus/types.ts';
import {
  type ILoadFromStorageOperationData,
  loadFromStorage,
} from '../../../operation/load-from-storage.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

describe('loadFromStorage', () => {
  let mockEventbus: IEventbus;

  beforeEach(() => {
    mockEventbus = {
      broadcast: () => {},
    } as any;

    // Clear storage before each test
    localStorage.clear();
    sessionStorage.clear();
  });

  test('should load data from localStorage', () => {
    // Arrange
    localStorage.setItem('user-settings', '{"theme":"dark","language":"en"}');
    const operationData: ILoadFromStorageOperationData = {
      key: 'user-settings',
      storageType: 'local',
      loadedValue: undefined as any,
    };

    // Act
    const result = applyOperation(loadFromStorage, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.loadedValue).toEqual({theme: 'dark', language: 'en'});
  });

  test('should load data from sessionStorage', () => {
    // Arrange
    sessionStorage.setItem('session-data', '{"id":123}');
    const operationData: ILoadFromStorageOperationData = {
      key: 'session-data',
      storageType: 'session',
      loadedValue: undefined as any,
    };

    // Act
    const result = applyOperation(loadFromStorage, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.loadedValue).toEqual({id: 123});
  });

  test('should return null when key not found', () => {
    // Arrange
    const operationData: ILoadFromStorageOperationData = {
      key: 'nonexistent-key',
      storageType: 'local',
      loadedValue: undefined as any,
    };

    // Act
    const result = applyOperation(loadFromStorage, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.loadedValue).toBeNull();
  });

  test('should load string value', () => {
    // Arrange
    localStorage.setItem('simple-key', '"simple value"');
    const operationData: ILoadFromStorageOperationData = {
      key: 'simple-key',
      storageType: 'local',
      loadedValue: undefined as any,
    };

    // Act
    const result = applyOperation(loadFromStorage, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.loadedValue).toBe('simple value');
  });

  test('should load number value', () => {
    // Arrange
    localStorage.setItem('number-key', '42');
    const operationData: ILoadFromStorageOperationData = {
      key: 'number-key',
      storageType: 'local',
      loadedValue: undefined as any,
    };

    // Act
    const result = applyOperation(loadFromStorage, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(result.loadedValue).toBe(42);
  });

  test('should throw error if key not provided', () => {
    // Arrange
    const operationData: ILoadFromStorageOperationData = {
      key: '',
      storageType: 'local',
      loadedValue: undefined as any,
    };

    // Act & Assert
    expect(() => {
      applyOperation(loadFromStorage, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    }).toThrow('loadFromStorage: key is required');
  });

  test('should erase storageType property', () => {
    // Arrange
    localStorage.setItem('test-key', '"test-value"');
    const operationData: ILoadFromStorageOperationData = {
      key: 'test-key',
      storageType: 'local',
      loadedValue: undefined as any,
    };

    // Act
    applyOperation(loadFromStorage, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect('storageType' in operationData).toBe(false);
  });
});
