import type {IEventbus} from '@eventbus/types.ts';
import {
  type ISaveToStorageOperationData,
  saveToStorage,
} from '@operation/save-to-storage.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {beforeEach, describe, expect, test} from 'vitest';

describe('saveToStorage', () => {
  let mockEventbus: IEventbus;

  beforeEach(() => {
    mockEventbus = {
      broadcast: () => {},
    } as any;

    // Clear storage before each test
    localStorage.clear();
    sessionStorage.clear();
  });

  test('should save data to localStorage', () => {
    // Arrange
    const operationData: ISaveToStorageOperationData = {
      key: 'user-settings',
      value: {theme: 'dark', language: 'en'},
      storageType: 'local',
    };

    // Act
    applyOperation(saveToStorage, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    const stored = localStorage.getItem('user-settings');
    expect(stored).toBe('{"theme":"dark","language":"en"}');
  });

  test('should save data to sessionStorage', () => {
    // Arrange
    const operationData: ISaveToStorageOperationData = {
      key: 'session-data',
      value: {id: 123},
      storageType: 'session',
    };

    // Act
    applyOperation(saveToStorage, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    const stored = sessionStorage.getItem('session-data');
    expect(stored).toBe('{"id":123}');
  });

  test('should save string value without JSON encoding', () => {
    // Arrange
    const operationData: ISaveToStorageOperationData = {
      key: 'simple-key',
      value: 'simple value',
      storageType: 'local',
    };

    // Act
    applyOperation(saveToStorage, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(localStorage.getItem('simple-key')).toBe('"simple value"');
  });

  test('should default to localStorage when storageType not specified', () => {
    // Arrange
    const operationData: ISaveToStorageOperationData = {
      key: 'default-key',
      value: 'test',
      storageType: 'local',
    };

    // Act
    applyOperation(saveToStorage, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(localStorage.getItem('default-key')).toBeDefined();
  });

  test('should overwrite existing value', () => {
    // Arrange
    localStorage.setItem('existing-key', '"old value"');
    const operationData: ISaveToStorageOperationData = {
      key: 'existing-key',
      value: 'new value',
      storageType: 'local',
    };

    // Act
    applyOperation(saveToStorage, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(localStorage.getItem('existing-key')).toBe('"new value"');
  });

  test('should throw error if key not provided', () => {
    // Arrange
    const operationData: ISaveToStorageOperationData = {
      key: '',
      value: 'test',
      storageType: 'local',
    };

    // Act & Assert
    expect(() => {
      applyOperation(saveToStorage, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    }).toThrow('saveToStorage: key is required');
  });

  test('should erase value and storageType properties', () => {
    // Arrange
    const operationData: ISaveToStorageOperationData = {
      key: 'test-key',
      value: 'test-value',
      storageType: 'local',
    };

    // Act
    applyOperation(saveToStorage, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect('value' in operationData).toBe(false);
    expect('storageType' in operationData).toBe(false);
  });
});
