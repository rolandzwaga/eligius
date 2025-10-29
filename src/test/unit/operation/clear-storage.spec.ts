import {expect} from 'chai';
import {beforeEach, describe, test} from 'vitest';
import type {IEventbus} from '../../../eventbus/types.ts';
import {
  clearStorage,
  type IClearStorageOperationData,
} from '../../../operation/clear-storage.ts';
import {applyOperation} from '../../../util/apply-operation.ts';

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
    expect(localStorage.getItem('key1')).to.be.null;
    expect(localStorage.getItem('key2')).to.equal('value2');
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
    expect(sessionStorage.getItem('session-key')).to.be.null;
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
    expect(localStorage.length).to.equal(0);
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
    expect(sessionStorage.length).to.equal(0);
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
    }).to.not.throw();
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
    expect('key' in operationData).to.be.false;
    expect('storageType' in operationData).to.be.false;
  });
});
