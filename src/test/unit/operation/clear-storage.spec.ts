import type {IEventbus} from '@eventbus/types.ts';
import {
  clearStorage,
  type IClearStorageOperationData,
} from '@operation/clear-storage.ts';
import {applyOperation} from '@util/apply-operation.ts';
import {beforeEach, describe, expect, test} from 'vitest';

describe('clearStorage', () => {
  let mockEventbus: IEventbus;

  beforeEach(() => {
    mockEventbus = {
      broadcast: () => {},
    } as any;

    // Clear storage before each test
    localStorage.clear();
    sessionStorage.clear();
  });

  test('should clear specific key from localStorage', () => {
    // Arrange
    localStorage.setItem('key1', 'value1');
    localStorage.setItem('key2', 'value2');
    const operationData: IClearStorageOperationData = {
      key: 'key1',
      storageType: 'local',
    };

    // Act
    applyOperation(clearStorage, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(localStorage.getItem('key1')).toBeNull();
    expect(localStorage.getItem('key2')).toBe('value2');
  });

  test('should clear specific key from sessionStorage', () => {
    // Arrange
    sessionStorage.setItem('session-key', 'session-value');
    const operationData: IClearStorageOperationData = {
      key: 'session-key',
      storageType: 'session',
    };

    // Act
    applyOperation(clearStorage, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(sessionStorage.getItem('session-key')).toBeNull();
  });

  test('should clear all localStorage when key not provided', () => {
    // Arrange
    localStorage.setItem('key1', 'value1');
    localStorage.setItem('key2', 'value2');
    const operationData: IClearStorageOperationData = {
      storageType: 'local',
    };

    // Act
    applyOperation(clearStorage, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(localStorage.length).toBe(0);
  });

  test('should clear all sessionStorage when key not provided', () => {
    // Arrange
    sessionStorage.setItem('key1', 'value1');
    sessionStorage.setItem('key2', 'value2');
    const operationData: IClearStorageOperationData = {
      storageType: 'session',
    };

    // Act
    applyOperation(clearStorage, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect(sessionStorage.length).toBe(0);
  });

  test('should not throw error when clearing nonexistent key', () => {
    // Arrange
    const operationData: IClearStorageOperationData = {
      key: 'nonexistent-key',
      storageType: 'local',
    };

    // Act & Assert
    expect(() => {
      applyOperation(clearStorage, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    }).not.toThrow();
  });

  test('should erase key and storageType properties', () => {
    // Arrange
    localStorage.setItem('test-key', 'test-value');
    const operationData: IClearStorageOperationData = {
      key: 'test-key',
      storageType: 'local',
    };

    // Act
    applyOperation(clearStorage, operationData, {
      currentIndex: 0,
      eventbus: mockEventbus,
      operations: [],
    });

    // Assert
    expect('key' in operationData).toBe(false);
    expect('storageType' in operationData).toBe(false);
  });

  test.each([
    ['empty', ''],
    ['whitespace', '   '],
  ])(
    'given localStorage holds two keys, when clearStorage is called with an %s key, then it throws and both keys remain',
    (_label, key) => {
      // given
      localStorage.setItem('a', '1');
      localStorage.setItem('b', '2');
      const operationData: IClearStorageOperationData = {
        key,
        storageType: 'local',
      };

      // test + expect
      expect(() => {
        applyOperation(clearStorage, operationData, {
          currentIndex: 0,
          eventbus: mockEventbus,
          operations: [],
        });
      }).toThrow('clearStorage: key must be a non-empty string');
      expect(localStorage.getItem('a')).toBe('1');
      expect(localStorage.getItem('b')).toBe('2');
    }
  );

  test('given a null key, when clearStorage is called, then it throws instead of clearing all storage', () => {
    // given
    localStorage.setItem('a', '1');
    const operationData = {
      key: null,
      storageType: 'local',
    } as any as IClearStorageOperationData;

    // test + expect
    expect(() => {
      applyOperation(clearStorage, operationData, {
        currentIndex: 0,
        eventbus: mockEventbus,
        operations: [],
      });
    }).toThrow('clearStorage: key must be a non-empty string');
    expect(localStorage.getItem('a')).toBe('1');
  });
});
