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

  test('given no storageType, when saveToStorage runs, then the value is written to localStorage and not to sessionStorage', () => {
    // Arrange
    const operationData = {
      key: 'default-key',
      value: 'test',
    } as ISaveToStorageOperationData;

    // Act
    applyOperation(saveToStorage, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(localStorage.getItem('default-key')).toBe('"test"');
    expect(sessionStorage.getItem('default-key')).toBeNull();
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

  test('given saveToStorage with key, value and storageType, when the operation runs, then the returned operation data has no key property', () => {
    // Arrange
    const operationData: ISaveToStorageOperationData = {
      key: 'a',
      value: 1,
      storageType: 'local',
    };

    // Act
    const result = applyOperation(saveToStorage, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect('key' in result).toBe(false);
    expect(localStorage.getItem('a')).toBe('1');
  });

  const scope = () => ({
    currentIndex: 0,
    eventbus: mockEventbus,
    operations: [],
  });

  test("given saveToStorage with value resolved from a missing $operationdata chain, when it runs and loadFromStorage reads the same key, then saveToStorage throws 'value is required' instead of storing 'undefined' that loadFromStorage cannot parse", () => {
    // Arrange
    const operationData: ISaveToStorageOperationData = {
      key: 'k',
      value: undefined,
      storageType: 'local',
    };

    // Act & Assert
    expect(() => applyOperation(saveToStorage, operationData, scope())).toThrow(
      'saveToStorage: value is required (key "k")'
    );
    expect(localStorage.getItem('k')).toBeNull();
  });

  test('given a null value, when saveToStorage runs, then null is stored as JSON', () => {
    applyOperation(
      saveToStorage,
      {key: 'k', value: null, storageType: 'session'},
      scope()
    );

    expect(sessionStorage.getItem('k')).toBe('null');
  });

  test("given storageType 'Session', when saveToStorage runs, then it throws instead of writing to localStorage", () => {
    // Arrange
    const operationData = {
      key: 'k',
      value: 1,
      storageType: 'Session' as any,
    };

    // Act & Assert
    expect(() => applyOperation(saveToStorage, operationData, scope())).toThrow(
      `saveToStorage: storageType must be 'local' or 'session', got "Session"`
    );
    expect(localStorage.getItem('k')).toBeNull();
  });
});
